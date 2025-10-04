'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await authAPI.getCurrentUser();
        setUser(userResponse.user);

        const profileRes = await fetch(`${API_URL}/api/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        const profileData = await profileRes.json();
        setProfile(profileData.profile || {});
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) return <div>Loading...</div>;

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
    </div>
  );
};

export default Dashboard;