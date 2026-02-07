import { Queue } from "bullmq";

let queueInstance: Queue | null = null;

export function getQueueClient(): Queue {
  if (!queueInstance) {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const url = new URL(redisUrl);
    queueInstance = new Queue("pipeline", {
      connection: {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
      },
    });
  }
  return queueInstance;
}
