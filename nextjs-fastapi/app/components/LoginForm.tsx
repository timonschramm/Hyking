'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../login/actions';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await login(formData);
    console.log("result: ", result);

    if (result && result.error) {
      console.log("result:error ", result.error);
      toast.error(result.error);
    } else if (result) {
      router.push('/onboarding');
    } else {
      console.log("Unexpected result: ", result);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="bg-white p-8 rounded-lg shadow-md w-96" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
        <p className="mt-4 text-center">
          Don&apos;t have an account? <Link href="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
        </p>
      </form>
      <Toaster />
    </div>
  );
} 