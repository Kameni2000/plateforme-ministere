"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import GenerateurAffiche from "../../composants/sections/GenerateurAffiche";
import StatsEglise from "../../composants/sections/StatsEglise";

export default function Dashboard() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [modeles, setModeles] = useState<any[]>([]);
  const [modeleClique, setModeleClique] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/connexion");
      } else {
        setUtilisateur(session.user);
        chargerModeles(session.user.id);
      }
    };
    verifierAcces();
  }, [router]);

  const chargerModeles = async (userId: string) => {
    const { data, error } = await supabase
      .from('modeles_affiches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setModeles(data);
  };

  const supprimerModele = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return;
    const { error } = await supabase.from('modeles_affiches').delete().eq('id', id);
    if (!error) setModeles(modeles.filter(m => m.id !== id));
  };

  const seDeconnecter = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-sombre text-clair flex justify-center items-center">
        <div className="animate-pulse text-or font-bold tracking-widest uppercase">Ouverture du coffre-fort...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      {/* J'ai utilisé space-y-12 pour créer un bel espacement uniforme entre toutes les sections */}
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* 1. EN-TÊTE PRINCIPAL (Toujours en haut !) */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-sombre/80 p-6 rounded-2xl border border-clair/10 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold">Espace <span className="text-or">Ministère</span></h1>
            <p className="text-clair/60 text-sm mt-1">Connecté en tant que : {utilisateur.email}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Link href="/offrandes" className="bg-green-500 text-sombre px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-400 transition-all text-center shadow-md shadow-green-500/20">
              📊 Finances
            </Link>
            <Link href="/membres" className="bg-or text-sombre px-5 py-2 rounded-lg text-sm font-bold hover:bg-or/90 transition-all text-center shadow-md shadow-or/20">
              👥 Membres
            </Link>
            <Link href="/studio" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-all text-center shadow-md shadow-blue-600/20">
              🚀 Studio IA
            </Link>
            <Link href="/communication" className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-purple-500 transition-all text-center shadow-md shadow-purple-600/20">
              💌 Communication
            </Link>
            <button onClick={seDeconnecter} className="border border-red-500/50 text-red-400 px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-all">
              Se déconnecter
            </button>
          </div>
        </div>

        {/* 2. STATISTIQUES (La vue d'ensemble) */}
        <div>
          <StatsEglise />
        </div>

        {/* 3. GÉNÉRATEUR (L'outil principal) */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-or">🎨</span> Création de Visuels
          </h2>
          <div className="bg-[#111] rounded-3xl overflow-hidden border border-clair/5 shadow-2xl">
            <GenerateurAffiche modeleACharger={modeleClique} />
          </div>
        </div>

        {/* 4. HISTORIQUE DES MODÈLES (Les archives) */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-clair/10 pb-4">
            <span className="text-or">💾</span> Vos Modèles Sauvegardés
          </h2>
          
          {modeles.length === 0 ? (
            <p className="text-clair/50 text-center py-10 bg-sombre/50 rounded-xl border border-clair/5">
              Aucun modèle sauvegardé.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modeles.map((modele) => (
                <div key={modele.id} className="bg-sombre/80 p-6 rounded-xl border border-clair/10 hover:border-or/50 transition-colors relative group">
                  <button 
                    onClick={() => supprimerModele(modele.id)}
                    className="absolute top-4 right-4 text-clair/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Supprimer ce modèle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-or/20 to-or rounded-t-xl opacity-50"></div>
                  
                  <h3 className="text-xl font-bold mb-2 uppercase pr-8">{modele.titre}</h3>
                  <p className="text-clair/70 mb-1">🎙️ <span className="text-or">{modele.orateur}</span></p>
                  <p className="text-clair/70 text-sm">📅 {modele.date_culte}</p>
                  
                  <button 
                    onClick={() => {
                      setModeleClique(modele);
                      // Fait défiler la page doucement vers le haut jusqu'au générateur
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="mt-5 w-full bg-or/10 text-or border border-or/20 font-bold py-2 rounded-lg hover:bg-or hover:text-sombre transition-colors text-sm"
                  >
                    Utiliser ce modèle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}