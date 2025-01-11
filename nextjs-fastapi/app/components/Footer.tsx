import Link from "next/link";
import { Globe, Instagram, Twitter, Facebook } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/" },
      { label: "Contact", href: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/" },
      { label: "Impressum", href: "/" },
    ],
  },
  {
    title: "Safety",
    links: [
      { label: "Community Guidelines", href: "/guidelines" },

    ],
  },
 
];

const Footer = () => {
  return (
    <footer className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {footerLinks.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-text">{section.title}</h3>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-text-light hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-text">Follow Us</h3>
            <div className="flex gap-4 mb-6">
              <Link href="https://instagram.com" className="text-text-light hover:text-primary">
                <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <Link href="https://twitter.com" className="text-text-light hover:text-primary">
                <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <Link href="https://facebook.com" className="text-text-light hover:text-primary">
                <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>
            
         
          </div>
        </div>
        
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
          <p className="text-text-light text-xs sm:text-sm text-center">
            © {new Date().getFullYear()} Hyking. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 