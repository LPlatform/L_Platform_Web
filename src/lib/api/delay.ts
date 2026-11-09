import { ApiError, ERROR_CODES } from "./errors";

interface MockApiConfig {
  latencyMs: number;
  failureRate: number;
}

const FAILURE_RATE_KEY = "lplatform.mock.failureRate";
const DEFAULT_CONFIG: MockApiConfig = { latencyMs: 220, failureRate: 0 };

let config: MockApiConfig = { ...DEFAULT_CONFIG };

function readFailureRate(): number {
  if (typeof window === "undefined") return DEFAULT_CONFIG.failureRate;
  const raw = window.localStorage.getItem(FAILURE_RATE_KEY);
  const parsed = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : DEFAULT_CONFIG.failureRate;
}

export function configureMockApi(overrides: Partial<MockApiConfig>): void {
  config = { ...config, ...overrides };
}

export function resetMockApiConfig(): void {
  config = { ...DEFAULT_CONFIG };
}

export function setMockFailureRate(rate: number): void {
  const safe = Math.min(Math.max(rate, 0), 1);
  config.failureRate = safe;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FAILURE_RATE_KEY, String(safe));
  }
}

export function getMockFailureRate(): number {
  return typeof window === "undefined" ? config.failureRate : readFailureRate();
}

export async function mockRequest<T>(
  operation: string,
  resolver: () => T | Promise<T>,
): Promise<T> {
  const jitter = config.latencyMs > 0 ? Math.floor(Math.random() * 120) : 0;
  if (config.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, config.latencyMs + jitter));
  }
  const failureRate = readFailureRate();
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new ApiError(
      ERROR_CODES.MOCK_UNAVAILABLE,
      `Simulated service failure while ${operation}. Turn off failure simulation to continue.`,
      { status: 503 },
    );
  }
  return await resolver();
}
