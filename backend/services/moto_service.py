from database_api import GoogleSheetsDB
import os

class MotoService:
    def __init__(self):
        self.db = GoogleSheetsDB(os.getenv('GOOGLE_SHEETS_API'))

    def criar_moto(self, data):
        return self.db.criar_moto(**data)

    def editar_moto(self, moto_id, data):
        data['moto_id'] = moto_id
        return self.db.editar_moto(**data)

    def excluir_moto(self, moto_id):
        return self.db.excluir_moto(moto_id)

    def listar_motos(self, vitrine_id):
        return self.db.listar_motos(vitrine_id)
