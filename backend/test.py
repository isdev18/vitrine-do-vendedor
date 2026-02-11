import requests
import json

url = "https://script.google.com/macros/s/AKfycbxaqj3Qpy9gQy20q0PFohC3ZZGLHE8k70lUUK3jVeByZHQwfUqfofKJ9od3IfUU-Sdo/exec"

data = {
    "acao": "criar_usuario",
    "nome": "joao",
    "email": "joao@gmail.com",
    "senha": "123",
    "telefone": "7199"
}

headers = {"Content-Type": "application/json"}

r = requests.post(url, data=json.dumps(data), headers=headers)

print(r.text)
