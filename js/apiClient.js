// Usar `CONFIG` central definido em js/config.js
// (Este arquivo assume que `js/config.js` é incluído antes de outros scripts.)

const apiBase = (function(){
	// monta base segura: CONFIG.API_URL + CONFIG.API.BASE_PATH
	const url = (CONFIG && CONFIG.API_URL) ? CONFIG.API_URL.replace(/\/+$/,'') : window.location.origin;
	const path = (CONFIG && CONFIG.API && CONFIG.API.BASE_PATH) ? CONFIG.API.BASE_PATH : '/api/v1';
	return url + path;
})();

function buildUrl(path){
	if (!path) return apiBase;
	return apiBase.replace(/\/+$/,'') + (path.startsWith('/') ? path : ('/'+path));
}

async function request(method, path, body, opts = {}){
	const headers = Object.assign({
		'Content-Type': 'application/json'
	}, opts.headers || {});
	// obter token (use sessionStorage ou cookies em vez de localStorage se quiser evitar persistência)
	const token = sessionStorage.getItem('token') || null;
	if (token) headers['Authorization'] = 'Bearer ' + token;

	const res = await fetch(buildUrl(path), {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
		...opts
	});
	if (!res.ok) {
		let err;
		try { err = await res.json(); } catch(e) { err = { message: res.statusText }; }
		throw err;
	}
	// retornar json quando houver conteúdo
	if (res.status === 204) return null;
	return res.json().catch(()=>null);
}

const apiClient = {
	get: (path, opts) => request('GET', path, null, opts),
	post: (path, data, opts) => request('POST', path, data, opts),
	put: (path, data, opts) => request('PUT', path, data, opts),
	del: (path, opts) => request('DELETE', path, null, opts)
};
// exporte globalmente se seu projeto não usa módulos
window.apiClient = apiClient;