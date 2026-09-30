import { and, eq } from "drizzle-orm";
import {
  db,
  deadLetterEventsTable,
  syntheticTransactionsTable,
} from "@workspace/db";
import {
  createKafkaConsumer,
  eventTopics,
  publishEvent,
  type TransactionReceivedEvent,
} from "./eventBus";
import { invalidateCache, setWorkerHeartbeat } from "./redisCache";
import { workerId, workerMaxRetries } from "./pipelineConfig";
import { recomputeAllRisk } from "./riskEngine";
import { logger } from "./logger";

export function classifyWorkerError(error: unknown) {
  const reason = error instanceof Error ? error.message : "Unknown worker failure";
  const nonRetryable = /validation|malformed|unsupported/i.test(reason);
  return { reason, retryable: !nonRetryable };
}

export function calculateRetryDelay(attempt: number) {
  return Math.min(30_000, 250 * 2 ** Math.max(0, attempt - 1));
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function writeDeadLetter(event: TransactionReceivedEvent, reason: string, retryCount: number) {
  await db
    .insert(deadLetterEventsTable)
    .values({
      eventId: event.eventId,
      transactionId: event.payload.transactionId,
      topic: eventTopics.transactionReceived,
      eventType: event.eventType,
      payload: event,
      failureReason: reason,
      retryCount,
      worker: workerId,
      status: "pending",
    })
    .onConflictDoUpdate({
      target: deadLetterEventsTable.eventId,
      set: {
        failureReason: reason,
        retryCount,
        worker: workerId,
        status: "pending",
        updatedAt: new Date(),
      },
    });

  await db
    .update(syntheticTransactionsTable)
    .set({ processingStatus: "dead_lettered", lastError: reason })
    .where(eq(syntheticTransactionsTable.id, event.payload.eventId));
}

async function publishProcessingResults(event: TransactionReceivedEvent, result: { updated: number; alertsCreated: number }) {
  const base = {
    version: 1 as const,
    eventId: event.eventId,
    occurredAt: new Date().toISOString(),
    correlationId: event.correlationId,
  };
  await publishEvent(eventTopics.transactionProcessed, {
    ...base,
    eventType: "transaction.processed",
    payload: { transactionId: event.payload.transactionId, eventId: event.eventId },
  });
  await publishEvent(eventTopics.riskCalculated, {
    ...base,
    eventType: "risk.calculated",
    payload: { transactionId: event.payload.transactionId, ...result },
  });
  if (result.alertsCreated > 0) {
    await publishEvent(eventTopics.alertCreated, {
      ...base,
      eventType: "alert.created",
      payload: { transactionId: event.payload.transactionId, count: result.alertsCreated },
    });
  }
  await publishEvent(eventTopics.graphUpdated, {
    ...base,
    eventType: "graph.updated",
    payload: { transactionId: event.payload.transactionId },
  });
}

export async function processTransactionReceived(event: TransactionReceivedEvent) {
  const [current] = await db
    .select()
    .from(syntheticTransactionsTable)
    .where(eq(syntheticTransactionsTable.id, event.payload.eventId))
    .limit(1);

  if (!current) throw new Error(`Synthetic event ${event.payload.eventId} does not exist`);
  if (current.processingStatus === "processed") {
    logger.info({ eventId: event.eventId }, "Duplicate processed event ignored");
    return { duplicate: true, attempts: current.processingAttempts };
  }

  let lastError: string | null = null;
  for (let attempt = 1; attempt <= workerMaxRetries; attempt++) {
    await db
      .update(syntheticTransactionsTable)
      .set({ processingStatus: "processing", processingAttempts: attempt, lastError: null })
      .where(
        and(
          eq(syntheticTransactionsTable.id, event.payload.eventId),
          eq(syntheticTransactionsTable.processingStatus, current.processingStatus),
        ),
      );

    try {
      const result = await recomputeAllRisk();
      await publishProcessingResults(event, result);
      await db
        .update(syntheticTransactionsTable)
        .set({ processingStatus: "processed", processedAt: new Date(), lastError: null })
        .where(eq(syntheticTransactionsTable.id, event.payload.eventId));
      await invalidateCache("dashboard:summary");
      return { duplicate: false, attempts: attempt, result };
    } catch (error) {
      const classified = classifyWorkerError(error);
      lastError = classified.reason;
      logger.warn({ err: error, eventId: event.eventId, attempt, retryable: classified.retryable }, "AML worker processing failed");
      if (!classified.retryable || attempt === workerMaxRetries) break;
      await delay(calculateRetryDelay(attempt));
    }
  }

  await writeDeadLetter(event, lastError ?? "AML worker processing failed", workerMaxRetries);
  return { duplicate: false, attempts: workerMaxRetries, deadLettered: true };
}

export async function startAmlWorker() {
  const consumer = await createKafkaConsumer();
  const heartbeat = setInterval(() => {
    void setWorkerHeartbeat(workerId);
  }, 5_000);
  await setWorkerHeartbeat(workerId);

  void consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString()) as TransactionReceivedEvent;
      if (event.eventType !== "transaction.received") {
        logger.warn({ eventType: event.eventType }, "Ignoring unsupported worker event");
        return;
      }
      await processTransactionReceived(event);
    },
  }).catch((error) => {
    logger.error({ err: error }, "AML worker consumer stopped unexpectedly");
  });

  return async () => {
    clearInterval(heartbeat);
    await consumer.disconnect();
  };
}