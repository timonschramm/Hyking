import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Hyking - Discover Trails",
  description: "The hiking app that helps you find the best hiking trails and connect with other hikers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} bg-background-white`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
