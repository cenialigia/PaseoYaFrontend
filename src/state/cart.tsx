import { createContext, useContext, useReducer, type ReactNode } from 'react';

import { getComercio, getProducto, type Carrito, type Linea } from '@/data';

// DEC-06: el carrito vence 4 h (tiempo corrido) después de su última modificación.
const PLAZO_CARRITO_MS = 4 * 60 * 60 * 1000;

export type AddResult = { ok: true; carritoId: string } | { ok: false; reason: 'agotado' | 'sin-stock' | 'cerrado' | 'no-existe' };

type Action =
  | { type: 'add'; productoId: string; cantidad: number; ahora: number }
  | { type: 'setCantidad'; carritoId: string; productoId: string; cantidad: number; ahora: number }
  | { type: 'eliminarCarrito'; carritoId: string }
  | { type: 'recuperar'; carritoId: string; lineas: Linea[]; ahora: number };

function nuevoCarrito(comercioId: string, lineas: Linea[], ahora: number): Carrito {
  return { id: `car-${comercioId}-${ahora}`, comercioId, lineas, expiraEn: ahora + PLAZO_CARRITO_MS };
}

function reducer(state: Carrito[], action: Action): Carrito[] {
  switch (action.type) {
    case 'add': {
      const producto = getProducto(action.productoId);
      if (!producto) return state;
      // Un carrito por comercio (RN-02/03); los vencidos no reciben productos nuevos.
      const actual = state.find((c) => c.comercioId === producto.comercioId && c.expiraEn > action.ahora);
      if (!actual) return [...state, nuevoCarrito(producto.comercioId, [{ productoId: producto.id, cantidad: action.cantidad }], action.ahora)];
      const existe = actual.lineas.some((l) => l.productoId === producto.id);
      const lineas = existe
        ? actual.lineas.map((l) => (l.productoId === producto.id ? { ...l, cantidad: l.cantidad + action.cantidad } : l))
        : [...actual.lineas, { productoId: producto.id, cantidad: action.cantidad }];
      return state.map((c) => (c.id === actual.id ? { ...c, lineas, expiraEn: action.ahora + PLAZO_CARRITO_MS } : c));
    }
    case 'setCantidad': {
      // Sólo toca el carrito indicado: editar uno nunca modifica otro.
      return state
        .map((c) => {
          if (c.id !== action.carritoId) return c;
          const lineas =
            action.cantidad <= 0
              ? c.lineas.filter((l) => l.productoId !== action.productoId)
              : c.lineas.map((l) => (l.productoId === action.productoId ? { ...l, cantidad: action.cantidad } : l));
          return { ...c, lineas, expiraEn: action.ahora + PLAZO_CARRITO_MS };
        })
        .filter((c) => c.lineas.length > 0);
    }
    case 'eliminarCarrito':
      return state.filter((c) => c.id !== action.carritoId);
    case 'recuperar': {
      const vencido = state.find((c) => c.id === action.carritoId);
      if (!vencido) return state;
      const resto = state.filter((c) => c.id !== action.carritoId);
      return action.lineas.length > 0 ? [...resto, nuevoCarrito(vencido.comercioId, action.lineas, action.ahora)] : resto;
    }
  }
}

export type ProblemaLinea = { productoId: string; tipo: 'agotado' | 'menos-stock'; disponible: number };

// Detecta líneas que ya no se pueden comprar tal cual (stock cambiante).
export function problemasDeCarrito(carrito: Carrito): ProblemaLinea[] {
  return carrito.lineas.flatMap<ProblemaLinea>((l) => {
    const stock = getProducto(l.productoId)?.stock ?? 0;
    if (stock === 0) return [{ productoId: l.productoId, tipo: 'agotado', disponible: 0 }];
    if (l.cantidad > stock) return [{ productoId: l.productoId, tipo: 'menos-stock', disponible: stock }];
    return [];
  });
}

