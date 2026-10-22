# Architecture rules
- Moon Crash uses private Cloud tables behind an edge function; hashed capability tokens authorize trainer and participant actions server-side without account signup.
- Moon Crash reference ranks and scoring are shared between the browser and edge function to prevent inconsistent results.