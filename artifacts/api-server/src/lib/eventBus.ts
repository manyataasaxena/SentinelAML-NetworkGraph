import { Kafka, logLevel, type Consumer, type Producer } from "kafkajs";
import { logger } from "./logger";

export const eventTopics = {
  transactionReceived: "transaction.received",
  transactionProcessed: "transaction.processed",
  riskCalculated: "risk.calculated",
  alertCreated: "alert.created",
  graphUpdated: "graph.updated",
} as const;

export type EventTopic = (typeof eventTopics)[keyof typeof eventTopics];

export interface TransactionReceivedPayload {
  transactionId: string;
  eventId: string;
  idempotencyKey: string;
  senderId: string;
  receiverId: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: string;
  source: string;
  channel: string;
  transactionType: string;
}

export interface TransactionReceivedEvent {
  version: 1;
  eventId: string;
  eventType: "transaction.received";
  occurredAt: string;
  correlationId: string;
  payload: TransactionReceivedPayload;
}

export interface DownstreamEvent {
  version: 1;
  eventId: string;
  eventType: "transaction.processed" | "risk.calculated" | "alert.created" | "graph.updated";
  occurredAt: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export type SentinelEvent = TransactionReceivedEvent | DownstreamEvent;

const rawBrokers = process.env.KAFKA_BROKERS?.trim() ?? "";
export const kafkaBrokers = rawBrokers
  ? rawBrokers.split(",").map((broker) => broker.trim()).filter(Boolean)
  : [];
export const kafkaConfigured = kafkaBrokers.length > 0;

const kafkaClient = kafkaConfigured
  ? new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? "sentinelaml-api",
      brokers: kafkaBrokers,
      logLevel: logLevel.NOTHING,
    })
  : null;

let producer: Producer | null = null;
let producerPromise: Promise<Producer> | null = null;
let producerConnected = false;

function requireKafka() {
  if (!kafkaClient) {
    throw new Error("Kafka is not configured. Set KAFKA_BROKERS before enabling async processing.");
  }
  return kafkaClient;
}

export function createTransactionReceivedEvent(
  payload: TransactionReceivedPayload,
): TransactionReceivedEvent {
  return {
    version: 1,
    eventId: payload.eventId,
    eventType: "transaction.received",
    occurredAt: new Date().toISOString(),
    correlationId: payload.transactionId,
    payload,
  };
}

export async function connectKafkaProducer(): Promise<Producer> {
  if (producer) return producer;
  if (!producerPromise) {
    producerPromise = (async () => {
      const client = requireKafka();
      const nextProducer = client.producer();
      await nextProducer.connect();
      producer = nextProducer;
      producerConnected = true;
      logger.info({ brokers: kafkaBrokers }, "Kafka producer connected");
      return nextProducer;
    })().catch((error) => {
      producerPromise = null;
      producerConnected = false;
      logger.error({ err: error }, "Kafka producer connection failed");
      throw error;
    });
  }
  return producerPromise;
}

export async function publishEvent(topic: EventTopic, event: SentinelEvent) {
  const nextProducer = await connectKafkaProducer();
  await nextProducer.send({
    topic,
    messages: [{ key: event.correlationId, value: JSON.stringify(event) }],
  });
  logger.info({ eventId: event.eventId, eventType: event.eventType, topic }, "Event published");
}

export async function createKafkaConsumer(groupId = process.env.KAFKA_GROUP_ID ?? "sentinelaml-aml-worker"): Promise<Consumer> {
  const client = requireKafka();
  const consumer = client.consumer({ groupId });
  await consumer.connect();
  await consumer.subscribe({ topic: eventTopics.transactionReceived, fromBeginning: false });
  logger.info({ groupId, topic: eventTopics.transactionReceived }, "Kafka consumer connected");
  return consumer;
}

export async function disconnectKafka() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    producerPromise = null;
    producerConnected = false;
  }
}

export function getKafkaHealth() {
  return {
    configured: kafkaConfigured,
    connected: producerConnected,
    brokers: kafkaBrokers.length,
  };
}