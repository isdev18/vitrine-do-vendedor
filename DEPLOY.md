# 🚀 GUIA DE DEPLOY - Vitrine do Vendedor

## Passo a Passo para Colocar no Ar

---

## 📋 PASSO 1: Criar conta no GitHub (se não tiver)

1. Acesse: https://github.com
2. Clique em "Sign up"
3. Complete o cadastro

---

## 📤 PASSO 2: Subir código para o GitHub

### No VS Code (mais fácil):
1. Clique no ícone do Git na barra lateral (terceiro ícone)
2. Clique em "Initialize Repository"
3. Digite uma mensagem: "Versão inicial"
4. Clique em "Commit"
5. Clique em "Publish Branch"
6. Escolha "Public" ou "Private"

### Ou pelo terminal:
```bash
cd c:\Users\Usuario\OneDrive\Desktop\vandasHonda
git init
git add .
git commit -m "Versão inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/vitrine-do-vendedor.git
git push -u origin main
```

---

## 🎨 PASSO 3: Deploy do Frontend (Vercel - GRÁTIS)

1. Acesse: https://vercel.com
2. Clique em "Sign Up" → "Continue with GitHub"
3. Autorize o Vercel
4. Clique em "Add New Project"
5. Selecione o repositório "vitrine-do-vendedor"
6. Em "Root Directory" deixe vazio (ou selecione a raiz)
7. Clique em "Deploy"

**Pronto! Em 1-2 minutos seu site estará no ar!**

URL será algo como: `https://vitrine-do-vendedor.vercel.app`

---

## 🗄️ PASSO 4: Banco de Dados (Supabase - GRÁTIS)

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Login com GitHub
4. Clique em "New Project"
5. Escolha:
   - Organization: Sua conta
   - Name: `vitrine-do-vendedor`
   - Database Password: **GUARDE ESSA SENHA!**
   - Region: `South America (São Paulo)`
6. Clique em "Create new project"
7. Aguarde 2 minutos
8. Vá em "Settings" → "Database"
9. Copie a "Connection string (URI)"
   - Será algo como: `postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres`

---

## ⚙️ PASSO 5: Deploy do Backend (Railway - GRÁTIS até $5/mês)

1. Acesse: https://railway.app
2. Clique em "Login" → "Login with GitHub"
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Selecione seu repositório
6. **IMPORTANTE**: Mude o Root Directory para `backend`
7. Clique em "Add variables" e adicione:

```
SECRET_KEY=gere-uma-chave-secreta-longa-aqui-123456789
JWT_SECRET_KEY=outra-chave-secreta-diferente-987654321
DATABASE_URL=postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres
FRONTEND_URL=https://vitrine-do-vendedor.vercel.app
```

8. Clique em "Deploy"
9. Vá em "Settings" → "Networking" → "Generate Domain"
10. Copie a URL gerada (ex: `https://vitrine-do-vendedor-production.up.railway.app`)

---

## 🔗 PASSO 6: Conectar Frontend ao Backend

1. Abra o arquivo `js/config.js`
2. Altere:
```javascript
API_URL: IS_PRODUCTION 
    ? 'https://vitrine-do-vendedor-production.up.railway.app'  // Sua URL do Railway
    : 'http://localhost:8000',

USE_API: true,  // Mude para true
```

3. Commit e push:
```bash
git add .
git commit -m "Conectar ao backend"
git push
```

4. O Vercel vai fazer deploy automático!

---

## 🌐 PASSO 7: Domínio Próprio (Opcional - ~R$40/ano)

### Registrar domínio:
1. Acesse: https://registro.br
2. Pesquise: `vitrinevendedor.com.br`
3. Se disponível, registre (~R$40/ano)

### Configurar no Vercel:
1. No Vercel, vá em "Settings" → "Domains"
2. Digite seu domínio: `vitrinevendedor.com.br`
3. Siga as instruções para configurar DNS

---

## ✅ CHECKLIST FINAL

- [ ] Código no GitHub
- [ ] Frontend no Vercel
- [ ] Banco no Supabase
- [ ] Backend no Railway
- [ ] CONFIG.USE_API = true
- [ ] Testou login/cadastro
- [ ] Testou criar vitrine
- [ ] Testou adicionar moto
- [ ] (Opcional) Domínio próprio

---

## 🆘 Problemas Comuns

### "CORS Error"
→ Verifique se FRONTEND_URL no Railway está correto

### "Database connection failed"
→ Verifique se DATABASE_URL está correta e a senha não tem caracteres especiais

### "Build failed" no Railway
→ Verifique se o Root Directory está como `backend`

### Site não atualiza
→ Limpe o cache do navegador (Ctrl+Shift+R)

---

## 💰 Custos

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | GRÁTIS |
| Supabase | Free | GRÁTIS |
| Railway | Starter | GRÁTIS até $5/mês |
| Domínio .com.br | Anual | ~R$40/ano |

**Total mensal: R$0 a R$25** (dependendo do uso)

---

## 📞 Suporte

Se tiver problemas, me avise que te ajudo!
