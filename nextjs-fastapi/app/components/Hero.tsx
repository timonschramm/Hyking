import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (

    <section className="bg-base-100">
      <div className="max-w-7xl mx-auto  flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
        <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">

          <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
            Go hiking, get to know new people
          </h1>
          <p className="text-lg opacity-80 leading-relaxed">
            The hiking app that helps you find the best hiking trails and connect with other hikers
          </p>
          <Link href="/signup">
            <button className="btn btn-primary btn-wide">
              Sign up to HikeBuddy
            </button>
          </Link>

          {/* <TestimonialsAvatars priority={true} /> */}
        </div>
        <div className="max-w-7xl  lg:w-full">
          <Image
            src="https://images.unsplash.com/photo-1464207687429-7505649dae38?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z3JvdXAlMjBoaWtpbmd8ZW58MHx8MHx8fDA%3D"
            alt="Product Demo"
            className="w-full"
            priority={true}
            width={500}
            height={500}
          />
        </div>
      </div>

    </section>
  );
}
export default Hero;
