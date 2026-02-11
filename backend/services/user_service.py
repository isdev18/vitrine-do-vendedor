from database_api import GoogleSheetsDB
import os

class UserService:
    def __init__(self):
        self.db = GoogleSheetsDB(os.getenv('GOOGLE_SHEETS_API'))

    def register(self, data):
        nome = data.get('nome')
        email = data.get('email')
        senha = data.get('senha')
        telefone = data.get('telefone')
        slug = data.get('slug')
        return self.db.criar_usuario(nome, email, senha, telefone, slug)

    def login(self, data):
        email = data.get('email')
        senha = data.get('senha')
        return self.db.login(email, senha)
