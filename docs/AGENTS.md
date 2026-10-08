# AGENTS.md

## Purpose

- Own the public website served by GitHub Pages from this folder: the support page and the privacy policy that both app stores link to.

## Ownership

- [index.html](index.html) is the support and marketing page. Apple's Support URL and Marketing URL point here.
- [privacy/index.html](privacy/index.html) is the Hebrew privacy policy, the canonical text.
- [privacy/en/index.html](privacy/en/index.html) is the English privacy policy and must stay a faithful equivalent of the Hebrew one.
- [taharah-review.html](taharah-review.html) is the Hebrew review document for the rav who approves the halachic rules of the family-purity tracker. It is reached by direct URL only (nothing links to it, and it is `noindex`). It must match [../src/data/taharahPresets.ts](../src/data/taharahPresets.ts) exactly: a changed preset value, rule or `TAHARAH_RULES_VERSION` changes the table, the rules version in its meta line and the numbered list of items to verify in the same edit. It is a review document, not a user-facing policy, and not a claim about shipped behavior.
- [style.css](style.css) is shared by every page here.

## Local Contracts

- The support page and the privacy policies are public and legally binding. Every claim must be provable from the shipped code, not from intent.
- The policy currently states that the app makes no network requests of its own and that only EAS Update contacts a remote server. Adding any analytics, crash reporting, ad SDK, or backend call breaks that claim and requires editing both language versions in the same change.
- Contact details and store URLs are real values. Never write a placeholder here.
- Both language versions change together. A section added to one and missing from the other is a compliance gap.
- Update the effective date at the top of both policy pages whenever their substance changes, and only then.
- Keep the app name identical to the display name in [../app.json](../app.json).
- Plain static HTML with no build step and no external assets. Pages must render offline from the repository.

## Work Guidance

- Before editing a data claim, verify it against [../app.json](../app.json) permissions, [../src/stores/](../src/stores) for what is persisted, and [../src/services/](../src/services) for what leaves the device.
- Store listing copy lives in [../release/](../release) and links back to these URLs. Change one, check the other.

## Verification

- Open both policy pages in a browser and confirm the Hebrew renders right-to-left and the language switch links resolve.
- Open [taharah-review.html](taharah-review.html) at phone width (375px) and at desktop width: confirm the Hebrew renders right-to-left, nothing scrolls horizontally, the rules table collapses into stacked cards with a label on every value, and each `לאימות` badge jumps to its numbered item in section 8.
- Run [pnpm check:dox](../scripts/check-dox.js) after adding or moving a file here.
- Confirm the live URLs resolve after publishing: `https://avraham-sason.github.io/jew-in-time/` and `https://avraham-sason.github.io/jew-in-time/privacy/`.

## Child DOX Index

- No child AGENTS.md files.
