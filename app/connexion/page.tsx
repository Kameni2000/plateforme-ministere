"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const gererConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setMessage("");

    // On connecte l'utilisateur
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Connexion réussie ! Redirection...");
      router.push("/dashboard"); // LA TÉLÉPORTATION !
    }
    
    setChargement(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-sombre/50 p-8 rounded-2xl border border-clair/10 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Accès <span className="text-or">Ministère</span></h1>
          <p className="text-clair/60 text-sm">Connectez-vous pour gérer votre plateforme</p>
        </div>

        <form onSubmit={gererConnexion} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-clair/70 mb-2">Adresse Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-3 text-clair focus:outline-none focus:border-or transition-colors"
              placeholder="pasteur@eglise.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-clair/70 mb-2">Mot de passe</label>
            <input 
              type="password" 
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-3 text-clair focus:outline-none focus:border-or transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={chargement}
            className="w-full bg-or text-sombre font-bold py-3 rounded-lg hover:bg-or/90 transition-colors disabled:opacity-50"
          >
            {chargement ? "Vérification..." : "Se connecter / S'inscrire"}
          </button>

          {/* Affichage des messages de succès ou d'erreur */}
          {message && (
            <div className={`p-4 rounded-lg text-sm text-center ${message.includes("Erreur") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
              {message}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}