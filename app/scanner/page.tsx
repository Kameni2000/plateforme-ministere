"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Html5QrcodeScanner } from "html5-qrcode";
import confetti from "canvas-confetti";

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

  // 🔊 Générateur de son
  const emettreSon = (type: 'succes' | 'erreur' | 'sortie') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'succes') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'sortie') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'square'; osc.frequency.setValueAtTime(300, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!scannerInitialise.current && utilisateur) {
      scannerInitialise.current = true;
      
      const scanner = new Html5QrcodeScanner(
        "lecteur-qr",
        { fps: 15, qrbox: { width: 280, height: 280 } },
        false
      );

      scanner.render(
        async (texteDecode) => {
          scanner.pause();
          
          try {
            // 1. On cherche le membre scanné
            const { data: membre } = await supabase
              .from('membres')
              .select('*')
              .eq('id', texteDecode)
              .single();

            if (membre) {
              // Vérification anniversaire
              let estAnniversaire = false;
              if (membre.date_naissance) {
                const dn = new Date(membre.date_naissance); const auj = new Date();
                if (dn.getDate() === auj.getDate() && dn.getMonth() === auj.getMonth()) estAnniversaire = true;
              }

              // 2. On vérifie la présence du jour
              const aujourdHui = new Date().toISOString().split('T')[0];
              const { data: presenceAujourdhui } = await supabase
                .from('presences')
                .select('*')
                .eq('membre_nom', membre.nom)
                .eq('date_presence', aujourdHui)
                .single();

              if (!presenceAujourdhui) {
                // CAS A : PREMIER POINTAGE = ENTRÉE (Pour tout le monde)
                await supabase.from('presences').insert([{
                  user_id: utilisateur.id,
                  membre_nom: membre.nom,
                  date_presence: aujourdHui,
                  scanne_par: utilisateur.email
                }]);
                validerAction(membre, 'entree', estAnniversaire);
              } 
              else {
                // CAS B : DÉJÀ POINTÉ
                if (membre.est_ouvrier) {
                  // C'EST UN OUVRIER/BÉNÉVOLE !
                  if (!presenceAujourdhui.heure_sortie) {
                    // Il n'est pas encore sorti = POINTAGE DE SORTIE
                    await supabase.from('presences').update({
                      heure_sortie: new Date().toISOString()
                    }).eq('id', presenceAujourdhui.id);
                    validerAction(membre, 'sortie', estAnniversaire);
                  } else {
                    // Il est déjà entré ET sorti.
                    emettreSon('erreur');
                    setAlerte("Service déjà terminé aujourd'hui.");
                    setTimeout(() => setAlerte(null), 3000);
                  }
                } else {
                  // C'EST UN FIDÈLE CLASSIQUE : On bloque le double scan
                  emettreSon('erreur');
                  setAlerte("Présence déjà enregistrée à l'accueil.");
                  setTimeout(() => setAlerte(null), 3000);
                }
              }

            } else {
              emettreSon('erreur');
              if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
              setAlerte("Carte VIP non reconnue.");
              setTimeout(() => setAlerte(null), 3000);
            }
          } catch (e) {
            emettreSon('erreur');
            setAlerte("Erreur de lecture du code.");
            setTimeout(() => setAlerte(null), 3000);
          }

          setTimeout(() => scanner.resume(), 3000);
        },
        (erreur) => {}
      );

      return () => { scanner.clear().catch(e => console.error(e)); };
    }
  }, [utilisateur]);

  const validerAction = (membre: any, action: 'entree' | 'sortie', estAnniversaire: boolean) => {
    
    // Feedback sensoriel différent selon l'entrée ou la sortie
    if (action === 'entree') {
      emettreSon('succes');
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#FFFFFF'] });
    } else {
      emettreSon('sortie');
      if (navigator.vibrate) navigator.vibrate([100]);
    }

    setDernierScan({ ...membre, estAnniversaire, action });
    
    const nouvelleEntree = { 
      ...membre, 
      heure: new Date().toLocaleTimeString('fr-FR'), 
      id_scan: Date.now(),
      estAnniversaire,
      action
    };
    
    setHistorique(prev => [nouvelleEntree, ...prev]);
    setTimeout(() => setDernierScan(null), estAnniversaire ? 3500 : 2000);
  };

  if (!utilisateur) return <div className="min-h-screen bg-sombre flex items-center justify-center"><div className="w-12 h-12 border-4 border-or border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 relative">
      
      {/* ÉCRAN GÉANT (Vert pour l'entrée, Bleu pour la sortie) */}
      {dernierScan && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center animate-in zoom-in duration-200 ${
          dernierScan.estAnniversaire ? 'bg-gradient-to-br from-purple-600 to-indigo-900' : 
          dernierScan.action === 'sortie' ? 'bg-blue-600' : 'bg-emerald-500'
        }`}>
          
          <div className="relative">
            {dernierScan.photo_url ? (
              <img src={dernierScan.photo_url} alt={dernierScan.nom} className={`w-48 h-48 rounded-full object-cover border-8 mb-8 shadow-2xl ${dernierScan.estAnniversaire ? 'border-or' : 'border-white'}`} />
            ) : (
              <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-8xl mb-8 shadow-2xl">
                {dernierScan.action === 'sortie' ? '👋' : '✅'}
              </div>
            )}
            {dernierScan.estAnniversaire && <div className="absolute -top-8 -right-4 text-6xl animate-bounce">👑</div>}
          </div>

          <h1 className="text-6xl font-black text-white uppercase tracking-widest text-center px-4 leading-tight">
            {dernierScan.nom}
          </h1>
          
          {dernierScan.estAnniversaire ? (
            <div className="mt-6 flex flex-col items-center animate-pulse">
              <p className="text-4xl font-black text-or uppercase tracking-widest text-center">JOYEUX ANNIVERSAIRE ! 🎂</p>
            </div>
          ) : dernierScan.action === 'sortie' ? (
            <p className="text-3xl font-bold text-blue-900 mt-4 bg-white/20 px-8 py-2 rounded-full shadow-lg">👋 FIN DE SERVICE ENREGISTRÉE</p>
          ) : (
            <p className="text-3xl font-bold text-emerald-900 mt-4 bg-white/20 px-8 py-2 rounded-full shadow-lg">⭐ ACCÈS VIP VALIDÉ</p>
          )}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/dashboard" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg font-bold">← Quitter</Link>
            <h1 className="text-3xl font-bold">Scanner <span className="text-or">Mobile</span> 📱</h1>
          </div>
          <div className="bg-[#111] border border-clair/10 px-6 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3">
            Flux local : <span className="text-or text-2xl font-black">{historique.length}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* ZONE DE SCAN */}
          <div className="bg-[#111] p-6 rounded-3xl border border-clair/10 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> Caméra Active
            </h2>
            
            <div className="w-full bg-black rounded-3xl overflow-hidden border-4 border-or/20 relative shadow-[0_0_40px_rgba(255,215,0,0.1)]">
              <div id="lecteur-qr" className="w-full"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-full h-full border-2 border-or/40 border-dashed rounded-2xl"></div>
              </div>
            </div>
            
            {alerte && <div className="mt-4 bg-red-500/20 text-red-400 px-4 py-3 rounded-xl border border-red-500/50 w-full text-center font-bold animate-in shake">{alerte}</div>}
            
            <style jsx global>{`
              #lecteur-qr img { display: none !important; }
              #lecteur-qr button { background: linear-gradient(to right, #D4AF37, #F3E5AB) !important; color: #000 !important; font-weight: 900 !important; border-radius: 12px !important; padding: 14px 24px !important; border: none !important; margin-top: 20px !important; cursor: pointer; transition: transform 0.2s; text-transform: uppercase; letter-spacing: 1px;}
              #lecteur-qr span { color: #fff !important; }
              #lecteur-qr select { background: #1a1a1a !important; color: #fff !important; border: 1px solid #333 !important; border-radius: 12px; padding: 12px; margin-bottom: 10px; width: 100%; font-weight: bold;}
              #html5-qrcode-button-camera-permission, #html5-qrcode-button-camera-start, #html5-qrcode-button-camera-stop { font-size: 0 !important; }
              #html5-qrcode-button-camera-permission::after { content: "📸 AUTORISER LA CAMÉRA"; font-size: 14px !important; }
              #html5-qrcode-button-camera-start::after { content: "▶️ DÉMARRER LE SCANNER"; font-size: 14px !important; }
              #html5-qrcode-button-camera-stop::after { content: "⏹️ ARRÊTER LA CAMÉRA"; font-size: 14px !important; }
              #html5-qrcode-anchor-scan-type-change { display: none !important; }
            `}</style>
          </div>

          {/* HISTORIQUE */}
          <div className="bg-[#111] p-6 rounded-3xl border border-clair/10 shadow-xl h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 border-b border-clair/5 pb-4">Historique de la porte</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {historique.map((entree) => (
                <div key={entree.id_scan} className="p-4 rounded-2xl border border-clair/5 bg-sombre/80 flex justify-between items-center animate-in slide-in-from-left duration-300">
                  <div className="flex items-center gap-4">
                    {entree.photo_url ? (
                      <img src={entree.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-or/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2 bg-or/10 text-or border-or/20">{entree.nom.charAt(0)}</div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-white">{entree.nom}</h3>
                      {/* Affichage du Badge ENTRÉE ou SORTIE */}
                      {entree.action === 'sortie' ? (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block border bg-blue-500/20 text-blue-400 border-blue-500/30">Sortie Staff</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Entrée</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-clair/40 font-mono bg-black px-3 py-2 rounded-xl border border-white/5">{entree.heure}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}