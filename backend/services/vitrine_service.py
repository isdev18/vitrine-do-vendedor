from database_api import GoogleSheetsDB
import os

class VitrineService:
    def __init__(self):
        self.db = GoogleSheetsDB(os.getenv('GOOGLE_SHEETS_API'))

    def get_vitrine_by_slug(self, slug):
        return self.db.buscar_vitrine(slug)

    def get_motos_by_vitrine(self, slug):
        vitrine = self.db.buscar_vitrine(slug)
        if vitrine.get('ok'):
            vitrine_id = vitrine.get('data', {}).get('id')
            return self.db.listar_motos(vitrine_id)
        return {"ok": False, "error": "Vitrine não encontrada"}
