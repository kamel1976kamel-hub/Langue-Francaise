// INTÉGRATION TABLEAU DE BORD DANS "PROGRESSION"
// ================================================

window.ProgressionIntegration = {
    currentView: 'class-overview',
    selectedStudent: null,
    
    // Base de données des 18 étudiants avec identifiants et mots de passe
    studentsDatabase: [
        {
            id: 'student_001',
            nom: "HAMDAOUI",
            prenom: "AMIRA CHAHD",
            username: "amira.hamdaoui",
            password: "Amira2024!",
            email: "amira.hamdaoui@etudiant.fr",
            role: "student",
            displayName: "AMIRA CHAHD HAMDAOUI",
            avatar: "👩‍🎓",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_002',
            nom: "HAMZA",
            prenom: "WISSAL",
            username: "wissal.hamza",
            password: "Wissal2024!",
            email: "wissal.hamza@etudiant.fr",
            role: "student",
            displayName: "WISSAL HAMZA",
            avatar: "👩‍📚",
            level: "beginner",
            actif: true
        },
        {
            id: 'student_003',
            nom: "HERZALLAH",
            prenom: "ISRA",
            username: "isra.herzallah",
            password: "Isra2024!",
            email: "isra.herzallah@etudiant.fr",
            role: "student",
            displayName: "ISRA HERZALLAH",
            avatar: "👩‍🎨",
            level: "advanced",
            actif: true
        },
        {
            id: 'student_004',
            nom: "KABOUCHE",
            prenom: "RYM",
            username: "rym.kabouche",
            password: "Rym2024!",
            email: "rym.kabouche@etudiant.fr",
            role: "student",
            displayName: "RYM KABOUCHE",
            avatar: "👩‍🔬",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_005',
            nom: "LAIB",
            prenom: "LOUBNA HIBATERRAHMANE",
            username: "loubna.laib",
            password: "Loubna2024!",
            email: "loubna.laib@etudiant.fr",
            role: "student",
            displayName: "LOUBNA HIBATERRAHMANE LAIB",
            avatar: "👩‍🌸",
            level: "beginner",
            actif: true
        },
        {
            id: 'student_006',
            nom: "MAGHNI",
            prenom: "HIBAT ERRAHMANE",
            username: "hibat.maghi",
            password: "Hibat2024!",
            email: "hibat.maghi@etudiant.fr",
            role: "student",
            displayName: "HIBAT ERRAHMANE MAGHNI",
            avatar: "👨‍⚽️",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_007',
            nom: "METLOUG",
            prenom: "CHOUROUK",
            username: "chourouk.metlou",
            password: "Chourouk2024!",
            email: "chourouk.metlou@etudiant.fr",
            role: "student",
            displayName: "CHOUROUK METLOUG",
            avatar: "👩‍🎭",
            level: "advanced",
            actif: true
        },
        {
            id: 'student_008',
            nom: "OUAMANE",
            prenom: "ALAIE",
            username: "alaie.ouamane",
            password: "Alaie2024!",
            email: "alaie.ouamane@etudiant.fr",
            role: "student",
            displayName: "ALAIE OUAMANE",
            avatar: "👨‍🎮",
            level: "beginner",
            actif: true
        },
        {
            id: 'student_009',
            nom: "REHOUMA",
            prenom: "CHAHD",
            username: "chahd.rehouma",
            password: "Chahd2024!",
            email: "chahd.rehouma@etudiant.fr",
            role: "student",
            displayName: "CHAHD REHOUMA",
            avatar: "👨‍🏫",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_010',
            nom: "SAADI",
            prenom: "SALSABIL",
            username: "salsabil.saadi",
            password: "Salsabil2024!",
            email: "salsabil.saadi@etudiant.fr",
            role: "student",
            displayName: "SALSABIL SAADI",
            avatar: "👩‍🎪",
            level: "advanced",
            actif: true
        },
        {
            id: 'student_011',
            nom: "SASSOUI",
            prenom: "FATMA ZOHRA AROUA",
            username: "fatma.sassoui",
            password: "Fatma2024!",
            email: "fatma.sassoui@etudiant.fr",
            role: "student",
            displayName: "FATMA ZOHRA AROUA SASSOUI",
            avatar: "👩‍⚕️",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_012',
            nom: "SEID",
            prenom: "DJAMILA",
            username: "djamila.seid",
            password: "Djamila2024!",
            email: "djamila.seid@etudiant.fr",
            role: "student",
            displayName: "DJAMILA SEID",
            avatar: "👩‍🔬",
            level: "beginner",
            actif: true
        },
        {
            id: 'student_013',
            nom: "SERRAOUI",
            prenom: "AYAT ERRAHMANE",
            username: "ayat.serraoui",
            password: "Ayat2024!",
            email: "ayat.serraoui@etudiant.fr",
            role: "student",
            displayName: "AYAT ERRAHMANE SERRAOUI",
            avatar: "👩‍🎵",
            level: "advanced",
            actif: true
        },
        {
            id: 'student_014',
            nom: "TAGHZOUT",
            prenom: "CHAIMA",
            username: "chaima.taghzout",
            password: "Chaima2024!",
            email: "chaima.taghzout@etudiant.fr",
            role: "student",
            displayName: "CHAIMA TAGHZOUT",
            avatar: "👩‍💻",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_015',
            nom: "TOUAMI",
            prenom: "SERINE LEILA",
            username: "serine.touami",
            password: "Serine2024!",
            email: "serine.touami@etudiant.fr",
            role: "student",
            displayName: "SERINE LEILA TOUAMI",
            avatar: "👩‍🎨",
            level: "beginner",
            actif: true
        },
        {
            id: 'student_016',
            nom: "ZEGAR",
            prenom: "SARA",
            username: "sara.zegar",
            password: "Sara2024!",
            email: "sara.zegar@etudiant.fr",
            role: "student",
            displayName: "SARA ZEGAR",
            avatar: "👩‍🚀",
            level: "advanced",
            actif: true
        },
        {
            id: 'student_017',
            nom: "ZERROUAK",
            prenom: "SAFAA NOUR ELYAKINE",
            username: "safaa.zerrouak",
            password: "Safaa2024!",
            email: "safaa.zerrouak@etudiant.fr",
            role: "student",
            displayName: "SAFAA NOUR ELYAKINE ZERROUAK",
            avatar: "👩‍🌈",
            level: "intermediate",
            actif: true
        },
        {
            id: 'student_018',
            nom: "ZIOUCHI",
            prenom: "FATIMA",
            username: "fatima.ziouchi",
            password: "Fatima2024!",
            email: "fatima.ziouchi@etudiant.fr",
            role: "student",
            displayName: "FATIMA ZIOUCHI",
            avatar: "👩‍⚙️",
            level: "advanced",
            actif: true
        }
    ],
    
    init() {
        console.log('📊 Initialisation intégration Progression');
        this.replaceProgressionContent();
        this.setupEventListeners();
    },
    
    replaceProgressionContent() {
        // Remplacer le contenu de l'élément "Progression"
        const progressionElement = document.querySelector('[data-section="progression"]');
        if (!progressionElement) {
            console.error('❌ Élément "Progression" non trouvé');
            return;
        }
        
        console.log('🔄 Remplacement du contenu de "Progression"');
        progressionElement.innerHTML = this.generateProgressionHTML();
    },
    
    generateProgressionHTML() {
        return `
            <div class="container-fluid p-4">
                <!-- En-tête enseignant -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 class="h3 mb-2">📊 Tableau de Bord Pédagogique</h2>
                                    <p class="mb-0">Gestion des 18 étudiants - Biskra</p>
                                </div>
                                <div>
                                    <span class="badge bg-white text-blue-600 px-3 py-2">
                                        <i class="fas fa-users"></i> 18 Étudiants
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Navigation par onglets -->
                <div class="row mb-4">
                    <div class="col-12">
                        <ul class="nav nav-tabs" id="progressionTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">
                                    📊 Vue d'ensemble
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="individual-tab" data-bs-toggle="tab" data-bs-target="#individual" type="button" role="tab">
                                    👤 Progression individuelle
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="comparative-tab" data-bs-toggle="tab" data-bs-target="#comparative" type="button" role="tab">
                                    📈 Comparaison groupe
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="statistics-tab" data-bs-toggle="tab" data-bs-target="#statistics" type="button" role="tab">
                                    📋 Statistiques
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Contenu des onglets -->
                <div class="tab-content" id="progressionTabContent">
                    <!-- Vue d'ensemble -->
                    <div class="tab-pane fade show active" id="overview" role="tabpanel">
                        ${this.generateOverviewHTML()}
                    </div>
                    
                    <!-- Progression individuelle -->
                    <div class="tab-pane fade" id="individual" role="tabpanel">
                        ${this.generateIndividualHTML()}
                    </div>
                    
                    <!-- Comparaison groupe -->
                    <div class="tab-pane fade" id="comparative" role="tabpanel">
                        ${this.generateComparativeHTML()}
                    </div>
                    
                    <!-- Statistiques -->
                    <div class="tab-pane fade" id="statistics" role="tabpanel">
                        ${this.generateStatisticsHTML()}
                    </div>
                </div>
            </div>
        `;
    },
    
    generateOverviewHTML() {
        const activeStudents = this.studentsDatabase.filter(s => s.actif).length;
        const levelDistribution = this.getLevelDistribution();
        const classStats = this.getClassStatistics();
        
        return `
            <div class="row">
                <!-- Cartes statistiques -->
                <div class="col-md-3 mb-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">👥 Étudiants actifs</h5>
                                    <h3 class="mb-0">${activeStudents}/18</h3>
                                </div>
                                <div class="fs-1 opacity-50">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">✅ Taux de réussite</h5>
                                    <h3 class="mb-0">${classStats.averageSuccess}%</h3>
                                </div>
                                <div class="fs-1 opacity-50">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">📈 Amélioration</h5>
                                    <h3 class="mb-0">+${classStats.averageImprovement}%</h3>
                                </div>
                                <div class="fs-1 opacity-50">
                                    <i class="fas fa-arrow-trend-up"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">🎯 Activités totales</h5>
                                    <h3 class="mb-0">${classStats.totalActivities}</h3>
                                </div>
                                <div class="fs-1 opacity-50">
                                    <i class="fas fa-tasks"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Distribution par niveau -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">📊 Répartition par Niveau</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <div class="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 80px; height: 80px;">
                                            <span class="fs-4">${levelDistribution.beginner}</span>
                                        </div>
                                        <h6>Débutants</h6>
                                        <p class="text-muted">${((levelDistribution.beginner / 18) * 100).toFixed(1)}% de la classe</p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <div class="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 80px; height: 80px;">
                                            <span class="fs-4">${levelDistribution.intermediate}</span>
                                        </div>
                                        <h6>Intermédiaires</h6>
                                        <p class="text-muted">${((levelDistribution.intermediate / 18) * 100).toFixed(1)}% de la classe</p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center">
                                        <div class="bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 80px; height: 80px;">
                                            <span class="fs-4">${levelDistribution.advanced}</span>
                                        </div>
                                        <h6>Avancés</h6>
                                        <p class="text-muted">${((levelDistribution.advanced / 18) * 100).toFixed(1)}% de la classe</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Actions rapides -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">🎯 Actions Rapides</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3 mb-3">
                                    <button onclick="window.ProgressionIntegration.generateClassReport()" class="btn btn-primary w-100">
                                        <i class="fas fa-file-pdf"></i> Rapport de classe
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button onclick="window.ProgressionIntegration.planGroupActivity()" class="btn btn-success w-100">
                                        <i class="fas fa-users"></i> Activité de groupe
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button onclick="window.ProgressionIntegration.parentConference()" class="btn btn-warning w-100">
                                        <i class="fas fa-calendar"></i> Conférence parents
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button onclick="window.ProgressionIntegration.exportData()" class="btn btn-info w-100">
                                        <i class="fas fa-download"></i> Exporter données
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    generateIndividualHTML() {
        return `
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">👤 Sélectionner un étudiant</h6>
                        </div>
                        <div class="card-body">
                            <select id="student-selector" class="form-select" onchange="window.ProgressionIntegration.selectStudent(this.value)">
                                <option value="">Choisir un étudiant...</option>
                                ${this.studentsDatabase.map(student => `
                                    <option value="${student.id}">
                                        ${student.avatar} ${student.displayName}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-8 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">🔍 Recherche rapide</h6>
                        </div>
                        <div class="card-body">
                            <div class="input-group">
                                <input type="text" id="student-search" class="form-control" placeholder="Rechercher un étudiant..." onkeyup="window.ProgressionIntegration.searchStudents(this.value)">
                                <button class="btn btn-outline-secondary" type="button" onclick="window.ProgressionIntegration.clearSearch()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Détails de l'étudiant sélectionné -->
            <div id="student-details" class="row">
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Sélectionnez un étudiant pour voir ses détails</p>
                </div>
            </div>
        `;
    },
    
    generateComparativeHTML() {
        return `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">📊 Comparaison de la Classe</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Étudiant</th>
                                            <th>Niveau</th>
                                            <th>Activités</th>
                                            <th>Réussite</th>
                                            <th>Amélioration</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.studentsDatabase.map(student => {
                                            const profile = window.StudentProfile?.getProfile(student.id);
                                            const stats = profile?.statistics || {};
                                            
                                            return `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center">
                                                            <span class="fs-4 me-2">${student.avatar}</span>
                                                            <div>
                                                                <div class="fw-bold">${student.displayName}</div>
                                                                <small class="text-muted">${student.username}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span class="badge ${this.getLevelBadgeClass(student.level)}">
                                                            ${this.getLevelLabel(student.level)}
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        <span class="fw-bold">${stats.totalActivities || 0}</span>
                                                    </td>
                                                    <td class="text-center">
                                                        <span class="fw-bold ${stats.errorRate < 30 ? 'text-success' : 'text-danger'}">
                                                            ${Math.round(100 - (stats.errorRate || 0))}%
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        <span class="fw-bold ${stats.improvementRate > 0 ? 'text-success' : 'text-danger'}">
                                                            ${stats.improvementRate > 0 ? '+' : ''}${Math.round(stats.improvementRate || 0)}%
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        ${this.getStatusBadge(stats)}
                                                    </td>
                                                    <td>
                                                        <div class="btn-group btn-group-sm">
                                                            <button onclick="window.ProgressionIntegration.viewStudent('${student.id}')" class="btn btn-outline-primary" title="Voir détails">
                                                                <i class="fas fa-eye"></i>
                                                            </button>
                                                            <button onclick="window.ProgressionIntegration.messageStudent('${student.id}')" class="btn btn-outline-success" title="Envoyer message">
                                                                <i class="fas fa-envelope"></i>
                                                            </button>
                                                            <button onclick="window.ProgressionIntegration.parentMeeting('${student.id}')" class="btn btn-outline-warning" title="Réunion parents">
                                                                <i class="fas fa-calendar"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    generateStatisticsHTML() {
        const stats = this.getDetailedStatistics();
        
        return `
            <div class="row">
                <!-- Meilleurs étudiants -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">🏆 Meilleurs étudiants</h6>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
                                ${stats.topStudents.slice(0, 5).map((student, index) => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <span class="badge bg-primary me-2">${index + 1}</span>
                                            <span class="fs-4 me-2">${student.avatar}</span>
                                            <div>
                                                <div class="fw-bold">${student.name}</div>
                                                <small class="text-muted">${student.level}</small>
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <div class="fw-bold text-success">${student.successRate}%</div>
                                            <small class="text-muted">réussite</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Plus grandes améliorations -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">📈 Plus grandes améliorations</h6>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
                                ${stats.mostImproved.slice(0, 5).map((student, index) => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <span class="badge bg-success me-2">${index + 1}</span>
                                            <span class="fs-4 me-2">${student.avatar}</span>
                                            <div>
                                                <div class="fw-bold">${student.name}</div>
                                                <small class="text-muted">${student.level}</small>
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <div class="fw-bold text-success">+${student.improvementRate}%</div>
                                            <small class="text-muted">amélioration</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Statistiques globales -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">📊 Statistiques globales</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="text-center">
                                        <h4 class="text-primary">${stats.totalActivities}</h4>
                                        <p class="text-muted">Activités totales</p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-center">
                                        <h4 class="text-success">${stats.averageSuccess}%</h4>
                                        <p class="text-muted">Réussite moyenne</p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-center">
                                        <h4 class="text-warning">${stats.averageImprovement}%</h4>
                                        <p class="text-muted">Amélioration moyenne</p>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-center">
                                        <h4 class="text-info">${stats.engagementRate}%</h4>
                                        <p class="text-muted">Taux d'engagement</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Fonctions utilitaires
    getLevelDistribution() {
        const distribution = {
            beginner: 0,
            intermediate: 0,
            advanced: 0
        };
        
        this.studentsDatabase.forEach(student => {
            if (student.actif) {
                distribution[student.level]++;
            }
        });
        
        return distribution;
    },
    
    getClassStatistics() {
        let totalActivities = 0;
        let totalSuccess = 0;
        let totalImprovement = 0;
        let studentCount = 0;
        
        this.studentsDatabase.forEach(student => {
            if (student.actif) {
                const profile = window.StudentProfile?.getProfile(student.id);
                const stats = profile?.statistics || {};
                
                totalActivities += stats.totalActivities || 0;
                totalSuccess += (100 - (stats.errorRate || 0));
                totalImprovement += (stats.improvementRate || 0);
                studentCount++;
            }
        });
        
        return {
            totalActivities,
            averageSuccess: studentCount > 0 ? Math.round(totalSuccess / studentCount) : 0,
            averageImprovement: studentCount > 0 ? Math.round(totalImprovement / studentCount) : 0
        };
    },
    
    getDetailedStatistics() {
        const studentsWithStats = this.studentsDatabase.map(student => {
            const profile = window.StudentProfile?.getProfile(student.id);
            const stats = profile?.statistics || {};
            
            return {
                id: student.id,
                name: student.displayName,
                avatar: student.avatar,
                level: student.level,
                successRate: Math.round(100 - (stats.errorRate || 0)),
                improvementRate: Math.round(stats.improvementRate || 0),
                totalActivities: stats.totalActivities || 0
            };
        });
        
        return {
            totalActivities: studentsWithStats.reduce((sum, s) => sum + s.totalActivities, 0),
            averageSuccess: Math.round(studentsWithStats.reduce((sum, s) => sum + s.successRate, 0) / studentsWithStats.length),
            averageImprovement: Math.round(studentsWithStats.reduce((sum, s) => sum + s.improvementRate, 0) / studentsWithStats.length),
            engagementRate: Math.round((studentsWithStats.filter(s => s.totalActivities > 0).length / studentsWithStats.length) * 100),
            topStudents: studentsWithStats.sort((a, b) => b.successRate - a.successRate),
            mostImproved: studentsWithStats.sort((a, b) => b.improvementRate - a.improvementRate)
        };
    },
    
    getLevelLabel(level) {
        const labels = {
            beginner: 'Débutant',
            intermediate: 'Intermédiaire',
            advanced: 'Avancé'
        };
        return labels[level] || level;
    },
    
    getLevelBadgeClass(level) {
        const classes = {
            beginner: 'bg-success',
            intermediate: 'bg-warning',
            advanced: 'bg-danger'
        };
        return classes[level] || 'bg-secondary';
    },
    
    getStatusBadge(stats) {
        if (stats.errorRate < 20) {
            return '<span class="badge bg-success">🌟 Excellent</span>';
        } else if (stats.errorRate < 40) {
            return '<span class="badge bg-primary">👍 Bon</span>';
        } else if (stats.errorRate < 60) {
            return '<span class="badge bg-warning">⚠️ En progrès</span>';
        } else {
            return '<span class="badge bg-danger">🎯 À soutenir</span>';
        }
    },
    
    // Fonctions d'interaction
    selectStudent(studentId) {
        this.selectedStudent = studentId;
        this.displayStudentDetails(studentId);
    },
    
    displayStudentDetails(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        if (!student) return;
        
        const profile = window.StudentProfile?.getProfile(studentId);
        const stats = profile?.statistics || {};
        const history = profile?.learningHistory || [];
        
        const detailsHTML = `
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <span class="fs-2 me-3">${student.avatar}</span>
                                <div>
                                    <h5 class="mb-1">${student.displayName}</h5>
                                    <p class="mb-0 opacity-75">${this.getLevelLabel(student.level)} • ${student.username}</p>
                                </div>
                            </div>
                            <div>
                                <span class="badge bg-white text-blue-600">
                                    ID: ${student.id}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <!-- Informations de connexion -->
                            <div class="col-md-4">
                                <h6 class="text-muted mb-3">🔐 Connexion</h6>
                                <div class="mb-3">
                                    <label class="form-label">Identifiant:</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" value="${student.username}" readonly>
                                        <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${student.username}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Mot de passe:</label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" value="${student.password}" readonly id="password-${student.id}">
                                        <button class="btn btn-outline-secondary" onclick="window.ProgressionIntegration.togglePassword('${student.id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${student.password}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email:</label>
                                    <div class="input-group">
                                        <input type="email" class="form-control" value="${student.email}" readonly>
                                        <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${student.email}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Statistiques -->
                            <div class="col-md-4">
                                <h6 class="text-muted mb-3">📊 Statistiques</h6>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Activités:</span>
                                        <span class="fw-bold">${stats.totalActivities || 0}</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Réussite:</span>
                                        <span class="fw-bold ${stats.errorRate < 30 ? 'text-success' : 'text-danger'}">
                                            ${Math.round(100 - (stats.errorRate || 0))}%
                                        </span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Amélioration:</span>
                                        <span class="fw-bold ${stats.improvementRate > 0 ? 'text-success' : 'text-danger'}">
                                            ${stats.improvementRate > 0 ? '+' : ''}${Math.round(stats.improvementRate || 0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Actions -->
                            <div class="col-md-4">
                                <h6 class="text-muted mb-3">🎯 Actions</h6>
                                <div class="d-grid gap-2">
                                    <button onclick="window.ProgressionIntegration.generateStudentReport('${student.id}')" class="btn btn-primary">
                                        <i class="fas fa-file-pdf"></i> Rapport individuel
                                    </button>
                                    <button onclick="window.ProgressionIntegration.messageStudent('${student.id}')" class="btn btn-success">
                                        <i class="fas fa-envelope"></i> Envoyer message
                                    </button>
                                    <button onclick="window.ProgressionIntegration.parentMeeting('${student.id}')" class="btn btn-warning">
                                        <i class="fas fa-calendar"></i> Réunion parents
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Historique récent -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <h6 class="text-muted mb-3">📈 Historique récent</h6>
                                ${history.length > 0 ? `
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Activité</th>
                                                    <th>Résultat</th>
                                                    <th>Confiance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${history.slice(-10).reverse().map(activity => `
                                                    <tr>
                                                        <td>${new Date(activity.timestamp).toLocaleDateString()}</td>
                                                        <td>${activity.type}</td>
                                                        <td>
                                                            <span class="badge ${activity.success ? 'bg-success' : 'bg-danger'}">
                                                                ${activity.success ? '✅' : '❌'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div class="progress" style="height: 20px;">
                                                                <div class="progress-bar" style="width: ${(activity.confidence || 0) * 100}%">
                                                                    ${Math.round((activity.confidence || 0) * 100)}%
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : '<p class="text-muted">Aucun historique disponible</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('student-details').innerHTML = detailsHTML;
    },
    
    searchStudents(query) {
        const filteredStudents = this.studentsDatabase.filter(student => 
            student.displayName.toLowerCase().includes(query.toLowerCase()) ||
            student.username.toLowerCase().includes(query.toLowerCase()) ||
            student.email.toLowerCase().includes(query.toLowerCase())
        );
        
        const selector = document.getElementById('student-selector');
        if (selector) {
            selector.innerHTML = `
                <option value="">Choisir un étudiant...</option>
                ${filteredStudents.map(student => `
                    <option value="${student.id}">
                        ${student.avatar} ${student.displayName}
                    </option>
                `).join('')}
            `;
        }
    },
    
    clearSearch() {
        const selector = document.getElementById('student-selector');
        const search = document.getElementById('student-search');
        
        if (selector) {
            selector.innerHTML = `
                <option value="">Choisir un étudiant...</option>
                ${this.studentsDatabase.map(student => `
                    <option value="${student.id}">
                        ${student.avatar} ${student.displayName}
                    </option>
                `).join('')}
            `;
        }
        
        if (search) {
            search.value = '';
        }
    },
    
    togglePassword(studentId) {
        const passwordInput = document.getElementById(`password-${studentId}`);
        if (passwordInput) {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        }
    },
    
    viewStudent(studentId) {
        // Activer l'onglet individuel et afficher l'étudiant
        const individualTab = document.getElementById('individual-tab');
        if (individualTab) {
            individualTab.click();
        }
        
        setTimeout(() => {
            this.selectStudent(studentId);
            const selector = document.getElementById('student-selector');
            if (selector) {
                selector.value = studentId;
            }
        }, 100);
    },
    
    // Fonctions d'actions (simulées pour démo)
    generateStudentReport(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        alert(`📄 Rapport individuel généré pour ${student.displayName}`);
    },
    
    messageStudent(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        alert(`💬 Message envoyé à ${student.displayName}`);
    },
    
    parentMeeting(studentId) {
        const student = this.studentsDatabase.find(s => s.id === studentId);
        alert(`📅 Réunion parents planifiée pour ${student.displayName}`);
    },
    
    generateClassReport() {
        alert('📊 Rapport de classe généré avec les statistiques de tous les étudiants');
    },
    
    planGroupActivity() {
        alert('🎮 Activité de groupe planifiée pour toute la classe');
    },
    
    parentConference() {
        alert('📅 Conférence parents planifiée avec l\'ensemble des parents');
    },
    
    exportData() {
        const data = {
            students: this.studentsDatabase,
            exportDate: new Date().toISOString(),
            statistics: this.getDetailedStatistics()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `classe_biskra_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    setupEventListeners() {
        // Initialisation automatique au chargement
        console.log('✅ Intégration Progression initialisée');
    }
};

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que les autres modules soient chargés
    setTimeout(() => {
        if (window.StudentProfile) {
            window.ProgressionIntegration.init();
        }
    }, 1000);
});
