"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess("");

    try {
      const response = await authAPI.register(formData);
      setSuccess(response.message);
      // Redirect to login after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      if (err.message.includes("errors")) {
        // Handle validation errors
        const errorData = JSON.parse(err.message);
        setErrors(errorData.errors || []);
      } else {
        setErrors([{ message: err.message }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyle = "border-1 rounded-md pl-3 pr-3 p-2";

  return (
    <div className="flex flex-col justify-center items-center h-screen p-8 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-100 overflow-hidden -mt-16">
      <div className="flex flex-col items-center justify-center bg-white p-15 rounded-3xl max-w-1/2 shadow-md">
        <h1 className="text-3xl font-bold">Register</h1>
        <div className="flex flex-col items-center justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex flex-col">
              <label for="email">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={textFieldStyle}
                required
              />
            </div>
            <div className="flex flex-col mt-2">
              <label for="password">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={textFieldStyle}
                required
              />
            </div>
            <div className="flex flex-col mt-2">
              <label for="password">Confirm Password</label>
              <input
                type="password"
                name="password2"
                placeholder="Confirm Password"
                value={formData.password2}
                onChange={handleChange}
                className={textFieldStyle}
                required
              />
            </div>
            {success && <div style={{ color: "green" }}>{success}</div>}
            {errors && errors.length > 0 && (
              <ul style={{ color: "red" }}>
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white w-full rounded-md p-2 mt-4"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
            <Link href="/login" className="mt-3">Have an account already? <span className="underline">Login here!</span></Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
