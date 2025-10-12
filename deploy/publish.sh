ECR_URL=607709788197.dkr.ecr.us-east-1.amazonaws.com
REPO_URL=${ECR_URL}/bento-vision-lambda
REMOTE_IMAGE_TAG=${REPO_URL}:v3

LOCAL_IMAGE=bento-vision-lambda

aws ecr get-login-password \
    --region us-east-1 | docker login \
    --username AWS \
    --password-stdin ${ECR_URL}

docker build -t ${LOCAL_IMAGE} .

docker tag ${LOCAL_IMAGE} ${REMOTE_IMAGE_TAG}
docker push ${REMOTE_IMAGE_TAG}