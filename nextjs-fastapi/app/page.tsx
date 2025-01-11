import { Suspense } from "react";
import Image from "next/image";
import Hero from "@/app/components/Hero";
import Header from "@/app/components/Header";
import Features from "@/app/components/Features";
import Statistics from "@/app/components/Statistics";
import Testimonials from "@/app/components/Testimonials";
import Footer from "@/app/components/Footer";

export default function Home() {
  return (
    <div className="bg-background-white">
      <Suspense fallback={<div>Loading header...</div>}>
        <Header />
      </Suspense>
      
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Hero />
          <Statistics />
          <Features />
          <section className="py-20 bg-background overflow-hidden">
            <div className="max-w-7xl mx-auto px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/10 rounded-xl blur-xl" />
                  <Image
                    src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800"
                    alt="Group hiking"
                    width={600}
                    height={400}
                    className="relative rounded-xl shadow-xl"
                  />
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-text">
                    Find Your Perfect Match for Every Trail
                  </h2>
                  <p className="text-text-light leading-relaxed">
                    Whether you&apos;re an early morning trail runner or a weekend warrior,
                    our smart matching system helps you connect with hiking buddies who
                    share your schedule, pace, and adventure style.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Match based on hiking experience and preferences",
                      "Connect through shared music tastes and interests",
                      "Join group hikes and build lasting friendships",
                      "Discover new trails recommended by the community"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-text-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
          <Testimonials />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
