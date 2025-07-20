package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"pos-app/internal/model"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type TransactionHandler struct {
	DB *sql.DB
}

type CreateSaleRequest struct {
	CustomerID    *int          `json:"customer_id"`
	PaymentMethod string        `json:"payment_method"`
	Items         []RequestItem `json:"items"`
	DiscountCodes []string      `json:"discount_codes"`
	UserID        int           `json:"user_id"` // In a real app, this would come from auth middleware
}

type RequestItem struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

// CreateSale handles the complex logic of creating a new sale.
func (h *TransactionHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	var req CreateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	// Defer rollback in case of panic or early return
	defer tx.Rollback()

	// 1. Calculate total amount and validate stock
	totalAmount := 0.0
	for _, item := range req.Items {
		var price float64
		var stock int
		err := tx.QueryRow("SELECT p.price, i.quantity FROM products p JOIN inventory i ON p.id = i.product_id WHERE p.id = ?", item.ProductID).Scan(&price, &stock)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, fmt.Sprintf("Product with ID %d not found", item.ProductID), http.StatusBadRequest)
				return
			}
			http.Error(w, "Failed to fetch product details", http.StatusInternalServerError)
			return
		}

		if stock < item.Quantity {
			http.Error(w, fmt.Sprintf("Not enough stock for product ID %d. Available: %d, Requested: %d", item.ProductID, stock, item.Quantity), http.StatusConflict)
			return
		}
		totalAmount += price * float64(item.Quantity)
	}

	// 2. Apply discounts
	finalAmount := totalAmount
	var totalDiscountAmount float64
	appliedDiscounts := []model.Discount{}
	for _, code := range req.DiscountCodes {
		var d model.Discount
		err := tx.QueryRow("SELECT id, discount_type, value, is_active FROM discounts WHERE code = ? AND is_active = TRUE", code).Scan(&d.ID, &d.DiscountType, &d.Value, &d.IsActive)
		if err != nil {
			// Ignore not found discounts, or return error? For now, ignore.
			continue
		}

		var discountValue float64
		if d.DiscountType == "percentage" {
			discountValue = totalAmount * (d.Value / 100)
		} else { // fixed_amount
			discountValue = d.Value
		}
		finalAmount -= discountValue
		totalDiscountAmount += discountValue
		appliedDiscounts = append(appliedDiscounts, d)
	}
	if finalAmount < 0 {
		finalAmount = 0
	}

	// 3. Insert into sales table
	saleRes, err := tx.Exec(
		"INSERT INTO sales(user_id, customer_id, total_amount, final_amount, payment_method) VALUES(?, ?, ?, ?, ?)",
		req.UserID, req.CustomerID, totalAmount, finalAmount, req.PaymentMethod,
	)
	if err != nil {
		http.Error(w, "Failed to create sale record", http.StatusInternalServerError)
		return
	}
	saleID, _ := saleRes.LastInsertId()

	// 4. Insert sale items and update inventory
	for _, item := range req.Items {
		var price float64
		// We fetch price again to be absolutely sure, though we could have stored it from the first loop
		tx.QueryRow("SELECT price FROM products WHERE id = ?", item.ProductID).Scan(&price)

		_, err := tx.Exec(
			"INSERT INTO sale_items(sale_id, product_id, quantity, price_at_sale) VALUES(?, ?, ?, ?)",
			saleID, item.ProductID, item.Quantity, price,
		)
		if err != nil {
			http.Error(w, "Failed to insert sale item", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec("UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?", item.Quantity, item.ProductID)
		if err != nil {
			http.Error(w, "Failed to update inventory", http.StatusInternalServerError)
			return
		}
	}

	// 5. Insert applied discounts
	for _, d := range appliedDiscounts {
		var discountValue float64
		if d.DiscountType == "percentage" {
			discountValue = totalAmount * (d.Value / 100)
		} else {
			discountValue = d.Value
		}
		_, err := tx.Exec("INSERT INTO applied_discounts(sale_id, discount_id, amount_discounted) VALUES (?, ?, ?)", saleID, d.ID, discountValue)
		if err != nil {
			http.Error(w, "Failed to apply discount", http.StatusInternalServerError)
			return
		}
	}

	// 6. Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"sale_id": saleID})
}

// GetSales handles listing all sales
func (h *TransactionHandler) GetSales(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, user_id, customer_id, final_amount, payment_method, transaction_time FROM sales ORDER BY transaction_time DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sales := []model.Sale{}
	for rows.Next() {
		var s model.Sale
		if err := rows.Scan(&s.ID, &s.UserID, &s.CustomerID, &s.FinalAmount, &s.PaymentMethod, &s.TransactionTime); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sales = append(sales, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetSale handles getting a single sale with its items
func (h *TransactionHandler) GetSale(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid sale ID", http.StatusBadRequest)
		return
	}

	var s model.Sale
	err = h.DB.QueryRow("SELECT id, user_id, customer_id, total_amount, final_amount, payment_method, transaction_time FROM sales WHERE id = ?", id).Scan(&s.ID, &s.UserID, &s.CustomerID, &s.TotalAmount, &s.FinalAmount, &s.PaymentMethod, &s.TransactionTime)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Sale not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	rows, err := h.DB.Query("SELECT product_id, quantity, price_at_sale FROM sale_items WHERE sale_id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []model.SaleItem{}
	for rows.Next() {
		var item model.SaleItem
		if err := rows.Scan(&item.ProductID, &item.Quantity, &item.PriceAtSale); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}
	s.Items = items

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}
