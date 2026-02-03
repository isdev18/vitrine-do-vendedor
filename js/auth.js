// ============================================
// Vitrine do Vendedor - SISTEMA DE AUTENTICAÇÃO
// ============================================

class AuthService {
    constructor() {
        this.tokenKey = 'vh_auth_token';
        this.userKey = 'vh_current_user';
        this.sessionKey = 'vh_session';
    }

    // ==========================================
    // REGISTRO
    // ==========================================

    async register(email, senha, confirmarSenha) {
        // Validações
        if (!email || !senha || !confirmarSenha) {
            throw new Error('Todos os campos são obrigatórios');
        }

        if (!this.validateEmail(email)) {
            throw new Error('Email inválido');
        }

        if (senha.length < CONFIG.SEGURANCA.SENHA_MIN_LENGTH) {
            throw new Error(`A senha deve ter no mínimo ${CONFIG.SEGURANCA.SENHA_MIN_LENGTH} caracteres`);
        }

        if (CONFIG.SEGURANCA.SENHA_REQUER_NUMERO && !/\d/.test(senha)) {
            throw new Error('A senha deve conter pelo menos um número');
        }

        if (senha !== confirmarSenha) {
            throw new Error('As senhas não conferem');
        }

        try {
            // Criar usuário no banco
            const user = db.createUser({
                email: email.toLowerCase().trim(),
                senha: senha
            });

            // Enviar email de boas-vindas
            db.queueEmail(CONFIG.EMAIL.TEMPLATES.BOAS_VINDAS, user.id);

            // Log
            db.addLog('register_success', user.id, { email: user.email });

            return {
                success: true,
                message: 'Conta criada com sucesso!',
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            db.addLog('register_failed', null, { email, error: error.message });
            throw error;
        }
    }

    // ==========================================
    // LOGIN
    // ==========================================

    async login(email, senha, lembrar = false) {
        if (!email || !senha) {
            throw new Error('Email e senha são obrigatórios');
        }

        const user = db.getUserByEmail(email.toLowerCase().trim());

        if (!user) {
            db.addLog('login_failed', null, { email, reason: 'user_not_found' });
            throw new Error('Email ou senha incorretos');
        }

        // Verificar se usuário está bloqueado
        if (user.status === 'bloqueado') {
            throw new Error('Sua conta está bloqueada. Entre em contato com o suporte.');
        }

        // Verificar senha
        if (!db.verifyPassword(senha, user.senha_hash)) {
            db.addLog('login_failed', user.id, { reason: 'wrong_password' });
            throw new Error('Email ou senha incorretos');
        }

        // Criar sessão
        const token = this.generateToken(user);
        const session = {
            token,
            user_id: user.id,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + CONFIG.SEGURANCA.SESSION_TIMEOUT).toISOString(),
            remember: lembrar
        };

        // Salvar sessão
        this.saveSession(session, lembrar);

        // Log
        db.addLog('login_success', user.id);

        return {
            success: true,
            message: 'Login realizado com sucesso!',
            user: this.sanitizeUser(user),
            token,
            redirectTo: user.role === 'admin' ? 'admin.html' : 'painel.html'
        };
    }

    // ==========================================
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
        const user = db.getUserById(session.user_id);

        return user ? this.sanitizeUser(user) : null;
    }

    getFullCurrentUser() {
        if (!this.isAuthenticated()) return null;

        const session = this.getSession();
        return db.getUserById(session.user_id);
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
        storage.setItem(this.userKey, JSON.stringify(db.getUserById(session.user_id)));
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
