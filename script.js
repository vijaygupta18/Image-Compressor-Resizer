/* ---------------------------------------------------------
   Image Compressor & Resizer — vijay.tools
   Preserves all original functionality: quality slider, width/height,
   aspect ratio lock, target-size optimizer. Adds: drag-drop, presets,
   file-size stats, toast feedback, and the shared BMC support dialog.
--------------------------------------------------------- */

// DOM refs
const imageUpload      = document.getElementById('imageUpload');
const dropZone         = document.getElementById('dropZone');
const emptyState       = document.getElementById('emptyState');
const workspace        = document.getElementById('workspace');
const fileNameEl       = document.getElementById('fileName');
const changeFileBtn    = document.getElementById('changeFile');
const originalSizeEl   = document.getElementById('originalSize');
const compressedSizeEl = document.getElementById('compressedSize');
const savingsEl        = document.getElementById('savings');

const qualitySlider    = document.getElementById('qualitySlider');
const qualityValue     = document.getElementById('qualityValue');
const widthInput       = document.getElementById('widthInput');
const heightInput      = document.getElementById('heightInput');
const aspectRatioLock  = document.getElementById('aspectRatioLock');

const previewCanvas    = document.getElementById('previewCanvas');
const ctx              = previewCanvas.getContext('2d');
const currentDimensionsSpan = document.getElementById('currentDimensions');
const formatBadge      = document.getElementById('formatBadge');

const targetSizeInput  = document.getElementById('targetSizeInput');
const optimizeSizeButton = document.getElementById('optimizeSizeButton');
const downloadLink     = document.getElementById('downloadLink');

// State
let originalImage   = null;
let aspectRatio     = 1;
let isAspectLocked  = true;
let originalFileName = '';
let originalFileType = '';
let originalSizeBytes = 0;
let lastBlobSize = 0;

// ---------------------------------------------------------
// Upload wiring
// ---------------------------------------------------------
imageUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadFile(file);
    e.target.value = '';
});
changeFileBtn.addEventListener('click', () => imageUpload.click());
dropZone.addEventListener('click', () => imageUpload.click());
dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imageUpload.click(); }
});

['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragging');
    });
});
['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragging');
    });
});
dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) loadFile(file);
    else if (file) toast('That file isn\'t an image', 'danger');
});

// Accept drops anywhere on page once workspace is active (the preview area)
document.addEventListener('dragover', e => { e.preventDefault(); });
document.addEventListener('drop', e => {
    if (emptyState.hidden) {
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            e.preventDefault();
            loadFile(file);
        }
    }
});

function loadFile(file) {
    if (!file.type.startsWith('image/')) {
        toast('Please choose an image file', 'danger');
        return;
    }
    originalFileName  = file.name;
    originalFileType  = file.type;
    originalSizeBytes = file.size;

    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            aspectRatio = img.width / img.height;
            widthInput.value  = img.width;
            heightInput.value = img.height;
            qualitySlider.value = 90;
            qualityValue.textContent = '90%';

            // Show workspace
            emptyState.hidden = true;
            workspace.hidden = false;
            fileNameEl.textContent = originalFileName;
            originalSizeEl.textContent = formatBytes(originalSizeBytes);
            formatBadge.textContent = originalFileType === 'image/png' ? 'PNG' : 'JPEG';

            updateActivePreset(1);
            updatePreview();
            toast(`Loaded ${img.width}×${img.height}`, 'success');
        };
        img.onerror = () => toast('Could not read image', 'danger');
        img.src = e.target.result;
    };
    reader.onerror = () => toast('Could not read file', 'danger');
    reader.readAsDataURL(file);
}

// ---------------------------------------------------------
// Controls
// ---------------------------------------------------------
qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value + '%';
    updatePreview();
});

