// Real auth service to call backend
import { API_BASE_URL } from "../config/apiConfig";

export type AuthResponse = {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  isNewUser?: boolean;
  error?: string;
};

export async function signup(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return res.json();
}

export async function validate(token: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/validate`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function logout(token: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}