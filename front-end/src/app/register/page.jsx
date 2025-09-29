'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../lib/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess('');

    try {
      const response = await authAPI.register(formData);
      setSuccess(response.message);
      // Redirect to login after successful registration
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (err) {
      if (err.message.includes('errors')) {
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

  return (
    <div>
      <h1>Register</h1>

      {success && (
        <div style={{ color: 'green' }}>
          {success}
        </div>
      )}

      {errors && errors.length > 0 && (
        <ul style={{ color: 'red' }}>
          {errors.map((error, index) => (
            <li key={index}>{error.message}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <input 
            type="text" 
            name="name" 
            placeholder="Name" 
            value={formData.name}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <input 
            type="password" 
            name="password2" 
            placeholder="Confirm Password" 
            value={formData.password2}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
        <Link href="/login">Have an account already? Login here!</Link>
      </form>
    </div>
  );
};

export default Register;
