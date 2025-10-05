'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '../../lib/api'; // Use the new apiCall function

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the new apiCall function for all requests
        const [userResponse, profileData, testsData, historyData] = await Promise.all([
          apiCall('/api/user'),
          apiCall('/api/profile'),
          apiCall('/api/risk-tests'),
          apiCall('/api/test-history')
        ]);

        setUser(userResponse.user);
        setProfile(profileData.profile || {});
        setTests(testsData.tests || []);
        setTestHistory(historyData.history || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Redirect to login if not authenticated
        if (error.message === 'Not authenticated') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    setResult(null);
  };

  const handleASCVDSubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall('/api/calculate-ascvd', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setResult(resultData);

      // Refresh history
      const historyData = await apiCall('/api/test-history');
      setTestHistory(historyData.history || []);
    } catch (error) {
      console.error('Error calculating ASCVD risk:', error);
      alert('Error calculating risk: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div>
        <h1>Hello {user?.name || 'User'}</h1>
        <Link href="/profile">
          {profile.profile_picture ? (
            <img
              src={`${API_URL}${profile.profile_picture}`}
              alt="Profile"
              width="100"
              height="100"
            />
          ) : (
            <button>Go to Profile</button>
          )}
        </Link>
      </div>

      <div>
        {/* Disease Selection Section */}
        <div>
          <h2>Health Risk Assessment</h2>
          <p>Select a disease to check your risk:</p>
          <div>
            {tests.map((test) => (
              <div
                key={test.id}
                onClick={() => handleTestSelect(test)}
                style={{ 
                  border: '1px solid #ccc', 
                  padding: '10px', 
                  margin: '5px',
                  cursor: 'pointer'
                }}
              >
                <h3>{test.name}</h3>
                <p>{test.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Form Section */}
        {selectedTest && (
          <div>
            <h3>{selectedTest.name} Risk Assessment</h3>
            {selectedTest.name === 'ASCVD' && (
              <ASCVDForm 
                onSubmit={handleASCVDSubmit} 
                calculating={calculating}
              />
            )}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div>
            <h3>Test Results</h3>
            <div style={{ border: '1px solid #000', padding: '10px' }}>
              <h4>10-Year ASCVD Risk: {result.risk_percentage}%</h4>
              <p>Risk Category: {result.risk_category}</p>
              {result.message && <p>{result.message}</p>}
              {result.interpretation && <p>{result.interpretation}</p>}
              <p>Calculated on: {new Date(result.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Test History Section */}
        {testHistory.length > 0 && (
          <div>
            <h3>Your Test History</h3>
            <div>
              {testHistory.map((item) => (
                <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
                  <div>
                    <strong>{item.test_name}</strong>
                    <span> - {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span>{item.risk_percentage}% - </span>
                    <span>{item.risk_category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ASCVD Form Component
const ASCVDForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    age: '',
    sex: 'male',
    systolic_bp: '',
    total_chol: '', // Fixed: was 'total_chp' in the input below
    hdl_chol: '',
    egfr: '',
    is_smoker: false,
    is_diabetic: false,
    is_treated_bp: false,
    is_treated_chol: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert string values to numbers
    const numericData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      systolic_bp: parseInt(formData.systolic_bp) || 0,
      total_chol: parseInt(formData.total_chol) || 0, // Fixed
      hdl_chol: parseInt(formData.hdl_chol) || 0,
      egfr: parseInt(formData.egfr) || 0
    };

    onSubmit(numericData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div>
          <label htmlFor="age">Age (18-100 years)</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="18"
            max="100"
            required
          />
        </div>

        <div>
          <label htmlFor="sex">Sex</label>
          <select
            id="sex"
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label htmlFor="systolic_bp">Systolic Blood Pressure (mmHg)</label>
          <input
            type="number"
            id="systolic_bp"
            name="systolic_bp"
            value={formData.systolic_bp} // This line is correct
            onChange={handleChange}
            min="80"
            max="250"
            required
          />
        </div>

        <div>
          <label htmlFor="total_chol">Total Cholesterol (mg/dL)</label>
          <input
            type="number"
            id="total_chol"
            name="total_chol"
            value={formData.total_chol} // FIXED: was formData.total_chp
            onChange={handleChange}
            min="100"
            max="400"
            required
          />
        </div>

        <div>
          <label htmlFor="hdl_chol">HDL Cholesterol (mg/dL)</label>
          <input
            type="number"
            id="hdl_chol"
            name="hdl_chol"
            value={formData.hdl_chol}
            onChange={handleChange}
            min="20"
            max="100"
            required
          />
        </div>

        <div>
          <label htmlFor="egfr">eGFR (mL/min/1.73m²)</label>
          <input
            type="number"
            id="egfr"
            name="egfr"
            value={formData.egfr}
            onChange={handleChange}
            min="15"
            max="120"
            required
          />
        </div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            name="is_smoker"
            checked={formData.is_smoker}
            onChange={handleChange}
          />
          Current Smoker
        </label>

        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            name="is_diabetic"
            checked={formData.is_diabetic}
            onChange={handleChange}
          />
          Diabetic
        </label>

        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            name="is_treated_bp"
            checked={formData.is_treated_bp}
            onChange={handleChange}
          />
          On Blood Pressure Medication
        </label>

        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            name="is_treated_chol"
            checked={formData.is_treated_chol}
            onChange={handleChange}
          />
          On Cholesterol Medication
        </label>
      </div>

      <button 
        type="submit" 
        disabled={calculating}
      >
        {calculating ? 'Calculating...' : 'Calculate ASCVD Risk'}
      </button>
    </form>
  );
};

export default Dashboard;