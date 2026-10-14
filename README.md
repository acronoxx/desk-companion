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

Le téléphone et le PC doivent être sur le même réseau local. **Sur eduroam, ça ne marche pas** (les appareils sont isolés entre eux). Solutions :

- Partage de connexion du téléphone, avec le PC connecté dessus.
- Android en USB (débogage USB activé) :
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

Où mettre quoi :

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

## Configuration de l'environnement (VS Code)

Une configuration commune est en place : code formaté de la même façon pour tout le monde, erreurs visibles dans l'éditeur, historique git lisible.

### Ce qui est configuré (dans `app/`)

| Fichier | Rôle |
|---|---|
| `.vscode/extensions.json` | Liste des extensions recommandées |
| `.vscode/settings.json` | Formatage Prettier à la sauvegarde, correction ESLint automatique, tri des imports, imports en `@/...` |
| `.prettierrc` | Règles de formatage, alignées sur le style du code Expo existant |
| `eslint.config.js` | Règles ESLint pour Expo |
| `package.json` | Ajout de `prettier`, `eslint` et `eslint-config-expo` en `devDependencies` |

Règles Prettier (`app/.prettierrc`) :

| Option | Valeur | Effet |
|---|---|---|
| `singleQuote` | `true` | `'texte'` et non `"texte"` |
| `semi` | `true` | Point-virgule en fin d'instruction |
| `trailingComma` | `all` | Virgule après le dernier élément d'une liste multi-lignes |
| `printWidth` | `100` | Retour à la ligne après 100 caractères |
| `tabWidth` | `2` | Indentation de 2 espaces |
| `bracketSameLine` | `true` | Le `>` fermant d'une balise JSX multi-lignes reste sur la dernière ligne de la balise |
| `endOfLine` | `auto` | Garde les fins de ligne du fichier (évite les conflits Windows/Linux) |

Ces valeurs ont été choisies pour que le code généré par Expo soit déjà conforme : lancer `npx prettier --check src` ne signale aucun fichier à corriger.

### Extensions

| Extension | ID | Rôle |
|---|---|---|
| Expo Tools | `expo.vscode-expo-tools` | Aide pour `app.json` et Expo Router |
| Prettier | `esbenp.prettier-vscode` | Formatage automatique |
| ESLint | `dbaeumer.vscode-eslint` | Détection d'erreurs et de mauvaises pratiques |
| Error Lens | `usernamehw.errorlens` | Erreurs affichées sur la ligne |
| Pretty TypeScript Errors | `yoavbls.pretty-ts-errors` | Messages TypeScript lisibles |
| Auto Rename Tag | `formulahendry.auto-rename-tag` | Renomme la balise fermante en même temps que l'ouvrante |
| GitLens | `eamodio.gitlens` | Historique git ligne par ligne |
| Path Intellisense | `christian-kohler.path-intellisense` | Autocomplétion des chemins |

### À faire sur son poste (chaque membre de l'équipe)

1. Récupérer les changements :
   ```bash
   git pull
   ```
2. Installer les nouveaux paquets (obligatoire, sinon Prettier et ESLint ne marchent pas) :
   ```bash
   cd app
   npm install
   ```
3. Ouvrir VS Code **sur le dossier `app/`** et non sur `desk-companion`. VS Code ne lit que le `.vscode` du dossier ouvert :
   ```bash
   code app
   ```
4. Installer les extensions recommandées : cliquer sur **Installer** dans la notification de VS Code, ou `Ctrl+Shift+X` puis taper `@recommended`.
5. Vérifier : modifier un fichier `.tsx`, enregistrer avec `Ctrl+S`. Le code doit se formater tout seul. Sinon : `Ctrl+Shift+P`, "Format Document With...", "Configure Default Formatter", puis Prettier.
6. Redémarrer VS Code si les erreurs ESLint n'apparaissent pas.

### Commandes utiles (depuis `app/`)

```bash
npx expo lint              # vérifie le code avec ESLint
npx prettier --check src   # liste les fichiers mal formatés
npx prettier --write src   # reformate tous les fichiers de src
npx tsc --noEmit           # vérifie les types TypeScript
```

### Points d'attention

- **Ne pas modifier `.prettierrc` seul dans son coin.** Si le style change, toute l'équipe doit être d'accord, sinon chacun reformate les fichiers des autres et l'historique git se remplit de changements de style.
- **Une erreur ESLint existe déjà** dans le code généré par Expo : `src/hooks/use-color-scheme.web.ts`, ligne 11 (`setState` dans un `useEffect`). Elle n'empêche pas l'app de tourner. À corriger plus tard.
- **Avertissement `LF will be replaced by CRLF`** : normal sous Windows, sans conséquence.
- **Projet sans VS Code sur `app/`** : si Prettier ne se déclenche pas, c'est presque toujours que VS Code est ouvert sur le mauvais dossier.

### Annuler cette configuration

```bash
cd app
npm uninstall prettier eslint eslint-config-expo
git restore .vscode package.json package-lock.json
rm .prettierrc eslint.config.js
```

## Workflow git

```bash
git status      # vérifier l'état
git pull        # au début de chaque session de travail
# ... travailler ...
git add .
git commit -m "Description claire de ce qui a été fait"
git push        # à la fin, et régulièrement
```

- Travailler sur la branche `dev` ou sur une branche de fonctionnalité, jamais directement sur `main`.
- Un commit = une idée.
- Ne jamais commiter de secrets (clés API, `.env`).
- Si le `push` est refusé : `git pull`, puis `git push`.
