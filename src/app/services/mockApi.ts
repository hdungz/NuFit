import type { ApiResponse } from "../lib/models";
import { wait } from "../lib/utils";

const MIN_LATENCY = 100;
const MAX_LATENCY = 400;
const TRANSIENT_ERROR_RATE = 0.03;

function randomLatency() {
  return Math.floor(Math.random() * (MAX_LATENCY - MIN_LATENCY + 1)) + MIN_LATENCY;
}

function shouldFail() {
  return Math.random() < TRANSIENT_ERROR_RATE;
}

export async function withMockApi<T>(
  operation: () => T,
  options?: { errorMessage?: string; forceNoFailure?: boolean },
): Promise<ApiResponse<T>> {
  const latencyMs = randomLatency();
  await wait(latencyMs);
  const requestId = crypto.randomUUID();

  if (!options?.forceNoFailure && shouldFail()) {
    return {
      data: null,
      error: options?.errorMessage ?? "Kết nối không ổn định. Vui lòng thử lại.",
      meta: {
        requestId,
        status: 503,
        simulated: true,
        retryable: true,
        latencyMs,
      },
    };
  }

  try {
    const data = operation();
    return {
      data,
      error: null,
      meta: {
        requestId,
        status: 200,
        simulated: true,
        retryable: false,
        latencyMs,
      },
    };
  } catch {
    return {
      data: null,
      error: "Đã có lỗi hệ thống. Hãy thử lại sau.",
      meta: {
        requestId,
        status: 500,
        simulated: true,
        retryable: true,
        latencyMs,
      },
    };
  }
}
