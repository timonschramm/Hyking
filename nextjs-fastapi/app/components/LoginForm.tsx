'use client';

import { useState } from 'react';
import { login } from '@/app/login/actions';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const { error: loginError } = await login(formData);

    if (loginError) {
      setError(loginError);
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('provider', provider);
      
      console.log('Starting OAuth login for:', provider);
      const result = await login(formData);
      console.log('OAuth login result:', result);

      if (result.error) {
        console.error('OAuth login error:', result.error);
        setError(result.error);
        setLoading(false);
      } else if (result.url) {
        // Redirect in the client
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Caught OAuth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-96 space-y-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign in to your account
        </h2>
        
        {/* OAuth Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="flex w-full justify-center items-center gap-3 rounded-md bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 