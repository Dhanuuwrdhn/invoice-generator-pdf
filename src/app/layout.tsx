import type { Metadata } from "next";
import "./globals.css";

const description =
  "Buat invoice PDF profesional untuk freelancer & konsultan: terbilang otomatis, termin, PPN, dan logo sendiri. Gratis 10 invoice.";

export const metadata: Metadata = {
  metadataBase: new URL("https://invoice.bornworks.biz.id"),
  title: "InvoicePDF — Invoice PDF Profesional dalam Detik",
  description,
  openGraph: {
    title: "InvoicePDF — Invoice PDF Profesional dalam Detik",
    description,
    url: "/",
    siteName: "InvoicePDF by bornworks",
    locale: "id_ID",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Caladea:ital,wght@0,400;0,700;1,400;1,700&family=Lato:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
