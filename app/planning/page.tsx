"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Planning() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  
  // Sécurité
  const [accesBloque, setAccesBloque] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Formulaire & Mode Édition
  const [planningEnEdition, setPlanningEnEdition] = useState<any>(null);
  const [titre, setTitre] = useState("Culte de Dimanche");
  const [dateEvenement, setDateEvenement] = useState(new Date().toISOString().split('T')[0]);
  const [role, setRole] = useState("Louange");
  const [membreSelectionne, setMembreSelectionne] = useState("");
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
    const { data: dataPlannings } = await supabase
      .from('plannings')
      .select('*')
      .eq('user_id', userId)
      .order('date_evenement', { ascending: true }); 
    if (dataPlannings) setPlannings(dataPlannings);

    const { data: dataMembres } = await supabase
      .from('membres')
      .select('nom')
      .eq('user_id', userId)
      .order('nom', { ascending: true });
    if (dataMembres) {
      setMembres(dataMembres);
      if (dataMembres.length > 0 && !planningEnEdition) setMembreSelectionne(dataMembres[0].nom);
    }
  };

  const commencerEdition = (planning: any) => {
    setPlanningEnEdition(planning);
    setTitre(planning.titre_evenement);
    setDateEvenement(planning.date_evenement);
    setRole(planning.role_service);
    setMembreSelectionne(planning.membre_nom);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerEdition = () => {
    setPlanningEnEdition(null);
    setTitre("Culte de Dimanche");
    setDateEvenement(new Date().toISOString().split('T')[0]);
    setRole("Louange");
    if (membres.length > 0) setMembreSelectionne(membres[0].nom);
  };

  const assignerRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    
    const donnees = {
      user_id: utilisateur.id,
      titre_evenement: titre,
      date_evenement: dateEvenement,
      role_service: role,
      membre_nom: membreSelectionne
    };

    if (planningEnEdition) {
      const { error } = await supabase.from('plannings').update(donnees).eq('id', planningEnEdition.id);
      if (!error) {
        annulerEdition();
        await chargerDonnees(utilisateur.id);
      } else {
        alert("Erreur : " + error.message);
      }
    } else {
      const { error } = await supabase.from('plannings').insert([donnees]);
      if (!error) {
        await chargerDonnees(utilisateur.id);
      } else {
        alert("Erreur : " + error.message);
      }
    }
    setChargement(false);
  };

  const supprimerAssignation = async (id: number) => {
    if (!confirm("Retirer cette personne du service ?")) return;
    const { error } = await supabase.from('plannings').delete().eq('id', id);
    if (!error) setPlannings(plannings.filter(p => p.id !== id));
  };

  // NOUVELLE FONCTION : Générer et envoyer l'e-mail 📧
  const envoyerPlanningParEmail = (groupe: any) => {
    const dateAffichee = groupe.date.split('-').reverse().join('/');
    const sujet = `Planning d'équipe : ${groupe.titre} du ${dateAffichee}`;
    
    let corps = `Bonjour à tous,\n\nVoici l'organisation pour l'événement "${groupe.titre}" prévu le ${dateAffichee} :\n\n`;
    
    groupe.services.forEach((service: any) => {
      corps += `- ${service.role_service} : ${service.membre_nom}\n`;
    });
    
    corps += `\nMerci d'avance pour votre service !\n\nL'équipe Pastorale`;

    // Ouvre le client e-mail par défaut avec le texte préparé
    const mailtoLink = `mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    window.location.href = mailtoLink;
  };

  const planningsGroupes = plannings.reduce((groupes: any, planning) => {
    const cle = `${planning.date_evenement}_${planning.titre_evenement}`;
    if (!groupes[cle]) {
      groupes[cle] = { date: planning.date_evenement, titre: planning.titre_evenement, services: [] };
    }
    groupes[cle].services.push(planning);
    return groupes;
  }, {});

  if (chargementInitial) return <div className="min-h-screen bg-sombre flex items-center justify-center"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (accesBloque) {
    return (
      <div className="min-h-screen bg-sombre text-clair pt-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-lg bg-[#111] p-10 rounded-3xl border border-purple-500/30 shadow-2xl">
          <div className="text-6xl mb-6">📅</div>
          <h1 className="text-3xl font-black mb-4">Planning <span className="text-purple-500">Premium</span></h1>
          <p className="text-clair/70 mb-8">L'organisation des cultes et la gestion des équipes sont réservées au <strong className="text-white">Plan Pro</strong>.</p>
          <button className="w-full bg-purple-500 text-white font-black py-4 rounded-xl shadow-lg hover:bg-purple-600 transition-all">Passer au Plan Pro</button>
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
            <Link href="/dashboard" className="text-purple-500 bg-purple-500/10 p-2 rounded-lg hover:bg-purple-500 hover:text-white transition-all">← Dashboard</Link>
            <h1 className="text-3xl font-black">Planning des <span className="text-purple-500">Services</span></h1>
          </div>
          <div className="text-right mt-4 md:mt-0 bg-[#111] border border-purple-500/30 px-6 py-3 rounded-2xl shadow-lg shadow-purple-500/10">
            <p className="text-xs text-clair/40 uppercase font-bold tracking-widest mb-1">Bénévoles Engagés</p>
            <div className="text-3xl font-black text-purple-400">
              {plannings.length} <span className="text-sm text-clair/50 font-normal">services</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          <div className={`p-8 rounded-3xl border transition-all duration-300 lg:col-span-1 sticky top-32 shadow-xl ${planningEnEdition ? 'bg-purple-500/10 border-purple-500/50 shadow-purple-500/20' : 'bg-[#111] border-clair/10'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {planningEnEdition ? (
                <><span className="text-purple-400">✏️</span> Modifier l'assignation</>
              ) : (
                <><span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span> Assigner un rôle</>
              )}
            </h2>

            <form onSubmit={assignerRole} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Nom de la célébration</label>
                <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Messe Dominicale..." className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-white"/>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Date</label>
                <input type="date" required value={dateEvenement} onChange={(e) => setDateEvenement(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 [color-scheme:dark] outline-none focus:border-purple-500 transition-colors text-white"/>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Rôle / Fonction</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 appearance-none transition-colors text-white">
                  <option value="Célébrant">🙏 Prêtre / Célébrant</option>
                  <option value="Diacre">🕯️ Diacre</option>
                  <option value="Lectures">📖 Lectures / Épître</option>
                  <option value="Chorale">🎶 Chorale / Organiste</option>
                  <option value="Louange">🎸 Louange / Chant</option>
                  <option value="Servants">🍷 Servants d'autel</option>
                  <option value="Accueil">👋 Accueil & Quête</option>
                  <option value="Sacristie">⛪ Sacristie</option>
                  <option value="Technique">💻 Son & Vidéo</option>
                  <option value="Enfants">🧸 École du Dimanche</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-clair/50 mb-2 block">Personne assignée</label>
                {membres.length > 0 ? (
                  <select value={membreSelectionne} onChange={(e) => setMembreSelectionne(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 appearance-none transition-colors text-white">
                    {membres.map((m, idx) => (
                      <option key={idx} value={m.nom}>{m.nom}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-sombre border border-clair/10 p-3 rounded-xl text-sm text-clair/40 italic">Aucun membre disponible.</div>
                )}
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={chargement || membres.length === 0} className={`w-full py-4 rounded-xl font-black shadow-lg transition-transform hover:scale-[1.02] ${planningEnEdition ? 'bg-purple-400 text-sombre' : 'bg-purple-500 text-white shadow-purple-500/20'}`}>
                  {chargement ? "Traitement..." : (planningEnEdition ? "Mettre à jour" : "+ Ajouter au planning")}
                </button>
                
                {planningEnEdition && (
                  <button type="button" onClick={annulerEdition} className="w-full border border-red-500/30 text-red-400 font-bold py-3 rounded-xl mt-3 hover:bg-red-500 hover:text-white transition-colors">
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {Object.keys(planningsGroupes).length === 0 ? (
              <div className="bg-[#111] border border-clair/10 rounded-3xl p-10 text-center text-clair/40 italic">
                Aucun événement planifié. Assignez un membre pour commencer.
              </div>
            ) : (
              Object.values(planningsGroupes).map((groupe: any, idx) => (
                <div key={idx} className="bg-[#111] border border-clair/10 rounded-3xl overflow-hidden shadow-xl">
                  
                  {/* EN-TÊTE AVEC LE BOUTON EMAIL 📧 */}
                  <div className="bg-sombre/50 border-b border-clair/10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{groupe.titre}</h3>
                      <p className="text-purple-400 font-mono text-sm mt-1">🗓️ {groupe.date.split('-').reverse().join('/')}</p>
                    </div>
                    <button 
                      onClick={() => envoyerPlanningParEmail(groupe)}
                      className="bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                      title="Ouvrir l'application d'e-mail avec ce planning"
                    >
                      📧 Envoyer à l'équipe
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {groupe.services.map((service: any) => (
                      <div key={service.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 hover:bg-clair/5 rounded-xl group transition-colors gap-4">
                        
                        <span className="font-bold text-white text-lg">{service.membre_nom}</span>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-clair/30 text-xs font-bold uppercase tracking-widest hidden sm:block">Rôle:</span>
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest min-w-[120px] text-center">
                            {service.role_service}
                          </span>
                          
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                            <button onClick={() => commencerEdition(service)} className="text-purple-400 hover:bg-purple-500/10 p-2 rounded-lg transition-all" title="Modifier cette assignation">
                              ✏️
                            </button>
                            <button onClick={() => supprimerAssignation(service.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all text-xl font-bold" title="Retirer cette personne">
                              ×
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
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