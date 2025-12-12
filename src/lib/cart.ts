// src/lib/cart.ts
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

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existingItem = cart.find(i => i.variantId === item.variantId);

  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export function buyNow(item: CartItem) {
  addToCart(item);
  console.log("跳转结算:", item);
  // window.location.href = '/checkout';
}