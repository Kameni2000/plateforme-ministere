"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Communication() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);
  
  const [cible, setCible] = useState<"Tous" | "Actif" | "Visiteur" | "Ouvrier">("Tous");
  const [typeMessage, setTypeMessage] = useState<"Email">("Email"); // Restreint à l'Email pour Resend
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("Bonjour [Nom], nous sommes ravis de t'inviter au culte de ce dimanche. Sois béni !");
  
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [statutEnvoi, setStatutEnvoi] = useState<"attente" | "succes" | "erreur">("attente");
  const [messageErreur, setMessageErreur] = useState("");

  const router = useRouter();

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/connexion");
      else {
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
      .eq('user_id', userId);
    if (!error && data) setMembres(data);
  };

  const membresCibles = cible === "Tous" 
    ? membres 
    : membres.filter(m => m.statut === cible);

  // LE VÉRITABLE DÉCLENCHEUR D'ENVOI VIA RESEND
  const lancerCampagneReelle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Filtrer ceux qui ont une adresse e-mail valide
    const ciblesAvecEmail = membresCibles.filter(m => m.email && m.email.includes('@'));
    
    if (ciblesAvecEmail.length === 0) {
      alert("Erreur : Aucun membre de ce groupe n'a d'adresse e-mail enregistrée.");
      return;
    }

    setEnvoiEnCours(true);
    setStatutEnvoi("attente");

    try {
      // 2. Extraire la liste des e-mails
      const listeEmails = ciblesAvecEmail.map(m => m.email);

      // 3. Préparer le message basique (On remplace la variable [Nom] par "Membre" pour l'envoi groupé basique)
      const messageNettoye = message.replace(/\[Nom\]/g, "bien-aimé(e)");
      const messageHtml = `<div style="font-family: sans-serif; padding: 20px; color: #333;"><p>${messageNettoye.replace(/\n/g, '<br/>')}</p></div>`;

      // 4. Appel à notre nouvelle route API
      const reponse = await fetch('/api/envoi-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: listeEmails,
          sujet: sujet || "Nouveau message de votre église",
          messageHtml: messageHtml
        })
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.error || "Erreur de connexion au serveur d'envoi");
      }

      setStatutEnvoi("succes");
      setTimeout(() => setStatutEnvoi("attente"), 5000);

    } catch (erreur: any) {
      setStatutEnvoi("erreur");
      setMessageErreur(erreur.message);
      setTimeout(() => setStatutEnvoi("attente"), 6000);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (!utilisateur) return null;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/dashboard" className="text-or hover:text-white transition-colors bg-or/10 p-2 rounded-lg">← Dashboard</Link>
            <h1 className="text-3xl font-bold">Centre de <span className="text-or">Communication</span> 💌</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-[#111] p-8 rounded-3xl border border-clair/10 shadow-xl relative overflow-hidden">
            
            {statutEnvoi === "succes" && (
              <div className="absolute inset-0 bg-green-900/90 backdrop-blur-sm flex flex-col justify-center items-center z-10">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-5xl mb-6">✓</div>
                <h2 className="text-3xl font-bold text-white mb-2">Campagne Envoyée !</h2>
                <p className="text-green-100 text-lg">Vos e-mails sont en cours de distribution via Resend.</p>
              </div>
            )}

            {statutEnvoi === "erreur" && (
              <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex flex-col justify-center items-center z-10 text-center p-6">
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-5xl mb-6">✗</div>
                <h2 className="text-3xl font-bold text-white mb-2">Erreur d'envoi</h2>
                <p className="text-red-100">{messageErreur}</p>
              </div>
            )}

            <form onSubmit={lancerCampagneReelle} className="space-y-6">
              
              <div>
                <label className="block text-sm text-clair/70 mb-3 font-bold uppercase tracking-wider">1. À qui envoyez-vous ?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Tous", "Actif", "Visiteur", "Ouvrier"].map((c) => (
                    <button
                      key={c} type="button" onClick={() => setCible(c as any)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${cible === c ? 'bg-or text-sombre border-or' : 'bg-sombre border-clair/10 text-clair/60 hover:border-clair/30'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-clair/70 mb-3 font-bold uppercase tracking-wider">2. Rédiger l'e-mail</label>
                
                <input 
                  type="text" placeholder="Sujet de l'e-mail..." value={sujet} onChange={(e) => setSujet(e.target.value)} required
                  className="w-full bg-sombre border border-clair/20 rounded-t-xl px-6 py-3 text-clair focus:border-or outline-none mb-[1px]"
                />
                
                <textarea 
                  required value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-sombre border border-clair/20 rounded-b-xl px-6 py-4 text-clair focus:border-or outline-none h-40 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" disabled={envoiEnCours}
                  className="w-full bg-or text-sombre font-black py-4 rounded-xl text-lg hover:scale-[1.01] transition-transform shadow-xl shadow-or/20 disabled:opacity-50"
                >
                  {envoiEnCours ? "Connexion au serveur..." : `🚀 Envoyer les E-mails réels`}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">⚠️ Mode Test Resend</h2>
            <div className="bg-or/10 p-6 rounded-3xl border border-or/20 text-sm text-clair/80 leading-relaxed">
              <p className="mb-4">
                Tant que vous n'avez pas lié et vérifié votre propre nom de domaine sur Resend (ex: contact@moneglise.com), vous êtes en <strong>Mode Test</strong>.
              </p>
              <p>
                Dans ce mode, Resend n'autorise l'envoi d'e-mails <strong>qu'à l'adresse e-mail avec laquelle vous avez créé votre compte Resend</strong>. Si vous essayez d'envoyer à d'autres membres, vous obtiendrez une erreur.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}