# MathExplorers — recovered Expo project

Editable recovery of the Expo app exported at `mathexplorers.xyz/app/`.
Recovered from the preserved Metro bundle; see [recovery notes](../recovery/README.md).

## Run locally

Use Node 20.19+ (verified here with Node 26) and npm:

```sh
cd recovered-app
npm ci
npm run web
```

For a production-style preview at the same `/app/` base path as the deployed site:

```sh
npm run build:web
npm run preview
```

Open `http://127.0.0.1:4173/app/`. The preview binds only to localhost and supports direct links to `/app/topics` `/app/diffy-squares`, and `/app/factor-and-add`.

## Validate

```sh
npm test
npm run build:web
npm run build:native
```

The tests use the preserved original game module as an independent oracle and compare 1,000 deterministic starting combinations. They also check known sequences, wrap-around differences, input validation, partial answers and zero/equal inputs.

Native export compiles the iOS and Android JavaScript/assets. It does **not** build, sign or install native applications. The original native project IDs and credentials are unknown. On-device testing and native setup remain separate work.

## Add another activity

1. Create a screen in `app/<activity-id>.jsx` with a default React component export.
2. Add its `id`, `label`, `description`, `color`, and `emoji` to the `activities` array in `app/topics.jsx`.
3. Keep reusable behavior in `hooks/`, drawing in `components/`, and pure rules in `game/`.
4. Test and export again. Expo Router uses the screen filename as its route.

Diffy Squares already follows that structure. Its game rules are in `game/diffy.js`, state in `hooks/useDiffySquares.js`, and the screen/animations in `app/diffy-squares.jsx` and `components/`.

## Factor and Add

Choose a number from 2–30, enter its factors, then add them excluding the number itself. Submitted factors stay in editable boxes that shrink and wrap inside the focused circle. Next animates the factors into an equation and focuses the sum input. Completing a sum draws a connection on the number board; factors and connections remain available during the session. Check answers can be switched off for exploration. Back moves up one step.

Progress is held in memory and resets on reload. Browser checks cover factor entry, wrapping, the sum transition, automatic focus, and step-by-step Back navigation.

## Publishing later

The current website still uses the old `../public/app/` export. Builds here write only to `dist/`; they do not update the site. When a reviewed release is ready, copy the fresh export to `../public/app/` while preserving the existing GitHub Pages `404.html` fallback. Do not delete the recovery baseline. Deploy through the website's existing process.

## Verified September 18, 2026

- Production web export builds.
- iOS and Android Hermes exports compile.
- Eight rule tests pass, including 1,000 Diffy Squares comparisons against the original bundle and Factor and Add rules.
- Browser: intro → topics → game, inputs, incorrect-answer feedback/correction, five-level progression to zero, variation, fresh start and the all-zero case.
- Layout inspected at 1280×720, 390×844 and 320×568.
- Restart during the final drawing animation leaves the new input screen intact.

These browser checks use Chromium at phone-sized viewports, not actual iOS/Android devices. Native runtime behavior, Safari/Firefox and real mobile keyboards/gestures are not yet verified.
