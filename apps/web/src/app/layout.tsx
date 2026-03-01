import type { Metadata } from "next";
import { Chivo, Space_Mono } from "next/font/google";
import "./globals.css";

const chivo = Chivo({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Skill Issues OS — Newsletter Operations",
  description:
    "Desktop-style newsletter operations platform with skills, pipelines, builder, and chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${chivo.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
