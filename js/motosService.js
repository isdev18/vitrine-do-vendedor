// Usar `CONFIG` central definido em js/config.js
// (Este arquivo assume que `js/config.js` é incluído antes de outros scripts.)

// Antes: uso de localStorage ou condicional com CONFIG.USE_API
// Depois: sempre usar a API
function listarMotos() {
	return window.apiClient.get(CONFIG.API.MOTOS.LIST);
}

function criarMoto(motoData) {
	return window.apiClient.post(CONFIG.API.MOTOS.CREATE, motoData);
}

function atualizarMoto(id, motoData) {
	// se seu backend espera /motos/update ou /motos/:id ajuste aqui
	// exemplo usando /motos/update com payload:
	return window.apiClient.put(CONFIG.API.MOTOS.UPDATE, Object.assign({ id }, motoData));
}

function deletarMoto(id) {
	// se backend usa /motos/delete/:id ou /motos/delete com body, ajuste conforme necessário
	return window.apiClient.del(`${CONFIG.API.MOTOS.DELETE}/${id}`);
}