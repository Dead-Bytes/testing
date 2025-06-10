// src/shared/llm/ModelSelector.ts

import { ModelName, MODEL_PROVIDER_CONFIG } from "./config";
import { LLMProviderType } from "./types";

export interface ModelRequirements {
  priority: "speed" | "cost" | "output_tokens" | "accuracy";
  maxCost?: number;
  minOutputTokens?: number;
  speed?: "fastest" | "fast" | "slow";
  providers?: LLMProviderType[];
}

export interface SelectedModel {
  provider: LLMProviderType;
  modelId: string;
  rpm: number;
  tpm: number;
  outputTokens: number;
  speed: string;
  cost: { input: number; output: number };
}

export class ModelSelector {
  selectBestProvider(modelName: ModelName, requirements?: ModelRequirements): SelectedModel | null {
    const modelConfig = MODEL_PROVIDER_CONFIG[modelName];
    if (!modelConfig) {
      return null;
    }

    const candidates: SelectedModel[] = [];

    // Collect all provider options for this model
    for (const [providerKey, config] of Object.entries(modelConfig)) {
      const provider = providerKey as LLMProviderType;

      // Filter by provider preference
      if (requirements?.providers && !requirements.providers.includes(provider)) {
        continue;
      }

      // Filter by cost
      if (requirements?.maxCost && config.cost.input > requirements.maxCost) {
        continue;
      }

      // Filter by output tokens
      if (requirements?.minOutputTokens && config.outputTokens < requirements.minOutputTokens) {
        continue;
      }

      // Filter by speed
      if (requirements?.speed && config.speed !== requirements.speed) {
        continue;
      }

      candidates.push({
        provider,
        modelId: config.id,
        rpm: config.rpm,
        tpm: config.tpm,
        outputTokens: config.outputTokens,
        speed: config.speed,
        cost: config.cost,
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by priority
    return this.sortByPriority(candidates, requirements?.priority || "speed")[0];
  }

  private sortByPriority(candidates: SelectedModel[], priority: string): SelectedModel[] {
    switch (priority) {
      case "speed":
        return candidates.sort((a, b) => {
          const speedOrder = { fastest: 4, fast: 3, slow: 1 };
          return (
            (speedOrder[b.speed as keyof typeof speedOrder] || 0) -
            (speedOrder[a.speed as keyof typeof speedOrder] || 0)
          );
        });

      case "cost":
        return candidates.sort((a, b) => a.cost.input - b.cost.input);

      case "output_tokens":
        return candidates.sort((a, b) => b.outputTokens - a.outputTokens);

      default:
        return candidates;
    }
  }

  getAvailableProviders(modelName: ModelName): LLMProviderType[] {
    const modelConfig = MODEL_PROVIDER_CONFIG[modelName];
    if (!modelConfig) {
      return [];
    }

    return Object.keys(modelConfig) as LLMProviderType[];
  }

  getModelConfig(modelName: ModelName, provider: LLMProviderType) {
    return MODEL_PROVIDER_CONFIG[modelName]?.[provider as keyof (typeof MODEL_PROVIDER_CONFIG)[ModelName]];
  }
}
