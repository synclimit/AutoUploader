import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
});

apiClient.interceptors.response.use(
  (response) => {
    // Standard response format: { success: true, data: {...}, meta: {...} }
    if (response.data && response.data.success) {
      if (response.config.url?.includes('generate-metadata')) {
        return response.data;
      }
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    // Global error parsing
    let errorMessage = "An unknown error occurred";
    if (error.response && error.response.data) {
      if (error.response.data.error) {
        errorMessage = error.response.data.error.message;
      } else if (error.response.data.detail) {
        // FastAPI standard error format
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const enhancedError = new Error(errorMessage);
    // Attach response so components can still access it if needed
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
