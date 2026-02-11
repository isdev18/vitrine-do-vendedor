// Função utilitária segura para fetch com tratamento robusto de JSON
async function safeFetch(url, options = {}) {
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
}

window.safeFetch = safeFetch;



const API_URL = "https://script.google.com/macros/s/AKfycby-O3qW3rTh9krtf2-bru9VH1z3SS3OyDiFRxAfTahlGuanAktj1_3nzPQjtmCPn2Z5/exec";

/**
 * Envia requisição POST para a API Google Apps Script
 * @param {string} acao - Ação da API (register, login, criar_vitrine, nova_moto, listar_motos)
 * @param {object} dados - Dados a serem enviados
 * @returns {Promise<object>} - Resposta da API
 */
async function apiPost(acao, dados = {}) {
    const payload = { acao, ...dados };
    console.log("Enviando para API:", API_URL, payload);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache"
            },
            body: JSON.stringify(payload)
        });

        console.log("Status da resposta:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error("Erro na resposta:", text);
            throw new Error(`Erro API: ${response.status} - ${text}`);
        }

        const result = await response.json();
        console.log("Resposta da API:", result);
        return result;
    } catch (error) {
        console.error("Erro ao enviar para API:", error);
        throw error;
        
    }
}

// Funções específicas


// Função de registro padronizada: sempre usa backend Flask
async function register(dados) {
    try {
        const result = await safeFetch(CONFIG.API.AUTH.REGISTER || '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!result || typeof result !== 'object' || result.status !== 'ok') {
            throw new Error(result && result.msg ? result.msg : 'Erro ao cadastrar');
        }
        return result;
    } catch (err) {
        throw new Error(err.message || 'Erro ao cadastrar');
    }
}

function login(dados) {
    return apiPost("login", dados);
}

function criarVitrine(dados) {
    return apiPost("criar_vitrine", dados);
}

function adicionarMoto(dados) {
    return apiPost("nova_moto", dados);
}

function listarMotos(dados = {}) {
    return apiPost("listar_motos", dados);
}

window.apiPost = apiPost;
window.register = register;
window.login = login;
window.criarVitrine = criarVitrine;
window.adicionarMoto = adicionarMoto;
window.listarMotos = listarMotos;
