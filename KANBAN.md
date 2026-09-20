# MathExplorers kanban

Planning board for the recovered app, currently focused on Factor and Add.
Last updated: 2026-09-19.

## Board

Cards are ordered by priority within each column. Review contains implemented work awaiting feedback.

| Backlog | Next | In progress | Review | Done |
| --- | --- | --- | --- | --- |
| [QA-01 · Check real devices and browsers](#qa-01-check-real-devices-and-browsers) | — | — |  | [FA-00 · Recover the app and establish the activity](#fa-00-recover-the-app-and-establish-the-activity) |
|  |  |  |  | [FA-07 · Continue discovered chains](#fa-07-continue-discovered-chains) |
|  |  |  |  | [FA-08 · Choose whether to add more pairs](#fa-08-choose-whether-to-add-more-pairs) |
|  |  |  |  | [SAVE-01 · Restore progress after refresh](#save-01-restore-progress-after-refresh) |
|  |  |  |  | [FA-06 · Always check answers](#fa-06-always-check-answers) |
|  |  |  |  | [FA-01 · Fit longer lists inside the circle](#fa-01-fit-longer-lists-inside-the-circle) |
|  |  |  |  | [FA-02 · Clarify the primary action](#fa-02-clarify-the-primary-action) |
|  |  |  |  | [FA-03 · Scale the graph to its content](#fa-03-scale-the-graph-to-its-content) |
|  |  |  |  | [FA-04 · Give new results visual emphasis](#fa-04-give-new-results-visual-emphasis) |
|  |  |  |  | [FA-05 · Make pair removal discoverable](#fa-05-make-pair-removal-discoverable) |
| | | | | [FA-09 · Align factor rows and remove deletion](#fa-09-align-factor-rows-and-remove-deletion) |
| | | | | [FA-10 · Simplify terminal node](#fa-10-simplify-terminal-node) |
| | | | | [FA-11 · Advance factor entry automatically](#fa-11-advance-factor-entry-automatically) |
| | | | | [DS-01 · Keep keypad open between differences](#ds-01-keep-keypad-open-between-differences) |
| | | | | [SAVE-02 · Save native progress across restarts](#save-02-save-native-progress-across-restarts) |
| | | | [REL-01 · Prepare iPhone build identity and artwork](#rel-01-prepare-iphone-build-identity-and-artwork) | |

**Current status:** The user confirmed both activities play well in Expo Go on a physical iPhone on 2026-09-19. FA-11 and DS-01 are accepted and Done. Latest validation: 37 tests pass and native exports build. Android and broader browser/device coverage remain open under QA-01.  All seven Review cards (SAVE-01, FA-06, and FA-01 through FA-05) were accepted by the user and moved to Done on 2026-09-19. FA-09 and FA-10 were accepted for production on 2026-09-19 and moved to Done. SAVE-02 is Done after the user confirmed the iPhone restart test passed. REL-01 is in Review; Next and In progress are empty. QA-01 remains in Backlog. Recorded validation: thirty-six automated tests pass; web and native exports build. Refresh checks cover drafts, sums, graphs, Diffy generation transitions, completion, variation, and New Game. Earlier design checks covered desktop and 320/390 px layouts, explicit pair removal/resubmission, four correct pairs, and an outside-range result. Historical unchecked-mode checks are superseded by FA-06. Real devices remain under QA-01. The earlier recovered app was published successfully by GitHub Pages (run 35399254573). FA-07 was published in f072f2d. The terminal-1 correction is verified and included in the rebuilt public/app export.

## Working agreements

- Move the card link between columns; keep its details below. The board is the source of truth for status.
- Keep at most two cards In progress. Record an owner when work starts.
- A blocked card stays in its column with **Blocked:** and the concrete dependency in its details.
- Move implemented work to Review with validation evidence and any known limitations.
- Move to Done once acceptance criteria are verified and review feedback is resolved. Record the commit when committed.
- Updating this board does not authorize a deployment. Done describes the repo, not the live site.
- Add new cards with a stable ID, a concrete problem, and observable acceptance criteria.

## Agreed product direction

- Refresh recovery is the highest priority. Start with automatic saving in the same browser; accounts, cross-device sync, and a broader product model are later decisions.
- The UI should speak for itself. Do not add instructional or investigation prompts in this pass.
- Always enforce answer correctness when accepting input. FA-06 supersedes the earlier requirements to support Check answers off; historical implementation and validation notes below describe the previous behavior.
- Continuing discovered chains is implemented in FA-07.

## Cards

### SAVE-01: Restore progress after refresh

**Owner:** Codex integration, with Factor and Add and Diffy Squares subagents.

**Problem:** Refreshing loses the learner's current work and discoveries. Reliable continuity is the next MVP priority.

**Acceptance criteria**

- Automatically restore each activity's work in the same browser after refresh, including the active step, unfinished input, and completed results.
- Factor and Add restores saved pairs/factors, graph connections, the current number, and in-progress factor or sum entry.
- Diffy Squares restores starting inputs, current generation, partial answers, and the completed state.
- Refresh during an animation restores a coherent usable state without replaying a pending submission, duplicating a result, or leaving controls locked.
- Leaving an activity and returning preserves its work. Explicit restart actions reset the corresponding saved work consistently.
- Validate saved data and its format version; missing, incompatible, or corrupt data cannot crash the activity. Unavailable browser storage cannot block play.
- Verify refresh at entry, partial completion, transitions, and completion in both activities.

**Implemented / evidence:** Shared versioned browser storage with per-activity validation; saves drafts and mathematical state, excluding animation flags. Browser walkthroughs verified factor and sum drafts, invalid pair/sum rejection, incomplete factor-set rejection, graph refresh and activity return. Diffy checks verified partial corners/answers, a five-level sequence with refresh on every advance, completion, variation and New Game reset. Independent code review found no actionable issues. Twenty-seven tests pass; web/iOS/Android exports build.

**Limits:** Chromium walkthroughs do not establish real-device coverage. Blocked/full browser storage and native runtimes use an in-memory fallback only, without durable refresh/relaunch recovery.

**Scope:** Local browser persistence only for this MVP. No accounts, cloud sync, new prompts, or investigation-history UI. Longer-term product identity and synchronization remain open decisions.

### FA-06: Always check answers

**Owner:** Factor and Add subagent; Codex review.

**Problem:** Optional checking allows incorrect factors and sums to become graph connections, complicating the meaning of saved explorations.

**Acceptance criteria**

- Remove the Check answers switch and the unchecked path.
- Validate factor pairs when submitted and sums when submitted; incorrect entries remain editable and cannot become accepted work or graph connections.
- Require the full correct factor set before proceeding to the sum.
- Allow unfinished typing without treating every intermediate keystroke as a committed answer.
- Restored data cannot bypass correctness checks or reinstate unchecked graph connections.
- Preserve learner-controlled progression and existing keyboard behavior.

**Implemented / evidence:** Removed the switch and unchecked paths; factor pairs and sums are validated on submission. Browser checks confirmed rejected pairs/sums stay editable and missing factors prevent advance. Snapshot tests reject unchecked pairs/connections.

**Coordination:** Land alongside SAVE-01 so persisted work has consistent correctness rules from the outset.

### FA-07: Continue discovered chains

**Owner:** Codex

**Problem:** Results outside the initial 2–30 picker cannot be explored, stopping chains such as 24 → 36.

**Acceptance criteria**

- Allow learners to select discovered positive results and continue their chains, including results outside 2–30.
- Generalize factor generation and input validation beyond the starting picker range.
- Treat 1 as terminal: display it as the end of a chain and never open it for factor entry.
- Revisited nodes, merged chains, and loops remain usable and survive refresh.
- Define supported numeric/resource limits and handle them without hangs or incorrect arithmetic.

**Completed / evidence (2026-09-18):** Discovered positive results through 1,000,000 can be explored; the initial picker remains 2–30. Trial division generates complete factor sets. Inputs and validated snapshots support larger numbers; completed nodes remain display-only so merged chains and loops retain existing work. One is terminal and cannot be selected. The corrected browser walkthrough verified 24 → 36 → 55 → 17 → 1 and that 1 stays disabled after refresh. Legacy saved exploration of 1 returns to the graph, removing the 1 → 0 edge while preserving other work. Graphs allow 128 explored numbers; limit nodes remain visible with an explanation. Thirty-five tests pass, covering larger factor sets, cycles, merges, zero, numeric limits and persistence. The original Chromium walkthrough completed 24 → 36 → 55 → 17 → 1 → 0 (superseded by the terminal-1 correction) at 390 px with reduced motion and 320 px with animations, with refresh after every connection and during a draft pair. Large-factor-set browser checks covered 83,160 (128 factors) and 1,000,000, including a scrollable sum and the disabled 1,480,437 result. Web, Astro and native exports build.

### FA-01: Fit longer lists inside the circle

**Owner:** Codex

**Problem:** Four multiplication pairs for 24 crowd the question against the circle's top edge on desktop and push it outside at phone width.

**Acceptance criteria**

- The question, four saved pairs, active pair inputs, and reserved + area fit within the circle at 320, 390, and 1280 px viewport widths.
- Saved pairs retain their boxed multiplication layout; longer exploratory lists remain usable with Check answers off.
- Showing or hiding + does not move existing content.
- Next remains reachable, including with the mobile keyboard open.
- Transitions still start at the boxes' displayed positions.

**Implemented:** Fixed question/input positions, responsive saved-pair boxes, and a scrollable list for overflow. The + slot remains reserved. Measured transitions now interpolate from the smaller saved boxes to sum boxes.

**Validation:** Empty and four-pair states at desktop and phone widths; six exploratory pairs at 320 px. Real keyboard coverage is still pending QA-01.

### FA-02: Clarify the primary action

**Superseded interaction:** FA-08 replaces Next and automatic blank rows with explicit choices and inline entry.

**Owner:** Codex

**Problem:** Next is the strongest visual action even when both factor inputs are empty; the useful add-pair action has less emphasis.

**Acceptance criteria**

- Visual emphasis follows the useful action in empty, partially entered, ready-to-add, and ready-to-advance states.
- + appears only when the pair can be submitted, without shifting the layout.
- Learners still decide when to advance; the activity does not advance automatically.
- Check answers off continues to support exploration and errors.
- Keyboard focus and Enter submission remain predictable.

**Implemented:** + is orange when available. Next is disabled before the first pair when checking is on, subdued during entry, and emphasized after a submitted pair with empty inputs. It does not reveal whether the factor list is complete. Checking off permits advancing with errors or an empty list. Connect activates after a sum is entered.

### FA-03: Scale the graph to its content

**Owner:** Codex

**Problem:** A graph of two nodes occupies little of its available area, and factor summaries are small.

**Acceptance criteria**

- Small graphs use more of the graph area and have legible number and factor labels.
- Larger graphs adapt without overlapping nodes or clipping labels and arrows.
- The unexplored-number picker stays below the graph and visually secondary.
- Verify chains, disconnected components, cycles, and self-loops.
- Sum-to-node transitions land precisely after layout changes.

**Implemented / evidence:** Small graphs use larger nodes and labels. Chains use vertical columns, incoming branches are symmetric, and terminal nodes including 1 and 6 share the bottom baseline. Automatic sizing fits the available frame, hiding factor summaries at small sizes and allowing scrolling when needed. Automated checks cover 30-node layouts at widths 272, 342, and 600, as well as cycles and self-loops. The graph return was checked at phone width.

### FA-04: Give new results visual emphasis

**Owner:** Codex

**Problem:** A result outside the starting range, such as 36 in 24 → 36, is dimmed because it is not selectable. The new result looks unavailable rather than newly discovered.

**Acceptance criteria**

- Newly created result nodes remain readable and visually emphasized, including results outside 2–30.
- Selection availability is distinguishable without dimming the mathematical result.
- Existing destinations and self-loops receive appropriate completion feedback.
- This card does not expand the allowed starting-number range.

**Implemented / evidence:** The newest destination has a gold border and full contrast regardless of selection availability. Verified 24 → 36; 36 remains non-selectable with an explanatory accessibility hint.

### FA-05: Make pair removal discoverable

**Superseded interaction:** FA-09 removes pair deletion at the user's request now that correctness is enforced.

**Owner:** Codex

**Problem:** Clicking a saved sentence deletes it, but the sentence does not communicate that action.

**Acceptance criteria**

- Pair removal has an identifiable control usable with mouse, keyboard, and touch.
- Clicking the equation itself does not unexpectedly delete work.
- Removal updates the factors used in the sum and the saved state when returning to the graph.
- Controls preserve the compact boxed-equation layout.

**Implemented / evidence:** Saved equations are non-interactive text/boxes; dedicated trash buttons remove pairs. Verified removal and resubmission of 4 × 6, factor-set updates, and keyboard entry. Real touch testing remains pending QA-01.

### QA-01: Check real devices and browsers

**Problem:** Web previews and native exports have been checked; real mobile keyboards, native runtime behavior, Safari, and Firefox remain unverified.

**Acceptance criteria**

- Record platform/browser/device and results for pair entry, keyboard navigation, removal, Back, both transitions, and graph selection.
- Check reduced-motion behavior and touch target usability.
- File concrete failures as separate cards; distinguish unavailable environments from passing checks.

### FA-00: Recover the app and establish the activity

**Delivered:** Editable Expo recovery; Diffy Squares preserved; Factor and Add with factor-pair entry, optional answer checking, animated summation, an explored-number graph, a bottom picker, and sorted comma-separated factor summaries.

**Evidence:** Commits `3192dbe` and `71f6b56`. Ten automated tests pass; web and iOS/Android exports build. Browser walkthroughs cover entry, transitions, self-loops, and reopening saved work.

**Limits:** Native exports are not on-device validation. Session progress resets on reload. The live site still uses the original export. Follow-up design work is tracked above.

## Latest interaction refinements

- Completed graph nodes are display-only; unexplored results remain selectable.
- Prime factor 1 moves directly into the graph without an intermediate sum screen.
- Start over confirms before clearing the graph and saved Factor and Add progress.
- The factor question is larger and lower inside the circle.
- Achievements are deferred.


### FA-08: Choose whether to add more pairs

**Owner:** Codex

**Problem:** Immediately opening another empty factor row implies that more factors are required, even when the learner has found all of them. The separated input area makes saved and new pairs feel disconnected.

**Acceptance criteria**

- Enter each new pair directly below saved pairs in the same scrollable area.
- After accepting a pair, hide entry and show below the circle equally styled “Add another factor pair” and “That's all the factors” buttons.
- Opening another pair focuses its first input; Cancel returns to the choices. Removing the last pair reopens entry.
- Check completeness only when the learner chooses to finish; retain work and show “There are more factors to find.” for an incomplete list.
- Restore the choice or unfinished entry after refresh, including older saved work.

**Implemented / evidence:** New entry stays directly under saved pairs inside the circle; the two choices sit below the circle and replace Next. Thirty-six tests pass, including persistence and migration checks. Browser checks cover continued chains, incomplete-factor feedback, refresh, focus, cancellation, pair removal, and 320/390/1280 px layouts. Real mobile keyboards remain under QA-01.

### FA-09: Align factor rows and remove deletion

**Owner:** Codex

**Problem:** Correct accepted pairs no longer need trash controls. Saved and new pairs have different horizontal positions and box sizes.

**Acceptance criteria**

- Accepted pairs have no deletion control.
- Saved and new pairs align their factor boxes, multiplication signs, equals signs, and results at desktop and phone widths.
- Entry, cancellation, correctness checks, and measured sum transitions remain intact.

**Implemented / evidence (2026-09-19):** Removed trash buttons and their callback. Saved and active rows share 44 px box dimensions, corner radii, and number sizing. Browser inspection verified saved/new row alignment on desktop and at 320 px, including adding a pair and reopening entry. All 36 tests and the web export pass. Supersedes FA-05's deletion interaction and FA-08's last-pair removal behavior.

### FA-10: Simplify terminal node

**Owner:** Codex

**Problem:** The terminal 1 node has an unnecessary End label and latest-result highlight.

**Acceptance criteria**

- Show 1 without the End label, using the same teal border as completed nodes.
- Keep 1 non-selectable. Highlight new destinations only while unfinished; completed destinations, self-loops, and their incoming edges use normal styling.

**Implemented:** Removed the terminal label and excluded 1 from latest-node styling. Terminal behavior and accessibility hints are preserved. Browser verification confirms 1 displays only its number with the normal border and remains disabled. All 36 tests and the web export pass.

**FA-10 follow-up (2026-09-19):** Terminal 1 now uses the completed-node teal border. Latest-result highlighting applies only to unfinished destinations, so self-loops such as 6 → 6 and merges into completed nodes do not leave gold nodes or arrows. Refreshed browser inspection verified the graph with terminal 1 and 6 → 6; all 36 tests and the web export pass.

### FA-11: Advance factor entry automatically

**Status:** Done; accepted after the user confirmed both activities play well on iPhone in Expo Go (2026-09-19).

**Problem:** Moving between factor inputs and opening another pair requires unnecessary taps.

**Acceptance criteria**

- An unused 1 advances immediately; other unambiguous correct first factors focus the second box.
- Preserve other ambiguous prefixes for multi-digit input.
- Correct pairs save automatically and focus a fresh row while factors remain, keeping the keyboard open.
- Invalid and duplicate pairs cannot be accepted; explicit submission remains available.
- Keep the final “That's all the factors” action before the sum.

**Evidence:** 37 automated tests pass, including factor-prefix cases. Native and web export checks recorded in the task; the user subsequently confirmed the iPhone experience plays well. This supersedes FA-08's between-pair choice requirement.

**FA-11 iPhone follow-up:** Removed the delayed animation-frame focus handoff and the pair-entry Cancel button. Removed the extra action row and compacted saved rows to fit ordinary factor sets without scrolling. Exceptional discovered numbers with many pairs retain overflow scrolling to avoid hiding factors. Accepted in the iPhone playtest.

**FA-11 follow-up:** Removed the factor-pair + button. Correct pairs advance automatically; incorrect entries remain editable without a submit button.

**FA-11 addition layout experiment:** Sum stage now uses vertical addition with right-aligned digits, a plus on the final addend, a horizontal rule, and the answer beneath. Factor sprites target the stacked addends. Accepted in the iPhone playtest.

**FA-11 sum follow-up:** Removed Connect. Entering the correct sum now automatically returns to the graph; incomplete or incorrect sums remain editable. Duplicate sum submissions are guarded.

### DS-01: Keep keypad open between differences

**Status:** Done; accepted after the user confirmed both activities play well on iPhone in Expo Go (2026-09-19).

**Problem:** Accepting a correct difference disabled the focused input before the next input received focus, briefly closing and reopening the iOS number pad.

**Change:** Focus the next unanswered node synchronously in the input event, before React commits the completed field's disabled state. Preserve the existing dismissal when a whole generation is complete.

**Acceptance:** The keypad stays open when moving between unanswered nodes, and correct inputs remain locked. Automated tests and native export checked in the task; the user confirmed successful play on a physical iPhone in Expo Go.

### SAVE-02: Save native progress across restarts

**Status:** Done; the user confirmed the iPhone force-close/reopen persistence test passed on 2026-09-19.

**Problem:** Native activities previously used memory-only progress, so closing the app lost discoveries and drafts.

**Implemented:** Install Expo SQLite-backed localStorage in the root layout before activity mount. Reuse existing synchronous versioned snapshots, validation, and storage-failure fallback for both activities; web retains browser storage. This supersedes SAVE-01's native-memory-only limitation.

**Acceptance criteria**

- Both activities restore graph/generation state and unfinished input after force-closing and reopening the app.
- Explicit restart replaces saved progress; corrupt storage cannot prevent play.
- Web persistence continues working.

**Validation:** 37 existing rule/persistence tests pass. Native and web export validation recorded in the task. The user confirmed native progress restoration after force-closing and reopening Expo Go on iPhone. Standalone TestFlight validation remains part of release preparation.

**Release preparation:** Added recovered-app/RELEASE.md and a store-distribution EAS production profile. Apple organization enrollment is underway under Experiential Education, LLC. Account linking, permanent bundle identifier, app icon, listing details, signed build, and TestFlight remain to do.

### REL-01: Prepare iPhone build identity and artwork

**Status:** Review.

**Implemented:** Derived app icon and launch mark from the existing vector logo. Configured an opaque 1024px icon, black launch background, portrait orientation, iPhone-targeted settings, clean Expo slug/URL scheme, and proposed bundle ID xyz.mathexplorers.app. Nothing registered or uploaded.

**Acceptance:** Review icon artwork and confirm bundle identity before the first signed build; verify launch appearance and orientation in TestFlight. See recovered-app/RELEASE.md for account-linking and submission steps.

**REL-01 Expo account setup:** Created and linked @pgaf/math-explorers on 2026-09-19 (project ID 3a981964-1473-432d-aae7-265694bea0ee). No Apple signing or build submission performed. Apple organization enrollment remains underway.
