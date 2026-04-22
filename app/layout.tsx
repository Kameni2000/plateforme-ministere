import type { Metadata } from "next";
import "./globals.css";
// On importe notre nouveau menu intelligent
import Navbar from "../composants/layout/Navbar";

export const metadata: Metadata = {
  title: "ChurchHub | Excellence Digitale pour votre Ministère",
  description: "La plateforme premium pour la gestion et le branding des églises modernes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-sombre font-sans text-clair" suppressHydrationWarning>
        
        {/* On utilise notre nouveau composant ici */}
        <Navbar />

        <div className="pt-20">
          {children}
        </div>

      </body>
    </html>
  );
}