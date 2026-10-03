import { createContext, useContext, useReducer, type ReactNode } from 'react';

import { carritos as carritosIniciales, getComercio, getProducto, type Carrito } from '@/fixtures';

// Plazo ilustrativo de un carrito nuevo; la regla real espera DEC-06.
const PLAZO_CARRITO_MS = 4 * 60 * 60 * 1000;

export type AddResult = { ok: true; carritoId: string } | { ok: false; reason: 'agotado' | 'sin-stock' | 'cerrado' | 'no-existe' };

type Action = { type: 'add'; productoId: string; cantidad: number; ahora: number };

function reducer(state: Carrito[], action: Action): Carrito[] {
  const producto = getProducto(action.productoId);
  if (!producto) return state;
  // Un carrito por comercio (RN-02/03); los vencidos no reciben productos nuevos.
  const actual = state.find((c) => c.comercioId === producto.comercioId && c.expiraEn > action.ahora);
  if (!actual) {
    const nuevo: Carrito = {
      id: `car-${producto.comercioId}-${action.ahora}`,
      comercioId: producto.comercioId,
      lineas: [{ productoId: producto.id, cantidad: action.cantidad }],
      expiraEn: action.ahora + PLAZO_CARRITO_MS,
    };
    return [...state, nuevo];
  }
  const existe = actual.lineas.some((l) => l.productoId === producto.id);
  const lineas = existe
    ? actual.lineas.map((l) => (l.productoId === producto.id ? { ...l, cantidad: l.cantidad + action.cantidad } : l))
    : [...actual.lineas, { productoId: producto.id, cantidad: action.cantidad }];
  return state.map((c) => (c.id === actual.id ? { ...c, lineas } : c));
}

type CartContextValue = {
  carritos: Carrito[];
  cantidadEnCarrito: (productoId: string, ahora: number) => number;
  agregar: (productoId: string, cantidad: number) => AddResult;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [carritos, dispatch] = useReducer(reducer, carritosIniciales);

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

  return <CartContext.Provider value={{ carritos, cantidadEnCarrito, agregar }}>{children}</CartContext.Provider>;
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
