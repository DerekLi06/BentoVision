import json
import base64
import io
import os
from PIL import Image
import numpy as np
import cv2
from ultralytics import YOLO

# Force CPU-only execution
os.environ['CUDA_VISIBLE_DEVICES'] = ''
os.environ['OMP_NUM_THREADS'] = '1'

class Config:
    IMG_SIZE = 640
    BATCH_SIZE = 32
    EPOCHS = 20
    LEARNING_RATE = 5e-4
    NUM_CLASSES = 42

    CLASSES = [
        "achichuk", "airan-katyk", "asip", "bauyrsak", "beshbarmak-w-kazy",
        "beshbarmak-wo-kazy", "chak-chak", "cheburek", "doner-lavash", "doner-nan",
        "hvorost", "irimshik", "kattama-nan", "kazy-karta", "kurt", "kuyrdak",
        "kymyz-kymyran", "lagman-fried", "lagman-w-soup", "lagman-wo-soup", "manty",
        "naryn", "nauryz-kozhe", "orama", "plov", "samsa", "shashlyk-chicken",
        "shashlyk-chicken-v", "shashlyk-kuskovoi", "shashlyk-kuskovoi-v",
        "shashlyk-minced-meat", "sheep-head", "shelpek", "shorpa", "soup-plain",
        "sushki", "suzbe", "taba-nan", "talkan-zhent", "tushpara-fried",
        "tushpara-w-soup", "tushpara-wo-soup"
    ]


# Initialize model with CPU-only settings
model = YOLO("best.onnx")
# model.to('cpu') 

def predict_image(base64_str, conf_threshold=0.03):
    # Perform inference on the image
    try:
        image_data = base64.b64decode(base64_str)
        pil_image = Image.open(io.BytesIO(image_data))

        image_cv = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        results = model.predict(
            source=image_cv,
            imgsz=Config.IMG_SIZE,
            conf=conf_threshold
        )
        
        # Load the image for visualization
        image_rgb = cv2.cvtColor(image_cv, cv2.COLOR_BGR2RGB)
        
        # To store detailed information about detections
        detection_details = []
        
        # Iterate over detections
        if len(results) > 0 and results[0].boxes is not None:
            for result in results[0].boxes.data:
                # Extract bounding box coordinates, confidence score, and class ID
                x1, y1, x2, y2, confidence, class_id = result.cpu().numpy()
                
                # Draw the bounding box with top confidence score
                cv2.rectangle(image_rgb, (int(x1), int(y1)), (int(x2), int(y2)), color=(0, 255, 0), thickness=2)
                label = f"{Config.CLASSES[int(class_id)]}: {confidence:.2f}"
                cv2.putText(image_rgb, label, (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), thickness=1)
                
                # Save details for printing below
                detection_details.append({
                    "class": Config.CLASSES[int(class_id)],
                    "top_confidence": float(confidence),
                    "bbox": [float(x1), float(y1), float(x2), float(y2)]
                })
        
        return image_rgb, detection_details
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")

def encode_base64(image_array):
    try:
        pil_image = Image.fromarray(image_array)
        buffer = io.BytesIO()
        pil_image.save(buffer, format="JPEG", quality=85)
        image_btyes = buffer.getvalue()

        base64_string = base64.b64encode(image_btyes).decode("utf-8")
        return base64_string
    except Exception as e:
        raise Exception(f"Error encoding image to base64: {str(e)}")

def lambda_handler(event, context):
    # implement
    # event = {
    # "image_data": ,
    # "image_name": ,
    # "content_type": 
    # }
    try:
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        if "image_data" not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing image_data in request'})
            }
        
        base64_image = body["image_data"]
        processed_image, details = predict_image(base64_image)
        reencoded_image = encode_base64(processed_image)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'image': reencoded_image,
                'details': details,
                'details_count': len(details),
                'msg': 'Found {} items'.format(len(details))
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'msg': 'Error processing the image'
            })
        }
    # image, details = predict_image(event["image_data"])
    # return {
    #     'image': image,
    #     'details': details
    # }