"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { QRCodeCanvas } from "qrcode.react";

export default function PortailFidele() {
  const params = useParams();
  const idFidele = params.id;

  const [membre, setMembre] = useState<any>(null);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (idFidele) chargerDonnees();
  }, [idFidele]);

  const chargerDonnees = async () => {
    try {
      const { data: dataMembre, error: errMembre } = await supabase
        .from("membres")
        .select("*")
        .eq("id", idFidele)
        .single();

      if (errMembre || !dataMembre) {
        setErreur("Profil introuvable ou lien invalide.");
        setChargement(false);
        return;
      }
      setMembre(dataMembre);

      const { data: dataInscriptions } = await supabase
        .from("inscriptions")
        .select("*, formations(*)")
        .eq("membre_id", idFidele);

      if (dataInscriptions) setInscriptions(dataInscriptions);

    } catch (e) {
      setErreur("Une erreur est survenue.");
    }
    setChargement(false);
  };

  const getInitiales = (nomComplet: string) => {
    if (!nomComplet) return "";
    return nomComplet.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (chargement) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-or border-t-transparent rounded-full animate-spin"></div></div>;

  if (erreur) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-black text-white mb-2">Accès refusé</h1>
      <p className="text-clair/50">{erreur}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-clair pb-20 font-sans selection:bg-or selection:text-black">
      
      <div className="pt-8 pb-6 px-6 flex justify-center items-center">
        <h1 className="font-black text-xl tracking-tighter text-white">CHURCH<span className="text-or">HUB</span></h1>
      </div>

      <div className="max-w-md mx-auto px-6 space-y-10">

        {/* 1. LA CARTE VIP DIGITALE */}
        <div className="animate-in slide-in-from-top-10 fade-in duration-700">
          <p className="text-[10px] uppercase font-black text-clair/40 tracking-[0.2em] mb-3 text-center">Votre Pass Personnel</p>
          
          <div className="w-full aspect-[1.58/1] bg-gradient-to-br from-[#1a1a1a] via-[#111] to-black rounded-3xl border border-or/40 shadow-[0_15px_40px_rgba(255,215,0,0.15)] relative overflow-hidden flex flex-col justify-between p-6">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-or/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start z-10">
              <div className="bg-or/10 text-or text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-or/30">
                {membre.est_ouvrier ? "Staff Pass" : "VIP Pass"}
              </div>
            </div>

            <div className="flex justify-between items-end z-10">
              <div className="flex flex-col gap-3">
                {membre.photo_url ? (
                  <img src={membre.photo_url} alt="Profil" className="w-14 h-14 rounded-full object-cover border-2 border-or shadow-lg" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-or/20 to-or/5 border-2 border-or/50 flex items-center justify-center text-or font-black text-xl shadow-lg">
                    {getInitiales(membre.nom)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black text-white leading-none uppercase tracking-wide truncate max-w-[150px]">{membre.nom}</h2>
                  <p className="text-or/70 font-mono text-[9px] mt-1 tracking-[0.2em] uppercase">ID • {String(membre.id).padStart(6, '0')}</p>
                </div>
              </div>

              <div className="bg-white p-2 rounded-xl shadow-xl">
                <QRCodeCanvas value={String(membre.id)} size={65} bgColor="#ffffff" fgColor="#000000" level="H" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. L'ACADÉMIE : BULLETIN ET DIPLÔMES */}
        <div className="animate-in slide-in-from-bottom-10 fade-in duration-700 delay-150">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 border-b border-clair/10 pb-2">Suivi Pédagogique 🎓</h3>
          
          {inscriptions.length === 0 ? (
            <div className="bg-[#111] border border-clair/5 rounded-2xl p-6 text-center">
              <p className="text-clair/40 text-sm">Vous n'êtes inscrit à aucun parcours pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {inscriptions.map((insc) => {
                const formation = insc.formations;
                const estTermine = insc.etapes_validees >= formation.etapes_totales;
                const pourcentage = Math.round((insc.etapes_validees / formation.etapes_totales) * 100);

                return (
                  <div key={insc.id} className="relative">
                    
                    {/* LE DIPLÔME OFFICIEL (S'affiche uniquement si terminé à 100%) */}
                    {estTermine ? (
                      <div className="bg-gradient-to-b from-[#fffdf5] to-[#f4ecd8] text-black p-6 rounded-sm border-8 border-double border-[#D4AF37] shadow-[0_10px_30px_rgba(212,175,55,0.2)] text-center relative overflow-hidden transform hover:scale-[1.02] transition-transform">
                        
                        {/* Filigranes décoratifs en fond */}
                        <div className="absolute -top-10 -left-10 text-9xl opacity-5">{formation.icone}</div>
                        <div className="absolute -bottom-10 -right-10 text-9xl opacity-5">🕊️</div>
                        
                        <h4 className="text-[8px] uppercase font-black tracking-[0.4em] text-[#8b6508]/60 mb-4">Certificat Officiel • Église</h4>
                        <h2 className="text-2xl font-serif font-black text-[#8b6508] mb-6 leading-tight">CERTIFICAT D'ACCOMPLISSEMENT</h2>
                        
                        <p className="text-xs italic text-gray-600 mb-1">Décerné avec les félicitations du Ministère à :</p>
                        <p className="text-2xl font-black uppercase tracking-wide mb-6 border-b border-gray-300 pb-2 inline-block px-4">
                          {membre.nom}
                        </p>
                        
                        <p className="text-xs text-gray-700 mb-2">Pour avoir suivi et complété avec succès le parcours :</p>
                        <p className="text-lg font-bold text-[#D4AF37] bg-[#D4AF37]/10 py-2 px-4 rounded-full inline-block mx-auto border border-[#D4AF37]/30 mb-8">
                          {formation.icone} {formation.titre}
                        </p>

                        <div className="flex justify-between items-end mt-4 px-2">
                          <div className="w-20 text-center">
                            <p className="border-b border-gray-400 pb-1 text-xs font-mono font-bold">{new Date().getFullYear()}</p>
                            <p className="text-[7px] uppercase font-bold tracking-widest text-gray-500 mt-1">Promotion</p>
                          </div>
                          
                          {/* Sceau Doré */}
                          <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#aa8c2c] rounded-full flex items-center justify-center border-2 border-dashed border-white shadow-lg text-white font-black text-[8px] uppercase tracking-widest rotate-12">
                            Validé
                          </div>
                          
                          <div className="w-20 text-center">
                            <p className="border-b border-gray-400 pb-1 text-xs italic font-serif">Ministère</p>
                            <p className="text-[7px] uppercase font-bold tracking-widest text-gray-500 mt-1">Signature</p>
                          </div>
                        </div>
                      </div>

                    ) : (

                      /* LE BULLETIN DE NOTES (S'affiche si la classe est encore en cours) */
                      <div className="bg-[#111] p-5 rounded-2xl border border-clair/10">
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl border border-clair/10 shadow-inner">
                            {formation.icone}
                          </div>
                          <div>
                            <h4 className="font-bold text-white leading-tight">{formation.titre}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-clair/50">
                              En cours d'apprentissage
                            </p>
                          </div>
                        </div>

                        {/* Bulletin de progression style "Carnet" */}
                        <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                            <span className="text-[10px] uppercase font-black tracking-widest text-clair/40">📄 Bulletin Pédagogique</span>
                            <span className="text-or font-black text-sm">{pourcentage}%</span>
                          </div>
                          
                          <div className="flex justify-between text-xs font-mono text-clair/70 mb-2">
                            <span>Leçons validées</span>
                            <span className="font-bold text-white">{insc.etapes_validees} sur {formation.etapes_totales}</span>
                          </div>
                          
                          <div className="h-2.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div 
                              className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                              style={{ width: `${pourcentage}%` }}
                            ></div>
                          </div>
                          
                          <p className="text-[10px] text-center text-clair/30 italic mt-3">
                            Encore {formation.etapes_totales - insc.etapes_validees} leçon(s) pour obtenir le diplôme.
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}