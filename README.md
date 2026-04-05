# Stitcher

Stitcher is a demo web frontend for a generative AI textile upcycling project. It hides the Colab notebook UI and lets a user interact with the workflow through a simple browser interface.

The project takes one or more scrap fabric images, analyzes their visual characteristics, recommends useful upcycled products, and generates AI concept images for those products.

## What the project does

The pipeline keeps the original notebook logic:

- BLIP image captioning with `Salesforce/blip-image-captioning-base`
- dominant color extraction from uploaded fabric images
- rule-based product recommendations based on caption, tags, and fabric size hint
- prompt construction for upcycled product concepts
- image generation with `stabilityai/sd-turbo`
- zip export of generated results

## How it works

This repo uses a split demo setup:

- `stitch-notebook.ipynb` runs in Google Colab
- the notebook loads the models and exposes a temporary HTTP API
- the local frontend sends image uploads to that Colab API
- the frontend renders returned captions, recommendations, generated images, and the zip download link

This avoids running the heavy models on a local laptop while still showing the full workflow in a website.

## Project structure

```text
stitcher/
├── app.py
├── requirements.txt
├── stitch-notebook.ipynb
├── static/
│   ├── app.js
│   ├── index.html
│   └── styles.css
└── README.md
```

## Requirements

- Python 3.9+
- Google Colab
- Colab runtime with GPU recommended
- internet access for model downloads and temporary Cloudflare tunnel creation

## Run the demo

### 1. Start the notebook in Colab

1. Open `stitch-notebook.ipynb` in Google Colab.
2. Use a GPU runtime if available.
3. Restart the runtime once for a clean start.
4. Click `Run all`.
5. Wait for the last cell to print:

```text
Public URL: ...
Process endpoint: .../process
Health endpoint: .../health
```

6. Open the `Health endpoint` in a browser and confirm it returns JSON.

Example:

```json
{"status":"ok","device":"cuda"}
```

### 2. Start the local frontend

From the project directory:

```bash
cd /Users/srishtisahi/Desktop/stitcher
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Then open:

```text
http://localhost:3000
```

### 3. Use the website

1. Paste the Colab `Process endpoint` into the `Colab API URL` field.
2. Upload one or more fabric images.
3. Click `Analyze and Generate`.
4. Review:
   - uploaded image previews
   - BLIP captions
   - detected colors
   - pattern tags
   - recommended products
   - generated concept images
   - zip download link

## Demo flow

1. User opens the website.
2. User uploads scrap fabric images.
3. Frontend sends the images to the Colab API.
4. Colab analyzes each image and generates results.
5. Colab returns structured JSON to the frontend.
6. Frontend displays the results without exposing the notebook UI.

## Notes

- This setup is meant for demo use, not production.
- The Cloudflare tunnel URL changes when the Colab runtime restarts.
- The first Colab run can take time because the models are downloaded.
- If the runtime disconnects, rerun the notebook and use the new `Process endpoint`.
- The notebook is currently arranged so `Run all` works for website-demo mode.

## Troubleshooting

### Frontend shows `Unexpected token '<'`

This usually means the frontend received HTML instead of JSON.

Check:

- you pasted the exact `.../process` URL, not just the base URL
- the Colab runtime is still active
- the `Health endpoint` returns JSON

### Colab tunnel/health endpoint fails

Restart the Colab runtime and click `Run all` again. Then use the newly printed endpoint.

### Port or tunnel conflicts in Colab

Use a fresh runtime and run the notebook once from top to bottom instead of rerunning only the last tunnel cell multiple times.

## Tech stack

- Python
- Flask
- Vanilla HTML/CSS/JavaScript
- Google Colab
- Hugging Face `transformers`
- Hugging Face `diffusers`
- Cloudflare quick tunnels

## Purpose

This project demonstrates how a Colab-based generative AI workflow can be turned into a user-facing website for presentation or demo purposes, while preserving the original notebook logic.
