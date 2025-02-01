'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '../login/actions';
import { toast, Toaster } from 'sonner';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await signup(formData);

    if (result && result.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const formData = new FormData();
    formData.append('provider', provider);
    
    const result = await signup(formData);
    if (result && result.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-0">
      <div className="w-full max-w-[24rem] space-y-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Create an account</h2>
        
        {/* OAuth Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => handleOAuthSignup('google')}
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
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:ring-indigo-400 focus:border-indigo-400 bg-white autofill:bg-white focus:bg-white [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:hover:bg-white [&:-webkit-autofill]:focus:bg-white [&:-webkit-autofill]:active:bg-white [&:-webkit-autofill]:[transition-delay:9999s]"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:ring-indigo-400 focus:border-indigo-400 bg-white autofill:bg-white focus:bg-white [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:hover:bg-white [&:-webkit-autofill]:focus:bg-white [&:-webkit-autofill]:active:bg-white [&:-webkit-autofill]:[transition-delay:9999s]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
      <Toaster />
    </div>
  );
} 