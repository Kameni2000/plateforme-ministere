"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { QRCodeSVG } from "qrcode.react";

export default function Membres() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  const [membreEnEdition, setMembreEnEdition] = useState<any>(null);
  
  // États du formulaire
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [statut, setStatut] = useState("Actif");
  const [chargement, setChargement] = useState(false);
  
  // États de sécurité et de plan
  const [accesBloque, setAccesBloque] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [carteZoom, setCarteZoom] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/connexion");
      } else {
        setUtilisateur(session.user);
        
        // VÉRIFICATION DU PLAN : On autorise l'accès uniquement si le plan est 'pro'
        const planUtilisateur = session.user.user_metadata?.plan || 'gratuit';
        
        if (planUtilisateur !== 'pro') {
          setAccesBloque(true);
          setChargementInitial(false);
        } else {
          setAccesBloque(false);
          await chargerMembres(session.user.id);
          setChargementInitial(false);
        }
      }
    };
    verifierAcces();
  }, [router]);

  // FONCTION SECRÈTE DÉVELOPPEUR : Pour passer ton compte en PRO sans payer
  const activerModeProDev = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { plan: 'pro' }
    });
    
    if (!error) {
      alert("👑 Mode Pro activé avec succès ! Le mur de paiement va disparaître.");
      window.location.reload(); 
    } else {
      alert("Erreur DevMode : " + error.message);
    }
  };

  const chargerMembres = async (userId: string) => {
    const { data, error } = await supabase
      .from('membres')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setMembres(data);
  };

  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);

    if (membreEnEdition) {
      const { error } = await supabase.from('membres').update({ nom, email, telephone, statut }).eq('id', membreEnEdition.id);
      if (!error) { 
        setMembreEnEdition(null);
        setNom(""); setEmail(""); setTelephone("");
        chargerMembres(utilisateur.id); 
      }
    } else {
      const { error } = await supabase.from('membres').insert([{ user_id: utilisateur.id, nom, email, telephone, statut }]);
      if (!error) { 
        setNom(""); setEmail(""); setTelephone("");
        chargerMembres(utilisateur.id); 
      }
    }
    setChargement(false);
  };

  const supprimerMembre = async (id: number) => {
    if (!confirm("Supprimer définitivement ce membre ?")) return;
    const { error } = await supabase.from('membres').delete().eq('id', id);
    if (!error) setMembres(membres.filter(m => m.id !== id));
  };

  const membresFiltres = membres.filter((m) => 
    m.nom.toLowerCase().includes(recherche.toLowerCase()) || 
    (m.telephone && m.telephone.includes(recherche))
  );

  // 1. ÉCRAN DE CHARGEMENT INITIAL
  if (chargementInitial) {
    return (
      <div className="min-h-screen bg-sombre flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-or border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. MUR DE PAIEMENT (Si plan gratuit)
  if (accesBloque) {
    return (
      <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 flex flex-col items-center justify-center text-center">
        <div className="absolute top-8 left-8">
          <Link href="/dashboard" className="text-clair/50 hover:text-or transition-colors flex items-center gap-2">← Dashboard</Link>
        </div>
        
        <div className="max-w-lg bg-[#111] p-10 rounded-3xl border border-or/30 shadow-2xl">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-black mb-4">Gestion <span className="text-or">Premium</span></h1>
          <p className="text-clair/70 mb-8 text-lg">
            La gestion des membres et les Cartes VIP sont réservées aux églises du <strong className="text-white">Plan Pro</strong>.
          </p>
          
          <button className="w-full bg-or text-sombre font-black py-4 rounded-xl text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-or/20">
            Passer au niveau supérieur (29€/mois)
          </button>

          <button 
            onClick={activerModeProDev}
            className="mt-8 text-[10px] text-clair/20 hover:text-clair/80 transition-colors font-mono uppercase tracking-widest"
          >
            [ Développeur : Forcer l'accès Pro ]
          </button>
        </div>
      </div>
    );
  }

  // 3. INTERFACE COMPLÈTE DU RÉPERTOIRE (Si plan Pro)
  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20 relative">
      
      {/* ZOOM CARTE VIP */}
      {carteZoom && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#050505] border-2 border-or/30 p-10 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center">
            <button onClick={() => setCarteZoom(null)} className="absolute top-4 right-4 text-clair/30 hover:text-white transition-colors text-2xl">✕</button>
            <div className="text-center mb-8 w-full border-b border-white/5 pb-4">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">CHURCH<span className="text-or">HUB</span></h3>
              <p className="text-[10px] text-or tracking-[0.4em] font-bold">VIP MEMBER</p>
            </div>
            <div className="bg-white p-3 rounded-2xl mb-8 border-4 border-or/20 shadow-lg">
              <QRCodeSVG value={JSON.stringify({ id: carteZoom.id, nom: carteZoom.nom })} size={180} />
            </div>
            <h2 className="text-2xl font-bold text-white">{carteZoom.nom}</h2>
            <div className="px-4 py-1 rounded-full bg-or/10 text-or text-xs font-bold uppercase mt-2 border border-or/20">{carteZoom.statut}</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 border-b border-clair/10 pb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-or bg-or/10 p-2 rounded-lg hover:bg-or hover:text-sombre transition-all">← Dashboard</Link>
            <h1 className="text-3xl font-black italic">RÉPERTOIRE <span className="text-or tracking-tighter">VIP</span></h1>
          </div>
          <Link href="/scanner" className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2">
            📷 Mode Accueil (Scanner)
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* FORMULAIRE D'AJOUT */}
          <div className={`p-8 rounded-3xl border transition-all duration-300 lg:col-span-1 sticky top-32 ${membreEnEdition ? 'bg-or/5 border-or/50 shadow-or/10' : 'bg-[#111] border-clair/10'}`}>
            <h2 className="text-xl font-bold mb-6">{membreEnEdition ? "✏️ Édition du membre" : "✨ Nouveau Membre"}</h2>
            <form onSubmit={soumettreFormulaire} className="space-y-4">
              <div><label className="block text-xs font-bold text-clair/50 uppercase mb-2">Nom complet</label><input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 text-clair outline-none focus:border-or transition-all"/></div>
              <div><label className="block text-xs font-bold text-clair/50 uppercase mb-2">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 text-clair outline-none focus:border-or transition-all"/></div>
              <div><label className="block text-xs font-bold text-clair/50 uppercase mb-2">Téléphone</label><input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 text-clair outline-none focus:border-or transition-all"/></div>
              <div><label className="block text-xs font-bold text-clair/50 uppercase mb-2">Statut</label><select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full bg-sombre border border-clair/10 rounded-xl px-4 py-3 text-clair outline-none focus:border-or transition-all appearance-none"><option value="Actif">Membre Actif</option><option value="Visiteur">Visiteur</option><option value="Ouvrier">Ouvrier / Leader</option></select></div>
              <button type="submit" disabled={chargement} className="w-full bg-or text-sombre font-black py-4 rounded-xl mt-4 hover:scale-[1.02] transition-transform shadow-lg shadow-or/20">
                {chargement ? "Traitement..." : (membreEnEdition ? "Sauvegarder" : "Générer la Carte VIP")}
              </button>
            </form>
          </div>

          {/* GRILLE DES CARTES VIP */}
          <div className="lg:col-span-2">
            <div className="relative mb-8">
              <input type="text" placeholder="Rechercher un membre par nom ou téléphone..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full bg-[#111] border border-clair/10 rounded-2xl px-6 py-4 text-lg outline-none focus:border-or transition-all" />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {membresFiltres.map((membre) => (
                <div key={membre.id} className="group relative">
                  <div className="absolute -top-2 -right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button onClick={() => { setMembreEnEdition(membre); setNom(membre.nom); setEmail(membre.email || ""); setTelephone(membre.telephone || ""); setStatut(membre.statut); }} className="bg-sombre border border-clair/20 p-2 rounded-lg text-clair hover:text-or transition-colors">✏️</button>
                    <button onClick={() => supprimerMembre(membre.id)} className="bg-sombre border border-clair/20 p-2 rounded-lg text-clair hover:text-red-500 transition-colors">🗑️</button>
                  </div>

                  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl border border-clair/10 overflow-hidden shadow-xl hover:border-or/40 transition-all">
                    <div className={`h-1.5 w-full ${membre.statut === 'Ouvrier' ? 'bg-purple-500' : membre.statut === 'Visiteur' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="max-w-[140px]">
                          <h3 className="font-black text-white text-lg leading-tight uppercase truncate">{membre.nom}</h3>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-2 inline-block border ${membre.statut === 'Ouvrier' ? 'text-purple-400 border-purple-500/30' : membre.statut === 'Visiteur' ? 'text-blue-400 border-blue-500/30' : 'text-green-400 border-green-500/30'}`}>
                            {membre.statut}
                          </span>
                        </div>
                        <div onClick={() => setCarteZoom(membre)} className="bg-white p-1 rounded-lg cursor-pointer hover:scale-110 transition-transform shadow-md">
                          <QRCodeSVG value={JSON.stringify({ id: membre.id, nom: membre.nom })} size={55} />
                        </div>
                      </div>
                      <div className="space-y-1 text-[10px] text-clair/40 font-mono">
                        {membre.telephone && <p>TEL: {membre.telephone}</p>}
                        {membre.email && <p className="truncate">EML: {membre.email}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}