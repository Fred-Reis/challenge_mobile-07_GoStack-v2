import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const alreadyInCart = await AsyncStorage.getItem(
        '@challengeMobile:products',
      );
      if (alreadyInCart) {
        setProducts(JSON.parse(alreadyInCart));
      }
      setLoading(false);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productInCart = products.find(p => p.id === product.id);
      if (!productInCart) {
        setProducts([...products, { ...product, quantity: 1 }]);
      } else {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
          ),
        );
      }
      await AsyncStorage.setItem(
        '@challengeMobile:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );
      await AsyncStorage.setItem(
        '@challengeMobile:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const prod = products.find(p => p.id === id);
      if (prod && prod.quantity > 1) {
        setProducts(
          products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          ),
        );
      } else {
        setProducts(products.filter(p => p.id !== id));
      }
      await AsyncStorage.setItem(
        '@challengeMobile:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products, loading }),
    [products, addToCart, increment, decrement, loading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
