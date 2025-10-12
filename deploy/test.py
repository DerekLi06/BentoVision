import requests
import base64

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string

url = 'http://localhost:8080/2015-03-31/functions/function/invocations'

path = "../CAFD_YOLO/test/images/14334.jpg"
image_data = encode_image_to_base64(path)

result = requests.post(url, json={
    'image_data': image_data,
    'image_name': '14334.jpg',
    'content_type': 'image/jpeg'
    })
print(result.json())