// ============================================
// Vitrine do Vendedor - GERENCIADOR DE TEMA
// ============================================

const themeManager = {
    // Chave do localStorage
    storageKey: 'vh_theme',
    
    // Inicializar tema
    init() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.setTheme(savedTheme, false);
        } else if (prefersDark) {
            this.setTheme('dark', false);
        } else {
            this.setTheme('light', false);
        }
        
        // Observar mudanças de preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    },
    
    // Definir tema
    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem(this.storageKey, theme);
        }
    },
    
    // Obter tema atual
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },
    
    // Alternar tema
    toggle() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Feedback visual no botão (se existir)
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.style.transform = 'scale(1.2) rotate(180deg)';
            setTimeout(() => {
                toggle.style.transform = '';
            }, 300);
        }
        
        return newTheme;
    },
    
    // Verificar se é tema escuro
    isDark() {
        return this.getTheme() === 'dark';
    }
};

// Função global para toggle (usada em onclick)
function toggleTheme() {
    return themeManager.toggle();
}

// Inicializar imediatamente para evitar flash
themeManager.init();
