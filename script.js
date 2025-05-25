// Get references to HTML elements
const imageUpload = document.getElementById('imageUpload');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const aspectRatioLock = document.getElementById('aspectRatioLock');
const previewCanvas = document.getElementById('previewCanvas');
const downloadLink = document.getElementById('downloadLink');
const ctx = previewCanvas.getContext('2d');
const currentDimensionsSpan = document.getElementById('currentDimensions');
const targetSizeInput = document.getElementById('targetSizeInput');
const optimizeSizeButton = document.getElementById('optimizeSizeButton');

// Variables to store original image data and settings
let originalImage = null;
let aspectRatio = 1;
let isAspectRatioLocked = true;
let originalFileName = '';
let originalFileType = '';

// Initial state for download link (hidden until image is loaded)
downloadLink.style.display = 'none';
// Disable controls initially
disableControls();

// Event listener for file upload input
imageUpload.addEventListener('change', handleImageUpload);

// Handles image file selection
function handleImageUpload(event) {
    const file = event.target.files[0];

    if (file) {
        originalFileName = file.name;
        originalFileType = file.type;
        const reader = new FileReader();

        // When the file is read
        reader.onload = function(e) {
            const img = new Image();
            // When the image is loaded
            img.onload = function() {
                originalImage = img;
                aspectRatio = originalImage.width / originalImage.height;
                // Set initial dimensions to original image size
                widthInput.value = originalImage.width;
                heightInput.value = originalImage.height;
                // Reset quality to default (90) on new upload
                qualitySlider.value = 90;
                qualityValue.textContent = '90%';
                // Update the preview canvas
                updatePreview();
                // Show the download link
                downloadLink.style.display = 'inline-block';
                // Enable controls
                enableControls();
            }
            // Set the image source to the data URL
            img.src = e.target.result;
        }

        // Read the file as a data URL
        reader.readAsDataURL(file);
    }
}

// Updates the canvas preview and download link based on current settings
function updatePreview() {
    if (!originalImage) {
        currentDimensionsSpan.textContent = '-- x --';
        return;
    }

    let targetWidth = parseInt(widthInput.value) || originalImage.width;
    let targetHeight = parseInt(heightInput.value) || originalImage.height;
    // Get quality from slider (0.1 to 1.0)
    const quality = parseInt(qualitySlider.value) / 100;

    // Apply aspect ratio lock logic
    if (isAspectRatioLocked) {
        if (widthInput.value && !heightInput.value) {
            // If width is set, calculate height based on aspect ratio
            targetHeight = targetWidth / aspectRatio;
            heightInput.value = Math.round(targetHeight);
        } else if (heightInput.value && !widthInput.value) {
             // If height is set, calculate width based on aspect ratio
             targetWidth = targetHeight * aspectRatio;
             widthInput.value = Math.round(targetWidth);
        } else if (widthInput.value && heightInput.value) {
            // If both are set, adjust height based on width if locked
             targetHeight = targetWidth / aspectRatio;
             heightInput.value = Math.round(targetHeight);
        }
    } else {
         // If not locked and both are set, use the user's values
         if (!widthInput.value && heightInput.value) {
             targetWidth = targetHeight * aspectRatio;
             widthInput.value = Math.round(targetWidth);
         } else if (widthInput.value && !heightInput.value) {
            targetHeight = targetWidth / aspectRatio;
            heightInput.value = Math.round(targetHeight);
         } else if (!widthInput.value && !heightInput.value) {
            // If neither is set, revert to original dimensions
            targetWidth = originalImage.width;
            targetHeight = originalImage.height;
            widthInput.value = targetWidth;
            heightInput.value = targetHeight;
         }
    }

    // Set canvas dimensions to target dimensions
    previewCanvas.width = targetWidth;
    previewCanvas.height = targetHeight;

    // Clear canvas and draw the image with new dimensions
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

    // Determine output format based on original file type.
    // JPEG is generally better for compression with quality setting.
    // Use PNG if the original was PNG to preserve transparency if needed, but quality slider won't affect it for PNG.
    const outputMimeType = originalFileType === 'image/png' ? 'image/png' : 'image/jpeg';
    const dataUrl = previewCanvas.toDataURL(outputMimeType, quality);

    // Update download link href with the generated data URL
    downloadLink.href = dataUrl;

    // Generate a dynamic download filename
    const originalNameWithoutExt = originalFileName.split('.').slice(0, -1).join('.');
    const outputExtension = outputMimeType.split('/')[1];
    downloadLink.download = `${originalNameWithoutExt}_${Math.round(targetWidth)}x${Math.round(targetHeight)}_q${Math.round(quality * 100)}.${outputExtension}`;

    // Update displayed dimensions
    currentDimensionsSpan.textContent = `${Math.round(targetWidth)} x ${Math.round(targetHeight)}`;
}

