import logging
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def formatError(e: Exception):
    if isinstance(e, ClientError):
        logger.error(f"ClientError: {str(e)}")
        return {
            "statusCode": 400,
            "body": f"Error: {e.response['Error']['Message']}"
        }
    elif isinstance(e, ValueError):
        logger.error(f"ValueError: {str(e)}")
        return {
            "statusCode": 400,
            "body": f"Error: {str(e)}"
        }
    else:
        logger.exception("Unexpected error")
        return {
            "statusCode": 500,
            "body": f"Unexpected error: {str(e)}"
        }


def successResponse(data, status_code=200):
    return {
        "statusCode": status_code,
        "body": {"success": True, "data": data},
    }


def errorResponse(message, status_code=400):
    return {
        "statusCode": status_code,
        "body": {"success": False, "message": message},
    }

def getUserSub(event: dict):
    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        return claims.get("username") or claims.get("sub")
    except KeyError:
        raise ValueError("JWT claims not found in requestContext")