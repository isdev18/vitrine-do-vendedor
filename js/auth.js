
// Garante que safeFetch está disponível globalmente
if (typeof safeFetch === 'undefined') {
    window.safeFetch = async function(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${text}`);
            }
            const contentType = response.headers.get('content-type');
            const text = await response.text();
            let data = null;
            if (text && contentType && contentType.includes('application/json')) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Falha ao fazer parse do JSON:', e, text);
                    throw new Error('Resposta não é um JSON válido');
                }
            } else if (text) {
                data = text;
            }
            return data;
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            throw error;
        }
    };
}

class AuthService {
    constructor() {
        this.tokenKey = 'vh_auth_token';
        this.userKey = 'vh_current_user';
        this.sessionKey = 'vh_session';
        this.apiBaseUrl = this.resolveApiBaseUrl();
    }

    resolveApiBaseUrl() {
        if (typeof CONFIG !== 'undefined' && CONFIG.API_URL) {
            return String(CONFIG.API_URL).replace(/\/+$/, '');
        }
        return window.location.origin.replace(/\/+$/, '');
    }

    buildApiUrl(path) {
        if (!path) return this.apiBaseUrl;
        if (/^https?:\/\//i.test(path)) return path;
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${this.apiBaseUrl}${normalizedPath}`;
    }

    async postWithFallback(paths, payload) {
        let lastError = null;
        for (const path of paths) {
            const endpoint = this.buildApiUrl(path);
            try {
                console.log('[AuthService] POST', endpoint);
                return await safeFetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                lastError = err;
                const message = String(err && err.message ? err.message : '');
                if (!message.includes('HTTP 404') && !message.includes('HTTP 405')) {
                    throw err;
                }
            }
        }
        throw lastError || new Error('Erro ao conectar com a API');
    }

    // ==========================================
    // REGISTRO
    // ==========================================

    async register(email, senha, confirmarSenha) {
        if (!email || !senha || !confirmarSenha) {
            throw new Error('Todos os campos sao obrigatorios');
        }

        if (!this.validateEmail(email)) {
            throw new Error('Email invalido');
        }

        if (senha.length < CONFIG.SEGURANCA.SENHA_MIN_LENGTH) {
            throw new Error(`A senha deve ter no minimo ${CONFIG.SEGURANCA.SENHA_MIN_LENGTH} caracteres`);
        }

        if (CONFIG.SEGURANCA.SENHA_REQUER_NUMERO && !/\d/.test(senha)) {
            throw new Error('A senha deve conter pelo menos um numero');
        }

        if (senha !== confirmarSenha) {
            throw new Error('As senhas nao conferem');
        }

        let result;
        try {
            result = await this.postWithFallback(['/register', '/auth/register', '/api/register', '/api/auth/register', '/api/v1/register', '/api/v1/auth/register'], { nome: email.split('@')[0], email, senha, telefone: '' });
        } catch (err) {
            throw new Error(err.message || 'Erro ao cadastrar');
        }

        if (!result || !result.status || result.status !== 'ok') {
            throw new Error(result && result.msg ? result.msg : 'Erro ao cadastrar');
        }
        return result;
    }

    // LOGIN
    // ==========================================

    async login(email, senha, lembrar = false) {
        if (!email || !senha) {
            throw new Error('Email e senha sao obrigatorios');
        }

        let result;
        try {
            const loginPath = CONFIG.API.AUTH.LOGIN || '/auth/login';
            const loginPaths = [loginPath, '/auth/login', '/login', '/api/auth/login', '/api/v1/auth/login'];
            result = await this.postWithFallback(loginPaths, { email, senha });
        } catch (err) {
            throw new Error(err.message || 'Erro ao fazer login');
        }

        if (!result || !result.success) {
            throw new Error(result && result.message ? result.message : 'Email ou senha incorretos');
        }

        const token = result.token;
        const user = result.user;
        if (!token || !user) {
            throw new Error('Resposta invalida do backend');
        }

        const session = {
            token,
            user_id: user.id,
            user,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + CONFIG.SEGURANCA.SESSION_TIMEOUT).toISOString(),
            remember: lembrar
        };
        this.saveSession(session, lembrar);
        return result;
    }

    // LOGOUT
    // ==========================================

    logout() {
        const user = this.getCurrentUser();
        if (user) {
            db.addLog('logout', user.id);
        }

        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.sessionKey);

        window.location.href = 'index.html';
    }

    // ==========================================
    // VERIFICAÇÃO DE SESSÃO
    // ==========================================

    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;

        // Verificar se sessão expirou
        if (new Date(session.expires_at) < new Date()) {
            this.logout();
            return false;
        }

        return true;
    }

    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        const session = this.getSession();
        return session.user ? this.sanitizeUser(session.user) : null;
    }

    getFullCurrentUser() {
        if (!this.isAuthenticated()) return null;
        const session = this.getSession();
        return session.user || null;
    }

    isAdmin() {
        const user = this.getFullCurrentUser();
        return user && user.role === 'admin';
    }

    hasActiveSubscription() {
        const user = this.getFullCurrentUser();
        if (!user) return false;
        if (user.role === 'admin') return true;

        const subscription = db.getSubscriptionByUserId(user.id);
        if (!subscription) return false;

        return ['trial', 'ativo'].includes(subscription.status);
    }

    // ==========================================
    // PROTEÇÃO DE ROTAS
    // ==========================================

    requireAuth(redirectTo = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    requireAdmin(redirectTo = 'painel.html') {
        if (!this.isAdmin()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    requireSubscription(redirectTo = 'planos.html') {
        if (!this.hasActiveSubscription()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    // ==========================================
    // RECUPERAÇÃO DE SENHA
    // ==========================================

    async forgotPassword(email) {
        const user = db.getUserByEmail(email.toLowerCase().trim());

        if (!user) {
            // Por segurança, não informar se email existe
            return {
                success: true,
                message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
            };
        }

        // Gerar token de reset
        const resetToken = this.generateResetToken();
        db.updateUser(user.id, {
            reset_token: resetToken,
            reset_token_expires: new Date(Date.now() + 3600000).toISOString() // 1 hora
        });

        // Enviar email (simulado)
        console.log(`📧 Link de reset: reset-senha.html?token=${resetToken}`);
        db.addLog('password_reset_requested', user.id);

        return {
            success: true,
            message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
        };
    }

    async resetPassword(token, novaSenha, confirmarSenha) {
        if (novaSenha !== confirmarSenha) {
            throw new Error('As senhas não conferem');
        }

        if (novaSenha.length < CONFIG.SEGURANCA.SENHA_MIN_LENGTH) {
            throw new Error(`A senha deve ter no mínimo ${CONFIG.SEGURANCA.SENHA_MIN_LENGTH} caracteres`);
        }

        // Encontrar usuário pelo token
        const users = db.getAllUsers();
        const user = users.find(u => 
            u.reset_token === token && 
            new Date(u.reset_token_expires) > new Date()
        );

        if (!user) {
            throw new Error('Token inválido ou expirado');
        }

        // Atualizar senha
        db.updateUser(user.id, {
            senha_hash: db.hashPassword(novaSenha),
            reset_token: null,
            reset_token_expires: null
        });

        db.addLog('password_reset_success', user.id);

        return {
            success: true,
            message: 'Senha alterada com sucesso!'
        };
    }

    // ==========================================
    // ALTERAR SENHA
    // ==========================================

    async changePassword(senhaAtual, novaSenha, confirmarSenha) {
        const user = this.getFullCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        if (!db.verifyPassword(senhaAtual, user.senha_hash)) {
            throw new Error('Senha atual incorreta');
        }

        if (novaSenha !== confirmarSenha) {
            throw new Error('As novas senhas não conferem');
        }

        if (novaSenha.length < CONFIG.SEGURANCA.SENHA_MIN_LENGTH) {
            throw new Error(`A senha deve ter no mínimo ${CONFIG.SEGURANCA.SENHA_MIN_LENGTH} caracteres`);
        }

        db.updateUser(user.id, {
            senha_hash: db.hashPassword(novaSenha)
        });

        db.addLog('password_changed', user.id);

        return {
            success: true,
            message: 'Senha alterada com sucesso!'
        };
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    generateToken(user) {
        // Simulação de JWT - em produção usar biblioteca real
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: user.id,
            email: user.email,
            role: user.role,
            iat: Date.now(),
            exp: Date.now() + CONFIG.SEGURANCA.SESSION_TIMEOUT
        }));
        const signature = btoa(user.id + Date.now());
        return `${header}.${payload}.${signature}`;
    }

    generateResetToken() {
        return 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    sanitizeUser(user) {
        const { senha_hash, reset_token, reset_token_expires, ...sanitized } = user;
        return sanitized;
    }

    saveSession(session, remember) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(this.sessionKey, JSON.stringify(session));
        storage.setItem(this.tokenKey, session.token);
        // Salva o usuário retornado do backend (com role)
        storage.setItem(this.userKey, JSON.stringify(session.user));
    }

    getSession() {
        let session = localStorage.getItem(this.sessionKey);
        if (!session) {
            session = sessionStorage.getItem(this.sessionKey);
        }
        return session ? JSON.parse(session) : null;
    }

    // Refresh da sessão
    refreshSession() {
        const session = this.getSession();
        if (session) {
            session.expires_at = new Date(Date.now() + CONFIG.SEGURANCA.SESSION_TIMEOUT).toISOString();
            this.saveSession(session, session.remember);
        }
    }
}

// Instância global
const auth = new AuthService();

// Auto-refresh da sessão a cada 5 minutos
setInterval(() => {
    if (auth.isAuthenticated()) {
        auth.refreshSession();
    }
}, 300000);

