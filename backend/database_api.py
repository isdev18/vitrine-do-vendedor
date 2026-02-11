import requests
import json

class GoogleSheetsDB:

    def __init__(self, api_url):
        self.api_url = api_url

    def send_request(self, payload):
        headers = {"Content-Type": "application/json"}

        print("\n========== ENVIANDO PARA GOOGLE SHEETS ==========")
        print("URL:", self.api_url)
        print("PAYLOAD:", payload)

        try:
            response = requests.post(
                self.api_url,
                data=json.dumps(payload),
                headers=headers,
                timeout=30
            )

            print("STATUS CODE:", response.status_code)
            print("RESPOSTA BRUTA:", response.text)
            print("===============================================\n")

            # tenta converter pra json
            try:
                data = json.loads(response.text)
                if isinstance(data, dict):
                    return data
                else:
                    return {"raw": response.text}
            except Exception:
                # Se não for JSON, retorna um dict com o texto bruto
                return {"raw": response.text}

        except Exception as e:
            print("ERRO REQUEST:", str(e))
            return {"erro": str(e)}

    ############################
    # USUARIO
    ############################
    def criar_usuario(self, nome, email, senha, telefone, slug=""):
        payload = {
            "acao": "criar_usuario",
            "nome": nome,
            "email": email,
            "senha": senha,
            "telefone": telefone,
            "slug": slug
        }
        return self.send_request(payload)

    def login(self, email, senha):
        payload = {"acao": "login", "email": email, "senha": senha}
        return self.send_request(payload)

    ############################
    # VITRINE
    ############################
    def buscar_vitrine(self, slug):
        payload = {"acao": "buscar_vitrine", "slug": slug}
        return self.send_request(payload)

    ############################
    # MOTOS
    ############################
    def listar_motos(self, vitrine_id):
        payload = {"acao": "listar_motos", "vitrine_id": vitrine_id}
        return self.send_request(payload)

    def criar_moto(self, **kwargs):
        payload = {"acao": "criar_moto"}
        payload.update(kwargs)
        return self.send_request(payload)

    def editar_moto(self, **kwargs):
        payload = {"acao": "editar_moto"}
        payload.update(kwargs)
        return self.send_request(payload)

    def excluir_moto(self, moto_id):
        payload = {"acao": "excluir_moto", "moto_id": moto_id}
        return self.send_request(payload)

    ############################
    # LEADS / METRICAS
    ############################
    def salvar_lead(self, **kwargs):
        payload = {"acao": "salvar_lead"}
        payload.update(kwargs)
        return self.send_request(payload)

    def somar_view(self, **kwargs):
        payload = {"acao": "somar_view"}
        payload.update(kwargs)
        return self.send_request(payload)

    def dashboard(self, vitrine_id):
        payload = {"acao": "dashboard", "vitrine_id": vitrine_id}
        return self.send_request(payload)
