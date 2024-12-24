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
    <div className="min-h-screen flex items-center justify-center bg-secondary-cream">
      <form className="bg-background-white p-8 rounded-lg shadow-md w-96" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>
        <div className="mb-4">
          <label className="block text-primary mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded bg-background-white text-primary border-secondary-sage focus:ring-primary-medium focus:border-primary-medium"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-primary mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded bg-background-white text-primary border-secondary-sage focus:ring-primary-medium focus:border-primary-medium"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-white p-2 rounded hover:bg-primary-medium transition-colors"
        >
          Login
        </button>
        <p className="mt-4 text-center text-primary">
          Don&apos;t have an account? <Link href="/signup" className="text-primary-light hover:text-primary-medium hover:underline">Sign Up</Link>
        </p>
      </form>
      <Toaster />
    </div>
  );
} 