widthInput.addEventListener('input', () => {
    if (isAspectLocked && widthInput.value) {
        heightInput.value = Math.max(1, Math.round(parseInt(widthInput.value) / aspectRatio));
    }
    syncPresetFromCurrent();
    updatePreview();
});
heightInput.addEventListener('input', () => {
    if (isAspectLocked && heightInput.value) {
        widthInput.value = Math.max(1, Math.round(parseInt(heightInput.value) * aspectRatio));
    }
    syncPresetFromCurrent();
    updatePreview();
});

aspectRatioLock.addEventListener('click', () => {
    isAspectLocked = !isAspectLocked;
    aspectRatioLock.setAttribute('aria-pressed', String(isAspectLocked));
    aspectRatioLock.setAttribute('title', isAspectLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked');
    if (isAspectLocked && widthInput.value) {
        heightInput.value = Math.max(1, Math.round(parseInt(widthInput.value) / aspectRatio));
        updatePreview();
    }
});

document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!originalImage) return;
        const scale = parseFloat(btn.dataset.scale);
        widthInput.value  = Math.max(1, Math.round(originalImage.width * scale));
        heightInput.value = Math.max(1, Math.round(originalImage.height * scale));
        updateActivePreset(scale);
        updatePreview();
    });
});

function updateActivePreset(scale) {
    document.querySelectorAll('.preset-chip').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.scale) === scale);
    });
}
function syncPresetFromCurrent() {
    if (!originalImage) return;
    const w = parseInt(widthInput.value);
    if (!w) { updateActivePreset(NaN); return; }
    const scale = w / originalImage.width;
    const matched = [1, 0.75, 0.5, 0.25].find(s => Math.abs(scale - s) < 0.01);
    updateActivePreset(matched ?? NaN);
}

// ---------------------------------------------------------
// Render / preview
// ---------------------------------------------------------
function renderToCanvas(w, h) {
    previewCanvas.width  = w;
    previewCanvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(originalImage, 0, 0, w, h);
}

function currentMimeType() {
    return originalFileType === 'image/png' ? 'image/png' : 'image/jpeg';
}

function updatePreview() {
    if (!originalImage) return;

    const targetW = Math.max(1, parseInt(widthInput.value) || originalImage.width);
    const targetH = Math.max(1, parseInt(heightInput.value) || originalImage.height);
    const quality = parseInt(qualitySlider.value) / 100;

    renderToCanvas(targetW, targetH);

    const mime = currentMimeType();
    const dataUrl = previewCanvas.toDataURL(mime, quality);
    downloadLink.href = dataUrl;

    // Compute compressed size
    previewCanvas.toBlob(blob => {
        lastBlobSize = blob ? blob.size : 0;
        compressedSizeEl.textContent = lastBlobSize ? formatBytes(lastBlobSize) : '—';
        updateSavings();
    }, mime, quality);

    // Download filename
    const baseName = originalFileName.split('.').slice(0, -1).join('.') || 'image';
    const ext = mime.split('/')[1];
    downloadLink.download = `${baseName}_${targetW}x${targetH}_q${Math.round(quality * 100)}.${ext}`;

    currentDimensionsSpan.textContent = `${targetW} × ${targetH}`;
    formatBadge.textContent = mime === 'image/png' ? 'PNG' : 'JPEG';
}

function updateSavings() {
    if (!originalSizeBytes || !lastBlobSize) {
        savingsEl.textContent = '—';
        savingsEl.className = 'neutral';
        return;
    }
    const pct = Math.round((1 - lastBlobSize / originalSizeBytes) * 100);
    savingsEl.textContent = pct > 0 ? `−${pct}%` : pct < 0 ? `+${-pct}%` : '0%';
    savingsEl.className = pct > 0 ? 'savings' : pct < -5 ? 'savings worse' : 'savings neutral';
}

// ---------------------------------------------------------
// Target size optimizer (binary search on quality)
// ---------------------------------------------------------
optimizeSizeButton.addEventListener('click', handleOptimizeSize);

