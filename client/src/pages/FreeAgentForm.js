// src/pages/FreeAgentForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaUserPlus, FaSave, FaArrowLeft } from 'react-icons/fa';

const FreeAgentForm = () => {
  const { id } = useParams(); // For editing existing wrestlers
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    style: 'Technical',
    strength: 50,
    agility: 50,
    charisma: 50,
    technical: 50,
    popularity: 50,
    salary: 50000,
    companyId: '', // Optional for free agents
    contractLength: 12,
    exclusive: true,
    hometown: '',
    age: 25,
    experience: 0,
    bio: '',
    signatureMoves: '',
    finisher: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify user is admin
        if (!user || !user.isAdmin) {
          setError('Admin access required');
          setLoading(false);
          return;
        }

        // Fetch all companies (for optional assignment)
        const companyRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/companies`, { 
          withCredentials: true 
        });
        setCompanies(companyRes.data);
        
        // If editing, fetch wrestler data
        if (id) {
          const wrestlerRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/wrestlers/${id}`, { 
            withCredentials: true 
          });
          const wrestler = wrestlerRes.data;
          
          setFormData({
            name: wrestler.name,
            gender: wrestler.gender,
            style: wrestler.style,
            strength: wrestler.attributes.strength,
            agility: wrestler.attributes.agility,
            charisma: wrestler.attributes.charisma,
            technical: wrestler.attributes.technical,
            popularity: wrestler.popularity,
            salary: wrestler.salary,
            companyId: wrestler.contract?.company?._id || '',
            contractLength: wrestler.contract?.length || 12,
            exclusive: wrestler.contract?.exclusive || true,
            hometown: wrestler.hometown || '',
            age: wrestler.age || 25,
            experience: wrestler.experience || 0,
            bio: wrestler.bio || '',
            signatureMoves: wrestler.signatureMoves?.join(', ') || '',
            finisher: wrestler.finisher || ''
          });
          
          if (wrestler.image) {
            setImagePreview(`${process.env.REACT_APP_API_URL}${wrestler.image}`);
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
  }, [id, user]);

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
        // Update existing wrestler
        response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/wrestlers/${id}`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );
      } else {
        // Create new wrestler as free agent
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/wrestlers`, 
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );
      }

      // Redirect to free agents page or wrestler detail
      navigate(response.data.contract?.company ? 
        `/roster/${response.data.contract.company}` : 
        '/free-agents');
    } catch (err) {
      console.error('Error saving wrestler:', err);
      setError(err.response?.data?.message || 'Error saving wrestler data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Admin access required to manage free agents.
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h1 className="mb-4">
        <FaUserPlus className="me-2" />
        {id ? 'Edit Wrestler' : 'Create Free Agent'}
      </h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="card form-container">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left Column */}
              <div className="col-md-6">
                <h3 className="mb-3">Basic Information</h3>
                
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="gender" className="form-label">Gender *</label>
                    <select
                      className="form-select"
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="style" className="form-label">Wrestling Style *</label>
                    <select
                      className="form-select"
                      id="style"
                      name="style"
                      value={formData.style}
                      onChange={handleChange}
                      required
                    >
                      <option value="Technical">Technical</option>
                      <option value="High-Flyer">High-Flyer</option>
                      <option value="Powerhouse">Powerhouse</option>
                      <option value="Brawler">Brawler</option>
                      <option value="Showman">Showman</option>
                      <option value="All-Rounder">All-Rounder</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="hometown" className="form-label">Hometown</label>
                  <input
                    type="text"
                    className="form-control"
                    id="hometown"
                    name="hometown"
                    value={formData.hometown}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="age" className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-control"
                      id="age"
                      name="age"
                      min="18"
                      max="65"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="experience" className="form-label">Experience (years)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="experience"
                      name="experience"
                      min="0"
                      max="40"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Wrestler Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    name="image"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={handleImageChange}
                  />
                  <small className="text-muted">Max size: 2MB. Formats: JPG, PNG, GIF</small>
                  
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="bio" className="form-label">Biography</label>
                  <textarea
                    className="form-control"
                    id="bio"
                    name="bio"
                    rows="3"
                    maxLength="500"
                    value={formData.bio}
                    onChange={handleChange}
                  ></textarea>
                  <small className="text-muted">Max 500 characters</small>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="col-md-6">
                <h3 className="mb-3">Attributes & Contract</h3>
                
                <div className="mb-3">
                  <label htmlFor="strength" className="form-label">
                    Strength: {formData.strength}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="strength"
                    name="strength"
                    min="1"
                    max="100"
                    value={formData.strength}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="agility" className="form-label">
                    Agility: {formData.agility}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="agility"
                    name="agility"
                    min="1"
                    max="100"
                    value={formData.agility}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="charisma" className="form-label">
                    Charisma: {formData.charisma}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="charisma"
                    name="charisma"
                    min="1"
                    max="100"
                    value={formData.charisma}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="technical" className="form-label">
                    Technical: {formData.technical}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="technical"
                    name="technical"
                    min="1"
                    max="100"
                    value={formData.technical}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="popularity" className="form-label">
                    Popularity: {formData.popularity}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    id="popularity"
                    name="popularity"
                    min="1"
                    max="100"
                    value={formData.popularity}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="signatureMoves" className="form-label">Signature Moves</label>
                  <input
                    type="text"
                    className="form-control"
                    id="signatureMoves"
                    name="signatureMoves"
                    value={formData.signatureMoves}
                    onChange={handleChange}
                    placeholder="Suplex, DDT, Clothesline, etc."
                  />
                  <small className="text-muted">Comma-separated list</small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="finisher" className="form-label">Finisher</label>
                  <input
                    type="text"
                    className="form-control"
                    id="finisher"
                    name="finisher"
                    value={formData.finisher}
                    onChange={handleChange}
                  />
                </div>
                
                <hr className="my-4" />
                
                <h4>Contract Details (Optional)</h4>
                <div className="alert alert-info">
                  <small>Leave company blank to create as free agent</small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="companyId" className="form-label">Company</label>
                  <select
                    className="form-select"
                    id="companyId"
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                  >
                    <option value="">No Company (Free Agent)</option>
                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {formData.companyId && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="salary" className="form-label">Salary ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="salary"
                        name="salary"
                        min="10000"
                        step="5000"
                        value={formData.salary}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="contractLength" className="form-label">Contract Length (months)</label>
                        <input
                          type="number"
                          className="form-control"
                          id="contractLength"
                          name="contractLength"
                          min="1"
                          max="60"
                          value={formData.contractLength}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-check mt-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="exclusive"
                            name="exclusive"
                            checked={formData.exclusive}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="exclusive">
                            Exclusive Contract
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" /> Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.name}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> {id ? 'Update Wrestler' : 'Create Wrestler'}
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

export default FreeAgentForm;