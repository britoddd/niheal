"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiCall } from "../../lib/api"; // Use the new apiCall function
import Container from "./container";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
            apiCall("/api/user"),
            apiCall("/api/profile"),
            apiCall("/api/risk-tests"),
            apiCall("/api/test-history"),
          ]);

        setUser(userResponse.user);
        setProfile(profileData.profile || {});
        setTests(testsData.tests || []);
        setTestHistory(historyData.history || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Redirect to login if not authenticated
        if (error.message === "Not authenticated") {
          router.push("/login");
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
      const resultData = await apiCall("/api/calculate-ascvd", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setResult(resultData);

      // Refresh history
      const historyData = await apiCall("/api/test-history");
      setTestHistory(historyData.history || []);
    } catch (error) {
      console.error("Error calculating ASCVD risk:", error);
      alert("Error calculating risk: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return "Loading...";

  return (
    <div className="flex flex-col justify-center items-center h-screen p-8 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-100 overflow-hidden -mt-16 bg-[url(/login_bg.png)] ">
      <div className="flex flex-col items-center justify-center bg-white p-15 rounded-3xl w-[1024px] shadow-md">
        <h1 className="text-4xl font-bold">
          Selamat datang, {user?.name || "User"}
        </h1>

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

        <section className="w-full flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col justify-center items-center mt-10">
            <h2 className="text-2xl font-bold mb-0">Health Risk Assessment</h2>
            <p>Mau apa hari ini?</p>
          </div>

          <Container
            title={"Tes Resiko Penyakit"}
            description={"Orang keren"}
            source={"/3d_avatar_17.png"}
          />
          <Container
            title={"Interactive Learning"}
            description={"Orang keren"}
            source={"/3d_avatar_17.png"}
          />
        </section>

        {/* Test Form Section */}
        {selectedTest && (
          <section>
            <h3>{selectedTest.name} Risk Assessment</h3>
            {selectedTest.name === "ASCVD" && (
              <ASCVDForm
                onSubmit={handleASCVDSubmit}
                calculating={calculating}
              />
            )}
          </section>
        )}

        {/* Results Section */}
        {result && (
          <section>
            <h3>Test Results</h3>
            <p>10-Year ASCVD Risk: {result.risk_percentage}%</p>
            <p>Risk Category: {result.risk_category}</p>
            {result.message && <p>{result.message}</p>}
            {result.interpretation && <p>{result.interpretation}</p>}
            <p>
              Calculated on: {new Date(result.created_at).toLocaleDateString()}
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
                  <strong>{item.test_name}</strong> -{" "}
                  {new Date(item.created_at).toLocaleDateString()} -{" "}
                  {item.risk_percentage}% ({item.risk_category})
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

// ASCVD Form Component
const ASCVDForm = ({ onSubmit, calculating }) => {
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
        {calculating ? "Calculating..." : "Calculate ASCVD Risk"}
      </button>
    </form>
  );
};

export default Dashboard;
