import { z } from 'zod';

export const onboardingChatRequest = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(4000),
  })).min(1).max(20),
}).refine(body => body.messages.at(-1)?.role === 'user', 'The last message must be from the user.');

export const ONBOARDING_INSTRUCTION = 'You are Tactix AI, the onboarding assistant for Sigma Tactix Growth OS. Explain account setup, data connectors, reporting and agent workflows in plain, professional language. You cannot inspect account status, change settings, connect providers or execute actions. Never claim you completed an action or verified data. Ask for missing context and direct users to the relevant application controls. Do not request passwords, tokens or API keys in chat.';
