# Prerna Silks - Saree E-Commerce Website

Full-stack React + Express + MySQL saree shopping website with admin dashboard.

## Tech Stack
- **Frontend:** React.js (Vite), React Router, Axios, Bootstrap
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Auth:** JWT + bcrypt

## Prerequisites
- Node.js v16+
- MySQL (via XAMPP or MySQL Workbench)

## Setup Instructions

### Step 1: Create the Database
1. Start MySQL (open XAMPP → Start MySQL, or start MySQL Workbench)
2. Open the SQL file `server/db/schema.sql`
3. Run it in MySQL Workbench or phpMyAdmin
   - This creates the `prerna_silks` database, all tables, and seed data

### Step 2: Configure Backend
1. Open `server/.env` and set your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=        (your MySQL password, blank for XAMPP)
   DB_NAME=prerna_silks
   ```

### Step 3: Install & Start Backend
```bash
cd server
npm install
npm run dev
```
Server runs on http://localhost:5000

### Step 4: Install & Start Frontend
```bash
cd client
npm install
npm run dev
```
React app runs on http://localhost:3000

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@prernasilks.com | admin123 |
| Customer | priya@example.com | customer123 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/products | Get products (with filters) |
| GET | /api/products/:id | Get product detail |
| POST | /api/products | Add product (admin) |
| PUT | /api/products/:id | Edit product (admin) |
| DELETE | /api/products/:id | Delete product (admin) |
| GET | /api/cart | Get cart |
| POST | /api/cart/add | Add to cart |
| POST | /api/wishlist/add | Toggle wishlist |
| POST | /api/orders | Place order |
| GET | /api/orders | Get orders |
| PUT | /api/orders/:id | Update status (admin) |
| POST | /api/feedback | Submit feedback |
| POST | /api/comments | Add comment |
| GET | /api/comments/:productId | Get comments |
| GET | /api/admin/dashboard | Dashboard stats |
| CRUD | /api/suppliers | Manage suppliers |
| CRUD | /api/expenses | Track expenses |

## Postman Testing

1. **Login:** POST `http://localhost:5000/api/auth/login`
   Body: `{"email":"admin@prernasilks.com","password":"admin123"}`
2. Copy `token` from response
3. Add header: `Authorization: Bearer <token>`
4. Test protected routes

## Features

### Customer
- Product browsing with 6 sidebar filters
- Search, sort, product detail with saree/blouse specs
- Cart, wishlist, order placement
- Comments/reviews, feedback popup
- Responsive design

### Admin (Manual Data Entry)
- Dashboard with stats & charts
- Product CRUD with full saree/blouse detail forms
- Order management with status updates
- Supplier CRUD, expense tracking
- Reports (revenue, expenses, profit, GST)
- Customer listing, feedback viewer
