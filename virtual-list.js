/**
 * =================================================================
 * DOM VIRTUEL POUR LES LISTES PERFORMANTES
 * Rendu optimisé pour les grandes listes d'erreurs
 * =================================================================
 */

'use strict';

class VirtualList {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        
        if (!this.container) {
            throw new Error('Conteneur non trouvé');
        }

        // Configuration par défaut
        this.config = {
            itemHeight: options.itemHeight || 40,
            renderItem: options.renderItem || this.defaultRenderItem,
            getKey: options.getKey || ((item, index) => index),
            overscan: options.overscan || 5,
            threshold: options.threshold || 100,
            enableAnimations: options.enableAnimations !== false,
            recycleElements: options.recycleElements !== false
        };

        // État interne
        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        this.renderedElements = new Map();
        this.recycledElements = [];
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        this.isScrolling = false;
        this.scrollTimeout = null;

        // Éléments DOM
        this.viewport = null;
        this.content = null;
        this.spacerBefore = null;
        this.spacerAfter = null;

        this.initialize();
    }

    /**
     * Initialise le composant
     * @private
     */
    initialize() {
        this.createStructure();
        this.setupStyles();
        this.setupEventListeners();
        this.updateContainerHeight();
    }

    /**
     * Crée la structure DOM
     * @private
     */
    createStructure() {
        // Créer le viewport
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-list-viewport';
        this.viewport.style.cssText = `
            height: 100%;
            overflow: auto;
            position: relative;
        `;

        // Créer le contenu
        this.content = document.createElement('div');
        this.content.className = 'virtual-list-content';
        this.content.style.cssText = `
            position: relative;
            width: 100%;
        `;

        // Créer les espaces
        this.spacerBefore = document.createElement('div');
        this.spacerBefore.className = 'virtual-list-spacer-before';
        this.spacerBefore.style.cssText = `
            width: 100%;
            position: relative;
        `;

        this.spacerAfter = document.createElement('div');
        this.spacerAfter.className = 'virtual-list-spacer-after';
        this.spacerAfter.style.cssText = `
            width: 100%;
            position: relative;
        `;

        // Assembler la structure
        this.content.appendChild(this.spacerBefore);
        this.content.appendChild(this.spacerAfter);
        this.viewport.appendChild(this.content);

        // Remplacer le contenu du conteneur
        this.container.innerHTML = '';
        this.container.appendChild(this.viewport);
    }

    /**
     * Configure les styles CSS
     * @private
     */
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .virtual-list-viewport {
                scrollbar-width: thin;
                scrollbar-color: #cbd5e1 #f1f5f9;
            }
            
            .virtual-list-viewport::-webkit-scrollbar {
                width: 8px;
            }
            
            .virtual-list-viewport::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }
            
            .virtual-list-viewport::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
            }
            
            .virtual-list-viewport::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
            
            .virtual-list-item {
                position: absolute;
                width: 100%;
                box-sizing: border-box;
                transition: opacity 0.2s ease;
            }
            
            .virtual-list-item.recycled {
                display: none;
            }
            
            .virtual-list-item.entering {
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
            }
            
            .virtual-list-item.exiting {
                animation: fadeOut 0.3s ease forwards;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Configure les écouteurs d'événements
     * @private
     */
    setupEventListeners() {
        this.viewport.addEventListener('scroll', () => {
            this.handleScroll();
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Gère le scroll
     * @private
     */
    handleScroll() {
        const currentScrollTop = this.viewport.scrollTop;
        
        // Déterminer la direction du scroll
        this.scrollDirection = currentScrollTop > this.lastScrollTop ? 'down' : 'up';
        this.lastScrollTop = currentScrollTop;

        // Marquer comme scrolling
        this.isScrolling = true;
        
        // Clear le timeout précédent
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        // Nouveau timeout pour détecter la fin du scroll
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 150);

        // Mettre à jour la position et le rendu
        this.scrollTop = currentScrollTop;
        this.updateVisibleRange();
        this.render();
    }

    /**
     * Gère le redimensionnement
     * @private
     */
    handleResize() {
        this.updateContainerHeight();
        this.updateVisibleRange();
        this.render();
    }

    /**
     * Met à jour la hauteur du conteneur
     * @private
     */
    updateContainerHeight() {
        this.containerHeight = this.viewport.clientHeight;
        this.viewport.style.height = `${this.containerHeight}px`;
    }

    /**
     * Définit les items à afficher
     * @param {Array} items - Liste des items
     */
    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.config.itemHeight;
        this.updateVisibleRange();
        this.render();
    }

    /**
     * Met à jour la plage visible
     * @private
     */
    updateVisibleRange() {
        const visibleCount = Math.ceil(this.containerHeight / this.config.itemHeight);
        const startIndex = Math.floor(this.scrollTop / this.config.itemHeight);
        
        // Appliquer l'overscan
        this.visibleStart = Math.max(0, startIndex - this.config.overscan);
        this.visibleEnd = Math.min(
            this.items.length,
            startIndex + visibleCount + this.config.overscan
        );
    }

    /**
     * Rendu des éléments visibles
     * @private
     */
    render() {
        if (this.items.length === 0) {
            this.renderEmpty();
            return;
        }

        // Mettre à jour les espaces
        this.spacerBefore.style.height = `${this.visibleStart * this.config.itemHeight}px`;
        this.spacerAfter.style.height = `${Math.max(0, (this.items.length - this.visibleEnd) * this.config.itemHeight)}px`;

        // Nettoyer les éléments non visibles
        this.cleanupInvisibleElements();

        // Rendre les éléments visibles
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            this.renderItem(i);
        }
    }

    /**
     * Rendu d'un item individuel
     * @private
     */
    renderItem(index) {
        const item = this.items[index];
        const key = this.config.getKey(item, index);
        
        let element = this.renderedElements.get(key);
        
        if (!element) {
            // Créer ou recycler un élément
            element = this.getOrCreateElement();
            element = this.config.renderItem(item, element, index);
            
            // Configurer l'élément
            element.style.position = 'absolute';
            element.style.top = `${index * this.config.itemHeight}px`;
            element.style.width = '100%';
            element.style.height = `${this.config.itemHeight}px`;
            element.dataset.key = key;
            element.dataset.index = index;
            
            // Ajouter au DOM et au suivi
            this.content.appendChild(element);
            this.renderedElements.set(key, element);
            
            // Animation d'entrée
            if (this.config.enableAnimations) {
                element.classList.add('entering');
                setTimeout(() => element.classList.remove('entering'), 300);
            }
        } else {
            // Mettre à jour la position si nécessaire
            const currentTop = parseInt(element.style.top);
            const expectedTop = index * this.config.itemHeight;
            
            if (currentTop !== expectedTop) {
                element.style.top = `${expectedTop}px`;
            }
        }
    }

    /**
     * Obtient ou crée un élément
     * @private
     */
    getOrCreateElement() {
        if (this.config.recycleElements && this.recycledElements.length > 0) {
            const element = this.recycledElements.pop();
            element.classList.remove('recycled');
            element.style.display = '';
            return element;
        }
        
        return document.createElement('div');
    }

    /**
     * Nettoie les éléments invisibles
     * @private
     */
    cleanupInvisibleElements() {
        for (const [key, element] of this.renderedElements) {
            const index = parseInt(element.dataset.index);
            
            if (index < this.visibleStart || index >= this.visibleEnd) {
                if (this.config.recycleElements) {
                    // Recycler l'élément
                    element.classList.add('recycled');
                    element.style.display = 'none';
                    this.recycledElements.push(element);
                } else {
                    // Supprimer l'élément
                    if (this.config.enableAnimations) {
                        element.classList.add('exiting');
                        setTimeout(() => element.remove(), 300);
                    } else {
                        element.remove();
                    }
                }
                
                this.renderedElements.delete(key);
            }
        }
    }

    /**
     * Rendu pour une liste vide
     * @private
     */
    renderEmpty() {
        this.spacerBefore.style.height = '0px';
        this.spacerAfter.style.height = '0px';
        
        // Nettoyer tous les éléments
        for (const element of this.renderedElements.values()) {
            element.remove();
        }
        this.renderedElements.clear();
        
        // Afficher un message vide
        const emptyElement = document.createElement('div');
        emptyElement.className = 'virtual-list-empty';
        emptyElement.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #6b7280;
            font-size: 14px;
        `;
        emptyElement.textContent = 'Aucun élément à afficher';
        this.content.appendChild(emptyElement);
    }

    /**
     * Fonction de rendu par défaut
     * @private
     */
    defaultRenderItem(item, element, index) {
        element.className = 'virtual-list-item';
        element.innerHTML = `
            <div style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="font-weight: 500;">${item.title || 'Item ' + index}</div>
                ${item.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.description}</div>` : ''}
            </div>
        `;
        return element;
    }

    /**
     * Fait défiler vers un item spécifique
     * @param {number} index - Index de l'item
     * @param {string} behavior - Comportement du scroll
     */
    scrollToItem(index, behavior = 'smooth') {
        if (index < 0 || index >= this.items.length) {
            return;
        }

        const targetScrollTop = index * this.config.itemHeight;
        this.viewport.scrollTo({
            top: targetScrollTop,
            behavior
        });
    }

    /**
     * Fait défiler vers le haut
     */
    scrollToTop() {
        this.viewport.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Fait défiler vers le bas
     */
    scrollToBottom() {
        this.viewport.scrollTo({
            top: this.totalHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Récupère les items visibles
     * @returns {Array} Items visibles
     */
    getVisibleItems() {
        return this.items.slice(this.visibleStart, this.visibleEnd);
    }

    /**
     * Récupère l'index d'un item à partir de sa position
     * @param {number} scrollTop - Position de scroll
     * @returns {number} Index de l'item
     */
    getItemIndexFromScrollTop(scrollTop) {
        return Math.floor(scrollTop / this.config.itemHeight);
    }

    /**
     * Récupère les statistiques
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            totalItems: this.items.length,
            visibleItems: this.visibleEnd - this.visibleStart,
            renderedElements: this.renderedElements.size,
            recycledElements: this.recycledElements.length,
            containerHeight: this.containerHeight,
            itemHeight: this.config.itemHeight,
            totalHeight: this.totalHeight,
            scrollPosition: this.scrollTop,
            isScrolling: this.isScrolling,
            scrollDirection: this.scrollDirection
        };
    }

    /**
     * Détruit le composant
     */
    destroy() {
        // Nettoyer les timeouts
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        // Supprimer les écouteurs
        this.viewport.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);

        // Nettoyer les éléments
        for (const element of this.renderedElements.values()) {
            element.remove();
        }
        this.renderedElements.clear();
        this.recycledElements = [];

        // Vider le conteneur
        this.container.innerHTML = '';
    }
}

// Export global
window.VirtualList = VirtualList;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VirtualList;
}
