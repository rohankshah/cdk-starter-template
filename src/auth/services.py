import os
import json
import boto3
import logging

from helpers import formatError, successResponse, errorResponse
from models import SignUpRequest, ConfirmSignUpRequest, SignInRequest

USER_POOL_ID = os.getenv('USER_POOL_ID')
CLIENT_ID = os.getenv('CLIENT_ID')
TABLE_NAME = os.getenv('TABLE_NAME')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

cognitoClient = boto3.client('cognito-idp', region_name='ap-south-1')
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
sqs = boto3.client("sqs")


def signUp(event: SignUpRequest):
    try:
        email = event.get('email', '').strip().lower()
        password = event.get('password')
        firstName = event.get('firstName')
        lastName = event.get('lastName')


        response = cognitoClient.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email}
            ]
        )

        userId = response['UserSub']

        user_item = {
            "PK": f"user#{userId}",
            "SK": "Info",
            "user_fName": firstName,
            "user_lName": lastName
        }

        table.put_item(Item=user_item)

        sqs.send_message(
            QueueUrl=os.environ["EMAIL_QUEUE_URL"],
            MessageBody=json.dumps({
                "type": "SIGNUP_SUCCESS_EMAIL",
                "email": email
            })
        )

        return successResponse({
            "message": "User sign up successful!",
            "id": userId
        })

    except Exception as e:
        return formatError(e)


def confirmSignUp(event: ConfirmSignUpRequest):
    try:
        email = event.get('email')
        confirmationCode = event.get('confirmationCode')

        cognitoClient.confirm_sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            ConfirmationCode=confirmationCode
        )

        return successResponse({
            "message": "Email verified successfully!",
            "email": email
        })

    except Exception as e:
        return formatError(e)


def signIn(event: SignInRequest):
    try:
        email = event.get('email')
        password = event.get('password')

        response = cognitoClient.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )

        return successResponse({
            "message": "Sign in successful!",
            "token": response['AuthenticationResult']
        })

    except Exception as e:
        return formatError(e)