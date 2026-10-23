import { mkdir } from "node:fs/promises";
import path from "node:path";

type LogEntry = Record<string, boolean | number | string | null>;

const dirPath =
  process.env.SERVER_LOG_PATH || path.join(process.cwd(), "logs", "server");
const logPath = path.join(dirPath, `${Bun.randomUUIDv7()}.log`);

await mkdir(path.dirname(logPath), { recursive: true });

const file = Bun.file(logPath);
const writer = file.writer({ highWaterMark: 1024 * 1024 });

export default async function log(message: string, details: LogEntry = {}) {
  const entry = JSON.stringify({
    ...details,
    timestamp: new Date().toISOString(),
    message,
  });

  writer.write(`${entry}\n`);
}

process.once("beforeExit", async () => {
  await writer.flush();
});
