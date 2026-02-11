from flask import Blueprint, request, jsonify
from services.vitrine_service import VitrineService

vitrine_bp = Blueprint('vitrine', __name__)
vitrine_service = VitrineService()

@vitrine_bp.route('/vitrine/<slug>', methods=['GET'])
def get_vitrine(slug):
    result = vitrine_service.get_vitrine_by_slug(slug)
    return jsonify(result), 200 if result.get('ok') else 404

@vitrine_bp.route('/vitrine/<slug>/motos', methods=['GET'])
def get_motos_by_vitrine(slug):
    result = vitrine_service.get_motos_by_vitrine(slug)
    return jsonify(result), 200 if result.get('ok') else 404
