-- ============================================
-- Vitrine do Vendedor - Schema do Banco
-- Execute isso no Supabase SQL Editor
-- ============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de vitrines
CREATE TABLE IF NOT EXISTS vitrines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#e63946',
    whatsapp VARCHAR(20),
    instagram VARCHAR(100),
    address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(2),
    is_active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos (motos)
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    vitrine_id INTEGER REFERENCES vitrines(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    year INTEGER,
    km INTEGER,
    color VARCHAR(50),
    image_url VARCHAR(500),
    images TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vitrines_slug ON vitrines(slug);
CREATE INDEX IF NOT EXISTS idx_vitrines_user ON vitrines(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_vitrine ON produtos(vitrine_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Habilitar RLS (Row Level Security) - Opcional mas recomendado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitrines ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura
CREATE POLICY "Vitrines públicas" ON vitrines FOR SELECT USING (is_active = true);
CREATE POLICY "Produtos públicos" ON produtos FOR SELECT USING (is_active = true);

-- Políticas para escrita via service key (API)
CREATE POLICY "API pode inserir users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "API pode ler users" ON users FOR SELECT USING (true);
CREATE POLICY "API pode inserir vitrines" ON vitrines FOR ALL USING (true);
CREATE POLICY "API pode inserir produtos" ON produtos FOR ALL USING (true);
