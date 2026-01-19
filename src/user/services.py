import boto3
import logging
import os

from boto3.dynamodb.conditions import Key
from helpers import formatError, successResponse, errorResponse

USER_POOL_ID = os.getenv('USER_POOL_ID')
CLIENT_ID = os.getenv('CLIENT_ID')
TABLE_NAME = os.getenv('TABLE_NAME')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

cognitoClient = boto3.client('cognito-idp', region_name='ap-south-1')
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def getEmailFromSub(sub: str):
    response = cognitoClient.admin_get_user(
        UserPoolId=USER_POOL_ID,
        Username=sub
    )

    email = None

    for attr in response.get("UserAttributes", []):
        if attr["Name"] == "email":
            email = attr["Value"]
            break

    if not email:
        raise Exception("Email not found for user")

    return email


def getUserDetailsByEmail(email: str):
    response = table.get_item(
        Key={
            "PK": f"user#{email}",
            "SK": "Info"
        }
    )

    return response.get("Item")

def getUserDetails(sub: str):
    try:
        email = getEmailFromSub(sub)

        userDetailsResponse = table.get_item(
            Key={
                "PK": f"user#{sub}",
                "SK": "Info"
            }
        )

        userDetails = userDetailsResponse.get("Item")

        return successResponse({
            "email": email,
            "userFName": userDetails['user_fName'],
            "userLName": userDetails['user_lName']
        })

    except Exception as e:
        return formatError(e)