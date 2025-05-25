# Client-Side Image Compressor and Resizer

This is a simple, client-side web application that allows users to compress and resize images directly in their browser. It's designed to be hosted easily, for example, on GitHub Pages.

## Features

*   Upload images (JPEG, PNG, etc.)
*   Adjust image quality (compression) with a slider
*   Resize the image by setting custom width and height
*   Option to optimize quality to meet a target file size in KB
*   Preview the compressed/resized image
*   Download the resulting image

## Technologies Used

*   HTML
*   CSS
*   JavaScript
*   Browser APIs: `FileReader`, `Image`, `canvas`, `Blob`, `URL`

## How to Use

1.  **Clone or Download:** Get the project files (`index.html`, `style.css`, `script.js`).
2.  **Open in Browser:** Open the `index.html` file directly in your web browser.
3.  **Upload Image:** Click the "Choose File" button to select an image from your computer.
4.  **Adjust Settings:** Use the quality slider to change compression, or enter new values in the Width and Height fields to resize. The preview will update automatically.
5.  **Optimize for Size (Optional):** Enter a target size in kilobytes in the "Optimize for Size (KB)" input and click "Optimize Quality" to find the best quality setting to achieve that size.
6.  **Download:** Click the "Download Image" link to save the processed image.

## Hosting on GitHub Pages

1.  **Create a GitHub Repository:** Create a new public repository on GitHub.
2.  **Upload Files:** Upload `index.html`, `style.css`, and `script.js` to the root directory of your repository.
3.  **Configure GitHub Pages:**
    *   Go to your repository's `Settings`.
    *   Navigate to the `Pages` section.
    *   Under "Build and deployment", select `Deploy from a branch`.
    *   Choose your main branch (usually `main` or `master`) and select the `/(root)` folder.
    *   Click `Save`.
4.  **Access Your Site:** Your site will be deployed to `https://<your-github-username>.github.io/<repository-name>/` within a few minutes. You can find the link displayed in the GitHub Pages section after deployment is complete.

## Customization

You can customize the appearance by editing the `style.css` file or modify the functionality by editing `script.js`. 