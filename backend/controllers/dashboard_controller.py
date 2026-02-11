from flask import Blueprint, request, jsonify
from services.dashboard_service import DashboardService

dashboard_bp = Blueprint('dashboard', __name__)
dashboard_service = DashboardService()

@dashboard_bp.route('/dashboard/<int:vitrine_id>', methods=['GET'])
def get_dashboard(vitrine_id):
    result = dashboard_service.get_dashboard(vitrine_id)
    return jsonify(result), 200 if result.get('ok') else 400
