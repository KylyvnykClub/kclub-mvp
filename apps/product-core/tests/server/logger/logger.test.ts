import { describe, expect, test } from 'vitest';

import { createLogger } from '@/server/logger/logger';

describe('createLogger', () => {
  test('returns a logger object with all expected methods', () => {
    const log = createLogger();
    expect(log.info).toBeTypeOf('function');
    expect(log.warn).toBeTypeOf('function');
    expect(log.error).toBeTypeOf('function');
    expect(log.debug).toBeTypeOf('function');
    expect(log.auth).toBeTypeOf('function');
    expect(log.webhook).toBeTypeOf('function');
    expect(log.cron).toBeTypeOf('function');
    expect(log.admin).toBeTypeOf('function');
  });

  test('domain methods do not throw', () => {
    const log = createLogger();
    expect(() => log.auth('test auth message')).not.toThrow();
    expect(() => log.webhook('test webhook message')).not.toThrow();
    expect(() => log.cron('test cron message')).not.toThrow();
    expect(() => log.admin('test admin message')).not.toThrow();
  });

  test('info, warn, error, debug do not throw', () => {
    const log = createLogger();
    expect(() => log.info('test info')).not.toThrow();
    expect(() => log.warn('test warn')).not.toThrow();
    expect(() => log.error('test error')).not.toThrow();
    expect(() => log.debug('test debug')).not.toThrow();
  });

  test('accepts optional data parameter', () => {
    const log = createLogger();
    expect(() => log.info('test', { key: 'value' })).not.toThrow();
    expect(() => log.error('test error', { error: new Error('test') })).not.toThrow();
    expect(() => log.auth('test auth', { staffId: '123' })).not.toThrow();
  });

  test('createLogger with context does not throw', () => {
    const context = {
      actor: null,
      locale: null as 'en' | 'ru' | 'uk' | null,
      requestId: 'test-request-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };
    const log = createLogger(context);
    expect(() => log.info('test with context')).not.toThrow();
  });
});
