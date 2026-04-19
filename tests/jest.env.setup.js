/**
 * jest.env.setup.js
 * Loaded by jest via `setupFiles` – runs BEFORE any module is required.
 * This satisfies env.js validation so tests don't fail on startup.
 */
process.env.NODE_ENV          = 'test';
process.env.DB_HOST           = 'localhost';
process.env.DB_PORT           = '3306';
process.env.DB_NAME           = 'rms_test';
process.env.DB_USER           = 'root';
process.env.DB_PASS           = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-characters-long!!';
process.env.JWT_REFRESH_SECRET= 'test-refresh-secret-at-least-32-characters-long!';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES= '7d';
process.env.CORS_ORIGINS      = 'http://localhost:5173';
process.env.BCRYPT_ROUNDS     = '4';   // fast for tests
process.env.LOG_LEVEL         = 'silent';
process.env.UPLOAD_DIR        = 'uploads';
