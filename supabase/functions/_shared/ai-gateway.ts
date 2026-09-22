import { createAnthropic } from "npm:@ai-sdk/anthropic";

export function createAnthropicProvider(anthropicApiKey: string) {
  return createAnthropic({
    apiKey: anthropicApiKey,
  });
}