type CartContextValue = {
  carritos: Carrito[];
  cantidadEnCarrito: (productoId: string, ahora: number) => number;
  agregar: (productoId: string, cantidad: number) => AddResult;
  cambiarCantidad: (carritoId: string, productoId: string, cantidad: number) => void;
  eliminarCarrito: (carritoId: string) => void;
  // Devuelve cuántas líneas se pudieron recuperar con el stock actual.
  recuperar: (carritoId: string) => { recuperadas: number; descartadas: number; cerrado: boolean };
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [carritos, dispatch] = useReducer(reducer, [] as Carrito[]);

  const cantidadEnCarrito = (productoId: string, ahora: number) => {
    const producto = getProducto(productoId);
    const carrito = carritos.find((c) => c.comercioId === producto?.comercioId && c.expiraEn > ahora);
    return carrito?.lineas.find((l) => l.productoId === productoId)?.cantidad ?? 0;
  };

  const agregar = (productoId: string, cantidad: number): AddResult => {
    const ahora = Date.now();
    const producto = getProducto(productoId);
    if (!producto) return { ok: false, reason: 'no-existe' };
    if (!getComercio(producto.comercioId)?.abierto) return { ok: false, reason: 'cerrado' };
    if (producto.stock === 0) return { ok: false, reason: 'agotado' };
    // Sólo comprueba disponibilidad en el cliente; no reserva stock (DEC-05).
    if (cantidadEnCarrito(productoId, ahora) + cantidad > producto.stock) return { ok: false, reason: 'sin-stock' };
    dispatch({ type: 'add', productoId, cantidad, ahora });
    const existente = carritos.find((c) => c.comercioId === producto.comercioId && c.expiraEn > ahora);
    return { ok: true, carritoId: existente?.id ?? `car-${producto.comercioId}-${ahora}` };
  };

  const cambiarCantidad = (carritoId: string, productoId: string, cantidad: number) =>
    dispatch({ type: 'setCantidad', carritoId, productoId, cantidad, ahora: Date.now() });

  const eliminarCarrito = (carritoId: string) => dispatch({ type: 'eliminarCarrito', carritoId });

  const recuperar = (carritoId: string) => {
    const ahora = Date.now();
    const vencido = carritos.find((c) => c.id === carritoId);
    if (!vencido) return { recuperadas: 0, descartadas: 0, cerrado: false };
    if (!getComercio(vencido.comercioId)?.abierto) return { recuperadas: 0, descartadas: 0, cerrado: true };
    const lineas = vencido.lineas.flatMap((l) => {
      const stock = getProducto(l.productoId)?.stock ?? 0;
      return stock > 0 ? [{ productoId: l.productoId, cantidad: Math.min(l.cantidad, stock) }] : [];
    });
    const yaActivo = carritos.some((c) => c.comercioId === vencido.comercioId && c.expiraEn > ahora);
    if (yaActivo) {
      // Si ya hay un carrito activo del comercio, se suman las líneas a él en lugar de crear otro.
      lineas.forEach((l) => dispatch({ type: 'add', productoId: l.productoId, cantidad: l.cantidad, ahora }));
      dispatch({ type: 'eliminarCarrito', carritoId });
    } else {
      dispatch({ type: 'recuperar', carritoId, lineas, ahora });
    }
    return { recuperadas: lineas.length, descartadas: vencido.lineas.length - lineas.length, cerrado: false };
  };

  return (
    <CartContext.Provider value={{ carritos, cantidadEnCarrito, agregar, cambiarCantidad, eliminarCarrito, recuperar }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}

export const motivoNoAgregado: Record<Exclude<AddResult, { ok: true }>['reason'], string> = {
  agotado: 'Este producto está agotado.',
  'sin-stock': 'No hay más unidades disponibles de este producto.',
  cerrado: 'El comercio está cerrado en este momento.',
  'no-existe': 'El producto ya no está disponible.',
};
