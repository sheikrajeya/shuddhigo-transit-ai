# ShuddhiGo — AI-Powered Transit Hygiene & Vehicle Health Platform

> **Tagline:** Happy Ride, Peaceful Mind.  
> **Regional Deployment:** Visakhapatnam (APSRTC) | Route 28K (RTC Complex to Simhachalam)  
> **Target Vehicle:** AP-31-Z-4829  

ShuddhiGo is an AI-driven public transit monitoring system built for the Google AI Builder Cup. It leverages **Gemini 1.5 Pro** and **Google Cloud Run / Firebase** to eliminate false cleaning claims, verify hygiene reports, streamline seat booking, and enhance passenger comfort.

---

## Key Features

1. **Public Priority Hygiene Reporting & Verification**
   - Commuters report unclean conditions (e.g., mold, spilled liquids, damaged seating) via geotagged photos.
   - **Hackproof Timetable Cross-Match:** If a license plate photo is blurry, obscured, or missed, Gemini 1.5 Pro cross-references the stop location (`RTC Complex`), stop time (`10:30 AM`), and route schedule (`Route 28K`) against APSRTC depot dispatch logs to identify vehicle `AP-31-Z-4829`.
   - **Pre-Trip Baseline Audit Cross-Check:** Gemini compares 5:00 AM depot sign-off photos against 10:30 AM commuter reports to detect discrepancy and flag invalid cleaning certifications.

2. **Sequential Smart Seat Allocation & Digital Media Hub**
   - Sequential seating fills rows systematically for optimal onboard weight distribution and commuter comfort.
   - Onboard QR hub provides instant access to daily e-books and news digests without heavy hardware overhead.

3. **Pre-Trip Depot Inspection Logging**
   - Depot staff upload pre-trip visual verification logs stored securely in Firebase Cloud Storage for automated compliance audits.

---

## Tech Stack & Architecture

- **Frontend:** React, Tailwind CSS, Lucide React
- **AI Core:** Gemini 1.5 Pro (Multimodal Vision API & Timetable Verification Engine)
- **Backend / Storage:** Google Cloud Run, Firebase Cloud Storage
