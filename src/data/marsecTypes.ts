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
  };
  objectives: string[];
  schedule: { time: string; segment: string; content: string }[];
  injects: Inject[];
  roles: ExerciseRole[];
  reportingObligations: { addressee: string; deadline: string; basis?: string }[];
  hotwashNotes: string[];
}
