# AGENTS.md — Impromptu Participant Web

This repository is the Impromptu participant-web workspace.

Repository:
`/Users/levipatton/Documents/GitHub/Impromptu-landing`

Sibling repositories:
- Firebase/backend: `/Users/levipatton/Projects/ImpromptuFirebase`
- iOS: `/Users/levipatton/Projects/Impromptu`

## Role

This workspace owns the frictionless participant web experience:
- invite preview
- Join
- four fixed statuses
- People Joined / shared participant state
- leave/rejoin
- browser-session restoration
- web-side reliability and presentation

It does not own hosting/organizer functionality or broad product-strategy changes.

## Product Boundaries

Protect:
- no app install required;
- low-pressure participation;
- four fixed statuses: Not shared, On my way, I'm close, I arrived;
- no custom status/chat;
- fresh unrelated invite must still show Join even when browser Auth persists;
- participant web should not be deliberately crippled to force an iOS install.

## Canonical Identity

Firebase anonymous Auth is the browser identity.

Canonical participant path:

`hangouts/{hangoutId}/participants/{authUid}`

Canonical membership requires:

`membershipAuthUid == authUid`

Rules:
- browser must not send an ownership UID claim;
- `participantAuthUid` / `webAuthUid` are retired;
- participant document path alone is not enough—canonical membership field must match;
- invite token is for initial join eligibility, not ongoing participant identity;
- private listeners begin only after successful canonical restoration or successful Join;
- leave/status changes use trusted callable Functions, not direct private Firestore mutation;
- ambiguous/conflicting identity fails closed.

Fresh-invite invariant:

persisted Firebase Auth UID  
+ unrelated new hangout  
+ no canonical membership  
= show Join flow

Do not regress this.

## Deployment Model

Production web deployment is tied to GitHub/Netlify.

Normal reviewed flow:
1. inspect diff/tests;
2. commit to `main`;
3. push `origin main`;
4. Netlify automatically publishes production;
5. verify deployed commit/content;
6. run production browser smoke test.

A push to production `main` is therefore also a production web deployment trigger. Treat it as an explicit gate.

Do not run manual Netlify deployment commands unless there is a specific reason and explicit approval.

## Validation

Before recommending production push, run the practical relevant subset of:
- canonical web regression tests;
- syntax/module validation;
- `git diff --check`;
- Git branch/remote status;
- review for unrelated changes.

After deployment, validate:
- fresh invite -> Join;
- join/status;
- refresh/reopen restoration;
- leave/rejoin;
- production HTML/commit if needed.

## Debug / Release Cleanup

Known development tool:
- `?debug=1`

It remains useful during development but must be explicitly reviewed before App Store/public release. Remove, gate, or sanitize it so production does not expose sensitive internal state or noisy diagnostics.

Search for other hidden/debug/test affordances before final release.

## Codex Working Style

The user generally copies prompts verbatim and prefers Codex/ChatGPT to interpret logs and repository state.

- Medium reasoning for routine web work.
- High reasoning when web changes touch Auth, Rules assumptions, identity, restoration, or risky multi-file state behavior.
- Prefer root-cause fixes.
- Preserve the simple participant experience.
- Do not silently modify Firebase/backend contracts from this workspace.

### Codex Result / Handoff Format

Use chat for short results only.

- If the result is roughly 40 meaningful lines or fewer, report it directly in chat. The user may provide a screenshot of that result back to ChatGPT.
- If the result would exceed roughly 40 meaningful lines, do not dump the full result into chat. Create a concise Markdown (`.md`) handoff file instead and return only a 1–3 sentence summary, the handoff file path, and the single recommended next action.
- Also use a Markdown handoff when information must cross a VS Code window, ChatGPT workbench, repository, or future session, even if it is somewhat shorter.
- A handoff is not a transcript. Distill it to the information another AI/developer needs: findings, decisions, relevant files/contracts, tests, deployment state, risks, unresolved questions, and next action.
- Keep reusable or executable code in its proper source/script file rather than embedding it in the Markdown handoff.

## Git

Prefer GitHub Desktop for ordinary commit/push workflow unless exact staging/history manipulation materially benefits from Terminal.

Do not commit/push or trigger Netlify production unless explicitly approved.
