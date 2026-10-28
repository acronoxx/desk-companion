# Desk Companion

A desk device that reminds students of their tasks with light and vibration, synced with a mobile app (React Native, Expo, TypeScript) through Supabase.

- Repository: https://github.com/acronoxx/desk-companion
- The Expo project is in the `app/` folder. Run every `npm` and `npx expo` command from `app/`.

## Documentation

| File | Content |
|---|---|
| [`docs/survey_report.pdf`](docs/survey_report.pdf) | Needs assessment (survey of 131 students) and roadmap |
| [`docs/architecture.md`](docs/architecture.md) | Overall architecture: app, Supabase, ESP32, and the methods to write |
| [`database/schema.md`](database/schema.md) | Database diagram and tables |
| [`database/schema.sql`](database/schema.sql) | SQL script to create the database in Supabase |

## Running the app

```bash
cd app
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the camera app (iOS).

The phone and the computer must be on the same local network. **It does not work on eduroam**: use your phone's hotspot instead, or USB on Android:

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

then enter `exp://localhost:8081` in Expo Go.

## Project structure

```
desk-companion/
├── app/                  ← Expo project
│   ├── src/
│   │   ├── app/          ← screens (1 file = 1 route, Expo Router)
│   │   ├── components/   ← reusable components
│   │   ├── constants/    ← colors, spacing, fonts (theme.ts)
│   │   └── hooks/        ← reusable logic
│   ├── assets/           ← images and icons
│   └── app.json          ← app configuration
├── database/             ← Supabase schema (schema.sql + schema.md)
└── docs/                 ← survey report, architecture
```

| I want to add... | In... |
|---|---|
| A screen | `app/src/app/` |
| A piece of UI used in several places | `app/src/components/` |
| A color or a size | `app/src/constants/theme.ts` |
| Reusable logic (state, calculations) | `app/src/hooks/` |
| An image or an icon | `app/assets/` |
| A table or a column | `database/schema.sql`, then update `database/schema.md` |

Do not edit: `node_modules/`, `.expo/`, `expo-env.d.ts`, `package-lock.json` (by hand).
Never put a component in `app/src/app/`: every file in that folder becomes a screen.

To install a package, use `npx expo install package-name`, not `npm install` (it picks the version compatible with the Expo SDK).
