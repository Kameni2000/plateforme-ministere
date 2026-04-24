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
  const scannerInitialise = useRef(false);

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/connexion");
      else setUtilisateur(session.user);
    };
    verifierAcces();
  }, [router]);

  useEffect(() => {
    if (!scannerInitialise.current && utilisateur) {
      scannerInitialise.current = true;
      
      const scanner = new Html5QrcodeScanner(
        "lecteur-qr",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (texteDecode) => {
          // 1. Pause temporaire du scanner
          scanner.pause();
          
          try {
            // 2. Chercher à qui appartient cet ID dans la base de données !
            const { data: membre, error } = await supabase
              .from('membres')
              .select('*')
              .eq('id', texteDecode) // On cherche le numéro de la Carte VIP
              .eq('user_id', utilisateur.id)
              .single();

            if (membre) {
              validerEntree(membre);
              
              // 3. Enregistrer automatiquement la présence pour tes Statistiques ! 📈
              const aujourdHui = new Date().toISOString().split('T')[0];
              
              // On vérifie s'il n'a pas déjà été bipé aujourd'hui pour éviter les doublons
              const { data: dejaPresent } = await supabase
                .from('presences')
                .select('id')
                .eq('membre_nom', membre.nom)
                .eq('date_presence', aujourdHui)
                .single();

              if (!dejaPresent) {
                await supabase.from('presences').insert([{
                  user_id: utilisateur.id,
                  membre_nom: membre.nom,
                  date_presence: aujourdHui
                }]);
              }

            } else {
              setAlerte("Carte VIP non reconnue par l'église.");
              setTimeout(() => setAlerte(null), 3000);
            }
          } catch (e) {
            setAlerte("Erreur de lecture du QR Code.");
            setTimeout(() => setAlerte(null), 3000);
          }

          // 4. On relance le scanner après 3 secondes pour scanner le suivant
          setTimeout(() => scanner.resume(), 3000);
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
    setDernierScan(membre);
    
    const nouvelleEntree = {
      ...membre,
      heure: new Date().toLocaleTimeString('fr-FR'),
      id_scan: Date.now()
    };
    
    setHistorique(prev => [nouvelleEntree, ...prev]);

    setTimeout(() => {
      setDernierScan(null);
    }, 2500);
  };

  if (!utilisateur) return <div className="min-h-screen bg-sombre flex items-center justify-center"><div className="w-12 h-12 border-4 border-or border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 relative">
      
      {/* ÉCRAN DE SUCCÈS GÉANT (Apparaît lors du scan) */}
      {dernierScan && (
        <div className="fixed inset-0 bg-emerald-500 z-50 flex flex-col items-center justify-center animate-in zoom-in duration-200">
          
          {/* Si le membre a une photo, on l'affiche en géant, sinon un gros Emoji ! */}
          {dernierScan.photo_url ? (
            <img src={dernierScan.photo_url} alt={dernierScan.nom} className="w-48 h-48 rounded-full object-cover border-8 border-white mb-8 shadow-2xl shadow-black/30" />
          ) : (
            <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-8xl mb-8 shadow-2xl shadow-black/30">
              ✅
            </div>
          )}

          <h1 className="text-6xl font-black text-white uppercase tracking-widest text-center px-4">
            {dernierScan.nom}
          </h1>
          <p className="text-3xl font-bold text-emerald-900 mt-4 bg-white/20 px-8 py-2 rounded-full flex items-center gap-2">
            ⭐ MEMBRE VIP 
          </p>
          <p className="absolute bottom-10 text-white/50 font-bold tracking-widest">
            BIENVENUE À L'ÉGLISE
          </p>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/dashboard" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Poste <span className="text-or">d'Accueil</span> 📷</h1>
          </div>
          <div className="bg-[#111] border border-clair/10 px-6 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3">
            Présences validées : <span className="text-or text-2xl font-black">{historique.length}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* ZONE DE SCAN */}
          <div className="bg-[#111] p-6 rounded-3xl border border-clair/10 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Scanner un QR Code</h2>
            <p className="text-sm text-clair/50 text-center mb-6">
              Placez la carte VIP du membre devant la caméra. La validation est automatique.
            </p>
            
            <div className="w-full bg-black rounded-xl overflow-hidden border-4 border-or/20 relative">
              <div id="lecteur-qr" className="w-full"></div>
            </div>
            
            {alerte && (
              <div className="mt-4 bg-red-500/20 text-red-400 px-4 py-3 rounded-lg border border-red-500/50 w-full text-center font-bold animate-pulse">
                {alerte}
              </div>
            )}

            <style jsx global>{`
              #lecteur-qr img { display: none !important; }
              #lecteur-qr button { 
                background: #D4AF37 !important; 
                color: #000 !important; 
                font-weight: bold !important; 
                border-radius: 8px !important; 
                padding: 12px 24px !important; 
                border: none !important; 
                margin-top: 15px !important;
                cursor: pointer;
                transition: transform 0.2s;
              }
              #lecteur-qr button:hover { transform: scale(1.05); }
              #lecteur-qr span { color: #fff !important; }
              #lecteur-qr select { background: #111 !important; color: #fff !important; border: 1px solid #333 !important; border-radius: 8px; padding: 10px; margin-bottom: 10px; width: 100%;}
            `}</style>
          </div>

          {/* HISTORIQUE DES ENTRÉES */}
          <div className="bg-[#111] p-6 rounded-3xl border border-clair/10 shadow-xl h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 border-b border-clair/5 pb-4 flex justify-between items-center">
              Dernières entrées
              <span className="text-xs text-clair/40 font-normal flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> En direct
              </span>
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {historique.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <span className="text-6xl mb-4">⌛</span>
                  <p className="text-center italic">En attente du premier membre...</p>
                </div>
              ) : (
                historique.map((entree) => (
                  <div key={entree.id_scan} className="bg-sombre/80 p-4 rounded-xl border border-clair/5 flex justify-between items-center animate-in slide-in-from-left duration-300">
                    <div className="flex items-center gap-4">
                      {/* Affichage de la photo miniature dans l'historique */}
                      {entree.photo_url ? (
                        <img src={entree.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-or/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-or/10 flex items-center justify-center text-or font-bold border border-or/20">
                          {entree.nom.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-white">{entree.nom}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block border bg-or/10 text-or border-or/20">
                          Membre VIP
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-clair/40 font-mono bg-black px-3 py-1 rounded-lg">
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