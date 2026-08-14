import type { Metadata } from "next";
import { headers } from "next/headers";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AppProviders } from "@/src/components/AppProviders";

const description =
  "A live, country-level globe for exploring leaders, flags, capitals, states, and world history.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: "Epoch — Read the Planet",
    description,
    openGraph: {
      title: "Epoch — Read the Planet",
      description,
      type: "website",
      images: [{ url: socialImage, width: 1536, height: 1024, alt: "Epoch — Read the Planet" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Epoch — Read the Planet",
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
