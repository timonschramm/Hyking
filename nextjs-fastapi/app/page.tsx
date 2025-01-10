import Image from "next/image";
import Hero from "@/app/components/Hero";
import Header from "@/app/components/Header";
import Features from "@/app/components/Features";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="bg-background-white">
      <Suspense fallback={<div>Loading header...</div>}>
        <Header />
      </Suspense>
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Hero />
          <Features />
        </Suspense>
      </main>
    </div>
  );
}
