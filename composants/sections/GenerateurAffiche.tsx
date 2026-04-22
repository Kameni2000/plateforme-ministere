"use client";

import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { supabase } from "../../lib/supabase";

interface GenerateurProps {
  modeleACharger?: any;
}

export default function GenerateurAffiche({ modeleACharger }: GenerateurProps) {
  const [titre, setTitre] = useState("Culte de Célébration");
  const [orateur, setOrateur] = useState("Pasteur Yvan");
  const [date, setDate] = useState("Dimanche 25 Avril • 09:30");
  
  // NOUVEAU : On crée une mémoire pour stocker l'image de fond
  const [fondImage, setFondImage] = useState<string | null>(null);
  
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [message, setMessage] = useState("");
  
  const afficheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modeleACharger) {
      setTitre(modeleACharger.titre);
      setOrateur(modeleACharger.orateur);
      setDate(modeleACharger.date_culte);
      // Note : on ne charge pas l'image du modèle pour l'instant car elle n'est pas dans la base de données
    }
  }, [modeleACharger]);

  // NOUVELLE FONCTION : Lire l'image uploadée par l'utilisateur
  const gererUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0]; // On récupère le fichier cliqué
    if (fichier) {
      const lecteur = new FileReader();
      lecteur.onload = (evenement) => {
        // Dès que l'image est lue, on la sauvegarde dans notre mémoire
        setFondImage(evenement.target?.result as string);
      };
      lecteur.readAsDataURL(fichier); // On lance la lecture
    }
  };

  const telechargerVisuel = async () => {
    if (!afficheRef.current) return;
    try {
      const dataUrl = await toPng(afficheRef.current, {
        quality: 1,
        pixelRatio: 2, 
        backgroundColor: "#111111",
      });
      const lien = document.createElement("a");
      lien.href = dataUrl;
      lien.download = `ChurchHub-${titre.replace(/\s+/g, '-')}.png`;
      lien.click();
    } catch (erreur) {
      console.error("Erreur lors de la capture :", erreur);
      alert("Oups, impossible de générer l'image.");
    }
  };

  const sauvegarderModele = async () => {
    setSauvegardeEnCours(true);
    setMessage("");

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setMessage("❌ Vous devez être connecté pour sauvegarder.");
      setSauvegardeEnCours(false);
      return;
    }

    const { error } = await supabase
      .from('modeles_affiches')
      .insert([
        { 
          user_id: session.user.id, 
          titre: titre, 
          orateur: orateur, 
          date_culte: date 
        }
      ]);

    if (error) {
      console.error(error);
      setMessage("❌ Erreur lors de la sauvegarde.");
    } else {
      setMessage("✅ Modèle sauvegardé avec succès !");
      setTimeout(() => setMessage(""), 3000);
    }
    
    setSauvegardeEnCours(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="bg-sombre/50 p-8 rounded-2xl border border-clair/10">
          <h2 className="text-2xl font-bold mb-6">Paramètres du visuel</h2>
          
          <div className="space-y-5">
            
            {/* NOUVEAU : Bouton d'upload d'image */}
            <div>
              <label className="block text-sm font-medium text-clair/70 mb-2">Image de Fond (Optionnel)</label>
              <input 
                type="file" 
                accept="image/*" // On n'accepte que les images
                onChange={gererUploadImage}
                className="w-full bg-sombre border border-clair/20 rounded-lg px-4 py-2 text-clair focus:outline-none focus:border-or transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-or/10 file:text-or hover:file:bg-or/20 cursor-pointer"
              />
            </div>

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

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={telechargerVisuel}
                className="w-full bg-or text-sombre font-bold py-3 rounded-lg hover:bg-or/90 transition-colors"
              >
                Télécharger mon Affiche HD
              </button>

              <button 
                onClick={sauvegarderModele}
                disabled={sauvegardeEnCours}
                className="w-full border border-clair/20 text-clair font-bold py-3 rounded-lg hover:bg-clair/5 transition-colors disabled:opacity-50"
              >
                {sauvegardeEnCours ? "Sauvegarde..." : "Sauvegarder ce modèle"}
              </button>
            </div>

            {message && (
              <div className="text-center text-sm font-medium animate-pulse mt-2">
                {message}
              </div>
            )}

          </div>
        </div>

        {/* COLONNE DROITE : APERÇU EN DIRECT */}
        <div className="flex justify-center">
          <div 
            ref={afficheRef} 
            className="w-full max-w-md aspect-square bg-[#111] relative overflow-hidden rounded-xl border-4 border-sombre shadow-2xl flex flex-col justify-center items-center text-center p-8"
          >
            {/* L'IMAGE DE FOND IMPORTÉE */}
            {fondImage && (
              <>
                <img 
                  src={fondImage} 
                  alt="Fond importé" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                {/* Un voile noir pour assombrir la photo et garder le texte lisible */}
                <div className="absolute inset-0 bg-black/60"></div>
              </>
            )}

            {/* Nos décorations dorées (qui passent par-dessus l'image) */}
            <div className="absolute top-0 left-0 w-full h-2 bg-or z-10"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-or/30 rounded-full blur-3xl z-10"></div>
            
            {/* Le Texte (on ajoute z-10 pour être sûr qu'il reste au-dessus de l'image) */}
            <h4 className="text-or font-bold tracking-widest text-sm uppercase mb-4 z-10">
              ChurchHub Présente
            </h4>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight uppercase z-10">
              {titre}
            </h1>
            
            <div className="w-16 h-1 bg-or mx-auto mb-6 z-10"></div>
            
            <p className="text-xl text-white/90 font-medium mb-8 whitespace-nowrap z-10">
              Avec <span className="text-or">{orateur}</span>
            </p>
            
            <div className="absolute bottom-8 left-0 w-full flex justify-center z-10">
              <p className="inline-block bg-white text-black font-bold px-6 py-2 rounded-full text-sm whitespace-nowrap shadow-lg">
                {date}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}