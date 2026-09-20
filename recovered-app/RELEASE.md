# First iPhone release

Product naming is open again (2026-09-19). **How Odd** is the latest candidate the owner likes; **Evening Oddities** remains a contender. The earlier choice of Even Primes was reconsidered. Existing app configuration and Expo project still use MathExplorers pending a final branding decision.
Publisher: Experiential Education, LLC. Use the legal entity for organization enrollment and the public developer name; do not use The Number Garden as the publisher brand.
Apple Developer organization enrollment has been started by the owner.

## Scope

Two activities: Factor and Add and Diffy Squares. Keep the accepted iPhone interactions. Native progress stays on the device, with no account or cross-device synchronization. Free initial distribution is proposed, not yet a final pricing decision. Start with iPhone; Android and desktop distribution can follow separately.

## Branding decision

- Public product name is not final. How Odd is under consideration after the owner reconsidered Even Primes and preferred Evening Oddities to it.
- Publisher remains Experiential Education, LLC.
- Initial web searches found no obvious exact-name math app or game. A nearby EVENPRIME skincare brand and trademark record surfaced; current trademark clearance, domain availability, and App Store name availability have not been established.
- Before release, update the app display name, visible branding, and listing materials. Decide the domain, URL scheme, and bundle identifier before registering the Apple app identity. Preserve the linked EAS project ID when updating configuration.

### Other names considered (2026-09-19)

These notes preserve the naming discussion and preliminary search findings; they are not legal clearance or a current availability guarantee.

