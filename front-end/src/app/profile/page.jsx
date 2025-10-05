'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
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
        console.error('Error fetching profile data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

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

  if (loading) return 'Loading...';

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleBack} style={{ marginLeft: '10px' }}>
        Back to Dashboard
      </button>

      <h1>{user?.name || 'User'}'s Profile</h1>

      {message && <p>{message}</p>}

      <form onSubmit={handleSaveProfile}>
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={profile.name || ''}
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Birthdate:
          <input
            type="date"
            name="birthdate"
            value={profile.birthdate || ''}
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Weight (kg):
          <input
            type="number"
            name="weight"
            value={profile.weight || ''}
            onChange={handleChange}
          />
        </label>
        <br />

        <label>
          Height (cm):
          <input
            type="number"
            name="height"
            value={profile.height || ''}
            onChange={handleChange}
          />
        </label>
        <br />

        <button type="submit">Save Profile</button>
      </form>

      <h3>Profile Picture</h3>
      {profile.profile_picture && (
        <img
          src={`${API_URL}${profile.profile_picture}`}
          alt="Profile"
          width="150"
          height="150"
          style={{ display: 'block', marginBottom: '10px' }}
        />
      )}
      <input type="file" onChange={handleFileChange} />
    </div>
  );
};

export default Profile;