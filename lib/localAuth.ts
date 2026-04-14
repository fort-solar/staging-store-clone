"use client";

export type UserRole = "customer";

export type MockUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: UserRole;
  createdAt: string;
};

export type MockSession = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  signedInAt: string;
};

const USERS_KEY = "fortsolar_mock_users_v1";
const SESSION_KEY = "fortsolar_mock_session_v1";

const canUseStorage = () => typeof window !== "undefined";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readUsers = (): MockUser[] => {
  if (!canUseStorage()) return [];
  return safeParse<MockUser[]>(window.localStorage.getItem(USERS_KEY), []);
};

const writeUsers = (users: MockUser[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const writeSession = (session: MockSession) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getMockSession = (): MockSession | null => {
  if (!canUseStorage()) return null;
  return safeParse<MockSession | null>(
    window.localStorage.getItem(SESSION_KEY),
    null
  );
};

export const clearMockSession = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
};

export const getMockCurrentUser = (): MockUser | null => {
  const session = getMockSession();
  if (!session) return null;
  const users = readUsers();
  return users.find((user) => user.id === session.userId) ?? null;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: UserRole;
};

export const registerMockUser = (
  payload: RegisterPayload
): { session?: MockSession; error?: string } => {
  if (!canUseStorage()) {
    return { error: "Storage is not available in this environment." };
  }

  const users = readUsers();
  const email = payload.email.trim().toLowerCase();
  const existing = users.find((user) => user.email.toLowerCase() === email);
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const user: MockUser = {
    id: window.crypto?.randomUUID?.() ?? `user_${Date.now()}`,
    fullName: payload.fullName.trim(),
    email,
    phone: payload.phone.trim(),
    address: payload.address.trim(),
    password: payload.password,
    role: payload.role,
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, user]);

  const session: MockSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    signedInAt: new Date().toISOString(),
  };

  writeSession(session);
  return { session };
};

type LoginPayload = {
  email: string;
  password: string;
};

export const loginMockUser = (
  payload: LoginPayload
): { session?: MockSession; error?: string } => {
  if (!canUseStorage()) {
    return { error: "Storage is not available in this environment." };
  }

  const email = payload.email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find(
    (item) => item.email.toLowerCase() === email && item.password === payload.password
  );

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const session: MockSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    signedInAt: new Date().toISOString(),
  };

  writeSession(session);
  return { session };
};
