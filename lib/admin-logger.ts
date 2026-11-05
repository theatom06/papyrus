import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

type LogEntry = Record<string, boolean | number | string | null>;

let log: (message: string, details?: LogEntry) => void;

if (!process.env.NOLOGS) {
  console.log(
    "Admin logs are enabled. Logs will be written to the logs/admin directory.",
  );
  const dirPath =
    process.env.ADMIN_LOG_PATH || path.join(process.cwd(), "logs", "admin");
  const logPath = path.join(dirPath, `${randomUUID()}.log`);

  await mkdir(path.dirname(logPath), { recursive: true });

  const writer = createWriteStream(logPath, { highWaterMark: 1024 * 1024 });

  log = (message: string, details: LogEntry = {}) => {
    writer.write(`${new Date().toISOString()} [-] ${message} [-] ${JSON.stringify(details)}\n`);
  };

  process.once("beforeExit", () => writer.end());
} else {
  console.log("Admin logs are disabled. Logs will be written to the console.");
  log = (message: string, details: LogEntry = {}) => {
    console.log(
      `${new Date().toISOString()} [-] ${message} [-] ${JSON.stringify(details)}`,
    );
  };
}

export default log;
