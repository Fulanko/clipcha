import os
import torch
import clip

class ClipEvaluator:

  # Initialize CUDA and CLIP
  # Assemble word list for CLIP, consisting of
  # search words, filler words, nsfw tags
  def __init__(self):
    self.device = "cuda" if torch.cuda.is_available() else "cpu"
    self.model, self.preprocess = clip.load(os.getenv('CLIP_MODEL'), device=self.device)
    self.words = []

    print(" ===== Loaded CLIP ===== ")
    print(clip.available_models())

  
  def tokenize(self, word):
    word = word.strip().lower()
    self.words = [word, "an animal", "a plant", "a building", "a vehicle", "a street", "food", "an instrument", "something"]
    self.words = ["a picture containing " + s for s in self.words]

    text = clip.tokenize(self.words).to(self.device)
   
    with torch.no_grad():
        self.text_features = self.model.encode_text(text)


  # Evaluate a given image and word pair
  # returns a tuple of (pair_score, top_word)
  def evaluate(self, image, word, id):
    # turn image black and white
    image.convert("L")

    # compute CLIP features
    image = self.preprocess(image).unsqueeze(0).to(self.device)
    with torch.no_grad():
        image_features = self.model.encode_image(image)

    image_features /= image_features.norm(dim=-1, keepdim=True)
    self.text_features /= self.text_features.norm(dim=-1, keepdim=True)
    similarity = (100.0 * image_features @ self.text_features.T).softmax(dim=-1)
    values, indices = similarity[0].sort(descending=True)
    score = 0
    rank = -1
    i = 0
    results = dict()
    for value, index in zip(values, indices):
      results[self.words[index]] = 1*value.item()
      print(f"{id} | {self.words[index]:>16s}: {1*value.item():.2f}")
      if self.words[index] == "a picture containing " + word:
        score = 1*value.item()
        rank = i
      i += 1

    return {"score": score, "rank": rank, "results": results}