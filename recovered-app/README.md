# MathExplorers — recovered Expo project

Editable recovery of the Expo app exported at `mathexplorers.xyz/app/`.
Recovered from the preserved Metro bundle; see [recovery notes](../recovery/README.md).

Plan and track work on the [repo kanban board](../KANBAN.md).

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

Choose a number from 2–30, enter its factors, then add them excluding the number itself. Submitted multiplication pairs retain their boxes inside the focused circle, aligned with the new input row. Accepted pairs have no deletion control because correctness is enforced. New pair inputs appear directly below saved pairs. After each submission, equally styled “Add another factor pair” and “That's all the factors” buttons appear below the circle while the inputs are hidden. Choosing to finish checks completeness, then animates the factors into an equation and focuses the sum input. Cancel closes an extra input row; refresh restores the choice or unfinished entry. Completing a sum animates the input into a graph node and returns to a graph of explored numbers. Unvisited numbers remain in a compact picker below the graph; factors, pairs, and connections are saved automatically. Factor pairs and sums are always checked before acceptance. Back moves up one step. Prime factors connect directly to 1 without a sum prompt. Discovered positive results can be selected to continue chains beyond 30, including 24 → 36 → 55 → 17 → 1. One is a terminal node and cannot be opened. Saved work from the earlier version that allowed 1 → 0 is restored to the graph with that final edge removed. Completed nodes are display-only. Exploration supports numbers up to 1,000,000 and 128 explored numbers per graph; larger results remain visible with a limit label. Factor generation uses trial division through the square root; all arithmetic remains exact within these limits. The graph uses vertical columns and symmetric branches, automatically sizes to the screen, and keeps the number picker below it. Start over asks for confirmation before clearing Factor and Add progress.

## Saved progress

Both activities automatically save their current step and unfinished input in this browser. Refresh restores Factor and Add pairs, factors and connections, and Diffy Squares starting inputs, current generation, partial answers and completion. Returning to an activity also restores its work. Diffy Squares New Game/Fresh Start replaces its saved work; Try a Variation retains the starting numbers as a new draft.

The shared `utils/progressStorage.js` adapter stores versioned snapshots under `mathexplorers.progress.<activity>`. Activity validators reject corrupt or incompatible records and reconstruct derived state. Animation state is not stored; interrupted transitions restore to a usable mathematical state.

This MVP uses browser localStorage, without accounts or cross-device sync. Clearing site data removes progress. If storage is blocked or full, play continues with a memory fallback, but refresh recovery is unavailable. Native exports also use memory only; durable native persistence is outside this MVP.

## Publishing

Run `npm run build:web --prefix recovered-app` from the repository root, then `node recovered-app/scripts/publish-web.mjs`. The staging script copies the export into `public/app/` and creates entry documents for each activity and the topics page so direct links and refreshes work on GitHub Pages. Older hashed assets and the existing 404 fallback are retained. The recovery baseline remains untouched.

Commit and push the staged files to `main`. The existing GitHub Pages workflow builds the Astro website and deploys it, including the app.

## Verified September 18, 2026

- Production web export builds.
- iOS and Android Hermes exports compile.
- Thirty-six rule, graph-layout and persistence tests pass, including 1,000 Diffy Squares comparisons against the original bundle and Factor and Add rules.
- Browser: intro → topics → game, inputs, incorrect-answer feedback/correction, five-level progression to zero, variation, fresh start and the all-zero case.
- Layout inspected at 1280×720, 390×844 and 320×568.
- Restart during the final drawing animation leaves the new input screen intact.
- Persistence browser checks: partial factor/corner/sum entry, invalid submissions, graph refresh, Diffy partial answers and refresh through all five generation transitions, completion, variation and New Game recovery, plus returning to saved Factor work from another activity.
- Automated persistence checks cover malformed/version-mismatched records and blocked/full storage.

These browser checks use Chromium at phone-sized viewports, not actual iOS/Android devices. Native runtime behavior, Safari/Firefox and real mobile keyboards/gestures are not yet verified.
