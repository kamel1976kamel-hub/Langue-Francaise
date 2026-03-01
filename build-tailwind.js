const { execSync } = require('child_process');
const fs = require('fs');

// Script pour construire Tailwind CSS
try {
  console.log('Construction de Tailwind CSS...');
  execSync('npx tailwindcss -i ./src/input.css -o ./src/output.css', { stdio: 'inherit' });
  console.log('✅ Tailwind CSS construit avec succès!');
} catch (error) {
  console.error('❌ Erreur lors de la construction:', error);
}
