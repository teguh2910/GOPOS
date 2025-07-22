'use client';

import React from 'react';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, loading, onAddToCart }: ProductGridProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Products
        </h2>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">
            No products available. Add some products to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Package className="w-5 h-5 mr-2" />
        Products
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.quantity <= 0;

  return (
    <div
      className={`border rounded-lg p-4 text-center transition-all duration-200 ${
        isOutOfStock
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer transform hover:-translate-y-1'
      }`}
      onClick={() => !isOutOfStock && onAddToCart(product)}
    >
      <div className="mb-2">
        <h3 className={`font-medium text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
          {product.name}
        </h3>
        <p className={`text-xs ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
          SKU: {product.sku}
        </p>
      </div>
      
      <div className="mb-3">
        <p className={`text-lg font-bold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'}`}>
          {formatCurrency(product.price)}
        </p>
      </div>
      
      <div className="mb-3">
        <p className={`text-xs ${isOutOfStock ? 'text-red-500' : 'text-gray-600'}`}>
          Stock: {product.quantity}
        </p>
      </div>

      {!isOutOfStock && (
        <div className="flex items-center justify-center">
          <Plus className="w-4 h-4 text-blue-600" />
        </div>
      )}

      {isOutOfStock && (
        <div className="text-xs text-red-500 font-medium">
          Out of Stock
        </div>
      )}
    </div>
  );
}
