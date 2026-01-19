from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.logging import Logger

from validate import validate_request
from services import signUp, confirmSignUp, signIn
from models import SignUpRequest, ConfirmSignUpRequest, SignInRequest

logger = Logger(service="auth-service")
app = APIGatewayHttpResolver()
base_path = "/api/auth"


@app.post(base_path + "/sign-up")
@validate_request(SignUpRequest, app, logger)
def handleSignUp(body):
    return signUp(body.dict())


@app.post(base_path + "/confirm-sign-up")
@validate_request(ConfirmSignUpRequest, app, logger)
def handleConfirmSignUp(body):
    return confirmSignUp(body.dict())


@app.post(base_path + "/sign-in")
@validate_request(SignInRequest, app, logger)
def handleSignIn(body):
    return signIn(body.dict())


@app.route(".*", method=["GET", "POST", "PUT"])
def catch_all():
    return {"message": "Route not found", "path": app.current_event.path}


@logger.inject_lambda_context
def lambda_handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
