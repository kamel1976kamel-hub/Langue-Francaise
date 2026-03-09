-- ============================================
-- BASE DE DONNÉES DES RÈGLES NLP FRANÇAISES
-- ============================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS nlp_rules CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nlp_rules;

-- ============================================
-- TABLE DES RÈGLES LINGUISTIQUES
-- ============================================

CREATE TABLE IF NOT EXISTS linguistic_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category ENUM('style', 'vocabulaire', 'conjugaison', 'orthographe') NOT NULL,
    pattern_type ENUM('regex', 'function', 'string') NOT NULL DEFAULT 'regex',
    pattern TEXT NOT NULL,
    correction TEXT NOT NULL,
    explanation TEXT,
    example TEXT,
    priority INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_active (is_active)
);

-- ============================================
-- TABLE DES MÉTADONNÉES DE RÈGLES
-- ============================================

CREATE TABLE IF NOT EXISTS rule_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id VARCHAR(100) NOT NULL,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT,
    FOREIGN KEY (rule_id) REFERENCES linguistic_rules(rule_id) ON DELETE CASCADE,
    
    INDEX idx_rule_meta (rule_id),
    INDEX idx_meta_key (meta_key)
);

-- ============================================
-- TABLE DES STATISTIQUES D'UTILISATION
-- ============================================

CREATE TABLE IF NOT EXISTS rule_usage_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id VARCHAR(100) NOT NULL,
    usage_date DATE NOT NULL,
    usage_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    avg_confidence DECIMAL(5,2),
    FOREIGN KEY (rule_id) REFERENCES linguistic_rules(rule_id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_rule_date (rule_id, usage_date),
    INDEX idx_usage_date (usage_date)
);

-- ============================================
-- INSERTION DES RÈGLES DE STYLE
-- ============================================

INSERT INTO linguistic_rules (rule_id, name, category, pattern_type, pattern, correction, explanation, example, priority) VALUES
('ponctuation_fin', 'ponctuation_fin', 'style', 'regex', '\\b([.!?])\\s*([.!?])', '$1', 'Éviter la double ponctuation en fin de phrase.', 'Bonjour!. → Bonjour!', 85),
('espace_apres_virgule', 'espace_apres_virgule', 'style', 'regex', ',(\\S)', ', $1', 'Mettre un espace après la virgule.', 'Bonjour,mon ami → Bonjour, mon ami', 90),
('espace_avant_point', 'espace_avant_point', 'style', 'regex', '\\s+([.!?])', '$1', 'Pas d''espace avant la ponctuation finale.', 'Bonjour . → Bonjour.', 85),
('double_espace', 'double_espace', 'style', 'regex', '\\s{2,}', ' ', 'Éviter les doubles espaces.', 'Bonjour  mon ami → Bonjour mon ami', 80),
('majuscule_debut_phrase', 'majuscule_debut_phrase', 'style', 'function', '([.!?]\\s+)([a-z])', 'function', 'Commencer chaque phrase par une majuscule.', 'bonjour. comment allez-vous? → Bonjour. Comment allez-vous?', 95),
('accord_être_adjectif', 'accord_être_adjectif', 'style', 'regex', '\\b(ils|elles)\\s+(est|sont)\\s+(\\w+)(s?)\\b', 'function', 'Accord sujet-verbe-adjectif avec être.', 'Ils est grand → Ils sont grands', 90),
('confusion_ou_où', 'confusion_ou_où', 'style', 'regex', '\\bou\\b(?=\\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur))', 'où', 'Utiliser "où" pour le lieu, "ou" pour le choix.', 'La maison ou je vis → La maison où je vis', 80),
('confusion_a_à', 'confusion_a_à', 'style', 'regex', '\\ba\\b(?=\\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur|cette|ces|cet))', 'à', 'Utiliser "à" pour la préposition, "a" pour le verbe.', 'Il a le livre → Il à le livre (incorrect)', 75),
('accord_participe_passé', 'accord_participe_passé', 'style', 'regex', '\\b(elle|la|cette)\\s+(a|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|avais|avais|avait|avions|aviez|avaient|eus|eûmes|eûtes|eurent)\\s+(\\w+é)\\b', 'function', 'Accorder le participe passé avec le sujet féminin.', 'Elle a arrivé → Elle a arrivée', 85),
('parentheses_espaces', 'parentheses_espaces', 'style', 'regex', '\\(\\s*([^\\)]+?)\\s*\\)', '($1)', 'Pas d''espaces inutiles à l''intérieur des parenthèses.', '( texte ) → (texte)', 70);

-- ============================================
-- INSERTION DES RÈGLES DE VOCABULAIRE
-- ============================================

