"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Contributions() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  
  const [accesBloque, setAccesBloque] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);

  const [contributionEnEdition, setContributionEnEdition] = useState<any>(null);
  const [typeContribution, setTypeContribution] = useState<"argent" | "nature">("argent");
  
  // ÉTATS DU FORMULAIRE
  const [donateur, setDonateur] = useState(""); 
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState("Offrande Générale");
  const [dateDon, setDateDon] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
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
          await chargerContributions(session.user.id);
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

  const chargerContributions = async (userId: string) => {
    const { data, error } = await supabase
      .from('offrandes')
      .select('*')
      .eq('user_id', userId)
      .order('date_don', { ascending: false });
    if (!error && data) setContributions(data);
  };

  const commencerEdition = (don: any) => {
    setContributionEnEdition(don);
    setTypeContribution(don.montant > 0 ? "argent" : "nature");
    setDonateur(don.donateur || "");
    setMontant(don.montant > 0 ? don.montant.toString() : "");
    setCategorie(don.type_don);
    setDateDon(don.date_don);
    setDescription(don.note || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerEdition = () => {
    setContributionEnEdition(null); 
    setTypeContribution("argent"); 
    setDonateur("");
    setMontant("");
    setCategorie("Offrande Générale"); 
    setDateDon(new Date().toISOString().split('T')[0]); 
    setDescription("");
  };

  const preparerDonneesGraphique = () => {
    const donsArgent = contributions
      .filter(c => Number(c.montant) > 0)
      .reduce((acc: any[], current) => {
        const existant = acc.find(item => item.date === current.date_don);
        if (existant) {
          existant.montant += Number(current.montant);
        } else {
          acc.push({ date: current.date_don, montant: Number(current.montant) });
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return donsArgent.map(d => ({
      ...d,
      dateFormatee: d.date.split('-').reverse().slice(0, 2).join('/')
    }));
  };

  const donneesGraphique = preparerDonneesGraphique();

  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    
    const donnees = {
      user_id: utilisateur.id,
      donateur: donateur, 
      montant: typeContribution === "argent" ? parseFloat(montant) : 0,
      type_don: categorie,
      date_don: dateDon,
      note: description
    };

    if (contributionEnEdition) {
      const { error } = await supabase.from('offrandes').update(donnees).eq('id', contributionEnEdition.id);
      if (!error) { 
        annulerEdition(); 
        chargerContributions(utilisateur.id); 
      } else {
        alert("Erreur lors de la mise à jour : " + error.message);
      }
    } else {
      const { error } = await supabase.from('offrandes').insert([donnees]);
      if (!error) { 
        annulerEdition(); 
        chargerContributions(utilisateur.id); 
      } else {
        alert("Erreur lors de l'enregistrement : " + error.message);
      }
    }
    setChargement(false);
  };

  const supprimerDon = async (id: number) => {
    if (!confirm("Effacer cet enregistrement ?")) return;
    const { error } = await supabase.from('offrandes').delete().eq('id', id);
    if (!error) setContributions(contributions.filter(c => c.id !== id));
  };

  // NOUVELLE FONCTION : L'EXPORT CSV POUR LE COMPTABLE 📉
  const exporterEnCSV = () => {
    // 1. Définir les en-têtes du fichier Excel
    const entetes = ["Date", "Donateur", "Catégorie", "Montant (€)", "Nature / Note"];

    // 2. Transformer nos données en format CSV
    const lignes = contributions.map(c => [
      c.date_don,
      `"${c.donateur || 'Anonyme'}"`,
      `"${c.type_don}"`,
      c.montant,
      `"${(c.note || '').replace(/"/g, '""')}"` // Gère les guillemets dans les notes
    ]);

    // 3. Assembler le tout
    const contenuCSV = [entetes.join(","), ...lignes.map(l => l.join(","))].join("\n");

    // 4. Créer le fichier virtuel et forcer le téléchargement
    const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
    const lien = document.createElement("a");
    const url = URL.createObjectURL(blob);
    lien.setAttribute("href", url);
    lien.setAttribute("download", `churchhub_finances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
  };

  const totalFinancier = contributions.reduce((sum, c) => sum + Number(c.montant), 0);

  if (chargementInitial) return <div className="min-h-screen bg-sombre flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (accesBloque) {
    return (
      <div className="min-h-screen bg-sombre text-clair pt-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-lg bg-[#111] p-10 rounded-3xl border border-emerald-500/30 shadow-2xl">
          <div className="text-6xl mb-6">💰</div>
          <h1 className="text-3xl font-black mb-4">Trésorerie <span className="text-emerald-500">Premium</span></h1>
          <p className="text-clair/70 mb-8">Le suivi financier complet est réservé au <strong className="text-white">Plan Pro</strong>.</p>
          <button className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg hover:bg-emerald-600 transition-all">Passer au Plan Pro</button>
          <button onClick={activerModeProDev} className="mt-8 text-[10px] text-clair/20 font-mono hover:text-clair/80 transition-colors">[ DevMode : Forcer accès ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-clair/10 pb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-emerald-500 bg-emerald-500/10 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all">← Dashboard</Link>
            <h1 className="text-3xl font-black">Gestion <span className="text-emerald-500">Financière</span></h1>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <p className="text-xs text-clair/40 uppercase font-bold tracking-widest mb-1">Total Trésorerie</p>
            <div className="text-3xl font-black text-emerald-400">
              {totalFinancier.toLocaleString('fr-FR')} €
            </div>
          </div>
        </div>

        {/* GRAPHIQUE */}
        <div className="bg-[#111] border border-clair/10 p-6 rounded-3xl mb-12 shadow-xl">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Évolution des Offrandes
          </h2>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height={280} minWidth={1}>
              <AreaChart data={donneesGraphique}>
                <defs>
                  <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="dateFormatee" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '12px' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="montant" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMontant)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* FORMULAIRE */}
          <div className={`p-8 rounded-3xl border transition-all duration-300 lg:col-span-1 sticky top-32 ${contributionEnEdition ? 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/20' : (typeContribution === 'nature' ? 'bg-blue-500/5 border-blue-500/50' : 'bg-[#111] border-clair/10')}`}>
            
            <h2 className="text-xl font-bold mb-6 flex justify-between items-center">
              {contributionEnEdition ? <span className="text-emerald-400">✏️ Mode Édition</span> : "Nouveau Don"}
            </h2>

            <div className="flex gap-2 mb-6 bg-sombre p-1 rounded-lg border border-clair/10">
              <button type="button" onClick={() => setTypeContribution("argent")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${typeContribution === "argent" ? "bg-emerald-500 text-white" : "text-clair/50"}`}>💰 Argent</button>
              <button type="button" onClick={() => setTypeContribution("nature")} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${typeContribution === "nature" ? "bg-blue-500 text-white" : "text-clair/50"}`}>🎁 Nature</button>
            </div>

            <form onSubmit={soumettreFormulaire} className="space-y-4">
              
              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Donateur / Famille</label>
                <input type="text" placeholder="Ex: Famille Dupont" value={donateur} onChange={(e) => setDonateur(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-white"/>
              </div>

              {typeContribution === "argent" && (
                <div><label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Montant (€) *</label><input type="number" step="0.01" required value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 text-xl font-bold text-white outline-none focus:border-emerald-500 transition-colors"/></div>
              )}
              
              <div><label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Catégorie</label><select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 appearance-none transition-colors text-white"><option value="Offrande Générale">Offrande Générale</option><option value="Dîme">Dîme</option><option value="Action de Grâce">Action de Grâce</option></select></div>
              
              <div><label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Date</label><input type="date" required value={dateDon} onChange={(e) => setDateDon(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 [color-scheme:dark] outline-none focus:border-emerald-500 transition-colors text-white"/></div>
              
              <div><label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Notes / Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 h-20 outline-none focus:border-emerald-500 transition-colors text-white" placeholder="Détails supplémentaires..."/></div>
              
              <div className="pt-2">
                <button type="submit" disabled={chargement} className={`w-full py-4 rounded-xl font-black shadow-lg transition-transform hover:scale-[1.02] ${contributionEnEdition ? 'bg-emerald-400 text-sombre' : (typeContribution === 'nature' ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20')}`}>
                  {chargement ? "Traitement..." : (contributionEnEdition ? "Mettre à jour ce don" : "Enregistrer le don")}
                </button>
                
                {contributionEnEdition && (
                  <button type="button" onClick={annulerEdition} className="w-full border border-red-500/30 text-red-400 font-bold py-3 rounded-xl mt-3 hover:bg-red-500 hover:text-white transition-colors">
                    Annuler la modification
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* TABLEAU ET BOUTON EXPORT */}
          <div className="lg:col-span-2">
            
            {/* NOUVEAU : ZONE DE RECHERCHE + BOUTON EXPORT */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <input type="text" placeholder="Rechercher par donateur, catégorie..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full bg-[#111] border border-clair/10 rounded-2xl px-6 py-4 text-lg outline-none focus:border-emerald-500 transition-colors text-white" />
              </div>
              <button 
                onClick={exporterEnCSV} 
                className="bg-sombre border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>📥</span> Exporter (CSV)
              </button>
            </div>

            <div className="bg-[#111] rounded-3xl border border-clair/10 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-sombre/80 border-b border-clair/10 text-xs uppercase text-clair/40 tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Date</th>
                    <th className="px-6 py-5">Donateur</th>
                    <th className="px-6 py-5">Catégorie</th>
                    <th className="px-6 py-5">Valeur / Note</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clair/5">
                  {contributions.filter(c => 
                    c.type_don.toLowerCase().includes(recherche.toLowerCase()) || 
                    (c.donateur && c.donateur.toLowerCase().includes(recherche.toLowerCase())) ||
                    (c.note && c.note.toLowerCase().includes(recherche.toLowerCase()))
                  ).map((c) => (
                    <tr key={c.id} className="group hover:bg-clair/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-clair/60">{c.date_don.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4 font-bold text-white">{c.donateur || <span className="italic text-clair/30">Anonyme</span>}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${c.montant > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{c.type_don}</span></td>
                      <td className="px-6 py-4">
                        {c.montant > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-400 text-lg">{Number(c.montant).toLocaleString('fr-FR')} €</span>
                            {c.note && <span className="text-[10px] text-clair/40 italic">{c.note}</span>}
                          </div>
                        ) : (
                          <span className="text-white">📦 {c.note}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => commencerEdition(c)} className="mr-3 hover:text-emerald-500 transition-colors bg-sombre p-2 rounded-lg border border-clair/10">✏️</button>
                        <button onClick={() => supprimerDon(c.id)} className="hover:text-red-500 transition-colors bg-sombre p-2 rounded-lg border border-clair/10">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contributions.length === 0 && (
                <div className="p-10 text-center text-clair/40 italic">Aucune donnée trouvée.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}