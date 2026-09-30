import { startAmlWorker } from "./lib/amlWorker";
import { closeRedis } from "./lib/redisCache";
import { disconnectKafka } from "./lib/eventBus";
import { logger } from "./lib/logger";

let stopWorker: (() => Promise<void>) | undefined;
let stopping = false;

async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, "Stopping AML worker");
  if (stopWorker) await stopWorker();
  await disconnectKafka();
  await closeRedis();
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

startAmlWorker()
  .then((stop) => {
    stopWorker = stop;
    logger.info("AML worker is ready");
  })
  .catch((error) => {
    logger.error({ err: error }, "AML worker failed to start");
    process.exitCode = 1;
  });