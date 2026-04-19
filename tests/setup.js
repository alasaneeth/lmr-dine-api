'use strict';
// Prevent real DB connections during unit tests
jest.mock('../src/config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(),
    sync:         jest.fn().mockResolvedValue(),
    transaction:  jest.fn().mockImplementation(async (cb) => {
      if (cb) return cb({ commit: jest.fn(), rollback: jest.fn() });
    }),
    close: jest.fn().mockResolvedValue(),
  },
  connectDB: jest.fn().mockResolvedValue(),
}));
