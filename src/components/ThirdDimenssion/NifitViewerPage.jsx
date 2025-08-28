'use client';

import { useState, useRef, useEffect } from 'react';
import { Niivue } from '@niivue/niivue';

// Helper component to render the volume using Niivue
const NiftiVolume = ({ url, segmentationUrl, filename, segmentationFilename }) => {
  const canvasRef = useRef();
  const nvRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [is3D, setIs3D] = useState(false);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    const loadAndRender = async () => {
      try {
        setLoading(true);
        setError('');

        // Create Niivue instance with options
        const options = {
          backColor: [0.15, 0.15, 0.15, 1], // Dark background
          crosshairColor: [1, 0, 0, 1], // Red crosshair
          show3Dcrosshair: true,
          meshThicknessOn2D: 0.5
        };
        
        const nv = new Niivue(options);
        nvRef.current = nv;
        await nv.attachToCanvas(canvasRef.current);

        // Prepare volumes array
        const volumes = [];

        // Main volume
        volumes.push({
          url: url,
          colormap: "gray",
          name: filename || "brain_image.nii.gz" // Provide explicit filename
        });

        // Segmentation overlay (if provided)
        if (segmentationUrl) {
          volumes.push({
            url: segmentationUrl,
            colormap: "red",
            opacity: 0.5,
            name: segmentationFilename || "segmentation.nii.gz" // Provide explicit filename
          });
        }

        // Load volumes
        await nv.loadVolumes(volumes);
        setLoading(false);

        console.log("Successfully loaded NIfTI files with Niivue");

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: loading ? 'none' : 'block'
        }}
              />
      
      {/* 3D Toggle Button */}
      {!loading && !error && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10
        }}>
          <button
            onClick={toggle3D}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: is3D ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            {is3D ? '3D Volume' : 'Switch to 3D'}
          </button>
        </div>
      )}
      
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: 'white', 
          fontSize: '1.5rem' 
        }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: 'red', 
          fontSize: '1rem',
          textAlign: 'center'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

// Main component for the page
export default function NiftiViewerPage() {
  const [imageUrl, setImageUrl] = useState(null);
  const [segUrl, setSegUrl] = useState(null);
  const [imageFilename, setImageFilename] = useState('');
  const [segFilename, setSegFilename] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.nii.gz') && !file.name.endsWith('.nii')) {
        setError('Please select a .nii or .nii.gz file.');
        return;
      }
      setError('');
      const url = URL.createObjectURL(file);
      if (fileType === 'image') {
        setImageUrl(url);
        setImageFilename(file.name);
      } else {
        setSegUrl(url);
        setSegFilename(file.name);
      }
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#272727', color: 'white' }}>
      <div style={{ padding: '1rem', background: '#1a1a1a', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label htmlFor="image-upload" style={{ cursor: 'pointer', background: '#007bff', padding: '0.5rem 1rem', borderRadius: '5px' }}>
              Load Brain Image (.nii.gz)
            </label>
            <input id="image-upload" type="file" accept=".nii,.nii.gz" onChange={(e) => handleFileChange(e, 'image')} style={{ display: 'none' }} />
          </div>
          <div>
            <label htmlFor="seg-upload" style={{ cursor: 'pointer', background: '#28a745', padding: '0.5rem 1rem', borderRadius: '5px' }}>
              Load Segmentation (.nii.gz)
            </label>
            <input id="seg-upload" type="file" accept=".nii,.nii.gz" onChange={(e) => handleFileChange(e, 'segmentation')} style={{ display: 'none' }} />
          </div>
        </div>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
          {imageUrl && <p>Image loaded: {imageUrl.split('/').pop()}</p>}
          {segUrl && <p>Segmentation loaded: {segUrl.split('/').pop()}</p>}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {imageUrl && <NiftiVolume url={imageUrl} segmentationUrl={segUrl} filename={imageFilename} segmentationFilename={segFilename} />}
        {!imageUrl && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#888',
            fontSize: '1.2rem'
          }}>
            Please load a brain image to view the 3D visualization
          </div>
        )}
      </div>
    </div>
  );
}
