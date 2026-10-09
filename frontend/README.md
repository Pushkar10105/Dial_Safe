# frontend/

Website interface for DialSafe: scam number verification, verified brand helpline directory, live activity dashboard, and accessible multilingual AI voice assistant.

**Owner role:** Member 3 (Frontend)  
**Strict Rule:** Read `/AGENTS.md` before making changes.

---

## 1. Overview & Features

1. **Number Checker:** Verifies phone numbers in any common Indian format, checks against official records and community scam reports, and outputs the 4 canonical verdicts (`Verified official`, `High risk`, `Suspicious`, `Unknown`).
2. **Urgent Fraud Advisory:** Automatically alerts on High-Risk numbers with warnings not to share OTPs/PINs and provides one-click access to India's National Cybercrime Helpline **1930** and **cybercrime.gov.in**.
3. **Official Brand Directory:** Searchable directory of verified customer care helplines (e.g., Zomato, Swiggy, SBI, HDFC, Amazon, Flipkart) with official sources and last checked dates.
4. **Community Scam Reporting:** Form allowing users and victims to submit suspected fraud numbers and details into the shared database.
5. **Real-time Activity Dashboard:** Live metrics tracking total checks, fraud reports, and verified brands.
6. **WhatsApp Bot Bridge:** Displays join codes for Twilio WhatsApp sandbox and click-to-chat QR link.
7. **Accessibility & Elder Care Multilingual Voice Assistant:**
   - Designed specifically for elderly citizens who struggle to type on smartphones.
   - Greets users in voice upon launch.
   - **3 Languages Supported:** English (`en-IN`), हिन्दी / Hindi (`hi-IN`), தமிழ் / Tamil (`ta-IN`).
   - Powered by **Google Gemini API** for natural conversation, with automatic fallback to browser Web Speech API (STT & TTS) so it works out-of-the-box everywhere without requiring an API key.

---

## 2. Technology Stack

- **Framework:** React 19 + Vite 8
- **Styling:** Vanilla CSS (Glassmorphism, Dark Mode, Responsive Design, CSS variables)
- **Typography:** Outfit, Inter, Noto Sans Devanagari, Noto Sans Tamil (Google Fonts)
- **Speech Engine:** Web Speech Recognition & Web Speech Synthesis API
- **AI Engine:** Google Gemini API (gemini-1.5-flash) with local safety heuristics fallback

---

## 3. Installation & Running

### Requirements
- Node.js 18+ (tested on Node v24)

### Development Server
```bash
cd frontend
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 4. Environment Variables (`.env`)

Create a `.env` file in `frontend/` (optional):
```env
# URL of DialSafe backend (default: http://localhost:3000)
VITE_API_URL=http://localhost:3000

# Google Gemini API Key for AI voice assistant (optional; fallback operates if absent)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
