import Link from "next/link";

export default function Tarifs() {
  return (
    <div className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Des Tarifs <span className="text-or">Transparents</span>
          </h1>
          <p className="text-clair/60 text-lg max-w-2xl mx-auto">
            Choisissez le plan qui correspond à la taille et aux ambitions de votre ministère.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* CARTE GRATUITE */}
          <div className="bg-sombre/50 p-8 rounded-2xl border border-clair/10 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Plan Essentiel</h3>
            <p className="text-clair/60 mb-6">Pour démarrer avec excellence.</p>
            <div className="text-4xl font-bold mb-8">Gratuit</div>
            
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-3">
                <span className="text-or">✓</span> Générateur d'affiches basique
              </li>
              <li className="flex items-center gap-3">
                <span className="text-or">✓</span> 5 modèles sauvegardés
              </li>
              <li className="flex items-center gap-3 text-clair/40">
                <span>✗</span> Gestion des membres
              </li>
            </ul>
            
            <Link href="/connexion" className="w-full text-center border border-clair/20 font-bold py-3 rounded-lg hover:bg-clair/5 transition-colors">
              Commencer gratuitement
            </Link>
          </div>

          {/* CARTE PREMIUM (Mise en avant) */}
          <div className="bg-or/5 p-8 rounded-2xl border-2 border-or relative flex flex-col shadow-2xl shadow-or/10 transform md:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-or text-sombre text-sm font-bold px-4 py-1 rounded-full uppercase tracking-widest">
              Recommandé
            </div>
            
            <h3 className="text-2xl font-bold mb-2 text-or">Plan Église Pro</h3>
            <p className="text-clair/80 mb-6">La solution complète pour grandir.</p>
            <div className="text-4xl font-bold mb-8 text-white">29€ <span className="text-lg text-clair/60 font-normal">/mois</span></div>
            
            <ul className="space-y-4 mb-8 flex-grow text-white/90">
              <li className="flex items-center gap-3">
                <span className="text-or font-bold">✓</span> Générateur d'affiches illimité
              </li>
              <li className="flex items-center gap-3">
                <span className="text-or font-bold">✓</span> Import de photos personnalisées
              </li>
              <li className="flex items-center gap-3">
                <span className="text-or font-bold">✓</span> Gestion complète des membres
              </li>
            </ul>
            
            <Link href="/connexion" className="w-full text-center bg-or text-sombre font-bold py-3 rounded-lg hover:bg-or/90 transition-colors">
              Passer au niveau supérieur
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}