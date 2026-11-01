import { mkdir } from "node:fs/promises";
import path from "node:path";

type LogEntry = Record<string, boolean | number | string | null>;

let log;

if(!process.env.NOLOGS) {
  const dirPath =
    process.env.SERVER_LOG_PATH || path.join(process.cwd(), "logs", "server");
  const logPath = path.join(dirPath, `${Bun.randomUUIDv7()}.log`);

  await mkdir(path.dirname(logPath), { recursive: true });

  const file = Bun.file(logPath);
  const writer = file.writer({ highWaterMark: 1024 * 1024 });

  log = (message: string, details: LogEntry = {}) => {
    writer.write(
      `${new Date().toISOString()} [-] ${message} [-] ${JSON.stringify(details)}\n`,
    );
  }

  process.once("beforeExit", async () => {
    await writer.flush();
  });
} else {
  log = (message: string, details: LogEntry = {}) => {
    console.log(`${new Date().toISOString()} [-] ${message} [-] ${JSON.stringify(details)}`);
  };
}

export default log;
