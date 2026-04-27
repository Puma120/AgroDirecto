/**
 * AuthContext — Contexto global de autenticación
 * Provee: currentUser, token, login, register, logout, isLoading
 * Persiste sesión en localStorage automáticamente
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockLogin, mockRegister, mockLogout, getStoredSession } from '../mocks/mockLogin';
import { STORAGE_KEYS, ROLES } from '../utils/constants';

// ─── Contexto ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token,       setToken]       = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);  // cargando sesión inicial
  const [authError,   setAuthError]   = useState(null);

  // Al montar: restaura sesión desde localStorage
  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setToken(session.token);
      setCurrentUser(session.user);
    }
    setIsLoading(false);
  }, []);

  /**
   * Inicia sesión y persiste en localStorage
   * @param {string} email
   * @param {string} password
   * @returns {Promise<boolean>} true si fue exitoso
   */
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const result = await mockLogin(email, password);
      if (!result) {
        setAuthError('Correo o contraseña incorrectos');
        return false;
      }
      setToken(result.token);
      setCurrentUser(result.user);
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(result.user));
      return true;
    } catch (err) {
      setAuthError(err.message || 'Error al iniciar sesión');
      return false;
    }
  }, []);

  /**
   * Registra nuevo usuario
   * @param {{ name, email, phone, password, role }} data
   * @returns {Promise<boolean>}
   */
  const register = useCallback(async (data) => {
    setAuthError(null);
    try {
      const result = await mockRegister(data);
      setToken(result.token);
      setCurrentUser(result.user);
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(result.user));
      return true;
    } catch (err) {
      setAuthError(err.message || 'Error al registrarse');
      return false;
    }
  }, []);

  /**
   * Entra como invitado (sin cuenta)
   */
  const loginAsGuest = useCallback(() => {
    const guestUser = {
      id:   'guest',
      name: 'Invitado',
      role: ROLES.GUEST,
    };
    setCurrentUser(guestUser);
    setToken('guest_token');
    // El invitado NO persiste en localStorage (solo sessionStorage)
    sessionStorage.setItem('agro_guest', 'true');
  }, []);

  /** Cierra sesión y limpia todo */
  const logout = useCallback(() => {
    mockLogout();
    sessionStorage.removeItem('agro_guest');
    setToken(null);
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  /** Helpers de rol */
  const isConsumer = currentUser?.role === ROLES.CONSUMER;
  const isProducer = currentUser?.role === ROLES.PRODUCER;
  const isGuest    = currentUser?.role === ROLES.GUEST;
  const isLoggedIn = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser,
      token,
      isLoading,
      authError,
      setAuthError,
      isLoggedIn,
      isConsumer,
      isProducer,
      isGuest,
      login,
      register,
      loginAsGuest,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────
/**
 * Accede al contexto de autenticación
 * Debe usarse dentro de <AuthProvider>
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
