/**
 * Vitrine do Vendedor - API Client
 * Camada de integração do frontend com o backend
 */

const API = {
    // Configuração base
    baseURL: 'http://localhost:8000/api',
    
    // Token de autenticação
    getToken() {
        return localStorage.getItem('auth_token');
    },
    
    setToken(token) {
        localStorage.setItem('auth_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    },
    
    // Headers padrão para requisições
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (includeAuth && this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
        }
        
        return headers;
    },
    
    // Método genérico para requisições
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: this.getHeaders(options.auth !== false),
        };
        
        const config = { ...defaultOptions, ...options };
        delete config.auth;
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            // Se token expirou, fazer logout
            if (response.status === 401) {
                this.removeToken();
                window.location.href = '/login.html';
                return;
            }
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Erro na requisição');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // ==========================================
    // AUTENTICAÇÃO
    // ==========================================
    
    auth: {
        /**
         * Registrar novo usuário
         */
        async register(userData) {
            const response = await API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                auth: false
            });
            
            if (response.access_token) {
                API.setToken(response.access_token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
            }
            
            return response;
        },
        
        /**
         * Login de usuário
         */
        async login(email, password) {
            const response = await API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                auth: false
            });
            
            if (response.access_token) {
                API.setToken(response.access_token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
            }
            
            return response;
        },
        
        /**
         * Logout
         */
        logout() {
            API.removeToken();
            window.location.href = '/index.html';
        },
        
        /**
         * Renovar token
         */
        async refreshToken() {
            const response = await API.request('/auth/refresh', {
                method: 'POST'
            });
            
            if (response.access_token) {
                API.setToken(response.access_token);
            }
            
            return response;
        },
        
        /**
         * Obter usuário atual
         */
        async getCurrentUser() {
            return await API.request('/auth/me');
        },
        
        /**
         * Solicitar recuperação de senha
         */
        async forgotPassword(email) {
            return await API.request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
                auth: false
            });
        },
        
        /**
         * Resetar senha com token
         */
        async resetPassword(token, newPassword) {
            return await API.request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, new_password: newPassword }),
                auth: false
            });
        },
        
        /**
         * Verificar se está autenticado
         */
        isAuthenticated() {
            return !!API.getToken();
        },
        
        /**
         * Obter dados do usuário do localStorage
         */
        getUserData() {
            const data = localStorage.getItem('user_data');
            return data ? JSON.parse(data) : null;
        }
    },
    
    // ==========================================
    // USUÁRIO
    // ==========================================
    
    user: {
        /**
         * Obter perfil do usuário
         */
        async getProfile() {
            return await API.request('/user/profile');
        },
        
        /**
         * Atualizar perfil
         */
        async updateProfile(data) {
            return await API.request('/user/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        /**
         * Alterar senha
         */
        async changePassword(currentPassword, newPassword) {
            return await API.request('/user/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
        },
        
        /**
         * Obter dashboard do usuário
         */
        async getDashboard() {
            return await API.request('/user/dashboard');
        }
    },
    
    // ==========================================
    // VITRINE
    // ==========================================
    
    vitrine: {
        /**
         * Criar nova vitrine
         */
        async create(vitrineData) {
            return await API.request('/vitrine', {
                method: 'POST',
                body: JSON.stringify(vitrineData)
            });
        },
        
        /**
         * Obter vitrine do usuário
         */
        async get() {
            return await API.request('/vitrine');
        },
        
        /**
         * Atualizar vitrine
         */
        async update(vitrineData) {
            return await API.request('/vitrine', {
                method: 'PUT',
                body: JSON.stringify(vitrineData)
            });
        },
        
        /**
         * Obter vitrine pública pelo slug
         */
        async getPublic(slug) {
            return await API.request(`/vitrine/public/${slug}`, {
                auth: false
            });
        },
        
        /**
         * Verificar disponibilidade de slug
         */
        async checkSlug(slug) {
            return await API.request(`/vitrine/check-slug/${slug}`, {
                auth: false
            });
        },
        
        /**
         * Obter estatísticas da vitrine
         */
        async getStats() {
            return await API.request('/vitrine/stats');
        }
    },
    
    // ==========================================
    // PRODUTOS
    // ==========================================
    
    produtos: {
        /**
         * Listar todos os produtos do usuário
         */
        async list(page = 1, limit = 20, filters = {}) {
            const params = new URLSearchParams({
                page,
                limit,
                ...filters
            });
            return await API.request(`/products?${params}`);
        },
        
        /**
         * Obter produto específico
         */
        async get(productId) {
            return await API.request(`/products/${productId}`);
        },
        
        /**
         * Criar novo produto
         */
        async create(productData) {
            return await API.request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        },
        
        /**
         * Atualizar produto
         */
        async update(productId, productData) {
            return await API.request(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        },
        
        /**
         * Excluir produto
         */
        async delete(productId) {
            return await API.request(`/products/${productId}`, {
                method: 'DELETE'
            });
        },
        
        /**
         * Alternar destaque do produto
         */
        async toggleFeatured(productId) {
            return await API.request(`/products/${productId}/toggle-featured`, {
                method: 'POST'
            });
        },
        
        /**
         * Alternar status ativo/inativo
         */
        async toggleActive(productId) {
            return await API.request(`/products/${productId}/toggle-active`, {
                method: 'POST'
            });
        },
        
        /**
         * Upload de imagem do produto
         */
        async uploadImage(productId, file) {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch(`${API.baseURL}/products/${productId}/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API.getToken()}`
                },
                body: formData
            });
            
            return await response.json();
        }
    },
    
    // ==========================================
    // ASSINATURA
    // ==========================================
    
    subscription: {
        /**
         * Obter status da assinatura atual
         */
        async getStatus() {
            return await API.request('/subscription/status');
        },
        
        /**
         * Listar planos disponíveis
         */
        async getPlans() {
            return await API.request('/subscription/plans', {
                auth: false
            });
        },
        
        /**
         * Escolher plano (durante cadastro ou upgrade)
         */
        async selectPlan(plan) {
            return await API.request('/subscription/select-plan', {
                method: 'POST',
                body: JSON.stringify({ plan })
            });
        },
        
        /**
         * Registrar pagamento
         */
        async registerPayment(paymentData) {
            return await API.request('/subscription/payment', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
        },
        
        /**
         * Obter histórico de pagamentos
         */
        async getPaymentHistory() {
            return await API.request('/subscription/payments');
        },
        
        /**
         * Cancelar assinatura
         */
        async cancel() {
            return await API.request('/subscription/cancel', {
                method: 'POST'
            });
        },
        
        /**
         * Fazer upgrade de plano
         */
        async upgrade(newPlan) {
            return await API.request('/subscription/upgrade', {
                method: 'POST',
                body: JSON.stringify({ plan: newPlan })
            });
        }
    },
    
    // ==========================================
    // CONTATO (Público)
    // ==========================================
    
    contato: {
        /**
         * Obter informações de contato da vitrine
         */
        async get(vitrineSlug) {
            return await API.request(`/vitrine/public/${vitrineSlug}/contato`, {
                auth: false
            });
        },
        
        /**
         * Atualizar contato (usuário autenticado)
         */
        async update(contatoData) {
            return await API.request('/vitrine/contato', {
                method: 'PUT',
                body: JSON.stringify(contatoData)
            });
        },
        
        /**
         * Registrar clique no WhatsApp
         */
        async registerWhatsAppClick(vitrineId) {
            return await API.request(`/vitrine/${vitrineId}/whatsapp-click`, {
                method: 'POST',
                auth: false
            });
        }
    }
};

// ==========================================
// UTILITÁRIOS DO FRONTEND
// ==========================================

const Utils = {
    /**
     * Formatar preço em BRL
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },
    
    /**
     * Formatar data
     */
    formatDate(dateString, options = {}) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...options
        });
    },
    
    /**
     * Mostrar notificação toast
     */
    showToast(message, type = 'info') {
        // Implementação básica - pode ser substituída por uma biblioteca
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    /**
     * Mostrar loading
     */
    showLoading(show = true) {
        let loader = document.getElementById('global-loader');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'global-loader';
                loader.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    ">
                        <div style="
                            width: 50px;
                            height: 50px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #e63946;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        "></div>
                    </div>
                `;
                document.body.appendChild(loader);
            }
        } else if (loader) {
            loader.remove();
        }
    },
    
    /**
     * Validar email
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    /**
     * Validar telefone brasileiro
     */
    isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    },
    
    /**
     * Formatar telefone
     */
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    },
    
    /**
     * Gerar slug a partir de texto
     */
    generateSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
};

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Verificar autenticação ao carregar páginas protegidas
document.addEventListener('DOMContentLoaded', function() {
    const protectedPages = ['painel.html', 'editar-vitrine.html', 'meus-produtos.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !API.auth.isAuthenticated()) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
    }
});

// Exportar para uso global
window.API = API;
window.Utils = Utils;
