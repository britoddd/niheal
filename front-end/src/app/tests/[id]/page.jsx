"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiCall } from "../../../lib/api";
import { ASCVDForm, CancerForm, KFREForm } from "../../dashboard/page";
import Link from "next/link";

const TestPage = () => {
  const router = useRouter();
  // Next app router's useParams in app directory is from next/navigation but in client components you'd get params via props; since this is client we fallback
  const params = useParams();
  const id = params?.id;
  const [test, setTest] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchTest = async () => {
      try {
        const res = await apiCall(`/api/risk-tests/${id}`);
        setTest(res.test);
      } catch (err) {
        console.error("Error loading test", err);
        router.push("/dashboard");
      }
    };
    fetchTest();
  }, [id, router]);

  const handleASCVDSubmit = async (formData) => {
    setCalculating(true);
    try {
      const resultData = await apiCall("/api/calculate-ascvd", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setResult(resultData);
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
    } catch (error) {
      console.error("Error calculating KFRE risk:", error);
      alert("Error calculating risk: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const renderForm = () => {
    if (!test) return null;
    const name = String(test.name || "").toLowerCase();
    if (
      name.includes("heart") ||
      name.includes("stroke") ||
      name.includes("ascvd")
    ) {
      return (
        <ASCVDForm onSubmit={handleASCVDSubmit} calculating={calculating} />
      );
    }
    if (name.includes("cancer")) {
      return (
        <CancerForm onSubmit={handleCancerSubmit} calculating={calculating} />
      );
    }
    if (
      name.includes("kidney") ||
      name.includes("urology") ||
      name.includes("kfre")
    ) {
      return <KFREForm onSubmit={handleKFRESubmit} calculating={calculating} />;
    }
    return <div>No form available for: {test.name}</div>;
  };

  if (!test) return <div>Loading test...</div>;

  return (
    <div className="w-full flex justify-center items-center bg-[url(/login_bg.png)] bg-cover bg-center h-screen">
      <div className="p-8 flex justify-center flex-col items-center w-full max-w-[524px]">
        <div className="flex w-full mb-10">
          <Link href={"/dashboard"} >
            <p className="hover:text-gray-400">&#60; Go Back to Dashboard</p>
          </Link>
        </div>
        <div className="bg-white p-8 rounded border-1 border-gray-100 shadow-md max-w-[450px] w-full">
          <h1 className="text-4xl font-bold mt-4 mb-2">{test.name}</h1>
          <p className="mb-8">{test.description}</p>
          {renderForm()}
        </div>

        {result && (
          <div className="mt-6 bg-green-50 p-4 rounded">
            <h3 className="font-bold">Result</h3>
            <div className="text-sm text-gray-700">
              <p>
                <strong>Risk Percentage:</strong>{" "}
                {!isNaN(Number(result?.risk_percentage))
                  ? `${Number(result.risk_percentage).toFixed(2)}%`
                  : result?.risk_percentage ?? "N/A"}
              </p>
              <p>
                <strong>Risk Category:</strong> {result?.risk_category || "N/A"}
              </p>
              <p>
                <strong>Interpretation:</strong>{" "}
                {result?.interpretation || "N/A"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
