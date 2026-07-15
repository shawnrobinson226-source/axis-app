// /lib/kernel/events.ts

export const VANTA_SCHEMA_VERSION = "v1.0.0" as const;
export const VANTA_TAXONOMY_VERSION = "v1.0.0" as const;
export const VANTA_CONTINUITY_FORMULA_VERSION = "v1.0.0" as const;

import {
  DISTORTION_CLASS,
  SESSION_OUTCOME,
  type DistortionClass,
  type SessionOutcome,
} from "@/lib/kernel/domain";

export {
  DISTORTION_CLASS,
  SESSION_OUTCOME,
};

export type {
  DistortionClass,
  SessionOutcome,
};

/**
 * Locked distortion taxonomy (V1)
 */

export const INTENSITY = ["low", "medium", "high"] as const;
export type Intensity = (typeof INTENSITY)[number];

export const REDUCTION_PROTOCOL = [
  "factual_rewrite",
  "aligned_action",
  "corrective_reflection",
  "containment_practice",
] as const;

export type ReductionProtocolType = (typeof REDUCTION_PROTOCOL)[number];

/**
 * Base event envelope
 * Append-only: never mutate existing events.
 */
export type EventBase = {
  event_id: string; // ulid/uuid
  event_type: EventType;
  occurred_at: string; // ISO timestamp
  schema_version: typeof VANTA_SCHEMA_VERSION;

  // Actor is always human in V1. AI is "advisor" only; record suggestions separately.
  actor: {
    kind: "human" | "system" | "ai";
    // In V1 single-user, this can be omitted or "operator".
    actor_id?: string;
  };

  // Correlation identifiers
  operator_id: string;
  session_id?: string;
  fracture_id?: string;
  distortion_id?: string;

  // Audit / debugging metadata (non-sensitive)
  meta?: Record<string, string | number | boolean | null>;
};

export const EVENT_TYPE = [
  // Session lifecycle
  "session.created",
  "session.step.completed",
  "session.closed",

  // User inputs (raw)
  "input.trigger.recorded",
  "input.mapping.recorded",

  // Classification + confirmation boundary
  "ai.classification.suggested",
  "classification.confirmed",

  // Reduction protocol execution
  "protocol.selected",
  "protocol.executed",

  // Emergency reset
  "reset.invoked",
  "reset.completed",

  // Continuity computation
  "continuity.calculated",

  // Fracture & distortion state transitions (status changes are events, not edits)
  "fracture.created",
  "fracture.status.changed",
  "distortion.created",
  "distortion.status.changed",

  // Action logging
  "action.aligned.logged",
  "action.aligned.completed",
] as const;

export type EventType = (typeof EVENT_TYPE)[number];

/**
 * Payloads (strict, minimal, V1-safe)
 */

// 1) Session lifecycle
export type SessionCreatedEvent = EventBase & {
  event_type: "session.created";
  session_id: string;
  payload: {
    entry_state_context?: string; // short
    entry_state_mood?: string; // short
  };
};

export type SessionStepCompletedEvent = EventBase & {
  event_type: "session.step.completed";
  session_id: string;
  payload: {
    step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    // Optional short note for that step (keep it small)
    note?: string;
  };
};

export type SessionClosedEvent = EventBase & {
  event_type: "session.closed";
  session_id: string;
  payload: {
    outcome: SessionOutcome;
    exit_state_clarity_rating: number; // 0–10
    steps_completed: number; // 0–9
  };
};

// 2) Inputs (raw)
export type TriggerRecordedEvent = EventBase & {
  event_type: "input.trigger.recorded";
  session_id: string;
  payload: {
    trigger_text: string; // raw user text
    context_tags?: string[]; // optional controlled vocab later; free strings in V1
    intensity?: Intensity; // user-reported
  };
};

export type MappingRecordedEvent = EventBase & {
  event_type: "input.mapping.recorded";
  session_id: string;
  payload: {
    spreads_into: {
      thought?: string;
      emotion?: string;
      behavior?: string;
    };
  };
};

// 3) AI suggestion + human confirmation boundary
export type AIClassificationSuggestedEvent = EventBase & {
  event_type: "ai.classification.suggested";
  session_id: string;
  payload: {
    suggested_class: DistortionClass;
    confidence?: number; // 0–1
    rationale?: string; // short, optional (avoid long narratives)
  };
};

