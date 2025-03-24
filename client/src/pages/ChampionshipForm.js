// src/pages/ChampionshipForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaTrophy, FaUpload, FaSave, FaArrowLeft } from 'react-icons/fa';

const ChampionshipForm = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedCompany = queryParams.get('company');
  
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    company: preselectedCompany || '',
    name: '',
    description: '',
    weight: 'Heavyweight',
    prestige: 50,
    isActive: true
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's companies
        if (user) {
          const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies/user`, { 
            withCredentials: true 
          });
          setUserCompanies(companyRes.data);
          
          // Set default company if available and not already set
          if (companyRes.data.length > 0 && !formData.company && !preselectedCompany) {
            setFormData(prev => ({
              ...prev,
              company: companyRes.data[0]._id
            }));
          }
        }
        
        // If editing, fetch championship data
        if (id) {
          const championshipRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/championships/${id}`);
          const championship = championshipRes.data;
          
          setFormData({
            company: championship.company._id,
            name: championship.name,
            description: championship.description || '',
            weight: championship.weight,
            prestige: championship.prestige,
            isActive: championship.isActive
          });
          
          if (championship.image) {
            setImagePreview(`${process.env.REACT_APP_API_URL}${championship.image}`);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, preselectedCompany]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB');
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Image must be a JPG, PNG, or GIF file');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formDataToSend = new FormData();
      
      // Add all fields to FormData
      Object.keys(formData).forEach(key => {
        if (key !== 'image' || (key === 'image' && formData[key])) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      let response;
      
      if (id) {
        // Update existing championship
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/championships/${id}`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );
      } else {
        // Create new championship
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/championships`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );
      }
      
      // Redirect to championship details page
      navigate(`/championships/${response.data._id}`);
    } catch (err) {
      console.error('Error saving championship:', err);
      setError(err.response?.data?.message || 'Error saving championship data');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          You must be logged in to create or edit championships.
        </div>
      </div>
    );
  }
  
  if (userCompanies.length === 0) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          You need to create a company before you can create championships.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container my-4">
      <h1 className="mb-4">
        <FaTrophy className="me-2" />
        {id ? 'Edit Championship' : 'Create Championship'}
      </h1>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left Column */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="company" className="form-label">Company *</label>
                  <select
                    className="form-select"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    disabled={id ? true : false} // Can't change company when editing
                  >
                    <option value="">Select a company</option>
                    {userCompanies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Championship Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. World Heavyweight Championship"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="weight" className="form-label">Weight Class *</label>
                  <select
                    className="form-select"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  >
                    <option value="Heavyweight">Heavyweight</option>
                    <option value="Middleweight">Middleweight</option>
                    <option value="Cruiserweight">Cruiserweight</option>
                    <option value="Tag Team">Tag Team</option>
                    <option value="Women's">Women's</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the history and significance of this championship"
                  ></textarea>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="col-md-6">
                <div className="mb-4">
                  <label htmlFor="prestige" className="form-label">
                    Prestige: {formData.prestige}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="prestige"
                    name="prestige"
                    min="1"
                    max="100"
                    value={formData.prestige}
                    onChange={handleChange}
                  />
                  <div className="d-flex justify-content-between">
                    <small>Low</small>
                    <small>Medium</small>
                    <small>High</small>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Championship Image</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUpload />
                    </span>
                    <input
                      type="file"
                      className="form-control"
                      id="image"
                      name="image"
                      accept="image/jpeg, image/png, image/gif"
                      onChange={handleImageChange}
                    />
                  </div>
                  <small className="text-muted">Max size: 2MB. Formats: JPG, PNG, GIF</small>
                  
                  {imagePreview && (
                    <div className="mt-3 text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-fluid"
                        style={{ maxHeight: '200px', maxWidth: '100%' }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Active Championship
                  </label>
                  <div className="form-text">
                    Inactive championships are considered retired or defunct
                  </div>
                </div>
                
                <div className="alert alert-info">
                  <strong>Note:</strong> After creating the championship, you'll be able to set the current champion
                  and manage title history on the championship details page.
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.name || !formData.company}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> {id ? 'Update Championship' : 'Create Championship'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChampionshipForm;