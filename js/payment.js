// ============================================
// Vitrine do Vendedor - SISTEMA DE PAGAMENTOS
// Integração simulada - substituir por gateway real
// ============================================

class PaymentService {
    constructor() {
        this.gateway = 'mercadopago'; // ou 'stripe'
    }

    // ==========================================
    // CRIAR ASSINATURA
    // ==========================================

    async createSubscription(userId, planoId, paymentData) {
        const user = db.getUserById(userId);
        const plano = CONFIG.PLANOS[planoId];

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        if (!plano) {
            throw new Error('Plano inválido');
        }

        try {
            // Simular processamento do pagamento
            const paymentResult = await this.processPayment({
                amount: plano.preco,
                currency: CONFIG.PAGAMENTO.MOEDA,
                customer_email: user.email,
                description: `Assinatura ${plano.nome} - Vitrine do Vendedor`,
                ...paymentData
            });

            if (paymentResult.status === 'approved') {
                // Criar assinatura no banco
                const subscription = db.createSubscription(userId, planoId);

                // Registrar pagamento
                const pagamento = db.createPagamento(userId, {
                    subscription_id: subscription.id,
                    valor: plano.preco,
                    metodo: paymentData.method || 'cartao',
                    gateway_id: paymentResult.id,
                    gateway_response: paymentResult
                });

                // Atualizar status do pagamento
                db.updatePagamento(pagamento.id, { status: 'aprovado' });

                // Enviar email de confirmação
                db.queueEmail(CONFIG.EMAIL.TEMPLATES.CONFIRMACAO_PAGAMENTO, userId, {
                    plano: plano.nome,
                    valor: plano.preco
                });

                return {
                    success: true,
                    message: 'Assinatura ativada com sucesso!',
                    subscription,
                    payment: paymentResult
                };
            } else {
                // Registrar pagamento recusado
                db.createPagamento(userId, {
                    valor: plano.preco,
                    metodo: paymentData.method || 'cartao',
                    gateway_id: paymentResult.id,
                    gateway_response: paymentResult,
                    status: 'recusado'
                });

                throw new Error(paymentResult.error || 'Pagamento não aprovado');
            }
        } catch (error) {
            db.addLog('payment_failed', userId, { error: error.message, plano: planoId });
            throw error;
        }
    }

    // ==========================================
    // PROCESSAR PAGAMENTO (SIMULAÇÃO)
    // ==========================================

    async processPayment(paymentData) {
        // Simular delay de processamento
        await this.delay(1500);

        // Em produção, aqui seria a chamada real ao gateway
        // Exemplo Mercado Pago:
        // const response = await fetch('https://api.mercadopago.com/v1/payments', {...});

        // Simular resposta do gateway
        const success = Math.random() > 0.1; // 90% de sucesso para demo

        if (success) {
            return {
                id: 'pay_' + Date.now(),
                status: 'approved',
                status_detail: 'accredited',
                payment_method_id: paymentData.method || 'credit_card',
                transaction_amount: paymentData.amount,
                currency_id: paymentData.currency,
                payer: {
                    email: paymentData.customer_email
                },
                date_created: new Date().toISOString(),
                date_approved: new Date().toISOString()
            };
        } else {
            return {
                id: 'pay_' + Date.now(),
                status: 'rejected',
                status_detail: 'cc_rejected_insufficient_amount',
                error: 'Pagamento recusado pela operadora'
            };
        }
    }

    // ==========================================
    // CANCELAR ASSINATURA
    // ==========================================

    async cancelSubscription(userId, reason = '') {
        const subscription = db.getSubscriptionByUserId(userId);

        if (!subscription) {
            throw new Error('Assinatura não encontrada');
        }

        // Cancelar no gateway (simulado)
        // Em produção: await this.cancelGatewaySubscription(subscription.gateway_subscription_id);

        db.cancelSubscription(userId);

        // Enviar email de cancelamento
        db.queueEmail(CONFIG.EMAIL.TEMPLATES.CANCELAMENTO, userId, { reason });

        db.addLog('subscription_cancelled', userId, { reason });

        return {
            success: true,
            message: 'Assinatura cancelada. Você ainda terá acesso até o fim do período pago.'
        };
    }

