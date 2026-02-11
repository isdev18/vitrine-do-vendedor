from database_api import GoogleSheetsDB
import os

class DashboardService:
    def __init__(self):
        self.db = GoogleSheetsDB(os.getenv('GOOGLE_SHEETS_API'))

    def get_dashboard(self, vitrine_id):
        return self.db.dashboard(vitrine_id)
