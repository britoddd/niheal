const API_BASE_URL = 'http://localhost:4000/api';

export const authAPI = {
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  },

  async checkAPIStatus() {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('API not available');
    }
    
    return data;
  }
};
