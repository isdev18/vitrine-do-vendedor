// ============================================
// Vitrine do Vendedor - BANCO DE DADOS (LocalStorage)
// Simulação de banco para demonstração
// Em produção, usar MySQL/PostgreSQL + API
// ============================================

class Database {
    constructor() {
        this.prefix = 'vh_';
        this.initDatabase();
    }

    // Inicializa o banco de dados com estrutura padrão
    initDatabase() {
        if (!this.get('initialized')) {
            // Criar estrutura inicial
            this.set('users', []);
            this.set('subscriptions', []);
            this.set('vitrines', []);
            this.set('produtos', []);
            this.set('pagamentos', []);
            this.set('logs', []);
            this.set('emails_queue', []);
            
            // Criar admin padrão
            const adminUser = {
                id: this.generateId(),
                email: 'admin@vitrinevendedor.com',
                senha_hash: this.hashPassword('admin123'),
                nome: 'Administrador',
                role: 'admin',
                status: 'ativo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const users = this.get('users');
            users.push(adminUser);
            this.set('users', users);
            
            this.set('initialized', true);
            console.log('Database initialized');
        }
    }

    // Métodos básicos de storage
    get(key) {
        const data = localStorage.getItem(this.prefix + key);
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }

    set(key, value) {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    // Gerar ID único
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Hash simples de senha (em produção usar bcrypt no backend)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    }

    // Verificar senha
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // ==========================================
    // CRUD - USERS
    // ==========================================
    
    createUser(userData) {
        const users = this.get('users') || [];
        
        // Verificar se email já existe
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Email já cadastrado');
        }

        const user = {
            id: this.generateId(),
            email: userData.email,
            senha_hash: this.hashPassword(userData.senha),
            nome: userData.nome || '',
            telefone: userData.telefone || '',
            role: 'user',
            status: 'pendente', // pendente, ativo, bloqueado
            plano: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        users.push(user);
        this.set('users', users);

        // Criar vitrine inicial para o usuário
        this.createVitrine(user.id);

        // Log
        this.addLog('user_created', user.id, { email: user.email });

        return user;
    }

    getUserById(id) {
        const users = this.get('users') || [];
        return users.find(u => u.id === id);
    }

    getUserByEmail(email) {
        const users = this.get('users') || [];
        return users.find(u => u.email === email);
    }

    updateUser(id, data) {
        const users = this.get('users') || [];
        const index = users.findIndex(u => u.id === id);
        
        if (index === -1) {
            throw new Error('Usuário não encontrado');
        }

        users[index] = {
            ...users[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        this.set('users', users);
        this.addLog('user_updated', id, data);

        return users[index];
    }

    getAllUsers() {
        return this.get('users') || [];
    }

    deleteUser(id) {
        let users = this.get('users') || [];
        users = users.filter(u => u.id !== id);
        this.set('users', users);

        // Deletar dados relacionados
        this.deleteVitrineByUserId(id);
        this.deleteSubscriptionByUserId(id);

        this.addLog('user_deleted', id);
    }

    // ==========================================
    // CRUD - SUBSCRIPTIONS
    // ==========================================

    createSubscription(userId, planoId) {
        const subscriptions = this.get('subscriptions') || [];
        const plano = CONFIG.PLANOS[planoId];

        if (!plano) {
            throw new Error('Plano inválido');
        }

        // Cancelar assinatura anterior se existir
        const existingIndex = subscriptions.findIndex(s => s.user_id === userId && s.status !== 'cancelado');
        if (existingIndex !== -1) {
            subscriptions[existingIndex].status = 'cancelado';
            subscriptions[existingIndex].cancelled_at = new Date().toISOString();
        }

        const subscription = {
            id: this.generateId(),
            user_id: userId,
            plano_id: planoId,
            plano_nome: plano.nome,
            valor: plano.preco,
            status: CONFIG.STATUS_ASSINATURA.TRIAL,
            trial_ends_at: new Date(Date.now() + CONFIG.PAGAMENTO.DIAS_TRIAL * 24 * 60 * 60 * 1000).toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        subscriptions.push(subscription);
        this.set('subscriptions', subscriptions);

        // Atualizar status do usuário
        this.updateUser(userId, { status: 'ativo', plano: planoId });

        // Log
        this.addLog('subscription_created', userId, { plano: planoId });

        return subscription;
    }

    getSubscriptionByUserId(userId) {
        const subscriptions = this.get('subscriptions') || [];
        return subscriptions.find(s => s.user_id === userId && s.status !== 'cancelado');
    }

    updateSubscription(id, data) {
        const subscriptions = this.get('subscriptions') || [];
        const index = subscriptions.findIndex(s => s.id === id);

        if (index === -1) {
            throw new Error('Assinatura não encontrada');
        }

        subscriptions[index] = {
            ...subscriptions[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        this.set('subscriptions', subscriptions);
        return subscriptions[index];
    }

    cancelSubscription(userId) {
        const subscription = this.getSubscriptionByUserId(userId);
        if (subscription) {
            this.updateSubscription(subscription.id, {
                status: 'cancelado',
                cancelled_at: new Date().toISOString()
            });
            this.updateUser(userId, { status: 'cancelado', plano: null });
            this.addLog('subscription_cancelled', userId);
        }
    }

    getAllSubscriptions() {
        return this.get('subscriptions') || [];
    }

    deleteSubscriptionByUserId(userId) {
        let subscriptions = this.get('subscriptions') || [];
        subscriptions = subscriptions.filter(s => s.user_id !== userId);
        this.set('subscriptions', subscriptions);
    }

    // ==========================================
    // CRUD - VITRINES
    // ==========================================

    createVitrine(userId) {
        const vitrines = this.get('vitrines') || [];
        
        // Verificar se já existe
        if (vitrines.find(v => v.user_id === userId)) {
            return vitrines.find(v => v.user_id === userId);
        }

        const vitrine = {
            id: this.generateId(),
            user_id: userId,
            nome: '',
            slogan: '',
            descricao: '',
            url_personalizada: '',
            foto_perfil: '',
            banner: '',
            cor_tema: '#e31837',
            whatsapp: '',
            instagram: '',
            facebook: '',
            email_contato: '',
            endereco: '',
            publicada: false,
            visualizacoes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        vitrines.push(vitrine);
        this.set('vitrines', vitrines);

        return vitrine;
    }

    getVitrineByUserId(userId) {
        const vitrines = this.get('vitrines') || [];
        return vitrines.find(v => v.user_id === userId);
    }

    getVitrineByUrl(url) {
        const vitrines = this.get('vitrines') || [];
        return vitrines.find(v => v.url_personalizada === url && v.publicada);
    }

    updateVitrine(userId, data) {
        const vitrines = this.get('vitrines') || [];
        const index = vitrines.findIndex(v => v.user_id === userId);

        if (index === -1) {
            throw new Error('Vitrine não encontrada');
        }

        // Verificar se URL já está em uso por outro usuário
        if (data.url_personalizada) {
            const urlEmUso = vitrines.find(v => 
                v.url_personalizada === data.url_personalizada && 
                v.user_id !== userId
            );
            if (urlEmUso) {
                throw new Error('Esta URL já está em uso');
            }
        }

        vitrines[index] = {
            ...vitrines[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        this.set('vitrines', vitrines);
        this.addLog('vitrine_updated', userId);

        return vitrines[index];
    }

    publishVitrine(userId) {
        return this.updateVitrine(userId, { publicada: true });
    }

    incrementVitrineViews(vitrineId) {
        const vitrines = this.get('vitrines') || [];
        const index = vitrines.findIndex(v => v.id === vitrineId);
        if (index !== -1) {
            vitrines[index].visualizacoes = (vitrines[index].visualizacoes || 0) + 1;
            this.set('vitrines', vitrines);
        }
    }

    getAllVitrines() {
        return this.get('vitrines') || [];
    }

    deleteVitrineByUserId(userId) {
        let vitrines = this.get('vitrines') || [];
        vitrines = vitrines.filter(v => v.user_id !== userId);
        this.set('vitrines', vitrines);

        // Deletar produtos da vitrine
        this.deleteProdutosByUserId(userId);
    }

    // ==========================================
    // CRUD - PRODUTOS (MOTOS)
    // ==========================================

    createProduto(userId, produtoData) {
        const produtos = this.get('produtos') || [];
        const vitrine = this.getVitrineByUserId(userId);

        if (!vitrine) {
            throw new Error('Vitrine não encontrada');
        }

        // Verificar limite do plano
        const user = this.getUserById(userId);
        const plano = CONFIG.PLANOS[user.plano];
        const produtosDoUsuario = produtos.filter(p => p.user_id === userId);

        if (plano && plano.limiteMotos !== -1 && produtosDoUsuario.length >= plano.limiteMotos) {
            throw new Error(`Limite de ${plano.limiteMotos} motos atingido. Faça upgrade do plano.`);
        }

        const produto = {
            id: this.generateId(),
            user_id: userId,
            vitrine_id: vitrine.id,
            nome: produtoData.nome,
            descricao: produtoData.descricao || '',
            preco: produtoData.preco || '',
            ano: produtoData.ano || '',
            categoria: produtoData.categoria || '',
            imagens: produtoData.imagens || [],
            destaque: produtoData.destaque || false,
            ativo: true,
            ordem: produtosDoUsuario.length,
            visualizacoes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        produtos.push(produto);
        this.set('produtos', produtos);

        this.addLog('produto_created', userId, { nome: produto.nome });

        return produto;
    }

    getProdutosByUserId(userId) {
        const produtos = this.get('produtos') || [];
        return produtos.filter(p => p.user_id === userId).sort((a, b) => {
            if (a.destaque && !b.destaque) return -1;
            if (!a.destaque && b.destaque) return 1;
            return a.ordem - b.ordem;
        });
    }

    getProdutosByVitrineId(vitrineId) {
        const produtos = this.get('produtos') || [];
        return produtos.filter(p => p.vitrine_id === vitrineId && p.ativo).sort((a, b) => {
            if (a.destaque && !b.destaque) return -1;
            if (!a.destaque && b.destaque) return 1;
            return a.ordem - b.ordem;
        });
    }

    updateProduto(id, data) {
        const produtos = this.get('produtos') || [];
        const index = produtos.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error('Produto não encontrado');
        }

        produtos[index] = {
            ...produtos[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        this.set('produtos', produtos);
        return produtos[index];
    }

    deleteProduto(id) {
        let produtos = this.get('produtos') || [];
        produtos = produtos.filter(p => p.id !== id);
        this.set('produtos', produtos);
        this.addLog('produto_deleted', null, { id });
    }

    deleteProdutosByUserId(userId) {
        let produtos = this.get('produtos') || [];
        produtos = produtos.filter(p => p.user_id !== userId);
        this.set('produtos', produtos);
    }

    // ==========================================
    // CRUD - PAGAMENTOS
    // ==========================================

    createPagamento(userId, pagamentoData) {
        const pagamentos = this.get('pagamentos') || [];

        const pagamento = {
            id: this.generateId(),
            user_id: userId,
            subscription_id: pagamentoData.subscription_id,
            valor: pagamentoData.valor,
            metodo: pagamentoData.metodo || 'cartao',
            status: 'pendente', // pendente, aprovado, recusado, estornado
            gateway_id: pagamentoData.gateway_id || null,
            gateway_response: pagamentoData.gateway_response || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        pagamentos.push(pagamento);
        this.set('pagamentos', pagamentos);

        return pagamento;
    }

    updatePagamento(id, data) {
        const pagamentos = this.get('pagamentos') || [];
        const index = pagamentos.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error('Pagamento não encontrado');
        }

        pagamentos[index] = {
            ...pagamentos[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        this.set('pagamentos', pagamentos);

        // Se pagamento aprovado, atualizar assinatura
        if (data.status === 'aprovado') {
            const pagamento = pagamentos[index];
            const subscription = this.getSubscriptionByUserId(pagamento.user_id);
            if (subscription) {
                this.updateSubscription(subscription.id, {
                    status: CONFIG.STATUS_ASSINATURA.ATIVO,
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
                this.updateUser(pagamento.user_id, { status: 'ativo' });
            }
            this.addLog('pagamento_aprovado', pagamento.user_id, { valor: pagamento.valor });
        }

        return pagamentos[index];
    }

    getPagamentosByUserId(userId) {
        const pagamentos = this.get('pagamentos') || [];
        return pagamentos.filter(p => p.user_id === userId).sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
    }

    getAllPagamentos() {
        return this.get('pagamentos') || [];
    }

    // ==========================================
    // LOGS E AUDITORIA
    // ==========================================

    addLog(action, userId, data = {}) {
        const logs = this.get('logs') || [];

        const log = {
            id: this.generateId(),
            action,
            user_id: userId,
            data,
            ip: 'localhost', // Em produção, capturar IP real
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
        };

        logs.push(log);

        // Manter apenas últimos 1000 logs
        if (logs.length > 1000) {
            logs.shift();
        }

        this.set('logs', logs);
    }

    getLogs(filters = {}) {
        let logs = this.get('logs') || [];

        if (filters.user_id) {
            logs = logs.filter(l => l.user_id === filters.user_id);
        }

        if (filters.action) {
            logs = logs.filter(l => l.action === filters.action);
        }

        return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // ==========================================
    // EMAIL QUEUE
    // ==========================================

    queueEmail(tipo, userId, data = {}) {
        const queue = this.get('emails_queue') || [];
        const user = this.getUserById(userId);

        if (!user) return;

        const email = {
            id: this.generateId(),
            tipo,
            user_id: userId,
            email_to: user.email,
            data,
            status: 'pendente',
            attempts: 0,
            created_at: new Date().toISOString()
        };

        queue.push(email);
        this.set('emails_queue', queue);

        // Simular envio (em produção, usar serviço real)
        this.processEmailQueue();
    }

    processEmailQueue() {
        const queue = this.get('emails_queue') || [];
        
        queue.forEach((email, index) => {
            if (email.status === 'pendente') {
                // Simular envio
                console.log(`📧 Email enviado: ${email.tipo} para ${email.email_to}`);
                queue[index].status = 'enviado';
                queue[index].sent_at = new Date().toISOString();
            }
        });

        this.set('emails_queue', queue);
    }

    // ==========================================
    // ESTATÍSTICAS E RELATÓRIOS
    // ==========================================

    getStats() {
        const users = this.getAllUsers().filter(u => u.role !== 'admin');
        const subscriptions = this.getAllSubscriptions();
        const pagamentos = this.getAllPagamentos();
        const vitrines = this.getAllVitrines();

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        return {
            totalUsuarios: users.length,
            usuariosAtivos: users.filter(u => u.status === 'ativo').length,
            usuariosTrial: subscriptions.filter(s => s.status === 'trial').length,
            usuariosInadimplentes: users.filter(u => u.status === 'inadimplente').length,
            
            totalVitrines: vitrines.length,
            vitrinesPublicadas: vitrines.filter(v => v.publicada).length,
            
            receitaMensal: pagamentos
                .filter(p => p.status === 'aprovado' && new Date(p.created_at) >= inicioMes)
                .reduce((sum, p) => sum + p.valor, 0),
            
            receitaTotal: pagamentos
                .filter(p => p.status === 'aprovado')
                .reduce((sum, p) => sum + p.valor, 0),

            assinaturasPorPlano: {
                basico: subscriptions.filter(s => s.plano_id === 'basico' && s.status !== 'cancelado').length,
                profissional: subscriptions.filter(s => s.plano_id === 'profissional' && s.status !== 'cancelado').length,
                premium: subscriptions.filter(s => s.plano_id === 'premium' && s.status !== 'cancelado').length
            }
        };
    }

    // ==========================================
    // RESET DATABASE (apenas para desenvolvimento)
    // ==========================================

    reset() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
        keys.forEach(k => localStorage.removeItem(k));
        this.initDatabase();
        console.log('Database reset');
    }
}

// Instância global do banco de dados
const db = new Database();
