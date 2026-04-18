// tests/unit/utils.test.js
'use strict';

// ── Error classes ─────────────────────────────────────────────────────────────
const {
  AppError, ValidationError, AuthenticationError,
  AuthorizationError, NotFoundError, ConflictError,
} = require('../../src/utils/errors');

describe('Custom error classes', () => {
  it('AppError sets statusCode and isOperational', () => {
    const e = new AppError('something failed', 500, 'ERR');
    expect(e.statusCode).toBe(500);
    expect(e.isOperational).toBe(true);
    expect(e.message).toBe('something failed');
  });

  it('ValidationError has 422 status and errors array', () => {
    const errors = [{ field: 'email', message: 'required' }];
    const e = new ValidationError('bad input', errors);
    expect(e.statusCode).toBe(422);
    expect(e.errors).toEqual(errors);
  });

  it('AuthenticationError defaults to 401', () => {
    expect(new AuthenticationError().statusCode).toBe(401);
  });

  it('NotFoundError includes resource name', () => {
    const e = new NotFoundError('Order');
    expect(e.message).toContain('Order');
    expect(e.statusCode).toBe(404);
  });
});

// ── Response helpers ──────────────────────────────────────────────────────────
const R = require('../../src/utils/response');

describe('Response helpers', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    res.send   = jest.fn().mockReturnValue(res);
    return res;
  };

  it('success sends 200 with success:true', () => {
    const res = mockRes();
    R.success(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('created sends 201', () => {
    const res = mockRes();
    R.created(res, { id: 2 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('error sends correct code and message', () => {
    const res = mockRes();
    R.error(res, 'not found', 404, 'NOT_FOUND');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'not found' },
    });
  });

  it('paginationMeta computes totalPages and flags correctly', () => {
    const meta = R.paginationMeta(45, 2, 10);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });
});

// ── Validators ────────────────────────────────────────────────────────────────
const { authSchemas, orderSchemas, menuSchemas } = require('../../src/validators/validators');

describe('Joi validators', () => {
  describe('authSchemas.login', () => {
    it('passes valid credentials', () => {
      const { error } = authSchemas.login.validate({ email: 'a@b.com', password: 'secret' });
      expect(error).toBeUndefined();
    });

    it('fails on invalid email', () => {
      const { error } = authSchemas.login.validate({ email: 'not-an-email', password: 'x' });
      expect(error).toBeDefined();
    });

    it('fails when password missing', () => {
      const { error } = authSchemas.login.validate({ email: 'a@b.com' });
      expect(error).toBeDefined();
    });
  });

  describe('orderSchemas.create', () => {
    it('passes valid order', () => {
      const { error } = orderSchemas.create.validate({
        tableNo: 'Table 01',
        items: [{ menuItemId: 'aaaaaaaa-0000-0000-0000-000000000000', qty: 2 }],
      });
      expect(error).toBeUndefined();
    });

    it('fails when items array is empty', () => {
      const { error } = orderSchemas.create.validate({ tableNo: 'T1', items: [] });
      expect(error).toBeDefined();
    });
  });
});

// ── Pagination helper ─────────────────────────────────────────────────────────
const { parsePagination } = require('../../src/utils/pagination');

describe('parsePagination', () => {
  it('returns defaults for empty query', () => {
    const { page, limit, offset } = parsePagination({});
    expect(page).toBe(1);
    expect(limit).toBe(20);
    expect(offset).toBe(0);
  });

  it('clamps limit to 100', () => {
    const { limit } = parsePagination({ limit: '999' });
    expect(limit).toBe(100);
  });

  it('calculates offset correctly', () => {
    const { offset } = parsePagination({ page: '3', limit: '10' });
    expect(offset).toBe(20);
  });
});
