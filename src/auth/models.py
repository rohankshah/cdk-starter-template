from pydantic import BaseModel

class SignUpRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    

class ConfirmSignUpRequest(BaseModel):
    email: str
    confirmationCode: str


class SignInRequest(BaseModel):
    email: str
    password: str

