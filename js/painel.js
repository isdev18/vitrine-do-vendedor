// ============================================
// Vitrine do Vendedor - PAINEL DO USUÁRIO
// ============================================

let currentUser = null;
let currentVitrine = null;
let currentProdutos = [];
let motoImagensTemp = [];

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!auth.requireAuth('login.html')) return;
    
    // Verificar se tem assinatura
    currentUser = auth.getFullCurrentUser();
    
    if (currentUser.role !== 'admin') {
        const subscription = db.getSubscriptionByUserId(currentUser.id);
        if (!subscription) {
            window.location.href = 'planos.html';
            return;
        }
        
        // Verificar status da assinatura
        const status = payment.checkSubscriptionStatus(currentUser.id);
        if (status.status === 'bloqueado') {
            alert('Sua assinatura está bloqueada. Regularize o pagamento para continuar.');
            window.location.href = 'planos.html';
            return;
        }
    }
    
    // Carregar dados
    loadUserData();
    loadVitrine();
    loadProdutos();
    setupEventListeners();
    updateStats();
});

// ==========================================
// CARREGAR DADOS
// ==========================================

function loadUserData() {
    currentUser = auth.getFullCurrentUser();
    
    // Atualizar header
    document.getElementById('userName').textContent = currentUser.nome || currentUser.email.split('@')[0];
    document.getElementById('userAvatar').textContent = (currentUser.nome || currentUser.email)[0].toUpperCase();
    document.getElementById('welcomeName').textContent = currentUser.nome || currentUser.email.split('@')[0];
    
    // Atualizar info do plano
    const subscription = db.getSubscriptionByUserId(currentUser.id);
    if (subscription) {
        updatePlanoInfo(subscription);
    }
}

function loadVitrine() {
    currentVitrine = db.getVitrineByUserId(currentUser.id);
    
    if (!currentVitrine) {
        currentVitrine = db.createVitrine(currentUser.id);
    }
    
    // Preencher formulário de perfil
    document.getElementById('nomeVendedor').value = currentVitrine.nome || '';
    document.getElementById('urlPersonalizada').value = currentVitrine.url_personalizada || '';
    document.getElementById('slogan').value = currentVitrine.slogan || '';
    document.getElementById('descricao').value = currentVitrine.descricao || '';
    
    // Preencher formulário de contatos
    document.getElementById('whatsapp').value = currentVitrine.whatsapp || '';
    document.getElementById('instagram').value = currentVitrine.instagram || '';
    document.getElementById('facebook').value = currentVitrine.facebook || '';
    document.getElementById('emailContato').value = currentVitrine.email_contato || '';
    document.getElementById('endereco').value = currentVitrine.endereco || '';
    
    // Preencher aparência
    if (currentVitrine.cor_tema) {
        const radioColor = document.querySelector(`input[name="corTema"][value="${currentVitrine.cor_tema}"]`);
        if (radioColor) {
            radioColor.checked = true;
        } else {
            document.getElementById('corPersonalizada').value = currentVitrine.cor_tema;
        }
    }
    
    // Atualizar previews de imagem
    if (currentVitrine.foto_perfil) {
        updateImagePreview('fotoPerfilPreview', currentVitrine.foto_perfil);
    }
    if (currentVitrine.banner) {
        updateImagePreview('bannerPreview', currentVitrine.banner);
    }
    
    // Atualizar URL da vitrine
    updateVitrineUrl();
    
    // Atualizar contadores
    updateCharCount('slogan', 'sloganCount');
    updateCharCount('descricao', 'descricaoCount');
    
    // Atualizar status de publicação
    updatePublishStatus();
}

