
# PEAKtax AI - Professional Tax Generator

A React-based AI tool that uses the Google Gemini API to generate US Taxation blogs.

## Features
- **Live Fact Checking:** Uses `googleSearch` tool with `gemini-2.5-flash` to gather real-time IRS data.
- **Complex Reasoning:** Uses `gemini-3-pro-preview` with Thinking Mode for accurate blog writing.
- **SEO Optimization:** Auto-generates Schema (JSON-LD), Meta Tags, and Open Graph tags.
- **Image Generation:** Uses `imagen-3.0-generate-001`.
- **E-E-A-T Compliance:** Hardcoded Author Profile integration.
- **History & Drafts:** Auto-saves work to local storage.

## How to Move to a NEW GitHub Repository

If your editor is stuck on an old repository:

1.  **Download** all files to your computer (or copy/paste them into a folder named `peaktax-ai`).
2.  Go to [GitHub.com](https://github.com) and create your **New Repository**.
3.  On the new repository page, click **"Add file"** -> **"Upload files"**.
4.  **Drag and Drop** all your files and folders into the browser window.
5.  Click **Commit changes**.

## How to Deploy on Vercel

1.  **Connect to Vercel:**
    *   Go to [Vercel](https://vercel.com).
    *   Click **"Add New..."** -> **"Project"**.
    *   Select your **NEW** `peaktax-ai` repository.

2.  **Configure Environment Variables:**
    *   **Important:** In the project settings, add the following variables:
    *   `VITE_API_KEY`: Your Google AI Studio Key (starts with AIza...).
    *   `VITE_APP_PASSWORD`: A password to protect your app (e.g., `MySecretPass`).

3.  **Deploy:**
    *   Click **Deploy**. Vercel will build the site and give you a live URL.

## Google Security Setup (Post-Deployment)
1.  Go to Google Cloud Console > Credentials.
2.  Edit your API Key.
3.  Under **Website Restrictions**, add your Vercel URL (e.g., `https://peaktax-ai.vercel.app/*`).