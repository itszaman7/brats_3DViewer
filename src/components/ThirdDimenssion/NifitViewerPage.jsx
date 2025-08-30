'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Niivue } from '@niivue/niivue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileImage, Brain, Eye, RotateCcw, Download, CheckCircle, AlertCircle, EyeOff, Cpu, Zap, Circle, FolderOpen, File } from 'lucide-react';
import { cn } from "@/lib/utils";
import { bratsAPI } from "@/services/api";

// Helper component to render the volume using Niivue
const NiftiVolume = ({ url, segmentationUrl, filename, segmentationFilename }) => {
  const canvasRef = useRef();
  const nvRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [is3D, setIs3D] = useState(false);
  const [showSegmentation, setShowSegmentation] = useState(true);
  const [tumorVisibility, setTumorVisibility] = useState({
    wholeTumor: true,    // Yellow - Edema (label 2)
    enhancing: true,     // Red - Enhancing tumor (label 4)  
    core: true          // Blue - Tumor core (label 1)
  });

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    const loadAndRender = async () => {
      try {
        setLoading(true);
        setError('');

        // Create Niivue instance with options
        const options = {
          backColor: [0.05, 0.05, 0.1, 1], // Deep dark blue background
          crosshairColor: [1, 0, 0, 1], // Red crosshair
          show3Dcrosshair: true,
          meshThicknessOn2D: 0.5,
          radiological: false,
          isColorbar: true
        };
        
        const nv = new Niivue(options);
        nvRef.current = nv;
        await nv.attachToCanvas(canvasRef.current);
        
        // Set canvas size constraints
        if (canvasRef.current) {
          const parent = canvasRef.current.parentElement;
          if (parent) {
            const rect = parent.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
          }
        }

        // Prepare volumes array
        const volumes = [];

        // Main volume
        volumes.push({
          url: url,
          colormap: "gray",
          name: filename || "brain_image.nii.gz" // Provide explicit filename
        });

                // Segmentation overlay (if provided) with BraTS color scheme
      if (segmentationUrl) {
          volumes.push({
            url: segmentationUrl,
            colormap: "warm", // Start with a visible colormap, we'll change it after loading
            opacity: 0.7,
            name: segmentationFilename || "segmentation.nii.gz"
          });
        }

        // Load volumes
        await nv.loadVolumes(volumes);
        
        // Set up BraTS-specific colormap for segmentation if present
        if (segmentationUrl && nv.volumes.length > 1) {
          const segVolume = nv.volumes[1];
          
          // Check if this is a multi-channel probability map (range 0-1 or similar)
          const isProbabilityMap = segVolume.global_max <= 5 && segVolume.global_min >= 0;
          
          if (isProbabilityMap) {
            // For multi-channel probability maps, use a continuous colormap
            // that can show probability values as colors
            console.log("Detected multi-channel probability segmentation");
            
            // Create a colormap that maps probability values to colors
            const probabilityColormap = {
              R: new Array(256).fill(0),
              G: new Array(256).fill(0), 
              B: new Array(256).fill(0),
              A: new Array(256).fill(0),
              I: Array.from({length: 256}, (_, i) => i)
            };
            
            // Fill the colormap with a gradient from transparent to colored
            for (let i = 0; i < 256; i++) {
              const intensity = i / 255;
              
              if (intensity < 0.1) {
                // Low values - transparent
                probabilityColormap.A[i] = 0;
              } else if (intensity < 0.4) {
                // Low-medium values - Blue (Tumor Core)
                probabilityColormap.R[i] = 0;
                probabilityColormap.G[i] = 0;
                probabilityColormap.B[i] = Math.floor(255 * intensity);
                probabilityColormap.A[i] = Math.floor(255 * intensity);
              } else if (intensity < 0.7) {
                // Medium values - Yellow (Whole Tumor) 
                probabilityColormap.R[i] = Math.floor(255 * intensity);
                probabilityColormap.G[i] = Math.floor(255 * intensity);
                probabilityColormap.B[i] = 0;
                probabilityColormap.A[i] = Math.floor(255 * intensity);
              } else {
                // High values - Red (Enhancing Tumor)
                probabilityColormap.R[i] = 255;
                probabilityColormap.G[i] = 0;
                probabilityColormap.B[i] = 0;
                probabilityColormap.A[i] = Math.floor(255 * intensity);
              }
            }
            
            // Add and apply the probability colormap
            nv.addColormap('BraTS_Probability', probabilityColormap);
            nv.setColormap(segVolume.id, 'BraTS_Probability');
            
            // Set intensity range for probability values
            segVolume.cal_min = 0;
            segVolume.cal_max = segVolume.global_max;
            
          } else {
            // Traditional label-based segmentation
            const bratsColormap = {
              R: new Array(256).fill(0),
              G: new Array(256).fill(0), 
              B: new Array(256).fill(0),
              A: new Array(256).fill(0),
              I: Array.from({length: 256}, (_, i) => i)
            };
            
            // Background (0) - transparent
            bratsColormap.A[0] = 0;
            
            // Label 1: Tumor Core - Blue
            bratsColormap.R[1] = 0; bratsColormap.G[1] = 0; bratsColormap.B[1] = 255; bratsColormap.A[1] = 255;
            
            // Label 2: Whole Tumor/Edema - Yellow  
            bratsColormap.R[2] = 255; bratsColormap.G[2] = 255; bratsColormap.B[2] = 0; bratsColormap.A[2] = 255;
            
            // Label 3: Enhancing Tumor - Green
            bratsColormap.R[3] = 0; bratsColormap.G[3] = 255; bratsColormap.B[3] = 0; bratsColormap.A[3] = 255;
            
            // Label 4: Enhancing Tumor - Red
            bratsColormap.R[4] = 255; bratsColormap.G[4] = 0; bratsColormap.B[4] = 0; bratsColormap.A[4] = 255;
            
            // Add and apply the label colormap
            nv.addColormap('BraTS_Labels', bratsColormap);
            nv.setColormap(segVolume.id, 'BraTS_Labels');
            
            // Set intensity range for discrete labels
            segVolume.cal_min = 0;
            segVolume.cal_max = Math.max(4, segVolume.global_max || 4);
          }
          
          // Ensure good opacity and force update
          nv.setOpacity(1, 0.9);
          nv.updateGLVolume();
          
          console.log("Segmentation setup complete:", {
            type: isProbabilityMap ? "Multi-channel Probability" : "Discrete Labels",
            dims: segVolume.dims,
            global_range: `${segVolume.global_min} - ${segVolume.global_max}`,
            display_range: `${segVolume.cal_min} - ${segVolume.cal_max}`,
            colormap: segVolume.colormap,
            opacity: segVolume.opacity
          });
        }
        
        setLoading(false);
        console.log("Successfully loaded NIfTI files with Niivue and BraTS colormap");

      } catch (error) {
        console.error("Error loading NIfTI files:", error);
        setError(error.message || "Failed to load NIfTI files");
      setLoading(false);
      }
    };

    loadAndRender();

  }, [url, segmentationUrl]);

  const toggle3D = () => {
    if (nvRef.current) {
      try {
        const newMode = !is3D;
        if (newMode) {
          // Switch to 3D volume rendering
          nvRef.current.setSliceType(nvRef.current.sliceTypeRender);
        } else {
          // Switch back to multi-planar view
          nvRef.current.setSliceType(nvRef.current.sliceTypeMultiplanar);
        }
        setIs3D(newMode);
      } catch (e) {
        console.log("Toggle 3D error:", e);
        // Try alternative method
        try {
          nvRef.current.opts.isRadiological = !nvRef.current.opts.isRadiological;
          nvRef.current.drawScene();
        } catch (e2) {
          console.log("Alternative toggle failed:", e2);
        }
      }
    }
  };

  const toggleSegmentation = () => {
    if (nvRef.current && nvRef.current.volumes.length > 1) {
      const newVisibility = !showSegmentation;
      setShowSegmentation(newVisibility);
      
      if (newVisibility) {
        // Restore all tumor types visibility and regenerate colormap
        const allVisible = { wholeTumor: true, enhancing: true, core: true };
        setTumorVisibility(allVisible);
        
        // Regenerate the blended colormap with all regions visible
        generateBlendedColormap(allVisible);
        
        // Set good opacity
        nvRef.current.setOpacity(1, 0.8);
      } else {
        // Hide segmentation completely
        nvRef.current.setOpacity(1, 0);
      }
    }
  };

  const generateBlendedColormap = (visibility) => {
    if (!nvRef.current || nvRef.current.volumes.length <= 1) return;
    
    // For multi-channel probability maps, create a blended colormap that combines visible regions
    const blendedColormap = {
      R: new Array(256).fill(0),
      G: new Array(256).fill(0), 
      B: new Array(256).fill(0),
      A: new Array(256).fill(0),
      I: Array.from({length: 256}, (_, i) => i)
    };
    
    // Create a continuous colormap that blends multiple tumor types
    for (let i = 0; i < 256; i++) {
      const intensity = i / 255;
      
      if (intensity < 0.1) {
        // Very low values - transparent
        blendedColormap.A[i] = 0;
      } else {
        // Initialize color components
        let r = 0, g = 0, b = 0, a = 0;
        let activeRegions = 0;
        
        // Add colors for each visible tumor type with different intensity thresholds
        if (visibility.core && intensity >= 0.15) {
          // Tumor Core contribution - Blue
          r += 0;
          g += 100 * intensity; // Add slight green for cyan-ish blue
          b += 255 * intensity;
          a += 255 * intensity * 0.8;
          activeRegions++;
        }
        
        if (visibility.wholeTumor && intensity >= 0.25) {
          // Whole Tumor contribution - Yellow
          r += 255 * intensity;
          g += 255 * intensity;
          b += 0;
          a += 255 * intensity * 0.7;
          activeRegions++;
        }
        
        if (visibility.enhancing && intensity >= 0.4) {
          // Enhancing Tumor contribution - Red
          r += 255 * intensity;
          g += 50 * intensity; // Add slight orange tint
          b += 0;
          a += 255 * intensity * 0.9;
          activeRegions++;
        }
        
        if (activeRegions > 0) {
          // Blend the colors (don't average, layer them)
          blendedColormap.R[i] = Math.min(255, Math.floor(r));
          blendedColormap.G[i] = Math.min(255, Math.floor(g));
          blendedColormap.B[i] = Math.min(255, Math.floor(b));
          blendedColormap.A[i] = Math.min(255, Math.floor(a));
        } else {
          // No regions visible at this intensity
          blendedColormap.A[i] = 0;
        }
      }
    }
    
    // If no regions are visible, make everything transparent
    if (!visibility.core && !visibility.wholeTumor && !visibility.enhancing) {
      for (let i = 0; i < 256; i++) {
        blendedColormap.A[i] = 0;
      }
    }
    
    // Update the colormap
    const cmapName = `BraTS_Blended_${Date.now()}`;
    nvRef.current.addColormap(cmapName, blendedColormap);
    
    const segVolumeId = nvRef.current.volumes[1].id;
    nvRef.current.setColormap(segVolumeId, cmapName);
    nvRef.current.updateGLVolume();
    
    return cmapName;
  };

  const toggleTumorType = (tumorType) => {
    if (!nvRef.current || nvRef.current.volumes.length <= 1) return;
    
    const newVisibility = { ...tumorVisibility };
    newVisibility[tumorType] = !newVisibility[tumorType];
    setTumorVisibility(newVisibility);
    
    // Generate new blended colormap
    generateBlendedColormap(newVisibility);
    
    console.log(`Updated tumor visibility:`, newVisibility, 'Active regions:', Object.values(newVisibility).filter(Boolean).length);
  };

  return (
    <div className="w-full h-full relative bg-slate-950 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full max-h-full transition-opacity duration-500 block",
          loading ? "opacity-0" : "opacity-100"
        )}
        style={{ maxHeight: '100%', height: '100%' }}
      />
      
      {/* Control Buttons */}
      <AnimatePresence>
        {!loading && !error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.5 }}
            className="absolute top-4 right-4 z-10 flex flex-col gap-2"
          >
            <Button
              onClick={toggle3D}
              variant={is3D ? "default" : "secondary"}
              size="sm"
              className={cn(
                "backdrop-blur-sm transition-all duration-300 border-0 shadow-lg hover:shadow-xl",
                is3D ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"
              )}
            >
              <motion.div
                animate={{ rotate: is3D ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
              </motion.div>
              {is3D ? '3D Volume' : 'Switch to 3D'}
            </Button>
            
            {segmentationUrl && showSegmentation && (
              <div className="space-y-2">
                {/* Tumor Type Controls */}
                <div className="flex gap-1">
                  {[
                    { key: 'wholeTumor', label: 'WT', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600', ring: 'ring-yellow-400' },
                    { key: 'enhancing', label: 'ET', color: 'bg-red-500', hoverColor: 'hover:bg-red-600', ring: 'ring-red-400' },
                    { key: 'core', label: 'TC', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', ring: 'ring-blue-400' }
                  ].map((tumor) => (
                    <Button
                      key={tumor.key}
                      onClick={() => toggleTumorType(tumor.key)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "backdrop-blur-md transition-all duration-300 border-2 shadow-lg hover:shadow-xl",
                        "w-10 h-8 p-0 rounded-lg font-bold text-xs hover:scale-105 active:scale-95",
                        tumorVisibility[tumor.key] 
                          ? cn(
                              tumor.color, 
                              tumor.hoverColor, 
                              "text-white border-white/30 shadow-2xl",
                              `ring-2 ${tumor.ring}/50`
                            ) 
                          : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-600/50 hover:border-slate-500/70"
                      )}
                    >
                      <motion.span 
                        className="text-xs font-extrabold tracking-wide"
                        animate={{ scale: tumorVisibility[tumor.key] ? 1.05 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {tumor.label}
                      </motion.span>
                    </Button>
                  ))}
                </div>
                
                {/* Debug Controls */}
                <div className="flex gap-1">
                  {/* Debug button to test colormap visibility */}
                  <Button
                    onClick={() => {
                      if (nvRef.current && nvRef.current.volumes.length > 1) {
                        const segVolume = nvRef.current.volumes[1];
                        const availableColormaps = ['warm', 'red', 'viridis', 'jet', 'plasma', 'hot', 'BraTS_Probability', 'BraTS_Labels'];
                        const currentIdx = availableColormaps.indexOf(segVolume.colormap) || 0;
                        const nextColormap = availableColormaps[(currentIdx + 1) % availableColormaps.length];
                        console.log(`Testing colormap: ${nextColormap} (was: ${segVolume.colormap})`);
                        
                        // Also try adjusting intensity range
                        segVolume.cal_min = 0;
                        segVolume.cal_max = segVolume.global_max;
                        
                        nvRef.current.setColormap(segVolume.id, nextColormap);
                        nvRef.current.setOpacity(1, 0.9);
                        nvRef.current.updateGLVolume();
                        
                        console.log(`Applied: ${nextColormap}, Range: ${segVolume.cal_min}-${segVolume.cal_max}, Opacity: ${segVolume.opacity}`);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-md transition-all duration-300 border-2 shadow-lg hover:shadow-xl bg-purple-600/90 hover:bg-purple-500 text-white border-purple-400/50 hover:border-purple-300/70 w-12 h-8 p-0 rounded-lg font-bold hover:scale-105 active:scale-95 ring-2 ring-purple-400/30"
                  >
                    <motion.span 
                      className="text-xs font-extrabold tracking-wide"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      TEST
                    </motion.span>
                  </Button>
                  
                  {/* Force visibility button */}
                  <Button
                    onClick={() => {
                      if (nvRef.current && nvRef.current.volumes.length > 1) {
                        const segVolume = nvRef.current.volumes[1];
                        console.log("Force visibility attempt...");
                        
                        // Try the most visible colormap
                        nvRef.current.setColormap(segVolume.id, 'red');
                        
                        // Force extreme visibility settings
                        segVolume.cal_min = segVolume.global_min;
                        segVolume.cal_max = segVolume.global_max;
                        nvRef.current.setOpacity(1, 1.0); // Full opacity
                        
                        // Force multiple updates
                        nvRef.current.updateGLVolume();
                        nvRef.current.drawScene();
                        
                        setTimeout(() => {
                          nvRef.current.updateGLVolume();
                          nvRef.current.drawScene();
                        }, 100);
                        
                        console.log("Force visibility applied with red colormap and full opacity");
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-md transition-all duration-300 border-2 shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-600/90 to-amber-600/90 hover:from-orange-500 hover:to-amber-500 text-white border-orange-400/50 hover:border-orange-300/70 w-12 h-8 p-0 rounded-lg font-bold hover:scale-105 active:scale-95 ring-2 ring-orange-400/30"
                  >
                    <motion.span 
                      className="text-xs font-extrabold tracking-wide"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      SHOW
                    </motion.span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
                )}
      </AnimatePresence>

      {/* Debug Info Panel */}
      {!loading && !error && nvRef.current && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-white max-w-xs">
          <div className="font-semibold text-green-400 mb-2">Debug Info:</div>
          <div>Volumes loaded: {nvRef.current.volumes?.length || 0}</div>
          {nvRef.current.volumes?.length > 0 && (
            <>
              <div className="mt-1 text-blue-300">Brain Volume:</div>
              <div>• Dims: {nvRef.current.volumes[0].dims?.join('×')}</div>
              <div>• Range: {nvRef.current.volumes[0].cal_min?.toFixed(1)} - {nvRef.current.volumes[0].cal_max?.toFixed(1)}</div>
            </>
          )}
          {nvRef.current.volumes?.length > 1 && (
            <>
              <div className="mt-1 text-red-300">Segmentation:</div>
              <div>• Global Range: {nvRef.current.volumes[1].global_min?.toFixed(1)} - {nvRef.current.volumes[1].global_max?.toFixed(1)}</div>
              <div>• Display Range: {nvRef.current.volumes[1].cal_min?.toFixed(1)} - {nvRef.current.volumes[1].cal_max?.toFixed(1)}</div>
              <div>• Colormap: {nvRef.current.volumes[1].colormap}</div>
              <div>• Opacity: {nvRef.current.volumes[1].opacity?.toFixed(2)}</div>
              <div className="mt-1 text-yellow-300">
                Expected Labels: 1(Blue), 2(Yellow), 4(Red)
              </div>
              {nvRef.current.volumes[1].global_max > 0 && (
                <div className="mt-1 text-orange-300">
                  ✓ Segmentation data detected!
                </div>
              )}
            </>
          )}
          <div className="mt-2 text-purple-300">
            Mode: {is3D ? '3D Render' : 'Multiplanar'}
          </div>
        </div>
      )}
       
       {/* Loading Animation */}
      <AnimatePresence>
      {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <Brain className="w-16 h-16 text-purple-400" />
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-64 h-1 bg-purple-600 rounded-full mb-4"
            />
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-purple-300 font-medium"
            >
              Loading brain data...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          >
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-red-300 font-medium text-center max-w-md">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main component for the page
export default function NiftiViewerPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [segUrl, setSegUrl] = useState(null);
  const [imageFilename, setImageFilename] = useState('');
  const [segFilename, setSegFilename] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiMode, setApiMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [brainFiles, setBrainFiles] = useState([]);
  const [segmentationFiles, setSegmentationFiles] = useState([]);
  const [showBrainFileModal, setShowBrainFileModal] = useState(false);
  const [showSegFileModal, setShowSegFileModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState('');
  const [selectedSegFile, setSelectedSegFile] = useState('');

  const steps = [
    { id: 0, title: "Upload Brain Image", description: "Load your brain MRI scan (.nii.gz)" },
    { id: 1, title: "Upload Segmentation", description: "Load tumor segmentation mask (optional)" },
    { id: 2, title: "View Results", description: "Explore your data in 2D/3D" }
  ];

  // Load local files from the niftis directory
  useEffect(() => {
    const loadLocalFiles = async () => {
      try {
        // Brain images in main niftis folder
        const brainFilesList = [
          'BraTS-GLI-00005-100-t1c.nii',
          'BraTS-GLI-00005-100-t2f.nii',
          'BraTS-GLI-00005-100-t2w.nii',
          'BraTS-GLI-00005-101-t1c.nii',
          'BraTS-GLI-00005-101-t1n.nii',
          'BraTS-GLI-00005-101-t2f.nii',
          'BraTS-GLI-00005-101-t2w.nii'
        ];
        
        // Segmentation files in segmentations subfolder
        const segmentationFilesList = [
          'BraTS-GLI-00005-100-seg.nii',
          'BraTS-GLI-00005-101-seg.nii'
        ];
        
        setBrainFiles(brainFilesList);
        setSegmentationFiles(segmentationFilesList);
      } catch (error) {
        console.error('Error loading local files:', error);
      }
    };

    loadLocalFiles();
  }, []);

  const loadLocalBrainFile = async (filename) => {
    try {
      setUploadProgress(0);
      setError('');

      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 15;
        });
      }, 100);

      // Create a URL for the local brain file
      const fileUrl = `/niftis/${filename}`;
      
      setTimeout(() => {
        setImageUrl(fileUrl);
        setImageFilename(filename);
        setSelectedImageFile(filename);
        setCurrentStep(1); // Move to segmentation step
        setUploadProgress(0);
        setShowBrainFileModal(false); // Close modal
      }, 800);
      
    } catch (error) {
      setError(`Error loading local brain file: ${error.message}`);
      setUploadProgress(0);
    }
  };

  const loadLocalSegFile = async (filename) => {
    try {
      setUploadProgress(0);
      setError('');

      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 15;
        });
      }, 100);

      // Create a URL for the local segmentation file
      const fileUrl = `/niftis/segmentations/${filename}`;
      
      setTimeout(() => {
        setSegUrl(fileUrl);
        setSegFilename(filename);
        setSelectedSegFile(filename);
        setCurrentStep(2); // Move to viewing step
        setUploadProgress(0);
        setShowSegFileModal(false); // Close modal
      }, 800);
      
    } catch (error) {
      setError(`Error loading local segmentation file: ${error.message}`);
      setUploadProgress(0);
    }
  };

  const handleFileChange = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.nii.gz') && !file.name.endsWith('.nii')) {
      setError('Please select a .nii or .nii.gz file.');
      return;
    }

    setError('');
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    const url = URL.createObjectURL(file);
    
    setTimeout(() => {
      if (fileType === 'image') {
        setImageUrl(url);
        setImageFilename(file.name);
        setCurrentStep(1);
      } else {
        setSegUrl(url);
        setSegFilename(file.name);
        setCurrentStep(2);
      }
      setUploadProgress(0);
    }, 1200);
  };

  const resetUpload = () => {
    setCurrentStep(0);
    setImageUrl(null);
    setSegUrl(null);
    setImageFilename('');
    setSegFilename('');
    setError('');
    setUploadProgress(0);
  };

  const skipSegmentation = () => {
    setCurrentStep(2);
  };

  const handleApiProcessing = async (file) => {
    try {
      setApiMode(true);
      setProcessingStatus('Uploading to AI backend...');
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call API demo
      const result = await bratsAPI.demoSegmentation(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        setProcessingStatus('Segmentation completed! Loading results...');
        
        // Set the brain image
        const brainUrl = URL.createObjectURL(file);
        setImageUrl(brainUrl);
        setImageFilename(file.name);
        
        // Create a mock segmentation file (in real scenario, this would be downloaded from backend)
        setTimeout(() => {
          setSegUrl(result.segmentationUrl);
          setSegFilename(result.segmentationFilename);
          setCurrentStep(2);
          setProcessingStatus('');
          setUploadProgress(0);
        }, 1500);
        
      } else {
        throw new Error('Segmentation failed');
      }
    } catch (error) {
      console.error('API processing error:', error);
      setError('Failed to process image with AI backend: ' + error.message);
      setProcessingStatus('');
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6 gap-6 h-full max-h-screen overflow-hidden">
      {/* Left Panel - Upload Steps */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-80 flex-shrink-0"
      >
        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Process
            </CardTitle>
            <CardDescription>
              Follow these steps to load your BraTS data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex items-start space-x-3 p-4 rounded-lg transition-all duration-300",
                  currentStep === step.id ? "bg-purple-600/20 border border-purple-500/30" :
                  currentStep > step.id ? "bg-green-600/20 border border-green-500/30" :
                  "bg-slate-800/30 border border-slate-700/30"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  currentStep === step.id ? "bg-purple-600 text-white" :
                  currentStep > step.id ? "bg-green-600 text-white" :
                  "bg-slate-700 text-slate-400"
                )}>
                  {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id + 1}
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-medium transition-colors",
                    currentStep === step.id ? "text-purple-300" :
                    currentStep > step.id ? "text-green-300" :
                    "text-slate-400"
                  )}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Upload Progress */}
            <AnimatePresence>
              {(uploadProgress > 0 && uploadProgress < 100) || processingStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {processingStatus || "Uploading..."}
                    </span>
                    <span className="text-purple-400">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Buttons */}
            <div className="space-y-3">
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept=".nii,.nii.gz"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="hidden"
                  />
                  <input
                    id="api-upload"
                    type="file"
                    accept=".nii,.nii.gz"
                    onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.nii.gz') && !file.name.endsWith('.nii')) {
        setError('Please select a .nii or .nii.gz file.');
        return;
      }
      setError('');
                        handleApiProcessing(file);
                      }
                    }}
                    className="hidden"
                  />
                  
                  <div className="text-center text-sm text-slate-400 font-medium">
                    Manual Upload
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      className="flex-1 bg-purple-600 hover:bg-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center">
                        <FileImage className="w-4 h-4 mr-2" />
                        Select Brain Image
                      </label>
                    </Button>
                    <Button
                      onClick={() => setShowBrainFileModal(true)}
                      variant="outline"
                      size="lg"
                      className="px-3 border-purple-500/50 hover:border-purple-500 hover:bg-purple-600/10 transition-all duration-300"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="h-px bg-slate-700 flex-1" />
                    <span className="text-xs text-slate-500 mx-3">OR</span>
                    <div className="h-px bg-slate-700 flex-1" />
                  </div>
                  
                  <div className="text-center text-sm text-slate-400 font-medium">
                    AI Auto-Segmentation
          </div>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <label htmlFor="api-upload" className="cursor-pointer flex items-center justify-center">
                      <Cpu className="w-4 h-4 mr-2" />
                      Process with AI
                    </label>
                  </Button>
                  

                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <input
                    id="seg-upload"
                    type="file"
                    accept=".nii,.nii.gz"
                    onChange={(e) => handleFileChange(e, 'segmentation')}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      asChild
                      className="flex-1 bg-green-600 hover:bg-green-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      <label htmlFor="seg-upload" className="cursor-pointer flex items-center justify-center">
                        <Brain className="w-4 h-4 mr-2" />
                        Select Segmentation
                      </label>
                    </Button>
                    <Button
                      onClick={() => setShowSegFileModal(true)}
                      variant="outline"
                      size="lg"
                      className="px-3 border-green-500/50 hover:border-green-500 hover:bg-green-600/10 transition-all duration-300"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={skipSegmentation}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
                    size="sm"
                  >
                    Skip Segmentation
                  </Button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={resetUpload}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Files
                  </Button>
                </motion.div>
              )}
          </div>

            {/* File Info */}
            <AnimatePresence>
              {(imageFilename || segFilename) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 p-3 bg-slate-800/30 rounded-lg"
                >
                  {imageFilename && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 truncate">{imageFilename}</span>
        </div>
                  )}
                  {segFilename && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 truncate">{segFilename}</span>
        </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm">{error}</span>
      </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Panel - Viewer */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1"
      >
        <Card className="h-full bg-slate-900/50 border-purple-500/20 backdrop-blur-sm flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-purple-300 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              3D Visualization
            </CardTitle>
            <CardDescription>
              Interactive brain imaging viewer
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-6">
            <AnimatePresence mode="wait">
              {imageUrl ? (
                <motion.div
                  key="viewer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  <NiftiVolume 
                    url={imageUrl} 
                    segmentationUrl={segUrl} 
                    filename={imageFilename} 
                    segmentationFilename={segFilename} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-8 bg-purple-600/10 rounded-full"
                  >
                    <Brain className="w-16 h-16 text-purple-400" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-300">
                      Ready to visualize brain data
                    </h3>
                    <p className="text-slate-500 max-w-md">
                      Upload your BraTS dataset files to explore tumor segmentation in an interactive 3D environment
                    </p>
      </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Brain File Selection Modal */}
      <AnimatePresence>
        {showBrainFileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowBrainFileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Select Brain Image
                </h3>
                <Button
                  onClick={() => setShowBrainFileModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-200"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {brainFiles.map((filename) => {
                  const patientMatch = filename.match(/BraTS-GLI-00005-(\d+)/);
                  const typeMatch = filename.match(/-(t1c|t2f|t2w|t1n)\.nii$/);
                  const patientId = patientMatch ? patientMatch[1] : '';
                  const fileType = typeMatch ? typeMatch[1].toUpperCase() : '';
                  
                  return (
                    <Button
                      key={filename}
                      onClick={() => loadLocalBrainFile(filename)}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left border-slate-600 hover:border-purple-500/50 transition-all duration-200",
                        selectedImageFile === filename 
                          ? "bg-purple-600/20 border-purple-500 text-purple-300" 
                          : "text-slate-300 hover:bg-slate-700/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">Patient {patientId} - {fileType}</span>
                          <span className="text-xs text-slate-500">{filename}</span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Segmentation File Selection Modal */}
      <AnimatePresence>
        {showSegFileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSegFileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-400" />
                  Select Segmentation
                </h3>
                <Button
                  onClick={() => setShowSegFileModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-200"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {segmentationFiles.map((filename) => {
                  const patientMatch = filename.match(/BraTS-GLI-00005-(\d+)/);
                  const patientId = patientMatch ? patientMatch[1] : '';
                  
                  return (
                    <Button
                      key={filename}
                      onClick={() => loadLocalSegFile(filename)}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left border-slate-600 hover:border-green-500/50 transition-all duration-200",
                        selectedSegFile === filename 
                          ? "bg-green-600/20 border-green-500 text-green-300" 
                          : "text-slate-300 hover:bg-slate-700/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Brain className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">Patient {patientId} - Segmentation</span>
                          <span className="text-xs text-slate-500">{filename}</span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
