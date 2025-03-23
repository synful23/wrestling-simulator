// src/pages/CreateCompany.js - Enhanced version
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; 
import { FaBuilding, FaMapMarkerAlt, FaFileUpload, FaInfoCircle, FaArrowLeft, FaSave } from 'react-icons/fa';

const LOCATIONS = [
  'New York, USA',
  'Los Angeles, USA',
  'Chicago, USA',
  'Texas, USA',
  'Florida, USA',
  'Toronto, Canada',
  'Montreal, Canada',
  'London, UK',
  'Manchester, UK',
  'Tokyo, Japan',
  'Osaka, Japan',
  'Mexico City, Mexico',
  'Berlin, Germany',
  'Paris, France',
  'Rome, Italy',
  'Madrid, Spain',
  'Melbourne, Australia',
  'Sydney, Australia',
  'Mumbai, India',
  'Rio de Janeiro, Brazil'
];

const CreateCompany = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // For multi-step form

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle logo file upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB');
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Logo must be a JPG, PNG, or GIF file');
        return;
      }
      
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create FormData object for multipart/form-data (for file upload)
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      
      // Only append logo if one was selected
      if (logo) {
        formDataToSend.append('logo', logo);
      }

      // Send POST request to create company
      await api.post('/api/companies', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating company:', err);
      setError(err.response?.data?.message || 'Error creating company');
    } finally {
      setLoading(false);
    }
  };

  // Go to next step in multi-step form
  const nextStep = () => {
    if (step === 1 && !formData.name) {
      setError('Please enter a company name');
      return;
    }
    if (step === 2 && !formData.location) {
      setError('Please select a location');
      return;
    }
    
    setError('');
    setStep(step + 1);
  };

  // Go to previous step
  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // Render form step 1: Company Name and Logo
  const renderStep1 = () => (
    <div className="card-body">
      <div className="mb-4">
        <label htmlFor="name" className="form-label fw-bold">Company Name *</label>
        <div className="input-group">
          <span className="input-group-text">
            <FaBuilding />
          </span>
          <input
            className="form-control form-control-lg"
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your wrestling company name"
          />
        </div>
        <small className="text-muted">Choose a name that represents your brand and wrestling style</small>
      </div>

      <div className="mb-4">
        <label htmlFor="logo" className="form-label fw-bold">Company Logo</label>
        <div className="input-group mb-3">
          <span className="input-group-text">
            <FaFileUpload />
          </span>
          <input
            className="form-control"
            id="logo"
            type="file"
            accept="image/jpeg, image/png, image/gif"
            onChange={handleLogoChange}
          />
        </div>
        <small className="text-muted d-block mb-3">Maximum file size: 2MB. Formats: JPG, PNG, GIF</small>
        
        {logoPreview && (
          <div className="text-center p-3 bg-light rounded mb-3">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="img-fluid company-logo"
              style={{ maxHeight: '150px' }}
            />
          </div>
        )}
      </div>

      <div className="text-end mt-4">
        <button 
          type="button" 
          className="btn btn-primary btn-lg px-5"
          onClick={nextStep}
        >
          Next <i className="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );

  // Render form step 2: Location
  const renderStep2 = () => (
    <div className="card-body">
      <div className="mb-4">
        <label htmlFor="location" className="form-label fw-bold">Company Location *</label>
        <div className="input-group">
          <span className="input-group-text">
            <FaMapMarkerAlt />
          </span>
          <select
            className="form-select form-select-lg"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          >
            <option value="">Select a location</option>
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <small className="text-muted">Your company's home base will affect local popularity and venue options</small>
      </div>

      <div className="card bg-light border-0 mb-4">
        <div className="card-body">
          <h5 className="card-title">
            <FaInfoCircle className="me-2" /> Location Insights
          </h5>
          <p className="card-text">
            Each location has unique characteristics that will influence your company's growth:
          </p>
          <ul className="mb-0">
            <li><strong>Major Markets</strong> (NYC, Tokyo, London) - Higher costs but larger potential audience</li>
            <li><strong>Regional Markets</strong> (Chicago, Manchester, Osaka) - Balanced costs and audience size</li>
            <li><strong>Emerging Markets</strong> (Mumbai, Rio) - Lower costs but need more work to build an audience</li>
          </ul>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary px-4"
          onClick={prevStep}
        >
          <FaArrowLeft className="me-2" /> Back
        </button>
        <button 
          type="button" 
          className="btn btn-primary px-4"
          onClick={nextStep}
        >
          Next <i className="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );

  // Render form step 3: Description and Submit
  const renderStep3 = () => (
    <div className="card-body">
      <div className="mb-4">
        <label htmlFor="description" className="form-label fw-bold">Company Description *</label>
        <textarea
          className="form-control"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="5"
          placeholder="Describe your wrestling company's style, history, and goals"
        ></textarea>
        <small className="text-muted">Tell fans what makes your promotion unique, including your wrestling style and values</small>
      </div>

      <div className="card bg-light border-0 mb-4">
        <div className="card-body">
          <h5 className="card-title">Summary</h5>
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>Company Name:</strong> {formData.name}</p>
              <p className="mb-1"><strong>Location:</strong> {formData.location}</p>
              <p className="mb-3"><strong>Logo:</strong> {logo ? 'Uploaded' : 'Not provided'}</p>
            </div>
            <div className="col-md-6">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="img-fluid"
                  style={{ maxHeight: '100px' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button 
          type="button" 
          className="btn btn-outline-secondary px-4"
          onClick={prevStep}
        >
          <FaArrowLeft className="me-2" /> Back
        </button>
        <button 
          type="submit"
          className="btn btn-success px-5"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating...
            </>
          ) : (
            <>
              <FaSave className="me-2" /> Create Company
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="container my-4">
      <h1 className="mb-4">
        <FaBuilding className="me-2" /> Create Your Wrestling Company
      </h1>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container">
        {/* Progress bar */}
        <div className="progress mb-4" style={{ height: '8px' }}>
          <div 
            className="progress-bar bg-primary" 
            role="progressbar" 
            style={{ width: `${(step / 3) * 100}%` }}
            aria-valuenow={step} 
            aria-valuemin="1" 
            aria-valuemax="3"
          ></div>
        </div>
        
        {/* Step navigation */}
        <div className="d-flex justify-content-between mb-4">
          <div 
            className={`step-circle ${step >= 1 ? 'active' : ''}`}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: step >= 1 ? 'var(--primary)' : 'var(--gray-200)',
              color: step >= 1 ? 'white' : 'var(--gray-700)'
            }}
          >
            1
          </div>
          <div className="step-line flex-grow-1 mx-2" style={{ height: '2px', backgroundColor: 'var(--gray-200)', marginTop: '20px' }}></div>
          <div 
            className={`step-circle ${step >= 2 ? 'active' : ''}`}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: step >= 2 ? 'var(--primary)' : 'var(--gray-200)',
              color: step >= 2 ? 'white' : 'var(--gray-700)'
            }}
          >
            2
          </div>
          <div className="step-line flex-grow-1 mx-2" style={{ height: '2px', backgroundColor: 'var(--gray-200)', marginTop: '20px' }}></div>
          <div 
            className={`step-circle ${step >= 3 ? 'active' : ''}`}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: step >= 3 ? 'var(--primary)' : 'var(--gray-200)',
              color: step >= 3 ? 'white' : 'var(--gray-700)'
            }}
          >
            3
          </div>
        </div>

        {/* Step labels */}
        <div className="d-flex justify-content-between mb-4">
          <div className="text-center" style={{ width: '80px' }}>
            <small className="text-muted">Basics</small>
          </div>
          <div className="text-center" style={{ width: '80px' }}>
            <small className="text-muted">Location</small>
          </div>
          <div className="text-center" style={{ width: '80px' }}>
            <small className="text-muted">Details</small>
          </div>
        </div>
        
        {/* Step content */}
        <div className="card shadow-sm mb-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </form>
      
      <div className="mt-3 text-center">
        <button 
          type="button" 
          className="btn btn-link text-muted" 
          onClick={() => navigate('/dashboard')}
        >
          Cancel and return to dashboard
        </button>
      </div>
    </div>
  );
};

export default CreateCompany;