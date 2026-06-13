/// <reference lib="webworker" />

import {
  processComparison,
  processValidation
} from "@/lib/workers/config-processing";
import type {
  ConfigWorkerRequest,
  ConfigWorkerResponse
} from "@/lib/workers/config-worker-types";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.addEventListener("message", (event: MessageEvent<ConfigWorkerRequest>) => {
  const request = event.data;
  let response: ConfigWorkerResponse;

  try {
    response =
      request.type === "validate"
        ? processValidation(request.id, request.input)
        : {
            id: request.id,
            type: "compare",
            result: processComparison(
              request.refText,
              request.targetText,
              request.reorderArrays
            )
          };
  } catch (error) {
    response = {
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error)
    };
  }

  workerScope.postMessage(response);
});

export {};
