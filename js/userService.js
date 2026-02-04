// Usar `CONFIG` central definido em js/config.js
// (Este arquivo assume que `js/config.js` é incluído antes de outros scripts.)

function login(credentials) {
	return window.apiClient.post(CONFIG.API.AUTH.LOGIN, credentials)
		.then(res => {
			// salvar token em sessionStorage (evita uso de localStorage se preferir)
			if (res && res.token) sessionStorage.setItem('token', res.token);
			return res;
		});
}

function logout() {
	// informar backend e limpar sessão local
	return window.apiClient.post(CONFIG.API.AUTH.LOGOUT, {})
		.finally(()=> sessionStorage.removeItem('token'));
}

function getProfile() {
	return window.apiClient.get(CONFIG.API.USER.PROFILE);
}

function updateProfile(data) {
	return window.apiClient.put(CONFIG.API.USER.UPDATE, data);
}