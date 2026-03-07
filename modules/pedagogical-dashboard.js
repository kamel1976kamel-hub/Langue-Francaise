// TABLEAU DE BORD PÉDAGOGIQUE
// ================================

window.PedagogicalDashboard = {
    isVisible: false,
    currentView: 'overview',
    
    init() {
        console.log('📊 Initialisation tableau de bord pédagogique');
        this.createDashboard();
        this.setupEventListeners();
    },
    
    createDashboard() {
        // Créer le conteneur principal
        const dashboardContainer = document.createElement('div');
        dashboardContainer.id = 'pedagogical-dashboard';
        dashboardContainer.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
        dashboardContainer.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between items-center">
                        <h2 class="text-2xl font-bold">📊 Tableau de Bord Pédagogique</h2>
                        <button onclick="window.PedagogicalDashboard.hide()" class="text-white hover:bg-white hover:bg-opacity-20 rounded p-2">
                            ✕
                        </button>
                    </div>
                    
                    <!-- Navigation -->
                    <div class="flex border-b">
                        <button onclick="window.PedagogicalDashboard.showView('overview')" class="px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600 hover:bg-blue-50" data-view="overview">
                            📈 Aperçu
                        </button>
                        <button onclick="window.PedagogicalDashboard.showView('profile')" class="px-6 py-3 font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50" data-view="profile">
                            👤 Profil
                        </button>
                        <button onclick="window.PedagogicalDashboard.showView('progress')" class="px-6 py-3 font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50" data-view="progress">
                            📈 Progrès
                        </button>
                        <button onclick="window.PedagogicalDashboard.showView('recommendations')" class="px-6 py-3 font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50" data-view="recommendations">
                            💡 Recommandations
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 200px);">
                        <div id="dashboard-content">
                            <!-- Le contenu sera chargé dynamiquement -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dashboardContainer);
    },
    
    setupEventListeners() {
        // Raccourci clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        // Bouton flottant
        this.createFloatingButton();
    },
    
    createFloatingButton() {
        const button = document.createElement('button');
        button.className = 'fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 z-40';
        button.innerHTML = '📊';
        button.title = 'Tableau de Bord Pédagogique (Ctrl+Shift+D)';
        button.onclick = () => this.toggle();
        
        document.body.appendChild(button);
    },
    
    show() {
        const dashboard = document.getElementById('pedagogical-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            this.isVisible = true;
            this.showView(this.currentView);
        }
    },
    
    hide() {
        const dashboard = document.getElementById('pedagogical-dashboard');
        if (dashboard) {
            dashboard.classList.add('hidden');
            this.isVisible = false;
        }
    },
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },
    
    showView(viewName) {
        this.currentView = viewName;
        
        // Mettre à jour les boutons de navigation
        document.querySelectorAll('[data-view]').forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.className = 'px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600 hover:bg-blue-50';
            } else {
                btn.className = 'px-6 py-3 font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50';
            }
        });
        
        // Charger le contenu de la vue
        const content = document.getElementById('dashboard-content');
        switch (viewName) {
            case 'overview':
                content.innerHTML = this.generateOverviewHTML();
                break;
            case 'profile':
                content.innerHTML = this.generateProfileHTML();
                break;
            case 'progress':
                content.innerHTML = this.generateProgressHTML();
                break;
            case 'recommendations':
                content.innerHTML = this.generateRecommendationsHTML();
                break;
        }
    },
    
    generateOverviewHTML() {
        const profile = window.StudentProfile?.getProfile('anonymous');
        const stats = profile?.statistics || {};
        
        return `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Statistiques principales -->
                    <div class="bg-blue-50 p-6 rounded-lg">
                        <h3 class="text-lg font-semibold text-blue-800 mb-2">📊 Statistiques</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total activités:</span>
                                <span class="font-bold">${stats.totalActivities || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Taux de réussite:</span>
                                <span class="font-bold ${stats.errorRate < 30 ? 'text-green-600' : 'text-red-600'}">
                                    ${Math.round(100 - (stats.errorRate || 0))}%
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Amélioration:</span>
                                <span class="font-bold ${stats.improvementRate > 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${stats.improvementRate > 0 ? '+' : ''}${Math.round(stats.improvementRate || 0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Forces -->
                    <div class="bg-green-50 p-6 rounded-lg">
                        <h3 class="text-lg font-semibold text-green-800 mb-2">💪 Forces</h3>
                        <div class="space-y-2">
                            ${profile?.strengths?.length > 0 ? 
                                profile.strengths.map(strength => 
                                    `<div class="flex items-center space-x-2">
                                        <span class="text-green-600">✅</span>
                                        <span>${strength}</span>
                                    </div>`
                                ).join('') :
                                '<p class="text-gray-500">En cours d\'identification...</p>'
                            }
                        </div>
                    </div>
                    
                    <!-- Faiblesses -->
                    <div class="bg-red-50 p-6 rounded-lg">
                        <h3 class="text-lg font-semibold text-red-800 mb-2">🎯 Axes d'amélioration</h3>
                        <div class="space-y-2">
                            ${profile?.weaknesses?.length > 0 ?
                                profile.weaknesses.slice(0, 3).map(weakness =>
                                    `<div class="space-y-1">
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">${weakness.type}</span>
                                            <span class="text-red-600">${weakness.frequency}x</span>
                                        </div>
                                        <div class="w-full bg-red-200 rounded-full h-2">
                                            <div class="bg-red-600 h-2 rounded-full" style="width: ${100 - weakness.masteryLevel}%"></div>
                                        </div>
                                    </div>`
                                ).join('') :
                                '<p class="text-gray-500">En cours d\'identification...</p>'
                            }
                        </div>
                    </div>
                </div>
                
                <!-- Activité récente -->
                <div class="bg-purple-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-purple-800 mb-2">🕐 Dernière activité</h3>
                    ${profile?.lastActivity ? `
                        <div class="space-y-2">
                            <div><strong>Type:</strong> ${profile.lastActivity.type}</div>
                            <div><strong>Réussite:</strong> 
                                <span class="${profile.lastActivity.success ? 'text-green-600' : 'text-red-600'}">
                                    ${profile.lastActivity.success ? '✅ Réussie' : '❌ À améliorer'}
                                </span>
                            </div>
                            <div><strong>Confiance:</strong> ${Math.round((profile.lastActivity.confidence || 0) * 100)}%</div>
                            <div><strong>Date:</strong> ${new Date(profile.lastActivity.timestamp).toLocaleDateString()}</div>
                        </div>
                    ` : '<p class="text-gray-500">Aucune activité enregistrée</p>'}
                </div>
            </div>
        `;
    },
    
    generateProfileHTML() {
        const profile = window.StudentProfile?.getProfile('anonymous');
        
        return `
            <div class="space-y-6">
                <div class="bg-yellow-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-yellow-800 mb-4">⚙️ Paramètres d'apprentissage</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Niveau de difficulté</label>
                            <select class="w-full p-2 border rounded" onchange="window.PedagogicalDashboard.updateSetting('difficultyLevel', this.value)">
                                <option value="beginner" ${profile?.adaptiveSettings?.difficultyLevel === 'beginner' ? 'selected' : ''}>Débutant</option>
                                <option value="intermediate" ${profile?.adaptiveSettings?.difficultyLevel === 'intermediate' ? 'selected' : ''}>Intermédiaire</option>
                                <option value="advanced" ${profile?.adaptiveSettings?.difficultyLevel === 'advanced' ? 'selected' : ''}>Avancé</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Type de feedback</label>
                            <select class="w-full p-2 border rounded" onchange="window.PedagogicalDashboard.updateSetting('preferredFeedbackType', this.value)">
                                <option value="concise" ${profile?.adaptiveSettings?.preferredFeedbackType === 'concise' ? 'selected' : ''}>Concis</option>
                                <option value="detailed" ${profile?.adaptiveSettings?.preferredFeedbackType === 'detailed' ? 'selected' : ''}>Détaillé</option>
                                <option value="pedagogical" ${profile?.adaptiveSettings?.preferredFeedbackType === 'pedagogical' ? 'selected' : ''}>Pédagogique</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Fréquence des exercices</label>
                            <select class="w-full p-2 border rounded" onchange="window.PedagogicalDashboard.updateSetting('exerciseFrequency', this.value)">
                                <option value="low" ${profile?.adaptiveSettings?.exerciseFrequency === 'low' ? 'selected' : ''}>Faible</option>
                                <option value="normal" ${profile?.adaptiveSettings?.exerciseFrequency === 'normal' ? 'selected' : ''}>Normale</option>
                                <option value="high" ${profile?.adaptiveSettings?.exerciseFrequency === 'high' ? 'selected' : ''}>Élevée</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex space-x-4">
                    <button onclick="window.PedagogicalDashboard.exportProfile()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        📤 Exporter le profil
                    </button>
                    <button onclick="window.PedagogicalDashboard.clearProfile()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        🗑️ Réinitialiser
                    </button>
                </div>
            </div>
        `;
    },
    
    generateProgressHTML() {
        const profile = window.StudentProfile?.getProfile('anonymous');
        const history = profile?.learningHistory || [];
        
        return `
            <div class="space-y-6">
                <div class="bg-indigo-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-indigo-800 mb-4">📈 Historique d'apprentissage</h3>
                    
                    ${history.length > 0 ? `
                        <div class="space-y-3">
                            ${history.slice(-10).reverse().map((activity, index) => `
                                <div class="border-l-4 ${activity.success ? 'border-green-500' : 'border-red-500'} pl-4 py-2">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <div class="font-medium">${activity.type}</div>
                                            <div class="text-sm text-gray-600">${new Date(activity.timestamp).toLocaleDateString()}</div>
                                        </div>
                                        <div class="${activity.success ? 'text-green-600' : 'text-red-600'}">
                                            ${activity.success ? '✅' : '❌'}
                                        </div>
                                    </div>
                                    ${activity.errors && activity.errors.length > 0 ? `
                                        <div class="text-sm text-gray-600 mt-1">
                                            Erreurs: ${activity.errors.slice(0, 2).join(', ')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-gray-500">Aucun historique disponible</p>'}
                </div>
            </div>
        `;
    },
    
    generateRecommendationsHTML() {
        const profile = window.StudentProfile?.getProfile('anonymous');
        const recommendations = window.StudentProfile?.getRecommendations(profile) || [];
        
        return `
            <div class="space-y-6">
                <div class="bg-teal-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-teal-800 mb-4">💡 Recommandations personnalisées</h3>
                    
                    ${recommendations.length > 0 ? `
                        <div class="space-y-4">
                            ${recommendations.map(rec => `
                                <div class="border-l-4 border-${rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue'}-500 pl-4">
                                    <div class="font-medium ${rec.priority === 'high' ? 'text-red-800' : rec.priority === 'medium' ? 'text-yellow-800' : 'text-blue-800'}">
                                        ${rec.title}
                                    </div>
                                    <div class="text-gray-600 mt-1">${rec.description}</div>
                                    ${rec.action ? `
                                        <div class="mt-2 p-3 bg-gray-100 rounded">
                                            <strong>Exercice:</strong> ${rec.action.instruction || rec.action}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-gray-500">En cours d\'analyse...</p>'}
                </div>
            </div>
        `;
    },
    
    updateSetting(setting, value) {
        const profile = window.StudentProfile?.getProfile('anonymous');
        if (profile) {
            profile.adaptiveSettings[setting] = value;
            window.StudentProfile.saveProfile(profile);
            console.log(`⚙️ Paramètre mis à jour: ${setting} = ${value}`);
        }
    },
    
    exportProfile() {
        const profile = window.StudentProfile?.exportProfile('anonymous');
        if (profile) {
            const dataStr = JSON.stringify(profile, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `profil_apprentissage_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('📤 Profil exporté');
        }
    },
    
    clearProfile() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser votre profil d\'apprentissage ?')) {
            window.StudentProfile.clearProfile('anonymous');
            this.showView('overview');
            console.log('🗑️ Profil réinitialisé');
        }
    }
};

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Attendre un peu que les autres modules soient chargés
    setTimeout(() => {
        if (window.StudentProfile) {
            window.PedagogicalDashboard.init();
        }
    }, 1000);
});
