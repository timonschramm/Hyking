import Image from "next/image";
import Link from "next/link";
import Hero from "./components/Hero";
import Header from "./components/Header";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
        <Header />
        <main>
         
          <Suspense fallback={<div>Loading...</div>}>
            <Hero />
          </Suspense>
        </main>
  </>
  );
}
