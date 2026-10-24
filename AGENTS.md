# Architecture rules
- Blind Spot sizes the desktop live exercise with a viewport-height flex shell and zero-minimum grid tracks, keeping chat input visible while history scrolls only inside panels.
- Moon Crash uses private Cloud tables behind an edge function; hashed capability tokens authorize trainer and participant actions server-side without account signup.
- Moon Crash shares validation between browser and edge function; reference ranks and scoring stay server-side until trainer release so the solution is not shipped in browser code.
- Moon Crash keeps ranking entry and result charts in focused components; per-person capabilities survive role switching, while trainer group-save/reveal uses a session-row-locked private RPC to freeze all rankings consistently.
- Moon Crash presents a shared mission briefing before equipment selection; participant and group decisions use the same ordered-item input while NASA reference data remains server-side.
- AssistantZero scores cyber insurance prospects deterministically in src/data/cyberInsurance.ts against generic market segments; no AI and no premium figures, so results stay traceable.
