import requests

url = 'http://localhost:8080/2015-03-31/functions/function/invocations'

result = requests.post(url, json={"imageurl": "idk"})
print(result.json())