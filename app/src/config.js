import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the backend URL.
 * Priority:
 *   1. EXPO_PUBLIC_API_URL env var   (e.g. EXPO_PUBLIC_API_URL=https://api.mybank.lk)
 *   2. expo.extra.apiUrl in app.json
 *   3. In development: the same machine that serves the Metro bundler (port 5000),
 *      so a real phone on the same Wi-Fi reaches your laptop automatically.
 *   4. Android emulator fallback 10.0.2.2, otherwise localhost.
 */
const BACKEND_PORT = 5000;

function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const fromConfig = Constants.expoConfig?.extra?.apiUrl;
  if (fromConfig) return fromConfig;

  const hostUri = Constants.expoConfig?.hostUri; // "192.168.1.10:8081"
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:${BACKEND_PORT}`;

  return Platform.OS === "android"
    ? `http://10.0.2.2:${BACKEND_PORT}`
    : `http://localhost:${BACKEND_PORT}`;
}

export const API_URL = resolveApiUrl();
