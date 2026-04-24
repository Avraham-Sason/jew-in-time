jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

import { StorageService, createZustandStorage } from '../StorageService';

describe('StorageService edge cases', () => {
  beforeEach(() => StorageService.clear());

  it('5.1 get on missing key → undefined', () => {
    expect(StorageService.get('not-set')).toBeUndefined();
  });

  it('5.1 corrupted JSON → undefined (no throw)', () => {
    // Write raw garbage by going through the underlying storage.
    const { storage } = require('../StorageService');
    storage.set('bad', '{not json');
    expect(StorageService.get('bad')).toBeUndefined();
  });

  it('5.1 roundtrip primitive', () => {
    StorageService.set('num', 42);
    expect(StorageService.get<number>('num')).toBe(42);
  });

  it('5.1 roundtrip nested object', () => {
    const obj = { a: { b: [1, 2, { c: 'x' }] } };
    StorageService.set('nest', obj);
    expect(StorageService.get('nest')).toEqual(obj);
  });

  it('5.1 delete removes key', () => {
    StorageService.set('k', 'v');
    StorageService.delete('k');
    expect(StorageService.get('k')).toBeUndefined();
  });

  it('5.1 createZustandStorage roundtrip', () => {
    const s = createZustandStorage();
    s.setItem('z', 'value');
    expect(s.getItem('z')).toBe('value');
    s.removeItem('z');
    expect(s.getItem('z')).toBeNull();
  });
});
