from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.logging import Logger

from validate import validate_request
from helpers import getUserSub
from services import getUserDetails

logger = Logger(service="user-service")
app = APIGatewayHttpResolver()
base_path = "/api/user"


@app.post(base_path + "/get-user-details")
def handleUserDetails():
    userSub = getUserSub(app.current_event)
    return getUserDetails(userSub)


@app.route(".*", method=["GET", "POST", "PUT"])
def catch_all():
    return {"message": "Route not found", "path": app.current_event.path}


@logger.inject_lambda_context
def lambda_handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)