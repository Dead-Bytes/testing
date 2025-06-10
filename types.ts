// src/shared/llm/types/index.ts

export enum LLMProviderType {
  GROQ = "groq",
  OPENROUTER = "openrouter",
  TOGETHER = "together",
  ANTHROPIC = "anthropic",
  OPENAI = "openai",
}

export enum ModelCapability {
  VISION = "vision",
  TOOLS = "tools",
  CODING = "coding",
  REASONING = "reasoning",
  CREATIVE = "creative",
  MULTIMODAL = "multimodal",
  FUNCTION_CALLING = "function_calling",
  JSON_MODE = "json_mode",
}

export enum ModelSpeed {
  SLOW = "slow",
  MEDIUM = "medium",
  FAST = "fast",
  FASTEST = "fastest",
}

export enum ModelAccuracy {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  HIGHEST = "highest",
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = "round_robin",
  WEIGHTED = "weighted",
  LEAST_USED = "least_used",
  RANDOM = "random",
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }>;
  name?: string;
}

export interface BaseLLMRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stream?: boolean;
  stop?: string[];
  seed?: number;
  metadata?: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    providerId: LLMProviderType;
    latency: number;
    cost?: number;
    requestId?: string;
    cached?: boolean;
  };
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls";
}

export interface ModelDefinition {
  id: string;
  name: string;
  provider: LLMProviderType;
  capabilities: {
    maxContextTokens: number;
    maxOutputTokens: number;
    supportsVision: boolean;
    supportsTools: boolean;
    supportsJsonMode: boolean;
    accuracy: ModelAccuracy;
    speed: ModelSpeed;
    specializations: ModelCapability[];
  };
  pricing: {
    inputTokens: number;
    outputTokens: number;
    currency: "USD";
  };
  defaults: {
    temperature: number;
    topP: number;
    topK?: number;
    maxTokens: number;
  };
  rateLimit: {
    rpm: number;
    tpm: number;
    concurrent?: number;
  };
  contextWindow: number;
  trainingData?: string;
  releaseDate?: string;
  deprecated?: boolean;
}

export interface ProviderConfig {
  apiKeys: string[];
  baseUrl?: string;
  timeout?: number;
  enabled: boolean;
  weight: number;
  loadBalancing: LoadBalancingStrategy;
  maxConcurrentRequests?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface ModelRequirements {
  capabilities?: ModelCapability[];
  minAccuracy?: ModelAccuracy;
  maxLatency?: ModelSpeed;
  maxCost?: number;
  contextTokens?: number;
  outputTokens?: number;
  providers?: LLMProviderType[];
  excludeModels?: string[];
  excludeProviders?: LLMProviderType[];
  requiresVision?: boolean;
  requiresTools?: boolean;
  requiresJsonMode?: boolean;
}

export interface FallbackOptions {
  maxRetries: number;
  maxModelSwitches: number;
  retryDelay: number;
  backoffMultiplier: number;
  requirements?: ModelRequirements;
  skipProviders?: LLMProviderType[];
}

export interface LLMRequestOptions {
  requirements?: ModelRequirements;
  fallback?: FallbackOptions;
  userId?: string;
  orgId?: string;
  priority?: "low" | "normal" | "high";
  cacheKey?: string;
  cacheTtl?: number;
  queue?: {
    maxWaitTime: number;
    priority: "low" | "normal" | "high";
  };
}

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: LLMProviderType,
    public model?: string,
    public retryable: boolean = true,
    public errorCode?: string,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class ModelUnavailableError extends LLMError {
  constructor(model: string, provider: LLMProviderType) {
    super(`Model ${model} unavailable on ${provider}`, provider, model, false, "MODEL_UNAVAILABLE");
    this.name = "ModelUnavailableError";
  }
}

export interface LLMProvider {
  readonly type: LLMProviderType;
  readonly name: string;
  readonly models: ModelDefinition[];
  readonly config: ProviderConfig;

  chat(request: BaseLLMRequest): Promise<LLMResponse>;
  healthCheck(): Promise<boolean>;
  estimateCost(request: BaseLLMRequest, model?: string): Promise<number>;
  getAvailableModels(): Promise<ModelDefinition[]>;
  getModel(modelId: string): ModelDefinition | undefined;
  rotateApiKey(): void;
  getCurrentApiKey(): string;
}
