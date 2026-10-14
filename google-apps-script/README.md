# Deploying OSTTRA SSO Central on Google Apps Script (Web App)

This folder contains the self-contained, production-bundled version of the **OSTTRA SSO Central Portal** that can be hosted directly on **Google Apps Script** as a Web App.

Once deployed, anyone on your team with the link can access and run the complete interactive prototype directly in their browser—**no installation, no Node.js, and no terminal required!**

---

## 🚀 2-Minute Deployment Steps

### Step 1: Create a new Apps Script Project
1. Open your browser and go to: **[https://script.google.com/](https://script.google.com/)**
2. Click **"+ New project"** (top left).
3. Name the project (e.g. **`OSTTRA SSO Central Portal`**).

---

### Step 2: Paste the Code

#### 1. `Code.gs`
- Click on **`Code.gs`** in the left file tree.
- Select all existing code and replace it with the contents of **`Code.gs`** from this folder:
  ```javascript
  function doGet(e) {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('OSTTRA SSO Central Portal')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  ```

#### 2. `Index.html`
- In the Apps Script editor, click the **`+`** icon next to **Files** and select **HTML**.
- Name the file **`Index`** (it will automatically become `Index.html`).
- Open **`google-apps-script/Index.html`** on your computer, copy all contents (`Ctrl + A`, `Ctrl + C`), and paste it into the editor (`Ctrl + V`).

#### 3. Save
- Click the **Save 💾** icon (or press `Ctrl + S`).

---

### Step 3: Deploy as a Web App
1. At the top right of the editor, click **Deploy** ➔ **New deployment**.
2. Click the **gear icon ⚙️** next to "Select type" and select **Web app**.
3. Configure the settings:
   - **Description:** `Initial SSO Central Prototype Release`
   - **Execute as:** `Me (your.email@osttra.com)`
   - **Who has access:** 
     - Choose **`Anyone within OSTTRA`** (or `Anyone with Google account`) so your teammates can access it directly.
4. Click **Deploy**.
5. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).

---

### Step 4: Share with Your Team! 🎉
Send that link to your team via Microsoft Teams, Slack, or Email. Anyone clicking that URL will instantly see the complete SSO Central application running live.

---

## 🔄 How to Re-build After Code Changes

Whenever you modify components or code in the main React repository, you can update this Google Apps Script bundle with a single command:

```bash
npm run build:gas
```

This compiles your TypeScript/React changes, minifies the bundle, and automatically updates `google-apps-script/Index.html`. Then simply re-paste `Index.html` into Apps Script and click **Deploy ➔ Manage deployments ➔ Edit ➔ New version**!
