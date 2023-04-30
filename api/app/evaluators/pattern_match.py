import cv2 as cv
import numpy as np

class PatternMatchEvaluator:

  def __init__(self):
    print(" ===== Loaded PatternMatch ===== ")
    self.methods = [
      'cv.TM_CCOEFF',
      'cv.TM_CCOEFF_NORMED',
      'cv.TM_CCORR',
      'cv.TM_CCORR_NORMED',
      'cv.TM_SQDIFF',
      'cv.TM_SQDIFF_NORMED'
    ]
    self.method = self.methods[0]

  # Evaluate a given image for given characters
  def evaluate(self, search_image, pattern_image):

    x, y, w, h = cv.boundingRect(pattern_image[..., 3])
    pattern_image = pattern_image[y:y+h, x:x+w, :]

    lower = np.array([255,255,255])
    upper = np.array([255,255,255])

    mask = cv.inRange(search_image, lower, upper)
    search_image = cv.bitwise_and(search_image, search_image, mask= mask)

    cv.imwrite('/code/app/res/pattern_match_pattern_in.png', pattern_image)
    cv.imwrite('/code/app/res/pattern_match_search_in.png', search_image)

    pattern_image = cv.cvtColor(pattern_image, cv.COLOR_BGR2GRAY)
    search_image = cv.cvtColor(search_image, cv.COLOR_BGR2GRAY)

    w, h = pattern_image.shape[::-1]

    img = search_image.copy()
    method = eval(self.method)
    # Apply template Matching
    res = cv.matchTemplate(img, pattern_image, method)
    min_val, max_val, min_loc, max_loc = cv.minMaxLoc(res)
    # If the method is TM_SQDIFF or TM_SQDIFF_NORMED, take minimum
    if method in [cv.TM_SQDIFF, cv.TM_SQDIFF_NORMED]:
        top_left = min_loc
    else:
        top_left = max_loc
    bottom_right = (top_left[0] + w, top_left[1] + h)
    cv.rectangle(img, top_left, bottom_right, 255, 2)
    cv.imwrite('/code/app/res/pattern_match_' + self.method + '.png', img)

    return top_left[0]
