"use client"; // Obligatoire car il y a de l'interactivité (on tape du texte)

import { useState } from "react";

export default function GenerateurAffiche() {
  // Nos variables qui vont stocker le texte tapé par l'utilisateur
  const [titre, setTitre] = useState("Culte de Célébration");
  const [orateur, setOrateur] = useState("Pasteur Yvan");
  const [date, setDate] = useState("Dimanche 25 Avril • 09:30");

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      
      <div className="grid md:grid-cols-2 gap-12 items-start">
        
        {/* LA COLONNE DE GAUCHE : LE FORMULAIRE */}
        <div className="bg-sombre/50 p-8 rounded-2xl border border-clair/10">
          <h2 className="text-2xl font-bold mb-6">Paramètres du visuel</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-clair/70 mb-2">Titre du Culte</label>
              <input 
                type="text" 
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-3 text-clair focus:outline-none focus:border-or transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-clair/70 mb-2">Nom de l'Orateur</label>
              <input 
                type="text" 
                value={orateur}
                onChange={(e) => setOrateur(e.target.value)}
                className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-3 text-clair focus:outline-none focus:border-or transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-clair/70 mb-2">Date et Heure</label>
              <input 
                type="text" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-3 text-clair focus:outline-none focus:border-or transition-colors"
              />
            </div>

            <button className="w-full mt-4 bg-or text-sombre font-bold py-3 rounded-lg hover:bg-or/90 transition-colors">
              Télécharger l'Affiche (Bientôt)
            </button>
          </div>
        </div>

        {/* LA COLONNE DE DROITE : L'APERÇU EN DIRECT */}
        <div className="flex justify-center">
          {/* La zone de l'affiche (Format carré pour Facebook/Instagram) */}
          <div className="w-full max-w-md aspect-square bg-[#111] relative overflow-hidden rounded-xl border-4 border-sombre shadow-2xl flex flex-col justify-center items-center text-center p-8">
            
            {/* Décoration dorée en arrière-plan */}
            <div className="absolute top-0 left-0 w-full h-2 bg-or"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-or/10 rounded-full blur-3xl"></div>
            
            {/* Les textes générés en direct */}
            <h4 className="text-or font-bold tracking-widest text-sm uppercase mb-4">
              ChurchHub Présente
            </h4>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight uppercase">
              {titre}
            </h1>
            
            <div className="w-16 h-1 bg-or mx-auto mb-6"></div>
            
            <p className="text-xl text-white/90 font-medium mb-8">
              Avec <span className="text-or">{orateur}</span>
            </p>
            
            <div className="absolute bottom-8 left-0 w-full">
              <p className="inline-block bg-white text-black font-bold px-6 py-2 rounded-full text-sm">
                {date}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}