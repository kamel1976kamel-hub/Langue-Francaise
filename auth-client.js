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
