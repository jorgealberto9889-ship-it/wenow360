import type { Metadata } from "next";
import { IBM_Plex_Mono, Montserrat } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: `${BRAND.name} | ${BRAND.club}`,
  description: "Evaluación orientativa de bienestar. No diagnostica ni sustituye la valoración de un profesional de salud.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${montserrat.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
