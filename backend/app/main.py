from fastapi import FastAPI, Depends, Request, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.responses import JSONResponse, Response, RedirectResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl= "login")

app = FastAPI()

@app.get("/")
async def landing_page():
    return {"user_name": "?", "pw": "?"}

def authenticate_user(username, password):  #Put in a different package
    return True

@app.get("/login")
def login_page():
    data = OAuth2PasswordRequestForm(username="asdf", password="xxx")
    return auth(data)

@app.post("/auth")
def auth(form_data: OAuth2PasswordRequestForm = Depends()):
    user_auth = authenticate_user(form_data.username, form_data.password)
    
    if not user_auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = "123"
    max_age = 2
    response = RedirectResponse("/start")
    response.set_cookie("access_token",  access_token, max_age)
    return response

def check_auth(request: Request):
    token = request.cookies.get("access_token")
    print("AAACHTUNG", token)

@app.get("/start")
async def start_page(request: Request):
    check_auth(request)
    return JSONResponse({"success": "yes"})