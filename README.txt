# Buy-Points Next.js App - Deployment Instructions

This app is built with Next.js 16 and is ready for production deployment on cPanel (Node.js).

---

## 1. Contents of this package

- .next/                  → Compiled production build (do not delete)
- public/                 → Static assets (images, favicon, etc.)
- app/                    → Next.js application source
- components/             → Reusable React components (if any)
- pages/                  → Pages & API routes
- server.js               → Custom server entry point
- package.json            → Project dependencies and scripts
- package-lock.json       → Exact dependency versions
- next.config.js          → Next.js configuration
- tailwind.config.js      → Tailwind CSS configuration
- postcss.config.js       → PostCSS configuration
- .env.local              → Environment variables (Paystack keys, etc.)

---

## 2. Uploading to cPanel

1. Log in to your cPanel account.
2. Navigate to **File Manager**.
3. Upload and unzip the `buy-points` folder to your desired directory (e.g., `/home/username/buy-points`).

---

## 3. Setup Node.js Application

1. Go to **Setup Node.js App** in cPanel.
2. Set **Application Root** to the folder where you uploaded the app (e.g., `/home/username/buy-points`).
3. Set **Startup File** to: `server.js`
4. Choose a Node.js version (recommend Node 18 or newer).
5. Set **Environment** to: `production`
6. Click **Create Application**.

---

## 4. Install Dependencies

1. Open **Terminal** in cPanel (or use “Run NPM Install” in Node.js App interface).
2. Run:

---

## 5. Running the App

1. In cPanel Node.js App interface, click **Run NPM Start** or run:
2. Your app should now be live. Open the URL provided by cPanel to check.

---

## 6. Environment Variables

- The `.env.local` file is included and contains all necessary keys.
- Make sure this file stays in the root of the project.
- Do **not** share this file publicly.

---

## 7. Notes

- The `success` page and all other pages are fully included in the build.
- Any future updates should follow the same process: build locally → zip → upload → install deps → start.

---

Thank you for deploying the Buy-Points app! 🚀
