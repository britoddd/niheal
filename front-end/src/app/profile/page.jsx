"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/api";
import { FaRegUserCircle } from "react-icons/fa";

const API_URL = "http://localhost:4000";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await authAPI.getCurrentUser();
        setUser(userResponse.user);

        const profileRes = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
        });

        const profileData = await profileRes.json();

        // ✅ Ensure date is in yyyy-mm-dd format (so <input type="date"> works)
        if (profileData.profile?.birthdate) {
          const date = new Date(profileData.profile.birthdate);
          profileData.profile.birthdate = date.toISOString().split("T")[0];
        }

        setProfile(profileData.profile || {});
      } catch (error) {
        console.error("Error fetching profile data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      // ✅ Send all profile fields, including birthdate
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Profile updated!");

        // ✅ Keep profile state after saving
        setProfile((prev) => ({
          ...prev,
          birthdate: profile.birthdate, // preserve date
          weight: profile.weight,
          height: profile.height,
        }));
      } else {
        setMessage("Error updating profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("Error updating profile.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("picture", file);

    const res = await fetch(`${API_URL}/api/profile/picture`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.profile_picture) {
      setProfile({ ...profile, profile_picture: data.profile_picture });
    }
  };

  if (loading) return "Loading...";

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-8 sm:p-20 bg-gray-100 bg-[url(/login_bg.png)] bg-cover bg-center">
      <div className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl max-w-[1080px] w-full shadow-lg">
        <div className="flex flex-row justify-between w-full mb-5">
          <button className="cursor-pointer hover:text-gray-400" onClick={handleBack} style={{ marginLeft: "10px" }}>
            &#60; Back to Dashboard
          </button>
          <button className="cursor-pointer hover:text-gray-400" onClick={handleLogout}>Logout</button>
        </div>

        <h1 className="text-4xl font-bold mb-5">
          {user?.name || "User"}'s Profile
        </h1>

        {profile.profile_picture ? (
          <img
            src={`${API_URL}${profile.profile_picture}`}
            alt="Profile"
            width="150"
            height="150"
            style={{ display: "block", marginBottom: "10px" }}
          />
        ) : (
          <FaRegUserCircle className="text-[100px]" />
        )}
        <input type="file" className="mb-10" onChange={handleFileChange} />

        <form
          onSubmit={handleSaveProfile}
          className="flex flex-col items-center"
        >
          <div>
            <div className="flex flex-row">
              <label className="flex justify-between w-30 font-bold">
                Birthdate
              </label>
              <input
                type="date"
                name="birthdate"
                value={profile.birthdate || ""}
                onChange={handleChange}
                className="w-full max-w-[160px]"
              />
            </div>

            <div className="flex flex-row justify-center items-center">
              <label className="flex justify-between w-30 font-bold">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={profile.weight || ""}
                onChange={handleChange}
                className="w-full max-w-[160px]"
              />
            </div>

            <div className="flex flex-row">
              <label className="flex justify-between w-30 font-bold">
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                value={profile.height || ""}
                onChange={handleChange}
                className="w-full max-w-[160px]"
              />
            </div>
          </div>

          {message && <p className="mt-5">{message}</p>}
          <button
            type="submit"
            className="bg-gray-100 p-2 pl-7 pr-7 rounded-sm mt-5"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
