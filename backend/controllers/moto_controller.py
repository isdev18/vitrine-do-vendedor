from flask import Blueprint, request, jsonify
from services.moto_service import MotoService

moto_bp = Blueprint('moto', __name__)
moto_service = MotoService()

@moto_bp.route('/motos', methods=['POST'])
def criar_moto():
    data = request.get_json()
    result = moto_service.criar_moto(data)
    return jsonify(result), 201 if result.get('ok') else 400

@moto_bp.route('/motos/<int:moto_id>', methods=['PUT'])
def editar_moto(moto_id):
    data = request.get_json()
    result = moto_service.editar_moto(moto_id, data)
    return jsonify(result), 200 if result.get('ok') else 400

@moto_bp.route('/motos/<int:moto_id>', methods=['DELETE'])
def excluir_moto(moto_id):
    result = moto_service.excluir_moto(moto_id)
    return jsonify(result), 200 if result.get('ok') else 400

@moto_bp.route('/motos', methods=['GET'])
def listar_motos():
    vitrine_id = request.args.get('vitrine_id')
    result = moto_service.listar_motos(vitrine_id)
    return jsonify(result), 200 if result.get('ok') else 400
