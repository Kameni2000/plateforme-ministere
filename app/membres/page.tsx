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
  const [afficherCarteVIP, setAfficherCarteVIP] = useState(false);
  const [qrZoom, setQrZoom] = useState(false); // NOUVEAU : État pour le zoom du QR Code
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
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(nomFichier);
    return publicUrl;
  };

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);

    let urlPhotoFinale = urlPhotoExistante;

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
        fermerModal();
      }
    } else {
      const { error } = await supabase.from("membres").insert([donnees]);
    }

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
      fermerModal();
    }
  };

  const fermerModal = () => {
    setMembreSelectionne(null);
    setAfficherCarteVIP(false);
    setQrZoom(false);
  };

  const membresFiltrés = membres.filter(m => 
    m.nom.toLowerCase().includes(recherche.toLowerCase()) || 
    m.telephone.includes(recherche)
  );

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
          
          <div className="bg-[#111] p-8 rounded-3xl border border-clair/10 shadow-2xl h-fit sticky top-32">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {modeEdition ? "✏️ Modifier le Dossier" : "➕ Nouveau Fidèle"}
            </h2>
            <form onSubmit={gererSoumission} className="space-y-4">
              
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
                  setModeEdition(false); fermerModal(); 
                  setNom(""); setTelephone(""); setNotes(""); setFichierPhoto(null); setUrlPhotoExistante("");
                  setDateNaissance(""); setDateBapteme(""); setDateCommunion(""); setDateConfirmation("");
                }} className="w-full text-clair/40 text-sm mt-2 hover:text-white transition-colors">Annuler la modification</button>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {membresFiltrés.map((m) => (
              <div 
                key={m.id} 
                onClick={() => setMembreSelectionne(m)}
                className="bg-[#111] p-6 rounded-3xl border border-clair/5 hover:border-or/40 transition-all cursor-pointer group shadow-lg flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-start gap-4 mb-4 z-10">
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

      {/* MODAL PRINCIPALE */}
      {membreSelectionne && (
        <div className="fixed inset-0 bg-sombre/90 backdrop-blur-md z-40 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-3xl rounded-[40px] border border-or/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative">
            
            <button onClick={fermerModal} className="absolute top-6 right-6 text-clair/40 hover:text-white text-2xl font-bold z-50 transition-colors">×</button>

            {afficherCarteVIP ? (
              
              // ============================================
              // 🔥 VUE : CARTE VIP (LE PASS PREMIUM) 🔥
              // ============================================
              <div className="p-12 flex flex-col items-center justify-center min-h-[500px] relative">
                <button onClick={() => setAfficherCarteVIP(false)} className="absolute top-8 left-8 text-clair/50 hover:text-or text-sm font-bold flex items-center gap-2 transition-colors">
                  ← Retour au dossier
                </button>

                <h2 className="text-xl font-black text-white/40 uppercase tracking-[0.3em] mb-10">Digital Pass</h2>

                {/* LA CARTE EN ELLE-MÊME */}
                <div 
                  onClick={() => setQrZoom(true)} // NOUVEAU : Clic pour zoomer
                  className="w-full max-w-md aspect-[1.58/1] bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-black rounded-3xl border border-or/40 shadow-[0_20px_60px_rgba(255,215,0,0.15)] relative overflow-hidden flex flex-col justify-between p-6 group hover:border-or hover:scale-105 cursor-pointer transition-all duration-300"
                  title="Cliquez pour agrandir le code"
                >
                  
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-or/10 rounded-full blur-3xl group-hover:bg-or/20 transition-all duration-500"></div>

                  <div className="flex justify-between items-start z-10">
                    <div className="font-black text-xl tracking-tighter text-white">CHURCH<span className="text-or">HUB</span></div>
                    <div className="bg-or/10 text-or text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-or/30 backdrop-blur-sm">VIP Member</div>
                  </div>

                  <div className="flex justify-between items-end z-10">
                    <div className="flex flex-col gap-4">
                      {membreSelectionne.photo_url ? (
                        <img src={membreSelectionne.photo_url} alt={membreSelectionne.nom} className="w-16 h-16 rounded-full object-cover border-2 border-or shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-or/20 to-or/5 border-2 border-or/50 flex items-center justify-center text-or font-black text-2xl shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                          {getInitiales(membreSelectionne.nom)}
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-2xl font-black text-white leading-none uppercase tracking-wide">{membreSelectionne.nom}</h3>
                        <p className="text-or/70 font-mono text-[10px] mt-2 tracking-[0.2em] uppercase">ID • {String(membreSelectionne.id).padStart(8, '0').slice(0,8)}</p>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl shadow-xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                      <QRCodeCanvas value={String(membreSelectionne.id)} size={75} bgColor="#ffffff" fgColor="#000000" level="H" />
                    </div>
                  </div>
                </div>

                <p className="text-clair/50 text-sm text-center mt-8 font-bold flex items-center gap-2">
                  <span className="animate-pulse">👆</span> Touchez la carte pour agrandir le code
                </p>
              </div>

            ) : (

              // ============================================
              // 📖 VUE : DOSSIER PASTORAL CLASSIQUE 📖
              // ============================================
              <div className="flex flex-col md:flex-row h-full">
                <div className="bg-or p-8 flex flex-col items-center justify-center text-sombre md:w-2/5 relative">
                  <div className="mb-6 relative">
                    {membreSelectionne.photo_url ? (
                      <img src={membreSelectionne.photo_url} alt={membreSelectionne.nom} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-sombre font-black text-5xl shadow-xl">
                        {getInitiales(membreSelectionne.nom)}
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-sombre mb-1 leading-tight text-center">{membreSelectionne.nom}</h2>
                  <p className="text-sombre/70 font-bold mb-6 font-mono text-sm">{membreSelectionne.telephone}</p>

                  <div className="bg-white/20 px-4 py-2 rounded-xl font-mono text-xs font-bold border border-white/30">
                    ID: {String(membreSelectionne.id).padStart(8, '0').slice(0,8)}
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  
                  <h3 className="text-xl font-black text-white mb-6 border-b border-clair/10 pb-4">Parcours Spirituel</h3>

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

                  <div className="bg-sombre/50 p-5 rounded-2xl border border-clair/5 flex-1">
                    <h5 className="text-[10px] uppercase font-black text-or mb-2 tracking-widest">Journal de Suivi</h5>
                    <p className="text-clair/70 text-sm leading-relaxed italic max-h-32 overflow-y-auto pr-2">
                      {membreSelectionne.notes_pastorales || "Aucune note."}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button 
                      onClick={() => setAfficherCarteVIP(true)}
                      className="bg-or/10 border border-or/30 text-or font-bold py-3 px-4 rounded-xl hover:bg-or hover:text-sombre transition-all text-sm flex items-center gap-2 flex-1 justify-center"
                    >
                      💳 Voir la Carte VIP
                    </button>
                    
                    <button 
                      onClick={() => {
                        setNom(membreSelectionne.nom); setTelephone(membreSelectionne.telephone);
                        setDateNaissance(membreSelectionne.date_naissance || ""); setDateBapteme(membreSelectionne.date_bapteme || "");
                        setDateCommunion(membreSelectionne.date_communion || ""); setDateConfirmation(membreSelectionne.date_confirmation || "");
                        setNotes(membreSelectionne.notes_pastorales || ""); setUrlPhotoExistante(membreSelectionne.photo_url || "");
                        setModeEdition(true); fermerModal();
                      }}
                      className="bg-white/5 border border-white/10 text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all text-sm" title="Modifier le dossier"
                    >
                      ✏️
                    </button>
                    
                    <button onClick={() => supprimerMembre(membreSelectionne.id)} className="bg-red-500/10 text-red-500 px-4 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Supprimer">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

            )}
          </div>
        </div>
      )}

      {/* OVERLAY PLEIN ÉCRAN POUR LE SCAN DU QR CODE */}
      {qrZoom && membreSelectionne && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-200"
          onClick={() => setQrZoom(false)}
        >
          <div className="bg-white p-8 rounded-[40px] shadow-[0_0_100px_rgba(255,215,0,0.3)] animate-in zoom-in duration-300">
            <QRCodeCanvas value={String(membreSelectionne.id)} size={280} bgColor="#ffffff" fgColor="#000000" level="H" />
          </div>
          <h3 className="text-white text-3xl font-black mt-10 tracking-widest uppercase">{membreSelectionne.nom}</h3>
          <p className="text-or/50 mt-4 font-bold tracking-[0.2em] uppercase text-sm animate-pulse">Toucher l'écran pour fermer</p>
        </div>
      )}
    </div>
  );
}