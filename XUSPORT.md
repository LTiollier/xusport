# XuSport - Application de Sport Poids de Corps

## Vision du Projet
Application personnelle simple et efficace pour enregistrer des sessions de sport au poids de corps, avec un focus sur le suivi de progression, les records personnels et une expérience utilisateur fluide (PWA Offline-first).

## Stack Technique
- **Frontend :** Next.js (TypeScript) + Dexie.js (IndexedDB) + TailwindCSS
- **Backend :** Laravel API + Sanctum (Auth)
- **Base de données :** PostgreSQL
- **PWA :** Offline-first. Synchronisation automatique en fin de séance (Gestion de conflit : *Last Write Wins*).
- **Assets :** Custom MP3 pour les alertes, Framer Motion / Canvas pour les célébrations.

## Architecture des Données (Finale)
- **User :** Authentification Sanctum, gère la session utilisateur.
- **Exercise :** `id, name, icon, created_at`.
- **SessionModel :** `id, name, user_id`.
- **SessionExercise (Block) :** `id, session_model_id, exercise_id, sets_count, goal_type (fixed/max), goal_value, rest_time, order`.
- **SessionLog :** `id, user_id, session_model_id, completed_at, synced_at`.
- **PerformanceLog :** `id, session_log_id, exercise_id, set_number, reps_done, is_pb (personal best)`.

## Interface & Design
- **Thème :** Dark Mode (Fond #0F172A / #1E293B).
- **Accents :** Violet Electrique (#7C3AED / #8B5CF6).
- **Navigation :** Tab Bar fixe en bas avec un **Floating Action Button (FAB) "START"** central.
- **Workout UI :** 
  - Affichage plein écran de l'exercice en cours.
  - Timer de repos géant après validation de la série.
  - Input de répétitions pré-rempli par la valeur de la séance précédente (`PerformanceLog` le plus récent pour cet exercice).
  - Signal sonore (custom MP3) + Vibration à la fin du repos.

## Logique Métier
- **Record (PB) :** Défini par le nombre maximum de répétitions réussies sur une seule série pour un exercice donné.
- **Célébration :** Écran de fin de séance avec animation "Coupe Dorée" et pluie de confettis si au moins un `is_pb` est à `true` dans la session.
- **Synchro :** Au login, récupération totale de l'historique Laravel -> IndexedDB.

## Plan de Développement (Prochaines Étapes)
1. **Backend :** Setup Laravel, migrations, et API Sanctum + Ressources CRUD.
2. **Frontend :** Setup Next.js, configuration PWA (Service Workers) et Dexie.js.
3. **Moteur d'entraînement :** Logique du Timer et de l'enchaînement des blocs.
4. **Visualisation :** Graphiques avec Chart.js ou Recharts.
5. **Polissage :** Animations de records et gestion audio.
