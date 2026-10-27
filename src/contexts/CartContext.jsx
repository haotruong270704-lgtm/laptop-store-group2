import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Thêm sản phẩm vào giỏ
  const addToCart = (laptop, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === laptop.id);
      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += quantity;
        return updatedCart;
      }
      return [...prevCart, { ...laptop, quantity }];
    });
  };

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = (laptopId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== laptopId));
  };

  // Cập nhật số lượng
  const updateQuantity = (laptopId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(laptopId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === laptopId ? { ...item, quantity } : item))
    );
  };

  // Xóa sạch giỏ
  const clearCart = () => setCart([]);

  // Tính tổng số lượng và tổng tiền
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      totalItems: 0,
      totalPrice: 0
    };
  }
  return context;
}