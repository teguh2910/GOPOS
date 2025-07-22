'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { User, UserPlus, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loginUserId, setLoginUserId] = useState('');
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    role: 'cashier'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/pos');
    }
  }, [isLoggedIn, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!loginUserId) {
      setError('Please enter a User ID');
      return;
    }

    login(loginUserId);
    router.push('/pos');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await api.registerUser(registerData);
      setSuccess(`User registered successfully! Your new User ID is: ${result.user_id}. Please log in with it.`);
      setRegisterData({ username: '', password: '', role: 'cashier' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
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
      <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to GoPOS
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign in to your account or register a new one
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">{success}</div>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Login
            </h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-user-id" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  id="login-user-id"
                  type="number"
                  value={loginUserId}
                  onChange={(e) => setLoginUserId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your User ID"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">
                Since this is a lightweight demo without full authentication, please enter your User ID to &apos;log in&apos;.
                You can create a user via the registration form below or assume User ID 1 exists.
              </p>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login
              </button>
            </form>
          </div>

          {/* Register Form */}
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Register New User
            </h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="register-username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="register-username"
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="register-role"
                  value={registerData.role}
                  onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
