import json
from services import sendWelcomeEmail

def lambda_handler(event, context):
    batchItemFailures = []

    for record in event["Records"]:
        try:
            message = json.loads(record["body"])

            if message["type"] == "SIGNUP_SUCCESS_EMAIL":
                sendWelcomeEmail(message["email"])

        except Exception as e:
            print("Email failed:", e)
            batchItemFailures.append({
                "itemIdentifier": record["messageId"]
            })

    return {
        "batchItemFailures": batchItemFailures
    }
