import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: "Dink N' Lob - Pickleball Court Booking",
  description: "Book your court at Dink N' Lob! 3 good looking courts at D'HIVE Arcade, Inayawan. Rates start at ₱299/hour. Surrounded by good food and good company.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
