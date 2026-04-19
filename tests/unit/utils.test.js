'use strict';
const { paginate } = require('../../src/utils/pagination');

describe('paginate()', () => {
  it('returns defaults for empty query', () => {
    const r = paginate({});
    expect(r).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  it('calculates offset correctly', () => {
    const r = paginate({ page: '3', limit: '20' });
    expect(r.offset).toBe(40);
    expect(r.page).toBe(3);
    expect(r.limit).toBe(20);
  });

  it('clamps limit to 100', () => {
    const r = paginate({ limit: '999' });
    expect(r.limit).toBe(100);
  });

  it('clamps page to 1 for invalid input', () => {
    const r = paginate({ page: '-5' });
    expect(r.page).toBe(1);
  });
});

// ── Response helpers ──────────────────────────────────────────────────────────
describe('response helpers', () => {
  const mockRes = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json   = jest.fn().mockReturnValue(r);
    r.send   = jest.fn().mockReturnValue(r);
    return r;
  };

  const { success, created, noContent, paginated, error } = require('../../src/utils/response');

  it('success sends 200 with envelope', () => {
    const res = mockRes();
    success(res, { id: 1 }, 'OK');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: 1 } }));
  });

  it('created sends 201', () => {
    const res = mockRes();
    created(res, { id: 2 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('noContent sends 204', () => {
    const res = mockRes();
    noContent(res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('paginated includes total and totalPages', () => {
    const res = mockRes();
    paginated(res, [1, 2], 50, 1, 10);
    const call = res.json.mock.calls[0][0];
    expect(call.data.total).toBe(50);
    expect(call.data.totalPages).toBe(5);
  });

  it('error sends correct statusCode and code', () => {
    const res = mockRes();
    error(res, 'Not found', 404, 'NOT_FOUND');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'NOT_FOUND' }),
    }));
  });
});
