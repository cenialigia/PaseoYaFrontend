import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

// DEC-10: un solo rol por usuario. El rol se lee de `perfiles`; la autorización real la imponen RLS y las funciones.
export type Rol = 'CLIENTE' | 'COMERCIO' | 'ADMIN';

export type Usuario = { id: string; nombre: string; email: string; rol: Rol; comercioId?: string };

export type ErrorAuth = 'credenciales' | 'email-en-uso' | 'datos-invalidos' | 'red';

type AuthContextValue = {
  usuario: Usuario | null;
  cargando: boolean;
  ingresar: (email: string, password: string) => Promise<ErrorAuth | null>;
  registrarCliente: (nombre: string, email: string, password: string) => Promise<ErrorAuth | null>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function cargarUsuario(session: Session | null): Promise<Usuario | null> {
  if (!session) return null;
  const { data, error } = await supabase.from('perfiles').select('id, nombre, rol, comercio_id').eq('id', session.user.id).single();
  if (error || !data) return null;
  return { id: data.id, nombre: data.nombre, email: session.user.email ?? '', rol: data.rol, comercioId: data.comercio_id ?? undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setUsuario(await cargarUsuario(data.session));
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      // Sin await dentro del callback: Supabase recomienda diferir llamadas a la API.
      setTimeout(async () => setUsuario(await cargarUsuario(session)), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const ingresar = async (email: string, password: string): Promise<ErrorAuth | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (!error) return null;
    return error.status === 400 ? 'credenciales' : 'red';
  };

  // Sólo CLIENTE se registra por sí mismo; el trigger del servidor fija el rol (DEC-10).
  const registrarCliente = async (nombre: string, email: string, password: string): Promise<ErrorAuth | null> => {
    const e = email.trim().toLowerCase();
    if (nombre.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || password.length < 8) return 'datos-invalidos';
    const { error } = await supabase.auth.signUp({ email: e, password, options: { data: { nombre: nombre.trim() } } });
    if (!error) return null;
    if (error.code === 'user_already_exists' || error.status === 422) return 'email-en-uso';
    return 'red';
  };

  const salir = async () => {
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ usuario, cargando, ingresar, registrarCliente, salir }}>{children}</AuthContext.Provider>;
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
  red: 'No se pudo conectar con el servidor. Intente de nuevo.',
};

export function rutaInicial(rol: Rol): '/explorar' | '/panel' | '/admin' {
  return rol === 'CLIENTE' ? '/explorar' : rol === 'COMERCIO' ? '/panel' : '/admin';
}