INSERT INTO linguistic_rules (rule_id, name, category, pattern_type, pattern, correction, explanation, example, priority) VALUES
('confusion_a_a_vocab', 'confusion_a_a', 'vocabulaire', 'regex', '\\bà\\b', 'a', 'Utiliser "a" (verbe avoir) au lieu de "à" (préposition) dans ce contexte.', 'Il à faim → Il a faim', 80),
('confusion_ca_ce', 'confusion_ca_ce', 'vocabulaire', 'regex', '\\bça\\b', 'cela', 'Utiliser "cela" plutôt que "ça" dans un contexte formel.', 'Ça va bien → Cela va bien', 75),
('confusion_leur_leurs', 'confusion_leur_leurs', 'vocabulaire', 'regex', '\\bleur\\b(?=\\s+[aeiouéèêëîïôöùûü])', 'leurs', 'Utiliser "leurs" (adjectif possessif pluriel) devant une voyelle.', 'Leur enfant → Leurs enfants', 80),
('confusion_quelquelle', 'confusion_quelquelle', 'vocabulaire', 'regex', '\\bquel\\b(?=\\s+nom_féminin)', 'quelle', 'Utiliser "quelle" pour le féminin.', 'Quel belle → Quelle belle', 75),
('confusion_on_ont', 'confusion_on_ont', 'vocabulaire', 'regex', '\\bon\\b(?=\\s+(ont|ont|ont))', 'ont', 'Utiliser "ont" (verbe avoir) au lieu de "on" (pronom).', 'On manger → Ont mangé', 85);

-- ============================================
-- INSERTION DES RÈGLES DE CONJUGAISON
-- ============================================

INSERT INTO linguistic_rules (rule_id, name, category, pattern_type, pattern, correction, explanation, example, priority) VALUES
('aller_present_vas', 'aller_present_vas', 'conjugaison', 'regex', '\\bil vas\\b', 'il va', 'Le verbe aller se conjugue: je vais, tu vas, il va.', 'Il vas au marché → Il va au marché', 90),
('aller_present_vas_pluriel', 'aller_present_vas_pluriel', 'conjugaison', 'regex', '\\b(ils|elles) vas\\b', '$1 vont', 'Au pluriel, aller se conjugue: ils vont, elles vont.', 'Ils vas → Ils vont', 90),
('etre_present_sont', 'etre_present_sont', 'conjugaison', 'regex', '\\bil sont\\b', 'il est', 'Le verbe être: il est, ils sont.', 'Il sont grand → Il est grand', 90),
('etre_present_elles_sont', 'etre_present_elles_sont', 'conjugaison', 'regex', '\\bel sont\\b', 'elles sont', 'Le verbe être au féminin pluriel: elles sont.', 'Elles sont belles', 90),
('faire_present_font', 'faire_present_font', 'conjugaison', 'regex', '\\bil font\\b', 'ils font', 'Le verbe faire: il fait, ils font.', 'Il font beau → Ils font beau', 90),
('faire_present_elles_font', 'faire_present_elles_font', 'conjugaison', 'regex', '\\bel font\\b', 'elles font', 'Le verbe faire au féminin pluriel: elles font.', 'Elles font', 90),
('accord_sujet_verbe_enfants', 'accord_sujet_verbe_enfants', 'conjugaison', 'regex', '\\bles enfant\\s+(\\w+es?)\\b', 'les enfants $1ent', 'Accord sujet-verbe: les enfants + verbe au pluriel.', 'Les enfant joue → Les enfants jouent', 85),
('accord_sujet_verbe_chats', 'accord_sujet_verbe_chats', 'conjugaison', 'regex', '\\bles chat\\s+(\\w+es?)\\b', 'les chats $1ent', 'Accord sujet-verbe: les chats + verbe au pluriel.', 'Les chat dort → Les chats dorment', 85),
('accord_sujet_verbe_filles', 'accord_sujet_verbe_filles', 'conjugaison', 'regex', '\\bles fille\\s+(\\w+es?)\\b', 'les filles $1ent', 'Accord sujet-verbe: les filles + verbe au pluriel.', 'Les fille chante → Les filles chantent', 85),
('falloir_present', 'falloir_present', 'conjugaison', 'regex', '\\bil faut\\b', 'il faut', 'Le verbe falloir ne s''utilise qu''avec il: il faut.', 'Il faut étudier pour réussir.', 80);

-- ============================================
-- INSERTION DES RÈGLES D'ORTHOGRAPHE
-- ============================================

