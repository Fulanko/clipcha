import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .evaluator import Evaluator
from PIL import Image
from io import BytesIO
import base64
import time

version = f"{sys.version_info.major}.{sys.version_info.minor}"

evaluator = Evaluator()

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    message = f"Hello world! From FastAPI running on Uvicorn with Gunicorn. Using Python {version}"
    return {"message": message}

@app.post("/images")
async def create_upload_file(request: Request):
    
    json = await request.json()
    content = base64.b64decode(json["image"])
    img = Image.open(BytesIO(content))
    start = time.time()
    res = evaluator.evaluate(img, json["word"], json["index"])
    end = time.time()
    print("time")
    print(end - start)
    return res