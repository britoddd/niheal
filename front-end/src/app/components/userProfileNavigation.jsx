"use client";

import { AiOutlineUser } from "react-icons/ai";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { authAPI } from "../../lib/api";

export default function UserProfileNavigation() {
  const [session, setSession] = useState(null); // null = unknown, false = not logged in, object = user
  const router = useRouter();

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
          <AiOutlineUser />
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
