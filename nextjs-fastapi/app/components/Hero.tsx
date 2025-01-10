import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Hero = () => {
  return (
    <section className="bg-background-light">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-12 lg:py-24">
        <div className="flex flex-col gap-8 lg:gap-10 items-center justify-center text-center lg:text-left lg:items-start lg:w-1/2">
          <div className="space-y-4">
            <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight text-text">
              Find Your Perfect 
              <span className="text-primary"> Hiking Buddy</span>
            </h1>
            <p className="text-lg leading-relaxed text-text-light max-w-xl">
              Connect with fellow hikers who share your interests, music taste, and adventure spirit. Plan group hikes and make lasting friendships on the trail.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/signup">
              <button className="px-8 py-3 rounded-lg font-medium transition-colors bg-primary hover:bg-primary-hover text-primary-white">
                Get Started Free
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className="px-8 py-3 rounded-lg font-medium transition-colors border-2 border-primary text-primary hover:bg-primary-light">
                Learn More
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-light">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((i) => (
                <Avatar 
                  key={i} 
                  className={`w-8 h-8 border-2 border-white ${i > 1 ? '-ml-3' : ''}`}
                >
                  <AvatarImage
                    src={`/dummyprofileimages/${i}.jpg`}
                    alt={`User ${i}`}
                  />
                  <AvatarFallback className="bg-primary/10">
                    {i}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p>Join 20+ hikers already connected</p>
          </div>
        </div>
        <div className="lg:w-1/2">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-xl blur-xl" />
            <Image
            src="https://images.unsplash.com/photo-1464207687429-7505649dae38?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z3JvdXAlMjBoaWtpbmd8ZW58MHx8MHx8fDA%3D"
            alt="Product Demo"
            className="w-full rounded-lg shadow-lg"
              priority={true}
            width={600}
            height={400}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
