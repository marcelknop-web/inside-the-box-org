# Project architecture rules

- Homepage topic content lives in `src/data/homeTopics.ts`; keep the 3D selector and offer cards driven by this shared trilingual model so labels, links, and selection cannot drift.
- Public password-gate explanations live in `src/data/toolIntroductions.ts` and render through shared gate components so access logic stays separate and unchanged.