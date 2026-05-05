const path = require('path');

// Configuration de l'environnement pour la production
process.env.NODE_ENV = 'production';

// 02switch via Passenger définit souvent le PORT automatiquement.
// Sinon, on utilise le port 3000 par défaut.
const port = process.env.PORT || 3000;

console.log('Starting Next.js server on port:', port);

// Le mode standalone de Next.js génère un serveur prêt à l'emploi.
// Ce fichier server.js sert de point d'entrée pour l'outil Node.js de 02switch.
require('./.next/standalone/server.js');
