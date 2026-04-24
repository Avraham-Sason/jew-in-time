import type {
  createJSONStorage as CreateJSONStorageFn,
  persist as PersistFn,
} from 'zustand/middleware';

const middleware = require('../../node_modules/zustand/middleware.js') as typeof import('zustand/middleware');
export const persist: typeof PersistFn = middleware.persist;
export const createJSONStorage: typeof CreateJSONStorageFn = middleware.createJSONStorage;