INSERT INTO linguistic_rules (rule_id, name, category, pattern_type, pattern, correction, explanation, example, priority) VALUES
('accord_être_nom', 'accord_être_nom', 'orthographe', 'regex', '\\b(ils|elles)\\s+(est|sont)\\s+(\\w+)(s?)\\b', 'function', 'Accord sujet-verbe avec être.', 'Ils est content → Ils sont contents', 90),
('accord_avoir_nom', 'accord_avoir_nom', 'orthographe', 'regex', '\\b(ils|elles)\\s+(a|as|avons|avez|ont)\\s+(\\w+)(s?)\\b', 'function', 'Accord sujet-auxiliaire avec avoir.', 'Ils a les livres → Ils ont les livres', 90),
('accord_adjectif_feminin', 'accord_adjectif_feminin', 'orthographe', 'regex', '\\b(la|cette|une|ma|ta|sa)\\s+(\\w+)\\s+(\\w+?)(s?)\\b', 'function', 'Accord de l''adjectif avec le nom féminin.', 'La maison est beau → La maison est belle', 85),
('accord_adjectif_pluriel', 'accord_adjectif_pluriel', 'orthographe', 'regex', '\\b(les|des|mes|tes|ses|nos|vos|leurs)\\s+(\\w+)\\s+(\\w+?)\\b', 'function', 'Accord de l''adjectif au pluriel.', 'Les chats est petit → Les chats sont petits', 85),
('confusion_ce_se', 'confusion_ce_se', 'orthographe', 'regex', '\\bce\\b(?=\\s+(est|sont|sera|seront|était|étaient|fut|furent))', 'se', 'Utiliser "se" pour le pronom réfléchi, "ce" pour le démonstratif.', 'Ce lave → Se lave', 80);

-- ============================================
-- VUES POUR L'APPLICATION
-- ============================================

-- Vue des règles actives par catégorie
CREATE VIEW active_rules AS
SELECT 
    rule_id,
    name,
    category,
    pattern_type,
    pattern,
    correction,
    explanation,
    example,
    priority
FROM linguistic_rules 
WHERE is_active = TRUE 
ORDER BY category, priority DESC;

-- Vue des statistiques d'utilisation
CREATE VIEW rule_stats AS
SELECT 
    lr.rule_id,
    lr.name,
    lr.category,
    COALESCE(SUM(rus.usage_count), 0) as total_usage,
    COALESCE(SUM(rus.success_count), 0) as total_success,
    COALESCE(AVG(rus.avg_confidence), 0) as avg_confidence
FROM linguistic_rules lr
LEFT JOIN rule_usage_stats rus ON lr.rule_id = rus.rule_id
WHERE lr.is_active = TRUE
GROUP BY lr.rule_id, lr.name, lr.category
ORDER BY total_usage DESC;

-- ============================================
-- PROCÉDURES STOCKÉES
-- ============================================

DELIMITER //

-- Procédure pour charger les règles par catégorie
CREATE PROCEDURE GetRulesByCategory(IN p_category VARCHAR(50))
BEGIN
    SELECT 
        rule_id,
        name,
        pattern_type,
        pattern,
        correction,
        explanation,
        example,
        priority
    FROM linguistic_rules 
    WHERE category = p_category AND is_active = TRUE
    ORDER BY priority DESC;
END //

-- Procédure pour mettre à jour les statistiques d'utilisation
CREATE PROCEDURE UpdateRuleUsage(IN p_rule_id VARCHAR(100), IN p_success BOOLEAN, IN p_confidence DECIMAL(5,2))
BEGIN
    INSERT INTO rule_usage_stats (rule_id, usage_date, usage_count, success_count, avg_confidence)
    VALUES (p_rule_id, CURDATE(), 1, IF(p_success, 1, 0), p_confidence)
    ON DUPLICATE KEY UPDATE 
        usage_count = usage_count + 1,
        success_count = success_count + IF(p_success, 1, 0),
        avg_confidence = (avg_confidence * (usage_count - 1) + p_confidence) / usage_count;
END //

-- Procédure pour ajouter une nouvelle règle
CREATE PROCEDURE AddRule(
    IN p_rule_id VARCHAR(100),
    IN p_name VARCHAR(255),
    IN p_category VARCHAR(50),
    IN p_pattern_type VARCHAR(20),
    IN p_pattern TEXT,
    IN p_correction TEXT,
    IN p_explanation TEXT,
    IN p_example TEXT,
    IN p_priority INT
)
BEGIN
    INSERT INTO linguistic_rules (
        rule_id, name, category, pattern_type, pattern, correction, 
        explanation, example, priority
    ) VALUES (
        p_rule_id, p_name, p_category, p_pattern_type, p_pattern, p_correction,
        p_explanation, p_example, p_priority
    );
END //

DELIMITER ;

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Insérer quelques règles de test
INSERT INTO linguistic_rules (rule_id, name, category, pattern_type, pattern, correction, explanation, example, priority) VALUES
('test_rule_1', 'Test Rule 1', 'style', 'regex', '\\btest\\b', 'TEST', 'Règle de test', 'test → TEST', 50),
('test_rule_2', 'Test Rule 2', 'vocabulaire', 'regex', '\\bexample\\b', 'exemple', 'Règle de test vocabulaire', 'example → exemple', 60);

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Afficher un résumé
SELECT 
    category,
    COUNT(*) as rule_count,
    SUM(priority) as total_priority
FROM linguistic_rules 
WHERE is_active = TRUE
GROUP BY category
ORDER BY category;