async function handleOptimizeSize() {
    if (!originalImage) return;
    const targetKB = parseInt(targetSizeInput.value, 10);
    if (!Number.isFinite(targetKB) || targetKB <= 0) {
        toast('Enter a target size in KB', 'danger');
        targetSizeInput.focus();
        return;
    }

    const mime = currentMimeType();
    if (mime === 'image/png') {
        toast('PNG is lossless — switching to JPEG for target-size optimization', 'default');
    }

    const targetBytes = targetKB * 1024;
    const btnLabel = optimizeSizeButton.querySelector('.btn-label');
    const originalText = btnLabel.textContent;
    btnLabel.textContent = 'Optimizing…';
    optimizeSizeButton.disabled = true;

    const targetW = Math.max(1, parseInt(widthInput.value) || originalImage.width);
    const targetH = Math.max(1, parseInt(heightInput.value) || originalImage.height);
    renderToCanvas(targetW, targetH);

    let lo = 10, hi = 100, bestQ = 50, bestSize = Infinity;
    for (let i = 0; i < 12; i++) {
        const q = Math.round((lo + hi) / 2);
        const size = await canvasSize(q / 100, 'image/jpeg');
        if (size <= targetBytes) {
            if (size > bestSize || !isFinite(bestSize) || Math.abs(size - targetBytes) < Math.abs(bestSize - targetBytes)) {
                bestQ = q;
                bestSize = size;
            }
            lo = q + 1;
        } else {
            hi = q - 1;
        }
        if (lo > hi) break;
    }

    qualitySlider.value = bestQ;
    qualityValue.textContent = bestQ + '%';
    updatePreview();

    btnLabel.textContent = originalText;
    optimizeSizeButton.disabled = false;
    toast(
        `Optimized → ${formatBytes(bestSize)} at ${bestQ}% quality`,
        'success',
    );
}

function canvasSize(quality, mime = 'image/jpeg') {
    return new Promise(resolve => {
        previewCanvas.toBlob(blob => resolve(blob ? blob.size : Infinity), mime, quality);
    });
}

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------
function formatBytes(n) {
    if (!n || n < 0) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

function toast(msg, kind = 'default') {
    const el = document.getElementById('toast');
    el.className = 'toast ' + (kind === 'danger' ? 'danger' : kind === 'success' ? 'success' : '');
    el.innerHTML = iconForKind(kind) + `<span>${escapeHTML(msg)}</span>`;
    void el.offsetWidth;
    el.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('visible'), 2800);
}
function iconForKind(kind) {
    if (kind === 'danger')  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    if (kind === 'success') return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
}
function escapeHTML(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ---------------------------------------------------------
   Support dialog (shared across vijay.tools)
--------------------------------------------------------- */
const BMC_UPI_ID   = 'vijaygupta1818@ptyes';
const BMC_UPI_NAME = 'Vijay Gupta';
const BMC_TN       = 'vijay.tools support';

function buildUpiIntent(amount) {
    const params = new URLSearchParams({ pa: BMC_UPI_ID, pn: BMC_UPI_NAME, cu: 'INR', tn: BMC_TN });
    if (amount) params.set('am', String(amount));
    return `upi://pay?${params.toString()}`;
}

function wireSupportDialog() {
    const dialog  = document.getElementById('supportDialog');
    const copyBtn = document.getElementById('supportCopyBtn');
    const amt49   = document.getElementById('amount49');
    const amt99   = document.getElementById('amount99');
    if (!dialog) return;

    if (amt49) amt49.href = buildUpiIntent(49);
    if (amt99) amt99.href = buildUpiIntent(99);

    const open = () => {
        dialog.classList.add('open');
        dialog.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        dialog.classList.remove('open');
        dialog.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-open="support"], #supportFab').forEach(el => {
        el.addEventListener('click', open);
    });
    dialog.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && dialog.classList.contains('open')) close();
    });

    if (copyBtn) {
        const icon = document.getElementById('supportCopyIcon');
        const original = icon ? icon.innerHTML : '';
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(BMC_UPI_ID);
                copyBtn.classList.add('copied');
                if (icon) icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    if (icon) icon.innerHTML = original;
                }, 2000);
            } catch {
                toast('Copy failed — long-press to copy manually', 'danger');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', wireSupportDialog);
