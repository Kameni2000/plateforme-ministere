"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type VueStudio = "accueil" | "analyse" | "calendrier" | "visuels" | "prompter";

export default function StudioSocialPro() {
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [vue, setVue] = useState<VueStudio>("accueil");
  const [theme, setTheme] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  
  const [scriptPersonnalise, setScriptPersonnalise] = useState("");
  const [vitessePrompter, setVitessePrompter] = useState(30);
  const [defilement, setDefilement] = useState(false);
  const [modePrompter, setModePrompter] = useState<"lecture" | "edition">("lecture");
  
  const prompterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const verifierAcces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/connexion");
      else setUtilisateur(session.user);
    };
    verifierAcces();
  }, [router]);

  useEffect(() => {
    let interval: any;
    if (defilement && modePrompter === "lecture" && prompterRef.current) {
      interval = setInterval(() => {
        if (prompterRef.current) {
          const currentScroll = prompterRef.current.scrollTop;
          const maxScroll = prompterRef.current.scrollHeight - prompterRef.current.clientHeight;
          
          if (currentScroll >= maxScroll) {
            setDefilement(false);
            clearInterval(interval);
          } else {
            prompterRef.current.scrollTop += 1;
          }
        }
      }, 110 - vitessePrompter);
    }
    return () => clearInterval(interval);
  }, [defilement, modePrompter, vitessePrompter]);

  // LE NOUVEAU GÉNÉRATEUR DYNAMIQUE
  const genererTout = (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    
    setTimeout(() => {
      const motCle = theme.toLowerCase();
      let scoreRandom = Math.floor(Math.random() * (98 - 82 + 1) + 82); // Score entre 82 et 98
      
      let baseResultat = {
        theme,
        scoreViralite: scoreRandom,
        conseils: [] as string[],
        script: "",
        calendrier: [] as any[],
        visuels: [] as Array<{ titre: string; prompt: string; image: string }>
      };

      // SCÉNARIO 1 : THÈME SUR LE PARDON / L'AMOUR / LA PAIX
      if (motCle.includes("pardon") || motCle.includes("amour") || motCle.includes("paix") || motCle.includes("couple")) {
        baseResultat.conseils = ["Parlez doucement et calmement", "Regardez l'objectif avec compassion", "Faites une longue pause après la première phrase"];
        baseResultat.script = `Garder rancune, c'est comme boire du poison et espérer que l'autre meure.\n\nOn vous a blessé. Je le sais. Et c'est injuste.\n\nMais à chaque fois que vous repensez à cette personne avec colère, vous lui donnez le contrôle de votre joie d'aujourd'hui.\n\nLe pardon n'est pas un sentiment. C'est une décision. Une décision de vous libérer, vous.\n\nFaites le choix de la paix aujourd'hui. Partagez cette vidéo à quelqu'un qui a besoin d'entendre ça.`;
        baseResultat.calendrier = [
          { jour: "Lundi", type: "Citation", contenu: `"Le pardon libère un prisonnier, et vous découvrez que ce prisonnier, c'était vous."` },
          { jour: "Mercredi", type: "Vidéo", contenu: "Publication du script face caméra." },
          { jour: "Vendredi", type: "Interaction", contenu: "Question en story : 'Quelle est la chose la plus difficile à pardonner selon vous ?'" }
        ];
        baseResultat.visuels = [
          { titre: "Miniature YouTube", prompt: "Deux mains ouvertes relâchant une colombe blanche dans une lumière matinale douce et dorée. Style cinématographique, très apaisant.", image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=800" },
          { titre: "Fond TikTok", prompt: "Un lac calme au lever du soleil avec une brume légère. Atmosphère de paix totale.", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800" }
        ];
      } 
      // SCÉNARIO 2 : THÈME SUR LES FINANCES / LA BÉNÉDICTION / LE SUCCÈS
      else if (motCle.includes("finance") || motCle.includes("argent") || motCle.includes("bénédiction") || motCle.includes("succès")) {
        baseResultat.conseils = ["Ayez une posture droite et assurée", "Utilisez un ton énergique", "Souriez à la fin de la vidéo"];
        baseResultat.script = `Vous vous inquiétez pour votre avenir financier ? Arrêtez de scroller.\n\nLe monde vous dit que votre valeur dépend de votre compte en banque. La Bible dit que vous êtes déjà héritier du plus grand Royaume.\n\nL'argent est un excellent serviteur, mais un terrible maître.\n\nSi vous cherchez d'abord le Royaume, tout le reste vous sera donné par-dessus.\n\nChangez votre mentalité de manque en mentalité d'abondance aujourd'hui. Écrivez "AMEN" si vous le croyez !`;
        baseResultat.calendrier = [
          { jour: "Lundi", type: "Citation", contenu: `"Ce que Dieu a pour vous est plus grand que ce que vous avez perdu."` },
          { jour: "Mercredi", type: "Vidéo", contenu: "Publication du script sur l'abondance." },
          { jour: "Vendredi", type: "Témoignage", contenu: "Partagez un témoignage de provision divine miraculeuse." }
        ];
        baseResultat.visuels = [
          { titre: "Miniature YouTube", prompt: "Une graine plantée dans un sol riche d'où pousse un arbre aux feuilles d'or brillant sous le soleil.", image: "https://images.unsplash.com/photo-1611024847487-e26177381a39?q=80&w=800" },
          { titre: "Fond TikTok", prompt: "Des mains ouvertes recevant une pluie de lumière dorée étincelante sur un fond sombre et premium.", image: "https://images.unsplash.com/photo-1518182170546-076616fdcb18?q=80&w=800" }
        ];
      }
      // SCÉNARIO 3 : PAR DÉFAUT (Combat / Désert / Foi)
      else {
        baseResultat.conseils = ["Commencez par une question directe", "Maintenez un ton confidentiel", "Utilisez des gestes avec les mains"];
        baseResultat.script = `Vous avez l'impression que tout s'effondre ? \n\nÉcoutez bien, car ce n'est pas un hasard si vous voyez cette vidéo aujourd'hui. \n\nLa Bible dit que même dans la vallée de l'ombre de la mort, vous ne devez craindre aucun mal. \n\nLe désert n'est pas votre destination finale, c'est votre terrain d'entraînement. \n\nDieu ne vous a pas oublié. Restez fort. Restez fidèle. \n\nPartagez ceci à quelqu'un qui a besoin d'espoir.`;
        baseResultat.calendrier = [
          { jour: "Lundi", type: "Citation", contenu: `Le désert est une préparation, pas une punition. #Foi` },
          { jour: "Mercredi", type: "Vidéo", contenu: "Enregistrement du script face caméra." },
          { jour: "Vendredi", type: "Témoignage", contenu: "Posez la question : Quel a été votre plus grand miracle cette année ?" }
        ];
        baseResultat.visuels = [
          { titre: "Miniature YouTube", prompt: "Un homme seul marchant dans un désert vaste, mais un rayon de lumière dorée perce les nuages sombres.", image: "https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?q=80&w=800" },
          { titre: "Fond TikTok", prompt: "Une montagne imposante dans la brume, vue d'en bas, éclairage dramatique.", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800" }
        ];
      }

      setResultat(baseResultat);
      setScriptPersonnalise(baseResultat.script);
      setChargement(false);
      setVue("analyse");
    }, 1500);
  };

  if (!utilisateur) return null;

  return (
    <div className="min-h-screen bg-sombre text-clair pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        
        {/* NAVIGATION DU STUDIO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-clair/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="bg-or/10 p-2 rounded-lg text-or hover:bg-or hover:text-sombre transition-colors">← Dashboard</Link>
            <h1 className="text-3xl font-bold italic tracking-tighter">STUDIO <span className="text-or">PRO</span></h1>
          </div>
          
          {resultat && (
            <div className="flex bg-sombre p-1 rounded-xl border border-clair/10 overflow-hidden shadow-lg">
              <button onClick={() => setVue("analyse")} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${vue === 'analyse' ? 'bg-or text-sombre' : 'text-clair/50 hover:text-clair'}`}>📊 Analyse</button>
              <button onClick={() => setVue("calendrier")} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${vue === 'calendrier' ? 'bg-or text-sombre' : 'text-clair/50 hover:text-clair'}`}>📅 Calendrier</button>
              <button onClick={() => setVue("visuels")} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${vue === 'visuels' ? 'bg-purple-600 text-white' : 'text-clair/50 hover:text-clair'}`}>🎨 Visuels</button>
              <button onClick={() => setVue("prompter")} className={`px-4 py-2 text-xs font-bold uppercase transition-all ${vue === 'prompter' ? 'bg-blue-600 text-white' : 'text-clair/50 hover:text-clair'}`}>🎬 Prompter</button>
            </div>
          )}
        </div>

        {/* 1. VUE ACCUEIL */}
        {vue === "accueil" && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <h2 className="text-5xl font-black mb-6">Prêt à devenir <span className="text-or underline">Viral</span> ?</h2>
            <p className="text-clair/60 mb-10 text-lg">Testez des mots comme "pardon", "finances" ou "désert" pour voir l'IA s'adapter !</p>
            <form onSubmit={genererTout} className="space-y-4">
              <input 
                type="text" required value={theme} onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: La puissance du pardon..."
                className="w-full bg-sombre border-2 border-clair/10 rounded-2xl px-8 py-5 text-xl outline-none focus:border-or transition-all text-center"
              />
              <button disabled={chargement} className="w-full bg-or text-sombre font-black py-5 rounded-2xl text-xl hover:scale-[1.02] transition-transform shadow-xl shadow-or/20">
                {chargement ? "🧠 ANALYSE SÉMANTIQUE EN COURS..." : "GÉNÉRER LA STRATÉGIE PRO"}
              </button>
            </form>
          </div>
        )}

        {/* 2. VUE ANALYSE */}
        {vue === "analyse" && resultat && (
          <div className="grid md:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-sombre/80 p-8 rounded-3xl border border-or/20 text-center shadow-lg">
                <span className="text-sm font-bold text-or uppercase tracking-widest">Score de Viralité</span>
                <div className="text-7xl font-black my-4 text-white">{resultat.scoreViralite}%</div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-or" style={{ width: `${resultat.scoreViralite}%`, transition: 'width 1s ease-in-out' }}></div>
                </div>
              </div>
              <div className="bg-[#111] p-6 rounded-3xl border border-clair/5 shadow-lg">
                <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-clair/50">Conseils de l'IA</h3>
                <ul className="space-y-3">
                  {resultat.conseils.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-or">✦</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:col-span-2 bg-[#111] p-10 rounded-3xl border border-clair/5 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span>📝</span> Script Optimisé
              </h3>
              <p className="text-xl leading-relaxed text-clair/80 whitespace-pre-wrap font-medium">
                {resultat.script}
              </p>
            </div>
          </div>
        )}

        {/* 3. VUE CALENDRIER */}
        {vue === "calendrier" && resultat && (
          <div className="grid gap-6 animate-in slide-in-from-right duration-500">
            {resultat.calendrier.map((item: any, i: number) => (
              <div key={i} className="bg-[#111] p-8 rounded-3xl border border-clair/5 shadow-lg flex flex-col md:flex-row gap-6 items-center hover:border-or/30 transition-colors">
                <div className="bg-or text-sombre px-6 py-2 rounded-xl font-black uppercase text-sm w-full md:w-auto text-center">{item.jour}</div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-or uppercase tracking-tighter">{item.type}</span>
                  <p className="text-lg mt-1">{item.contenu}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. VUE VISUELS */}
        {vue === "visuels" && resultat && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Générateur d'Illustrations</h2>
              <p className="text-clair/60">Concepts visuels suggérés spécifiquement pour le thème : "{resultat.theme}"</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {resultat.visuels.map((visuel: any, i: number) => (
                <div key={i} className="bg-[#111] rounded-3xl border border-clair/5 shadow-xl overflow-hidden group">
                  <div className="h-64 overflow-hidden relative">
                    <img src={visuel.image} alt="Suggestion IA" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase text-white border border-white/10">
                      {visuel.titre}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Prompt (Description secrète) :</h3>
                    <p className="text-sm text-clair/80 italic bg-sombre/50 p-4 rounded-xl border border-clair/5">"{visuel.prompt}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. VUE PROMPTER COCKPIT */}
        {vue === "prompter" && resultat && (
          <div className="max-w-4xl mx-auto bg-black rounded-3xl border border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-500/10 animate-in zoom-in duration-500 flex flex-col">
            
            <div className="relative flex-1">
              {/* MODE LECTURE */}
              <div 
                ref={prompterRef}
                className={`h-[500px] overflow-hidden px-6 md:px-12 py-40 text-center select-none transition-opacity duration-300 ${modePrompter === 'edition' ? 'opacity-0' : 'opacity-100'}`}
              >
                <p className="text-3xl md:text-5xl font-bold leading-[1.5] text-white opacity-90 uppercase">
                  {scriptPersonnalise}
                </p>
              </div>

              {/* MODE ÉDITION */}
              {modePrompter === "edition" && (
                <div className="absolute inset-0 p-8 md:p-12 bg-black animate-in fade-in duration-300">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span>✏️</span> Modifier le Script avant lecture
                  </h3>
                  <textarea 
                    value={scriptPersonnalise}
                    onChange={(e) => setScriptPersonnalise(e.target.value)}
                    className="w-full h-[350px] bg-sombre/80 border border-clair/10 rounded-2xl px-6 py-4 text-xl leading-relaxed text-clair focus:border-blue-500 outline-none transition-colors whitespace-pre-wrap font-medium"
                    placeholder="Tapez votre script personnalisé ici..."
                  />
                </div>
              )}
            </div>

            <div className="bg-[#050505] p-8 border-t border-clair/10 flex flex-col items-center gap-6">
              <div className="flex bg-sombre p-1 rounded-xl border border-clair/10 overflow-hidden shadow-md mb-2">
                <button 
                  onClick={() => { setModePrompter("lecture"); setDefilement(false); }}
                  className={`px-4 py-2 text-xs font-bold uppercase transition-all ${modePrompter === 'lecture' ? 'bg-white text-black' : 'text-clair/50 hover:text-clair'}`}
                >
                  🎬 Mode Lecture
                </button>
                <button 
                  onClick={() => { setModePrompter("edition"); setDefilement(false); }}
                  className={`px-4 py-2 text-xs font-bold uppercase transition-all ${modePrompter === 'edition' ? 'bg-blue-600 text-white' : 'text-clair/50 hover:text-clair'}`}
                >
                  ✏️ Mode Édition
                </button>
              </div>

              {modePrompter === "lecture" && (
                <>
                  <div className="flex items-center gap-8">
                    <button 
                      onClick={() => setDefilement(!defilement)}
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${defilement ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-white text-black hover:scale-110'}`}
                    >
                      {defilement ? "⏸" : "▶"}
                    </button>
                  </div>
                  <div className="w-full max-w-md">
                    <div className="flex justify-between text-xs font-bold uppercase mb-2 text-clair/40">
                      <span>Vitesse de défilement</span>
                      <span>{vitessePrompter}%</span>
                    </div>
                    <input 
                      type="range" min="1" max="100" value={vitessePrompter} onChange={(e) => setVitessePrompter(parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}