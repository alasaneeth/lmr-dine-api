# 🍽️ RMS Backend — Restaurant Management System API

Production-ready **Node.js + Express.js + MySQL** backend that integrates
seamlessly with the React frontend.

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Node.js ≥ 18
- MySQL 8.0
- Redis (optional – needed only for Bull queues)

### 1 — Install & configure
```bash
cd backend
npm install

# Copy and fill in your values
cp .env.example .env
```

Minimum `.env` values to set:
```
DB_HOST=localhost
DB_NAME=rms_db
DB_USER=root
DB_PASS=your_mysql_password
JWT_ACCESS_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<random 64-char string>
```

### 2 — Create the database
```sql
CREATE DATABASE rms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3 — Run migrations + seed demo data
```bash
# Auto-sync in development (server.js does this on startup)
npm run dev

# OR use Sequelize CLI migrations (recommended for production)
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 4 — Start the server
```bash
npm run dev      # Development (nodemon + auto-sync)
npm start        # Production
```

API is live at: `http://localhost:5000/api/v1`

---

## 🐳 Docker Compose (Full Stack)

```bash
cp .env.example .env   # set secrets

docker-compose up -d
# MySQL + Redis + Backend all start together
```

---

## 🔑 Demo Credentials

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@resto.lk         | admin123    |
| Waiter   | waiter@resto.lk        | waiter123   |
| Cashier  | cashier@resto.lk       | cashier123  |
| Customer | customer@resto.lk      | customer123 |

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

**Response Envelope:**
```json
{ "success": true,  "message": "OK", "data": { ... } }
{ "success": false, "error": { "message": "...", "code": "...", "details": [] } }
```

**Paginated List Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Auth `/auth`
| Method | Endpoint         | Auth     | Description              |
|--------|-----------------|----------|--------------------------|
| POST   | /register        | Public   | Register new user        |
| POST   | /login           | Public   | Login → access + refresh |
| POST   | /refresh         | Cookie   | Rotate refresh token     |
| POST   | /logout          | Cookie   | Revoke refresh token     |
| GET    | /me              | Bearer   | Get current user         |
| GET    | /mfa/setup       | Bearer   | Get TOTP QR code         |
| POST   | /mfa/enable      | Bearer   | Activate MFA             |
| POST   | /mfa/disable     | Bearer   | Deactivate MFA           |

### Menu `/menu`
| Method | Endpoint         | Auth            | Description          |
|--------|-----------------|-----------------|----------------------|
| GET    | /               | Public          | List (paginated)     |
| GET    | /:id            | Public          | Get one              |
| POST   | /               | Admin           | Create (multipart)   |
| PUT    | /:id            | Admin           | Update (multipart)   |
| DELETE | /:id            | Admin           | Soft-delete          |
| PATCH  | /:id/stock      | Admin, Waiter   | Adjust stock qty     |

### Orders `/orders`
| Method | Endpoint          | Auth                     | Description       |
|--------|------------------|--------------------------|-------------------|
| GET    | /                | Admin, Waiter, Cashier   | All orders        |
| GET    | /my              | Customer, Admin          | My orders         |
| GET    | /:id             | All roles                | Order detail      |
| POST   | /                | All roles                | Place order       |
| PATCH  | /:id/advance     | Admin, Waiter            | Advance status    |
| PATCH  | /:id/cancel      | Admin, Waiter, Customer  | Cancel order      |

**Order Status Flow:**
```
pending → preparing → ready → served → paid
```

### Invoices `/invoices`
| Method | Endpoint         | Auth           | Description      |
|--------|-----------------|----------------|------------------|
| GET    | /               | Admin, Cashier | List             |
| GET    | /sales-report   | Admin, Cashier | Sales by date    |
| GET    | /:id            | Admin, Cashier | Invoice detail   |
| POST   | /               | Admin, Cashier | Create invoice   |
| PATCH  | /:id/pay        | Admin, Cashier | Mark paid        |

