# MathExplorers kanban

Planning board for the recovered app, currently focused on Factor and Add.
Last updated: 2026-09-18.

## Board

Cards are ordered by priority within each column. Review contains implemented work awaiting feedback.

| Backlog | Next | In progress | Review | Done |
| --- | --- | --- | --- | --- |
| [QA-01 · Check real devices and browsers](#qa-01-check-real-devices-and-browsers) | — | — | [SAVE-01 · Restore progress after refresh](#save-01-restore-progress-after-refresh) | [FA-00 · Recover the app and establish the activity](#fa-00-recover-the-app-and-establish-the-activity) |
| | | | [FA-06 · Always check answers](#fa-06-always-check-answers) | [FA-07 · Continue discovered chains](#fa-07-continue-discovered-chains) |
| | | | [FA-01 · Fit longer lists inside the circle](#fa-01-fit-longer-lists-inside-the-circle) | [FA-08 · Choose whether to add more pairs](#fa-08-choose-whether-to-add-more-pairs) |
| | | | [FA-02 · Clarify the primary action](#fa-02-clarify-the-primary-action) | |
| | | | [FA-03 · Scale the graph to its content](#fa-03-scale-the-graph-to-its-content) | |
| | | | [FA-04 · Give new results visual emphasis](#fa-04-give-new-results-visual-emphasis) | |
| | | | [FA-05 · Make pair removal discoverable](#fa-05-make-pair-removal-discoverable) | |

**Current review:** The five design cards plus refresh persistence and always-on correctness are implemented locally and ready for user review. Thirty-six automated tests pass; web and native exports build. Refresh checks cover drafts, sums, graphs, Diffy generation transitions, completion, variation, and New Game. Earlier design checks covered desktop and 320/390 px layouts, explicit pair removal/resubmission, four correct pairs, and an outside-range result. Historical unchecked-mode checks are superseded by FA-06. Real devices remain under QA-01. The earlier recovered app was published successfully by GitHub Pages (run 35399254573). FA-07 was published in f072f2d. The terminal-1 correction is verified and included in the rebuilt public/app export.

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
- After accepting a pair, replace entry with equally styled “Add another factor pair” and “That's all the factors” buttons.
- Opening another pair focuses its first input; Cancel returns to the choices. Removing the last pair reopens entry.
- Check completeness only when the learner chooses to finish; retain work and show “There are more factors to find.” for an incomplete list.
- Restore the choice or unfinished entry after refresh, including older saved work.

**Implemented / evidence:** Inline entry and choices replace the lower input area and Next button. Thirty-six tests pass, including persistence and migration checks. Browser checks cover continued chains, incomplete-factor feedback, refresh, focus, cancellation, pair removal, and 320/390/1280 px layouts. Real mobile keyboards remain under QA-01.
