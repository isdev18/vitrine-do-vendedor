# Vitrine do Vendedor - Backend API

Backend completo em Python/FastAPI para o sistema Vitrine do Vendedor - SaaS de vitrines online para vendedores de motos.

## 📋 Funcionalidades

- **Autenticação JWT** - Registro, login, recuperação de senha
- **Vitrines** - CRUD completo de vitrines personalizadas
- **Produtos** - Gerenciamento de motos/produtos
- **Assinaturas** - Sistema de planos e pagamentos
- **Emails Automáticos** - Sistema de notificações e cobranças
- **Admin** - Painel administrativo completo

## 🛠️ Tecnologias

- **FastAPI** - Framework web moderno e performático
- **SQLAlchemy 2.0** - ORM com suporte async
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via tokens
- **Alembic** - Migrações de banco de dados
- **APScheduler** - Tarefas agendadas
- **Jinja2** - Templates de email

## 📦 Instalação

### Pré-requisitos

- Python 3.10+
- PostgreSQL 14+
- pip ou pipenv

### Passos

1. **Clonar o repositório e acessar a pasta backend:**
```bash
cd backend
```

2. **Criar ambiente virtual:**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

4. **Configurar variáveis de ambiente:**
```bash
# Copiar arquivo de exemplo
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Editar o arquivo .env com suas configurações
```

5. **Criar banco de dados PostgreSQL:**
```sql
CREATE DATABASE vitrine_honda;
```

6. **Executar migrações:**
```bash
alembic upgrade head
```

7. **Iniciar o servidor:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Banco de dados
DATABASE_URL=postgresql+asyncpg://usuario:senha@localhost:5432/vitrine_honda

# JWT
JWT_SECRET_KEY=sua-chave-secreta-aqui
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM_NAME=Vitrine do Vendedor
SMTP_FROM_EMAIL=noreply@vitrinevendedor.com.br

# Frontend URL (para links nos emails)
FRONTEND_URL=http://localhost:5500

# Ambiente
DEBUG=True
```

### Configuração de Email (Gmail)

1. Ative a verificação em duas etapas na sua conta Google
2. Crie uma "Senha de App" em: https://myaccount.google.com/apppasswords
3. Use essa senha no `SMTP_PASSWORD`

## 📚 Documentação da API

Com o servidor rodando, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🗂️ Estrutura do Projeto

```
backend/
├── alembic/              # Migrações de banco
│   ├── versions/         # Arquivos de migração
│   └── env.py
├── app/
│   ├── main.py          # Ponto de entrada
│   ├── config.py        # Configurações
│   ├── database.py      # Conexão com banco
│   ├── models/          # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── subscription.py
│   │   ├── vitrine.py
│   │   ├── produto.py
│   │   ├── contato.py
│   │   ├── pagamento.py
│   │   └── email_log.py
│   ├── schemas/         # Schemas Pydantic
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── vitrine.py
│   │   ├── produto.py
│   │   └── subscription.py
│   ├── routes/          # Endpoints da API
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── vitrine.py
│   │   ├── produtos.py
│   │   ├── subscription.py
│   │   └── admin.py
│   ├── services/        # Lógica de negócio
│   │   ├── auth_service.py
│   │   ├── email_service.py
│   │   ├── subscription_service.py
│   │   └── vitrine_service.py
│   ├── middleware/      # Middlewares
│   │   └── auth_middleware.py
│   ├── utils/           # Utilitários
│   │   ├── security.py
│   │   └── helpers.py
│   ├── tasks/           # Tarefas agendadas
│   │   ├── scheduler.py
│   │   └── billing_tasks.py
│   └── templates/       # Templates de email
│       └── emails/
├── requirements.txt
├── alembic.ini
├── .env.example
└── README.md
```

## 🔐 Endpoints Principais

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Dados do usuário atual |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha |
| POST | `/api/auth/reset-password` | Resetar senha |

### Vitrine
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/vitrine` | Criar vitrine |
| GET | `/api/vitrine` | Obter minha vitrine |
| PUT | `/api/vitrine` | Atualizar vitrine |
| GET | `/api/vitrine/public/{slug}` | Vitrine pública |

### Produtos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/products` | Listar produtos |
| POST | `/api/products` | Criar produto |
| GET | `/api/products/{id}` | Obter produto |
| PUT | `/api/products/{id}` | Atualizar produto |
| DELETE | `/api/products/{id}` | Excluir produto |

### Assinatura
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/subscription/status` | Status da assinatura |
| GET | `/api/subscription/plans` | Listar planos |
| POST | `/api/subscription/payment` | Registrar pagamento |

## 💰 Planos Disponíveis

| Plano | Preço | Produtos |
|-------|-------|----------|
| Básico | R$ 49,90/mês | Até 10 |
| Profissional | R$ 89,90/mês | Até 50 |
| Premium | R$ 149,90/mês | Ilimitado |

## 📧 Sistema de Emails Automáticos

O sistema envia automaticamente:

- **Boas-vindas** - Após o cadastro
- **Confirmação de pagamento** - Após pagamento aprovado
- **Lembrete de pagamento** - 3 dias antes do vencimento
- **Aviso de vencimento** - No dia do vencimento
- **Pagamento em atraso** - Após vencimento
- **Conta bloqueada** - Após 7 dias de atraso
- **Conta reativada** - Após regularização
- **Trial expirando** - 3 dias antes do fim do trial

## 🧪 Testes

```bash
# Instalar dependências de teste
pip install pytest pytest-asyncio httpx

# Executar testes
pytest
```

## 🚀 Deploy em Produção

### Com Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Com Gunicorn

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## 📄 Licença

Proprietário - Todos os direitos reservados.

## 👥 Suporte

- Email: suporte@vitrinevendedor.com.br
- Documentação: http://localhost:8000/docs
