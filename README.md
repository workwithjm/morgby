# 🛡️ Morgby | Zero Cost Personal Surveillance

## 🛰️ [INTRODUCTION]

**Morgby** is a lightweight, high-efficiency personal surveillance tool designed to turn any spare smartphone, tablet, or laptop into a sophisticated, low-powered AI-powered security camera.

In a market saturated with expensive, subscription-based security hardware, Morgby offers a **low-cost alternative**. It is built for simplicity—requiring no app store downloads and no complex server configurations. By running entirely within your mobile browser, you can deploy a tactical surveillance station in under five minutes using hardware you already own.

## ☕ [SUPPORT THE PROJECT]

Morgby is free and open-source. Developing and maintaining an AI-powered surveillance suite requires significant time and testing on various hardware. If this tool has helped secure your home or property, consider supporting the developer:

### 🌍 Support my work!

* **Buy Me A Coffee:** [buymeacoffee.com/workwithjm](https://buymeacoffee.com/workwithjm)
* **GCash:** 🇵🇭 [QR Code Here!](https://github.com/workwithjm/morgby/blob/main/readmestuff/justgcashmylocationsir.png)


## ⚡ [FEATURES]

* **🧠 Human-Centric AI:** Powered by the COCO-SSD neural network, the system identifies actual human presence to virtually eliminate false alerts.
* **🤖 Private Telegram Bridge:** Receive instant photo evidence at a set frequency (default is every 5 minutes) and status reports directly to your private Telegram bot.
* **📦 Intelligent Caching:** Saves evidence to a local browser database and automatically syncs once the connection returns.
* **🕶️ Blackout Stealth:** Dedicated mode that turns the device screen completely black for discreet monitoring.
* **🎮 Remote Commands:** Message your bot `/photo` for an instant snapshot or `/status` to check diagnostics.

## ⚠️ [DISCLAIMER]

**Ethical Use Only:** This app is intended strictly for personal surveillance use (Home security, baby/pet monitoring).

**Prohibited Use:** This application must NOT be used for any form of illegal surveillance, stalking, or invasion of privacy. The user assumes full legal responsibility.

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

1. **Open Telegram** and search for `@BotFather`.
2. Send `/newbot` and follow the prompts.
3. Copy the **API Token** provided.
4. Search for `@userinfobot` to get your **Chat ID**.
5. **Important:** Open your new bot in Telegram and press **START**.

### 3. Configuring the App
1.  On the Morgby website, click the **CONFIG** tab.
2.  Paste your **Bot Token** and **Chat ID** into the respective fields.
3.  Click **TEST TRANSMISSION**. If you receive a message on Telegram, your setup is successful.
4.  Go to the **MONITOR** tab and click **ARM TACTICAL SUITE**.

### 4. Preventing Device Sleep
To ensure the camera stays active 24/7, adjust these settings:

**For iOS (iPhone/iPad):**
* **Auto-Lock:** `Settings > Display > Auto-Lock` ➔ **Never**.
* **Power Mode:** `Settings > Battery` ➔ **Low Power Mode: OFF**.
* **Safari Flag:** `Settings > Safari > Advanced > Feature Flags` ➔ Enable **Screen Wake Lock**.

**For Android:**
* **Stay Awake:** Enable `Developer Options` ➔ **Stay Awake** (On).
* **Battery Optimization:** `Settings > Apps > Chrome > Battery` ➔ **Unrestricted**.

### 5. Self-Hosting (Advanced) - Optional if you want to host this on your own device
To host Morgby on your own hardware (like a PC or Raspberry Pi):
1.  Download the index.html file in this repo.
2.  **Set up an HTTP Server:** In your project folder, run `python -m http.server 8080`.
3.  **Enable Browser Flags:** Browsers block cameras on non-HTTPS sites unless they are "localhost." To bypass this on your local network:
    * Navigate to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
    * Enable the flag and add your IP (e.g., `http://192.168.1.10:8080`).
    * Relaunch your browser.

---

## 🔋 [BATTERY & DEVICE MANAGEMENT]
Since this is a high-performance web app, it does not manage your hardware's battery. Follow these tips to keep your device healthy:

* **♨️ Heat Management:** AI processing generates significant heat. **Always remove phone cases** and ensure the device is in a well-ventilated area.
* **🔌 Smart Plug Strategy:** To prevent battery "swelling" from being at 100% charge indefinitely, use a **Smart Plug**. Set a timer to charge the device for 1 hour every 4-5 hours.
* **⚙️ Hardware Bypass (Expert Only):** For permanent 24/7 setups, consider removing the internal lithium battery entirely and powering the device directly via a 5V charging plug soldered to the battery terminals to eliminate fire risks.
