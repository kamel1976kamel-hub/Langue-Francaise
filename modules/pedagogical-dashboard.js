// TABLEAU DE BORD PÉDAGOGIQUE
// ================================

window.PedagogicalDashboard = {
    isVisible: false,
    currentView: 'overview',
    currentStudent: 'anonymous',
    
    // Base de données des étudiants (simulée pour démo)
    studentsDatabase: [
        { id: 'student_01', name: 'Alice Martin', level: 'intermediate', avatar: '👩‍♀️' },
        { id: 'student_02', name: 'Bob Bernard', level: 'beginner', avatar: '👨' },
        { id: 'student_03', name: 'Claire Dubois', level: 'advanced', avatar: '👩‍🦰' },
        { id: 'student_04', name: 'David Leroy', level: 'intermediate', avatar: '👨‍🎓' },
        { id: 'student_05', name: 'Emma Petit', level: 'beginner', avatar: '👩‍🎨' },
        { id: 'student_06', name: 'Lucas Robert', level: 'advanced', avatar: '👨‍💻' },
        { id: 'student_07', name: 'Sophie Moreau', level: 'intermediate', avatar: '👩‍⚕️' },
        { id: 'student_08', name: 'Thomas Blanc', level: 'beginner', avatar: '👨‍⚽️' },
        { id: 'student_09', name: 'Léa Girard', level: 'advanced', avatar: '👩‍🔬' },
        { id: 'student_10', name: 'Hugo Lambert', level: 'intermediate', avatar: '👨‍🎵' },
        { id: 'student_11', name: 'Chloé Roux', level: 'beginner', avatar: '👩‍📚' },
        { id: 'student_12', name: 'Maxime Roy', level: 'advanced', avatar: '👨‍🏫️' },
        { id: 'student_13', name: 'Julie Fournier', level: 'intermediate', avatar: '👩‍🌸' },
        { id: 'student_14', name: 'Nicolas Petit', level: 'beginner', avatar: '👨‍🎮' },
        { id: 'student_15', name: 'Camille Martin', level: 'advanced', avatar: '👩‍🎭' },
        { id: 'student_16', name: 'Antoine Gauthier', level: 'intermediate', avatar: '👨‍⚙️' },
        { id: 'student_17', name: 'Léa Bernard', level: 'beginner', avatar: '👩‍🎪' },
        { id: 'student_18', name: 'Paul Mercier', level: 'advanced', avatar: '👨‍🚀' }
    ],
    
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
    
    // Fonctions de gestion des étudiants
    selectStudent(studentId) {
        this.currentStudent = studentId;
        console.log(`👤 Étudiant sélectionné: ${studentId}`);
        this.showView('progress');
    },
    
    changeProgressView(viewType) {
        const content = document.getElementById('progress-content');
        
        switch (viewType) {
            case 'individual':
                if (this.currentStudent === 'anonymous') {
                    content.innerHTML = this.generateIndividualProgressHTML();
                } else {
                    content.innerHTML = this.generateStudentProgressHTML(this.currentStudent);
                }
                break;
            case 'comparative':
                content.innerHTML = this.generateComparativeHTML();
                break;
            case 'statistics':
                content.innerHTML = this.generateClassStatisticsHTML();
                break;
        }
    },
    
    generateStudentProgressHTML(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        const profile = window.StudentProfile?.getProfile(studentId);
        
        if (!student) {
            return '<p class="text-gray-500">Étudiant non trouvé</p>';
        }
        
        const history = profile?.learningHistory || [];
        const stats = profile?.statistics || {};
        
        return `
            <div class="space-y-6">
                <!-- En-tête étudiant -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
                    <div class="flex items-center space-x-4">
                        <span class="text-3xl">${student.avatar}</span>
                        <div>
                            <h3 class="text-xl font-bold">${student.name}</h3>
                            <p class="text-blue-100">Niveau: ${this.getLevelLabel(student.level)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Statistiques individuelles -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-blue-800 mb-2">📊 Performance</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span>Activités:</span>
                                <span class="font-bold">${stats.totalActivities || 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Réussite:</span>
                                <span class="font-bold ${stats.errorRate < 30 ? 'text-green-600' : 'text-red-600'}">
                                    ${Math.round(100 - (stats.errorRate || 0))}%
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span>Amélioration:</span>
                                <span class="font-bold ${stats.improvementRate > 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${stats.improvementRate > 0 ? '+' : ''}${Math.round(stats.improvementRate || 0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-green-800 mb-2">💪 Forces</h4>
                        <div class="space-y-1">
                            ${profile?.strengths?.length > 0 ? 
                                profile.strengths.map(strength => 
                                    `<div class="flex items-center space-x-2">
                                        <span class="text-green-600">✅</span>
                                        <span class="text-sm">${strength}</span>
                                    </div>`
                                ).join('') :
                                '<p class="text-gray-500 text-sm">En cours d\'identification...</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="bg-red-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-red-800 mb-2">🎯 Axes d'amélioration</h4>
                        <div class="space-y-2">
                            ${profile?.weaknesses?.length > 0 ?
                                profile.weaknesses.slice(0, 3).map(weakness =>
                                    `<div class="space-y-1">
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm font-medium">${weakness.type}</span>
                                            <span class="text-red-600 text-sm">${weakness.frequency}x</span>
                                        </div>
                                        <div class="w-full bg-red-200 rounded-full h-2">
                                            <div class="bg-red-600 h-2 rounded-full" style="width: ${100 - weakness.masteryLevel}%"></div>
                                        </div>
                                    </div>`
                                ).join('') :
                                '<p class="text-gray-500 text-sm">En cours d\'identification...</p>'
                            }
                        </div>
                    </div>
                </div>
                
                <!-- Historique détaillé -->
                <div class="bg-indigo-50 p-6 rounded-lg">
                    <h4 class="font-semibold text-indigo-800 mb-4">📈 Historique d'Apprentissage</h4>
                    
                    ${history.length > 0 ? `
                        <div class="space-y-3">
                            ${history.slice(-15).reverse().map((activity, index) => `
                                <div class="border-l-4 ${activity.success ? 'border-green-500' : 'border-red-500'} pl-4 py-3 bg-white rounded">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <div class="font-medium">${activity.type}</div>
                                            <div class="text-sm text-gray-600">${new Date(activity.timestamp).toLocaleDateString()} ${new Date(activity.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                        <div class="${activity.success ? 'text-green-600' : 'text-red-600'} text-lg">
                                            ${activity.success ? '✅' : '❌'}
                                        </div>
                                    </div>
                                    ${activity.confidence ? `
                                        <div class="flex items-center space-x-2 text-sm">
                                            <span class="text-gray-600">Confiance:</span>
                                            <div class="w-20 bg-gray-200 rounded-full h-2">
                                                <div class="bg-indigo-600 h-2 rounded-full" style="width: ${activity.confidence * 100}%"></div>
                                            </div>
                                            <span class="text-indigo-600 font-medium">${Math.round(activity.confidence * 100)}%</span>
                                        </div>
                                    ` : ''}
                                    ${activity.errors && activity.errors.length > 0 ? `
                                        <div class="text-sm text-red-600 mt-2">
                                            Erreurs: ${activity.errors.slice(0, 3).join(', ')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-gray-500">Aucun historique disponible</p>'}
                </div>
                
                <!-- Actions rapides -->
                <div class="flex space-x-4 mt-6">
                    <button onclick="window.PedagogicalDashboard.generateStudentReport('${studentId}')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        📄 Générer rapport
                    </button>
                    <button onclick="window.PedagogicalDashboard.messageStudent('${studentId}')" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        💬 Envoyer message
                    </button>
                    <button onclick="window.PedagogicalDashboard.parentMeeting('${studentId}')" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                        📅 Planifier réunion
                    </button>
                </div>
            </div>
        `;
    },
    
    generateComparativeHTML() {
        return `
            <div class="space-y-6">
                <div class="bg-teal-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-teal-800 mb-4">📊 Comparaison de la Classe</h3>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white rounded-lg overflow-hidden">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activités</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réussite</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amélioration</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${this.studentsDatabase.map(student => {
                                    const profile = window.StudentProfile?.getProfile(student.id);
                                    const stats = profile?.statistics || {};
                                    
                                    return `
                                        <tr class="hover:bg-gray-50">
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="flex items-center space-x-3">
                                                    <span class="text-lg">${student.avatar}</span>
                                                    <span class="font-medium">${student.name}</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-2 py-1 text-xs rounded-full ${this.getLevelColor(student.level)}">
                                                    ${this.getLevelLabel(student.level)}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                                <span class="font-bold">${stats.totalActivities || 0}</span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                                <span class="font-bold ${stats.errorRate < 30 ? 'text-green-600' : 'text-red-600'}">
                                                    ${Math.round(100 - (stats.errorRate || 0))}%
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                                <span class="font-bold ${stats.improvementRate > 0 ? 'text-green-600' : 'text-red-600'}">
                                                    ${stats.improvementRate > 0 ? '+' : ''}${Math.round(stats.improvementRate || 0)}%
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                                ${this.getStatusBadge(stats)}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Statistiques de classe -->
                    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-white p-4 rounded-lg border">
                            <h4 class="font-semibold text-gray-800 mb-2">📈 Moyenne de classe</h4>
                            <div class="text-2xl font-bold text-blue-600">${this.getClassAverage('totalActivities')}</div>
                            <p class="text-sm text-gray-600">activités par étudiant</p>
                        </div>
                        
                        <div class="bg-white p-4 rounded-lg border">
                            <h4 class="font-semibold text-gray-800 mb-2">✅ Taux de réussite moyen</h4>
                            <div class="text-2xl font-bold text-green-600">${this.getClassAverage('successRate')}%</div>
                            <p class="text-sm text-gray-600">moyenne de la classe</p>
                        </div>
                        
                        <div class="bg-white p-4 rounded-lg border">
                            <h4 class="font-semibold text-gray-800 mb-2">📊 Amélioration moyenne</h4>
                            <div class="text-2xl font-bold text-purple-600">+${this.getClassAverage('improvementRate')}%</div>
                            <p class="text-sm text-gray-600">progrès moyen</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    generateClassStatisticsHTML() {
        return `
            <div class="space-y-6">
                <div class="bg-purple-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-purple-800 mb-4">📋 Statistiques Détaillées de la Classe</h3>
                    
                    <!-- Distribution par niveau -->
                    <div class="mb-6">
                        <h4 class="font-semibold text-purple-700 mb-3">📊 Répartition par Niveau</h4>
                        <div class="grid grid-cols-3 gap-4">
                            ${['beginner', 'intermediate', 'advanced'].map(level => {
                                const count = this.studentsDatabase.filter(s => s.level === level).length;
                                const percentage = (count / this.studentsDatabase.length) * 100;
                                
                                return `
                                    <div class="bg-white p-4 rounded-lg border">
                                        <h5 class="font-medium ${this.getLevelColor(level)}">${this.getLevelLabel(level)}</h5>
                                        <div class="text-2xl font-bold">${count}</div>
                                        <div class="text-sm text-gray-600">${percentage.toFixed(1)}% de la classe</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Performance globale -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white p-4 rounded-lg border">
                            <h4 class="font-semibold text-gray-800 mb-3">🏆 Meilleur étudiant</h4>
                            ${this.getTopStudent('successRate')}
                        </div>
                        
                        <div class="bg-white p-4 rounded-lg border">
                            <h4 class="font-semibold text-gray-800 mb-3">📈 Plus grande amélioration</h4>
                            ${this.getTopStudent('improvementRate')}
                        </div>
                    </div>
                    
                    <!-- Actions de groupe -->
                    <div class="bg-white p-4 rounded-lg border">
                        <h4 class="font-semibold text-gray-800 mb-3">🎯 Actions pour le groupe</h4>
                        <div class="space-y-2">
                            <button onclick="window.PedagogicalDashboard.generateClassReport()" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                📄 Générer rapport de classe
                            </button>
                            <button onclick="window.PedagogicalDashboard.planGroupActivity()" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                🎮 Planifier activité de groupe
                            </button>
                            <button onclick="window.PedagogicalDashboard.parentConference()" class="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                                📅 Planifier conférence parents
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Fonctions utilitaires
    getLevelLabel(level) {
        const labels = {
            beginner: 'Débutant',
            intermediate: 'Intermédiaire',
            advanced: 'Avancé'
        };
        return labels[level] || level;
    },
    
    getLevelColor(level) {
        const colors = {
            beginner: 'bg-green-100 text-green-800',
            intermediate: 'bg-yellow-100 text-yellow-800',
            advanced: 'bg-red-100 text-red-800'
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    },
    
    getStatusBadge(stats) {
        if (stats.errorRate < 20) {
            return '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">🌟 Excellent</span>';
        } else if (stats.errorRate < 40) {
            return '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">👍 Bon</span>';
        } else if (stats.errorRate < 60) {
            return '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⚠️ En progrès</span>';
        } else {
            return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">🎯 À soutenir</span>';
        }
    },
    
    getClassAverage(field) {
        const total = this.studentsDatabase.reduce((sum, student) => {
            const profile = window.StudentProfile?.getProfile(student.id);
            const stats = profile?.statistics || {};
            return sum + (stats[field] || 0);
        }, 0);
        
        return (total / this.studentsDatabase.length).toFixed(1);
    },
    
    getTopStudent(field) {
        let topStudent = null;
        let topValue = -1;
        
        this.studentsDatabase.forEach(student => {
            const profile = window.StudentProfile?.getProfile(student.id);
            const stats = profile?.statistics || {};
            const value = stats[field] || 0;
            
            if (value > topValue) {
                topValue = value;
                topStudent = student;
            }
        });
        
        if (!topStudent) return '<p class="text-gray-500">Données non disponibles</p>';
        
        return `
            <div class="flex items-center space-x-3">
                <span class="text-2xl">${topStudent.avatar}</span>
                <div>
                    <div class="font-medium">${topStudent.name}</div>
                    <div class="text-sm text-gray-600">${this.getLevelLabel(topStudent.level)}</div>
                    <div class="text-lg font-bold text-blue-600">${topValue}${field === 'successRate' ? '%' : field === 'improvementRate' ? '%' : ''}</div>
                </div>
            </div>
        `;
    },
    
    // Fonctions d'actions
    generateStudentReport(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        console.log(`📄 Génération rapport pour ${student.name}`);
        alert(`Rapport individuel généré pour ${student.name}`);
    },
    
    messageStudent(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        console.log(`💬 Envoi message à ${student.name}`);
        alert(`Message envoyé à ${student.name}`);
    },
    
    parentMeeting(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        console.log(`📅 Planification réunion parents pour ${student.name}`);
        alert(`Réunion parents planifiée pour ${student.name}`);
    },
    
    generateClassReport() {
        console.log('📊 Génération rapport de classe');
        alert('Rapport de classe généré avec les statistiques de tous les étudiants');
    },
    
    planGroupActivity() {
        console.log('🎮 Planification activité de groupe');
        alert('Activité de groupe planifiée pour toute la classe');
    },
    
    parentConference() {
        console.log('📅 Planification conférence parents');
        alert('Conférence parents planifiée avec l\'ensemble des parents');
    }
    
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
                <!-- Sélecteur d'étudiants -->
                <div class="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold text-blue-800 mb-4">👥 Gestion de Classe</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Sélectionner un étudiant:</label>
                            <select id="student-selector" class="w-full p-2 border rounded" onchange="window.PedagogicalDashboard.selectStudent(this.value)">
                                <option value="overview">📊 Vue d'ensemble</option>
                                <option value="anonymous">👤 Utilisateur actuel</option>
                                <option value="class-group">👥 Groupe classe</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Vue:</label>
                            <select id="progress-view" class="w-full p-2 border rounded" onchange="window.PedagogicalDashboard.changeProgressView(this.value)">
                                <option value="individual">📈 Progression individuelle</option>
                                <option value="comparative">📊 Comparaison groupe</option>
                                <option value="statistics">📋 Statistiques de classe</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Conteneur pour les vues -->
                    <div id="progress-content">
                        <!-- Le contenu sera chargé dynamiquement -->
                    </div>
                </div>
                
                <!-- Historique de l'utilisateur actuel -->
                <div class="bg-indigo-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-indigo-800 mb-4">📈 Votre Historique d'Apprentissage</h3>
                    
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
