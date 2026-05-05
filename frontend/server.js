const path = require('path');

// Indiquer à Next.js où se trouvent les fichiers
process.env.NODE_ENV = 'production';
process.env.NEXT_RUNTIME = 'nodejs';

// Importation du serveur généré par Next.js standalone
// On change le répertoire de travail pour que les chemins relatifs dans .next/standalone fonctionnent
process.chdir(path.join(__dirname, '.next', 'standalone'));

// Lancement du serveur standalone
require('./server.js');
