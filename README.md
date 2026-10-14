# OSTTRA SSO Central — Enterprise Prototype

A comprehensive React & TypeScript prototype for the **OSTTRA Single Sign-On (SSO) Central Portal**, featuring federated domain management, 4-eye approval governance, SAML/Entra metadata administration, user migration workflows, application secret expiry monitoring, MFA reset controls, and real-time user SSO last-login telemetry tracking.

---

## ⚡ Quick Start (Run on Any Computer)

### Prerequisites
- **[Node.js](https://nodejs.org/)** (v18 or higher recommended; v20 / v22 / v25 supported)
- Modern web browser (Chrome, Edge, Firefox, Safari)

---

### Option A: 1-Click Launcher (Windows)
1. Double-click **`start.bat`**.
2. It will automatically check for Node.js, install dependencies if missing, and launch the portal in your default browser at **`http://localhost:3000`**!

---

### Option B: 1-Click Launcher (macOS / Linux)
1. Open Terminal in this folder.
2. Run:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

---

### Option C: Manual Command Line
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start development server:**
   ```bash
   npm run dev
   ```
3. Open your browser at:
   ```
   http://localhost:3000
   ```
   *(If port 3000 is occupied, Vite will automatically select the next free port, e.g. `http://localhost:3001`)*.

---

## 🔑 Demo & Test Accounts

To sign into the portal or test features, use any of these sample identities:

| Email | Domain Type | Collaboration Type |
|---|---|---|
| `ajay.swarnkar@osttra.com` | Internal Corporate | Entra ID (Federated) |
| `ajay.swarnkar@traiana.com` | Business Entity | SAML 2.0 |
| `john.doe@barclays.com` | External Client | SAML 2.0 |
| `jane.smith@jpmorgan.com` | External Client | Entra ID (Federated) |

*Default test password:* `Admin@123` (or any string in prototype mode).

---

## 🛠️ Key Portal Modules Included

1. **Domain Enquiry (Blotter):**
   - Filterable directory of all federated and non-federated domains.
   - SAML, Entra ID (Fed/Non-Fed), B2B, and OTP configurations.
   - Domain detail drawer with IP whitelisting, application mappings, and real-time user login status.
2. **Pending Reviews (4-Eyes Check):**
   - Dual-authorization workflow for domain registrations and migrations.
   - Approver inspection and 1-click approval/rejection audit trail.
3. **Domain & User Migration:**
   - Multi-step migration drawer for transferring legacy users to federated authentication.
4. **User Login Log (SSO Activity & Telemetry):**
   - Real-time audit log of user logins across all downstream applications (`CFD`, `CRDS`, `TradeServ`, `MarkitWire`, `Traiana Harmony`, etc.) and environments (`PROD` & `UAT`).
   - "Simulate SSO Login" action to test authentication events on the fly.
   - Consolidated summary tab showing the latest login per user and application.
   - 1-click CSV export.
5. **Configuration & Governance:**
   - Blocked domains management (Blacklist with regex pattern matching).
   - SAML metadata certificate and entity ID management.
   - 4-Eyes policy toggle.
6. **Audit Logs & Compare View:**
   - Full timeline history of domain and user modifications.
   - Visual side-by-side snapshot comparison for audit reviews.
7. **API Health Monitor:**
   - Real-time microservice status, latency telemetry, and manual health probes.
8. **App Secrets & Expiry Monitor:**
   - Client secrets, SAML signing certs, and automated expiration warnings.
9. **Traiana Legacy App OTP & Skip Counter:**
   - Skip counter reset modal, login journey simulator, and audit logs.
10. **Reset MFA:**
    - MFA un-enrollment and device re-registration workflows.

---

## 📦 Building for Production

To create a static production build:
```bash
npm run build
```
The compiled static assets will be in the **`dist/`** folder and can be served with any static web host or container (`npx serve dist`).

---

## 👥 Tech Stack
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons:** Lucide React
- **Animations:** Motion
- **Build Tool:** Vite 6
