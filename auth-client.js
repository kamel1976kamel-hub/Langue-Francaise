/**
 * =================================================================
 * AUTH-CLIENT.JS — Couche frontend d'authentification Worker + D1
 * =================================================================
 * Communique exclusivement avec le Worker Cloudflare pour :
 *   - login / logout / me / change-password
 *   - gestion du token de session (sessionStorage uniquement)
 *   - ajout du header Authorization aux requêtes Worker
 *
 * NE contient AUCUNE clé secrète, AUCUN mot de passe en dur.
 * Le token n'est JAMAIS journalisé.
 * =================================================================
 */

(function (global) {
    'use strict';

    // =================================================================
    // CONFIGURATION
    // =================================================================
    var WORKER_URL = 'https://langue-francaise-ia.chellouaikamel50.workers.dev';
    var TOKEN_KEY = 'auth_session_token';

    // =================================================================
    // STOCKAGE TOKEN (sessionStorage uniquement)
    // =================================================================
    function getToken() {
        try { return sessionStorage.getItem(TOKEN_KEY) || null; }
        catch (e) { return null; }
    }

    function setToken(token) {
        try { sessionStorage.setItem(TOKEN_KEY, token); }
        catch (e) { /* stockage indisponible */ }
    }

    function clearToken() {
        try { sessionStorage.removeItem(TOKEN_KEY); }
        catch (e) { /* stockage indisponible */ }
    }

    // =================================================================
    // APPEL WORKER GÉNÉRIQUE
    // =================================================================
    function workerFetch(body, options) {
        var opts = options || {};
        var headers = { 'Content-Type': 'application/json' };
        var token = getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        // Permettre des headers supplémentaires
        if (opts.extraHeaders) {
            for (var k in opts.extraHeaders) {
                if (opts.extraHeaders.hasOwnProperty(k)) {
                    headers[k] = opts.extraHeaders[k];
                }
            }
        }

        return fetch(WORKER_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        }).then(function (resp) {
            return resp.json().then(function (data) {
                return { status: resp.status, data: data };
            });
        });
    }

    // =================================================================
    // LOGIN
    // =================================================================
    function login(username, password) {
        if (!username || !password) {
            return Promise.resolve({
                status: 400,
                data: { erreur: 'Identifiants requis' }
            });
        }
        return workerFetch({
            action: 'login',
            username: username.trim().toLowerCase(),
            password: password
        }).then(function (result) {
            if (result.status === 200 && result.data.session) {
                setToken(result.data.session);
            }
            return result;
        });
    }

    // =================================================================
    // GET ME
    // =================================================================
    function getMe() {
        var token = getToken();
        if (!token) {
            return Promise.resolve({ status: 401, data: { erreur: 'Authentification requise' } });
        }
        return workerFetch({ action: 'me' });
    }

    // =================================================================
    // CHANGE PASSWORD
    // =================================================================
    function changePassword(oldPassword, newPassword) {
        if (!oldPassword || !newPassword) {
            return Promise.resolve({
                status: 400,
                data: { erreur: 'Ancien et nouveau mot de passe requis' }
            });
        }
        if (newPassword.length < 8) {
            return Promise.resolve({
                status: 400,
                data: { erreur: 'Mot de passe trop court (minimum 8 caractères)' }
            });
        }
        return workerFetch({
            action: 'change-password',
            oldPassword: oldPassword,
            newPassword: newPassword
        });
    }

    // =================================================================
    // LOGOUT
    // =================================================================
    function logout() {
        var token = getToken();
        clearToken();
        if (!token) {
            return Promise.resolve({ status: 200, data: { message: 'Déconnexion réussie' } });
        }
        // Appeler /logout même si on a déjà nettoyé localement
        return workerFetch({ action: 'logout' }).catch(function () {
            // Si /logout échoue (réseau, session déjà invalide), on a déjà nettoyé le token
            return { status: 200, data: { message: 'Déconnexion locale réussie' } };
        });
    }

    // =================================================================
    // ADMIN — Gestion des comptes (réservé concepteur)
    // =================================================================

    /**
     * Liste tous les utilisateurs (sans password_hash).
     * Réservé au concepteur authentifié (role=teacher, concepteur=1).
     */
    function adminListUsers() {
        return workerFetch({ action: 'admin-list-users' });
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur cible.
     * Retourne { temporaryPassword } UNE SEULE FOIS.
     * Ne jamais stocker ce mot de passe.
     */
    function adminResetPassword(targetUserId) {
        if (!targetUserId || typeof targetUserId !== 'string') {
            return Promise.resolve({
                status: 400,
                data: { erreur: 'Utilisateur cible requis' }
            });
        }
        return workerFetch({
            action: 'admin-reset-password',
            targetUserId: targetUserId
        });
    }

    /**
     * Réinitialise les mots de passe de plusieurs utilisateurs.
     * Retourne { results: [{ userId, username, temporaryPassword }] } UNE SEULE FOIS.
     */
    function adminResetBatch(targetUserIds) {
        if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
            return Promise.resolve({
                status: 400,
                data: { erreur: 'Liste d\'utilisateurs requise' }
            });
        }
        return workerFetch({
            action: 'admin-reset-batch',
            targetUserIds: targetUserIds
        });
    }

    // =================================================================
    // GESTION PÉDAGOGIQUE — Wrappers API (F1)
    // Wrappers fins : transmettent { action: '...', ...params } à workerFetch.
    // Aucune logique d'autorisation, aucune transformation d'erreur HTTP :
    // le frontend (F3/F4) traite { status, data } et data.erreur.
    // Aucune seconde couche HTTP ; workerFetch reste privé.
    // =================================================================

    // ---- Lecture (READ) ----
    function pedagogieListAcademicYears(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-academic-years' }, params || {}));
    }

    function pedagogieListTeachers(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-teachers' }, params || {}));
    }

    function pedagogieListStudents(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-students' }, params || {}));
    }

    function pedagogieListUsers(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-users' }, params || {}));
    }

    function pedagogieListGroups(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-groups' }, params || {}));
    }

    function pedagogieListGroupMembers(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-group-members' }, params || {}));
    }

    function pedagogieListTeacherAssignments(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-teacher-assignments' }, params || {}));
    }

    function pedagogieListModuleOfferings(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-module-offerings' }, params || {}));
    }

    function pedagogieListAuditLog(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-list-audit-log' }, params || {}));
    }

    // ---- Écriture (WRITE) ----
    function pedagogieCreateAcademicYear(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-create-academic-year' }, params || {}));
    }

    function pedagogieArchiveAcademicYear(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-archive-academic-year' }, params || {}));
    }

    function pedagogieCreateTeacher(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-create-teacher' }, params || {}));
    }

    function pedagogieCreateStudent(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-create-student' }, params || {}));
    }

    function pedagogieCreateGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-create-group' }, params || {}));
    }

    function pedagogieAddStudentToGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-add-student-to-group' }, params || {}));
    }

    function pedagogieAddStudentsToGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-add-students-to-group' }, params || {}));
    }

    function pedagogieAssignTeacherModule(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-assign-teacher-module' }, params || {}));
    }

    function pedagogieCreateModuleOffering(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-create-module-offering' }, params || {}));
    }

    function pedagogieCreateUser(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-create-user' }, params || {}));
    }

    function pedagogieEndMembership(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-end-membership' }, params || {}));
    }

    // ---- Cycle de vie P6.1 (groupes) — wrappers fins, autorité = Worker ----
    function pedagogieUpdateGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-update-group' }, params || {}));
    }

    function pedagogieInactivateGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-inactivate-group' }, params || {}));
    }

    function pedagogieArchiveGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-archive-group' }, params || {}));
    }

    // ---- Cycle de vie P6.2 (profils) — wrappers fins, autorité = Worker ----
    function pedagogieUpdateTeacher(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-update-teacher' }, params || {}));
    }

    function pedagogieInactivateTeacher(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-inactivate-teacher' }, params || {}));
    }

    function pedagogieUpdateStudent(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-update-student' }, params || {}));
    }

    function pedagogieInactivateStudent(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-inactivate-student' }, params || {}));
    }

    // ---- Cycle de vie P6.3 (affectations) — wrappers fins, autorité = Worker ----
    function pedagogieArchiveTeacherAssignment(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-archive-teacher-assignment' }, params || {}));
    }

    // ---- Cycle de vie P6.4 (offerings) — wrappers fins, autorité = Worker ----
    function pedagogieUpdateModuleOffering(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-update-module-offering' }, params || {}));
    }

    function pedagogieArchiveModuleOffering(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-archive-module-offering' }, params || {}));
    }

    // ---- Complément lifecycle P8-C — wrappers fins, autorité = Worker ----
    function pedagogieSetUserActive(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-set-user-active' }, params || {}));
    }

    function pedagogieReactivateGroup(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-reactivate-group' }, params || {}));
    }

    function pedagogieReactivateTeacherAssignment(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-reactivate-teacher-assignment' }, params || {}));
    }

    function pedagogieReactivateModuleOffering(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-reactivate-module-offering' }, params || {}));
    }

    function pedagogieUpdateAcademicYear(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-update-academic-year' }, params || {}));
    }

    function pedagogieTransferStudent(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-transfer-student' }, params || {}));
    }

    // ---- Console de gestion des comptes P9 — wrappers fins, autorité = Worker ----
    function pedagogieUpdateUser(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-update-user' }, params || {}));
    }

    function pedagogieSetUsersActive(params) {
        return workerFetch(Object.assign({ action: 'pedagogie-set-users-active' }, params || {}));
    }

    // =================================================================
    // HELPERS
    // =================================================================
    function isAuthenticated() {
        return !!getToken();
    }

    function getWorkerUrl() {
        return WORKER_URL;
    }

    /**
     * Retourne les headers à ajouter aux requêtes Worker (ex: /analyze).
     * Inclut Authorization si un token existe.
     */
    function getAuthHeaders() {
        var headers = {};
        var token = getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    /**
     * Enrichit un objet headers existant avec les headers d'auth.
     */
    function withAuthHeaders(existingHeaders) {
        var result = {};
        if (existingHeaders) {
            for (var k in existingHeaders) {
                if (existingHeaders.hasOwnProperty(k)) {
                    result[k] = existingHeaders[k];
                }
            }
        }
        var authH = getAuthHeaders();
        for (var k2 in authH) {
            if (authH.hasOwnProperty(k2)) {
                result[k2] = authH[k2];
            }
        }
        return result;
    }

    // =================================================================
    // EXPORT
    // =================================================================
    var AuthClient = {
        login: login,
        logout: logout,
        getMe: getMe,
        changePassword: changePassword,
        adminListUsers: adminListUsers,
        adminResetPassword: adminResetPassword,
        adminResetBatch: adminResetBatch,
        pedagogieListAcademicYears: pedagogieListAcademicYears,
        pedagogieListTeachers: pedagogieListTeachers,
        pedagogieListStudents: pedagogieListStudents,
        pedagogieListUsers: pedagogieListUsers,
        pedagogieListGroups: pedagogieListGroups,
        pedagogieListGroupMembers: pedagogieListGroupMembers,
        pedagogieListTeacherAssignments: pedagogieListTeacherAssignments,
        pedagogieListModuleOfferings: pedagogieListModuleOfferings,
        pedagogieListAuditLog: pedagogieListAuditLog,
        pedagogieCreateAcademicYear: pedagogieCreateAcademicYear,
        pedagogieArchiveAcademicYear: pedagogieArchiveAcademicYear,
        pedagogieCreateTeacher: pedagogieCreateTeacher,
        pedagogieCreateStudent: pedagogieCreateStudent,
        pedagogieCreateGroup: pedagogieCreateGroup,
        pedagogieAddStudentToGroup: pedagogieAddStudentToGroup,
        pedagogieAddStudentsToGroup: pedagogieAddStudentsToGroup,
        pedagogieAssignTeacherModule: pedagogieAssignTeacherModule,
        pedagogieCreateModuleOffering: pedagogieCreateModuleOffering,
        pedagogieCreateUser: pedagogieCreateUser,
        pedagogieEndMembership: pedagogieEndMembership,
        pedagogieUpdateGroup: pedagogieUpdateGroup,
        pedagogieInactivateGroup: pedagogieInactivateGroup,
        pedagogieArchiveGroup: pedagogieArchiveGroup,
        pedagogieUpdateTeacher: pedagogieUpdateTeacher,
        pedagogieInactivateTeacher: pedagogieInactivateTeacher,
        pedagogieUpdateStudent: pedagogieUpdateStudent,
        pedagogieInactivateStudent: pedagogieInactivateStudent,
        pedagogieArchiveTeacherAssignment: pedagogieArchiveTeacherAssignment,
        pedagogieUpdateModuleOffering: pedagogieUpdateModuleOffering,
        pedagogieArchiveModuleOffering: pedagogieArchiveModuleOffering,
        pedagogieSetUserActive: pedagogieSetUserActive,
        pedagogieUpdateUser: pedagogieUpdateUser,
        pedagogieSetUsersActive: pedagogieSetUsersActive,
        pedagogieReactivateGroup: pedagogieReactivateGroup,
        pedagogieReactivateTeacherAssignment: pedagogieReactivateTeacherAssignment,
        pedagogieReactivateModuleOffering: pedagogieReactivateModuleOffering,
        pedagogieUpdateAcademicYear: pedagogieUpdateAcademicYear,
        pedagogieTransferStudent: pedagogieTransferStudent,
        getToken: getToken,
        clearToken: clearToken,
        isAuthenticated: isAuthenticated,
        getWorkerUrl: getWorkerUrl,
        getAuthHeaders: getAuthHeaders,
        withAuthHeaders: withAuthHeaders,
        WORKER_URL: WORKER_URL
    };

    // Exposer globalement
    global.AuthClient = AuthClient;

})(typeof window !== 'undefined' ? window : this);
