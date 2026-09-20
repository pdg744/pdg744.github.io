# MathExplorers — recovered Expo project

Editable recovery of the Expo app exported at `mathexplorers.xyz/app/`.
Recovered from the preserved Metro bundle; see [recovery notes](../recovery/README.md).

Plan and track work on the [repo kanban board](../KANBAN.md).

## Run locally

The app uses Expo SDK 57 (Expo 57.0.24), with matching React Native and Expo module versions. Use Node 20.19.4+, 22.13+, 24.3+, or 25+ (verified here with Node 26) and npm:

```sh
cd recovered-app
npm ci
npm run web
```

For Expo Go on a phone connected to the same Wi-Fi, run `npm run start -- --lan --clear` and scan the terminal QR code. After an SDK upgrade, stop any previous development server before restarting it.

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

Choose a number from 2–30, enter its factors, then add them excluding the number itself. Submitted multiplication pairs retain their boxes inside the focused circle, aligned with the new input row. Accepted pairs have no deletion control because correctness is enforced. New pair inputs appear directly below saved pairs. Typing an unused 1 or an unambiguous first factor moves focus to the second box. Correct pairs save automatically, opening and focusing another row while factors remain. Once all factors are found, “That's all the factors” continues to the sum. Other ambiguous prefixes remain editable so multi-digit factors can be entered. Choosing to finish checks completeness, then animates the factors into an equation and focuses the sum input. The next row focuses the left input immediately. There is no Cancel action during pair entry. Compact saved rows keep ordinary factor sets visible together; exceptionally long lists from discovered numbers retain overflow scrolling. Refresh restores unfinished entry. Completing a sum animates the input into a graph node and returns to a graph of explored numbers. Unvisited numbers remain in a compact picker below the graph; factors, pairs, and connections are saved automatically. Factor pairs and sums are always checked before acceptance. Back moves up one step. Prime factors connect directly to 1 without a sum prompt. Discovered positive results can be selected to continue chains beyond 30, including 24 → 36 → 55 → 17 → 1. One is a terminal node and cannot be opened. Saved work from the earlier version that allowed 1 → 0 is restored to the graph with that final edge removed. Completed nodes are display-only. Exploration supports numbers up to 1,000,000 and 128 explored numbers per graph; larger results remain visible with a limit label. Factor generation uses trial division through the square root; all arithmetic remains exact within these limits. The graph packs branches by their occupied space and automatically fits the screen. Dense graphs on narrow screens run sideways when that makes the numbers larger; smaller graphs retain vertical columns. The number picker disappears when exhausted. Unfinished nodes use a gold fill or outline. The three-line menu opens inline Odds, Evens, and Primes color toggles above the visible graph; prime coloring takes priority over parity. Factor entry focuses after the opening transition and scales to fit above the keyboard. Start over asks for confirmation before clearing Factor and Add progress.

## Saved progress

Both activities automatically save their current step and unfinished input on this device (or in this browser on web). Refresh restores Factor and Add pairs, factors and connections, and Diffy Squares starting inputs, current generation, partial answers and completion. Returning to an activity also restores its work. Diffy Squares New Game/Fresh Start replaces its saved work; Try a Variation retains the starting numbers as a new draft.

The shared `utils/progressStorage.js` adapter stores versioned snapshots under `mathexplorers.progress.<activity>`. Activity validators reject corrupt or incompatible records and reconstruct derived state. Animation state is not stored; interrupted transitions restore to a usable mathematical state.

Web uses browser localStorage. Native iOS/Android uses Expo SQLite-backed localStorage, installed by the root layout before activities mount. Saves are synchronous and use the same versioned snapshots and validators on both platforms. There are no accounts or cross-device sync. Clearing site/app data or deleting the app removes progress. If storage is blocked or full, play continues with a memory fallback, but relaunch recovery is unavailable. Expo Go and the installed app have separate saves. The user verified progress restoration after force-closing and reopening Expo Go on a physical iPhone on 2026-09-19. Repeat in the standalone TestFlight build; see the [release checklist](RELEASE.md).

## Noticing and conjectures

After the first completed example in a new Factor and Add graph, The activity guides two observations (size and parity). A one-line noticing prompt leads to the learner's description choices. A correct description reveals “I bet that always happens!” below the choices with a fade-and-rise entrance. Its arrow saves the conjecture and adds “Can you help investigate that conjecture?” beneath it; another arrow continues. Reduced-motion settings omit the entrance animation. The reflection starts after the result animation and saves unfinished choices across reloads. Existing graphs are not interrupted retroactively.

Side-by-side “Data Collection” and “Conjectures” tabs switch between the graph and sorting view. The “Conjectures” view labels the size and parity guesses “Conjecture 1” and “Conjecture 2.” Each shows Examples, Counterexamples, and Unsorted drop areas together. Learners drag result chips between areas; keyboard left/right arrows and screen-reader actions also move results. Every completed graph result begins Unsorted until the learner assigns it; results can be moved between categories, and each conjecture's classifications persist across reloads. No automatic verdict is shown. Starting over clears the graph's conjectures. Reflection choices do not earn arithmetic stars.

## Practice stars

The activity screen shows multiplication, addition, and subtraction stars for all time or the last seven days. A correct factor pair earns one multiplication star, an entered proper-factor sum earns one addition star, and each entered Diffy difference earns one subtraction star. Automatic prime-to-one steps and restored answers earn none. A small star notification respects reduced-motion settings.

The separate `practice-stars` history records each award's date, problem, skill, and stable answer ID. Game snapshots retain a practice-run ID to prevent duplicates across callbacks and reloads. Starting a fresh game permits repeat practice while preserving lifetime history. Older saves receive an ID without retroactively awarding stars. History belongs to this device/browser; clearing app data removes it. Storage failures use the existing in-memory fallback.

## App Store preparation

See the [first iPhone release checklist](RELEASE.md) for native persistence checks, EAS production setup, and remaining App Store decisions.

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
