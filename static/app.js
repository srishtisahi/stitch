const form = document.getElementById("stitch-form");
const submitButton = document.getElementById("submit-button");
const statusEl = document.getElementById("status");
const apiUrlEl = document.getElementById("api-url");
const summaryEl = document.getElementById("summary");
const uploadsEl = document.getElementById("uploads");
const analysisEl = document.getElementById("analysis");
const galleryEl = document.getElementById("gallery");
const fabricTemplate = document.getElementById("fabric-template");
const savedApiUrl = window.localStorage.getItem("stitcher-colab-api-url");

if (savedApiUrl) {
  apiUrlEl.value = savedApiUrl;
}

function setStatus(message, state = "idle") {
  statusEl.textContent = message;
  statusEl.className = `status ${state}`;
}

function withBaseUrl(baseUrl, maybeRelativeUrl) {
  if (!maybeRelativeUrl) return "";
  return new URL(maybeRelativeUrl, baseUrl).toString();
}

function sectionHead(title, meta = "", linkHtml = "") {
  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Results</p>
        <h2>${title}</h2>
      </div>
      <div class="meta">${meta}${linkHtml}</div>
    </div>
  `;
}

function renderSummary(data) {
  summaryEl.classList.remove("hidden");
  summaryEl.innerHTML = `
    ${sectionHead("Run Summary", `Device: ${data.device || "Colab runtime"}`)}
    <div class="summary-grid">
      <div class="metric"><strong>${data.fabrics.length}</strong>uploaded fabrics</div>
      <div class="metric"><strong>${data.meta.topKProducts}</strong>top recommendations per fabric</div>
      <div class="metric"><strong>${data.meta.generatedImageCount}</strong>generated concept images</div>
      <div class="metric"><strong>${data.meta.sizeHint}</strong>fabric size hint</div>
    </div>
  `;
}

function buildFabricCard(fabric, includeRecommendations) {
  const fragment = fabricTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".fabric-card");
  const img = card.querySelector(".fabric-preview");
  const title = card.querySelector("h3");
  const caption = card.querySelector(".caption");
  const colors = card.querySelector(".colors");
  const tags = card.querySelector(".tags");
  const recommendations = card.querySelector(".recommendations");

  img.src = fabric.preview;
  img.alt = fabric.filename;
  title.textContent = fabric.filename;
  caption.textContent = `Caption: ${fabric.analysis.caption}`;

  fabric.analysis.colors.forEach((color) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span class="swatch" style="background:${color}"></span>${color}`;
    colors.appendChild(chip);
  });

  fabric.analysis.tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = tag;
    tags.appendChild(chip);
  });

  if (includeRecommendations) {
    fabric.analysis.recommendations.forEach((item) => {
      const block = document.createElement("div");
      block.className = "recommendation";
      block.innerHTML = `<strong>${item.product} · score ${item.score}</strong>${item.reason}`;
      recommendations.appendChild(block);
    });
  } else {
    recommendations.remove();
  }

  return fragment;
}

function renderUploads(data) {
  uploadsEl.classList.remove("hidden");
  uploadsEl.innerHTML = `${sectionHead("Uploaded Fabrics")}<div class="stack"></div>`;
  const stack = uploadsEl.querySelector(".stack");
  data.fabrics.forEach((fabric) => stack.appendChild(buildFabricCard(fabric, false)));
}

function renderAnalysis(data) {
  analysisEl.classList.remove("hidden");
  analysisEl.innerHTML = `${sectionHead("Fabric Analysis and Recommendations")}<div class="stack"></div>`;
  const stack = analysisEl.querySelector(".stack");
  data.fabrics.forEach((fabric) => stack.appendChild(buildFabricCard(fabric, true)));
}

function renderGallery(data, apiBaseUrl) {
  const downloadUrl = withBaseUrl(apiBaseUrl, data.downloadUrl);
  const linkHtml = ` · <a class="download-link" href="${downloadUrl}">Download zip</a>`;
  galleryEl.classList.remove("hidden");
  galleryEl.innerHTML = `
    ${sectionHead("Generated Concept Images", `Job ID: ${data.jobId}`, linkHtml)}
    <div class="gallery-grid"></div>
  `;
  const grid = galleryEl.querySelector(".gallery-grid");

  data.generatedResults.forEach((result) => {
    const item = document.createElement("article");
    item.className = "gallery-item";
    item.innerHTML = `
      <img class="gallery-image" src="${result.preview}" alt="${result.product}" />
      <div class="gallery-meta">
        <strong>${result.product}</strong>
        Source: ${result.source_image}
      </div>
      <p class="prompt">${result.prompt}</p>
    `;
    grid.appendChild(item);
  });
}

function clearResults() {
  [summaryEl, uploadsEl, analysisEl, galleryEl].forEach((el) => {
    el.classList.add("hidden");
    el.innerHTML = "";
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearResults();
  submitButton.disabled = true;
  const apiUrl = apiUrlEl.value.trim();
  window.localStorage.setItem("stitcher-colab-api-url", apiUrl);
  setStatus("Sending images to the Colab runtime. Keep this tab open while the notebook processes the request.", "working");

  try {
    const formData = new FormData(form);
    formData.delete("apiUrl");
    const apiBaseUrl = new URL(apiUrl).origin;
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Processing failed.");
    }

    renderSummary(data);
    renderUploads(data);
    renderAnalysis(data);
    renderGallery(data, apiBaseUrl);
    setStatus("Run complete. Review the analysis, inspect the generated concepts, or download the zip archive.", "idle");
    summaryEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});
