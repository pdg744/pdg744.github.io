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

Open `http://127.0.0.1:4173/app/`. The preview binds only to localhost and supports direct links to `/app/practice-details`, `/app/diffy-squares`, and `/app/factor-and-add`.

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
2. Add its `id`, `label`, `description`, `color`, and `emoji` to the `activities` array in `app/index.jsx`.
3. Keep reusable behavior in `hooks/`, drawing in `components/`, and pure rules in `game/`.
4. Test and export again. Expo Router uses the screen filename as its route.

Diffy Squares already follows that structure. Its game rules are in `game/diffy.js`, state in `hooks/useDiffySquares.js`, and the screen/animations in `app/diffy-squares.jsx` and `components/`.

## Factor and Add

Start with numbers 1–16 (1 completes when reached as a terminal result). Finishing that batch unlocks 17–24, then eight more at a time; only completed factor-and-add steps count. Unlocks derive from saved graph progress and reset with the graph. Newly unlocked batches get a brief confetti celebration when the graph returns, rather than a persistent progress label. Restoring saved progress does not replay it; reduced motion shows a static announcement. Choose an available number, enter its factors, then add them excluding the number itself. Submitted multiplication pairs retain their boxes inside the focused circle, aligned with the new input row. Accepted pairs have no deletion control because correctness is enforced. New pair inputs appear directly below saved pairs. Typing any unused first factor moves focus to the second box immediately, even if it is a prefix of a longer factor (for example, 2 when factoring 20). Correct pairs save automatically, opening and focusing another row while factors remain. Once all factors are found, “That's all the factors” continues to the sum. Prefixes that are not yet valid factors remain editable. Choosing to finish checks completeness, then animates the factors into an equation and focuses the sum input. The next row focuses the left input immediately. There is no Cancel action during pair entry. Compact saved rows keep ordinary factor sets visible together; exceptionally long lists from discovered numbers retain overflow scrolling. Refresh restores unfinished entry. Completing a sum animates the input into a graph node and returns to a graph of explored numbers. Unvisited numbers remain in a compact picker below the graph; factors, pairs, and connections are saved automatically. Factor pairs and sums are always checked before acceptance. Back moves up one step. Prime factors connect directly to 1 without a sum prompt. Discovered positive results can be selected to continue chains beyond the unlocked starting numbers, including 24 → 36 → 55 → 17 → 1. One is a terminal node and cannot be opened. Saved work from the earlier version that allowed 1 → 0 is restored to the graph with that final edge removed. Completed nodes are display-only. Exploration supports numbers up to 1,000,000 and 128 explored numbers per graph; larger results remain visible with a limit label. Factor generation uses trial division through the square root; all arithmetic remains exact within these limits. The graph packs branches by their occupied space and automatically fits the screen. Dense graphs on narrow screens run sideways when that makes the numbers larger; smaller graphs retain vertical columns. The number picker disappears when exhausted. Unfinished nodes use a gold fill or outline. The activity header places an arrow-only Back control, title, and chevron in one row. On the graph, its dropdown contains Odds, Evens, and Primes switches with colored labels as a legend, plus Start over. Prime coloring takes priority over parity. Factor entry focuses after the opening transition and scales to fit above the keyboard. Start over asks for confirmation before clearing Factor and Add progress.

## Home and navigation

The app opens directly to activities. The Math Explorers logo and chevron reveal Stars, Conjectures, and the practice reset control directly. Enabling Stars shows tappable totals on home, defaulting to the last seven days, with all-time totals available. Tapping a skill opens its problem history. There is no role selection or name entry. Existing saved activity and practice data are preserved.

## Saved progress

Both activities automatically save their current step and unfinished input on this device (or in this browser on web). Refresh restores Factor and Add pairs, factors and connections, and Diffy Squares starting inputs, current generation, partial answers and completion. Returning to an activity also restores its work. Diffy Squares has the same compact header; its arrow returns home and its dropdown offers New game, which replaces saved work; Try a Variation retains the starting numbers as a new draft.

The shared `utils/progressStorage.js` adapter stores versioned snapshots under `mathexplorers.progress.<activity>`. Activity validators reject corrupt or incompatible records and reconstruct derived state. Animation state is not stored; interrupted transitions restore to a usable mathematical state.

Web uses browser localStorage. Native iOS/Android uses Expo SQLite-backed localStorage, installed by the root layout before activities mount. Saves are synchronous and use the same versioned snapshots and validators on both platforms. There are no accounts or cross-device sync. Clearing site/app data or deleting the app removes progress. If storage is blocked or full, play continues with a memory fallback, but relaunch recovery is unavailable. Expo Go and the installed app have separate saves. The user verified progress restoration after force-closing and reopening Expo Go on a physical iPhone on 2026-09-19. Repeat in the standalone TestFlight build; see the [release checklist](RELEASE.md).

## Noticing and conjectures

