"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
// Importation de notre nouvel outil de QR Code
import { QRCodeSVG } from "qrcode.react";

export default function Membres() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  const [membreEnEdition, setMembreEnEdition] = useState<any>(null);
  
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [statut, setStatut] = useState("Actif");
  const [chargement, setChargement] = useState(false);
  
  // NOUVEAU : État pour gérer l'affichage en grand du QR Code
  const [carteZoom, setCarteZoom] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/connexion");
      } else {
        setUtilisateur(session.user);
        chargerMembres(session.user.id);
      }
    };
    verifierAcces();
  }, [router]);

  const chargerMembres = async (userId: string) => {
    const { data, error } = await supabase
      .from('membres')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setMembres(data);
  };

  const commencerEdition = (membre: any) => {
    setMembreEnEdition(membre);
    setNom(membre.nom);
    setEmail(membre.email || "");
    setTelephone(membre.telephone || "");
    setStatut(membre.statut);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerEdition = () => {
    setMembreEnEdition(null);
    setNom("");
    setEmail("");
    setTelephone("");
    setStatut("Actif");
  };

  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);

    if (membreEnEdition) {
      const { error } = await supabase.from('membres').update({ nom, email, telephone, statut }).eq('id', membreEnEdition.id);
      if (!error) { annulerEdition(); chargerMembres(utilisateur.id); }
    } else {
      const { error } = await supabase.from('membres').insert([{ user_id: utilisateur.id, nom, email, telephone, statut }]);
      if (!error) { annulerEdition(); chargerMembres(utilisateur.id); }
    }
    setChargement(false);
  };

  const supprimerMembre = async (id: number) => {
    if (!confirm("Voulez-vous vraiment retirer cette personne du répertoire ?")) return;
    const { error } = await supabase.from('membres').delete().eq('id', id);
    if (!error) setMembres(membres.filter(m => m.id !== id));
  };

  const membresFiltres = membres.filter((membre) => {
    const terme = recherche.toLowerCase();
    return (membre.nom.toLowerCase().includes(terme) || (membre.telephone && membre.telephone.includes(terme)));
  });

  if (!utilisateur) return null;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 relative">
      
      {/* POP-UP ZOOM CARTE VIP (S'affiche si on clique sur un QR Code) */}
      {carteZoom && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-or/30 p-10 rounded-3xl max-w-sm w-full shadow-[0_0_100px_rgba(212,175,55,0.15)] flex flex-col items-center">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => setCarteZoom(null)}
              className="absolute top-4 right-4 text-clair/50 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
            >
              ✕
            </button>

            {/* En-tête de la carte zoomée */}
            <div className="text-center mb-8 w-full border-b border-white/5 pb-6">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">CHURCH<span className="text-or">HUB</span></h3>
              <p className="text-xs text-or tracking-[0.3em] mt-1 font-bold">ACCÈS MEMBRE</p>
            </div>

            {/* Le grand QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-xl mb-8 border-4 border-or/20">
              <QRCodeSVG 
                value={JSON.stringify({ id: carteZoom.id, nom: carteZoom.nom, statut: carteZoom.statut })}
                size={200}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>

            {/* Informations du membre */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">{carteZoom.nom}</h2>
              <div className="inline-block px-4 py-1 rounded-full bg-or/10 text-or text-sm font-bold uppercase tracking-widest border border-or/20">
                {carteZoom.statut}
              </div>
              <p className="text-sm text-clair/50 mt-4 tracking-widest">ID: {carteZoom.id.toString().padStart(6, '0')}</p>
            </div>
          </div>
        </div>
      )}

      {/* RESTE DE L'INTERFACE NORMALE */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-clair/10 pb-6">
          <Link href="/dashboard" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg">← Dashboard</Link>
          <h1 className="text-3xl font-bold">Répertoire & <span className="text-or">Cartes Membres</span></h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* COLONNE GAUCHE : FORMULAIRE */}
          <div className={`p-8 rounded-2xl border transition-all duration-300 lg:col-span-1 sticky top-32 ${membreEnEdition ? 'bg-or/5 border-or' : 'bg-sombre/50 border-clair/10'}`}>
            <h2 className="text-xl font-bold mb-6">{membreEnEdition ? "✏️ Modifier le membre" : "Nouveau Membre"}</h2>
            
            <form onSubmit={soumettreFormulaire} className="space-y-4">
              <div><label className="block text-sm text-clair/70 mb-1">Nom complet *</label><input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none"/></div>
              <div><label className="block text-sm text-clair/70 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none"/></div>
              <div><label className="block text-sm text-clair/70 mb-1">Téléphone</label><input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none"/></div>
              <div>
                <label className="block text-sm text-clair/70 mb-1">Statut</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:border-or outline-none appearance-none">
                  <option value="Actif">Membre Actif</option>
                  <option value="Visiteur">Visiteur</option>
                  <option value="Ouvrier">Ouvrier / Leader</option>
                </select>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" disabled={chargement} className="w-full bg-or text-sombre font-bold py-3 rounded-lg hover:bg-or/90 transition-colors disabled:opacity-50">
                  {chargement ? "Enregistrement..." : (membreEnEdition ? "Mettre à jour" : "Générer la Carte VIP")}
                </button>
                {membreEnEdition && <button type="button" onClick={annulerEdition} className="w-full border border-clair/20 text-clair font-bold py-3 rounded-lg">Annuler</button>}
              </div>
            </form>
          </div>

          {/* COLONNE DROITE : LES CARTES VIP */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">Cartes ({membresFiltres.length})</h2>
                <Link href="/scanner" className="bg-green-600/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-600 hover:text-white transition-colors flex items-center gap-2">
                    📷 Mode Accueil (Scanner)
                </Link>
                </div>              
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-clair/40">🔍</span></div>
                <input type="text" placeholder="Rechercher un nom..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full bg-sombre border border-clair/20 rounded-lg pl-10 pr-4 py-2 text-clair focus:border-or outline-none" />
              </div>
            </div>
            
            {membresFiltres.length === 0 ? (
              <p className="text-clair/50 py-10 text-center border border-dashed border-clair/20 rounded-xl bg-sombre/30">
                Aucun membre trouvé.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* DESIGN DE LA CARTE VIP */}
                {membresFiltres.map((membre) => (
                  <div key={membre.id} className="relative group perspective-1000">
                    
                    {/* Boutons d'édition cachés au survol */}
                    <div className="absolute -top-3 -right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => commencerEdition(membre)} className="bg-sombre border border-clair/20 p-2 rounded-full text-clair hover:text-or hover:border-or shadow-lg" title="Modifier">✏️</button>
                      <button onClick={() => supprimerMembre(membre.id)} className="bg-sombre border border-clair/20 p-2 rounded-full text-clair hover:text-red-500 hover:border-red-500 shadow-lg" title="Supprimer">🗑️</button>
                    </div>

                    {/* La Carte Elle-même */}
                    <div className={`bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl border-2 overflow-hidden flex flex-col h-full shadow-lg transition-transform duration-300 group-hover:-translate-y-1 ${membreEnEdition?.id === membre.id ? 'border-or shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-clair/10'}`}>
                      
                      {/* Liseré haut de couleur selon le statut */}
                      <div className={`h-2 w-full ${membre.statut === 'Ouvrier' ? 'bg-purple-500' : membre.statut === 'Visiteur' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        
                        <div className="flex justify-between items-start mb-4">
                          {/* Infos Membre */}
                          <div>
                            <h3 className="font-bold text-lg leading-tight uppercase text-white truncate max-w-[150px]">{membre.nom}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-2 inline-block border ${membre.statut === 'Ouvrier' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : membre.statut === 'Visiteur' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                              {membre.statut}
                            </span>
                          </div>

                          {/* Le QR Code cliquable */}
                          <div 
                            onClick={() => setCarteZoom(membre)}
                            className="bg-white p-1 rounded-lg cursor-pointer hover:scale-105 transition-transform border border-clair/20 shadow-sm tooltip"
                            title="Cliquez pour agrandir la carte"
                          >
                            <QRCodeSVG 
                              // On met l'ID et le nom dans le QR Code, très pratique pour un futur système de scan !
                              value={JSON.stringify({ id: membre.id, nom: membre.nom, statut: membre.statut })} 
                              size={50} 
                            />
                          </div>
                        </div>
                        
                        {/* Coordonnées */}
                        <div className="mt-auto pt-4 border-t border-white/5 space-y-1 text-xs text-clair/50 font-mono">
                          {membre.telephone && <p>📞 {membre.telephone}</p>}
                          {membre.email && <p className="truncate">✉️ {membre.email}</p>}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}