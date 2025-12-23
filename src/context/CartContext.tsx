"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 定义购物车商品的数据结构
export interface CartItem {
  id: string;        // SKU ID
  productId: string; // 商品 ID
  title: string;
  titleJson?: any;   // ✅ 支持多语言
  price: number;
  image: string;
  flavor: string;
  flavorJson?: any;  // ✅ 支持多语言
  strength: string;
  quantity: number;
  stock: number;     // 🔥 关键：必须把库存存进去，用于校验
}

interface CartContextType {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  cartItems: CartItem[]; // 全局购物车数据
  addToCart: (item: CartItem, showDrawer?: boolean) => void;
  removeFromCart: (skuId: string) => void;
  updateQuantity: (skuId: string, delta: number) => void;
  clearCart: () => void; // ✅ 清空购物车
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. 初始化：从本地存储读取数据
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setIsInitialized(true);
  }, []);

  // 2. 监听变化：只要 cartItems 变了，就自动存入本地
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  // === 核心功能 ===

  // ✅ 添加商品 (含库存检查)
  const addToCart = (newItem: CartItem, showDrawer: boolean = true) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === newItem.id);

      if (existingItem) {
        // 🔥 漏洞修复：检查总数量是否会超过库存
        if (existingItem.quantity + newItem.quantity > newItem.stock) {
          alert(`库存不足！当前库存仅剩 ${newItem.stock} 件，您的购物车里已有 ${existingItem.quantity} 件。`);
          return prev; // 拒绝修改，直接返回原状态
        }
        
        // 数量增加
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        // 🔥 漏洞修复：新商品也要检查库存
        if (newItem.quantity > newItem.stock) {
          alert(`库存不足！当前库存仅剩 ${newItem.stock} 件。`);
          return prev;
        }
        return [...prev, newItem];
      }
    });
    
    // 根据参数决定是否打开购物车侧边栏（默认打开）
    if (showDrawer) {
      setIsOpen(true);
    }
  };

  // ✅ 移除商品
  const removeFromCart = (skuId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== skuId));
  };

  // ✅ 更新数量 (+1 / -1)
  const updateQuantity = (skuId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === skuId) {
          const newQuantity = item.quantity + delta;
          
          // 限制 1：不能少于 1
          if (newQuantity < 1) return item;
          
          // 限制 2：🔥 不能超过库存
          if (newQuantity > item.stock) {
            alert(`无法增加！该商品最大库存为 ${item.stock}`);
            return item;
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);
  
  // ✅ 清空购物车
  const clearCart = () => {
    setCartItems([]);
  };

  // 计算总数量 (用于角标)
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider 
      value={{ 
        isOpen, openCart, closeCart, toggleCart, 
        cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCartDrawer must be used within CartProvider");
  return context;
}