### Stock `/stock`
| Method | Endpoint         | Auth           | Description      |
|--------|-----------------|----------------|------------------|
| GET    | /               | Admin, Waiter  | List             |
| GET    | /low            | Admin, Waiter  | Low stock alert  |
| GET    | /:id            | Admin, Waiter  | Get one          |
| POST   | /               | Admin, Waiter  | Add stock item   |
| PUT    | /:id            | Admin, Waiter  | Update           |
| PATCH  | /:id/adjust     | Admin, Waiter  | Adjust quantity  |
| DELETE | /:id            | Admin          | Soft-delete      |

### Users `/users`
| Method | Endpoint         | Auth  | Description  |
|--------|-----------------|-------|--------------|
| GET    | /               | Admin | List         |
| GET    | /:id            | Admin | Get one      |
| PUT    | /:id            | Admin | Update       |
| PATCH  | /:id/status     | Admin | Set status   |
| DELETE | /:id            | Admin | Soft-delete  |

### Dashboard `/dashboard`
| Method | Endpoint       | Auth           | Description    |
|--------|---------------|----------------|----------------|
| GET    | /stats        | Admin, Cashier | KPI stats      |
| GET    | /weekly-sales | Admin, Cashier | Weekly chart   |

### Customers `/customers`
| Method | Endpoint                    | Auth           | Description          |
|--------|-----------------------------|----------------|----------------------|
| GET    | /                           | Admin, Cashier | List                 |
| GET    | /reports/sales              | Admin, Cashier | Sales report         |
| GET    | /reports/credit             | Admin, Cashier | Credit report        |
| GET    | /reports/summary            | Admin, Cashier | Summary stats        |
| GET    | /:id                        | Admin, Cashier | Get one              |
| GET    | /:id/reports/sales          | Admin, Cashier | Customer sales       |
| GET    | /:id/reports/credit         | Admin, Cashier | Customer credit      |
| POST   | /                           | Admin, Cashier | Create               |
| PUT    | /:id                        | Admin, Cashier | Update               |
| PATCH  | /:id/status                 | Admin          | Set status           |
| DELETE | /:id                        | Admin          | Soft-delete          |

---

## 🔌 WebSocket Events (Socket.io)

**Connection:** `ws://localhost:5000`
```js
io({ auth: { token: accessToken } })
```

| Event            | Direction      | Payload                                      |
|------------------|---------------|----------------------------------------------|
| `order:new`      | Server → Client | `{ orderId, orderNumber, tableNumber, status }` |
| `order:updated`  | Server → Client | `{ orderId, status }`                         |
| `notification`   | Server → Client | `{ type, message, orderId? }`                 |
| `order:subscribe`| Client → Server | `orderId`                                     |

---

## 🏗️ Architecture

```
src/
├── config/         ← env, database, sequelize-cli
├── models/         ← 9 Sequelize models + associations
├── repositories/   ← DB access layer (Repository Pattern)
├── services/       ← Business logic layer
├── controllers/    ← HTTP req/res only
├── routes/         ← Express routers
├── middlewares/    ← auth, error, validate, upload, logger
├── validators/     ← express-validator rule sets
├── socket/         ← Socket.io server + JWT auth
├── utils/          ← logger, jwt, password, response, pagination
└── errors/         ← AppError class
```

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

---

## 🔐 Security Checklist

- ✅ bcrypt password hashing (rounds: 12)
- ✅ JWT access tokens (15m expiry)
- ✅ Refresh token rotation with family-based revocation
- ✅ httpOnly cookie for refresh token
- ✅ RBAC on every endpoint
- ✅ Helmet security headers
- ✅ CORS whitelist
- ✅ Rate limiting (global + stricter on /login)
- ✅ Input validation via express-validator
- ✅ SQL injection protection via Sequelize ORM
- ✅ MFA (TOTP) support — design complete, enable per user
- ✅ Audit log for all mutations
- ✅ Graceful shutdown
