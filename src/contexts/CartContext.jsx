import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import cartApi from '../api/cartApi';
import { getErrorMessage, isCancel } from '../api/axiosClient';
import { getSellingPrice } from '../utils/format';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const validItems = (items) =>
  items
    .filter((item) => item && (item.laptop || item.name))
    .map((item) => ({
      ...item,
      laptop: item.laptop || {
        id: item.laptopId || item.id,
        name: item.name,
        price: item.price,
        salePrice: item.salePrice,
        image: item.image,
        stock: item.stock ?? 99,
      },
    }));

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? validItems(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await cartApi.getByUser(user.id, controller.signal);
        if (data && data.length > 0) {
          setItems(validItems(data));
        }
      } catch (err) {
        if (isCancel(err)) return;
        // Nếu offline, giữ nguyên items từ localStorage
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadedUserId(user.id);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [user, reloadKey]);

  /** Thêm vào giỏ. BR-02: không vượt stock */
  const addToCart = useCallback(
    async (laptop, quantity = 1) => {
      const existing = itemsRef.current.find(
        (item) => item.laptopId === laptop.id || item.id === laptop.id
      );
      const newQuantity = (existing?.quantity ?? 0) + quantity;
      const stock = laptop.stock ?? 99;

      if (newQuantity > stock) {
        throw { message: `"${laptop.name}" chỉ còn ${stock} sản phẩm` };
      }

      if (existing) {
        if (user && cartApi.updateQuantity && existing.cartItemId) {
          try {
            await cartApi.updateQuantity(existing.cartItemId, newQuantity);
          } catch {
            // fallback
          }
        }
        setItems((list) =>
          list.map((item) =>
            item.id === existing.id ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        let created = null;
        if (user && cartApi.add) {
          try {
            created = await cartApi.add(user.id, laptop.id, quantity);
          } catch {
            // fallback
          }
        }
        const newItem = {
          id: created?.id || `local_${Date.now()}_${laptop.id}`,
          cartItemId: created?.id,
          userId: user?.id,
          laptopId: laptop.id,
          quantity,
          laptop,
        };
        setItems((list) => [...list, newItem]);
      }
    },
    [user]
  );

  /** Đổi số lượng (PATCH). BR-02 */
  const updateQuantity = useCallback(
    async (itemOrId, quantity) => {
      const item =
        typeof itemOrId === 'object'
          ? itemOrId
          : itemsRef.current.find((i) => i.id === itemOrId || i.laptopId === itemOrId);
      if (!item) return;

      const stock = item.laptop?.stock ?? item.stock ?? 99;
      if (quantity > stock) {
        throw { message: `"${item.laptop?.name || item.name}" chỉ còn ${stock} sản phẩm` };
      }

      if (quantity <= 0) {
        return;
      }

      if (user && cartApi.updateQuantity && item.cartItemId) {
        try {
          await cartApi.updateQuantity(item.cartItemId, quantity);
        } catch {
          // offline fallback
        }
      }

      setItems((list) =>
        list.map((i) => (i.id === item.id ? { ...i, quantity } : i))
      );
    },
    [user]
  );

  /** H4. Optimistic update: xoá khỏi giao diện ngay, lỗi thì khôi phục đúng vị trí cũ */
  const removeItem = useCallback(
    async (itemOrId) => {
      const targetId = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
      const index = itemsRef.current.findIndex((i) => i.id === targetId);
      const item = itemsRef.current[index];
      if (!item) return;

      // 1. Cập nhật giao diện ngay lập tức
      setItems((list) => list.filter((i) => i.id !== targetId));

      // 2. Gọi API nếu có
      if (user && cartApi.remove && item.cartItemId) {
        try {
          await cartApi.remove(item.cartItemId);
        } catch (err) {
          // 3. Rollback nếu lỗi
          setItems((list) => {
            const restored = [...list];
            restored.splice(index < 0 ? restored.length : index, 0, item);
            return restored;
          });
          throw err;
        }
      }
    },
    [user]
  );

  const clearLocal = useCallback(() => setItems([]), []);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (getSellingPrice(item.laptop) || item.laptop?.price || item.price || 0) * (item.quantity || 0),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      cart: items,
      totalQuantity,
      totalItems: totalQuantity,
      totalPrice,
      loading,
      error,
      addToCart,
      updateQuantity,
      removeItem,
      removeFromCart: removeItem,
      clearCart: clearLocal,
      clearLocal,
      reload,
    }),
    [items, totalQuantity, totalPrice, loading, error, addToCart, updateQuantity, removeItem, clearLocal, reload]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      cart: [],
      totalQuantity: 0,
      totalItems: 0,
      totalPrice: 0,
      loading: false,
      error: null,
      addToCart: () => {},
      updateQuantity: () => {},
      removeItem: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      clearLocal: () => {},
      reload: () => {},
    };
  }
  return ctx;
};