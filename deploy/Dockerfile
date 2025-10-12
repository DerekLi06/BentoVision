FROM public.ecr.aws/lambda/python:3.13

RUN pip install onnxruntime torch numpy pandas YOLO boto3 image matplotlib

COPY best.onnx .
COPY lambda_function.py .

CMD ["lambda_function.lambda_handler"]