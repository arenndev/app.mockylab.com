"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import { handleApiError } from '@/utils/apiConfig';

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If already authenticated, redirect to mockup list
    if (authService.isAuthenticated()) {
      router.push('/mockup/list');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await authService.login(username, password);
      if (success) {
        const callbackUrl = searchParams.get('callbackUrl');
        router.push(callbackUrl || '/mockup/list');
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-boxdark p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-boxdark-2 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Logo and Welcome Message */}
            <div className="lg:w-1/2 p-12 bg-primary dark:bg-boxdark flex flex-col items-center justify-center text-white">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">MockyLab</h1>
                <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                <p className="text-lg text-gray-100">
                  Your Professional Mockup Design Solution
                </p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-1/2 p-12">
              <div className="max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Sign In
                </h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-boxdark focus:ring-2 focus:ring-primary dark:focus:ring-primary/30 focus:border-transparent dark:text-white"
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-boxdark focus:ring-2 focus:ring-primary dark:focus:ring-primary/30 focus:border-transparent dark:text-white"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-boxdark"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 