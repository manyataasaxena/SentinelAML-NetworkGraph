export type PipelineMode = "sync" | "async";

export const pipelineMode: PipelineMode = process.env.EVENT_PIPELINE_MODE === "async" ? "async" : "sync";
export const workerId = process.env.WORKER_ID ?? `aml-worker-${process.pid}`;
export const workerMaxRetries = Math.max(1, Number(process.env.WORKER_MAX_RETRIES ?? 3));

export function isAsyncPipelineEnabled() {
  return pipelineMode === "async";
}