# Diffy Squares recovery baseline

Captured September 18, 2026 from repository commit `17572fc`.
The original deployed export remains untouched in `public/app/`.

- `original-web.tar.gz`: independent archive of the entire original web export, including assets.
- `baseline-sha256.json`: SHA-256 hashes of every original file, relative to `public/app/`.
- `original-modules.json`: original Metro factory source and dependency IDs for the app-specific modules. Library modules were replaced with npm dependencies, not copied into recovered source.

Module mapping:

| Metro ID | Recovered responsibility |
| --- | --- |
| 10 | Router layout, safe area, session provider |
| 668–669 | Theme and intro session context |
| 670 | Diffy Squares screen |
| 671 | Animated squares and labels |
| 696 | Geometry helpers |
| 697 | Game rules and state hook |
| 698–699 | Keyboard and pinch-zoom hooks |
| 700–701 | Midpoint inputs and shake animation |
| 702, 732 | Logo and intro video assets |
| 703 | Original native intro, using expo-av |
| 733–734 | Web intro and topics menu |

`recovered-app/scripts/recover.mjs` transforms the preserved factories into initial ESM/JSX source in a **scratch directory**. It maps dependency IDs to package imports, recovers exports and JSX, and gives the main bindings descriptive names. Subsequent source cleanup and fixes live in `recovered-app/`; that directory is the maintained project. Do not regenerate over it.

```sh
cd recovered-app
node scripts/recover.mjs /tmp/diffy-initial-recovery
```

The recovered project is not an exact copy of the lost source. Comments, TypeScript types, original local names, package lockfile, native build settings, signing credentials and EAS project identity cannot be restored from this web export. The native intro was reconstructed using expo-video because the original expo-av implementation does not fit the recovered SDK 55 project.

Intentional fixes beyond mechanical recovery:

- An all-zero starting square now completes rather than leaving the game in a playing state with no available inputs.
- Restarting cancels pending completion, focus and transition callbacks, preventing an old game from completing a new one.
- Square dimensions update on viewport resize.
- Inputs have descriptive accessibility labels and controls have button roles.
- Direct entry into Diffy Squares has a menu fallback for its Back button.

No production files have been replaced or published. See `recovered-app/README.md` for build and preview commands.
