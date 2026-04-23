"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Statistiques() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [presences, setPresences] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  
  // Sécurité et Mur de paiement
  const [accesBloque, setAccesBloque] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Formulaire d'ajout manuel
  const [membreSelectionne, setMembreSelectionne] = useState("");
  const [datePresence, setDatePresence] = useState(new Date().toISOString().split('T')[0]);
  const [chargement, setChargement] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/connexion");
      } else {
        setUtilisateur(session.user);
        const planUtilisateur = session.user.user_metadata?.plan || 'gratuit';
        if (planUtilisateur !== 'pro') {
          setAccesBloque(true);
          setChargementInitial(false);
        } else {
          setAccesBloque(false);
          await chargerDonnees(session.user.id);
          setChargementInitial(false);
        }
      }
    };
    verifierAcces();
  }, [router]);

  const activerModeProDev = async () => {
    const { error } = await supabase.auth.updateUser({ data: { plan: 'pro' } });
    if (!error) { alert("👑 Mode Pro activé !"); window.location.reload(); }
  };

  const chargerDonnees = async (userId: string) => {
    // 1. Charger les présences
    const { data: dataPresences } = await supabase
      .from('presences')
      .select('*')
      .eq('user_id', userId)
      .order('date_presence', { ascending: false });
    if (dataPresences) setPresences(dataPresences);

    // 2. Charger les membres pour la liste déroulante
    const { data: dataMembres } = await supabase
      .from('membres')
      .select('nom')
      .eq('user_id', userId)
      .order('nom', { ascending: true });
    if (dataMembres) {
      setMembres(dataMembres);
      if (dataMembres.length > 0) setMembreSelectionne(dataMembres[0].nom);
    }
  };

  const soumettrePresence = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    
    const { error } = await supabase.from('presences').insert([{
      user_id: utilisateur.id,
      membre_nom: membreSelectionne,
      date_presence: datePresence
    }]);

    if (!error) {
      await chargerDonnees(utilisateur.id);
    } else {
      alert("Erreur : " + error.message);
    }
    setChargement(false);
  };

  const supprimerPresence = async (id: number) => {
    if (!confirm("Effacer cet enregistrement ?")) return;
    const { error } = await supabase.from('presences').delete().eq('id', id);
    if (!error) setPresences(presences.filter(p => p.id !== id));
  };

  // PRÉPARATION DES DONNÉES POUR LE GRAPHIQUE (Comptage par jour)
  const preparerDonneesGraphique = () => {
    const comptage = presences.reduce((acc: any, current) => {
      const date = current.date_presence;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(comptage)
      .map(date => ({
        date: date,
        dateFormatee: date.split('-').reverse().slice(0, 2).join('/'), // ex: 15/04
        visiteurs: comptage[date]
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const donneesGraphique = preparerDonneesGraphique();
  const totalPresences = presences.length;

  if (chargementInitial) return <div className="min-h-screen bg-sombre flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (accesBloque) {
    return (
      <div className="min-h-screen bg-sombre text-clair pt-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-lg bg-[#111] p-10 rounded-3xl border border-blue-500/30 shadow-2xl">
          <div className="text-6xl mb-6">📊</div>
          <h1 className="text-3xl font-black mb-4">Analytics <span className="text-blue-500">Premium</span></h1>
          <p className="text-clair/70 mb-8">Le suivi avancé des présences et de la croissance est réservé au <strong className="text-white">Plan Pro</strong>.</p>
          <button className="w-full bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-600 transition-all">Passer au Plan Pro</button>
          <button onClick={activerModeProDev} className="mt-8 text-[10px] text-clair/20 font-mono hover:text-clair/80 transition-colors">[ DevMode : Forcer accès ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-clair/10 pb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-blue-500 bg-blue-500/10 p-2 rounded-lg hover:bg-blue-500 hover:text-white transition-all">← Dashboard</Link>
            <h1 className="text-3xl font-black">Suivi des <span className="text-blue-500">Présences</span></h1>
          </div>
          <div className="text-right mt-4 md:mt-0 bg-[#111] border border-blue-500/30 px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/10">
            <p className="text-xs text-clair/40 uppercase font-bold tracking-widest mb-1">Total Enregistrements</p>
            <div className="text-3xl font-black text-blue-400">
              {totalPresences} <span className="text-sm text-clair/50 font-normal">visites</span>
            </div>
          </div>
        </div>

        {/* GRAPHIQUE DES PRÉSENCES (BAR CHART) */}
        <div className="bg-[#111] border border-clair/10 p-6 rounded-3xl mb-12 shadow-xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Croissance de l'audience
          </h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height={300} minWidth={1}>
              <BarChart data={donneesGraphique}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="dateFormatee" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #3b82f640', borderRadius: '12px' }} 
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }} 
                  cursor={{fill: '#ffffff05'}}
                />
                <Bar dataKey="visiteurs" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {donneesGraphique.length === 0 && <div className="text-center text-clair/40 italic -mt-32 pb-32">Aucune donnée suffisante pour générer le graphique.</div>}
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* FORMULAIRE D'AJOUT MANUEL */}
          <div className="p-8 rounded-3xl bg-[#111] border border-clair/10 sticky top-32 lg:col-span-1">
            <h2 className="text-xl font-bold mb-6">✅ Pointage Manuel</h2>
            <p className="text-xs text-clair/50 mb-6">Utile si un membre a oublié sa carte VIP ou pour un événement en petit groupe.</p>

            <form onSubmit={soumettrePresence} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Membre présent</label>
                {membres.length > 0 ? (
                  <select value={membreSelectionne} onChange={(e) => setMembreSelectionne(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 appearance-none transition-colors text-white">
                    {membres.map((m, idx) => (
                      <option key={idx} value={m.nom}>{m.nom}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-sombre border border-clair/10 p-3 rounded-xl text-sm text-clair/40 italic">Aucun membre dans votre répertoire. <Link href="/membres" className="text-blue-500 underline">Ajouter</Link></div>
                )}
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Date de la présence</label>
                <input type="date" required value={datePresence} onChange={(e) => setDatePresence(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 [color-scheme:dark] outline-none focus:border-blue-500 transition-colors text-white"/>
              </div>
              
              <button type="submit" disabled={chargement || membres.length === 0} className="w-full py-4 rounded-xl font-black shadow-lg bg-blue-500 text-white shadow-blue-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50 mt-4">
                {chargement ? "Pointage..." : "Valider la présence"}
              </button>
            </form>
          </div>

          {/* HISTORIQUE DES POINTAGES */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6">Historique récent</h2>
            <div className="bg-[#111] rounded-3xl border border-clair/10 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-sombre/80 border-b border-clair/10 text-xs uppercase text-clair/40 tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Date</th>
                    <th className="px-6 py-5">Membre</th>
                    <th className="px-6 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clair/5">
                  {presences.map((p) => (
                    <tr key={p.id} className="group hover:bg-clair/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-clair/60">{p.date_presence.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">
                          {p.membre_nom.charAt(0).toUpperCase()}
                        </div>
                        {p.membre_nom}
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => supprimerPresence(p.id)} className="hover:text-red-500 transition-colors bg-sombre p-2 rounded-lg border border-clair/10 text-xs">Annuler</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {presences.length === 0 && (
                <div className="p-10 text-center text-clair/40 italic">Personne n'a encore été pointé présent.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}