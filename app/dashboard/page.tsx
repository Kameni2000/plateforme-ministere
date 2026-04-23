"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  
  // LE VIDEUR : Chargement strict par défaut
  const [chargementInitial, setChargementInitial] = useState(true);
  
  // États pour la création d'événement
  const [titreEvenement, setTitreEvenement] = useState("");
  const [dateEvenement, setDateEvenement] = useState("");
  const [chargementAction, setChargementAction] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const verifierIdentite = async () => {
      // On demande à Supabase si quelqu'un est connecté
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Pas de session = Expulsion vers la connexion
        router.push("/connexion");
      } else {
        // Session valide = On laisse entrer
        setUtilisateur(session.user);
        setChargementInitial(false);
      }
    };
    
    verifierIdentite();
  }, [router]);

  const seDeconnecter = async () => {
    await supabase.auth.signOut();
    router.push("/connexion");
  };

  const creerEvenement = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargementAction(true);
    
    // Simulation d'une sauvegarde dans la base de données
    setTimeout(() => {
      alert(`✅ L'événement "${titreEvenement}" a été programmé pour le ${dateEvenement} !`);
      setTitreEvenement("");
      setDateEvenement("");
      setChargementAction(false);
    }, 1000);
  };

  // ÉCRAN DE SÉCURITÉ : Tant qu'on vérifie l'identité, on ne montre rien du Dashboard
  if (chargementInitial) {
    return (
      <div className="min-h-screen bg-sombre flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-or border-t-transparent rounded-full animate-spin"></div>
        <p className="text-or mt-6 font-bold tracking-widest uppercase text-sm animate-pulse">Vérification des accès sécurisés...</p>
      </div>
    );
  }

  // AFFICHAGE DU DASHBOARD (Uniquement pour les connectés)
  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* EN-TÊTE DU DASHBOARD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-clair/10 pb-8">
          <div>
            <p className="text-clair/60 uppercase tracking-widest text-sm font-bold mb-1">Tableau de bord</p>
            <h1 className="text-4xl font-black">
              Bienvenue, <span className="text-or">{utilisateur?.user_metadata?.full_name || 'Leader'}</span> 👋
            </h1>
            <p className="text-clair/50 mt-2 text-sm">{utilisateur?.email}</p>
          </div>
          
          <button 
            onClick={seDeconnecter}
            className="border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            Se déconnecter
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* COLONNE PRINCIPALE : LES APPLICATIONS CHURCHHUB */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span>⚡</span> Accès Rapides
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              
              <Link href="/membres" className="bg-[#111] border border-clair/10 p-6 rounded-3xl hover:border-or/50 transition-all group shadow-lg">
                <div className="w-12 h-12 bg-or/10 text-or rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">👥</div>
                <h3 className="text-xl font-bold text-white mb-2">Membres & Cartes</h3>
                <p className="text-sm text-clair/50">Gérez le répertoire et générez les cartes VIP de votre église.</p>
              </Link>

              <Link href="/studio" className="bg-[#111] border border-clair/10 p-6 rounded-3xl hover:border-blue-500/50 transition-all group shadow-lg">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">Studio Social IA</h3>
                <p className="text-sm text-clair/50">Générez des scripts viraux et utilisez le téléprompteur intégré.</p>
              </Link>

              <Link href="/communication" className="bg-[#111] border border-clair/10 p-6 rounded-3xl hover:border-purple-500/50 transition-all group shadow-lg">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💌</div>
                <h3 className="text-xl font-bold text-white mb-2">Communication</h3>
                <p className="text-sm text-clair/50">Envoyez des e-mails ou des SMS groupés à vos membres.</p>
              </Link>

              <Link href="/scanner" className="bg-[#111] border border-clair/10 p-6 rounded-3xl hover:border-green-500/50 transition-all group shadow-lg">
                <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📷</div>
                <h3 className="text-xl font-bold text-white mb-2">Poste d'Accueil</h3>
                <p className="text-sm text-clair/50">Scannez les QR Codes à l'entrée pour valider les présences.</p>
              </Link>

              {/* NOUVELLE CARTE : FINANCES & OFFRANDES */}
              <Link href="/offrandes" className="bg-[#111] border border-clair/10 p-6 rounded-3xl hover:border-emerald-500/50 transition-all group shadow-lg sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">Finances & Offrandes</h3>
                <p className="text-sm text-clair/50">Gérez les dîmes, les dons et suivez la santé financière de l'église.</p>
              </Link>

            </div>
          </div>

          {/* COLONNE DROITE : ACTIONS SECONDAIRES (Ex: Événements) */}
          <div className="lg:col-span-1 space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span>📅</span> Planification
            </h2>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-or/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              {/* Effet lumineux de fond */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-or/10 blur-[50px] rounded-full"></div>

              <h3 className="text-lg font-bold text-white mb-6">Créer un nouvel événement</h3>
              
              <form onSubmit={creerEvenement} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-clair/50 mb-2">Titre de l'événement</label>
                  <input 
                    type="text" required value={titreEvenement} onChange={(e) => setTitreEvenement(e.target.value)}
                    placeholder="Ex: Culte de résurrection..."
                    className="w-full bg-black/50 border border-clair/20 rounded-xl px-4 py-3 text-sm text-clair focus:border-or outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-clair/50 mb-2">Date prévue</label>
                  <input 
                    type="date" required value={dateEvenement} onChange={(e) => setDateEvenement(e.target.value)}
                    className="w-full bg-black/50 border border-clair/20 rounded-xl px-4 py-3 text-sm text-clair focus:border-or outline-none transition-colors [color-scheme:dark]"
                  />
                </div>

                <button 
                  type="submit" disabled={chargementAction}
                  className="w-full bg-or text-sombre font-black py-3.5 rounded-xl text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 mt-2 shadow-lg shadow-or/20"
                >
                  {chargementAction ? "Création en cours..." : "+ Ajouter au calendrier"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}