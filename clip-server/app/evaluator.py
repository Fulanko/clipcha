import os
import torch
import clip

class Evaluator:

  # Initialize CUDA and CLIP
  # Assemble word list for CLIP, consisting of
  # search words, filler words, nsfw tags
  def __init__(self):
    self.device = "cuda" if torch.cuda.is_available() else "cpu"
    self.model, self.preprocess = clip.load(os.getenv('CLIP_MODEL'), device=self.device)

    print(" ===== Load complete ===== ")
    print(clip.available_models())


  # Evaluate a given image and word pair
  # returns a tuple of (pair_score, top_word)
  def evaluate(self, image, word):

    word = word.strip().lower()
    words = [word, "animal", "plant", "building", "vehicule", "street", "food", "something"]

    text = clip.tokenize(words).to(self.device)

    with torch.no_grad():
        self.text_features = self.model.encode_text(text)

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
      print(f"{words[index]:>16s}: {1*value.item():.2f}")
      if words[index] == word:
        score = 1*value.item()

    return score