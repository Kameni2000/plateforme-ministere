"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerEntree() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [historique, setHistorique] = useState<any[]>([]);
  const [dernierScan, setDernierScan] = useState<any>(null);
  const [alerte, setAlerte] = useState<string | null>(null);

  const router = useRouter();
  const scannerInitialise = useRef(false); // Pour éviter le double-rendu strict mode

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/connexion");
      else setUtilisateur(session.user);
    };
    verifierAcces();
  }, [router]);

  useEffect(() => {
    // Initialisation du scanner une seule fois
    if (!scannerInitialise.current && utilisateur) {
      scannerInitialise.current = true;
      
      const scanner = new Html5QrcodeScanner(
        "lecteur-qr",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (texteDecode) => {
          try {
            // On essaie de lire le JSON caché dans le QR Code
            const membreData = JSON.parse(texteDecode);
            
            if (membreData && membreData.nom) {
              validerEntree(membreData);
              // Pause temporaire du scanner pour ne pas scanner 100 fois la même carte en 1 seconde
              scanner.pause();
              setTimeout(() => scanner.resume(), 3000);
            }
          } catch (e) {
            setAlerte("QR Code non reconnu par ChurchHub.");
            setTimeout(() => setAlerte(null), 3000);
          }
        },
        (erreur) => {
          // Erreurs ignorées silencieusement (le scanner cherche en boucle)
        }
      );

      return () => {
        scanner.clear().catch(error => console.error("Erreur nettoyage scanner", error));
      };
    }
  }, [utilisateur]);

  const validerEntree = (membre: any) => {
    // 1. Afficher l'écran vert de validation
    setDernierScan(membre);
    
    // 2. Ajouter à l'historique
    const nouvelleEntree = {
      ...membre,
      heure: new Date().toLocaleTimeString('fr-FR'),
      id_scan: Date.now()
    };
    
    setHistorique(prev => [nouvelleEntree, ...prev]);

    // 3. Faire disparaître l'écran vert après 2.5 secondes
    setTimeout(() => {
      setDernierScan(null);
    }, 2500);

    // *Ici, dans le futur, tu pourras faire un appel Supabase pour enregistrer la présence dans la base de données !*
  };

  if (!utilisateur) return null;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 relative">
      
      {/* ÉCRAN DE SUCCÈS GÉANT (Apparaît lors du scan) */}
      {dernierScan && (
        <div className="fixed inset-0 bg-green-500 z-50 flex flex-col items-center justify-center animate-in zoom-in duration-200">
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-8xl mb-8 shadow-2xl shadow-black/30">
            ✅
          </div>
          <h1 className="text-6xl font-black text-white uppercase tracking-widest text-center px-4">
            {dernierScan.nom}
          </h1>
          <p className="text-3xl font-bold text-green-900 mt-4 bg-white/20 px-8 py-2 rounded-full">
            STATUT : {dernierScan.statut}
          </p>
          <p className="absolute bottom-10 text-white/50 font-bold tracking-widest">
            BIENVENUE À L'ÉGLISE
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/membres" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg">
              ← Retour Répertoire
            </Link>
            <h1 className="text-3xl font-bold">Poste <span className="text-or">d'Accueil</span> 📷</h1>
          </div>
          <div className="bg-sombre border border-clair/10 px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
            Présences : <span className="text-or">{historique.length}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* ZONE DE SCAN */}
          <div className="bg-[#111] p-6 rounded-3xl border border-clair/10 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Scanner un QR Code</h2>
            <p className="text-sm text-clair/50 text-center mb-6">
              Placez la carte VIP du membre devant la caméra. La validation est automatique.
            </p>
            
            {/* C'est ici que la caméra s'affiche */}
            <div className="w-full bg-black rounded-xl overflow-hidden border-4 border-or/20 relative">
              <div id="lecteur-qr" className="w-full"></div>
            </div>
            
            {alerte && (
              <div className="mt-4 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/50 w-full text-center text-sm font-bold animate-pulse">
                ⚠️ {alerte}
              </div>
            )}

            {/* ASTUCE CSS : On cache les boutons par défaut moches de la librairie pour garder un style Premium */}
            <style jsx global>{`
              #lecteur-qr img { display: none !important; }
              #lecteur-qr button { 
                background: #D4AF37 !important; 
                color: #000 !important; 
                font-weight: bold !important; 
                border-radius: 8px !important; 
                padding: 8px 16px !important; 
                border: none !important; 
                margin-top: 10px !important;
                cursor: pointer;
              }
              #lecteur-qr span { color: #fff !important; }
              #lecteur-qr select { background: #333 !important; color: #fff !important; border: 1px solid #555 !important; border-radius: 4px; padding: 5px; }
            `}</style>
          </div>

          {/* HISTORIQUE DES ENTRÉES */}
          <div className="bg-[#111] p-6 rounded-3xl border border-clair/10 shadow-xl h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 border-b border-clair/5 pb-4">
              Dernières entrées (Direct)
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {historique.length === 0 ? (
                <p className="text-center text-clair/40 italic py-10">En attente du premier membre...</p>
              ) : (
                historique.map((entree) => (
                  <div key={entree.id_scan} className="bg-sombre/80 p-4 rounded-xl border border-clair/5 flex justify-between items-center animate-in slide-in-from-left duration-300">
                    <div>
                      <h3 className="font-bold text-lg text-white">{entree.nom}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block border ${entree.statut === 'Ouvrier' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : entree.statut === 'Visiteur' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                        {entree.statut}
                      </span>
                    </div>
                    <div className="text-sm text-clair/40 font-mono">
                      {entree.heure}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}