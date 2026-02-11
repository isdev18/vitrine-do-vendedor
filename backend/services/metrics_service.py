from database_api import GoogleSheetsDB
import os

class MetricsService:
    def __init__(self):
        self.db = GoogleSheetsDB(os.getenv('GOOGLE_SHEETS_API'))

    def somar_view(self, data):
        return self.db.somar_view(**data)

    def salvar_lead(self, data):
        return self.db.salvar_lead(**data)
