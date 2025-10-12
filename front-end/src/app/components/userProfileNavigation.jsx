"use client";

import { AiOutlineUser } from "react-icons/ai";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { authAPI, apiCall } from "../../lib/api";
import { FaRegUserCircle } from "react-icons/fa";

const API_URL = "http://localhost:4000";

export default function UserProfileNavigation() {
  const [session, setSession] = useState(null); // null = unknown, false = not logged in, object = user
  const router = useRouter();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch profile when logged in
  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!session) {
        setProfile({});
        setLoading(false);
        return;
      }
      try {
        const res = await apiCall("/api/profile", { suppressAutoRedirect: true });
        if (!active) return;
        setProfile(res.profile || {});
      } catch (error) {
        if (!active) return;
        console.error("Error fetching profile:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [session]);

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
    // Listen for auth changes (login/logout) to refresh state reactively
    const onAuthChanged = () => {
      authAPI
        .getCurrentUser()
        .then((res) => setSession(res && res.user ? res.user : false))
        .catch(() => setSession(false));
    };
    if (typeof window !== "undefined") {
      window.addEventListener("auth:changed", onAuthChanged);
    }
    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:changed", onAuthChanged);
      }
    };
  }, []);

  // While we are checking session, render nothing (or a placeholder)
  if (session === null) return <div />;

  if (session) {
    return (
      <div>
        <a onClick={handleProfile} className="cursor-pointer">
          <Link href="/profile">
            {profile && profile.profile_picture ? (
              <img
                src={`${API_URL}${profile.profile_picture}`}
                alt="Profile"
                width={55}
                height={55}
                className="rounded-full border-2 border-gray-300 hover:scale-105 transition-transform object-cover"
              />
            ) : (
              <AiOutlineUser className="text-2xl" />
            )}
          </Link>
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
