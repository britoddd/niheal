"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiCall } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
          apiCall("/api/user"),
          apiCall("/api/profile"),
          apiCall("/api/risk-tests"),
          apiCall("/api/test-history"),
        ]);

        setUser(userRes.user);
        setProfile(profileRes.profile || {});
        setTests(testsRes.tests || []);
        setTestHistory(historyRes.history || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.message === "Not authenticated") {
          router.push("/login");
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
    const historyRes = await apiCall("/api/test-history");
    setTestHistory(historyRes.history || []);
  };

  const handleASCVDSubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall("/api/calculate-ascvd", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setResult(resultData);
      await refreshHistory();
    } catch (error) {
      console.error("Error calculating ASCVD risk:", error);
      alert("Error calculating risk: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleCancerSubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall("/api/calculate-cancer", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setResult(resultData);
      await refreshHistory();
    } catch (error) {
      console.error("Error calculating cancer risk:", error);
      alert("Error calculating risk: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleKFRESubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall("/api/calculate-kfre", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setResult(resultData);
      await refreshHistory();
    } catch (error) {
      console.error("Error calculating KFRE risk:", error);
      alert("Error calculating risk: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  // Helper to decide which form to render based on selectedTest.name
  const renderSelectedForm = () => {
    if (!selectedTest) return null;
    const name = String(selectedTest.name || "").toLowerCase();

    // Match common variants
    if (name.includes("heart") || name.includes("stroke") || name.includes("ascvd")) {
      return (
        <ASCVDForm onSubmit={handleASCVDSubmit} calculating={calculating} />
      );
    }
    if (name.includes("cancer")) {
      return (
        <CancerForm onSubmit={handleCancerSubmit} calculating={calculating} />
      );
    }
    if (name.includes("kidney") || name.includes("urology") || name.includes("kfre")) {
      return (
        <KFREForm onSubmit={handleKFRESubmit} calculating={calculating} />
      );
    }

    // Fallback: no matching form
    return (
      <div className="mt-4">
        <p>No form available for: <strong>{selectedTest.name}</strong></p>
      </div>
    );
  };

  if (loading) return "Loading...";

  return (
    <section className="flex flex-col justify-center items-center min-h-screen p-8 sm:p-20 bg-gray-100 bg-[url(/login_bg.png)] bg-cover bg-center">
      <div className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl w-[1024px] shadow-lg">
        
        {/* === PROFILE SECTION === */}
        <div className="flex flex-col items-center text-center mb-10 border-b border-gray-200 pb-6 w-full">
          <h1 className="text-4xl font-bold mb-3">
            Selamat datang, {user?.name || "User"}
          </h1>
          <Link href="/profile">
            {profile.profile_picture ? (
              <img
                src={`${API_URL}${profile.profile_picture}`}
                alt="Profile"
                width="100"
                height="100"
                className="rounded-full border-2 border-gray-300 mt-2 hover:scale-105 transition-transform"
              />
            ) : (
              <button className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 mt-2">
                Go to Profile
              </button>
            )}
          </Link>
        </div>

        {/* === DISEASE SELECTION === */}
        <section className="w-full flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-0">Health Risk Assessment</h2>
            <p className="text-gray-600">Mau apa hari ini?</p>
          </div>

          {/* Tes Resiko Penyakit */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-[90%] sm:w-[600px] text-left hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <img
                src="/3d_avatar_17.png"
                alt="Doctor"
                width="80"
                height="80"
                className="rounded-full"
              />
              <div className="flex flex-col flex-1">
                <h3 className="text-lg font-semibold">Tes Resiko Penyakit</h3>
                <p className="text-sm text-gray-600">Orang keren</p>
                <button
                  onClick={toggleTests}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 w-fit"
                >
                  {showTests ? "Tutup" : "Mulai"}
                </button>
              </div>
            </div>

            {showTests && (
              <div className="mt-5 space-y-3 pl-6">
                {tests.map((test) => (
                  <div
                    key={test.name}
                    onClick={() => handleTestSelect(test)}
                    className="border border-gray-200 rounded-xl p-3 hover:bg-blue-50 cursor-pointer"
                  >
                    <strong className="block text-blue-700">{test.name}</strong>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* === RENDER SELECTED TEST FORM (Option 1) === */}
            {selectedTest && (
              <div className="mt-6 p-4 border rounded-xl bg-gray-50">
                <h4 className="text-lg font-semibold mb-3">
                  {selectedTest.name} Form
                </h4>
                {renderSelectedForm()}
              </div>
            )}
            {/* === end selected form === */}
          </div>

          {/* Interactive Learning */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-[90%] sm:w-[600px] text-left hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <img
                src="/3d_avatar_17.png"
                alt="Doctor"
                width="80"
                height="80"
                className="rounded-full"
              />
              <div className="flex flex-col flex-1">
                <h3 className="text-lg font-semibold">Interactive Learning</h3>
                <p className="text-sm text-gray-600">Orang keren</p>
                <button className="mt-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 w-fit">
                  Mulai
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* === RESULT & HISTORY === */}
        {result && (
          <section className="w-full max-w-xl mt-10 bg-green-50 border border-green-200 rounded-2xl shadow p-6 text-left">
            <h3 className="text-lg font-bold mb-2">Test Results</h3>

            <div className="text-sm text-gray-700">
              {result.cancer_type ? (
                // Cancer Results
                <>
                  <p>
                    {result.cancer_type.charAt(0).toUpperCase() +
                      result.cancer_type.slice(1)}{" "}
                    Cancer Risk: {result.risk_percentage}%
                  </p>
                  <p>Risk Category: {result.risk_category}</p>
                  {result.message && <p>{result.message}</p>}
                  {result.relative_risk !== undefined && (
                    <p>Relative Risk: {result.relative_risk}x</p>
                  )}
                </>
              ) : result.model_type ? (
                // KFRE Results
                <>
                  {result.risk_2year !== undefined && (
                    <p>2-Year Kidney Failure Risk: {result.risk_2year}%</p>
                  )}
                  {result.risk_5year !== undefined && (
                    <p>5-Year Kidney Failure Risk: {result.risk_5year}%</p>
                  )}
                  <p>Risk Category: {result.risk_category}</p>
                  {result.interpretation && <p>{result.interpretation}</p>}
                  {result.model_type && (
                    <p>
                      Model:{" "}
                      {result.model_type === "competing_risk"
                        ? "Competing Risk Model"
                        : "Standard Model"}
                    </p>
                  )}
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
              <p className="mt-2">
                Calculated on: {new Date(result.created_at).toLocaleDateString()}
              </p>
            </div>
          </section>
        )}

        {testHistory.length > 0 && (
          <section className="w-full max-w-xl mt-10 p-6 bg-gray-50 rounded-2xl shadow text-left">
            <h3 className="text-lg font-semibold mb-3">Your Test History</h3>
            <ul className="list-disc list-inside space-y-2">
              {testHistory.map((item) => (
                <li key={item.id}>
                  <strong>{item.test_name}</strong> –{" "}
                  {new Date(item.created_at).toLocaleDateString()} –{" "}
                  {item.risk_percentage}% ({item.risk_category})
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
};

export default Dashboard;

// ASCVD Form Component
export const ASCVDForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    age: "",
    sex: "male",
    systolic_bp: "",
    total_chol: "",
    hdl_chol: "",
    egfr: "",
    is_smoker: false,
    is_diabetic: false,
    is_treated_bp: false,
    is_treated_chol: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        Age (18-100 years)
        <input
          className="block mt-1 w-full"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </label>

      <label className="block">
        Sex
        <select
          className="block mt-1 w-full"
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

      <label className="block">
        Systolic Blood Pressure (mmHg)
        <input
          className="block mt-1 w-full"
          type="number"
          name="systolic_bp"
          value={formData.systolic_bp}
          onChange={handleChange}
          required
        />
      </label>

      <label className="block">
        Total Cholesterol (mg/dL)
        <input
          className="block mt-1 w-full"
          type="number"
          name="total_chol"
          value={formData.total_chol}
          onChange={handleChange}
          required
        />
      </label>

      <label className="block">
        HDL Cholesterol (mg/dL)
        <input
          className="block mt-1 w-full"
          type="number"
          name="hdl_chol"
          value={formData.hdl_chol}
          onChange={handleChange}
          required
        />
      </label>

      <label className="block">
        eGFR (mL/min/1.73m²)
        <input
          className="block mt-1 w-full"
          type="number"
          name="egfr"
          value={formData.egfr}
          onChange={handleChange}
          required
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_smoker"
          checked={formData.is_smoker}
          onChange={handleChange}
        />
        Current Smoker
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_diabetic"
          checked={formData.is_diabetic}
          onChange={handleChange}
        />
        Diabetic
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_treated_bp"
          checked={formData.is_treated_bp}
          onChange={handleChange}
        />
        On Blood Pressure Medication
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_treated_chol"
          checked={formData.is_treated_chol}
          onChange={handleChange}
        />
        On Cholesterol Medication
      </label>

      <button
        type="submit"
        disabled={calculating}
        className="mt-2 inline-block px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {calculating ? "Calculating..." : "Calculate ASCVD Risk"}
      </button>
    </form>
  );
};

// Cancer Form Component
export const CancerForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    cancer_type: "lung",
    age: "",
    sex: "male",
    bmi: "",
    smoking_years: "",
    cigarettes_per_day: "",
    years_since_quit: "",
    alcohol_consumption: "",
    family_history: false,
    physical_activity: "",
    asbestos_exposure: false,
    copd: false,
    age_first_birth: "",
    menarche_age: "",
    menopausal_status: false,
    hormone_therapy: false,
    red_meat_consumption: "",
    vegetable_consumption: "",
    diet_fat: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      bmi: parseFloat(formData.bmi) || 0,
      smoking_years: parseInt(formData.smoking_years) || 0,
      cigarettes_per_day: parseInt(formData.cigarettes_per_day) || 0,
      years_since_quit: parseInt(formData.years_since_quit) || 0,
      alcohol_consumption: parseFloat(formData.alcohol_consumption) || 0,
      physical_activity: parseFloat(formData.physical_activity) || 0,
      age_first_birth: formData.age_first_birth
        ? parseInt(formData.age_first_birth)
        : null,
      menarche_age: formData.menarche_age ? parseInt(formData.menarche_age) : null,
      red_meat_consumption: parseFloat(formData.red_meat_consumption) || 0,
      vegetable_consumption: parseFloat(formData.vegetable_consumption) || 0,
      diet_fat: parseFloat(formData.diet_fat) || 0,
    };
    onSubmit(processedData);
  };

  const renderCommonFields = () => (
    <>
      <label className="block">
        Age (18-100 years)
        <input
          className="block mt-1 w-full"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          min="18"
          max="100"
          required
        />
      </label>

      <label className="block">
        Sex
        <select
          className="block mt-1 w-full"
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          required
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>

      <label className="block">
        BMI
        <input
          className="block mt-1 w-full"
          type="number"
          name="bmi"
          value={formData.bmi}
          onChange={handleChange}
          step="0.1"
          min="15"
          max="50"
        />
      </label>

      <label className="block">
        Smoking History (years)
        <input
          className="block mt-1 w-full"
          type="number"
          name="smoking_years"
          value={formData.smoking_years}
          onChange={handleChange}
          min="0"
          max="80"
        />
      </label>

      <label className="block">
        Cigarettes per Day (if smoker)
        <input
          className="block mt-1 w-full"
          type="number"
          name="cigarettes_per_day"
          value={formData.cigarettes_per_day}
          onChange={handleChange}
          min="0"
          max="100"
        />
      </label>

      <label className="block">
        Years Since Quit (if former smoker)
        <input
          className="block mt-1 w-full"
          type="number"
          name="years_since_quit"
          value={formData.years_since_quit}
          onChange={handleChange}
          min="0"
          max="80"
        />
      </label>

      <label className="block">
        Alcohol Consumption (drinks/week)
        <input
          className="block mt-1 w-full"
          type="number"
          name="alcohol_consumption"
          value={formData.alcohol_consumption}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="50"
        />
      </label>

      <label className="block">
        Physical Activity (hours/week)
        <input
          className="block mt-1 w-full"
          type="number"
          name="physical_activity"
          value={formData.physical_activity}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="50"
        />
      </label>

      <label className="flex items-center gap-2">
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
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="asbestos_exposure"
          checked={formData.asbestos_exposure}
          onChange={handleChange}
        />
        Asbestos Exposure
      </label>

      <label className="flex items-center gap-2">
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
      <label className="block">
        Age at First Birth
        <input
          className="block mt-1 w-full"
          type="number"
          name="age_first_birth"
          value={formData.age_first_birth}
          onChange={handleChange}
          min="15"
          max="50"
        />
      </label>

      <label className="block">
        Age at Menarche
        <input
          className="block mt-1 w-full"
          type="number"
          name="menarche_age"
          value={formData.menarche_age}
          onChange={handleChange}
          min="8"
          max="20"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="menopausal_status"
          checked={formData.menopausal_status}
          onChange={handleChange}
        />
        Post-Menopausal
      </label>

      <label className="flex items-center gap-2">
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
      <label className="block">
        Red Meat Consumption (servings/week)
        <input
          className="block mt-1 w-full"
          type="number"
          name="red_meat_consumption"
          value={formData.red_meat_consumption}
          onChange={handleChange}
          step="0.1"
          min="0"
          max="20"
        />
      </label>

      <label className="block">
        Vegetable Consumption (servings/day)
        <input
          className="block mt-1 w-full"
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
      <label className="block">
        High-Fat Diet (scale 1-10)
        <input
          className="block mt-1 w-full"
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        Cancer Type
        <select
          className="block mt-1 w-full"
          name="cancer_type"
          value={formData.cancer_type}
          onChange={handleChange}
          required
        >
          <option value="lung">Lung Cancer</option>
          <option value="breast">Breast Cancer</option>
          <option value="colon">Colon Cancer</option>
          <option value="prostate">Prostate Cancer</option>
        </select>
      </label>

      {renderCommonFields()}

      {formData.cancer_type === "lung" && renderLungCancerFields()}
      {formData.cancer_type === "breast" && renderBreastCancerFields()}
      {formData.cancer_type === "colon" && renderColonCancerFields()}
      {formData.cancer_type === "prostate" && renderProstateCancerFields()}

      <button
        type="submit"
        disabled={calculating}
        className="mt-2 inline-block px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {calculating ? "Calculating..." : "Calculate Cancer Risk"}
      </button>
    </form>
  );
};

// KFRE Form Component
export const KFREForm = ({ onSubmit, calculating }) => {
  const [formData, setFormData] = useState({
    age: "",
    sex: "male",
    egfr: "",
    acr: "",
    model_type: "standard",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      egfr: parseFloat(formData.egfr) || 0,
      acr: parseFloat(formData.acr) || 0,
    };
    onSubmit(numericData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <strong>Standard Kidney Failure Risk Equation (KFRE)</strong>
        <p className="text-sm text-gray-600">
          Based on validated 4-variable model (Age, Sex, eGFR, ACR) from Tangri et al. 2011
        </p>
      </div>

      <label className="block">
        Age (18-100 years)
        <input
          className="block mt-1 w-full"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          min="18"
          max="100"
          required
        />
      </label>

      <label className="block">
        Sex
        <select
          className="block mt-1 w-full"
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          required
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>

      <label className="block">
        eGFR (mL/min/1.73 m²)
        <input
          className="block mt-1 w-full"
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

      <label className="block">
        Urine Albumin-to-Creatinine Ratio (ACR, mg/g)
        <input
          className="block mt-1 w-full"
          type="number"
          name="acr"
          value={formData.acr}
          onChange={handleChange}
          min="1"
          step="0.1"
          required
        />
      </label>

      <label className="block">
        Model Type
        <select
          className="block mt-1 w-full"
          name="model_type"
          value={formData.model_type}
          onChange={handleChange}
        >
          <option value="standard">Standard KFRE Model</option>
          <option value="competing_risk">Competing Risk Model (Research)</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={calculating}
        className="mt-2 inline-block px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {calculating ? "Calculating..." : "Calculate Kidney Failure Risk"}
      </button>
    </form>
  );
};