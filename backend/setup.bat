@echo off
echo ================================
echo Vitrine do Vendedor - SETUP BACKEND
echo ================================
echo.

cd /d %~dp0

echo [1/5] Removendo venv antigo...
if exist venv (
    rmdir /s /q venv 2>nul
)

echo [2/5] Criando ambiente virtual...
python -m venv venv

echo [3/5] Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo [4/5] Instalando dependencias...
pip install fastapi==0.109.0 uvicorn[standard]==0.27.0 sqlalchemy==2.0.25 alembic==1.13.1 asyncpg==0.29.0 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 python-multipart==0.0.6 pydantic==2.5.3 pydantic-settings==2.1.0 email-validator==2.1.0 aiosmtplib==3.0.1 jinja2==3.1.3 apscheduler==3.10.4 python-dotenv==1.0.0 python-slugify==8.0.1 httpx==0.26.0 Pillow==10.2.0 loguru==0.7.2 aiosqlite==0.20.0

echo [5/5] Verificando instalacao...
python -c "from dotenv import dotenv_values; print('python-dotenv OK')"
python -c "from fastapi import FastAPI; print('FastAPI OK')"
python -c "from sqlalchemy import create_engine; print('SQLAlchemy OK')"

echo.
echo ================================
echo INSTALACAO CONCLUIDA!
echo ================================
echo.
echo Para iniciar o servidor, execute:
echo   cd backend
echo   venv\Scripts\activate
echo   python -m uvicorn app.main:app --reload --port 8000
echo.
echo Documentacao da API: http://localhost:8000/docs
echo.
pause
