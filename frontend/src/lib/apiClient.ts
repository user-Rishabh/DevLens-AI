const getApiBaseUrl = (): string => {
  let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
  url = url.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = `https://${url}`;
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

export const API_BASE_URL = getApiBaseUrl();
