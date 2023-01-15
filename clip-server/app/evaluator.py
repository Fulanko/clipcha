import os
import torch
import clip
import time

class Evaluator:

  # Initialize CUDA and CLIP
  # Assemble word list for CLIP, consisting of
  # search words, filler words, nsfw tags
  def __init__(self):
    self.device = "cuda" if torch.cuda.is_available() else "cpu"
    self.model, self.preprocess = clip.load(os.getenv('CLIP_MODEL'), device=self.device)
    self.words = []

    print(" ===== Load complete ===== ")
    print(clip.available_models())

  
  def tokenize(self, word):
    word = word.strip().lower()
    self.words = [word, "animal", "plant", "building", "vehicule", "street", "food", "instrument", "something"]

    text = clip.tokenize(self.words).to(self.device)
   
    with torch.no_grad():
        self.text_features = self.model.encode_text(text)


  # Evaluate a given image and word pair
  # returns a tuple of (pair_score, top_word)
  def evaluate(self, image, word, id):
    # compute CLIP features
    image = self.preprocess(image).unsqueeze(0).to(self.device)
    with torch.no_grad():
        image_features = self.model.encode_image(image)

    image_features /= image_features.norm(dim=-1, keepdim=True)
    self.text_features /= self.text_features.norm(dim=-1, keepdim=True)
    similarity = (100.0 * image_features @ self.text_features.T).softmax(dim=-1)
    values, indices = similarity[0].sort(descending=True)
    score = 0
    for value, index in zip(values, indices):
      print(f"{id} | {self.words[index]:>16s}: {1*value.item():.2f}")
      if self.words[index] == word:
        score = 1*value.item()

    return score