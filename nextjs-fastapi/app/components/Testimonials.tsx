import Image from "next/image";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Avid Hiker",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    content: "Found an amazing hiking group through this app. We now go on weekly adventures together!",
    rating: 5
  },
  {
    name: "Michael R.",
    role: "Trail Runner",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    content: "The music matching feature is genius! It&apos;s so much fun hiking with people who share my playlist.",
    rating: 5
  },
  {
    name: "Emma L.",
    role: "Nature Photographer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    content: "Perfect for finding hiking buddies who match your pace and interests. Made some great friends!",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="py-12 sm:py-20 bg-background" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3 sm:mb-4">
            Loved by Hikers Everywhere
          </h2>
          <p className="text-text-light max-w-2xl mx-auto text-sm sm:text-base">
            Join thousands of happy hikers who&apos;ve found their perfect trail companions through our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background-light p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-text text-base sm:text-lg">{testimonial.name}</h3>
                  <p className="text-xs sm:text-sm text-text-light">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 sm:w-5 sm:h-5 fill-primary text-primary"
                  />
                ))}
              </div>
              
              <p className="text-text-light leading-relaxed text-sm sm:text-base">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 