function loadProdutos() {
    currentProdutos = db.getProdutosByUserId(currentUser.id);
    renderProdutos();
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================

function renderProdutos() {
    const container = document.getElementById('motosLista');
    const emptyState = document.getElementById('emptyMotos');
    
    if (currentProdutos.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = currentProdutos.map(produto => `
        <div class="moto-card" data-id="${produto.id}">
            <div class="moto-image">
                ${produto.imagens && produto.imagens.length > 0 
                    ? `<img src="${produto.imagens[0]}" alt="${produto.nome}">`
                    : `<div class="moto-placeholder">🏍️</div>`
                }
                ${produto.destaque ? '<span class="moto-badge">⭐ Destaque</span>' : ''}
            </div>
            <div class="moto-info">
                <h4>${produto.nome}</h4>
                <p class="moto-categoria">${getCategoriaLabel(produto.categoria)}</p>
                <p class="moto-preco">${produto.preco || 'Consulte'}</p>
            </div>
            <div class="moto-actions">
                <button class="btn btn-sm btn-outline" onclick="editarMoto('${produto.id}')">✏️ Editar</button>
                <button class="btn btn-sm btn-danger-outline" onclick="excluirMoto('${produto.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function getCategoriaLabel(categoria) {
    const cat = CONFIG.CATEGORIAS_MOTOS.find(c => c.id === categoria);
    return cat ? `${cat.icone} ${cat.nome}` : '';
}

// ==========================================
// ESTATÍSTICAS
// ==========================================

function updateStats() {
    if (currentVitrine) {
        document.getElementById('statVisualizacoes').textContent = currentVitrine.visualizacoes || 0;
    }
    document.getElementById('statMotos').textContent = currentProdutos.length;
    
    // Calcular dias de assinatura
    const subscription = db.getSubscriptionByUserId(currentUser.id);
    if (subscription) {
        const endDate = new Date(subscription.current_period_end);
        const today = new Date();
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        document.getElementById('statDias').textContent = Math.max(0, daysLeft);
    }
}

function updatePlanoInfo(subscription) {
    const planoInfo = document.getElementById('planoInfo');
    const badge = planoInfo.querySelector('.plano-badge');
    const dias = planoInfo.querySelector('.plano-dias');
    
    badge.textContent = subscription.plano_nome;
    badge.className = 'plano-badge ' + subscription.status;
    
    if (subscription.status === 'trial') {
        const trialEnd = new Date(subscription.trial_ends_at);
        const today = new Date();
        const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
        dias.textContent = `${Math.max(0, daysLeft)} dias de teste`;
    } else {
        const periodEnd = new Date(subscription.current_period_end);
        const today = new Date();
        const daysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));
        dias.textContent = `Renova em ${Math.max(0, daysLeft)} dias`;
    }
}

// ==========================================
// NAVEGAÇÃO
// ==========================================

function showTab(tabId) {
    // Remover active de todos
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    // Adicionar active ao selecionado
    document.getElementById('tab-' + tabId)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabId}"]`)?.classList.add('active');
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Navegação sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            showTab(this.dataset.tab);
        });
    });
    
    // Menu do usuário
    document.getElementById('userMenuBtn').addEventListener('click', function() {
        document.getElementById('userDropdown').classList.toggle('active');
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
    });
    
    // Formulário de perfil
    document.getElementById('perfilForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarPerfil();
    });
    
    // Formulário de contatos
    document.getElementById('contatosForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarContatos();
    });
    
    // Formulário de aparência
    document.getElementById('aparenciaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarAparencia();
    });
    
    // Formulário de senha
    document.getElementById('senhaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await alterarSenha();
    });
    
    // Formulário de moto
    document.getElementById('motoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarMoto();
    });
    
    // Contadores de caracteres
    document.getElementById('slogan').addEventListener('input', function() {
        updateCharCount('slogan', 'sloganCount');
    });
    
    document.getElementById('descricao').addEventListener('input', function() {
        updateCharCount('descricao', 'descricaoCount');
    });
    
    // URL personalizada - formatar
    document.getElementById('urlPersonalizada').addEventListener('input', function() {
        this.value = this.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        updateVitrineUrl();
    });
    
    // Cor personalizada
    document.getElementById('corPersonalizada').addEventListener('input', function() {
        document.querySelectorAll('input[name="corTema"]').forEach(r => r.checked = false);
    });
}

