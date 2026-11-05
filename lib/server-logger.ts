import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type LogEntry = Record<string, boolean | number | string | null>;

let log: (message: string, details?: LogEntry) => void;

if (!process.env.NOLOGS) {
  const dirPath =
    process.env.SERVER_LOG_PATH || path.join(process.cwd(), "logs", "server");
  const logPath = path.join(dirPath, `${randomUUID()}.log`);

  await mkdir(path.dirname(logPath), { recursive: true });

  const writer = createWriteStream(logPath, { highWaterMark: 1024 * 1024 });

  log = (message: string, details: LogEntry = {}) => {
    writer.write(`${new Date().toISOString()} [-] ${message} [-] ${JSON.stringify(details)}\n`);
  };

  process.once("beforeExit", () => writer.end());
} else {
  log = (message: string, details: LogEntry = {}) => {
    console.log(
      `${new Date().toISOString()} [-] ${message} [-] ${JSON.stringify(details)}`,
    );
  };
}

export default log;
