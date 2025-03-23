// Fixed CompanyLogoUpdateForm.js with path correction
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CompanyLogoUpdateForm = ({ companyId, currentLogo, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  // Corrected function to convert DB path to URL
  const getImageUrl = (logoPath) => {
    if (!logoPath) return null;
    
    // If it's already a full URL, return it
    if (logoPath.startsWith('http')) return logoPath;
    
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    // Critical fix: Convert /uploads/ to /api/uploads/
    let correctedPath = logoPath;
    if (logoPath.startsWith('/uploads/')) {
      correctedPath = `/api${logoPath}`;
    } else if (logoPath.startsWith('uploads/')) {
      correctedPath = `/api/${logoPath}`;
    }
    
    // Remove any double slashes (except in http://)
    const fullUrl = `${baseUrl}${correctedPath}`.replace(/([^:])\/\//g, '$1/');
    
    return fullUrl;
  };

  // Initialize preview with current logo
  useEffect(() => {
    if (currentLogo) {
      setPreviewUrl(getImageUrl(currentLogo));
    }
  }, [currentLogo]);

  const handleLogoSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('company-logo-file');
    const file = fileInput.files[0];
    
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be smaller than 2MB');
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('File must be JPG, PNG, or GIF');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      console.log(`Uploading logo for company ID: ${companyId}`);
      
      // Only include the logo field to minimize potential issues
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/companies/${companyId}`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
      
      console.log('Logo update response:', response.data);
      
      if (response.data && response.data.logo) {
        // Force cache busting with timestamp
        const timestamp = new Date().getTime();
        
        // Apply the path correction and append timestamp
        const correctedUrl = `${getImageUrl(response.data.logo)}?t=${timestamp}`;
        console.log('Setting new corrected logo URL:', correctedUrl);
        
        setPreviewUrl(correctedUrl);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError('Logo was not updated. Please try again.');
      }
    } catch (err) {
      console.error('Error updating logo:', err);
      setError('Failed to update logo: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a local preview URL for the selected file
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
    }
  };
  
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">Update Company Logo</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {previewUrl && (
          <div className="text-center mb-3">
            <img 
              src={previewUrl} 
              alt="Logo preview" 
              className="img-thumbnail" 
              style={{ maxHeight: '150px' }} 
              onError={(e) => {
                console.error('Image failed to load:', previewUrl);
                e.target.src = 'https://via.placeholder.com/150x150?text=Logo+Error';
                e.target.onerror = null; // Prevent infinite error loop
              }}
            />
          </div>
        )}
        
        <form onSubmit={handleLogoSubmit}>
          <div className="mb-3">
            <label htmlFor="company-logo-file" className="form-label">
              Select new logo
            </label>
            <input
              type="file"
              className="form-control"
              id="company-logo-file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
            />
            <div className="form-text">
              Max size: 2MB. Formats: JPG, PNG, GIF
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : (
              'Update Logo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyLogoUpdateForm;