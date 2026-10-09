const mockInit = jest.fn();
const mockSetTags = jest.fn();
const mockCaptureException = jest.fn();

jest.mock('@sentry/react-native', () => ({
  init: (options: unknown) => mockInit(options),
  setTags: (tags: unknown) => mockSetTags(tags),
  captureException: (error: unknown, hint: unknown) => mockCaptureException(error, hint),
}));
jest.mock('expo-updates', () => ({ updateId: null, channel: 'production', runtimeVersion: '1.0.18' }));

import * as stub from '../crashReporting';

type Native = typeof stub;
type InitOptions = {
  dsn?: string;
  enabled: boolean;
  sendDefaultPii: boolean;
  tracesSampleRate: number;
  beforeBreadcrumb: (crumb: { category?: string; message?: string }) => unknown;
};

const globals = globalThis as { __DEV__?: boolean };
const originalDev = globals.__DEV__;
const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

function loadNative({ dev, dsn }: { dev: boolean; dsn?: string }): Native {
  globals.__DEV__ = dev;
  if (dsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  else process.env.EXPO_PUBLIC_SENTRY_DSN = dsn;
  let loaded!: Native;
  jest.isolateModules(() => {
    loaded = require('../crashReporting.native');
  });
  return loaded;
}

const initOptions = () => mockInit.mock.calls[0][0] as InitOptions;

describe('crash reporting', () => {
  beforeEach(() => jest.clearAllMocks());
  afterAll(() => {
    globals.__DEV__ = originalDev;
    if (originalDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    else process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it('1 the web and Jest implementation reports nothing', () => {
    expect(stub.crashReportingEnabled).toBe(false);
    expect(() => stub.captureException(new Error('x'), { scope: 'render' })).not.toThrow();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('2 is off without a DSN, even in a release build', () => {
    const native = loadNative({ dev: false });
    expect(native.crashReportingEnabled).toBe(false);
    expect(initOptions().enabled).toBe(false);
    native.captureException(new Error('x'));
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('3 is off in development, even with a DSN', () => {
    const native = loadNative({ dev: true, dsn: 'https://key@example.invalid/1' });
    expect(native.crashReportingEnabled).toBe(false);
    native.captureException(new Error('x'));
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('4 is on in a release build with a DSN, and tags the scope', () => {
    const native = loadNative({ dev: false, dsn: 'https://key@example.invalid/1' });
    const error = new Error('boom');
    expect(native.crashReportingEnabled).toBe(true);
    expect(initOptions()).toMatchObject({ dsn: 'https://key@example.invalid/1', enabled: true });
    native.captureException(error, { scope: 'schedule' });
    native.captureException(error);
    expect(mockCaptureException.mock.calls).toEqual([
      [error, { tags: { scope: 'schedule' } }],
      [error, undefined],
    ]);
  });

  it('5 sends no PII, no traces, and drops touch and console breadcrumbs', () => {
    loadNative({ dev: false, dsn: 'https://key@example.invalid/1' });
    const { sendDefaultPii, tracesSampleRate, beforeBreadcrumb } = initOptions();
    expect(sendDefaultPii).toBe(false);
    expect(tracesSampleRate).toBe(0);
    expect(beforeBreadcrumb({ category: 'touch' })).toBeNull();
    expect(beforeBreadcrumb({ category: 'console' })).toBeNull();
    const navigation = { category: 'navigation' };
    expect(beforeBreadcrumb(navigation)).toBe(navigation);
  });

  it('6 tags every event with the running update', () => {
    loadNative({ dev: false });
    expect(mockSetTags).toHaveBeenCalledWith({ updateId: 'embedded', channel: 'production', runtimeVersion: '1.0.18' });
  });
});
