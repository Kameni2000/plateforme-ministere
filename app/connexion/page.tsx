"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function Connexion() {
  // NOUVEAU : Ajout de l'état pour le Nom
  const [nom, setNom] = useState(""); 
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [estModeConnexion, setEstModeConnexion] = useState(true);
  
  const router = useRouter();

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setMessage(null);

    try {
      if (estModeConnexion) {
        // MODE : SE CONNECTER
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: motDePasse,
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        // MODE : S'INSCRIRE
        const { error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          // NOUVEAU : On envoie le nom dans les métadonnées de Supabase !
          options: {
            data: {
              full_name: nom,
            }
          }
        });
        if (error) throw error;
        setMessage("Inscription réussie ! Bienvenue sur ChurchHub.");
        
        // Optionnel : Rediriger directement après inscription si tu n'as pas activé la confirmation par email stricte
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err: any) {
      setErreur(err.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  const gererConnexionGoogle = async () => {
    setErreur(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErreur(err.message || "Erreur de connexion avec Google.");
    }
  };

  return (
    <div className="min-h-screen bg-sombre text-clair flex flex-col justify-center items-center px-6 pt-20">
      
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-clair/50 hover:text-or transition-colors flex items-center gap-2 font-bold">
          ← Retour au site
        </Link>
      </div>

      <div className="w-full max-w-md">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3">
            {estModeConnexion ? "Bon retour ! 👋" : "Rejoignez l'élite 🚀"}
          </h1>
          <p className="text-clair/60 text-lg">
            {estModeConnexion ? "Connectez-vous pour accéder à votre ministère." : "Créez votre compte ChurchHub gratuit."}
          </p>
        </div>

        <div className="bg-[#111] p-8 md:p-10 rounded-3xl border border-clair/10 shadow-2xl relative transition-all duration-300">
          
          {erreur && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-medium animate-in fade-in">
              {erreur}
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 text-sm text-center font-medium animate-in fade-in">
              {message}
            </div>
          )}

          <button 
            onClick={gererConnexionGoogle}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors mb-6 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-clair/10 flex-1"></div>
            <span className="text-xs text-clair/40 font-bold uppercase tracking-widest">OU</span>
            <div className="h-px bg-clair/10 flex-1"></div>
          </div>

          <form onSubmit={gererSoumission} className="space-y-5">
            
            {/* NOUVEAU : Le champ "Nom complet" apparaît uniquement avec une belle animation si on est en mode Inscription */}
            {!estModeConnexion && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="block text-sm font-bold text-clair/70 mb-2">Nom complet / Nom de l'église</label>
                <input 
                  type="text" required={!estModeConnexion} value={nom} onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Pasteur Yvan"
                  className="w-full bg-sombre/50 border border-clair/20 rounded-xl px-5 py-3.5 text-clair focus:border-or outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-clair/70 mb-2">Adresse E-mail</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="pasteur@eglise.com"
                className="w-full bg-sombre/50 border border-clair/20 rounded-xl px-5 py-3.5 text-clair focus:border-or outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-clair/70 mb-2">Mot de passe</label>
              <input 
                type="password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-sombre/50 border border-clair/20 rounded-xl px-5 py-3.5 text-clair focus:border-or outline-none transition-colors"
              />
            </div>

            <button 
              type="submit" disabled={chargement}
              className="w-full bg-or text-sombre font-black py-4 rounded-xl text-lg hover:scale-[1.02] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-or/20"
            >
              {chargement ? "Chargement..." : (estModeConnexion ? "Se connecter" : "Créer mon compte")}
            </button>
          </form>

        </div>

        <div className="text-center mt-8">
          <p className="text-clair/60">
            {estModeConnexion ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
            <button 
              onClick={() => setEstModeConnexion(!estModeConnexion)}
              className="text-or font-bold ml-2 hover:underline transition-all"
            >
              {estModeConnexion ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}