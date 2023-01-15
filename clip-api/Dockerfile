ARG COMPUTE

FROM python:3.9 as base 
############### CPU STAGE ###############
FROM base as pytorch_cpu

RUN pip3 install torch==1.10.0+cpu torchvision==0.11.1+cpu torchaudio==0.10.0+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html

############### GPU STAGE ###############
# FROM base as pytorch_cuda

# RUN pip3 install torch==1.10.0+cu113 torchvision==0.11.1+cu113 torchaudio==0.10.0+cu113 -f https://download.pytorch.org/whl/cu113/torch_stable.html

############### SOURCE STAGE ###############
FROM pytorch_${COMPUTE} 

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip3 install --no-cache-dir --upgrade -r /code/requirements.txt \ 
 && pip3 install ftfy regex tqdm python-multipart requests \
 && pip3 install git+https://github.com/openai/CLIP.git

COPY /app /code/app