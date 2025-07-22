'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { SalesReport } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Layout from '@/components/Layout';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    // Load initial report without date filters
    loadReport();
  }, [isLoggedIn, router]);

  const loadReport = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError('');
      const reportData = await api.getSalesReport(start, end);
      setReport(reportData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadReport(startDate, endDate);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Sales Reports
          </h1>
          <p className="mt-2 text-gray-600">
            View sales performance and analytics.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter Form */}
        <div className="bg-white shadow rounded-lg mb-8 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Filter by Date Range
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </form>
        </div>

        {/* Report Results */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading report...</span>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(report.total_revenue)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBag className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Transactions
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {report.total_transactions}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Average Transaction
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {report.total_transactions > 0 
                            ? formatCurrency(report.total_revenue / report.total_transactions)
                            : formatCurrency(0)
                          }
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Period */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Report Period</h3>
              <p className="text-gray-600">
                {new Date(report.start_date).toLocaleDateString()} to {new Date(report.end_date).toLocaleDateString()}
              </p>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.top_selling_products && report.top_selling_products.length > 0 ? (
                      report.top_selling_products.map((product, index) => (
                        <tr key={product.product_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.product_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.total_sold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.total_value)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No sales in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No report data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate a report to see sales analytics.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
