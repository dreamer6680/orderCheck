import axios from "axios";
import { getOpenAPIDefinition } from "./generated";

export const http = axios.create({
  baseURL: "/backend",
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);

export const api = getOpenAPIDefinition(http);
