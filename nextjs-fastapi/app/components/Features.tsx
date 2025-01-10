import { MapPin, Users, Music, Mountain } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Find Local Trails",
    description: "Discover the best hiking trails in your area, rated and reviewed by our community."
  },
  {
    icon: Users,
    title: "Match with Hikers",
    description: "Connect with hikers who share your pace, experience level, and outdoor interests."
  },
  {
    icon: Music,
    title: "Music-Based Matching",
    description: "Our unique algorithm matches you with hikers who share your music taste for better trail conversations."
  },
  {
    icon: Mountain,
    title: "Group Adventures",
    description: "Join or create group hikes and build lasting friendships with fellow outdoor enthusiasts."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-background-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text mb-4">
            How Hyking Works
          </h2>
          <p className="text-text-light max-w-2xl mx-auto">
            We combine trail information, personality matching, and shared interests to help you find the perfect hiking companions.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 rounded-xl bg-background-light">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-text">{feature.title}</h3>
              <p className="text-text-light">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features; 