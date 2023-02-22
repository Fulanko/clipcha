import base64
import sys
import cv2
import numpy as np

from evaluators.ocr import OcrEvaluator
from evaluators.clip import ClipEvaluator
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from io import BytesIO
import requests
import json


version = f"{sys.version_info.major}.{sys.version_info.minor}"

clipEvaluator = ClipEvaluator()
ocrEvaluator = OcrEvaluator()

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

@app.post("/clip")
def request_clip(word: str = Form(...), images: str = Form(...)):
    images = json.loads(images)
    results = []
    clipEvaluator.tokenize(word)
    for image in images:
        file = requests.get(image['url']).content
        results.append(clipEvaluator.evaluate(Image.open(BytesIO(file)), word, image['index']))
    return results

@app.post("/ocr")
def request_tesseract(characters: str = Form(...), image: str = Form(...)):
    characters = json.loads(characters)
    nparr = np.fromstring(base64.b64decode(image), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return ocrEvaluator.evaluate(img, characters, create_images=False, show_borders=False)