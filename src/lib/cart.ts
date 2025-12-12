// src/lib/cart.ts
"use client";

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  flavor: string;
  strength: string;
  price: number;
  image: string;
  quantity: number;
}

const CART_KEY = 'cigarette_cart_v1';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const json = localStorage.getItem(CART_KEY);
  return json ? JSON.parse(json) : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (typeof window !== 'undefined') {
    // 触发自定义事件，通知组件更新
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existingItem = cart.find(i => i.variantId === item.variantId);

  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function updateQuantity(variantId: string, delta: number) {
  const cart = getCart();
  const item = cart.find(i => i.variantId === variantId);
  if (item) {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      item.quantity = newQuantity;
    } else {
      // 数量小于1时移除该商品
      return removeFromCart(variantId);
    }
    saveCart(cart);
  }
}

export function removeFromCart(variantId: string) {
  const cart = getCart();
  const newCart = cart.filter(i => i.variantId !== variantId);
  saveCart(newCart);
}

export function clearCart() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cart-updated'));
  }
}