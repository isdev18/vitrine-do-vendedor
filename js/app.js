/**
 * App.js - Funções utilitárias e inicializações globais
 * Sistema Vitrine do Vendedor
 */

// ============================================
// Funções Utilitárias Globais
// ============================================

const Utils = {
    /**
     * Formata valor para moeda brasileira
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    },

    /**
     * Formata data para formato brasileiro
     */
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    },

    /**
     * Formata data e hora para formato brasileiro
     */
    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    },

    /**
     * Gera UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Formata número de telefone
     */
    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    /**
     * Formata URL para exibição
     */
    formatUrl(url) {
        return url ? url.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') : '';
    },

    /**
     * Valida email
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Valida telefone brasileiro
     */
    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    },

    /**
     * Valida senha (mínimo 6 caracteres)
     */
    isValidPassword(password) {
        return password && password.length >= 6;
    },

    /**
     * Debounce para otimizar eventos
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Converte imagem para base64
     */
    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    /**
     * Trunca texto
     */
    truncate(text, length = 100) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    },

    /**
     * Calcula tempo restante
     */
    timeRemaining(date) {
        if (!date) return null;
        const diff = new Date(date) - new Date();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return { days, expired: days < 0 };
    },

    /**
     * Gera slug amigável
     */
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
};

// ============================================
// Toast Notifications
// ============================================

const Toast = {
    show(message, type = 'success', duration = 3000) {
        let toast = document.getElementById('toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            toast.innerHTML = '<span class="toast-icon">✓</span><span class="toast-message"></span>';
            document.body.appendChild(toast);
        }

        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');

        icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        messageEl.textContent = message;
        toast.className = `toast ${type} active`;

        setTimeout(() => {
            toast.classList.remove('active');
        }, duration);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// ============================================
// Modal Handler
// ============================================

const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// ============================================
// Loading Handler
// ============================================

const Loading = {
    show(message = 'Carregando...') {
        let loader = document.getElementById('globalLoader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <span class="loader-message">${message}</span>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
        }

        loader.classList.add('active');
    },

    hide() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.classList.remove('active');
        }
    }
};

// ============================================
// Form Helpers
// ============================================

const FormHelpers = {
    /**
     * Serializa formulário para objeto
     */
    serialize(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },

    /**
     * Preenche formulário com dados
     */
    populate(form, data) {
        for (let key in data) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!data[key];
                } else if (field.type === 'file') {
                    // Skip file inputs
                } else {
                    field.value = data[key] || '';
                }
            }
        }
    },

    /**
     * Limpa formulário
     */
    reset(form) {
        form.reset();
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.error-message').forEach(el => el.remove());
    },

    /**
     * Mostra erro em campo
     */
    showError(field, message) {
        field.classList.add('error');
        let errorEl = field.parentNode.querySelector('.error-message');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },

    /**
     * Remove erro de campo
     */
    clearError(field) {
        field.classList.remove('error');
        const errorEl = field.parentNode.querySelector('.error-message');
        if (errorEl) errorEl.remove();
    }
};

// ============================================
// Analytics (Simulação)
// ============================================

const Analytics = {
    track(event, data = {}) {
        // Log para desenvolvimento
        console.log('📊 Analytics:', event, data);

        // Em produção, integrar com Google Analytics, Mixpanel, etc.
        // gtag('event', event, data);
    },

    pageView(page) {
        this.track('page_view', { page });
    },

    click(element) {
        this.track('click', { element });
    },

    conversion(type, value) {
        this.track('conversion', { type, value });
    }
};

// ============================================
// Inicialização Global
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                Modal.closeAll();
            }
        });
    });

    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            Modal.closeAll();
        }
    });

    // Máscaras de input
    document.querySelectorAll('[data-mask="phone"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length > 6) {
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                } else if (value.length > 2) {
                    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                } else if (value.length > 0) {
                    value = value.replace(/(\d{0,2})/, '($1');
                }
            }
            this.value = value;
        });
    });

    // Máscara de moeda
    document.querySelectorAll('[data-mask="currency"]').forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = (parseInt(value) / 100).toFixed(2);
            value = value.replace('.', ',');
            value = 'R$ ' + value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            this.value = value;
        });
    });

    // Analytics de página
    Analytics.pageView(window.location.pathname);
});

// ============================================
// Exportar para uso global
// ============================================

window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;
window.Loading = Loading;
window.FormHelpers = FormHelpers;
window.Analytics = Analytics;
