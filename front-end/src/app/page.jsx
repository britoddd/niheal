'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authAPI } from '../lib/api';

const Index = () => {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const response = await authAPI.checkAPIStatus();
        setApiStatus(response.message);
        setIsConnected(true);
      } catch (error) {
        setApiStatus('Backend not connected');
        setIsConnected(false);
      }
    };

    checkAPI();
  }, []);

  return (
    <div>
      <h1>Home</h1>
      <p>API Status: <span style={{ color: isConnected ? 'green' : 'red' }}>{apiStatus}</span></p>
      <Link href="/login">Login</Link>
      <br />
      <Link href="/register">Register</Link>
    </div>
  );
};

export default Index;
