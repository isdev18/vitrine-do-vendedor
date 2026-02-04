// ============================================
// Vitrine do Vendedor - CONFIGURAÇÕES DO SISTEMA
// ============================================

// Detectar ambiente (produção ou desenvolvimento)
const IS_PRODUCTION = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1';

// URL base da API (variável separada para evitar referência a CONFIG durante inicialização)
const API_URL = IS_PRODUCTION ? 'https://vitrine-do-vendedor-production.up.railway.app' : window.location.origin;

const CONFIG = {
    // Informações do Sistema
    APP_NAME: 'Vitrine do Vendedor',
    APP_VERSION: '1.0.0',
    APP_URL: IS_PRODUCTION ? 'https://vitrine-do-vendedor.vercel.app' : window.location.origin,
    
    // API Backend - Railway em produção
    API_URL: API_URL, // removido '/api' do final
    
    // Planos e Preços
    PLANOS: {
        basico: {
            id: 'basico',
            nome: 'Básico',
            preco: 29.90,
            precoAnual: 299.00,
            recursos: [
                'Vitrine personalizada',
                'Até 10 motos',
                'Link personalizado',
                'Botão WhatsApp',
                'Suporte por email'
            ],
            limiteMotos: 10,
            destaque: false
        },
        profissional: {
            id: 'profissional',
            nome: 'Profissional',
            preco: 49.90,
            precoAnual: 499.00,
            recursos: [
                'Tudo do Básico',
                'Motos ilimitadas',
                'Múltiplas imagens por moto',
                'Dashboard com métricas',
                'Destaque nas buscas',
                'Suporte prioritário'
            ],
            limiteMotos: -1, // ilimitado
            destaque: true
        },
        premium: {
            id: 'premium',
            nome: 'Premium',
            preco: 99.90,
            precoAnual: 999.00,
            recursos: [
                'Tudo do Profissional',
                'Domínio personalizado',
                'Remoção da marca Vitrine do Vendedor',
                'Relatórios avançados',
                'Integração com CRM',
                'Gerente de conta dedicado'
            ],
            limiteMotos: -1,
            destaque: false
        }
    },

    // Configurações de Pagamento (Stripe/Mercado Pago)
    PAGAMENTO: {
        // Mercado Pago (Produção usar chaves reais)
        MERCADO_PAGO_PUBLIC_KEY: 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        
        // Stripe (Produção usar chaves reais)
        STRIPE_PUBLIC_KEY: 'pk_test_xxxxxxxxxxxxxxxxxxxx',
        
        // Moeda
        MOEDA: 'BRL',
        
        // Dias de trial
        DIAS_TRIAL: 7
    },

    // Configurações de Email
    EMAIL: {
        REMETENTE: 'contato@vitrinevendedor.com',
        NOME_REMETENTE: 'Vitrine do Vendedor',
        
        // Templates
        TEMPLATES: {
            BOAS_VINDAS: 'welcome',
            CONFIRMACAO_PAGAMENTO: 'payment_confirmed',
            LEMBRETE_VENCIMENTO: 'payment_reminder',
            PAGAMENTO_ATRASADO: 'payment_overdue',
            VITRINE_BLOQUEADA: 'vitrine_blocked',
            VITRINE_REATIVADA: 'vitrine_reactivated',
            CANCELAMENTO: 'subscription_cancelled'
        }
    },

    // Configurações de Segurança
    SEGURANCA: {
        // JWT
        JWT_EXPIRACAO: '24h',
        JWT_REFRESH_EXPIRACAO: '7d',
        
        // Senha
        SENHA_MIN_LENGTH: 6,
        SENHA_REQUER_NUMERO: true,
        SENHA_REQUER_ESPECIAL: false,
        
        // Rate Limiting
        MAX_TENTATIVAS_LOGIN: 5,
        BLOQUEIO_MINUTOS: 15,
        
        // Session
        SESSION_TIMEOUT: 3600000 // 1 hora em ms
    },

    // Categorias de Motos
    CATEGORIAS_MOTOS: [
        { id: 'street', nome: 'Street', icone: '🏍️' },
        { id: 'trail', nome: 'Trail / Off-Road', icone: '🏔️' },
        { id: 'scooter', nome: 'Scooter', icone: '🛵' },
        { id: 'sport', nome: 'Sport', icone: '🏎️' },
        { id: 'custom', nome: 'Custom', icone: '🔧' },
        { id: 'adventure', nome: 'Adventure', icone: '🌍' },
        { id: 'naked', nome: 'Naked', icone: '⚡' },
        { id: 'touring', nome: 'Touring', icone: '🛣️' }
    ],

    // Status de Assinatura
    STATUS_ASSINATURA: {
        TRIAL: 'trial',
        ATIVO: 'ativo',
        INADIMPLENTE: 'inadimplente',
        CANCELADO: 'cancelado',
        BLOQUEADO: 'bloqueado'
    },

    // API Endpoints (para integração futura com backend real)
    API: {
        BASE_PATH: '/api/v1', // usado para compor a URL completa
        BASE_FULL: (function(){
            // garante que não haja '//' duplicado ao juntar
            const base = (typeof API_URL !== 'undefined' && API_URL) ? API_URL : (window && window.location ? window.location.origin : '');
            return base.replace(/\/+$/,'') + '/api/v1';
        })(),
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            REFRESH: '/auth/refresh',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password'
        },
        USER: {
            PROFILE: '/user/profile',
            UPDATE: '/user/update',
            CHANGE_PASSWORD: '/user/change-password'
        },
        VITRINE: {
            GET: '/vitrine',
            UPDATE: '/vitrine/update',
            PUBLISH: '/vitrine/publish'
        },
        MOTOS: {
            LIST: '/motos',
            CREATE: '/motos/create',
            UPDATE: '/motos/update',
            DELETE: '/motos/delete'
        },
        PAGAMENTO: {
            CREATE_SUBSCRIPTION: '/pagamento/subscribe',
            CANCEL_SUBSCRIPTION: '/pagamento/cancel',
            UPDATE_CARD: '/pagamento/update-card',
            HISTORY: '/pagamento/history'
        },
        ADMIN: {
            USERS: '/admin/users',
            SUBSCRIPTIONS: '/admin/subscriptions',
            REPORTS: '/admin/reports'
        }
    }
};

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
