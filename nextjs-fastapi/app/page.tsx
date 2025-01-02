import Image from "next/image";
import Link from "next/link";
import Hero from "./components/Hero";
import Header from "./components/Header";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading header...</div>}>
        <Header />
      </Suspense>
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Hero />
        </Suspense>
      </main>
    </>
  );
}
