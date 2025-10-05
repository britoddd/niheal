const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Generic API call with auth handling
const apiCall = async (endpoint, options = {}) => {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Use the correct URL structure: API_BASE_URL + endpoint (endpoint already includes /api)
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      // Redirect to login if not authenticated (only in browser)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Not authenticated');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.status}`);
  }

  return response.json();
};

export const authAPI = {
  async register(userData) {
    return apiCall('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials) {
    return apiCall('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout() {
    return apiCall('/api/logout', {
      method: 'POST',
    });
  },

  async getCurrentUser() {
    return apiCall('/api/user');
  },

  async checkAPIStatus() {
    return apiCall('/api/');
  }
};

// Profile API functions
export const profileAPI = {
  async getProfile() {
    return apiCall('/api/profile');
  },

  async updateProfile(profileData) {
    return apiCall('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async uploadProfilePicture(formData) {
    // For file upload, we need to use FormData and remove Content-Type header
    const response = await fetch(`${API_BASE_URL}/api/profile/picture`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // FormData will set the Content-Type automatically
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload profile picture');
    }

    return response.json();
  }
};

// Risk Assessment API functions
export const riskAPI = {
  async getRiskTests() {
    return apiCall('/api/risk-tests');
  },

  async calculateASCVD(ascvdData) {
    return apiCall('/api/calculate-ascvd', {
      method: 'POST',
      body: JSON.stringify(ascvdData),
    });
  },

  async getTestHistory() {
    return apiCall('/api/test-history');
  }
};

// Export the main apiCall function for custom calls
export { apiCall };

// Default export with all API functions
export default {
  auth: authAPI,
  profile: profileAPI,
  risk: riskAPI,
  apiCall
};