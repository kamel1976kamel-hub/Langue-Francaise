/**
 * =================================================================
 * SYSTÈME UNIFIÉ DE GESTION DES PROFILS ÉTUDIANTS
 * Authentification + Profil d'apprentissage adaptatif
 * Version intégrée et optimisée
 * =================================================================
 */

// Configuration
const CONFIG = {
    EMAIL_DOMAINS: {
        teacher: 'enseignant.fr',
        student: 'etudiant.fr'
    }
    // SEC-003 : PASSWORD_FORMAT supprimé — aucun mot de passe côté client
};

// Base de données des utilisateurs avec profils intégrés
const utilisateurs = [
    {
        // === DONNÉES AUTHENTIFICATION ===
        id: 'teacher_001',
        nom: "CHELLOUAI",
        prenom: "KAMEL",
        username: "kamel.chellouai",
        email: "kamel.chellouai@enseignant.fr",
        role: "teacher",
        concepteur: true,
        displayName: "KAMEL CHELLOUAI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        // === PROFIL D'APPRENTISSAGE ===
        profile: {
            errors: {},
            strengths: ['pédagogie', 'grammaire'],
            weaknesses: ['technologie'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'detailed',
                exerciseFrequency: 'high',
                focusAreas: ['pédagogie', 'grammaire']
            }
        }
    },
    {
        id: 'student_001',
        nom: "HAMDAOUI",
        prenom: "AMIRA CHAHD",
        username: "amira.hamdaoui",
        email: "amira.hamdaoui@etudiant.fr",
        role: "student",
        displayName: "AMIRA CHAHD HAMDAOUI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['lecture', 'vocabulaire'],
            weaknesses: ['conjugaison', 'orthographe'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'detailed',
                exerciseFrequency: 'normal',
                focusAreas: ['conjugaison', 'orthographe']
            }
        }
    },
    {
        id: 'student_002',
        nom: "HAMZA",
        prenom: "WISSAL",
        username: "wissal.hamza",
        email: "wissal.hamza@etudiant.fr",
        role: "student",
        displayName: "WISSAL HAMZA",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['expression écrite'],
            weaknesses: ['grammaire', 'syntaxe'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'pedagogical',
                exerciseFrequency: 'normal',
                focusAreas: ['grammaire', 'syntaxe']
            }
        }
    },
    {
        id: 'student_003',
        nom: "HERZALLAH",
        prenom: "ISRA",
        username: "isra.herzallah",
        email: "isra.herzallah@etudiant.fr",
        role: "student",
        displayName: "ISRA HERZALLAH",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['analyse', 'compréhension'],
            weaknesses: ['rédaction', 'structure'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'beginner',
                preferredFeedbackType: 'simplified',
                exerciseFrequency: 'high',
                focusAreas: ['rédaction', 'structure']
            }
        }
    },
    {
        id: 'student_004',
        nom: "KABOUCHE",
        prenom: "RYM",
        username: "rym.kabouche",
        email: "rym.kabouche@etudiant.fr",
        role: "student",
        displayName: "RYM KABOUCHE",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['créativité', 'imagination'],
            weaknesses: ['orthographe', 'grammaire'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'beginner',
                preferredFeedbackType: 'encouraging',
                exerciseFrequency: 'high',
                focusAreas: ['orthographe', 'grammaire']
            }
        }
    },
    {
        id: 'student_005',
        nom: "LAIB",
        prenom: "LOUBNA HIBATERRAHMANE",
        username: "loubna.laib",
        email: "loubna.laib@etudiant.fr",
        role: "student",
        displayName: "LOUBNA HIBATERRAHMANE LAIB",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['organisation', 'planification'],
            weaknesses: ['syntaxe', 'cohérence'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'structured',
                exerciseFrequency: 'normal',
                focusAreas: ['syntaxe', 'cohérence']
            }
        }
    },
    {
        id: 'student_006',
        nom: "MAGHNI",
        prenom: "HIBAT ERRAHMANE",
        username: "hibat.maghi",
        email: "hibat.maghi@etudiant.fr",
        role: "student",
        displayName: "HIBAT ERRAHMANE MAGHNI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['logique', 'analyse'],
            weaknesses: ['expression', 'vocabulaire'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'detailed',
                exerciseFrequency: 'low',
                focusAreas: ['expression', 'vocabulaire']
            }
        }
    },
    {
        id: 'student_007',
        nom: "METLOUG",
        prenom: "CHOUROUK",
        username: "chourouk.metlou",
        email: "chourouk.metlou@etudiant.fr",
        role: "student",
        displayName: "CHOUROUK METLOUG",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['méthodologie', 'rigueur'],
            weaknesses: ['créativité', 'originalité'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'constructive',
                exerciseFrequency: 'normal',
                focusAreas: ['créativité', 'originalité']
            }
        }
    },
    {
        id: 'student_008',
        nom: "OUAMANE",
        prenom: "ALAIE",
        username: "alaie.ouamane",
        email: "alaie.ouamane@etudiant.fr",
        role: "student",
        displayName: "ALAIE OUAMANE",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['concentration', 'persévérance'],
            weaknesses: ['grammaire', 'conjugaison'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'patient',
                exerciseFrequency: 'normal',
                focusAreas: ['grammaire', 'conjugaison']
            }
        }
    },
    {
        id: 'student_009',
        nom: "REHOUMA",
        prenom: "CHAHD",
        username: "chahd.rehouma",
        email: "chahd.rehouma@etudiant.fr",
        role: "student",
        displayName: "CHAHD REHOUMA",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['mémoire', 'récitation'],
            weaknesses: ['compréhension', 'analyse'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'beginner',
                preferredFeedbackType: 'simplified',
                exerciseFrequency: 'high',
                focusAreas: ['compréhension', 'analyse']
            }
        }
    },
    {
        id: 'student_010',
        nom: "SAADI",
        prenom: "SALSABIL",
        username: "salsabil.saadi",
        email: "salsabil.saadi@etudiant.fr",
        role: "student",
        displayName: "SALSABIL SAADI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['synthèse', 'organisation'],
            weaknesses: ['rédaction', 'expression'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'detailed',
                exerciseFrequency: 'low',
                focusAreas: ['rédaction', 'expression']
            }
        }
    },
    {
        id: 'student_011',
        nom: "SASSOUI",
        prenom: "FATMA ZOHRA AROUA",
        username: "fatma.sassoui",
        email: "fatma.sassoui@etudiant.fr",
        role: "student",
        displayName: "FATMA ZOHRA AROUA SASSOUI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['précision', 'soin'],
            weaknesses: ['syntaxe', 'vocabulaire'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'corrective',
                exerciseFrequency: 'normal',
                focusAreas: ['syntaxe', 'vocabulaire']
            }
        }
    },
    {
        id: 'student_012',
        nom: "SEID",
        prenom: "DJAMILA",
        username: "djamila.seid",
        email: "djamila.seid@etudiant.fr",
        role: "student",
        displayName: "DJAMILA SEID",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['clarté', 'logique'],
            weaknesses: ['grammaire', 'orthographe'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'explanatory',
                exerciseFrequency: 'normal',
                focusAreas: ['grammaire', 'orthographe']
            }
        }
    },
    {
        id: 'student_013',
        nom: "SERRAOUI",
        prenom: "AYAT ERRAHMANE",
        username: "ayat.serraoui",
        email: "ayat.serraoui@etudiant.fr",
        role: "student",
        displayName: "AYAT ERRAHMANE SERRAOUI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['curiosité', 'research'],
            weaknesses: ['expression', 'structure'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'exploratory',
                exerciseFrequency: 'high',
                focusAreas: ['expression', 'structure']
            }
        }
    },
    {
        id: 'student_014',
        nom: "TAGHZOUT",
        prenom: "CHAIMA",
        username: "chaima.taghzout",
        email: "chaima.taghzout@etudiant.fr",
        role: "student",
        displayName: "CHAIMA TAGHZOUT",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['créativité', 'originalité'],
            weaknesses: ['grammaire', 'cohérence'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'encouraging',
                exerciseFrequency: 'normal',
                focusAreas: ['grammaire', 'cohérence']
            }
        }
    },
    {
        id: 'student_015',
        nom: "TOUAMI",
        prenom: "SERINE LEILA",
        username: "serine.touami",
        email: "serine.touami@etudiant.fr",
        role: "student",
        displayName: "SERINE LEILA TOUAMI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['empathie', 'communication'],
            weaknesses: ['technique', 'précision'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'collaborative',
                exerciseFrequency: 'high',
                focusAreas: ['technique', 'précision']
            }
        }
    },
    {
        id: 'student_016',
        nom: "ZEGAR",
        prenom: "SARA",
        username: "sara.zegar",
        email: "sara.zegar@etudiant.fr",
        role: "student",
        displayName: "SARA ZEGAR",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['intuition', 'analyse'],
            weaknesses: ['méthodologie', 'organisation'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'guiding',
                exerciseFrequency: 'normal',
                focusAreas: ['méthodologie', 'organisation']
            }
        }
    },
    {
        id: 'student_017',
        nom: "ZERROUAK",
        prenom: "SAFAA NOUR ELYAKINE",
        username: "safaa.zerrouak",
        email: "safaa.zerrouak@etudiant.fr",
        role: "student",
        displayName: "SAFAA NOUR ELYAKINE ZERROUAK",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['leadership', 'initiative'],
            weaknesses: ['perfectionnisme', 'temps'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'balanced',
                exerciseFrequency: 'low',
                focusAreas: ['leadership', 'initiative']
            }
        }
    },
    {
        id: 'student_018',
        nom: "ZIOUCHI",
        prenom: "FATIMA",
        username: "fatima.ziouchi",
        email: "fatima.ziouchi@etudiant.fr",
        role: "student",
        displayName: "FATIMA ZIOUCHI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['résilience', 'adaptabilité'],
            weaknesses: ['confiance', 'expression'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'supportive',
                exerciseFrequency: 'normal',
                focusAreas: ['confiance', 'expression']
            }
        }
    },
    // === NOUVEAUX ÉTUDIANTS (ajoutés sans credentials — SEC-003) ===
    {
        id: 'student_019', nom: "BASLI", prenom: "AICHA", username: "aicha.basli",
        email: "aicha.basli@etudiant.fr", role: "student", displayName: "AICHA BASLI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_020', nom: "ABBASSI", prenom: "DOUA MENETALLAH", username: "douaa.abbassi",
        email: "douaa.abbassi@etudiant.fr", role: "student", displayName: "DOUA MENETALLAH ABBASSI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_021', nom: "AMIRI", prenom: "KAMILIA", username: "kamilia.amiri",
        email: "kamilia.amiri@etudiant.fr", role: "student", displayName: "KAMILIA AMIRI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_022', nom: "GACI", prenom: "AHMED MOUNSEF", username: "ahmed.gaci",
        email: "ahmed.gaci@etudiant.fr", role: "student", displayName: "AHMED MOUNSEF GACI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_023', nom: "ARIECHE", prenom: "SARA", username: "sara.arieche",
        email: "sara.arieche@etudiant.fr", role: "student", displayName: "SARA ARIECHE", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_024', nom: "BEKHOUCHE", prenom: "INESSE", username: "inesse.bekhouche",
        email: "inesse.bekhouche@etudiant.fr", role: "student", displayName: "INESSE BEKHOUCHE", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_025', nom: "ACHOURI", prenom: "HANINE", username: "hanine.achouri",
        email: "hanine.achouri@etudiant.fr", role: "student", displayName: "HANINE ACHOURI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_026', nom: "AMRANE", prenom: "MOHAMED ANES", username: "mohamed.amrane",
        email: "mohamed.amrane@etudiant.fr", role: "student", displayName: "MOHAMED ANES AMRANE", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_027', nom: "ACHOURI", prenom: "AHMED YACINE", username: "ahmed.achouri",
        email: "ahmed.achouri@etudiant.fr", role: "student", displayName: "AHMED YACINE ACHOURI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_028', nom: "BENBARKAT", prenom: "INAS FATMA ZAHRA", username: "inas.benbarkat",
        email: "inas.benbarkat@etudiant.fr", role: "student", displayName: "INAS FATMA ZAHRA BENBARKAT", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_029', nom: "GACEM", prenom: "MAISSOUNE", username: "maissoune.gacem",
        email: "maissoune.gacem@etudiant.fr", role: "student", displayName: "MAISSOUNE GACEM", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_030', nom: "DAAS", prenom: "HADIL", username: "hadil.daas",
        email: "hadil.daas@etudiant.fr", role: "student", displayName: "HADIL DAAS", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_031', nom: "HACHANI", prenom: "MANAR", username: "manar.hachani",
        email: "manar.hachani@etudiant.fr", role: "student", displayName: "MANAR HACHANI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_032', nom: "FAKROUN", prenom: "CHEHD", username: "chehd.fakroun",
        email: "chehd.fakroun@etudiant.fr", role: "student", displayName: "CHEHD FAKROUN", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_033', nom: "BAN AMOR", prenom: "NAHLA", username: "nahla.banamor",
        email: "nahla.banamor@etudiant.fr", role: "student", displayName: "NAHLA BAN AMOR", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_034', nom: "BEN SOLTANE", prenom: "MALAK", username: "malak.bensoltane",
        email: "malak.bensoltane@etudiant.fr", role: "student", displayName: "MALAK BEN SOLTANE", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_035', nom: "CHAOUCH", prenom: "BOCHRA", username: "bochra.chaouch",
        email: "bochra.chaouch@etudiant.fr", role: "student", displayName: "BOCHRA CHAOUCH", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_036', nom: "ABDELKRIM", prenom: "DJIHANE", username: "djihane.abdelkrim",
        email: "djihane.abdelkrim@etudiant.fr", role: "student", displayName: "DJIHANE ABDELKRIM", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    {
        id: 'student_037', nom: "BEN SAADI", prenom: "HANA", username: "hana.bensaadi",
        email: "hana.bensaadi@etudiant.fr", role: "student", displayName: "HANA BEN SAADI", actif: true,
        dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'intermediate', preferredFeedbackType: 'detailed', exerciseFrequency: 'normal', focusAreas: [] } }
    },
    // === ENSEIGNANTS (non concepteurs) ===
    {
        id: 'teacher_002', nom: "MOUMNI", prenom: "YAAKOUB", username: "yaakoub.moumni",
        email: "yaakoub.moumni@enseignant.fr", role: "teacher", concepteur: false,
        displayName: "YAAKOUB MOUMNI", actif: true, dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'advanced', preferredFeedbackType: 'detailed', exerciseFrequency: 'high', focusAreas: [] } }
    },
    {
        id: 'teacher_003', nom: "MELLAOUI", prenom: "SALAH EDDINE", username: "salaheddine.mellaoui",
        email: "salaheddine.mellaoui@enseignant.fr", role: "teacher", concepteur: false,
        displayName: "SALAH EDDINE MELLAOUI", actif: true, dateCreation: new Date('2024-01-01'),
        profile: { errors: {}, strengths: [], weaknesses: [], learningHistory: [], lastActivity: null,
            statistics: { totalActivities: 0, correctAnswers: 0, errorRate: 0, improvementRate: 0, averageConfidence: 0 },
            adaptiveSettings: { difficultyLevel: 'advanced', preferredFeedbackType: 'detailed', exerciseFrequency: 'high', focusAreas: [] } }
    }
];

