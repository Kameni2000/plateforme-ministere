"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; // 1. L'OUTIL MAGIQUE DE NEXT.JS EST IMPORTÉ ICI !
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [utilisateur, setUtilisateur] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUtilisateur(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUtilisateur(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-clair/10 bg-sombre/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* 2. ON REMPLACE LES <a> PAR DES <Link> */}
        <Link href="/" className="text-2xl font-bold tracking-tighter">
          CHURCH<span className="text-or">HUB</span>
        </Link>

        {/* Liens du centre */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-clair/60">
          <Link href="/" className="hover:text-or transition-colors">Accueil</Link>
          {/* J'ai redirigé ces liens vers l'accueil en attendant qu'on crée leurs pages dédiées */}
          <Link href="/fonctionnalites" className="hover:text-or transition-colors">Fonctionnalités</Link>
          <Link href="/tarifs" className="hover:text-or transition-colors">Tarifs</Link>
        </div>

        {/* LE BOUTON INTELLIGENT */}
        <div>
          {utilisateur ? (
            <Link href="/dashboard" className="inline-block bg-or text-sombre px-5 py-2 rounded-lg text-sm font-bold hover:bg-or/90 transition-all shadow-lg shadow-or/20">
              Mon Espace
            </Link>
          ) : (
            <Link href="/connexion" className="inline-block bg-or/10 border border-or text-or px-5 py-2 rounded-lg text-sm font-bold hover:bg-or hover:text-sombre transition-all">
              Se connecter
            </Link>
          )}
        </div>
        
      </div>
    </nav>
  );
}