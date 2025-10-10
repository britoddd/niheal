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
        const [userResponse, profileData, testsData, historyData] =
          await Promise.all([
            apiCall('/api/user'),
            apiCall('/api/profile'),
            apiCall('/api/risk-tests'),
            apiCall('/api/test-history'),
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

  const handleCancerSubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall('/api/calculate-cancer', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setResult(resultData);

      // Refresh history
      const historyData = await apiCall('/api/test-history');
      setTestHistory(historyData.history || []);
    } catch (error) {
      console.error('Error calculating cancer risk:', error);
      alert('Error calculating risk: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleKFRESubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall('/api/calculate-kfre', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setResult(resultData);

      // Refresh history
      const historyData = await apiCall('/api/test-history');
      setTestHistory(historyData.history || []);
    } catch (error) {
      console.error('Error calculating KFRE risk:', error);
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

      {/* Disease Selection Section */}
      <section>
        <h2>Health Risk Assessment</h2>
        <p>Select a disease to check your risk:</p>

        {tests.map((test) => (
          <div
            key={test.name}
            onClick={() => handleTestSelect(test)}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              margin: '5px',
              cursor: 'pointer',
            }}
          >
            <strong>{test.name}</strong>
            <p>{test.description}</p>
          </div>
        ))}
      </section>

      {/* Test Form Section */}
      {selectedTest && (
        <section>
          <h3>{selectedTest.name} Risk Assessment</h3>
          {selectedTest.name === 'Heart and Stroke' && (
            <ASCVDForm
              onSubmit={handleASCVDSubmit}
              calculating={calculating}
            />
          )}
          {selectedTest.name === 'Cancer' && (
            <CancerForm
              onSubmit={handleCancerSubmit}
              calculating={calculating}
            />
          )}
          {selectedTest.name === 'Urology/Kidney' && (
            <KFREForm
              onSubmit={handleKFRESubmit}
              calculating={calculating}
            />
          )}
        </section>
      )}

      {/* Results Section */}
      {result && (
        <section>
          <h3>Test Results</h3>
          {result.cancer_type ? (
            // Cancer Results
            <>
              <p>{result.cancer_type.charAt(0).toUpperCase() + result.cancer_type.slice(1)} Cancer Risk: {result.risk_percentage}%</p>
              <p>Risk Category: {result.risk_category}</p>
              {result.message && <p>{result.message}</p>}
              <p>Relative Risk: {result.relative_risk}x</p>
            </>
          ) : result.model_type ? (
            // KFRE Results
            <>
              <p>2-Year Kidney Failure Risk: {result.risk_2year}%</p>
              <p>5-Year Kidney Failure Risk: {result.risk_5year}%</p>
              <p>Risk Category: {result.risk_category}</p>
              {result.interpretation && <p>{result.interpretation}</p>}
              {result.model_type && <p>Model: {result.model_type === 'competing_risk' ? 'Competing Risk Model' : 'Standard Model'}</p>}
            </>
          ) : (
            // ASCVD Results
            <>
              <p>10-Year ASCVD Risk: {result.risk_percentage}%</p>
              <p>Risk Category: {result.risk_category}</p>
              {result.message && <p>{result.message}</p>}
              {result.interpretation && <p>{result.interpretation}</p>}
            </>
          )}
          <p>
            Calculated on:{' '}
            {new Date(result.created_at).toLocaleDateString()}
          </p>
        </section>
      )}

      {/* Test History Section */}
      {testHistory.length > 0 && (
        <section>
          <h3>Your Test History</h3>
          <ul>
            {testHistory.map((item) => (
              <li key={item.id}>
                <strong>{item.test_name}</strong> -{' '}
                {new Date(item.created_at).toLocaleDateString()} -{' '}
                {item.risk_percentage}% ({item.risk_category})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

// ASCVD Form Component
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
    // Convert string values to numbers
    const numericData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      systolic_bp: parseInt(formData.systolic_bp) || 0,
      total_chol: parseInt(formData.total_chol) || 0,
      hdl_chol: parseInt(formData.hdl_chol) || 0,
      egfr: parseInt(formData.egfr) || 0,
    };
    onSubmit(numericData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Age (18-100 years)
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Sex
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
      </label>

      <label>
        Systolic Blood Pressure (mmHg)
        <input
          type="number"
          name="systolic_bp"
          value={formData.systolic_bp}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Total Cholesterol (mg/dL)
        <input
          type="number"
          name="total_chol"
          value={formData.total_chol}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        HDL Cholesterol (mg/dL)
        <input
          type="number"
          name="hdl_chol"
          value={formData.hdl_chol}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        eGFR (mL/min/1.73m²)
        <input
          type="number"
          name="egfr"
          value={formData.egfr}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        <input
          type="checkbox"
          name="is_smoker"
          checked={formData.is_smoker}
          onChange={handleChange}
        />
        Current Smoker
      </label>

      <label>
        <input
          type="checkbox"
          name="is_diabetic"
          checked={formData.is_diabetic}
          onChange={handleChange}
        />
        Diabetic
      </label>

      <label>
        <input
          type="checkbox"
          name="is_treated_bp"
          checked={formData.is_treated_bp}
          onChange={handleChange}
        />
        On Blood Pressure Medication
      </label>

      <label>
        <input
          type="checkbox"
          name="is_treated_chol"
          checked={formData.is_treated_chol}
          onChange={handleChange}
        />
        On Cholesterol Medication
      </label>

      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate ASCVD Risk'}
      </button>
    </form>
  );
};

// Cancer Form Component
const CancerForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    cancer_type: 'lung',
    age: '',
    sex: 'male',
    bmi: '',
    smoking_years: '',
    cigarettes_per_day: '',
    years_since_quit: '',
    alcohol_consumption: '',
    family_history: false,
    physical_activity: '',
    // Lung cancer specific
    asbestos_exposure: false,
    copd: false,
    // Breast cancer specific
    age_first_birth: '',
    menarche_age: '',
    menopausal_status: false,
    hormone_therapy: false,
    // Colon cancer specific
    red_meat_consumption: '',
    vegetable_consumption: '',
    // Prostate cancer specific
    diet_fat: ''
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
    // Convert string values to numbers where appropriate
    const processedData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      bmi: parseFloat(formData.bmi) || 0,
      smoking_years: parseInt(formData.smoking_years) || 0,
      cigarettes_per_day: parseInt(formData.cigarettes_per_day) || 0,
      years_since_quit: parseInt(formData.years_since_quit) || 0,
      alcohol_consumption: parseFloat(formData.alcohol_consumption) || 0,
      physical_activity: parseFloat(formData.physical_activity) || 0,
      age_first_birth: formData.age_first_birth ? parseInt(formData.age_first_birth) : null,
      menarche_age: formData.menarche_age ? parseInt(formData.menarche_age) : null,
      red_meat_consumption: parseFloat(formData.red_meat_consumption) || 0,
      vegetable_consumption: parseFloat(formData.vegetable_consumption) || 0,
      diet_fat: parseFloat(formData.diet_fat) || 0
    };
    onSubmit(processedData);
  };

  const renderCommonFields = () => (
    <>
      <label>
        Age (18-100 years)
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          min="18"
          max="100"
          required
        />
      </label>

      <label>
        Sex
        <select name="sex" value={formData.sex} onChange={handleChange} required>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>

      <label>
        BMI
        <input
          type="number"
          name="bmi"
          value={formData.bmi}
          onChange={handleChange}
          step="0.1"
          min="15"
          max="50"
        />
      </label>

      <label>
        Smoking History (years)
        <input
          type="number"
          name="smoking_years"
          value={formData.smoking_years}
          onChange={handleChange}
          min="0"
          max="80"
        />
      </label>

      <label>
        Cigarettes per Day (if smoker)
        <input
          type="number"
          name="cigarettes_per_day"
          value={formData.cigarettes_per_day}
          onChange={handleChange}
          min="0"
          max="100"
        />
      </label>

      <label>
        Years Since Quit (if former smoker)
        <input
          type="number"
          name="years_since_quit"
          value={formData.years_since_quit}
          onChange={handleChange}
          min="0"
          max="80"
        />
      </label>

      <label>
        Alcohol Consumption (drinks/week)
        <input
          type="number"
          name="alcohol_consumption"
          value={formData.alcohol_consumption}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="50"
        />
      </label>

      <label>
        Physical Activity (hours/week)
        <input
          type="number"
          name="physical_activity"
          value={formData.physical_activity}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="50"
        />
      </label>

      <label>
        <input
          type="checkbox"
          name="family_history"
          checked={formData.family_history}
          onChange={handleChange}
        />
        Family History of Cancer
      </label>
    </>
  );

  const renderLungCancerFields = () => (
    <>
      <label>
        <input
          type="checkbox"
          name="asbestos_exposure"
          checked={formData.asbestos_exposure}
          onChange={handleChange}
        />
        Asbestos Exposure
      </label>

      <label>
        <input
          type="checkbox"
          name="copd"
          checked={formData.copd}
          onChange={handleChange}
        />
        COPD Diagnosis
      </label>
    </>
  );

  const renderBreastCancerFields = () => (
    <>
      <label>
        Age at First Birth
        <input
          type="number"
          name="age_first_birth"
          value={formData.age_first_birth}
          onChange={handleChange}
          min="15"
          max="50"
        />
      </label>

      <label>
        Age at Menarche
        <input
          type="number"
          name="menarche_age"
          value={formData.menarche_age}
          onChange={handleChange}
          min="8"
          max="20"
        />
      </label>

      <label>
        <input
          type="checkbox"
          name="menopausal_status"
          checked={formData.menopausal_status}
          onChange={handleChange}
        />
        Post-Menopausal
      </label>

      <label>
        <input
          type="checkbox"
          name="hormone_therapy"
          checked={formData.hormone_therapy}
          onChange={handleChange}
        />
        Hormone Therapy
      </label>
    </>
  );

  const renderColonCancerFields = () => (
    <>
      <label>
        Red Meat Consumption (servings/week)
        <input
          type="number"
          name="red_meat_consumption"
          value={formData.red_meat_consumption}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="20"
        />
      </label>

      <label>
        Vegetable Consumption (servings/day)
        <input
          type="number"
          name="vegetable_consumption"
          value={formData.vegetable_consumption}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="10"
        />
      </label>
    </>
  );

  const renderProstateCancerFields = () => (
    <>
      <label>
        High-Fat Diet (scale 1-10)
        <input
          type="number"
          name="diet_fat"
          value={formData.diet_fat}
          onChange={handleChange}
          min="1"
          max="10"
        />
      </label>
    </>
  );

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Cancer Type
        <select name="cancer_type" value={formData.cancer_type} onChange={handleChange} required>
          <option value="lung">Lung Cancer</option>
          <option value="breast">Breast Cancer</option>
          <option value="colon">Colon Cancer</option>
          <option value="prostate">Prostate Cancer</option>
        </select>
      </label>

      {renderCommonFields()}

      {formData.cancer_type === 'lung' && renderLungCancerFields()}
      {formData.cancer_type === 'breast' && renderBreastCancerFields()}
      {formData.cancer_type === 'colon' && renderColonCancerFields()}
      {formData.cancer_type === 'prostate' && renderProstateCancerFields()}

      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate Cancer Risk'}
      </button>
    </form>
  );
};

// KFRE Form Component
const KFREForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    age: '',
    sex: 'male',
    egfr: '',
    acr: '',
    egfr_slope: '',
    heart_failure: false,
    model_type: 'standard'
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
    // Convert string values to numbers
    const numericData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      egfr: parseFloat(formData.egfr) || 0,
      acr: parseFloat(formData.acr) || 0,
      egfr_slope: formData.egfr_slope ? parseFloat(formData.egfr_slope) : 0
    };
    onSubmit(numericData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Age (18-100 years)
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          min="18"
          max="100"
          required
        />
      </label>

      <label>
        Sex
        <select name="sex" value={formData.sex} onChange={handleChange} required>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>

      <label>
        eGFR (mL/min/1.73 m²)
        <input
          type="number"
          name="egfr"
          value={formData.egfr}
          onChange={handleChange}
          min="15"
          max="200"
          step="0.1"
          required
        />
      </label>

      <label>
        Urine Albumin-to-Creatinine Ratio (ACR, mg/g)
        <input
          type="number"
          name="acr"
          value={formData.acr}
          onChange={handleChange}
          min="1"
          step="0.1"
          required
        />
      </label>

      <label>
        eGFR Slope (ml/min/1.73 m² per year, optional)
        <input
          type="number"
          name="egfr_slope"
          value={formData.egfr_slope}
          onChange={handleChange}
          step="0.1"
          placeholder="e.g., -2.5 for decline"
        />
      </label>

      <label>
        <input
          type="checkbox"
          name="heart_failure"
          checked={formData.heart_failure}
          onChange={handleChange}
        />
        History of Heart Failure
      </label>

      <label>
        Model Type
        <select name="model_type" value={formData.model_type} onChange={handleChange}>
          <option value="standard">Standard Model</option>
          <option value="competing_risk">Competing Risk Model</option>
        </select>
      </label>

      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate Kidney Failure Risk'}
      </button>
    </form>
  );
};

export default Dashboard;