// =================================================================
// SYSTÈME UNIFIÉ DE GESTION DES PROFILS
// =================================================================

class StudentProfileManager {
    constructor() {
        this.utilisateurs = utilisateurs;
        this.profiles = new Map();
        this.initialiser();
    }
    
    /**
     * Initialise le système
     */
    initialiser() {
        console.log('🚀 Système unifié de profils étudiants initialisé');
        console.log(`📊 ${this.getStatistiques().total} utilisateurs chargés`);
        
        // Initialiser les profils dans la Map
        this.utilisateurs.forEach(utilisateur => {
            if (!this.profiles.has(utilisateur.id)) {
                this.profiles.set(utilisateur.id, {
                    ...utilisateur.profile,
                    id: utilisateur.id,
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
            }
        });
    }
    
    /**
     * Statistiques du système
     */
    getStatistiques() {
        const stats = {
            total: this.utilisateurs.length,
            enseignants: this.utilisateurs.filter(u => u.role === 'teacher').length,
            etudiants: this.utilisateurs.filter(u => u.role === 'student').length,
            actifs: this.utilisateurs.filter(u => u.actif).length
        };
        return stats;
    }
    
    // ======== FONCTIONS AUTHENTIFICATION ========
    
    /**
     * SEC-003 : Authentification côté client DÉSACTIVÉE.
     * Aucun mot de passe n'est stocké ni comparé côté navigateur.
     * Retourne toujours un échec avec message informatif.
     */
    verifierConnexion(username, password) {
        console.warn('⚠️ Authentification côté client désactivée (SEC-003). Aucun mot de passe côté navigateur.');
        return {
            success: false,
            message: "L'authentification côté client a été désactivée pour sécurité. Utilisez un compte sans mot de passe.",
            utilisateur: null
        };
    }
    
    /**
     * Recherche un utilisateur
     */
    rechercherUtilisateur(critere) {
        return this.utilisateurs.find(u => 
            u.username.toLowerCase() === critere.toLowerCase() ||
            u.email.toLowerCase() === critere.toLowerCase() ||
            u.id.toLowerCase() === critere.toLowerCase()
        ) || null;
    }
    
    // ======== FONCTIONS PROFIL D'APPRENTISSAGE ========
    
    /**
     * Récupère le profil d'un étudiant
     */
    getProfile(studentId = 'anonymous') {
        if (!this.profiles.has(studentId)) {
            // Créer un profil par défaut
            this.profiles.set(studentId, {
                id: studentId,
                errors: {},
                strengths: [],
                weaknesses: [],
                learningHistory: [],
                lastActivity: null,
                statistics: {
                    totalActivities: 0,
                    correctAnswers: 0,
                    errorRate: 0,
                    improvementRate: 0,
                    averageConfidence: 0
                },
                adaptiveSettings: {
                    difficultyLevel: 'intermediate',
                    preferredFeedbackType: 'detailed',
                    exerciseFrequency: 'normal',
                    focusAreas: []
                },
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
        
        return this.profiles.get(studentId);
    }
    
    /**
     * Enregistre une erreur dans le profil
     */
    recordError(studentId, error) {
        const profile = this.getProfile(studentId);
        
        if (!profile.errors[error.type]) {
            profile.errors[error.type] = [];
        }
        
        profile.errors[error.type].push({
            ...error,
            timestamp: new Date().toISOString()
        });
        
        // Mettre à jour les statistiques
        profile.statistics.totalActivities = (profile.statistics.totalActivities || 0) + 1;
        profile.statistics.errorRate = this.calculateErrorRate(profile);
        
        profile.lastUpdated = new Date().toISOString();
        
        console.log(`📝 Erreur enregistrée pour ${studentId}: ${error.type}`);
    }
    
    /**
     * Enregistre une activité réussie
     */
    recordSuccess(studentId, activity) {
        const profile = this.getProfile(studentId);
        
        profile.learningHistory.push({
            type: 'success',
            activity: activity,
            timestamp: new Date().toISOString()
        });
        
        profile.statistics.totalActivities = (profile.statistics.totalActivities || 0) + 1;
        profile.statistics.correctAnswers = (profile.statistics.correctAnswers || 0) + 1;
        profile.statistics.errorRate = this.calculateErrorRate(profile);
        profile.statistics.improvementRate = this.calculateImprovementRate(profile);
        
        profile.lastActivity = new Date().toISOString();
        profile.lastUpdated = new Date().toISOString();
        
        console.log(`✅ Succès enregistré pour ${studentId}`);
    }
    
    /**
     * Calcule le taux d'erreur
     */
    calculateErrorRate(profile) {
        if (profile.statistics.totalActivities === 0) return 0;
        
        const totalErrors = Object.values(profile.errors).reduce((sum, errors) => sum + errors.length, 0);
        return (totalErrors / profile.statistics.totalActivities) * 100;
    }
    
    /**
     * Calcule le taux d'amélioration
     */
    calculateImprovementRate(profile) {
        const recentHistory = profile.learningHistory.slice(-10);
        if (recentHistory.length < 5) return 0;
        
        const recentSuccesses = recentHistory.filter(h => h.type === 'success').length;
        return (recentSuccesses / recentHistory.length) * 100;
    }
    
    /**
     * Met à jour les préférences adaptatives
     */
    updateAdaptiveSettings(studentId, settings) {
        const profile = this.getProfile(studentId);
        profile.adaptiveSettings = { ...profile.adaptiveSettings, ...settings };
        profile.lastUpdated = new Date().toISOString();
        
        console.log(`⚙️ Paramètres adaptatifs mis à jour pour ${studentId}`);
    }
    
    /**
     * Génère un rapport d'apprentissage
     */
    generateLearningReport(studentId) {
        const profile = this.getProfile(studentId);
        const utilisateur = this.utilisateurs.find(u => u.id === studentId);
        
        return {
            student: utilisateur ? {
                id: utilisateur.id,
                displayName: utilisateur.displayName,
                role: utilisateur.role
            } : { id: studentId, displayName: 'Anonymous', role: 'student' },
            
            statistics: profile.statistics,
            strengths: profile.strengths,
            weaknesses: profile.weaknesses,
            recommendations: this.generateRecommendations(profile),
            lastActivity: profile.lastActivity,
            generatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Génère des recommandations personnalisées
     */
    generateRecommendations(profile) {
        const recommendations = [];
        
        // Basé sur les faiblesses
        if (profile.weaknesses.includes('conjugaison')) {
            recommendations.push("Pratiquer les exercices de conjugaison au présent");
        }
        
        if (profile.weaknesses.includes('orthographe')) {
            recommendations.push("Revoir les règles d'orthographe grammaticale");
        }
        
        // Basé sur le taux d'erreur
        if (profile.statistics.errorRate > 30) {
            recommendations.push("Revenir aux exercices de base pour consolider les fondations");
        }
        
        // Basé sur le taux d'amélioration
        if (profile.statistics.improvementRate > 80) {
            recommendations.push("Excellent progrès ! Passer au niveau supérieur");
        }
        
        return recommendations;
    }
    
    // ======== UTILITAIRES ========
    
    /**
     * Exporte les données au format CSV (SEC-003 : sans mot de passe)
     */
    genererCSV() {
        const headers = ['ID', 'Nom', 'Prénom', 'Email', 'Username', 'Role', 'Concepteur', 'Actif', 'TotalActivities', 'ErrorRate', 'ImprovementRate'];
        let csv = headers.join(',') + '\n';
        
        this.utilisateurs.forEach(u => {
            const profile = this.profiles.get(u.id);
            const stats = profile?.statistics || {};
            
            csv += [
                u.id,
                u.nom,
                u.prenom,
                u.email,
                u.username,
                u.role,
                u.concepteur || false,
                u.actif,
                stats.totalActivities || 0,
                (stats.errorRate || 0).toFixed(2),
                (stats.improvementRate || 0).toFixed(2)
            ].join(',') + '\n';
        });
        
        return csv;
    }
    
    /**
     * Exporte les profils au format JSON
     */
    exportProfiles() {
        return JSON.stringify({
            metadata: {
                dateGeneration: new Date().toISOString(),
                totalUtilisateurs: this.utilisateurs.length,
                version: '3.0-unified'
            },
            utilisateurs: this.utilisateurs.map(u => ({
                id: u.id,
                displayName: u.displayName,
                username: u.username,
                role: u.role,
                profile: this.profiles.get(u.id)
            }))
        }, null, 2);
    }
}

// =================================================================
// INSTANCE PRINCIPALE
// =================================================================

const studentProfileManager = new StudentProfileManager();

// Export pour compatibilité
window.StudentProfileManager = studentProfileManager;
window.StudentProfile = {
    getProfile: studentProfileManager.getProfile.bind(studentProfileManager),
    recordError: studentProfileManager.recordError.bind(studentProfileManager),
    recordSuccess: studentProfileManager.recordSuccess.bind(studentProfileManager),
    updateAdaptiveSettings: studentProfileManager.updateAdaptiveSettings.bind(studentProfileManager),
    generateLearningReport: studentProfileManager.generateLearningReport.bind(studentProfileManager)
};

// Compatibilité avec l'ancien système de comptes
window.gestionUtilisateurs = studentProfileManager;
window.GestionUtilisateurs = StudentProfileManager;
window.etudiants = studentProfileManager.utilisateurs;
window.verifierConnexion = studentProfileManager.verifierConnexion.bind(studentProfileManager);
window.rechercherUtilisateur = studentProfileManager.rechercherUtilisateur.bind(studentProfileManager);

console.log('✅ Système unifié de profils étudiants chargé');
console.log(`📊 ${studentProfileManager.getStatistiques().total} profils intégrés`);
