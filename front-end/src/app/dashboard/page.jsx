'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [tests, setTests] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTests, setShowTests] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, profileRes, testsRes, historyRes] = await Promise.all([
          apiCall('/api/user'),
          apiCall('/api/profile'),
          apiCall('/api/risk-tests'),
          apiCall('/api/test-history'),
        ]);

        setUser(userRes.user);
        setProfile(profileRes.profile || {});
        setTests(testsRes.tests || []);
        setTestHistory(historyRes.history || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (error.message === 'Not authenticated') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const toggleTests = () => {
    setShowTests(!showTests);
    setSelectedTest(null);
    setResult(null);
  };

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    setResult(null);
  };

  const refreshHistory = async () => {
    const historyRes = await apiCall('/api/test-history');
    setTestHistory(historyRes.history || []);
  };

  const handleSubmit = async (endpoint, formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setResult(resultData);
      await refreshHistory();
    } catch (error) {
      console.error('Error calculating risk:', error);
      alert('Error calculating risk: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return 'Loading...';

  return (
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

      <section>
        <h2>Health Risk Assessment</h2>
        <p>Mau apa hari ini?</p>

        {/* Tes Resiko Penyakit Card */}
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '10px',
            margin: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/doctor.png"
              alt="Doctor"
              width="100"
              height="100"
              style={{ borderRadius: '50%', marginRight: '10px' }}
            />
            <div>
              <h3>Tes Resiko Penyakit</h3>
              <p>Orang keren</p>
              <button onClick={toggleTests}>Mulai</button>
            </div>
          </div>

          {/* Show Disease Tests */}
          {showTests && (
            <div style={{ marginTop: '15px', paddingLeft: '20px' }}>
              {tests.map((test) => (
                <div
                  key={test.name}
                  onClick={() => handleTestSelect(test)}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{test.name}</strong>
                  <p>{test.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Learning Card */}
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '10px',
            margin: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/doctor.png"
              alt="Doctor"
              width="100"
              height="100"
              style={{ borderRadius: '50%', marginRight: '10px' }}
            />
            <div>
              <h3>Interactive Learning</h3>
              <p>Orang keren</p>
              <button>Mulai</button>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Test Section */}
      {selectedTest && (
        <section>
          <h3>{selectedTest.name} Risk Assessment</h3>
          {selectedTest.name === 'Heart and Stroke' && (
            <ASCVDForm
              onSubmit={(data) => handleSubmit('/api/calculate-ascvd', data)}
              calculating={calculating}
            />
          )}
          {selectedTest.name === 'Cancer' && (
            <CancerForm
              onSubmit={(data) => handleSubmit('/api/calculate-cancer', data)}
              calculating={calculating}
            />
          )}
          {selectedTest.name === 'Urology/Kidney' && (
            <KFREForm
              onSubmit={(data) => handleSubmit('/api/calculate-kfre', data)}
              calculating={calculating}
            />
          )}
        </section>
      )}

      {/* Test Result */}
      {result && (
        <section>
          <h3>Test Results</h3>
          {result.cancer_type ? (
            <>
              <p>
                {result.cancer_type.charAt(0).toUpperCase() +
                  result.cancer_type.slice(1)}{' '}
                Cancer Risk: {result.risk_percentage}% ({result.risk_category})
              </p>
            </>
          ) : result.model_type ? (
            <>
              <p>2-Year Kidney Failure Risk: {result.risk_2year}%</p>
              <p>5-Year Kidney Failure Risk: {result.risk_5year}%</p>
              <p>Category: {result.risk_category}</p>
            </>
          ) : (
            <>
              <p>10-Year ASCVD Risk: {result.risk_percentage}%</p>
              <p>Category: {result.risk_category}</p>
            </>
          )}
          <p>
            Calculated on:{' '}
            {new Date(result.created_at).toLocaleDateString()}
          </p>
        </section>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <section style={{ marginTop: '20px' }}>
          <h3>Your Test History</h3>
          <ul>
            {testHistory.map((item) => (
              <li key={item.id}>
                <strong>{item.test_name}</strong> –{' '}
                {new Date(item.created_at).toLocaleDateString()} –{' '}
                {item.risk_percentage}% ({item.risk_category})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

/* === Existing Forms (no style change) === */
const ASCVDForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    age: '',
    sex: 'male',
    systolic_bp: '',
    total_chol: '',
    hdl_chol: '',
    egfr: '',
    is_smoker: false,
    is_diabetic: false,
    is_treated_bp: false,
    is_treated_chol: false,
  });
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      age: +formData.age || 0,
      systolic_bp: +formData.systolic_bp || 0,
      total_chol: +formData.total_chol || 0,
      hdl_chol: +formData.hdl_chol || 0,
      egfr: +formData.egfr || 0,
    };
    onSubmit(data);
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>Age <input type="number" name="age" value={formData.age} onChange={handleChange} required /></label>
      <label>Sex 
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>
      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate ASCVD Risk'}
      </button>
    </form>
  );
};

const CancerForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({ age: '', sex: 'male', cancer_type: 'lung' });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, age: +formData.age || 0 });
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>Age <input type="number" name="age" value={formData.age} onChange={handleChange} /></label>
      <label>Sex 
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>
      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate Cancer Risk'}
      </button>
    </form>
  );
};

const KFREForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({ age: '', sex: 'male', egfr: '', acr: '' });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, age: +formData.age || 0, egfr: +formData.egfr || 0, acr: +formData.acr || 0 });
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>Age <input type="number" name="age" value={formData.age} onChange={handleChange} /></label>
      <label>eGFR <input type="number" name="egfr" value={formData.egfr} onChange={handleChange} /></label>
      <label>ACR <input type="number" name="acr" value={formData.acr} onChange={handleChange} /></label>
      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate Kidney Risk'}
      </button>
    </form>
  );
};

export default Dashboard;