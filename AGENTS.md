# Project architecture rules

- Homepage topic content lives in `src/data/homeTopics.ts`; keep the 3D selector and offer cards driven by this shared trilingual model so labels, links, and selection cannot drift.
- Public password-gate explanations live in `src/data/toolIntroductions.ts` and render through shared gate components so access logic stays separate and unchanged.
- Public content surfaces use `SiteChrome` and the shared `technical-grid` background so page-level styling remains consistent without changing tool workflows.
- Marketing service routes render through `ServiceDetailPage` and `src/data/serviceDetails.ts` so concise core content, topic navigation and closed technical depth stay consistent.
- Base typography sizes every `span` at 16px, so spans inside display headings must explicitly inherit font size and line height; otherwise headings render at body size.
- Team and contact are normal public routes under shared `SiteChrome`; calls to action navigate there so browser history remains predictable.
- Public sub-pages (services, knowledge, team, contact, tool intros) render inside SiteChrome's PublicWorkspace via one mounted PublicFrame layout route so header and sticky navigation stay geometrically fixed and only content swaps; nested SiteChrome calls collapse to children. Topic signposts stay in fixed rows; active-topic offers swap in a separate group, and one fixed-height intro slot gives every page the same H1 start edge.
- Client/project references live only in `src/data/references.ts` and render through `ReferenceCard` on /references, the homepage teaser and service pages (max. two per page), so names and scope statements never diverge.
- KI-Lab entries and routed tools/games live in `src/data/labTools.ts`; the KI-Lab cards, workspace breadcrumb, visible tool title, return link and wide play-surface frame all read from it so labels and return paths cannot drift.