After the first completed example in a new Factor and Add graph, “I noticed something!” appears above the DAG. Its arrow opens the learner's size description choices. A correct description fills the sentence and reveals “I bet that always happens!” with a fade-and-rise entrance. Its arrow saves Conjecture 1 and adds “Can you prove me wrong?”; “Yes! I have a counterexample.” and “Hmm...” both return to the graph to test another number with the current open conjecture and “Can you find a counterexample?” visible above the graph and during factor/sum entry. Tapping it on the graph opens the conjecture record. A confirmed counterexample retires that challenge; the ! shortcut still opens the record when no challenge is displayed.

After a completed example, the same conjecture card shows the result and asks “Is this a counterexample?” with Yes/No choices. Incorrect answers receive “Take another look.” Correct No answers briefly show “Keep looking.” then restore the challenge. Correct Yes answers celebrate in place before retiring the conjecture and advancing automatically; there is no Continue button. Parity noticing follows a confirmed counterexample to the size conjecture. Unfinished challenges and their target results survive reloads. Reduced-motion settings omit entrance animations. Existing completed conjectures remain available.

The ! opens a read-only conjecture record; “Back to exploring” returns to the graph. The record shows one conjecture card at a time, with a page indicator and previous/next arrows. A status label reads Open until a learner confirms a counterexample, then Proven False. The statement fills the top of the card; Supporting examples and Counterexamples appear side by side below, without counts. There are no sorting controls or Unsorted category. After each later result, applicable unanswered questions are shown one at a time; older unreviewed results can be asked afterward. Parity questions only consider matching starting parity. A confirmed counterexample stops further prompts for that conjecture. Prompt targets, conjecture kinds, and answers survive reloads. Valid earlier classifications are retained; incorrect legacy manual sorting returns to the question queue. Starting over clears conjectures but preserves practice stars; these questions do not earn arithmetic stars.

## Practice stars

The logo dropdown has independent Stars and Conjectures switches, both off by default, saved on this device. Stars controls the student totals and award notifications; practice history continues recording while these are hidden. Conjectures controls all noticing prompts, classification questions, hints, and the conjecture record in Factor and Add. Turning it off preserves existing conjectures and returns the student to the graph. Switching Conjectures from off to on starts both activities fresh and clears their saved puzzles, graphs, and conjectures. Practice stars and problem history are preserved. Reapplying an already-enabled setting does not reset again.

The activity screen shows multiplication, addition, and subtraction stars for all time or the last seven days. A correct factor pair earns one multiplication star, an entered proper-factor sum earns one addition star, and each entered Diffy difference earns one subtraction star. Automatic prime-to-one steps and restored answers earn none. A small star notification respects reduced-motion settings.

The separate `practice-stars` history records each award's date, problem, skill, and stable answer ID. Game snapshots retain a practice-run ID to prevent duplicates across callbacks and reloads. Starting a fresh game permits repeat practice while preserving lifetime history. Older saves receive an ID without retroactively awarding stars. History belongs to this device/browser; clearing app data removes it. Storage failures use the existing in-memory fallback.

Each logo-dropdown row has a Reset action only while its feature is enabled and has data. Stars resets stars and solved/unfinished problem history; Conjectures starts both activities fresh and clears conjectures and counterexamples while preserving practice history. Both require confirmation and disappear after reset, with no success message. Current activity saves are preserved. Timers start fresh after a reset, including when returning to a previously opened problem. If storage is unavailable, the reset applies to the session and the screen explains that it could not be saved.

## App Store preparation

See the [first iPhone release checklist](RELEASE.md) for native persistence checks, EAS production setup, and remaining App Store decisions.

## Publishing

Run `npm run build:web --prefix recovered-app` from the repository root, then `node recovered-app/scripts/publish-web.mjs`. The staging script copies the export into `public/app/` and creates entry documents for each activity and problem history so direct links and refreshes work on GitHub Pages. Older hashed assets and the existing 404 fallback are retained. The recovery baseline remains untouched.

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

## Practice problem history

With Stars enabled, home shows clickable star totals. Selecting a skill opens `/practice-details` with the selected time period. Details show unfinished attempts first, then solved equations in descending duration order; unmeasured answers sort last. More reveals another 20 entries. Multiplication and addition attempts are recorded when the corresponding Factor and Add input opens; a solved star replaces its unfinished entry. Subtraction stars expose existing solved history, without attempt timing. Earlier recorded answers have no duration and display —. Work completed before practice history existed cannot be reconstructed as timed answers.

Factor and Add records foreground time for each factor-pair entry and each sum, including retries. The next pair starts its own timer. Timers pause when the activity loses focus or the app/browser page is hidden, and resume from saved elapsed time. They checkpoint once per second and on exit; an abrupt process termination can lose up to roughly the last second. This measures time with the problem open, not attention or ability. Old unfinished work begins timing when next opened. Subtraction timing is not included in this change.

Attempt tracking begins with this version; earlier abandoned problems are not reconstructed. For an unfinished factor pair, the target is shown as □ × □ = N because the learner chooses the factors. Durations measure foreground time, not attention.
