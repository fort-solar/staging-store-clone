import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Script from "next/script";
import { SidebarInitializer } from "@/util/SidebarInitializer";
import { AuthProvider } from "@/components/auth/auth-provider";
import { getSessionSnapshotFromCookieStore } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://store.fortsolar.ng"),

  title: {
    default: "Fortsolar Store | Clean, Reliable Solar Power",
    template: "%s | Fortsolar",
  },

  description:
    "Reliable residential and commercial solar energy solutions for homes and businesses, helping you reduce energy costs and power your future sustainably.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Fortsolar Store | Clean, Reliable Solar Power",
    description:
      "Residential and commercial solar solutions designed for reliability, savings, and sustainability.",
    type: "website",
    siteName: "Fortsolar Store",
    images: [
      {
        url: "/FortsolarLogo.png",
        width: 1200,
        height: 630,
        alt: "Fortsolar Store | Clean, Reliable Solar Power",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Fortsolar Store | Clean, Reliable Solar Power",
    description:
      "Residential and commercial solar solutions for homes and businesses.",
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fortsolar store",
  url: "https://store.fortsolar.ng",
  logo: "https://www.fortsolar.ng/FortsolarLogo.png",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSession = await getSessionSnapshotFromCookieStore(await cookies());

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        <SidebarInitializer />
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <AuthProvider initialSession={initialSession} portal="customer">
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
