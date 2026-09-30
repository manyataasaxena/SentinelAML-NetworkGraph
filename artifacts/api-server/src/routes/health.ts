import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { getKafkaHealth } from "../lib/eventBus";
import { getRedisHealth, hasWorkerHeartbeat } from "../lib/redisCache";
import { isAsyncPipelineEnabled, workerId } from "../lib/pipelineConfig";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/readyz", async (_req, res) => {
  let database = "ok";
  try {
    await db.execute(sql`select 1`);
  } catch {
    database = "error";
  }

  const kafka = getKafkaHealth();
  const redis = getRedisHealth();
  const workerHeartbeat = redis.configured ? await hasWorkerHeartbeat(workerId) : false;
  const worker = isAsyncPipelineEnabled() ? (workerHeartbeat ? "ok" : "starting") : "not_required";
  const dependenciesReady =
    database === "ok" &&
    (!isAsyncPipelineEnabled() || (kafka.configured && redis.configured && worker === "ok"));

  res.status(dependenciesReady ? 200 : 503).json({
    status: dependenciesReady ? "ready" : "not_ready",
    dependencies: {
      api: "ok",
      postgresql: database,
      kafka: isAsyncPipelineEnabled() ? (kafka.configured ? "configured" : "not_configured") : "not_required",
      redis: redis.configured ? (redis.connected ? "ok" : "configured") : "not_configured",
      amlWorker: worker,
    },
  });
});

export default router;
