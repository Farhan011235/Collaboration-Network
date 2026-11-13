import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Research & Project Collaboration Network",
  description:
    "Find research projects, build teams, and collaborate with researchers who share your interests.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
          <Toaster
            position="top-center"
            // sonner defaults to 4s, which feels sluggish for small
            // confirmations like "Draft saved". 2.5s reads comfortably and
            // gets out of the way; the close button dismisses instantly.
            duration={2500}
            closeButton
            toastOptions={{
              classNames: {
                toast: "font-sans text-sm",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
