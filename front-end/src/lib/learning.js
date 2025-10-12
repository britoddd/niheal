import { apiCall } from './api';

// Fetch and return the learning material object for a given slug
export const fetchLearning = async (slug) => {
  const res = await apiCall(`/api/learning/${slug}`);
  return Array.isArray(res.learning) ? res.learning[0] : res.learning;
};

// Convenience selector if callers already have the raw API response
export const selectLearning = (res) => (
  Array.isArray(res?.learning) ? res.learning[0] : res?.learning
);

// Fetch list of all learning materials for dashboard cards
export const fetchLearningList = async () => {
  const res = await apiCall('/api/learning');
  return res.list || [];
};