| Name | Discussion and disposition |
| --- | --- |
| How Odd | Latest liked candidate. On September 19, 2026, USPTO searches CM:"how odd" and CM:howodd OR CM:(how AND odd) returned no results. Web searches did not surface an obvious exact-name app; NRICH has a math activity titled [How Odd](https://nrich.maths.org/problems/how-odd), and Arbordale's One Odd Day includes a How Odd? activity. These are educational content titles; brand rights have not been established. Common-phrase search noise is a discoverability concern. Domain and App Store reservation availability remain unchecked. |
| Even Primes | Initially chosen, then reconsidered by the owner. Plural plays on 2 being the only even prime. Initial web searches found no obvious exact-name math app or game; nearby EVENPRIME skincare brand noted. |
| Evening Oddities | Strong contender. Even/odd wordplay plus curious things to discuss over dinner fit the intended brand. Exact-phrase and combined evening/oddit* USPTO searches returned no results during the check. Related ODDITIES entertainment marks and games exist. Owner later preferred it to Even Primes but wanted to keep exploring. |
| Oddly Even | Contender with direct mathematical wordplay. USPTO application ODDLY EVEN 1234567890 (serial 98418977), covering card games including educational card games, was verified abandoned on January 5, 2026 for lack of a timely statement of use or extension. Commercial use remains unverified. Oddly Even Group also appears as a Shopify app developer. |
| Oddly | User found it interesting. Searches found ODD·LY perception puzzles, ODDLY Labs, Oddly Games number puzzles, and an Oddly social app. Nearby game uses made this a less attractive candidate. |
| Conject | Initially interested the user, alongside the idea of counterexamples; not selected. |
| Math Explorers / MathExplorers | Original working name. An existing Math Explorers iOS app and other educational uses prompted the rename discussion. |
| The Number Garden | Existing LLC DBA; user wanted to avoid releasing under this name because of possible trade-name conflicts. |

Earlier suggestions not pursued: Numberwild, Curiofold, Patternkin, Wonderifold, Little Conjectures, Counterexample, What If Not, Unless, Try Otherwise, Almost Always, Outlier, Hunch, Not Quite, Asterisk, and Loose Ends. The user rejected the initial suggestion rounds; among the later suggestions, Oddly drew interest. No clearance is established for these names.

Search references: [Math Explorers app](https://apps.apple.com/us/app/math-explorers/id6745819979), [ODDLY Labs](https://labs.oddly.ie/), [Oddly Games](https://oddly1.itch.io/), [Oddly Even application](https://tsdr.uspto.gov/#caseNumber=98418977&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch), [ODDITIES entertainment registration](https://tsdr.uspto.gov/#caseNumber=85892622&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch), and [EVENPRIME skincare record](https://trademarks.justia.com/873/02/evenprime-87302317.html).

## Prepared locally

- Expo SDK 57 with compatible dependencies.
- User accepted both activities after playing in Expo Go on a physical iPhone.
- SQLite-backed localStorage is installed before activity screens mount. Existing versioned snapshots and validators handle both activities. Synchronous writes avoid a pending asynchronous save queue on backgrounding.
- Production EAS build profile uses store distribution and automatic build-number increments.
- Local identity: slug `math-explorers`, URL scheme `mathexplorers`, and proposed iOS bundle identifier `xyz.mathexplorers.app`, derived from the existing `mathexplorers.xyz` domain. This identifier has not been registered; confirm before the first signed build.
- Portrait orientation and `ios.supportsTablet: false` target the first release at iPhone. This does not decide App Store availability on Apple-silicon Macs.
- A 1024×1024 opaque PNG app icon is derived from the existing vector logo, with its original cream background and no wordmark. A separate transparent mark is centered on a black native launch screen.
- Editable artwork is in `assets/app-icon.svg` and `assets/splash-mark.svg`. Re-export with `rsvg-convert <source.svg> -o <output.png>` (librsvg).

These are JavaScript export checks and Expo Go feedback, not signed-app or App Store approval evidence.

## Persistence verification

Passed: the user confirmed the iPhone Expo Go force-close/reopen persistence test on 2026-09-19. Repeat the following in the standalone TestFlight build.

1. In Factor and Add, create a connection and leave another pair or sum unfinished.
2. In Diffy Squares, leave a generation partially answered.
3. Force-close Expo Go, reopen it, and reopen this project. Enter each activity and check the saved graph, generation, and draft inputs.
4. Repeat with an explicit restart/new game to confirm old work does not return.

Repeat these checks in the standalone TestFlight build. Expo Go and the installed app have separate storage; test progress is not transferred. Removing an app or clearing its storage removes its saves. If storage fails, play can continue in memory, but relaunch recovery is unavailable.

## Before the first signed build

- Finish Apple organization enrollment and confirm access to App Store Connect.
- Expo project linked on 2026-09-19: [@pgaf/math-explorers](https://expo.dev/accounts/pgaf/projects/math-explorers), project ID `3a981964-1473-432d-aae7-265694bea0ee`. Owner and project ID are saved in app.json.
- Confirm the proposed bundle identifier `xyz.mathexplorers.app` before registering it with Apple; change the local config first if another identity is preferred.
- Finalize the public app name and verify availability and the developer name before creating the first App Store record.
- Review the prepared icon and verify the native launch appearance in the signed build. Expo Go does not fully reproduce production splash-screen configuration.
- Verify portrait behavior in the signed iPhone build and review iPad compatibility and Apple-silicon Mac availability explicitly in App Store Connect.
- Select an SDK 57-compatible EAS build image/toolchain. Check current Apple submission requirements when building; if using Xcode 27, follow Expo's SDK 57 scene-support instructions.

After those decisions, run from recovered-app:

```sh
npx eas-cli build --platform ios --profile production
```

Signing/account prompts require the owner's account access. Do not put credentials or signing secrets in source files.

## Before TestFlight / public review

- Install and test the production binary: fresh launch, cold restart, partial input recovery, background/foreground, both activities, and launch/play without a network connection.
- Check smaller screens, larger text, and any additional device classes enabled for distribution.
- Prepare screenshots and accurate descriptions of the two activities.
- Add a support/feedback contact and privacy-policy URL, plus an accessible privacy-policy link inside the app.
- Audit the production build and dependencies before completing Apple's privacy disclosures; local progress storage alone does not establish every SDK's data practices.
- Complete age rating, audience/category, export-compliance, pricing, and availability fields. Decide whether to enter the Kids category rather than assuming an educational app belongs there.
- Submit the selected production build to TestFlight, observe a small external pilot, resolve release-blocking feedback, then submit for public App Review.

The Expo project is linked to @pgaf/math-explorers. No Apple signing credentials have been created, build uploaded, or release submitted by this preparation.

## References

- [Expo SQLite localStorage](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#the-localstorage-api)
- [Expo iOS submission](https://docs.expo.dev/submit/ios/)
- [Expo SDK 57 release/toolchain notes](https://expo.dev/changelog/sdk-57)
- [Apple submission preparation](https://developer.apple.com/app-store/submitting/)
- [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple developer-name choice](https://developer.apple.com/help/app-store-connect/create-an-app-record/set-your-developer-name)
