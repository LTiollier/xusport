# XuSport

XuSport est une application mobile-first (PWA) conçue pour enregistrer et suivre vos séances de sport au poids de corps. L'accent est mis sur la simplicité, la progression et une expérience utilisateur fluide, même hors ligne.

## 🚀 Vision du Projet

L'objectif de XuSport est de fournir un outil efficace pour les athlètes souhaitant :
- Enregistrer rapidement leurs performances (répétitions, séries).
- Suivre leur progression via des records personnels (PB).
- Utiliser l'application en mode "Offline-first" grâce à une synchronisation intelligente.
- Profiter d'une interface sombre moderne et épurée.

## 🛠 Stack Technique

### Frontend
- **Framework :** [Next.js](https://nextjs.org/) (TypeScript)
- **Base de données locale :** [Dexie.js](https://dexie.org/) (IndexedDB) pour le mode hors-ligne.
- **Styling :** [TailwindCSS](https://tailwindcss.com/)
- **Animations :** [Framer Motion](https://www.framer.com/motion/)
- **PWA :** Service Workers pour le support Offline.

### Backend
- **Framework :** [Laravel 11](https://laravel.com/) (PHP 8.3+)
- **Authentification :** [Laravel Sanctum](https://laravel.com/docs/sanctum)
- **Base de données :** PostgreSQL
- **Architecture :** API RESTful

## 🏗 Architecture des Données

- **User :** Gère l'authentification et les préférences.
- **Exercise :** Catalogue des exercices disponibles (Pompes, Tractions, etc.).
- **SessionModel :** Modèles de séances (ex: "Push Day", "Lundi Matin").
- **SessionExercise :** Configuration des exercices dans un modèle (séries, objectif, temps de repos).
- **SessionLog :** Historique des séances réalisées.
- **PerformanceLog :** Détails des performances série par série avec détection de record (PB).

## 🚦 Démarrage Rapide (Docker)

La méthode recommandée pour lancer le projet est d'utiliser Docker Compose.

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-repo/xusport.git
   cd xusport
   ```

2. **Configuration des environnements**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Lancer les conteneurs**
   ```bash
   docker-compose up -d
   ```

4. **Initialiser le Backend**
   ```bash
   docker-compose exec backend composer install
   docker-compose exec backend php artisan key:generate
   docker-compose exec backend php artisan migrate --seed
   ```

L'application sera disponible aux adresses suivantes :
- **Frontend :** [http://localhost:3000](http://localhost:3000)
- **Backend API :** [http://localhost:8000](http://localhost:8000)

## 📖 Documentation API

Une documentation détaillée de l'API est disponible dans le fichier [backend/API.md](backend/API.md).

## 📱 Fonctionnalités Clés

- **Offline-first :** Enregistrez vos séances même sans connexion, elles seront synchronisées dès le retour du réseau.
- **Workout Timer :** Timer de repos intégré avec alertes sonores et vibrations.
- **Suivi de Record :** Détection automatique des Records Personnels (PB) basée sur le volume de répétitions.
- **Interface Progressive :** Installation sur smartphone comme une application native.

---
*XuSport - Développé avec passion pour le sport.*
