import axios from "axios";
import { API_URL } from "./config";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

// AuthContext registers a handler so an expired token logs the user out.
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && authToken && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Turns any axios error into a readable sentence.
export function errorMessage(error, fallback = "Something went wrong") {
  if (error.response) {
    return (
      error.response.data?.message ||
      error.response.data?.error ||
      `${fallback} (${error.response.status})`
    );
  }
  if (error.code === "ECONNABORTED") return "The server took too long to respond.";
  if (error.request) return `Can't reach the server at ${API_URL}. Check your connection and the API address.`;
  return error.message || fallback;
}

export default api;
