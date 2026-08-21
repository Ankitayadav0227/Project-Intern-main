import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://project-intern-production.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
export { API_URL };