ARG COMPUTE=cpu
ARG CLIP_MODEL=ViT-L/14

FROM python:3.9 as base 
############### CPU STAGE ###############
FROM base as pytorch_cpu

RUN pip3 install --trusted-host download.pytorch.org --trusted-host files.pythonhosted.org --trusted-host pypi.org --trusted-host pypi.python.org torch==1.10.0+cpu torchvision==0.11.1+cpu torchaudio==0.10.0+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html

############### SOURCE STAGE ###############
FROM pytorch_${COMPUTE} 

ARG CLIP_MODEL
ENV CLIP_MODEL=$CLIP_MODEL
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN apt update \
  && apt-get install ffmpeg libsm6 libxext6 -y
RUN pip3 install --trusted-host files.pythonhosted.org --trusted-host pypi.org --trusted-host pypi.python.org --no-cache-dir --upgrade -r /code/requirements.txt 
RUN pip3 install --trusted-host files.pythonhosted.org --trusted-host pypi.org --trusted-host pypi.python.org ftfy regex tqdm python-multipart requests pillow numpy easyocr blend_modes
RUN git config --global http.sslverify false
RUN pip3 install --trusted-host github.com --trusted-host files.pythonhosted.org --trusted-host pypi.org --trusted-host pypi.python.org git+https://github.com/openai/CLIP.git

# RUN python3 -c "import clip; import easyocr; clip.load('$CLIP_MODEL', device='cpu'); easyocr.Reader(['ch_sim'], gpu=False)"

COPY /app /code/app

CMD ["/app/init.py"]