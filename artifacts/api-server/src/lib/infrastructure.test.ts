import test from "node:test";
import assert from "node:assert/strict";
import { cacheAside } from "./redisCache";
import {
  calculateRetryDelay,
  classifyWorkerError,
} from "./amlWorker";
import {
  createTransactionReceivedEvent,
  eventTopics,
} from "./eventBus";

test("transaction events preserve stable identity and correlation", () => {
  const event = createTransactionReceivedEvent({
    transactionId: "transaction-1",
    eventId: "event-1",
    idempotencyKey: "synthetic-1",
    senderId: "sender-1",
    receiverId: "receiver-1",
    amount: 9000,
    currency: "INR",
    timestamp: "2026-09-16T00:00:00.000Z",
    status: "flagged",
    source: "synthetic-simulator",
    channel: "realtime-simulator",
    transactionType: "structuring-simulation",
  });

  assert.equal(event.eventId, "event-1");
  assert.equal(event.correlationId, "transaction-1");
  assert.equal(event.eventType, "transaction.received");
  assert.equal(eventTopics.transactionReceived, "transaction.received");
  assert.equal(event.payload.idempotencyKey, "synthetic-1");
});

test("worker retries transient errors with bounded exponential backoff", () => {
  assert.deepEqual(classifyWorkerError(new Error("database connection reset")), {
    reason: "database connection reset",
    retryable: true,
  });
  assert.deepEqual(classifyWorkerError(new Error("malformed event payload")), {
    reason: "malformed event payload",
    retryable: false,
  });
  assert.equal(calculateRetryDelay(1), 250);
  assert.equal(calculateRetryDelay(2), 500);
  assert.equal(calculateRetryDelay(3), 1000);
  assert.equal(calculateRetryDelay(99), 30_000);
});

test("Redis cache adapter falls back to the loader when Redis is not configured", async () => {
  let loads = 0;
  const result = await cacheAside("test:dashboard", 30, async () => {
    loads += 1;
    return { total: 42 };
  });
  assert.deepEqual(result, { total: 42 });
  assert.equal(loads, 1);
});