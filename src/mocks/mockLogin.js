/**
 * Auth de AgroDirecto
 * Intenta la API real primero; si no responde, usa el mock local como fallback.
 */
import users from './users.json';
import { STORAGE_KEYS } from '../utils/constants';
import { API_BASE } from '../utils/api';

/** Simula latencia de red (solo en fallback) */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function generateMockToken(userId) {
  return btoa(`agro_${userId}_${Date.now()}`);
}

// ─── Helpers API ─────────────────────────────────────────────────────────────
async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function mockLogin(email, password) {
  // 1) Intentar API real
  try {
    return await apiPost('/api/auth/login', { email, password });
  } catch (err) {
    // Si es error de credenciales (401) no hacemos fallback — es una respuesta válida
    if (err.message.includes('incorrectos') || err.message.includes('401')) {
      return null;
    }
    // Error de red → fallback al mock local
    console.warn('[auth] API no disponible, usando mock local.');
  }

  // 2) Fallback local
  await delay(600);
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() &&
      u.password === password
  );
  if (!user) return null;
  const { password: _pwd, ...safeUser } = user;
  return { token: generateMockToken(user.id), user: safeUser };
}

// ─── Registro ────────────────────────────────────────────────────────────────
export async function mockRegister({ name, email, phone, password, role = 'consumer', farmName }) {
  // 1) Intentar API real
  try {
    return await apiPost('/api/auth/register', { name, email, password, role, farmName });
  } catch (err) {
    if (err.message.includes('registrado') || err.message.includes('409')) {
      throw new Error('Este correo ya está registrado');
    }
    console.warn('[auth] API no disponible, usando mock local.');
  }

  // 2) Fallback local
  await delay(800);
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) throw new Error('Este correo ya está registrado');

  const newUser = {
    id: `u_${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone,
    role,
    farmName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    addresses: [],
    preferences: { notifications: true, newsletter: true, favoriteCategories: [] },
    points: 0,
    referralCode: name.split(' ')[0].toUpperCase().slice(0, 6) + '24',
    referredBy: null,
    createdAt: new Date().toISOString(),
  };
  return { token: generateMockToken(newUser.id), user: newUser };
}

// ─── Sesión ───────────────────────────────────────────────────────────────────
export function getStoredSession() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const user  = localStorage.getItem(STORAGE_KEYS.USER);
    if (token && user) return { token, user: JSON.parse(user) };
  } catch {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
  return null;
}

export function mockLogout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export async function mockGetUser(userId) {
  await delay(400);
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const { password: _pwd, ...safeUser } = user;
  return safeUser;
}
