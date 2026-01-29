export interface GeminiGenerateRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CountdownMessageRequest {
  eventName: string;
  daysRemaining: number;
}

export interface CountdownMessageResponse {
  message: string;
  cached: boolean;
  generatedAt: Date;
}
