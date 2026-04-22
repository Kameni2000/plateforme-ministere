export default function Fonctionnalites() {
  const outils = [
    {
      titre: "Générateur d'Affiches IA",
      description: "Créez des visuels HD pour vos cultes en 3 clics, avec vos propres images de fond et une typographie professionnelle.",
      icone: "🎨"
    },
    {
      titre: "Base de Données Membres",
      description: "Sauvegardez vos modèles, gérez les informations de vos fidèles et suivez l'évolution de votre ministère en toute sécurité.",
      icone: "💾"
    },
    {
      titre: "Gestion des Offrandes",
      description: "Un tableau de bord clair pour suivre les dîmes et offrandes, avec des statistiques visuelles de la croissance financière.",
      icone: "📊"
    }
  ];

  return (
    <div className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
            Nos <span className="text-or">Fonctionnalités</span>
          </h1>
          <p className="text-clair/60 text-lg max-w-2xl mx-auto">
            Découvrez tous les outils conçus spécifiquement pour propulser l'excellence de votre église à l'ère du digital.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {outils.map((outil, index) => (
            <div key={index} className="bg-sombre/50 p-8 rounded-2xl border border-clair/10 hover:border-or/50 transition-all group">
              <div className="text-4xl mb-4 bg-or/10 w-16 h-16 rounded-xl flex items-center justify-center group-hover:bg-or group-hover:text-sombre transition-colors">
                {outil.icone}
              </div>
              <h3 className="text-xl font-bold mb-3">{outil.titre}</h3>
              <p className="text-clair/70 leading-relaxed">{outil.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}