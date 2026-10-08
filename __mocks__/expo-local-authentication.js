const defaults = { hardware: true, enrolled: true, success: true, gate: undefined };
const state = { ...defaults };

const read = (value) => {
  if (value instanceof Error) throw value;
  return value;
};

module.exports = {
  hasHardwareAsync: jest.fn(async () => read(state.hardware)),
  isEnrolledAsync: jest.fn(async () => read(state.enrolled)),
  authenticateAsync: jest.fn(async () => {
    await state.gate;
    return { success: read(state.success) };
  }),
  __set: (next) => Object.assign(state, next),
  __reset: () => Object.assign(state, defaults),
};
