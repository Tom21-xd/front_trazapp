import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00923f",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: {
    default: "TrazApp | Sistema de Gestión de Proyectos",
    template: "%s | TrazApp",
  },
  description:
    "Plataforma institucional para la gestión, control y seguimiento de proyectos y actividades de la Alcaldía de Florencia, Caquetá, Colombia.",
  keywords: [
    "TrazApp",
    "Alcaldía de Florencia",
    "Gestión de proyectos",
    "Caquetá",
    "Colombia",
    "Administración municipal",
    "Seguimiento de actividades",
    "Gobierno digital",
  ],
  authors: [{ name: "Alcaldía de Florencia" }],
  creator: "Alcaldía de Florencia - Caquetá",
  publisher: "Alcaldía de Florencia",
  applicationName: "TrazApp",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TrazApp",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://gestion.florencia.gov.co",
    siteName: "TrazApp - Alcaldía de Florencia",
    title: "TrazApp | Sistema de Gestión de Proyectos",
    description:
      "Plataforma institucional para la gestión, control y seguimiento de proyectos y actividades de la Alcaldía de Florencia, Caquetá.",
    images: [
      {
        url: "/Logohorizontal.png",
        width: 1200,
        height: 630,
        alt: "TrazApp - Alcaldía de Florencia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrazApp | Sistema de Gestión de Proyectos",
    description:
      "Plataforma institucional para la gestión y seguimiento de proyectos de la Alcaldía de Florencia, Caquetá.",
    images: ["/Logohorizontal.png"],
  },
  alternates: {
    canonical: "https://gestion.florencia.gov.co",
  },
  category: "government",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TrazApp" />
        <meta name="geo.region" content="CO-CAQ" />
        <meta name="geo.placename" content="Florencia, Caquetá" />
      </head>
      <body className={`${onest.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
