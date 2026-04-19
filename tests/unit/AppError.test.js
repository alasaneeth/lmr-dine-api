'use strict';
const AppError = require('../../src/errors/AppError');

describe('AppError', () => {
  it('constructs with correct properties', () => {
    const e = new AppError('Test error', 400, 'BAD_REQUEST', [{ field: 'email' }]);
    expect(e.message).toBe('Test error');
    expect(e.statusCode).toBe(400);
    expect(e.code).toBe('BAD_REQUEST');
    expect(e.details).toHaveLength(1);
    expect(e instanceof Error).toBe(true);
  });

  it('static helpers return correct status codes', () => {
    expect(AppError.badRequest('x').statusCode).toBe(400);
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.forbidden().statusCode).toBe(403);
    expect(AppError.notFound().statusCode).toBe(404);
    expect(AppError.conflict('x').statusCode).toBe(409);
    expect(AppError.tooMany().statusCode).toBe(429);
  });
});
