let calls = 0;

module.exports = {
  getRandomBytes: (count) => {
    const offset = 13 * calls++;
    return Uint8Array.from({ length: count }, (_, i) => (i * 7 + offset) % 256);
  },
};
