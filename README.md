# Desk Companion

Application mobile développée avec React Native, Expo et TypeScript.

- Dépôt : https://github.com/acronoxx/desk-companion
- Le projet Expo se trouve dans le dossier `app/`. Toutes les commandes `npm` et `npx expo` se lancent depuis `app/`.

## Lancer l'application

```bash
cd app
npm install
npx expo start
```

Scanner le QR code avec **Expo Go** (Android) ou l'appareil photo (iOS).

Le téléphone et le PC doivent être sur le même réseau local. **Sur eduroam, ça ne marche pas** : utiliser le partage de connexion du téléphone, ou l'USB sur Android :

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

puis entrer `exp://localhost:8081` dans Expo Go.

## Structure du projet

```
desk-companion/
├── app/                  ← projet Expo
│   ├── src/
│   │   ├── app/          ← écrans (1 fichier = 1 route, Expo Router)
│   │   ├── components/   ← composants réutilisables
│   │   ├── constants/    ← couleurs, espacements, polices (theme.ts)
│   │   └── hooks/        ← logique réutilisable
│   ├── assets/           ← images et icônes
│   └── app.json          ← configuration de l'app
├── database/
└── docs/
```

| Je veux ajouter... | Dans... |
|---|---|
| Une page | `app/src/app/` |
| Un morceau d'interface utilisé à plusieurs endroits | `app/src/components/` |
| Une couleur ou une taille | `app/src/constants/theme.ts` |
| De la logique réutilisable (état, calculs) | `app/src/hooks/` |
| Une image ou une icône | `app/assets/` |

Ne pas modifier : `node_modules/`, `.expo/`, `expo-env.d.ts`, `package-lock.json` (à la main).
Ne jamais mettre de composant dans `src/app/` : chaque fichier de ce dossier devient une page.

Pour installer un paquet, utiliser `npx expo install nom-du-paquet` et non `npm install`.
