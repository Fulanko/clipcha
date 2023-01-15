# clipcha

Experiment on the feasability to solve captchas using puppeteer and a simple CLIP api

## Documentation
If using puppeteer with the API, make sure to use the StealthPlugin, to avoid being detected as a bot

### Samples
`node captcha-solver/index.js
`

### Node Parameters (config.js)
| Setting         | Explanation |
|--------------|-----------------|
| apiUrl       | Url linking to the CLIP api          |
| selectorDelay       | Delay before selecting elements, required to avoid bot-detection   |
| solverDelay  | Delay before solving images, required to avoid bot-detection           |

### API Parameters (docker-compose.yml)
| Setting         | Explanation |
|--------------|-----------------|
| CLIP_MODEL       | model used by CLIP to solve images, Vit-B/32 seems to have best cost/performance results in terms of cpu time and memory    |
| COMPUTE | cpu for CPU or cuda for GPU inference. If using GPU, you need to modify the Dockerfile to enable the GPU stage and disable the CPU stage|
