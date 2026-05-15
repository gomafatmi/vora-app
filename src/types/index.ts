export type ProblemDomain =
  | "stress"
  | "anxiety"
  | "inferiority"
  | "anger"
  | "depression"
  | "grief"
  | "deception"
  | "loneliness"
  | "burnout"
  | "trauma"
  | "unknown";

export type CrisisLevel = "none" | "low" | "medium" | "high" | "critical";

export type InputMode = "written" | "oral";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  problemDomain?: ProblemDomain;
  crisisLevel?: CrisisLevel;
}

export interface EmotionalState {
  primaryEmotion: string;
  intensity: number;
  problemDomain: ProblemDomain;
  crisisLevel: CrisisLevel;
  confidence: number;
}

export interface TherapeuticResponse {
  content: string;
  techniques: string[];
  crisisDetected: boolean;
  crisisMessage?: string;
  encouragement: string;
}

export interface SessionState {
  messages: ChatMessage[];
  currentProblem?: ProblemDomain;
  emotionalHistory: EmotionalState[];
  sessionStart: number;
  messageCount: number;
  locale: string;
}

export interface STTOptions {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface TTSParams {
  text: string;
  language: string;
  rate?: number;
  pitch?: number;
}
