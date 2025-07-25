# GoPOS - Lightweight Point of Sale System

GoPOS is a very lightweight, full-featured Point of Sale (POS) application built with Go for the backend and Next.js with Tailwind CSS for the frontend. It's designed to be extremely efficient, capable of running on servers with minimal resources (e.g., 1 CPU core, 256MB RAM).

The entire application is self-contained and can be run as a single binary or a minimal Docker container.

## Features

- **Product Management**: Add, update, delete, and view products.
- **Stock Management**: Stock is tracked and updated automatically with each sale.
- **Customer Management**: Keep a record of your customers.
- **Transaction Engine**: A robust sales processing system with cart management.
- **Discount Support**: Create percentage or fixed-amount discounts.
- **Multi-Kasir (User Management)**: Register different users (cashiers/admins).
- **Sales Reporting**: Generate reports on revenue and top-selling products within a date range.
- **Web-based UI**: A clean, simple, and fast frontend that works in any modern browser.

## Tech Stack

- **Backend**: Go
- **Web Router**: Chi
- **Database**: SQLite (embedded, no separate server needed)
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Deployment**: Docker

## Getting Started

### Running Locally

**Prerequisites:**
- Go (version 1.22 or newer) installed.

1.  **Clone the repository** (or ensure you have all the files).
2.  **Run the server:** From the root directory of the project, execute:
    ```bash
    go run ./cmd/server
    ```
    By default, this will create the database file at `./pos.db`.
3.  **Open the application:** Navigate to `http://localhost:8081` in your web browser.

### Running with Next.js Frontend (Development)

For development with the new Next.js frontend:

1.  **Start the Go backend:**
    ```bash
    go run ./cmd/server
    ```
    This will start the API server on `http://localhost:8081`.

2.  **Start the Next.js frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    This will start the frontend development server on `http://localhost:3000`.

3.  **Open the application:** Navigate to `http://localhost:3000` in your web browser.

### Running with Docker (Recommended for Production)

**Prerequisites:**
- Docker installed and running.

1.  **Build the Docker image:**
    ```bash
    docker build -t gopos-nextjs .
    ```

2.  **Run the Docker container:**
    This command runs the app with the new Next.js frontend and creates a named volume for database persistence.

    ```bash
    docker run -d -p 8081:8081 -v gopos-data:/app/data --name gopos gopos-nextjs
    ```

3.  **Open the application:** Navigate to `http://localhost:8081` in your web browser.

The Docker image includes both the Go backend and the Next.js frontend in a single, optimized container. See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed deployment instructions and testing procedures.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method   | Path                      | Description                               |
|----------|---------------------------|-------------------------------------------|
| **Products** | | |
| `GET`    | `/products`               | Get a list of all products with stock.    |
| `POST`   | `/products`               | Create a new product and its stock.       |
| `GET`    | `/products/{id}`          | Get a single product by ID.               |
| `PUT`    | `/products/{id}`          | Update a product's details and stock.     |
| `DELETE` | `/products/{id}`          | Delete a product.                         |
| **Customers** | | |
| `GET`    | `/customers`              | Get all customers.                        |
| `POST`   | `/customers`              | Create a new customer.                    |
| `GET`    | `/customers/{id}`         | Get a single customer by ID.              |
| `PUT`    | `/customers/{id}`         | Update a customer.                        |
| `DELETE` | `/customers/{id}`         | Delete a customer.                        |
| **Discounts** | | |
| `GET`    | `/discounts`              | Get all discounts.                        |
| `POST`   | `/discounts`              | Create a new discount.                    |
| ...      | ...                       | (Full CRUD available)                     |
| **Sales** | | |
| `POST`   | `/sales`                  | Create a new sale (checkout).             |
| `GET`    | `/sales`                  | Get a list of all sales.                  |
| `GET`    | `/sales/{id}`             | Get details of a single sale.             |
| **Users** | | |
| `POST`   | `/users/register`         | Register a new user.                      |
| `GET`    | `/users`                  | Get a list of all users.                  |
| `DELETE` | `/users/{id}`             | Delete a user.                            |
| **Reports** | | |
| `GET`    | `/reports/sales`          | Get a sales report. (Use `?start_date=...&end_date=...`) |