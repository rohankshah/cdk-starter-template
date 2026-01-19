from pydantic import BaseModel, ValidationError
from aws_lambda_powertools.utilities.parser import parse
import json

def validate_request(model_class, app, logger):
    def decorator(func):
        def wrapper():
            try:
                body = parse(event=app.current_event.json_body,
                             model=model_class)
            except ValidationError as e:
                logger.error(f"Validation failed: {e}")
                return {"message": "Invalid input", "errors": json.loads(e.json())}, 400
            return func(body)
        return wrapper
    return decorator
