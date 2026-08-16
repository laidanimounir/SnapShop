import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  variant_id: string;
  product_id: string;
  name: string;
  srcUrl: string;
  color: string;
  size: string;
  price: number;
  originalPrice: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  totalQuantities: number;
};

interface CartsState {
  cart: Cart | null;
  subtotal: number;
  total: number;
}

const initialState: CartsState = {
  cart: null,
  subtotal: 0,
  total: 0,
};

export const cartsSlice = createSlice({
  name: "carts",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload;
      if (state.cart === null) {
        state.cart = { items: [item], totalQuantities: item.quantity };
      } else {
        const existing = state.cart.items.find(
          (i) => i.variant_id === item.variant_id
        );
        if (existing) {
          state.cart.items = state.cart.items.map((i) =>
            i.variant_id === item.variant_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          state.cart.items = [...state.cart.items, item];
        }
        state.cart.totalQuantities = state.cart.items.reduce(
          (sum, i) => sum + i.quantity,
          0
        );
      }
      state.subtotal += item.originalPrice * item.quantity;
      state.total += item.price * item.quantity;
    },
    incrementItem: (state, action: PayloadAction<{ variant_id: string }>) => {
      if (!state.cart) return;
      const item = state.cart.items.find(
        (i) => i.variant_id === action.payload.variant_id
      );
      if (!item) return;
      item.quantity += 1;
      state.cart.totalQuantities += 1;
      state.subtotal += item.originalPrice;
      state.total += item.price;
    },
    decrementItem: (state, action: PayloadAction<{ variant_id: string }>) => {
      if (!state.cart) return;
      const item = state.cart.items.find(
        (i) => i.variant_id === action.payload.variant_id
      );
      if (!item) return;
      if (item.quantity <= 1) {
        state.cart.items = state.cart.items.filter(
          (i) => i.variant_id !== item.variant_id
        );
        state.subtotal -= item.originalPrice * item.quantity;
        state.total -= item.price * item.quantity;
      } else {
        item.quantity -= 1;
        state.subtotal -= item.originalPrice;
        state.total -= item.price;
      }
      state.cart.totalQuantities -= 1;
      if (state.cart.items.length === 0) {
        state.cart = null;
        state.subtotal = 0;
        state.total = 0;
      }
    },
    removeItem: (state, action: PayloadAction<{ variant_id: string }>) => {
      if (!state.cart) return;
      const item = state.cart.items.find(
        (i) => i.variant_id === action.payload.variant_id
      );
      if (!item) return;
      state.cart.items = state.cart.items.filter(
        (i) => i.variant_id !== item.variant_id
      );
      state.cart.totalQuantities -= item.quantity;
      state.subtotal -= item.originalPrice * item.quantity;
      state.total -= item.price * item.quantity;
      if (state.cart.items.length === 0) {
        state.cart = null;
        state.subtotal = 0;
        state.total = 0;
      }
    },
    clearCart: (state) => {
      state.cart = null;
      state.subtotal = 0;
      state.total = 0;
    },
  },
});

export const {
  addToCart,
  incrementItem,
  decrementItem,
  removeItem,
  clearCart,
} = cartsSlice.actions;

export default cartsSlice.reducer;