// ==========================================
// SALVAR DADOS
// ==========================================

function salvarPerfil() {
    try {
        const data = {
            nome: document.getElementById('nomeVendedor').value,
            url_personalizada: document.getElementById('urlPersonalizada').value,
            slogan: document.getElementById('slogan').value,
            descricao: document.getElementById('descricao').value
        };
        
        // Validar URL
        if (!data.url_personalizada) {
            throw new Error('URL personalizada é obrigatória');
        }
        
        db.updateVitrine(currentUser.id, data);
        currentVitrine = db.getVitrineByUserId(currentUser.id);
        
        updateVitrineUrl();
        showToast('Perfil salvo com sucesso!');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function salvarContatos() {
    try {
        const data = {
            whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
            instagram: document.getElementById('instagram').value.replace('@', ''),
            facebook: document.getElementById('facebook').value,
            email_contato: document.getElementById('emailContato').value,
            endereco: document.getElementById('endereco').value
        };
        
        db.updateVitrine(currentUser.id, data);
        currentVitrine = db.getVitrineByUserId(currentUser.id);
        
        showToast('Contatos salvos com sucesso!');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function salvarAparencia() {
    try {
        let corTema = document.querySelector('input[name="corTema"]:checked')?.value;
        
        if (!corTema) {
            corTema = document.getElementById('corPersonalizada').value;
        }
        
        db.updateVitrine(currentUser.id, { cor_tema: corTema });
        currentVitrine = db.getVitrineByUserId(currentUser.id);
        
        showToast('Aparência salva com sucesso!');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function alterarSenha() {
    try {
        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmar = document.getElementById('confirmarNovaSenha').value;
        
        await auth.changePassword(senhaAtual, novaSenha, confirmar);
        
        document.getElementById('senhaForm').reset();
        showToast('Senha alterada com sucesso!');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// MOTOS
// ==========================================

function openMotoModal(motoId = null) {
    const modal = document.getElementById('motoModal');
    const title = document.getElementById('motoModalTitle');
    const form = document.getElementById('motoForm');
    
    motoImagensTemp = [];
    form.reset();
    document.getElementById('motoId').value = '';
    
    // Limpar grid de imagens
    const grid = document.getElementById('motoImagensGrid');
    grid.innerHTML = `
        <div class="image-upload-item add-image" onclick="document.getElementById('motoImagens').click()">
            <span>➕</span>
            <small>Adicionar</small>
        </div>
    `;
    
    if (motoId) {
        const moto = currentProdutos.find(p => p.id === motoId);
        if (moto) {
            title.textContent = 'Editar Moto';
            document.getElementById('motoId').value = moto.id;
            document.getElementById('motoNome').value = moto.nome;
            document.getElementById('motoCategoria').value = moto.categoria || '';
            document.getElementById('motoPreco').value = moto.preco || '';
            document.getElementById('motoAno').value = moto.ano || '';
            document.getElementById('motoDescricao').value = moto.descricao || '';
            document.getElementById('motoDestaque').checked = moto.destaque || false;
            
            // Carregar imagens existentes
            if (moto.imagens && moto.imagens.length > 0) {
                motoImagensTemp = [...moto.imagens];
                renderMotoImagens();
            }
        }
    } else {
        title.textContent = 'Adicionar Moto';
    }
    
    modal.classList.add('active');
}

function closeMotoModal() {
    document.getElementById('motoModal').classList.remove('active');
    motoImagensTemp = [];
}

function salvarMoto() {
    try {
        const motoId = document.getElementById('motoId').value;
        
        const data = {
            nome: document.getElementById('motoNome').value,
            categoria: document.getElementById('motoCategoria').value,
            preco: document.getElementById('motoPreco').value,
            ano: document.getElementById('motoAno').value,
            descricao: document.getElementById('motoDescricao').value,
            destaque: document.getElementById('motoDestaque').checked,
            imagens: motoImagensTemp
        };
        
        if (!data.nome) {
            throw new Error('Nome da moto é obrigatório');
        }
        
        if (motoId) {
            db.updateProduto(motoId, data);
            showToast('Moto atualizada com sucesso!');
        } else {
            db.createProduto(currentUser.id, data);
            showToast('Moto adicionada com sucesso!');
        }
        
        loadProdutos();
        updateStats();
        closeMotoModal();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function editarMoto(motoId) {
    openMotoModal(motoId);
}

function excluirMoto(motoId) {
    if (confirm('Tem certeza que deseja excluir esta moto?')) {
        db.deleteProduto(motoId);
        loadProdutos();
        updateStats();
        showToast('Moto excluída com sucesso!');
    }
}

function previewMotoImages(input) {
    if (input.files) {
        Array.from(input.files).forEach(file => {
            if (motoImagensTemp.length >= 5) {
                showToast('Máximo de 5 imagens por moto', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                motoImagensTemp.push(e.target.result);
                renderMotoImagens();
            };
            reader.readAsDataURL(file);
        });
    }
    input.value = '';
}

function renderMotoImagens() {
    const grid = document.getElementById('motoImagensGrid');
    
    let html = motoImagensTemp.map((img, index) => `
        <div class="image-upload-item has-image">
            <img src="${img}" alt="Imagem ${index + 1}">
            <button type="button" class="remove-image" onclick="removeMotoImage(${index})">✕</button>
        </div>
    `).join('');
    
    if (motoImagensTemp.length < 5) {
        html += `
            <div class="image-upload-item add-image" onclick="document.getElementById('motoImagens').click()">
                <span>➕</span>
                <small>Adicionar</small>
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

function removeMotoImage(index) {
    motoImagensTemp.splice(index, 1);
    renderMotoImagens();
}

function addImageByUrl() {
    const urlInput = document.getElementById('motoImagemUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Digite uma URL de imagem', 'error');
        return;
    }
    
    // Validar se é uma URL válida
    try {
        new URL(url);
    } catch (e) {
        showToast('URL inválida', 'error');
        return;
    }
    
    if (motoImagensTemp.length >= 5) {
        showToast('Máximo de 5 imagens por moto', 'error');
        return;
    }
    
    // Verificar se a imagem carrega corretamente
    const img = new Image();
    img.onload = function() {
        motoImagensTemp.push(url);
        renderMotoImagens();
        urlInput.value = '';
        showToast('Imagem adicionada!');
    };
    img.onerror = function() {
        showToast('Não foi possível carregar a imagem. Verifique a URL.', 'error');
    };
    img.src = url;
}

// ==========================================
// ASSINATURA
// ==========================================

async function cancelarAssinatura() {
    if (confirm('Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso até o fim do período pago.')) {
        try {
            await payment.cancelSubscription(currentUser.id, 'Cancelamento solicitado pelo usuário');
            showToast('Assinatura cancelada');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}

function excluirConta() {
    if (confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os seus dados serão apagados permanentemente.\n\nDeseja continuar?')) {
        if (confirm('Última chance: tem CERTEZA que deseja excluir sua conta?')) {
            db.deleteUser(currentUser.id);
            auth.logout();
        }
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function updateVitrineUrl() {
    const url = document.getElementById('urlPersonalizada').value;
    // Se tem URL personalizada, usa ela. Senão, usa o userId para carregar a vitrine do usuário
    const userId = currentUser ? currentUser.id : '';
    const fullUrl = url ? `vitrine.html?v=${url}` : `vitrine.html?userId=${userId}`;
    const displayUrl = url ? `${window.location.origin}/vitrine.html?v=${url}` : `${window.location.origin}/vitrine.html?userId=${userId}`;
    
    document.getElementById('vitrineUrl').value = displayUrl;
    document.getElementById('previewBtn').href = fullUrl;
    document.getElementById('vitrineLink').href = fullUrl;
    
    if (document.getElementById('shareUrl')) {
        document.getElementById('shareUrl').value = displayUrl;
    }
}

function copyVitrineLink() {
    const url = document.getElementById('vitrineUrl').value;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copiado!');
    });
}

function compartilharVitrine() {
    const url = document.getElementById('vitrineUrl').value;
    const text = `Confira minha vitrine de motos Honda: ${url}`;
    
    document.getElementById('shareUrl').value = url;
    document.getElementById('shareWhatsapp').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    openModal('compartilharModal');
}

function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            updateImagePreview(previewId, e.target.result);
            
            // Salvar no banco
            const field = input.id === 'fotoPerfil' ? 'foto_perfil' : 'banner';
            db.updateVitrine(currentUser.id, { [field]: e.target.result });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateImagePreview(previewId, src) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = `<img src="${src}" alt="Preview">`;
    preview.classList.add('has-image');
}

function updateCharCount(inputId, countId) {
    const input = document.getElementById(inputId);
    const count = document.getElementById(countId);
    count.textContent = input.value.length;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const msg = toast.querySelector('.toast-message');
    
    icon.textContent = type === 'success' ? '✓' : '✕';
    msg.textContent = message;
    toast.className = 'toast ' + type + ' active';
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ==========================================
// PUBLICAÇÃO DA VITRINE
// ==========================================

function updatePublishStatus() {
    const card = document.getElementById('vitrineStatusCard');
    const icon = document.getElementById('statusIcon');
    const title = document.getElementById('statusTitle');
    const desc = document.getElementById('statusDesc');
    const btn = document.getElementById('btnPublicar');
    
    if (!currentVitrine) return;
    
    // Verificar requisitos mínimos para publicar
    const canPublish = currentVitrine.nome && currentVitrine.url_personalizada;
    
    if (currentVitrine.publicada) {
        // Vitrine publicada
        card.classList.add('published');
        icon.textContent = '✅';
        title.textContent = 'Vitrine publicada';
        desc.textContent = 'Sua vitrine está visível para todos! Clientes podem encontrá-la pelo link.';
        btn.textContent = '🔒 Despublicar';
        btn.classList.add('unpublish');
    } else {
        // Vitrine não publicada
        card.classList.remove('published');
        icon.textContent = '🔒';
        btn.classList.remove('unpublish');
        
        if (canPublish) {
            title.textContent = 'Vitrine pronta para publicar';
            desc.textContent = 'Sua vitrine está configurada! Publique para que clientes possam encontrá-la.';
            btn.textContent = '🚀 Publicar Vitrine';
            btn.disabled = false;
        } else {
            title.textContent = 'Complete sua vitrine';
            desc.textContent = 'Preencha o nome e a URL personalizada no seu perfil para poder publicar.';
            btn.textContent = '⚙️ Configurar Perfil';
            btn.disabled = false;
        }
    }
}

function togglePublicarVitrine() {
    if (!currentVitrine) return;
    
    // Verificar requisitos mínimos
    const canPublish = currentVitrine.nome && currentVitrine.url_personalizada;
    
    if (!canPublish) {
        // Redirecionar para aba de perfil
        showTab('perfil');
        showToast('Preencha o nome e URL personalizada para publicar', 'error');
        return;
    }
    
    try {
        if (currentVitrine.publicada) {
            // Despublicar
            if (confirm('Tem certeza que deseja despublicar sua vitrine? Ela não ficará mais visível para clientes.')) {
                db.updateVitrine(currentUser.id, { publicada: false });
                currentVitrine.publicada = false;
                showToast('Vitrine despublicada!', 'success');
            }
        } else {
            // Publicar
            db.updateVitrine(currentUser.id, { publicada: true });
            currentVitrine.publicada = true;
            showToast('🎉 Vitrine publicada com sucesso!', 'success');
        }
        
        updatePublishStatus();
    } catch (error) {
        showToast('Erro ao atualizar vitrine: ' + error.message, 'error');
    }
}
