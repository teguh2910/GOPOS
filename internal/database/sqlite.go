package database

import (
	"database/sql"
	_ "modernc.org/sqlite" // Pure Go SQLite driver
	"log"
)

// InitDB initializes the database connection and creates tables if they don't exist.
func InitDB(dataSourceName string) *sql.DB {
	db, err := sql.Open("sqlite", dataSourceName)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	createTables(db)
	return db
}

// createTables creates the necessary tables in the database based on the full schema.
func createTables(db *sql.DB) {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'cashier',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS customers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone_number TEXT UNIQUE,
			email TEXT UNIQUE,
			address TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sku TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			description TEXT,
			price REAL NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS inventory (
			product_id INTEGER NOT NULL,
			quantity INTEGER NOT NULL DEFAULT 0,
			last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (product_id) REFERENCES products(id)
		);`,
		`CREATE TABLE IF NOT EXISTS discounts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			code TEXT NOT NULL UNIQUE,
			description TEXT,
			discount_type TEXT NOT NULL,
			value REAL NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			valid_from DATETIME,
			valid_until DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS sales (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			customer_id INTEGER,
			total_amount REAL NOT NULL,
			final_amount REAL NOT NULL,
			payment_method TEXT NOT NULL,
			transaction_time DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (customer_id) REFERENCES customers(id)
		);`,
		`CREATE TABLE IF NOT EXISTS sale_items (
			sale_id INTEGER NOT NULL,
			product_id INTEGER NOT NULL,
			quantity INTEGER NOT NULL,
			price_at_sale REAL NOT NULL,
			FOREIGN KEY (sale_id) REFERENCES sales(id),
			FOREIGN KEY (product_id) REFERENCES products(id)
		);`,
		`CREATE TABLE IF NOT EXISTS applied_discounts (
			sale_id INTEGER NOT NULL,
			discount_id INTEGER NOT NULL,
			amount_discounted REAL NOT NULL,
			FOREIGN KEY (sale_id) REFERENCES sales(id),
			FOREIGN KEY (discount_id) REFERENCES discounts(id)
		);`,
	}

	for _, stmt := range statements {
		_, err := db.Exec(stmt)
		if err != nil {
			log.Fatalf("Error creating table: %v", err)
		}
	}
}