import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss" },
    },
  }),
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization"],
    censor: "[REDACTED]",
  },
});

export function logSessionEvent(
  event: string,
  data?: Record<string, unknown>
) {
  logger.info({ event, ...data }, `[session] ${event}`);
}

export function logAIError(
  operation: string,
  error: unknown,
  sessionId?: string
) {
  logger.error(
    { operation, error: String(error), sessionId },
    `[ai] ${operation} failed`
  );
}

export function logCrisis(sessionId: string, level: string) {
  logger.warn({ sessionId, crisisLevel: level }, "[crisis] detected");
}
