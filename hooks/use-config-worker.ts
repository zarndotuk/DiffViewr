"use client";

import { useCallback } from "react";
import type {
  CompareWorkerRequest,
  CompareWorkerResult,
  ConfigWorkerResponse,
  ValidateWorkerRequest,
  ValidateWorkerResponse
} from "@/lib/workers/config-worker-types";

type PendingRequest = {
  resolve: (response: ConfigWorkerResponse) => void;
  reject: (error: Error) => void;
};

type ConfigWorkerPayload =
  | Omit<ValidateWorkerRequest, "id">
  | Omit<CompareWorkerRequest, "id">;

let sharedWorker: Worker | null = null;
let nextRequestId = 0;
const pendingRequests = new Map<number, PendingRequest>();

function rejectPending(message: string) {
  const error = new Error(message);
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests.clear();
}

function getWorker() {
  if (sharedWorker) return sharedWorker;

  const worker = new Worker(
    new URL("../lib/workers/config.worker.ts", import.meta.url),
    { type: "module" }
  );
  worker.onmessage = (event: MessageEvent<ConfigWorkerResponse>) => {
    const response = event.data;
    const pending = pendingRequests.get(response.id);
    if (!pending) return;
    pendingRequests.delete(response.id);
    if (response.type === "error") {
      pending.reject(new Error(response.message));
    } else {
      pending.resolve(response);
    }
  };
  worker.onerror = () => {
    rejectPending("Config processing worker failed.");
    worker.terminate();
    sharedWorker = null;
  };
  sharedWorker = worker;
  return worker;
}

function request<T extends ConfigWorkerResponse>(payload: ConfigWorkerPayload) {
  const id = ++nextRequestId;
  return new Promise<T>((resolve, reject) => {
    pendingRequests.set(id, {
      resolve: (response) => resolve(response as T),
      reject
    });
    getWorker().postMessage({ ...payload, id });
  });
}

export function useConfigWorker() {
  const validate = useCallback(
    async (input: string) =>
      request<ValidateWorkerResponse>({ type: "validate", input }),
    []
  );

  const compare = useCallback(
    async (refText: string, targetText: string, reorderArrays: boolean) => {
      const response = await request<
        Extract<ConfigWorkerResponse, { type: "compare" }>
      >({
        type: "compare",
        refText,
        targetText,
        reorderArrays
      });
      return response.result as CompareWorkerResult;
    },
    []
  );

  return { validate, compare };
}
