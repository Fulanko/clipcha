import sys
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from .evaluator import Evaluator
from PIL import Image
from io import BytesIO
import base64
import requests
import json


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
def read_root():
    message = f"Hello world! From FastAPI running on Uvicorn with Gunicorn. Using Python {version}"
    return {"message": message}

@app.post("/images")
def create_upload_file(word: str = Form(...), images: str = Form(...)):
    images = json.loads(images)
    results = []
    evaluator.tokenize(word)
    for image in images:
        file = requests.get(image['url']).content
        results.append(evaluator.evaluate(Image.open(BytesIO(file)), word, image['index']))
    return results