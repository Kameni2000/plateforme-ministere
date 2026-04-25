"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function Academie() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  const [titreClasse, setTitreClasse] = useState("");
  const [etapesTotales, setEtapesTotales] = useState(10);
  const [iconeClasse, setIconeClasse] = useState("📖");
  const [membreAInscrire, setMembreAInscrire] = useState("");

  // NOUVEAU : Gestion de l'examen
  const [modalExamen, setModalExamen] = useState<{ isOpen: boolean, inscriptionId: string, nom: string, etapesValidees: number, total: number } | null>(null);
  const [noteExamen, setNoteExamen] = useState<number | "">("");
  const [alerteExamen, setAlerteExamen] = useState("");

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/connexion");
      else {
        setUtilisateur(session.user);
        await chargerDonnees(session.user.id);
        setChargement(false);
      }
    };
    init();
  }, [router]);

  const chargerDonnees = async (userId: string) => {
    const { data: dataF } = await supabase.from("formations").select("*").eq("user_id", userId).order("titre");
    if (dataF) setFormations(dataF);

    const { data: dataI } = await supabase.from("inscriptions").select("*, membres(nom, photo_url)");
    if (dataI) setInscriptions(dataI);

    const { data: dataM } = await supabase.from("membres").select("id, nom").eq("user_id", userId).order("nom");
    if (dataM) setMembres(dataM);
  };

  const creerClasse = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("formations").insert([{ user_id: utilisateur.id, titre: titreClasse, etapes_totales: etapesTotales, icone: iconeClasse }]);
    setTitreClasse("");
    chargerDonnees(utilisateur.id);
  };

  const inscrireEleve = async (formationId: string) => {
    if (!membreAInscrire) return;
    const existe = inscriptions.find(i => i.formation_id === formationId && i.membre_id === Number(membreAInscrire));
    if (existe) return alert("Cet élève est déjà inscrit à cette classe.");

    await supabase.from("inscriptions").insert([{ formation_id: formationId, membre_id: Number(membreAInscrire) }]);
    setMembreAInscrire("");
    chargerDonnees(utilisateur.id);
  };

  // NOUVELLE LOGIQUE DE VALIDATION D'EXAMEN
  const soumettreExamen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalExamen || noteExamen === "") return;

    const note = Number(noteExamen);

    // Si la note est en dessous de la moyenne (10/20)
    if (note < 10) {
      setAlerteExamen(`Échec à l'examen (${note}/20). L'élève doit réviser et repasser le test.`);
      // On met juste à jour la note dans le dossier, mais on n'avance pas la leçon
      await supabase.from("inscriptions").update({ derniere_note: note }).eq("id", modalExamen.inscriptionId);
      chargerDonnees(utilisateur.id);
      setTimeout(() => setAlerteExamen(""), 4000);
      return;
    }

    // SUCCÈS ! (Note >= 10)
    const nouvelleProgression = modalExamen.etapesValidees + 1;
    
    await supabase.from("inscriptions").update({ 
      etapes_validees: nouvelleProgression,
      derniere_note: note 
    }).eq("id", modalExamen.inscriptionId);
    
    if (nouvelleProgression === modalExamen.total) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#D4AF37', '#FFFFFF'] });
    }
    
    setModalExamen(null);
    setNoteExamen("");
    chargerDonnees(utilisateur.id);
  };

  const supprimerInscription = async (id: string) => {
    if (confirm("Retirer cet élève de la classe ?")) {
      await supabase.from("inscriptions").delete().eq("id", id);
      chargerDonnees(utilisateur.id);
    }
  };

  if (chargement) return <div className="min-h-screen bg-sombre flex items-center justify-center"><div className="w-10 h-10 border-4 border-or border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="bg-or/10 text-or p-2 rounded-lg hover:bg-or hover:text-sombre transition-all font-bold">←</Link>
            <h1 className="text-4xl font-black text-white">Académie <span className="text-or">Pastorale</span> 🎓</h1>
          </div>
          <p className="text-clair/50 max-w-sm text-right text-sm">Suivi pédagogique avec validation par examens.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          <div className="bg-[#111] p-8 rounded-3xl border border-clair/10 shadow-xl h-fit sticky top-32">
            <h2 className="text-xl font-bold mb-6 text-white">➕ Nouvelle Classe</h2>
            <form onSubmit={creerClasse} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-clair/40 block mb-1">Nom du parcours</label>
                <input type="text" required placeholder="Ex: Préparation au Baptême" value={titreClasse} onChange={(e) => setTitreClasse(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 outline-none focus:border-or transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-clair/40 block mb-1">Nombre de leçons</label>
                  <input type="number" required min="1" max="100" value={etapesTotales} onChange={(e) => setEtapesTotales(Number(e.target.value))} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 outline-none focus:border-or transition-all text-center"/>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-clair/40 block mb-1">Icône</label>
                  <select value={iconeClasse} onChange={(e) => setIconeClasse(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 outline-none focus:border-or transition-all text-center text-xl">
                    <option value="💧">💧 Baptême</option>
                    <option value="🥖">🥖 Communion</option>
                    <option value="🕊️">🕊️ Confirmation</option>
                    <option value="🧸">🧸 École Dimanche</option>
                    <option value="📖">📖 Étude</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-or text-sombre font-black py-4 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:scale-105 transition-all mt-4">
                Créer la classe
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {formations.length === 0 ? (
              <div className="bg-[#111] border border-clair/5 p-12 rounded-3xl text-center">
                <p className="text-6xl mb-4">🎓</p>
                <h3 className="text-xl font-bold text-white mb-2">Aucune classe pour le moment</h3>
                <p className="text-clair/50 text-sm">Créez votre première classe sur la gauche pour commencer.</p>
              </div>
            ) : (
              formations.map(formation => {
                const elevesInscrits = inscriptions.filter(i => i.formation_id === formation.id);

                return (
                  <div key={formation.id} className="bg-[#111] border border-clair/10 rounded-[30px] overflow-hidden shadow-xl">
                    <div className="bg-gradient-to-r from-sombre to-[#111] p-6 border-b border-clair/5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-or/10 rounded-2xl flex items-center justify-center text-3xl border border-or/20">{formation.icone}</div>
                        <div>
                          <h2 className="text-2xl font-black text-white">{formation.titre}</h2>
                          <p className="text-xs text-clair/40 font-mono mt-1">{elevesInscrits.length} inscrit(s) • Programme en {formation.etapes_totales} examens</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <select onChange={(e) => setMembreAInscrire(e.target.value)} value={membreAInscrire} className="bg-sombre border border-clair/10 rounded-xl px-3 text-sm text-clair/70 outline-none max-w-[150px]">
                          <option value="">Sélectionner...</option>
                          {membres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                        </select>
                        <button onClick={() => inscrireEleve(formation.id)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10 transition-colors">
                          + Ajouter
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {elevesInscrits.length === 0 ? (
                        <p className="text-center text-clair/30 text-sm italic py-4">Aucun élève dans cette classe.</p>
                      ) : (
                        <div className="space-y-4">
                          {elevesInscrits.map(inscription => {
                            const estTermine = inscription.etapes_validees >= formation.etapes_totales;
                            const pourcentage = (inscription.etapes_validees / formation.etapes_totales) * 100;

                            return (
                              <div key={inscription.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl border transition-all ${estTermine ? 'bg-or/5 border-or/30' : 'bg-sombre/50 border-clair/5'}`}>
                                
                                <div className="flex items-center gap-3 w-48">
                                  {inscription.membres?.photo_url ? (
                                    <img src={inscription.membres.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-clair/20" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-clair/5 flex items-center justify-center font-bold text-sm border border-clair/10">
                                      {inscription.membres?.nom.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-bold text-white text-sm truncate">{inscription.membres?.nom}</h4>
                                    {/* Affichage de la dernière note de l'élève */}
                                    {inscription.derniere_note !== null && (
                                      <p className="text-[9px] uppercase tracking-widest text-clair/40 font-mono mt-0.5">
                                        Dernière note: <span className={inscription.derniere_note >= 10 ? "text-emerald-400" : "text-red-400"}>{inscription.derniere_note}/20</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex-1">
                                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                                    <span className={estTermine ? 'text-or' : 'text-clair/50'}>
                                      {estTermine ? 'COMPLÉTÉ 🎉' : 'En cours'}
                                    </span>
                                    <span className="font-mono text-clair/70">{inscription.etapes_validees} / {formation.etapes_totales}</span>
                                  </div>
                                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      className={`h-full transition-all duration-1000 ease-out ${estTermine ? 'bg-gradient-to-r from-or to-amber-300' : 'bg-blue-500'}`}
                                      style={{ width: `${pourcentage}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                  {!estTermine && (
                                    <button 
onClick={() => setModalExamen({ isOpen: true, inscriptionId: inscription.id, nom: inscription.membres.nom, etapesValidees: inscription.etapes_validees, total: formation.etapes_totales })}                                      className="bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/20 transition-all"
                                    >
                                      📝 Évaluer
                                    </button>
                                  )}
                                  {estTermine && (
                                    <button className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20 cursor-default">
                                      ✓ Validé
                                    </button>
                                  )}
                                  <button onClick={() => supprimerInscription(inscription.id)} className="bg-red-500/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-500 px-3 py-2 rounded-xl text-xs transition-colors">
                                    ×
                                  </button>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL : NOTER L'EXAMEN */}
      {modalExamen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-[#111] p-8 rounded-[30px] border border-or/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] w-full max-w-sm relative">
            <button onClick={() => { setModalExamen(null); setAlerteExamen(""); setNoteExamen(""); }} className="absolute top-6 right-6 text-clair/40 hover:text-white text-xl">×</button>
            
            <div className="text-center mb-6">
              <span className="text-4xl">📝</span>
              <h3 className="text-2xl font-black text-white mt-2">Validation d'Acquis</h3>
              <p className="text-clair/50 text-sm mt-1">Évaluation de {modalExamen.nom}</p>
              <p className="text-[10px] uppercase tracking-widest text-or mt-2 font-bold">Leçon {modalExamen.etapesValidees + 1} / {modalExamen.total}</p>
            </div>

            <form onSubmit={soumettreExamen} className="space-y-6">
              <div>
                <label className="block text-center text-xs uppercase font-bold text-clair/40 mb-3">Saisir la note (sur 20)</label>
                <div className="flex justify-center items-end gap-2">
                  <input 
                    type="number" 
                    min="0" max="20" required autoFocus
                    value={noteExamen} 
                    onChange={(e) => setNoteExamen(e.target.value ? Number(e.target.value) : "")}
                    className="w-24 text-center bg-sombre border-b-2 border-or/50 text-4xl font-black text-white px-2 py-1 outline-none focus:border-or transition-all"
                  />
                  <span className="text-2xl font-bold text-clair/30 pb-2">/ 20</span>
                </div>
              </div>

              {alerteExamen && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-center text-sm font-bold animate-in shake">
                  {alerteExamen}
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-all">
                Confirmer l'examen
              </button>
            </form>
            
            <p className="text-center text-[10px] text-clair/30 mt-4 italic">Une note minimale de 10/20 est requise pour valider l'étape.</p>
          </div>
        </div>
      )}

    </div>
  );
}