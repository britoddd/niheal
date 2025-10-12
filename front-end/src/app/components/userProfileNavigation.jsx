"use client";

import { AiOutlineUser } from "react-icons/ai";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { authAPI } from "../../lib/api";

export default function UserProfileNavigation() {
  const [session, setSession] = useState(null); // null = unknown, false = not logged in, object = user
  const router = useRouter();
  const [profile, setProfile] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes] = await Promise.all([apiCall("/api/profile")]);

        setProfile(profileRes.profile || {});
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

  const handleLogin = () => {
    router.push("/login");
  };
  const handleRegister = () => {
    router.push("/register");
  };
  const handleProfile = () => {
    router.push("/profile");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await authAPI.getCurrentUser();
        if (!mounted) return;
        // backend returns { user: req.user } when authenticated
        if (res && res.user) {
          setSession(res.user);
        } else {
          setSession(false);
        }
      } catch (err) {
        // If API returns 401 or any error, user not authenticated
        setSession(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // While we are checking session, render nothing (or a placeholder)
  if (session === null) return <div />;

  if (session) {
    return (
      <div>
        <a onClick={handleProfile} className="cursor-pointer">
          {profile.profile_picture ? (
            <img
              src={`${API_URL}${profile.profile_picture}`}
              alt="Profile"
              width="100"
              height="100"
              className="rounded-full border-2 border-gray-300 mt-2 hover:scale-105 transition-transform"
            />
          ) : (
            <button className="text-2xl px-4 py-2 rounded-xl hover:text-gray-400 flex justify-center items-center">
              <AiOutlineUser />
            </button>
          )}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-row justify-center items-center gap-2">
      <button
        className="bg-black text-white rounded-md p-2 w-25"
        onClick={handleLogin}
      >
        Login
      </button>
      <button
        className="bg-white text-black border-1 rounded-md p-2 w-25"
        onClick={handleRegister}
      >
        Register
      </button>
    </div>
  );
}
