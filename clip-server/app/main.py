import sys
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from .evaluator import Evaluator
from PIL import Image
import requests
from io import BytesIO
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
async def read_root():
    message = f"Hello world! From FastAPI running on Uvicorn with Gunicorn. Using Python {version}"
    return {"message": message}

@app.post("/images")
async def create_upload_file(images: str = Form(...), word: str = Form(...)):

    try:
        images = json.loads(images)
        result = dict()
        for image in images:
            response = requests.get(image['url'])
            result[image['index']] = evaluator.evaluate(Image.open(BytesIO(response.content)), word, image['index'])
        return result
    except ValueError as e:
        return {"message": "Invalid images. needs to be a json array of image objects"}