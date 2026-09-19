# 🍕 Olive Pizza Franchise — Multi-Branch Operations & Regional Administration

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Electron](https://img.shields.io/badge/Electron-33.4-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.6-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **Olive Pizza Franchise Suite** is the dedicated multi-branch operations and administrative suite built for regional franchise owners and territory operations managers. Runs on Web (Port 5175), Desktop (Electron), and Mobile/Tablet (Capacitor).

---

## 🌟 Key Features & Management Systems

### 📊 1. Multi-Branch Operations & Consolidated Metrics
* **Unified Overview**: Real-time sales, order counts, average preparation times, and active delivery statuses across all licensed branches.
* **Branch Comparison**: Direct side-by-side benchmarking of branch revenue, customer ratings, cancellation rates, and peak operating hours.

### 👥 2. Staff & Device Hardware Provisioning
* **Staff Role Management**: Provision and manage credentials for:
  - Branch Managers (KDS access)
  - Front-Desk Cashiers (POS access)
  - Delivery Fleet Riders (Delivery app access)
* **POS Terminal Device Authorization**: Generate and revoke device authentication tokens binding physical POS hardware to specific branches.

### 🔄 3. Top-Bar Global Owner Context Switcher
* **Global Owner Mode**: When accessed by authorized platform owners (`olivepizzarjn@gmail.com`, `webhub2811@gmail.com`), renders a dynamic top-bar dropdown:
  ```text
  Current Franchise: [Franchise Name ▼]    [← Back to Owner Console]
  ```
  Enables instant context switching between franchises without re-authenticating.
* **Strict Regional Scoping**: Regional franchise licensees are locked strictly to their assigned franchise territory.

### 📈 4. Consolidated Financial & Tax Reporting
* **Revenue Breakdown**: Aggregated sales filtered by Dine-In, Takeaway, and Online Delivery channels.
* **Tax Accounting**: Detailed calculations for Central GST (CGST) and State GST (SGST) per branch.
* **Payment Method Distribution**: Live tallies of UPI QR, Cash on Delivery, credit/debit cards, and payment gateway collections.

### 📑 5. Parameterized Accounting Reports
* **Flexible Date Windows**: Native reporting powered by `SalesCalculationEngine.ts` supporting `today`, `yesterday`, `this_week`, `last_week`, `this_month`, `last_month`, `this_year`, and custom date ranges.
* **Multi-Branch Isolation**: Strict scoping prevents cross-franchise data leakage while allowing territory-wide rollups.

---

## 🏗️ Technical Architecture & Stack

- **Frontend Core**: React 19, TypeScript, Vite 6, Tailwind CSS v4
- **State Management**: Zustand
- **Desktop Runtime**: Electron 33, `electron-builder`
- **Mobile Container**: Capacitor 7 (Android / iOS)
- **Backend & Auth**: Canonical Central Backend (`http://localhost:5000`), Firebase Auth & Firestore
- **Icons & UI**: Lucide React, React Hot Toast

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- Central Backend running on `http://localhost:5000` (or configured production backend)

### 2. Installation
```bash
cd olive-pizza-franchise
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=olive-pizza-08.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=olive-pizza-08
VITE_FIREBASE_STORAGE_BUCKET=olive-pizza-08.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Running Locally
```bash
# Start Vite web dev server on port 5175
npm run dev

# Or start Electron desktop application in development
npm run desktop
```

### 5. Building for Production
```bash
# Web application build
npm run build

# Windows desktop installer (.exe)
npm run build:win

# macOS desktop installer (.dmg)
npm run build:mac

# Android / iOS Capacitor sync
npx cap sync
```

---

## 📄 License

Proprietary Software — All rights reserved by **Olive Pizza**, Rajnandgaon, Chhattisgarh, India.
