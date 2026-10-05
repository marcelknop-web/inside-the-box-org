# Project architecture rules

- Homepage topic content lives in `src/data/homeTopics.ts`; keep the 3D selector and offer cards driven by this shared trilingual model so labels, links, and selection cannot drift.
- Public password-gate explanations live in `src/data/toolIntroductions.ts` and render through shared gate components so access logic stays separate and unchanged.
- Public content surfaces use `SiteChrome` and the shared `technical-grid` background so page-level styling remains consistent without changing tool workflows.
- Marketing service routes render through `ServiceDetailPage` and `src/data/serviceDetails.ts` so concise core content, topic navigation and closed technical depth stay consistent.
- Base typography sizes every `span` at 16px, so spans inside display headings must explicitly inherit font size and line height; otherwise headings render at body size.
- Team and contact are normal public routes under shared `SiteChrome`; calls to action navigate there so browser history remains predictable.
- Public sub-pages (services, knowledge, team, contact, tool intros) render inside SiteChrome's PublicWorkspace via one mounted PublicFrame layout route so header and sticky navigation stay geometrically fixed and only content swaps; nested SiteChrome calls collapse to children.
