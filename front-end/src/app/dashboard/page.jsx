'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Fetch user + profile
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
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle profile form changes
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Save profile fields
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage('Error updating profile.');
    }
  };

  // Upload picture
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('picture', file);

    const res = await fetch(`${API_URL}/api/profile/picture`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();
    setMessage(data.message);
    if (data.profile_picture) {
      setProfile({ ...profile, profile_picture: data.profile_picture });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      <h1>Hello {user?.name || 'User'}</h1>

      {message && <p>{message}</p>}

      <form onSubmit={handleSaveProfile}>
        <input
          type="date"
          name="birthdate"
          value={profile.birthdate ? profile.birthdate.split('T')[0] : ''}
          onChange={handleChange}
        /><br/>

        <input
          type="number"
          step="0.01"
          name="weight"
          placeholder="Weight"
          value={profile.weight || ''}
          onChange={handleChange}
        /><br/>

        <input
          type="number"
          step="0.01"
          name="height"
          placeholder="Height"
          value={profile.height || ''}
          onChange={handleChange}
        /><br/>

        <button type="submit">Save Profile</button>
      </form>

      <h3>Profile Picture</h3>
      {profile.profile_picture && (
        <img
          src={`${API_URL}${profile.profile_picture}`}
          alt="Profile"
          width="150"
        />
      )}
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default Dashboard;