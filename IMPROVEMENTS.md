# Hoppy Social portal

Access rules in `src/social/access.ts` were left as they are. Website-only accounts still stay out, and `tests/social-access.test.ts` did not need new cases.

## Agent errors were easy to miss

`src/social/api.ts` turned a dead agent, an empty body, and a non-JSON body into an unhandled or useless failure. FastAPI validation arrays (`detail: [{ msg }]`) were shown as raw JSON. A 401 only said "sign in". Network failures and unreadable bodies now become a short sentence, and the session exchange uses the same path.

## A failed inbox looked like an empty one

`src/social/pages.tsx` showed "No drafts waiting" when the inbox request failed, and Drop it stayed clickable while Approve was in flight. A failed load now shows the error and Try again. Both actions disable until the request finishes. If approval fails after the draft is saved, the form says the draft is already in the inbox so a second submit does not create another cue. Required call-sheet fields and a hold time in the past are rejected before anything is sent.

## Switching brand voice could overwrite another page

The voice page kept the previous page's sections when the page menu changed, and Save would write that copy onto the newly selected page. Changing pages loads that page's voice, ignores a stale response, and leaves Save off until the load succeeds. Load and save failures stay on the form.

## Other lists failed silently

Calendar, recipes, jobs, roster, boosts, and the library treated a failed request like an empty board, and save / create / pause had no `catch`. Those pages now show an error, keep a real empty state for a successful empty list, and report a failed save. Recipe hours outside 0–23 and a recipe with no days are rejected. Boost links only open `http` or `https` URLs.

## Keyboard and names

The studio focus ring is paper on the dark stage, so it stays visible on tungsten buttons (`src/styles/index.css`). The shell says "Checking the studio key…" instead of a blank screen, the inbox count has screen-reader text, the current studio link is `aria-current="page"`, still previews have alt text, and library tiles name the still. Sign-out still leaves the studio if the agent or Supabase call fails. The portal session read and sign-out no longer hang on a rejected promise (`src/routes/Portal.tsx`).
