import { createContext, useContext, useState, type ReactNode } from 'react';

// DEC-10: un solo rol por usuario. Esta sesión es simulada; la autorización real vive en el backend (RLS).
export type Rol = 'CLIENTE' | 'COMERCIO' | 'ADMIN';

export type Usuario = { id: string; nombre: string; email: string; rol: Rol; comercioId?: string };

type Cuenta = Usuario & { password: string };

// Cuentas ficticias de demostración (ver README). COMERCIO y ADMIN no se registran desde la app.
const CUENTAS_DEMO: Cuenta[] = [
  { id: 'usr-cliente', nombre: 'Cliente Demo', email: 'cliente@paseoya.demo', password: 'demo1234', rol: 'CLIENTE' },
  { id: 'usr-techzone', nombre: 'TechZone', email: 'techzone@paseoya.demo', password: 'demo1234', rol: 'COMERCIO', comercioId: 'com-techzone' },
  { id: 'usr-boutique', nombre: 'Boutique Aranjuez', email: 'boutique@paseoya.demo', password: 'demo1234', rol: 'COMERCIO', comercioId: 'com-moda' },
  { id: 'usr-admin', nombre: 'Administración Paseo Aranjuez', email: 'admin@paseoya.demo', password: 'demo1234', rol: 'ADMIN' },
];

export type ErrorAuth = 'credenciales' | 'email-en-uso' | 'datos-invalidos';

type AuthContextValue = {
  usuario: Usuario | null;
  ingresar: (email: string, password: string) => ErrorAuth | null;
  registrarCliente: (nombre: string, email: string, password: string) => ErrorAuth | null;
  salir: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const sinPassword = ({ password: _password, ...u }: Cuenta): Usuario => u;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cuentas, setCuentas] = useState<Cuenta[]>(CUENTAS_DEMO);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const ingresar = (email: string, password: string): ErrorAuth | null => {
    const cuenta = cuentas.find((c) => c.email === email.trim().toLowerCase() && c.password === password);
    if (!cuenta) return 'credenciales';
    setUsuario(sinPassword(cuenta));
    return null;
  };

  // Sólo el rol CLIENTE puede registrarse por sí mismo (DEC-10).
  const registrarCliente = (nombre: string, email: string, password: string): ErrorAuth | null => {
    const e = email.trim().toLowerCase();
    if (nombre.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || password.length < 8) return 'datos-invalidos';
    if (cuentas.some((c) => c.email === e)) return 'email-en-uso';
    const cuenta: Cuenta = { id: `usr-${Date.now()}`, nombre: nombre.trim(), email: e, password, rol: 'CLIENTE' };
    setCuentas((cs) => [...cs, cuenta]);
    setUsuario(sinPassword(cuenta));
    return null;
  };

  return <AuthContext.Provider value={{ usuario, ingresar, registrarCliente, salir: () => setUsuario(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export const mensajeAuth: Record<ErrorAuth, string> = {
  credenciales: 'Correo o contraseña incorrectos.',
  'email-en-uso': 'Ya existe una cuenta con ese correo.',
  'datos-invalidos': 'Revise los datos: nombre de al menos 2 letras, correo válido y contraseña de 8 caracteres o más.',
};

export function rutaInicial(rol: Rol): '/explorar' | '/panel' | '/admin' {
  return rol === 'CLIENTE' ? '/explorar' : rol === 'COMERCIO' ? '/panel' : '/admin';
}
