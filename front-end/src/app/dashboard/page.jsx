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
  const [selectedTest, setSelectedTest] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
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

      const historyData = await apiCall('/api/test-history');
      setTestHistory(historyData.history || []);
    } catch (error) {
      console.error('Error calculating cancer risk:', error);
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
          {selectedTest.name === 'ASCVD' && (
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
    // Common factors
    family_history: false,
    alcohol_consumption: '',
    // Prostate specific
    psa: '',
    dre_abnormal: false,
    african_american: false,
    prior_biopsy: false,
    free_psa_percent: '',
    // Lung specific
    smoking_years: '',
    cigarettes_per_day: '',
    years_since_quit: '',
    copd: false,
    personal_cancer_history: false,
    education_years: '',
    asbestos_exposure: false,
    // Breast specific
    menarche_age: '',
    age_first_birth: '',
    first_degree_relatives: '',
    breast_biopsies: '',
    atypical_hyperplasia: false,
    hormone_therapy: false,
    // Colorectal specific
    smoking_pack_years: '',
    alcohol_drinks_day: '',
    red_meat_oz: '',
    family_history_colon: false,
    diabetes: false,
    physical_activity: '',
    aspirin_use: false,
    multivitamin_use: false,
    nsaid_use: false,
    estrogen_use: false
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
    const processedData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      bmi: parseFloat(formData.bmi) || 0,
      alcohol_consumption: parseFloat(formData.alcohol_consumption) || 0,
      // Prostate
      psa: formData.psa ? parseFloat(formData.psa) : null,
      free_psa_percent: formData.free_psa_percent ? parseFloat(formData.free_psa_percent) : null,
      // Lung
      smoking_years: parseInt(formData.smoking_years) || 0,
      cigarettes_per_day: parseInt(formData.cigarettes_per_day) || 0,
      years_since_quit: parseInt(formData.years_since_quit) || 0,
      education_years: formData.education_years ? parseInt(formData.education_years) : null,
      // Breast
      menarche_age: formData.menarche_age ? parseInt(formData.menarche_age) : null,
      age_first_birth: formData.age_first_birth ? parseInt(formData.age_first_birth) : null,
      first_degree_relatives: parseInt(formData.first_degree_relatives) || 0,
      breast_biopsies: parseInt(formData.breast_biopsies) || 0,
      // Colorectal
      smoking_pack_years: parseInt(formData.smoking_pack_years) || 0,
      alcohol_drinks_day: parseFloat(formData.alcohol_drinks_day) || 0,
      red_meat_oz: parseFloat(formData.red_meat_oz) || 0,
      physical_activity: parseFloat(formData.physical_activity) || 0
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

  const renderProstateFields = () => (
    <>
      <label>
        PSA Level (ng/mL)
        <input
          type="number"
          name="psa"
          value={formData.psa}
          onChange={handleChange}
          step="0.1"
          min="0.1"
          max="100"
        />
      </label>

      <label>
        Free PSA Percentage (%)
        <input
          type="number"
          name="free_psa_percent"
          value={formData.free_psa_percent}
          onChange={handleChange}
          min="1"
          max="100"
        />
      </label>

      <label>
        <input
          type="checkbox"
          name="dre_abnormal"
          checked={formData.dre_abnormal}
          onChange={handleChange}
        />
        Abnormal Digital Rectal Exam
      </label>

      <label>
        <input
          type="checkbox"
          name="african_american"
          checked={formData.african_american}
          onChange={handleChange}
        />
        African American Race
      </label>

      <label>
        <input
          type="checkbox"
          name="prior_biopsy"
          checked={formData.prior_biopsy}
          onChange={handleChange}
        />
        Prior Negative Biopsy
      </label>
    </>
  );

  const renderLungFields = () => (
    <>
      <label>
        Smoking Duration (years)
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
        Cigarettes per Day
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
        Years Since Quit
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
        Education (years)
        <input
          type="number"
          name="education_years"
          value={formData.education_years}
          onChange={handleChange}
          min="0"
          max="25"
        />
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

      <label>
        <input
          type="checkbox"
          name="personal_cancer_history"
          checked={formData.personal_cancer_history}
          onChange={handleChange}
        />
        Personal Cancer History
      </label>

      <label>
        <input
          type="checkbox"
          name="asbestos_exposure"
          checked={formData.asbestos_exposure}
          onChange={handleChange}
        />
        Asbestos Exposure
      </label>
    </>
  );

  const renderBreastFields = () => (
    <>
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
        First-degree Relatives with Breast Cancer
        <input
          type="number"
          name="first_degree_relatives"
          value={formData.first_degree_relatives}
          onChange={handleChange}
          min="0"
          max="5"
        />
      </label>

      <label>
        Number of Breast Biopsies
        <input
          type="number"
          name="breast_biopsies"
          value={formData.breast_biopsies}
          onChange={handleChange}
          min="0"
          max="10"
        />
      </label>

      <label>
        <input
          type="checkbox"
          name="atypical_hyperplasia"
          checked={formData.atypical_hyperplasia}
          onChange={handleChange}
        />
        Atypical Hyperplasia
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

  const renderColorectalFields = () => (
    <>
      <label>
        Smoking (pack-years)
        <input
          type="number"
          name="smoking_pack_years"
          value={formData.smoking_pack_years}
          onChange={handleChange}
          min="0"
          max="200"
        />
      </label>

      <label>
        Alcohol (drinks/day)
        <input
          type="number"
          name="alcohol_drinks_day"
          value={formData.alcohol_drinks_day}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="20"
        />
      </label>

      <label>
        Red Meat (oz/day)
        <input
          type="number"
          name="red_meat_oz"
          value={formData.red_meat_oz}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="20"
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
          name="family_history_colon"
          checked={formData.family_history_colon}
          onChange={handleChange}
        />
        Family History of Colon Cancer
      </label>

      <label>
        <input
          type="checkbox"
          name="diabetes"
          checked={formData.diabetes}
          onChange={handleChange}
        />
        Diabetes
      </label>

      <label>
        <input
          type="checkbox"
          name="aspirin_use"
          checked={formData.aspirin_use}
          onChange={handleChange}
        />
        Regular Aspirin Use
      </label>

      <label>
        <input
          type="checkbox"
          name="multivitamin_use"
          checked={formData.multivitamin_use}
          onChange={handleChange}
        />
        Regular Multivitamin Use
      </label>

      <label>
        <input
          type="checkbox"
          name="nsaid_use"
          checked={formData.nsaid_use}
          onChange={handleChange}
        />
        Regular NSAID Use
      </label>

      {formData.sex === 'female' && (
        <label>
          <input
            type="checkbox"
            name="estrogen_use"
            checked={formData.estrogen_use}
            onChange={handleChange}
          />
          Estrogen Use
        </label>
      )}
    </>
  );

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Cancer Type
        <select name="cancer_type" value={formData.cancer_type} onChange={handleChange} required>
          <option value="lung">Lung Cancer</option>
          <option value="breast">Breast Cancer</option>
          <option value="colorectal">Colorectal Cancer</option>
          <option value="prostate">Prostate Cancer</option>
        </select>
      </label>

      {renderCommonFields()}

      {formData.cancer_type === 'prostate' && renderProstateFields()}
      {formData.cancer_type === 'lung' && renderLungFields()}
      {formData.cancer_type === 'breast' && renderBreastFields()}
      {formData.cancer_type === 'colorectal' && renderColorectalFields()}

      <button type="submit" disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate Cancer Risk'}
      </button>
    </form>
  );
};

export default Dashboard;