package model

import "time"

// User represents the users table
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // Do not expose password hash
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

// Customer represents the customers table
type Customer struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	PhoneNumber *string   `json:"phone_number"`
	Email       *string   `json:"email"`
	Address     *string   `json:"address"`
	CreatedAt   time.Time `json:"created_at"`
}

// Product represents the products table
type Product struct {
	ID          int       `json:"id"`
	SKU         string    `json:"sku"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
}

// Inventory represents the inventory table
type Inventory struct {
	ProductID   int       `json:"product_id"`
	Quantity    int       `json:"quantity"`
	LastUpdated time.Time `json:"last_updated"`
}

// Discount represents the discounts table
type Discount struct {
	ID           int        `json:"id"`
	Code         string     `json:"code"`
	Description  *string    `json:"description"`
	DiscountType string     `json:"discount_type"` // 'percentage' or 'fixed_amount'
	Value        float64    `json:"value"`
	IsActive     bool       `json:"is_active"`
	ValidFrom    *time.Time `json:"valid_from"`
	ValidUntil   *time.Time `json:"valid_until"`
	CreatedAt    time.Time  `json:"created_at"`
}

// Sale represents the sales table (transactions)
type Sale struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	CustomerID      *int       `json:"customer_id"`
	TotalAmount     float64    `json:"total_amount"`
	FinalAmount     float64    `json:"final_amount"`
	PaymentMethod   string     `json:"payment_method"`
	TransactionTime time.Time  `json:"transaction_time"`
	Items           []SaleItem `json:"items"`           // Used for creating a transaction
	Discounts       []Discount `json:"discounts"`       // Used for applying discounts
}

// SaleItem represents the sale_items table
type SaleItem struct {
	SaleID      int     `json:"sale_id"`
	ProductID   int     `json:"product_id"`
	Quantity    int     `json:"quantity"`
	PriceAtSale float64 `json:"price_at_sale"`
}

// AppliedDiscount represents the applied_discounts table
type AppliedDiscount struct {
	SaleID           int     `json:"sale_id"`
	DiscountID       int     `json:"discount_id"`
	AmountDiscounted float64 `json:"amount_discounted"`
}