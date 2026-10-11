# Honda Center Project

Business management system (ERP + POS) for a genuine Honda spare parts dealership. It covers sales, inventory, purchasing, returns, loans and reporting in one web application.

Stack: React (Vite) frontend, Node.js/Express backend, MySQL database.

## Features

- **Point of Sale (POS):** cart with persistence, hold sale, print preview, keyboard shortcuts
- **Inventory:** parts catalog, stock levels, low stock alerts
- **Purchases and suppliers:** supplier orders, stock receiving, ledger, PDF download (pdfkit)
- **Returns management:** approve/reject workflow using stored procedures, conditional restocking
- **Loans (udhaar):** payment history, due dates, overdue indicators
- **Dashboard:** net cash, gross / realized / net profit, pending profit, expense breakdown, low stock alerts

## Project Structure

```
Project1/
├── backend/        Express API, MySQL queries, PDF generation
├── frontend/       React (Vite) application
├── package.json    Root scripts (runs frontend + backend together)
└── start.bat       Windows shortcut to start the project
```

## Requirements

- Node.js 18 or higher
- MySQL 8 or higher
- npm

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/farazwarna/Honda-Center-Project.git
cd Honda-Center-Project
```

### 2. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Create the database

Create an empty MySQL database, then import the SQL dump (tables and stored procedures):

```bash
mysql -u root -p -e "CREATE DATABASE honda_center;"
mysql -u root -p honda_center < database.sql
```

Replace `database.sql` with the name of your exported SQL file.

### 4. Configure environment variables

Create `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=honda_center
NODE_ENV=development
```

Never commit `.env` to Git.

### 5. Run in development

From the project root (runs both servers with `concurrently`):

```bash
npm start
```

Or separately:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

On Windows you can also double-click `start.bat`.

## Production Build

```bash
cd frontend
npm run build
```

Copy the generated `dist` folder into `backend/build`. The Express server serves the React files and the API from the same app:

```js
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
```

Use relative API URLs in the frontend (`/api/...`) so it works on the live domain.

## Deployment (Hostinger)

1. Push the code to GitHub (`node_modules` and `.env` must be in `.gitignore`).
2. hPanel: Websites, Add Website, Node.js Apps, Import Git Repository.
3. Settings:
   - Root directory: `backend`
   - Entry file: `server.js`
   - Node version: 20
   - Install command: `npm install`
4. Add the environment variables from the section above, using the Hostinger MySQL credentials.
5. Create the database in hPanel (MySQL Databases) and import the SQL file through phpMyAdmin.
6. Deploy and check the logs for errors.

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| root | `npm start` | Run frontend and backend together |
| backend | `npm run dev` | Start API with nodemon |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Production build |

Adjust this table if your `package.json` scripts have different names.

## Author

Faraz Ramzan
Email: faraz777.fb@gmail.com