    // ==========================================
    // VERIFICAR STATUS DA ASSINATURA
    // ==========================================

    checkSubscriptionStatus(userId) {
        const subscription = db.getSubscriptionByUserId(userId);
        
        if (!subscription) {
            return { status: 'none', message: 'Nenhuma assinatura ativa' };
        }

        const now = new Date();
        const periodEnd = new Date(subscription.current_period_end);
        const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;

        // Verificar trial
        if (subscription.status === 'trial' && trialEnd && now > trialEnd) {
            db.updateSubscription(subscription.id, { status: 'inadimplente' });
            db.updateUser(userId, { status: 'inadimplente' });
            return { status: 'trial_expired', message: 'Período de teste expirado' };
        }

        // Verificar período pago
        if (now > periodEnd && subscription.status === 'ativo') {
            db.updateSubscription(subscription.id, { status: 'inadimplente' });
            db.updateUser(userId, { status: 'inadimplente' });
            
            // Enviar email de atraso
            db.queueEmail(CONFIG.EMAIL.TEMPLATES.PAGAMENTO_ATRASADO, userId);
            
            return { status: 'overdue', message: 'Pagamento em atraso' };
        }

        return {
            status: subscription.status,
            message: this.getStatusMessage(subscription.status),
            subscription
        };
    }

    getStatusMessage(status) {
        const messages = {
            trial: 'Período de teste ativo',
            ativo: 'Assinatura ativa',
            inadimplente: 'Pagamento pendente',
            cancelado: 'Assinatura cancelada',
            bloqueado: 'Assinatura bloqueada'
        };
        return messages[status] || 'Status desconhecido';
    }

    // ==========================================
    // RENOVAR ASSINATURA
    // ==========================================

