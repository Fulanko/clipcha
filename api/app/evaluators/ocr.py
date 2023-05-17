import cv2
import easyocr
import numpy as np
from blend_modes import difference, grain_extract
from os import listdir
from os.path import isfile, join
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

class OcrEvaluator:

  def __init__(self):
    print(111)
    self.reader = easyocr.Reader(['ch_sim'])
    print(222)
    bgs_path = '/code/app/bgs'
    self.bg_images = [f for f in listdir(bgs_path) if isfile(join(bgs_path, f))]
    print(" ===== Loaded OCR ===== ")


  # Evaluate a given image for given characters
  def evaluate(self, image, characters, create_images: False, show_borders: False):
    blend_diff = []
    blend_grain = []

    gray = cv2.cvtColor(image,cv2.COLOR_BGR2BGRA).astype(float)
    gray = cv2.resize(gray, (308, 220))

    cv2.imwrite('/code/app/res/test.png', gray)
    
    target_image = 0
    target_sum = 0

    preprocessed_images = [self.preprocessed_image(image, "original", (255, 0, 0))]

    # remove background
    for i, bg_image in enumerate(self.bg_images):
        x = cv2.cvtColor(cv2.imread('/code/app/bgs/'+bg_image), cv2.COLOR_BGR2BGRA).astype(float)
        blend_diff.append(difference(gray, x, 1))
        blend_grain.append(grain_extract(gray, x, 1))
        sum = np.sum(blend_diff[i] == 0)
        if (sum > target_sum):
            target_image = i
            target_sum = sum

    # blend diff
    fix = np.divide(blend_diff[target_image], (blend_diff[target_image].max()+256)/256).astype(np.uint8)
    preprocessed_images.append(self.preprocessed_image(fix, "target_blend_diff", (0, 0, 0)))
    inv = 255 - fix
    preprocessed_images.append(self.preprocessed_image(inv, "target_blend_diff_inv", (0, 0, 0)))
    for ths in range(20, 105, 8):
      _, x = cv2.threshold(blend_diff[target_image], ths, 255, cv2.THRESH_BINARY)
      fix = np.divide(x, (x.max()+256)/256).astype(np.uint8)
      gray = cv2.cvtColor(fix, cv2.COLOR_BGR2GRAY)
      _, x = cv2.threshold(gray,1,255,0)
      preprocessed_images.append(self.preprocessed_image(x, "blend_diff_"+str(ths), (0, 255, 0)))
      inv = 255 - x
      preprocessed_images.append(self.preprocessed_image(inv, "blend_diff_"+str(ths)+"_inv", (0, 255, 0)))

    # blend grain
    fix = np.divide(blend_grain[target_image], (blend_grain[target_image].max()+256)/256).astype(np.uint8)
    preprocessed_images.append(self.preprocessed_image(fix, "target_blend_grain", (255, 255, 255)))
    inv = 255 - fix
    preprocessed_images.append(self.preprocessed_image(inv, "target_blend_grain_inv", (255, 255, 255)))
    for ths in range(40, 95, 8):
      _, x = cv2.threshold(blend_grain[target_image], 255-ths, 255, cv2.THRESH_BINARY)
      fix = np.divide(x, (x.max()+256)/256).astype(np.uint8)
      gray = cv2.cvtColor(fix, cv2.COLOR_BGR2GRAY)
      _, x = cv2.threshold(gray,1,255,0)
      preprocessed_images.append(self.preprocessed_image(x, "blend_grain_"+str(ths), (0, 0, 255)))
      inv = 255 - x
      preprocessed_images.append(self.preprocessed_image(inv, "blend_grain_"+str(ths)+"_inv", (0, 0, 255)))

    print("====================================================")

    print(characters)
    result_dict = dict()

    for value in preprocessed_images:
      if create_images:
        cv2.imwrite('/code/app/res/'+value['name']+'.png', value['image'])
      print(value['name'])
      img = value['image']
      results = self.reader.readtext(img, allowlist=''.join(characters), contrast_ths = 0.3, adjust_contrast = 0.6, width_ths = 0.1)
      for (bbox, text, prob) in results:
        print("[INFO] {:.4f}: {}".format(prob, text))
        if text in result_dict:
          if result_dict[text]['prob'] < prob:
              result_dict[text] = {'prob': prob, 'bbox': bbox, 'color': value['color']}
        else:
          result_dict[text] = {'prob': prob, 'bbox': bbox, 'color': value['color']}
    
    i = 1
    res = []
    for char in characters:
      if not char in result_dict:
        return res
      entry = result_dict[char]
      (tl, tr, br, bl) = entry['bbox']
      tl = (int(tl[0]), int(tl[1]))
      tr = (int(tr[0]), int(tr[1]))
      br = (int(br[0]), int(br[1]))
      bl = (int(bl[0]), int(bl[1]))
      min_dist = int(min(tr[0] - tl[0], tl[1] - bl[1]) / 2)
      if show_borders:
        cv2.rectangle(image, tl, br, entry['color'], 2)
        cv2.putText(image, str(round(entry['prob'], 2)), (tl[0], tl[1] - 10),
          cv2.FONT_HERSHEY_SIMPLEX, 0.3, entry['color'], 2)

      click_pos = (tl[0]-min_dist, tl[1]-min_dist)
      res.append({'x': click_pos[0], 'y': click_pos[1]})
      cv2.putText(image, str(i), click_pos,
          cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
      cv2.circle(image, (tl[0]-min_dist, tl[1]-min_dist), 3, (0,0,255), -1)
      i = i + 1

    cv2.imwrite('/code/app/res/captcha.png', image)

    return res
  
  def preprocessed_image(self, image, name, color):
    return {'image': image, 'name': name, 'color': color}