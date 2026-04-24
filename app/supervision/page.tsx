"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function SupervisionDirect() {
  const [presencesLive, setPresencesLive] = useState<any[]>([]);
  const [totalAujourdhui, setTotalAujourdhui] = useState(0);

  useEffect(() => {
    chargerPresencesDuJour();

    // LE CŒUR DU SYSTÈME : Écoute les scans en temps réel (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'presences' },
        (payload) => {
          // Un téléphone vient de scanner une carte !
          const nouvellePresence = payload.new;
          
          // On ajoute la nouvelle présence en haut de la liste sans rafraîchir
          setPresencesLive((anciennes) => [nouvellePresence, ...anciennes]);
          setTotalAujourdhui((total) => total + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chargerPresencesDuJour = async () => {
    const aujourdHui = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('presences')
      .select('*')
      .eq('date_presence', aujourdHui)
      .order('created_at', { ascending: false });

    if (data) {
      setPresencesLive(data);
      setTotalAujourdhui(data.length);
    }
  };

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* EN-TÊTE DU MINISTÈRE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg">← Dashboard</Link>
            <h1 className="text-3xl font-black text-white">Tour de Contrôle <span className="text-or">Live</span> 📡</h1>
          </div>
          
          <div className="flex items-center gap-4 bg-[#111] border border-or/30 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.1)] mt-6 md:mt-0">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-clair/50">Total Présences</p>
              <p className="text-4xl font-black text-white leading-none">{totalAujourdhui}</p>
            </div>
          </div>
        </div>

        {/* LISTE DES SCANS EN TEMPS RÉEL */}
        <div className="bg-[#111] rounded-[40px] border border-clair/10 shadow-2xl p-8 overflow-hidden relative">
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Flux des entrées <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-500/20">En direct</span>
            </h2>
          </div>

          <div className="space-y-4">
            {presencesLive.length === 0 ? (
              <div className="py-20 text-center text-clair/30 italic font-bold">
                L'église est vide. En attente des premiers scans...
              </div>
            ) : (
              presencesLive.map((presence, idx) => (
                <div 
                  key={presence.id || idx} 
                  className="bg-sombre/50 p-4 rounded-2xl border border-clair/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top-4 fade-in duration-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-or/10 text-or font-black rounded-full flex items-center justify-center text-xl border border-or/20 shadow-lg">
                      {presence.membre_nom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{presence.membre_nom}</h3>
                      <p className="text-xs text-emerald-400 font-mono mt-1">✓ Autorisation validée</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-right bg-black/40 px-6 py-3 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-clair/30 mb-1">Scanné par</p>
                      <p className="text-sm font-bold text-clair/70 flex items-center gap-2">
                        📱 {presence.scanne_par || 'Admin'}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-clair/10"></div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-clair/30 mb-1">Heure</p>
                      <p className="text-sm font-mono text-white font-bold">
                        {new Date(presence.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}