    async renewSubscription(userId) {
        const subscription = db.getSubscriptionByUserId(userId);
        const user = db.getUserById(userId);

        if (!subscription) {
            throw new Error('Assinatura não encontrada');
        }

        const plano = CONFIG.PLANOS[subscription.plano_id];

        // Processar pagamento
        const paymentResult = await this.processPayment({
            amount: plano.preco,
            currency: CONFIG.PAGAMENTO.MOEDA,
            customer_email: user.email,
            description: `Renovação ${plano.nome} - Vitrine do Vendedor`
        });

        if (paymentResult.status === 'approved') {
            // Atualizar assinatura
            db.updateSubscription(subscription.id, {
                status: 'ativo',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            db.updateUser(userId, { status: 'ativo' });

            // Registrar pagamento
            const pagamento = db.createPagamento(userId, {
                subscription_id: subscription.id,
                valor: plano.preco,
                gateway_id: paymentResult.id,
                gateway_response: paymentResult
            });
            db.updatePagamento(pagamento.id, { status: 'aprovado' });

            // Email de confirmação
            db.queueEmail(CONFIG.EMAIL.TEMPLATES.CONFIRMACAO_PAGAMENTO, userId, {
                plano: plano.nome,
                valor: plano.preco
            });

            // Se vitrine estava bloqueada, reativar
            db.queueEmail(CONFIG.EMAIL.TEMPLATES.VITRINE_REATIVADA, userId);

            return {
                success: true,
                message: 'Assinatura renovada com sucesso!'
            };
        } else {
            throw new Error('Falha no pagamento de renovação');
        }
    }

    // ==========================================
    // MUDAR PLANO
    // ==========================================

    async changePlan(userId, newPlanoId) {
        const subscription = db.getSubscriptionByUserId(userId);
        const newPlano = CONFIG.PLANOS[newPlanoId];

        if (!subscription) {
            throw new Error('Assinatura não encontrada');
        }

        if (!newPlano) {
            throw new Error('Plano inválido');
        }

        // Calcular diferença de preço (upgrade/downgrade)
        const oldPlano = CONFIG.PLANOS[subscription.plano_id];
        const priceDiff = newPlano.preco - oldPlano.preco;

        if (priceDiff > 0) {
            // Upgrade - cobrar diferença
            const user = db.getUserById(userId);
            const paymentResult = await this.processPayment({
                amount: priceDiff,
                currency: CONFIG.PAGAMENTO.MOEDA,
                customer_email: user.email,
                description: `Upgrade para ${newPlano.nome} - Vitrine do Vendedor`
            });

            if (paymentResult.status !== 'approved') {
                throw new Error('Falha no pagamento do upgrade');
            }

            // Registrar pagamento
            const pagamento = db.createPagamento(userId, {
                subscription_id: subscription.id,
                valor: priceDiff,
                gateway_id: paymentResult.id,
                gateway_response: paymentResult
            });
            db.updatePagamento(pagamento.id, { status: 'aprovado' });
        }

        // Atualizar assinatura
        db.updateSubscription(subscription.id, {
            plano_id: newPlanoId,
            plano_nome: newPlano.nome,
            valor: newPlano.preco
        });

        db.updateUser(userId, { plano: newPlanoId });

        db.addLog('plan_changed', userId, { from: subscription.plano_id, to: newPlanoId });

        return {
            success: true,
            message: `Plano alterado para ${newPlano.nome} com sucesso!`
        };
    }

    // ==========================================
    // HISTÓRICO DE PAGAMENTOS
    // ==========================================

    getPaymentHistory(userId) {
        return db.getPagamentosByUserId(userId);
    }

    // ==========================================
    // GERAR BOLETO (SIMULAÇÃO)
    // ==========================================

    async generateBoleto(userId, planoId) {
        const plano = CONFIG.PLANOS[planoId];
        const user = db.getUserById(userId);

        // Simular geração de boleto
        await this.delay(1000);

        const boleto = {
            id: 'bol_' + Date.now(),
            barcode: '23793.38128 60000.000003 00000.000400 1 ' + (Date.now() % 10000000000),
            digitable_line: '23793381286000000000300000000401' + (Date.now() % 10000000000),
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias
            amount: plano.preco,
            status: 'pending'
        };

        db.addLog('boleto_generated', userId, { plano: planoId });

        return boleto;
    }

    // ==========================================
    // PIX (SIMULAÇÃO)
    // ==========================================

    async generatePix(userId, planoId) {
        const plano = CONFIG.PLANOS[planoId];
        const user = db.getUserById(userId);

        // Simular geração de PIX
        await this.delay(500);

        const pix = {
            id: 'pix_' + Date.now(),
            qr_code: `00020126580014br.gov.bcb.pix0136${Date.now()}5204000053039865406${plano.preco.toFixed(2)}5802BR`,
            qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // Placeholder
            copy_paste: `vitrinevendedor${Date.now()}@pix.com`,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
            amount: plano.preco,
            status: 'pending'
        };

        db.addLog('pix_generated', userId, { plano: planoId });

        return pix;
    }

    // ==========================================
    // WEBHOOK DE PAGAMENTO (SIMULAÇÃO)
    // ==========================================

    async handleWebhook(event, data) {
        console.log('Webhook recebido:', event, data);

        switch (event) {
            case 'payment.approved':
                await this.handlePaymentApproved(data);
                break;
            case 'payment.rejected':
                await this.handlePaymentRejected(data);
                break;
            case 'subscription.cancelled':
                await this.handleSubscriptionCancelled(data);
                break;
            default:
                console.log('Evento não tratado:', event);
        }
    }

    async handlePaymentApproved(data) {
        // Atualizar pagamento e assinatura
        const pagamentos = db.getAllPagamentos();
        const pagamento = pagamentos.find(p => p.gateway_id === data.payment_id);
        
        if (pagamento) {
            db.updatePagamento(pagamento.id, { status: 'aprovado' });
        }
    }

    async handlePaymentRejected(data) {
        const pagamentos = db.getAllPagamentos();
        const pagamento = pagamentos.find(p => p.gateway_id === data.payment_id);
        
        if (pagamento) {
            db.updatePagamento(pagamento.id, { status: 'recusado' });
        }
    }

    async handleSubscriptionCancelled(data) {
        // Processar cancelamento externo
        console.log('Assinatura cancelada externamente:', data);
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// Instância global
const payment = new PaymentService();
