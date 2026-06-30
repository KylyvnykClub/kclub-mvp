import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test';

function createBaseLogger(): pino.Logger {
  if (isTest) {
    return pino({ enabled: false });
  }

  if (isProduction) {
    return pino({
      level: process.env.LOG_LEVEL || 'info',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label };
        },
      },
    });
  }

  return pino({
    level: process.env.LOG_LEVEL || 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  });
}

let baseLogger: pino.Logger | null = null;

function getBaseLogger(): pino.Logger {
  if (!baseLogger) {
    baseLogger = createBaseLogger();
  }
  return baseLogger;
}

export type AdminLogger = {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  debug(msg: string, data?: Record<string, unknown>): void;

  auth(msg: string, data?: Record<string, unknown>): void;
  proxy(msg: string, data?: Record<string, unknown>): void;
};

export function createLogger(): AdminLogger {
  const logger = getBaseLogger();

  function log(
    level: 'info' | 'warn' | 'error' | 'debug',
    msg: string,
    data?: Record<string, unknown>,
  ): void {
    if (data && Object.keys(data).length > 0) {
      logger[level]({ data }, msg);
    } else {
      logger[level](msg);
    }
  }

  return {
    info(msg, data) {
      log('info', msg, data);
    },
    warn(msg, data) {
      log('warn', msg, data);
    },
    error(msg, data) {
      log('error', msg, data);
    },
    debug(msg, data) {
      log('debug', msg, data);
    },

    auth(msg, data) {
      log('warn', msg, { ...data, domain: 'auth' });
    },
    proxy(msg, data) {
      log('error', msg, { ...data, domain: 'proxy' });
    },
  };
}
