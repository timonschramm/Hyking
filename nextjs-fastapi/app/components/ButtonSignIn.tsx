"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { config } from '../config';
import { createClient } from '@/utils/supabase/client';

interface ButtonSigninProps {
  text?: string;
  extraStyle?: string;
}

const ButtonSignin = ({ text = "Get started", extraStyle }: ButtonSigninProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string; image?: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setUser({ 
          email: user.email,
          name: user.user_metadata?.name,
          image: user.user_metadata?.avatar_url
        });
        setIsAuthenticated(true);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.name,
          image: session.user.user_metadata?.avatar_url
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleClick = () => {
    if (isAuthenticated) {
      router.push(config.auth.callbackUrl);
    } else {
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isAuthenticated && user) {
    return (
      <Link
        href={config.auth.callbackUrl}
        className={`btn ${extraStyle ? extraStyle : ""}`}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "Account"}
            className="w-6 h-6 rounded-full shrink-0"
            referrerPolicy="no-referrer"
            width={24}
            height={24}
          />
        ) : (
          <span className="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0">
            {user.name?.charAt(0) || user.email?.charAt(0)}
          </span>
        )}
        {user.name || user.email || "Account"}
      </Link>
    );
  }

  return (
    <button
      className={`btn ${extraStyle ? extraStyle : ""}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default ButtonSignin;
