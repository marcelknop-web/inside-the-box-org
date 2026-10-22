# Architecture rules
- Moon Crash uses private Cloud tables behind an edge function; hashed capability tokens authorize trainer and participant actions server-side without account signup.
- Moon Crash shares validation between browser and edge function; reference ranks and scoring stay server-side until trainer release so the solution is not shipped in browser code.