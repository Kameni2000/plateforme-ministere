"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { supabase } from "../../lib/supabase";

export default function StatsEglise() {
  const [donneesFinances, setDonneesFinances] = useState<any[]>([]);
  const [donneesMembres, setDonneesMembres] = useState<any[]>([]);
  const [vueActive, setVueActive] = useState<"finances" | "membres">("finances");

  useEffect(() => {
    preparerDonnees();
  }, []);

  const preparerDonnees = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Récupérer et grouper les finances
    const { data: offrandes } = await supabase
      .from("offrandes")
      .select("montant, date_don")
      .eq("user_id", session.user.id);

    if (offrandes) {
      const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
      const stats = moisLabels.map((mois, index) => {
        const total = offrandes
          .filter(o => new Date(o.date_don).getMonth() === index)
          .reduce((sum, curr) => sum + Number(curr.montant), 0);
        return { name: mois, montant: total };
      });
      setDonneesFinances(stats.filter(s => s.montant > 0 || moisLabels.indexOf(s.name) <= new Date().getMonth()));
    }

    // 2. Récupérer et grouper les membres (croissance cumulative)
    const { data: membres } = await supabase
      .from("membres")
      .select("created_at")
      .eq("user_id", session.user.id);

    if (membres) {
      const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
      let totalCumule = 0;
      const stats = moisLabels.map((mois, index) => {
        const nouveaux = membres.filter(m => new Date(m.created_at).getMonth() === index).length;
        totalCumule += nouveaux;
        return { name: mois, total: totalCumule };
      });
      setDonneesMembres(stats.filter((s, i) => i <= new Date().getMonth()));
    }
  };

  return (
    <div className="bg-sombre/50 p-8 rounded-3xl border border-clair/10 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Analyse du <span className="text-or">Ministère</span></h2>
          <p className="text-clair/50 text-sm">Visualisation des performances en temps réel</p>
        </div>
        
        <div className="flex bg-sombre p-1 rounded-xl border border-clair/10">
          <button 
            onClick={() => setVueActive("finances")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${vueActive === "finances" ? "bg-or text-sombre" : "text-clair/60 hover:text-clair"}`}
          >
            Finances (€)
          </button>
          <button 
            onClick={() => setVueActive("membres")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${vueActive === "membres" ? "bg-or text-sombre" : "text-clair/60 hover:text-clair"}`}
          >
            Membres
          </button>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {vueActive === "finances" ? (
            <BarChart data={donneesFinances}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#111", border: "1px solid #d4af3750", borderRadius: "12px" }}
                itemStyle={{ color: "#d4af37" }}
                cursor={{ fill: "#ffffff05" }}
              />
              <Bar dataKey="montant" fill="#d4af37" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          ) : (
            <AreaChart data={donneesMembres}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#111", border: "1px solid #d4af3750", borderRadius: "12px" }}
                itemStyle={{ color: "#d4af37" }}
              />
              <Area type="monotone" dataKey="total" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}