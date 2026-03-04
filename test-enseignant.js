import './comptes-etudiants.js';

console.log('🧪 Test du nouvel enseignant:');
console.log('Nom complet: KAMEL CHELLOUAI');
console.log('Username: kamel.chellouai');
console.log('Password: Kamel@2024!');

// Test de recherche
const enseignant = etudiants.find(e => e.username === 'kamel.chellouai');
if (enseignant) {
    console.log('✅ Enseignant trouvé:', enseignant.displayName);
    console.log('📧 Email:', enseignant.email);
    console.log('🔑 Mot de passe:', enseignant.password);
    console.log('👤 Role:', enseignant.role || 'student');
} else {
    console.log('❌ Enseignant non trouvé');
}

console.log('\n📊 Total comptes:', etudiants.length);
console.log('👤 Premier compte (enseignant):', etudiants[0].displayName);
