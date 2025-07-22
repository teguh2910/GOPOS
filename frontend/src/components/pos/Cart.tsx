'use client';

import React, { useState } from 'react';
import { CartItem, PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard,
  DollarSign,
  User,
  Tag
} from 'lucide-react';

interface CartProps {
  items: CartItem[];
  loading: boolean;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: (customerId: string, paymentMethod: PaymentMethod, discountCode: string) => void;
}

export default function Cart({ 
  items, 
  loading, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onCheckout 
}: CartProps) {
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountCode, setDiscountCode] = useState('');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckout(customerId, paymentMethod, discountCode);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ShoppingCart className="w-5 h-5 mr-2" />
        Cart ({items.length} items)
      </h2>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add some products to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {items.length > 0 && (
        <>
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(total)}
              </span>
            </div>
            <button
              onClick={onClearCart}
              className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Cart
            </button>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label htmlFor="customer-id" className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Customer ID (optional)
              </label>
              <input
                id="customer-id"
                type="number"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter customer ID"
              />
            </div>

            <div>
              <label htmlFor="discount-code" className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                Discount Code (optional)
              </label>
              <input
                id="discount-code"
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter discount code"
              />
            </div>

            <div>
              <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="cash">
                  💵 Cash
                </option>
                <option value="credit_card">
                  💳 Credit Card
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {paymentMethod === 'cash' ? (
                    <DollarSign className="w-4 h-4 mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Checkout
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {item.name}
        </h4>
        <p className="text-xs text-gray-500">
          {formatCurrency(item.price)} each
        </p>
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-600"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
          {item.quantity}
        </span>
        
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-600"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onRemoveItem(item.id)}
          className="p-1 rounded-md hover:bg-red-100 text-red-600 ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="text-sm font-medium text-gray-900 ml-4 min-w-[4rem] text-right">
        {formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  );
}
