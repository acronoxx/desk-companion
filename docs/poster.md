# Poster — proposed structure

A3 poster for the Forum (14 December). Mockup: [`poster_mockup.png`](poster_mockup.png) (A3 portrait, 2480 × 3508 px). The dashed boxes are placeholders for real photos.

**Rule: anyone must understand it in 30 seconds, without knowing how to code.** Pictures first, at most two lines of text per block.

## 1. Title and hook

- **Desk Companion** — *Never miss a deadline again.*
- One sentence: *A small device on your desk that lights up and vibrates when it is time to do your tasks, synced with an app on your phone.*
- A big photo of the device glowing on a desk.

## 2. The problem

Figures from our survey (131 IMT Atlantique students, September – October, see [`survey_report.pdf`](survey_report.pdf)):

| Figure | Meaning |
|---|---|
| **42%** | forget important tasks at least sometimes |
| **53%** | most often forget assignment deadlines |
| **52%** | ignored a phone reminder and then forgot the task |
| **68%** | would like reminders outside their phone |

The survey is the strongest argument of the poster: make the numbers big.

## 3. Our solution

A simple diagram, icons only, no technical words:

```
📱 The app  ──►  ☁️ The cloud  ──►  💡 The device
write reminders   keeps them safe     lights up and vibrates
                  and sends them      at the right time
```

Two short "why" boxes linking the design to the survey:

- **Why light and vibration?** Sound alarms were the most overwhelming option for students (39%).
- **Why an app?** An easy phone connection was the most wanted feature (44%).

## 4. How we built it (creation process)

A timeline of 7 steps, one icon and one sentence each:

| # | When | Step | Sentence |
|---|---|---|---|
| 1 | Sept – Oct | 🔍 Ask | Survey of 131 students |
| 2 | October | ✏️ Decide | Pick the features from their answers |
| 3 | October | ☁️ Cloud | A secure online database for reminders |
| 4 | Oct – Nov | 📱 App | Create and organise reminders |
| 5 | November | 🔧 Device | Wi-Fi chip, light and vibration, 3D-printed case at the Fab Lab |
| 6 | November | 🔗 Connect | Link the device to your account with a 6-digit code |
| 7 | End of Nov | 🧪 Test | Students try it, we improve it |

## 5. How to use it

1. Plug in the device and choose your Wi-Fi.
2. Type the 6-digit code from its Wi-Fi page in the app.
3. Add a reminder: your desk reminds you on time.

Next to it: a screenshot of the app and a photo of the 3D model or of the Fab Lab work.

## 6. Footer

- Team: BARET Alexis · BADSSI Chaimae · SEFYANI Diae · DAUMARIE Colin
- IMT Atlantique · English project · Forum, 14 December
- QR code to a demo video or the GitHub repository
- Technologies in small print only, for the technical audience: React Native (Expo), Supabase, ESP32.

## To avoid

- Technical words in the main text (Supabase, ESP32, Edge Function, RLS, NVS…): say *cloud*, *Wi-Fi chip*, *secure* instead.
- Code screenshots or the full architecture diagram of [`architecture.md`](architecture.md).
- Long paragraphs: if a block needs more than two lines, replace it with a picture.
