"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/api";
import Image from "next/image"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
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
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.login(formData);
      setSuccess(response.message);
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyle = "border-1 rounded-md pl-3 pr-3 p-2";

  return (
    <div className="flex flex-col justify-center items-center h-screen p-8 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-100 overflow-hidden -mt-16 bg-[url(/login_bg.png)] ">
    {/* <Image src="/login_bg.png" width={100} height={0} className=""/> */}
      <div className="flex flex-col items-center justify-center bg-white p-15 rounded-3xl max-w-1/2 shadow-md">
        <h1 className="text-3xl font-bold">Sign in</h1>
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
            {success && <div style={{ color: "green" }}>{success}</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white w-full rounded-md p-2 mt-4"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
            <Link href="/register" className="mt-3">
              Don't have an account?{" "}
              <span className="underline">Register here!</span>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
