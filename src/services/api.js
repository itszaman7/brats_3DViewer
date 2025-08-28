// API service for BraTS segmentation backend

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class BratsAPI {
  /**
   * Upload brain image for segmentation
   * @param {File} file - NIfTI brain image file
   * @returns {Promise<Object>} - Response with segmentation result
   */
  async uploadBrainImage(file) {
    const formData = new FormData();
    formData.append("brain_image", file);

    try {
      const response = await fetch(`${API_BASE_URL}/segment`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading brain image:", error);
      throw error;
    }
  }

  /**
   * Get segmentation result by job ID
   * @param {string} jobId - Job ID from upload response
   * @returns {Promise<Object>} - Segmentation result
   */
  async getSegmentationResult(jobId) {
    try {
      const response = await fetch(`${API_BASE_URL}/segment/${jobId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error getting segmentation result:", error);
      throw error;
    }
  }

  /**
   * Download segmentation file
   * @param {string} segmentationUrl - URL to segmentation file
   * @returns {Promise<Blob>} - Segmentation file blob
   */
  async downloadSegmentationFile(segmentationUrl) {
    try {
      const response = await fetch(segmentationUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error("Error downloading segmentation file:", error);
      throw error;
    }
  }

  /**
   * Demo API call - simulates backend response
   * @param {File} file - Brain image file
   * @returns {Promise<Object>} - Mock response
   */
  async demoSegmentation(file) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock response
    return {
      success: true,
      jobId: "demo-job-" + Date.now(),
      status: "completed",
      originalFilename: file.name,
      segmentationUrl: URL.createObjectURL(file), // For demo, return same file
      segmentationFilename: file.name.replace(".nii", "_seg.nii"),
      processingTime: "45.2s",
      tumorVolume: "12.5 cm³",
      confidence: 0.94,
      metadata: {
        algorithm: "U-Net 3D",
        version: "2.1.0",
        processedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Get processing status
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Status response
   */
  async getProcessingStatus(jobId) {
    // For demo purposes
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      jobId,
      status: "completed",
      progress: 100,
      message: "Segmentation completed successfully",
    };
  }
}

// Export singleton instance
export const bratsAPI = new BratsAPI();

// Export class for testing
export default BratsAPI;
