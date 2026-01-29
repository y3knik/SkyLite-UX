import type { GeminiGenerateRequest, CountdownMessageRequest } from "./types";
import { getGeminiConfig } from "~/server/utils/geminiConfig";
import consola from "consola";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-1.5-flash";

export class GeminiClient {
  private apiKey: string | null = null;

  constructor() {
    const config = getGeminiConfig();
    this.apiKey = config?.apiKey || null;
  }

  async generateCountdownMessage(
    eventName: string,
    daysRemaining: number
  ): Promise<string> {
    if (!this.apiKey) {
      consola.warn("Gemini API key not configured. Using fallback message.");
      return this.getFallbackMessage(eventName, daysRemaining);
    }

    try {
      const prompt = this.buildCountdownPrompt(eventName, daysRemaining);
      const message = await this.generate({
        prompt,
        temperature: 0.9,
        maxTokens: 100,
      });

      return message;
    } catch (error) {
      consola.error("Failed to generate countdown message:", error);
      return this.getFallbackMessage(eventName, daysRemaining);
    }
  }

  private async generate(request: GeminiGenerateRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature || 0.9,
          maxOutputTokens: request.maxTokens || 100,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      consola.error("Gemini API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      consola.error("No candidates in Gemini response:", data);
      throw new Error("No response from Gemini API");
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      consola.error("Invalid candidate structure:", candidate);
      throw new Error("Invalid response structure from Gemini API");
    }

    const message = candidate.content.parts[0].text;
    return message.trim();
  }

  private buildCountdownPrompt(eventName: string, daysRemaining: number): string {
    if (daysRemaining === 0) {
      return `Generate a short, whimsical, and exciting message (max 15 words) for an event happening TODAY called "${eventName}". Make it feel special and urgent. Family-friendly only.`;
    } else if (daysRemaining === 1) {
      return `Generate a short, whimsical, and exciting message (max 15 words) for an event happening TOMORROW called "${eventName}". Make it feel anticipatory. Family-friendly only.`;
    } else {
      return `Generate a short, whimsical, and exciting message (max 15 words) for an event "${eventName}" happening in ${daysRemaining} days. Make it fun and creative. Family-friendly only.`;
    }
  }

  private getFallbackMessage(eventName: string, daysRemaining: number): string {
    if (daysRemaining === 0) {
      return `Today is the day! ${eventName} is here!`;
    } else if (daysRemaining === 1) {
      return `Only 1 day until ${eventName}!`;
    } else {
      return `Only ${daysRemaining} days until ${eventName}!`;
    }
  }
}

export const geminiClient = new GeminiClient();
