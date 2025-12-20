# 🛡️ Morgby | Zero Cost Surveillance

## 🛰️ [INTRODUCTION]
**Morgby** is a lightweight, high-efficiency personal surveillance tool designed to turn any spare smartphone, tablet, or laptop into a sophisticated AI-powered security camera. 

In a market saturated with expensive, subscription-based security hardware, Morgby offers a **low-cost, professional-grade alternative**. It is built for simplicity—requiring no app store downloads, no account registrations, and no complex server configurations. By running entirely within your mobile browser, you can deploy a tactical surveillance station in under five minutes using hardware you already own.

---

## ⚡ [FEATURES]
* **🧠 Human-Centric AI:** Powered by the COCO-SSD neural network, the system identifies actual human presence to virtually eliminate false alerts from shadows or pets.
* **🤖 Private Telegram Bridge:** Your camera becomes an interactive bot. Receive instant photo evidence and status reports directly to your Telegram app.
* **📦 Intelligent Caching:** If your internet connection flickers, Morgby saves evidence to a local browser database and automatically syncs it once the connection returns.
* **🕶️ Blackout Stealth:** A dedicated mode that turns the device screen completely black, allowing the camera to monitor discreetly without wasting power.
* **🎮 Remote Commands:** Take control from anywhere. Message your bot `/photo` for an instant snapshot or `/status` to check battery and storage levels.

---

## ⚠️ [DISCLAIMER]
**Ethical Use Only:** This app is intended strictly for personal surveillance use. 
**Examples of Use:**
* Home security monitoring while away.
* Baby or nursery observation.
* Pet monitoring.
* Vehicle or property oversight.

**Prohibited Use:** This application must NOT be used for any form of illegal surveillance, stalking, invasion of privacy, or criminal activity. The user assumes full legal responsibility for the deployment and use of this tool.

**Privacy & Security:** Your privacy is hardcoded. Morgby **does not** send your video feed or data to any third-party servers. All AI processing happens locally on your device. The only communication is an encrypted link between the app and the private Telegram bot that you personally set up.

**WIP Status:** Please note that the app is a **Work-In-Progress (WIP)**. You may encounter bugs or performance issues as development continues.

---

## 🛠️ [SETUP GUIDE]

### 1. Initial Access
On the device you intend to use as a camera, open the browser and go to:
🔗 [**https://morgby.pages.dev/**](https://morgby.pages.dev/)

### 2. Setting Up Your Telegram Bot
You need to create an encrypted "bridge" to receive your alerts:
1.  **Open Telegram** and search for `@BotFather`.
2.  Send the command `/newbot`. Follow the prompts to name your bot (e.g., "MySecurityCam").
3.  BotFather will provide an **API Token**. Copy this string.
4.  Search for `@userinfobot` in Telegram and send it a message. It will reply with your **Chat ID** (a 9-10 digit number). Copy this.
5.  **Crucial:** Open your new bot in Telegram and press **START**.

### 3. Configuring the App
1.  On the Morgby website, click the **CONFIG** tab.
2.  Paste your **Bot Token** and **Chat ID** into the respective fields.
3.  Click **TEST CONNECTION**. If you receive a message on Telegram, your setup is successful.
4.  Go to the **MONITOR** tab and click **ARM SYSTEM**.

### 4. Preventing Device Sleep
To ensure the camera stays active 24/7, adjust these settings:

**For iOS (iPhone/iPad):**
* **Auto-Lock:** `Settings > Display > Auto-Lock` ➔ **Never**.
* **Power Mode:** `Settings > Battery` ➔ **Low Power Mode: OFF**.
* **Safari Flag:** `Settings > Safari > Advanced > Feature Flags` ➔ Enable **Screen Wake Lock**.

**For Android:**
* **Stay Awake:** Enable `Developer Options` ➔ **Stay Awake** (On).
* **Battery Optimization:** `Settings > Apps > Chrome > Battery` ➔ **Unrestricted**.

### 5. Self-Hosting (Advanced)
To host Morgby on your own hardware (like a PC or Raspberry Pi):
1.  **Set up an HTTP Server:** In your project folder, run `python -m http.server 8080`.
2.  **Enable Browser Flags:** Browsers block cameras on non-HTTPS sites unless they are "localhost." To bypass this on your local network:
    * Navigate to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
    * Enable the flag and add your IP (e.g., `http://192.168.1.10:8080`).
    * Relaunch your browser.

---

## 🔋 [BATTERY & DEVICE MANAGEMENT]
Since this is a high-performance web app, it does not manage your hardware's battery. Follow these tips to keep your device healthy:

* **♨️ Heat Management:** AI processing generates significant heat. **Always remove phone cases** and ensure the device is in a well-ventilated area.
* **🔌 Smart Plug Strategy:** To prevent battery "swelling" from being at 100% charge indefinitely, use a **Smart Plug**. Set a timer to charge the device for 1 hour every 4-5 hours.
* **⚙️ Hardware Bypass (Expert Only):** For permanent 24/7 setups, consider removing the internal lithium battery entirely and powering the device directly via a 5V charging plug soldered to the battery terminals to eliminate fire risks.

---
