"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Contributions() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  
  // États du formulaire
  const [contributionEnEdition, setContributionEnEdition] = useState<any>(null);
  const [typeContribution, setTypeContribution] = useState<"argent" | "nature">("argent");
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
        chargerContributions(session.user.id);
      }
    };
    verifierAcces();
  }, [router]);

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
    // On devine le type selon le montant (0 = nature)
    setTypeContribution(don.montant > 0 ? "argent" : "nature");
    setMontant(don.montant > 0 ? don.montant.toString() : "");
    setCategorie(don.type_don);
    setDateDon(don.date_don);
    setDescription(don.note || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerEdition = () => {
    setContributionEnEdition(null);
    setTypeContribution("argent");
    setMontant("");
    setCategorie("Offrande Générale");
    setDateDon(new Date().toISOString().split('T')[0]);
    setDescription("");
  };

  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);

    const donnees = {
      user_id: utilisateur.id,
      // Si c'est en nature, le montant est enregistré comme 0
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
      }
    } else {
      const { error } = await supabase.from('offrandes').insert([donnees]);
      if (!error) {
        setMontant(""); setDescription("");
        chargerContributions(utilisateur.id);
      }
    }
    setChargement(false);
  };

  const supprimerDon = async (id: number) => {
    if (!confirm("Effacer cet enregistrement ?")) return;
    const { error } = await supabase.from('offrandes').delete().eq('id', id);
    if (!error) setContributions(contributions.filter(c => c.id !== id));
  };

  // Filtrage pour la recherche
  const contributionsFiltrees = contributions.filter((c) => {
    const terme = recherche.toLowerCase();
    return (
      c.type_don.toLowerCase().includes(terme) || 
      (c.note && c.note.toLowerCase().includes(terme))
    );
  });

  const totalFinancier = contributions.reduce((sum, c) => sum + Number(c.montant), 0);

  if (!utilisateur) return <div className="min-h-screen bg-sombre text-clair flex justify-center items-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/dashboard" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg">← Dashboard</Link>
            <h1 className="text-3xl font-bold">Contributions & <span className="text-or">Dons</span></h1>
          </div>
          <div className="bg-or text-sombre px-6 py-3 rounded-xl font-bold text-xl shadow-lg shadow-or/20">
            Trésorerie : {totalFinancier.toLocaleString('fr-FR')} €
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* FORMULAIRE ADAPTATIF */}
          <div className={`p-8 rounded-2xl border transition-all duration-300 lg:col-span-1 sticky top-32 ${typeContribution === 'nature' ? 'bg-blue-500/5 border-blue-500/50' : 'bg-sombre/50 border-clair/10'}`}>
            <h2 className="text-xl font-bold mb-6">{contributionEnEdition ? "✏️ Modifier" : "Nouveau Don"}</h2>
            
            {/* SÉLECTEUR DE NATURE */}
            <div className="flex gap-2 mb-6 bg-sombre p-1 rounded-lg border border-clair/10">
              <button 
                type="button" onClick={() => setTypeContribution("argent")}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${typeContribution === "argent" ? "bg-or text-sombre" : "text-clair/50"}`}
              >
                💰 Argent
              </button>
              <button 
                type="button" onClick={() => setTypeContribution("nature")}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${typeContribution === "nature" ? "bg-blue-500 text-white" : "text-clair/50"}`}
              >
                🎁 Nature
              </button>
            </div>

            <form onSubmit={soumettreFormulaire} className="space-y-4">
              {typeContribution === "argent" && (
                <div>
                  <label className="block text-sm text-clair/70 mb-1">Montant (€) *</label>
                  <input 
                    type="number" step="0.01" required value={montant} onChange={(e) => setMontant(e.target.value)}
                    className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair text-xl font-bold focus:border-or outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-clair/70 mb-1">Catégorie</label>
                <select 
                  value={categorie} onChange={(e) => setCategorie(e.target.value)}
                  className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none appearance-none"
                >
                  <option value="Offrande Générale">Offrande Générale</option>
                  <option value="Dîme">Dîme</option>
                  <option value="Action de Grâce">Action de Grâce</option>
                  <option value="Don Caritatif">Don Caritatif</option>
                  <option value="Équipement / Matériel">Équipement / Matériel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-clair/70 mb-1">Date du don</label>
                <input type="date" required value={dateDon} onChange={(e) => setDateDon(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none" />
              </div>

              <div>
                <label className="block text-sm text-clair/70 mb-1">{typeContribution === "argent" ? "Note / Provenance" : "Description du don (obligatoire) *"}</label>
                <textarea 
                  required={typeContribution === "nature"} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none h-24"
                  placeholder={typeContribution === "nature" ? "Ex: 2 sacs de riz, 1 guitare neuve..." : "Ex: Famille Dupont"}
                />
              </div>

              <button type="submit" disabled={chargement} className={`w-full mt-4 font-bold py-3 rounded-lg transition-all ${typeContribution === 'nature' ? 'bg-blue-500 text-white' : 'bg-or text-sombre'}`}>
                {chargement ? "Enregistrement..." : (contributionEnEdition ? "Mettre à jour" : "Enregistrer le don")}
              </button>
              {contributionEnEdition && <button type="button" onClick={annulerEdition} className="w-full border border-clair/20 text-clair font-bold py-3 rounded-lg">Annuler</button>}
            </form>
          </div>

          {/* LISTE DES CONTRIBUTIONS */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <input 
                type="text" placeholder="Rechercher une catégorie ou une note..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
                className="w-full bg-sombre/50 border border-clair/10 rounded-xl px-6 py-3 text-clair focus:border-or outline-none"
              />
            </div>

            <div className="bg-sombre/30 rounded-xl border border-clair/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-sombre/80 border-b border-clair/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Nature</th>
                    <th className="px-6 py-4 font-bold">Valeur / Description</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clair/5">
                  {contributionsFiltrees.map((c) => (
                    <tr key={c.id} className="hover:bg-clair/5 group">
                      <td className="px-6 py-4 text-clair/70">{c.date_don.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${c.montant > 0 ? 'bg-or/10 text-or' : 'bg-blue-500/10 text-blue-400'}`}>
                          {c.type_don}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.montant > 0 ? (
                          <span className="font-bold text-lg">{Number(c.montant).toLocaleString('fr-FR')} €</span>
                        ) : (
                          <span className="italic text-clair/60">📦 {c.note}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => commencerEdition(c)} className="text-clair/40 hover:text-or">✏️</button>
                          <button onClick={() => supprimerDon(c.id)} className="text-clair/40 hover:text-red-500">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}