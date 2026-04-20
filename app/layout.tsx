import type { Metadata } from "next";
import "./globals.css";

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
        
        {/* BARRE DE NAVIGATION */}
        <nav className="fixed top-0 w-full z-50 border-b border-clair/10 bg-sombre/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            
            {/* Logo */}
            <div className="text-2xl font-bold tracking-tighter">
              CHURCH<span className="text-or">HUB</span>
            </div>

            {/* Liens (Masqués sur mobile, visibles sur PC) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-clair/60">
              <a href="#" className="hover:text-or transition-colors">Accueil</a>
              <a href="#" className="hover:text-or transition-colors">Fonctionnalités</a>
              <a href="#" className="hover:text-or transition-colors">Tarifs</a>
            </div>

            {/* Bouton de connexion */}
            <div>
              <button className="bg-or/10 border border-or text-or px-5 py-2 rounded-lg text-sm font-bold hover:bg-or hover:text-sombre transition-all">
                Se connecter
              </button>
            </div>
          </div>
        </nav>

        {/* CONTENU DE LA PAGE (Le "padding-top" évite que le contenu passe sous la nav) */}
        <div className="pt-20">
          {children}
        </div>

      </body>
    </html>
  );
}