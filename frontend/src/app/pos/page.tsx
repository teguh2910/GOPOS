'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product, CartItem, PaymentMethod } from '@/types';
import Layout from '@/components/Layout';
import ProductGrid from '@/components/pos/ProductGrid';
import Cart from '@/components/pos/Cart';
import { AlertCircle } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const { isLoggedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    loadProducts();
  }, [isLoggedIn, router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await api.getProducts();
      setProducts(productsData || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setError('Product is out of stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
          setError('Cannot add more items than available in stock');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    setError('');
  };

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.quantity) {
      setError('Cannot add more items than available in stock');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
    setError('');
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = async (
    customerId: string,
    paymentMethod: PaymentMethod,
    discountCode: string
  ) => {
    if (!userId) {
      setError('You must be logged in to checkout');
      return;
    }

    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    setError('');

    try {
      const saleData = {
        user_id: parseInt(userId),
        customer_id: customerId ? parseInt(customerId) : undefined,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        discount_codes: discountCode ? [discountCode] : []
      };

      const result = await api.createSale(saleData);
      
      // Show success message
      alert(`Checkout successful! Sale ID: ${result.sale_id}`);
      
      // Clear cart and refresh products
      clearCart();
      await loadProducts();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {error && (
          <div className="mx-4 mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <ProductGrid
              products={products}
              loading={loading}
              onAddToCart={addToCart}
            />
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Cart
              items={cart}
              loading={checkoutLoading}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
