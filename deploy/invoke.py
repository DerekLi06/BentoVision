import boto3
import json

lambda_client = boto3.client('lambda', region_name='us-east-1')

response = lambda_client.invoke(
    FunctionName='food_predict',
    InvocationType='RequestResponse',
    Payload=json.dumps({"hi": "idk"})
)

result = json.loads(response['Payload'].read())
print(json.dumps(result, indent=2))