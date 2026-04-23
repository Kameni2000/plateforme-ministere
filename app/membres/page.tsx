"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

export default function Membres() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  
  // États du formulaire
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [dateBapteme, setDateBapteme] = useState("");
  const [dateCommunion, setDateCommunion] = useState("");
  const [dateConfirmation, setDateConfirmation] = useState("");
  const [notes, setNotes] = useState("");
  const [fichierPhoto, setFichierPhoto] = useState<File | null>(null);
  const [urlPhotoExistante, setUrlPhotoExistante] = useState("");
  
  // États d'affichage
  const [membreSelectionne, setMembreSelectionne] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const verifierSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/connexion");
      } else {
        setUtilisateur(session.user);
        chargerMembres(session.user.id);
      }
    };
    verifierSession();
  }, [router]);

  const chargerMembres = async (userId: string) => {
    const { data, error } = await supabase
      .from("membres")
      .select("*")
      .eq("user_id", userId)
      .order("nom", { ascending: true });
    if (!error && data) setMembres(data);
  };

  // 📸 Fonction pour uploader l'image dans Supabase Storage
  const uploaderPhoto = async (fichier: File) => {
    const extension = fichier.name.split('.').pop();
    const nomFichier = `${utilisateur.id}_${Date.now()}.${extension}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(nomFichier, fichier);

    if (error) {
      console.error("Erreur upload photo:", error);
      return null;
    }
    
    // Récupérer l'URL publique de l'image
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(nomFichier);
    return publicUrl;
  };

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);

    let urlPhotoFinale = urlPhotoExistante;

    // Si on a sélectionné une nouvelle photo, on l'upload d'abord
    if (fichierPhoto) {
      const urlUpload = await uploaderPhoto(fichierPhoto);
      if (urlUpload) urlPhotoFinale = urlUpload;
    }

    const donnees = {
      user_id: utilisateur.id,
      nom,
      telephone,
      date_naissance: dateNaissance || null,
      date_bapteme: dateBapteme || null,
      date_communion: dateCommunion || null,
      date_confirmation: dateConfirmation || null,
      notes_pastorales: notes,
      photo_url: urlPhotoFinale || null
    };

    if (modeEdition && membreSelectionne) {
      const { error } = await supabase.from("membres").update(donnees).eq("id", membreSelectionne.id);
      if (!error) {
        setModeEdition(false);
        setMembreSelectionne(null);
      }
    } else {
      const { error } = await supabase.from("membres").insert([donnees]);
    }

    // Reset formulaire
    setNom(""); setTelephone(""); setDateNaissance(""); setDateBapteme(""); 
    setDateCommunion(""); setDateConfirmation(""); setNotes("");
    setFichierPhoto(null); setUrlPhotoExistante("");
    chargerMembres(utilisateur.id);
    setChargement(false);
  };

  const supprimerMembre = async (id: string) => {
    if (confirm("Supprimer définitivement ce membre ?")) {
      await supabase.from("membres").delete().eq("id", id);
      chargerMembres(utilisateur.id);
      setMembreSelectionne(null);
    }
  };

  const membresFiltrés = membres.filter(m => 
    m.nom.toLowerCase().includes(recherche.toLowerCase()) || 
    m.telephone.includes(recherche)
  );

  // Fonction utilitaire pour générer les initiales (ex: "Jean Dupont" -> "JD")
  const getInitiales = (nomComplet: string) => {
    return nomComplet.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (!utilisateur) return <div className="min-h-screen bg-sombre flex items-center justify-center text-or">Chargement...</div>;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="bg-or/10 text-or p-2 rounded-lg hover:bg-or hover:text-sombre transition-all">←</Link>
            <h1 className="text-4xl font-black text-white">Répertoire <span className="text-or">Pastoral</span></h1>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher un fidèle..." 
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full md:w-96 bg-[#111] border border-clair/10 rounded-2xl px-6 py-4 outline-none focus:border-or transition-all shadow-xl"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* FORMULAIRE D'AJOUT / ÉDITION */}
          <div className="bg-[#111] p-8 rounded-3xl border border-clair/10 shadow-2xl h-fit sticky top-32">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {modeEdition ? "✏️ Modifier le Dossier" : "➕ Nouveau Fidèle"}
            </h2>
            <form onSubmit={gererSoumission} className="space-y-4">
              
              {/* NOUVEAU : CHAMP PHOTO */}
              <div className="bg-sombre border border-clair/10 rounded-xl p-4 flex items-center gap-4">
                {urlPhotoExistante ? (
                   <img src={urlPhotoExistante} alt="Aperçu" className="w-12 h-12 rounded-full object-cover border border-or" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-clair/5 flex items-center justify-center text-2xl">👤</div>
                )}
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-clair/40 block mb-1">Photo de profil</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setFichierPhoto(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-clair/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-or/10 file:text-or hover:file:bg-or/20 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <input type="text" placeholder="Nom complet" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 outline-none focus:border-or transition-all"/>
              <input type="tel" placeholder="Téléphone" required value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 outline-none focus:border-or transition-all"/>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-clair/40 mb-1 block">Date de Naissance</label>
                  <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-2 text-sm [color-scheme:dark]"/>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-clair/40 mb-1 block">Baptême 💧</label>
                  <input type="date" value={dateBapteme} onChange={(e) => setDateBapteme(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-2 text-sm [color-scheme:dark]"/>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-clair/40 mb-1 block">1ère Communion 🥖</label>
                  <input type="date" value={dateCommunion} onChange={(e) => setDateCommunion(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-2 text-sm [color-scheme:dark]"/>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-clair/40 mb-1 block">Confirmation 🕊️</label>
                  <input type="date" value={dateConfirmation} onChange={(e) => setDateConfirmation(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-2 text-sm [color-scheme:dark]"/>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-clair/40 mb-1 block mt-2">Notes Pastorales / Suivi</label>
                <textarea 
                  placeholder="Résumé des entretiens, besoins spirituels..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 h-32 outline-none focus:border-or transition-all text-sm"
                />
              </div>

              <button type="submit" disabled={chargement} className="w-full bg-or text-sombre font-black py-4 rounded-xl shadow-lg shadow-or/20 hover:scale-[1.02] transition-transform">
                {chargement ? "Enregistrement en cours..." : (modeEdition ? "Mettre à jour" : "Inscrire au répertoire")}
              </button>
              {modeEdition && (
                <button type="button" onClick={() => {
                  setModeEdition(false); setMembreSelectionne(null); 
                  setNom(""); setTelephone(""); setNotes(""); setFichierPhoto(null); setUrlPhotoExistante("");
                  setDateNaissance(""); setDateBapteme(""); setDateCommunion(""); setDateConfirmation("");
                }} className="w-full text-clair/40 text-sm mt-2 hover:text-white transition-colors">Annuler la modification</button>
              )}
            </form>
          </div>

          {/* LISTE DES CARTES */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {membresFiltrés.map((m) => (
              <div 
                key={m.id} 
                onClick={() => setMembreSelectionne(m)}
                className="bg-[#111] p-6 rounded-3xl border border-clair/5 hover:border-or/40 transition-all cursor-pointer group shadow-lg flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-start gap-4 mb-4 z-10">
                  {/* AFFICHAGE DE LA PHOTO OU DES INITIALES */}
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.nom} className="w-14 h-14 rounded-full object-cover border-2 border-or/50 shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-or/20 to-or/5 border-2 border-or/20 flex items-center justify-center text-or font-black text-xl shadow-lg">
                      {getInitiales(m.nom)}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-or transition-colors line-clamp-1">{m.nom}</h3>
                    <p className="text-clair/50 text-sm font-mono mt-1">{m.telephone}</p>
                  </div>
                  <div className="opacity-30 group-hover:opacity-100 transition-opacity text-xl text-or">→</div>
                </div>
                
                {/* BADGES SACREMENTS */}
                <div className="flex flex-wrap gap-2 mt-auto z-10">
                  {m.date_bapteme && <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-1 rounded-md font-bold border border-blue-500/20">💧 Baptisé</span>}
                  {m.date_communion && <span className="bg-amber-700/10 text-amber-500 text-[9px] px-2 py-1 rounded-md font-bold border border-amber-700/20">🥖 Communié</span>}
                  {m.date_confirmation && <span className="bg-red-500/10 text-red-400 text-[9px] px-2 py-1 rounded-md font-bold border border-red-500/20">🕊️ Confirmé</span>}
                  {m.notes_pastorales && <span className="bg-or/10 text-or text-[9px] px-2 py-1 rounded-md font-bold border border-or/20">📝 Dossier</span>}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* MODAL : DOSSIER PASTORAL */}
      {membreSelectionne && (
        <div className="fixed inset-0 bg-sombre/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-2xl rounded-[40px] border border-or/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            
            <div className="flex flex-col md:flex-row">
              {/* CÔTÉ GAUCHE : IDENTITÉ VISUELLE AVEC PHOTO & QR CODE */}
              <div className="bg-or p-8 flex flex-col items-center justify-center text-sombre md:w-2/5 relative">
                
                {/* GRANDE PHOTO DE PROFIL */}
                <div className="mb-6 relative">
                  {membreSelectionne.photo_url ? (
                    <img src={membreSelectionne.photo_url} alt={membreSelectionne.nom} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-sombre font-black text-5xl shadow-xl">
                      {getInitiales(membreSelectionne.nom)}
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-xl mb-4">
                  <QRCodeCanvas value={String(membreSelectionne.id)} size={90} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
                <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60">ID VIP</h4>
                <p className="font-mono text-xs font-bold">{String(membreSelectionne.id).padStart(8, '0').slice(0,8)}</p>
              </div>

              {/* CÔTÉ DROIT : INFOS PASTORALES */}
              <div className="p-8 flex-1 relative">
                <button onClick={() => setMembreSelectionne(null)} className="absolute top-6 right-6 text-clair/20 hover:text-white text-2xl font-bold">×</button>
                
                <h2 className="text-3xl font-black text-white mb-1 leading-tight">{membreSelectionne.nom}</h2>
                <p className="text-or font-bold mb-6">📞 {membreSelectionne.telephone}</p>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-clair/30 mb-1 tracking-widest">Né(e) le</h5>
                    <p className="text-white font-bold text-sm">{membreSelectionne.date_naissance ? new Date(membreSelectionne.date_naissance).toLocaleDateString('fr-FR') : "-"}</p>
                  </div>
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-blue-400/50 mb-1 tracking-widest">💧 Baptisé(e) le</h5>
                    <p className="text-blue-400 font-bold text-sm">{membreSelectionne.date_bapteme ? new Date(membreSelectionne.date_bapteme).toLocaleDateString('fr-FR') : "-"}</p>
                  </div>
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-amber-500/50 mb-1 tracking-widest">🥖 Communié(e) le</h5>
                    <p className="text-amber-500 font-bold text-sm">{membreSelectionne.date_communion ? new Date(membreSelectionne.date_communion).toLocaleDateString('fr-FR') : "-"}</p>
                  </div>
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-red-400/50 mb-1 tracking-widest">🕊️ Confirmé(e) le</h5>
                    <p className="text-red-400 font-bold text-sm">{membreSelectionne.date_confirmation ? new Date(membreSelectionne.date_confirmation).toLocaleDateString('fr-FR') : "-"}</p>
                  </div>
                </div>

                <div className="bg-sombre/50 p-5 rounded-2xl border border-clair/5">
                  <h5 className="text-[10px] uppercase font-black text-or mb-2 tracking-widest">Journal de Suivi</h5>
                  <p className="text-clair/70 text-sm leading-relaxed italic max-h-24 overflow-y-auto pr-2">
                    {membreSelectionne.notes_pastorales || "Aucune note."}
                  </p>
                </div>

                <div className="mt-6 flex gap-4">
                  <button 
                    onClick={() => {
                      setNom(membreSelectionne.nom);
                      setTelephone(membreSelectionne.telephone);
                      setDateNaissance(membreSelectionne.date_naissance || "");
                      setDateBapteme(membreSelectionne.date_bapteme || "");
                      setDateCommunion(membreSelectionne.date_communion || "");
                      setDateConfirmation(membreSelectionne.date_confirmation || "");
                      setNotes(membreSelectionne.notes_pastorales || "");
                      setUrlPhotoExistante(membreSelectionne.photo_url || "");
                      setModeEdition(true);
                      setMembreSelectionne(null);
                    }}
                    className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all text-sm"
                  >
                    ✏️ Modifier
                  </button>
                  <button onClick={() => supprimerMembre(membreSelectionne.id)} className="bg-red-500/10 text-red-500 px-6 rounded-xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}