export type ClassificationConfirmedEvent = EventBase & {
  event_type: "classification.confirmed";
  session_id: string;
  payload: {
    confirmed_class: DistortionClass;
    // Human confirmation is the governance boundary
    confirmed_by: "human";
  };
};

// 4) Protocol selection/execution
export type ProtocolSelectedEvent = EventBase & {
  event_type: "protocol.selected";
  session_id: string;
  payload: {
    protocol_type: ReductionProtocolType;
  };
};

export type ProtocolExecutedEvent = EventBase & {
  event_type: "protocol.executed";
  session_id: string;
  payload: {
    protocol_type: ReductionProtocolType;
    // store minimal evidence, not essays
    output?: string; // short instruction/result
  };
};

// 5) Emergency Reset
export type ResetInvokedEvent = EventBase & {
  event_type: "reset.invoked";
  session_id: string;
  payload: {
    reason: "user_overwhelm" | "intensity_high" | "session_failed_to_reduce";
  };
};

export type ResetCompletedEvent = EventBase & {
  event_type: "reset.completed";
  session_id: string;
  payload: {
    pause_seconds: number; // 30–60 typical
    user_reported_clarity?: number; // 0–10
  };
};

// 6) Continuity calculation
export type ContinuityCalculatedEvent = EventBase & {
  event_type: "continuity.calculated";
  session_id: string;
  payload: {
    formula_version: typeof VANTA_CONTINUITY_FORMULA_VERSION;

    before: {
      perception_alignment: number; // 0–100
      identity_alignment: number; // 0–100
      intention_alignment: number; // 0–100
      action_alignment: number; // 0–100
      continuity_score: number; // 0–100
    };

    after: {
      perception_alignment: number; // 0–100
      identity_alignment: number; // 0–100
      intention_alignment: number; // 0–100
      action_alignment: number; // 0–100
      continuity_score: number; // 0–100
    };
  };
};

// 7) Fracture & distortion lifecycle
export type FractureCreatedEvent = EventBase & {
  event_type: "fracture.created";
  session_id: string;
  fracture_id: string;
  payload: {
    type: DistortionClass; // in V1: fracture.type must match confirmed distortion class
    origin_description?: string;
    trigger_description?: string;
    intensity?: Intensity;
    risk_level?: "low" | "medium" | "high"; // lock to enum for V1
  };
};

export type FractureStatusChangedEvent = EventBase & {
  event_type: "fracture.status.changed";
  fracture_id: string;
  payload: {
    from: "active" | "mapped" | "reduced" | "integrated";
    to: "active" | "mapped" | "reduced" | "integrated";
    // Optional reason codes to keep it structured
    reason?: "session_reduced" | "manual_confirm" | "integration_complete";
  };
};

export type DistortionCreatedEvent = EventBase & {
  event_type: "distortion.created";
  session_id: string;
  fracture_id: string;
  distortion_id: string;
  payload: {
    class: DistortionClass;
    description?: string;
    current_effect?: string;
    severity?: number; // 0–10
  };
};

export type DistortionStatusChangedEvent = EventBase & {
  event_type: "distortion.status.changed";
  distortion_id: string;
  payload: {
    from: "active" | "unresolved" | "reduced";
    to: "active" | "unresolved" | "reduced";
  };
};

// 8) Action log
export type AlignedActionLoggedEvent = EventBase & {
  event_type: "action.aligned.logged";
  session_id: string;
  payload: {
    aligned_next_action: string; // required unless escalated session
    due_within_hours?: number; // optional
  };
};

export type AlignedActionCompletedEvent = EventBase & {
  event_type: "action.aligned.completed";
  payload: {
    aligned_next_action: string;
    completed_at: string; // ISO
  };
};

// Union
export type VantaEvent =
  | SessionCreatedEvent
  | SessionStepCompletedEvent
  | SessionClosedEvent
  | TriggerRecordedEvent
  | MappingRecordedEvent
  | AIClassificationSuggestedEvent
  | ClassificationConfirmedEvent
  | ProtocolSelectedEvent
  | ProtocolExecutedEvent
  | ResetInvokedEvent
  | ResetCompletedEvent
  | ContinuityCalculatedEvent
  | FractureCreatedEvent
  | FractureStatusChangedEvent
  | DistortionCreatedEvent
  | DistortionStatusChangedEvent
  | AlignedActionLoggedEvent
  | AlignedActionCompletedEvent;