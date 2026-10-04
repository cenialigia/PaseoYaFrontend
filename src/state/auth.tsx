import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { base64ABytes } from '@/lib/format';
import { supabase } from '@/lib/supabase';

// DEC-10: un solo rol por usuario. El rol se lee de `perfiles`; la autorización real la imponen RLS y las funciones.
export type Rol = 'CLIENTE' | 'COMERCIO' | 'ADMIN';
export type Genero = 'FEMENINO' | 'MASCULINO' | 'OTRO' | 'PREFIERO_NO_DECIR';

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  comercioId?: string;
  telefono?: string;
  genero?: Genero;
  fechaNacimiento?: string;
  avatarPath?: string;
};

export type DatosRegistro = { nombre: string; email: string; password: string; telefono: string; genero: Genero; fechaNacimiento: string };
export type DatosPerfil = Pick<Usuario, 'nombre' | 'telefono' | 'genero' | 'fechaNacimiento'>;

export type ErrorAuth = 'credenciales' | 'email-en-uso' | 'datos-invalidos' | 'codigo' | 'red';

type AuthContextValue = {
  usuario: Usuario | null;
  cargando: boolean;
  // Tras registrarse se ofrece una vez el paso «Agrega tu foto» (CLI-04).
  pendienteFoto: boolean;
  terminarFoto: () => void;
  ingresar: (email: string, password: string) => Promise<ErrorAuth | null>;
  registrarCliente: (datos: DatosRegistro) => Promise<ErrorAuth | null>;
  actualizarPerfil: (datos: DatosPerfil) => Promise<boolean>;
  subirAvatar: (base64: string, mime: string) => Promise<boolean>;
  urlAvatar: () => Promise<string | null>;
  enviarCodigoRecuperacion: (email: string) => Promise<ErrorAuth | null>;
  restablecerContrasena: (email: string, codigo: string, nueva: string) => Promise<ErrorAuth | null>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function cargarUsuario(session: Session | null): Promise<Usuario | null> {
  if (!session) return null;
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, comercio_id, telefono, genero, fecha_nacimiento, avatar_path')
    .eq('id', session.user.id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    nombre: data.nombre,
    email: session.user.email ?? '',
    rol: data.rol,
    comercioId: data.comercio_id ?? undefined,
    telefono: data.telefono ?? undefined,
    genero: data.genero ?? undefined,
    fechaNacimiento: data.fecha_nacimiento ?? undefined,
    avatarPath: data.avatar_path ?? undefined,
  };
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const TELEFONO = /^\+?[0-9 ]{7,16}$/;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pendienteFoto, setPendienteFoto] = useState(false);

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

  const recargarUsuario = async () => {
    const { data } = await supabase.auth.getSession();
    setUsuario(await cargarUsuario(data.session));
  };

  const ingresar = async (email: string, password: string): Promise<ErrorAuth | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (!error) return null;
    return error.status === 400 ? 'credenciales' : 'red';
  };

  // Sólo CLIENTE se registra por sí mismo; el trigger del servidor fija el rol y guarda los datos (DEC-10, DEC-F14-08).
  const registrarCliente = async (d: DatosRegistro): Promise<ErrorAuth | null> => {
    const email = d.email.trim().toLowerCase();
    if (d.nombre.trim().length < 2 || !EMAIL.test(email) || d.password.length < 8 || !TELEFONO.test(d.telefono.trim())) return 'datos-invalidos';
    setPendienteFoto(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: d.password,
      options: { data: { nombre: d.nombre.trim(), telefono: d.telefono.trim(), genero: d.genero, fecha_nacimiento: d.fechaNacimiento } },
    });
    if (!error) return null;
    setPendienteFoto(false);
    if (error.code === 'user_already_exists' || error.status === 422) return 'email-en-uso';
    return 'red';
  };

  const actualizarPerfil = async (d: DatosPerfil): Promise<boolean> => {
    if (!usuario) return false;
    const { error } = await supabase
      .from('perfiles')
      .update({ nombre: d.nombre, telefono: d.telefono ?? null, genero: d.genero ?? null, fecha_nacimiento: d.fechaNacimiento ?? null })
      .eq('id', usuario.id);
    if (!error) await recargarUsuario();
    return !error;
  };

  // DEC-F14-16: avatar privado en avatares/<uid>/; sólo su dueño puede leerlo o cambiarlo.
  // fetch(uri).arrayBuffer() no lee bien archivos locales en React Native: se sube desde base64.
  const subirAvatar = async (base64: string, mime: string): Promise<boolean> => {
    if (!usuario) return false;
    try {
      const datos = base64ABytes(base64);
      if (datos.length < 100) return false;
      const ruta = `${usuario.id}/avatar-${Date.now()}.${mime === 'image/png' ? 'png' : 'jpg'}`;
      const subida = await supabase.storage.from('avatares').upload(ruta, datos, { contentType: mime, upsert: true });
      if (subida.error) return false;
      const { error } = await supabase.from('perfiles').update({ avatar_path: ruta }).eq('id', usuario.id);
      if (error) return false;
      await recargarUsuario();
      return true;
    } catch {
      return false;
    }
  };

  const urlAvatar = async (): Promise<string | null> => {
    if (!usuario?.avatarPath) return null;
    const { data } = await supabase.storage.from('avatares').createSignedUrl(usuario.avatarPath, 3600);
    return data?.signedUrl ?? null;
  };

  // DEC-F14-09: código de 6 dígitos por correo, sin enlaces profundos.
  const enviarCodigoRecuperacion = async (email: string): Promise<ErrorAuth | null> => {
    const e = email.trim().toLowerCase();
    if (!EMAIL.test(e)) return 'datos-invalidos';
    const { error } = await supabase.auth.resetPasswordForEmail(e);
    return error ? 'red' : null;
  };

  const restablecerContrasena = async (email: string, codigo: string, nueva: string): Promise<ErrorAuth | null> => {
    if (nueva.length < 8 || !/^\d{6}$/.test(codigo.trim())) return 'datos-invalidos';
    const v = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: codigo.trim(), type: 'recovery' });
    if (v.error) return 'codigo';
    const u = await supabase.auth.updateUser({ password: nueva });
    return u.error ? 'red' : null;
  };

  const salir = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        pendienteFoto,
        terminarFoto: () => setPendienteFoto(false),
        ingresar,
        registrarCliente,
        actualizarPerfil,
        subirAvatar,
        urlAvatar,
        enviarCodigoRecuperacion,
        restablecerContrasena,
        salir,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export const mensajeAuth: Record<ErrorAuth, string> = {
  credenciales: 'Correo o contraseña incorrectos.',
  'email-en-uso': 'Ya existe una cuenta con ese correo.',
  'datos-invalidos': 'Revisa los datos marcados.',
  codigo: 'El código no es válido o ya venció. Pide uno nuevo.',
  red: 'No se pudo conectar con el servidor. Intenta de nuevo.',
};

// Tras registrarse, el cliente pasa una vez por «Agrega tu foto» (CLI-04).
export function rutaInicial(rol: Rol, pendienteFoto = false): '/inicio' | '/foto-perfil' | '/panel' | '/admin' {
  if (rol === 'CLIENTE') return pendienteFoto ? '/foto-perfil' : '/inicio';
  return rol === 'COMERCIO' ? '/panel' : '/admin';
}

export const etiquetaGenero: Record<Genero, string> = {
  FEMENINO: 'Femenino',
  MASCULINO: 'Masculino',
  OTRO: 'Otro',
  PREFIERO_NO_DECIR: 'Prefiero no decirlo',
};
