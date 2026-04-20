import GenerateurAffiche from "../composants/sections/GenerateurAffiche";

export default function Accueil() {
  return (
    <main className="min-h-screen bg-sombre text-clair flex flex-col items-center pt-20">
      
      {/* Section Héro */}
      <section className="text-center max-w-3xl px-6 mb-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          L'Élégance au service de votre <span className="text-or">Ministère</span>
        </h1>
        
        <p className="text-lg md:text-xl text-clair/80 leading-relaxed">
          Gérez vos offrandes, créez des visuels premium pour vos cultes et développez votre audience en toute simplicité.
        </p>
      </section>

      {/* NOTRE NOUVEAU GÉNÉRATEUR */}
      <section className="w-full border-t border-clair/10 bg-sombre/80">
        <GenerateurAffiche />
      </section>

    </main>
  );
}