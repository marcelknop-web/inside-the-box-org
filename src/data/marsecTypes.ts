// MarSec Studio — shared exercise data model.

export interface Inject {
  id: string;
  time: string;
  phase: string;
  mandatory: boolean;
  title: string;
  topicTag: string;
  channel: string;
  content: string;
  expectedResponse: string;
  facilitatorNote: string;
  discussionPrompts: string[];
  clarifications: { question: string; answer: string }[];
  observationFocus: string;
  dependsOn?: string;
}

export interface ExerciseRole {
  name: string;
  profile: string;
  tasks: string[];
  tension: string;
  /** What this role may decide alone, and what it must escalate. Closes the "who decides?" gap. */
  decisionRights?: string;
}

/** Functions that are not played as full roles but must be reachable during the exercise. */
export interface SupportCell {
  name: string;
  availability: string;
  ownsDecisions: string;
}


export interface Exercise {
  exerciseName: string;
  summary: string;
  groundTruth: {
    organisationProfile: string;
    adversaryOrCause: string;
    timeline: { time: string; event: string }[];
    complications: string[];
    classificationTime?: string;
    /** Explicit technical bridge that makes the escalation plausible (shore IT vs on-board IT/OT). */
    architectureAssumption?: string;
    /** Internal fact sheet: resolved answers the facilitator holds while participants speculate. */
    facts?: { question: string; answer: string }[];
  };
  objectives: string[];
  /** Simulation timeline (in-scenario clock), not the real room agenda. */
  schedule: { time: string; segment: string; content: string }[];
  /** Real room agenda: wall-clock minutes per block. Sums to the booked session length. */
  roomAgenda?: { block: string; minutes: number; activity: string; simTime?: string }[];
  injects: Inject[];
  roles: ExerciseRole[];
  /** Legal/DPA, fleet ops, Master etc. — reachable on call, with explicit decision ownership. */
  supportCells?: SupportCell[];

  reportingObligations: {
    addressee: string;
    deadline: string;
    basis?: string;
    /** Distinguishes statutory clocks from internal or contractual targets. */
    kind?: "Regulatory deadline" | "Internal escalation target" | "Company / contract / class target";
  }[];
  hotwashNotes: string[];
}
