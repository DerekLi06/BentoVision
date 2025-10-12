FROM public.ecr.aws/lambda/python:3.13


# Install only necessary dependencies for ONNX inference
RUN dnf install -y mesa-libGL mesa-libGLU libXrender libXext libSM
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir "ultralytics[cpu]" onnxruntime numpy pillow opencv-python-headless boto3 matplotlib

# Copy model and handler
COPY best.onnx .
COPY lambda_function.py .

# Set the CMD to your handler
CMD ["lambda_function.lambda_handler"]