// Event Listeners for controls
// Update quality value display and preview on slider change
qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value + '%';
    updatePreview();
});

// Update preview on dimension input changes
widthInput.addEventListener('input', updatePreview);
heightInput.addEventListener('input', updatePreview);

// Event listener for aspect ratio lock button
aspectRatioLock.addEventListener('click', toggleAspectRatioLock);

// Toggles the aspect ratio lock state
function toggleAspectRatioLock() {
    isAspectRatioLocked = !isAspectRatioLocked;
    // Change button text/emoji
    aspectRatioLock.textContent = isAspectRatioLocked ? '🔒' : '🔓';
    // When toggling to locked, potentially re-calculate the other dimension
    if (isAspectRatioLocked) {
         if (widthInput.value) {
             heightInput.value = Math.round(parseInt(widthInput.value) / aspectRatio);
         } else if (heightInput.value) {
             widthInput.value = Math.round(parseInt(heightInput.value) * aspectRatio);
         }
    }
    updatePreview(); // Update preview to reflect potential dimension changes
}

// Function to enable controls
function enableControls() {
    qualitySlider.disabled = false;
    widthInput.disabled = false;
    heightInput.disabled = false;
    aspectRatioLock.disabled = false;
    targetSizeInput.disabled = false;
    optimizeSizeButton.disabled = false;
    // downloadLink.style.display is handled in handleImageUpload and updatePreview
}

// Function to disable controls
function disableControls() {
    qualitySlider.disabled = true;
    widthInput.disabled = true;
    heightInput.disabled = true;
    aspectRatioLock.disabled = true;
    targetSizeInput.disabled = true;
    optimizeSizeButton.disabled = true;
    downloadLink.style.display = 'none'; // Hide download link when no image
}

// Event listener for optimize size button
optimizeSizeButton.addEventListener('click', handleOptimizeSize);

// Handles the optimize size button click
async function handleOptimizeSize() {
    if (!originalImage) return;

    const targetKB = parseInt(targetSizeInput.value);
    if (isNaN(targetKB) || targetKB <= 0) {
        alert('Please enter a valid target size in KB.');
        return;
    }

    const targetBytes = targetKB * 1024;
    disableControls(); // Disable controls during optimization
    optimizeSizeButton.textContent = 'Optimizing...';

    // Binary search for optimal quality
    let minQuality = 10;
    let maxQuality = 100;
    let bestQuality = qualitySlider.value; // Start with current quality as a potential best
    let currentSize = Infinity; // Initialize with a large value

    // Perform a fixed number of iterations for binary search convergence
    for (let i = 0; i < 15; i++) { // 15 iterations are usually enough for 0-100 range
        const midQuality = Math.round((minQuality + maxQuality) / 2);
        if (minQuality >= maxQuality) { // Stop if range is too small or inverted
            bestQuality = midQuality;
            break;
        }

        // Render with current quality and get size
        previewCanvas.width = parseInt(widthInput.value) || originalImage.width;
        previewCanvas.height = parseInt(heightInput.value) || originalImage.height;
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.drawImage(originalImage, 0, 0, previewCanvas.width, previewCanvas.height);

        // Get Blob size (async operation)
        currentSize = await new Promise(resolve => {
            previewCanvas.toBlob(blob => {
                resolve(blob ? blob.size : Infinity);
            }, 'image/jpeg', midQuality / 100);
        });

        // Adjust search range
        if (currentSize > targetBytes) {
            maxQuality = midQuality -1 ;
        } else {
            minQuality = midQuality + 1 ;
            // If the current size is less than or equal to the target, this is a potential best quality
            bestQuality = midQuality; // Store the quality that resulted in a size <= target
        }
         // In case we undershoot and then the size is too small, we still want the last quality that was <= target
        if (currentSize <= targetBytes) {
             bestQuality = midQuality;
        }

        // Small delay to allow UI to update (optional but can improve perceived responsiveness)
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    // After search, set the quality slider to the best quality found
    qualitySlider.value = bestQuality;
    qualityValue.textContent = bestQuality + '%';

    // Update the preview and download link with the final quality
    updatePreview();

    optimizeSizeButton.textContent = 'Optimize Quality';
    enableControls(); // Re-enable controls
}

// Initial setup or maybe hide controls until image is loaded?
// For now, they are visible by default. You could add logic here
// to hide dimension/quality controls and the download link initially. 