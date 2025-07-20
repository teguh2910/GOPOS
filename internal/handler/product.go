package handler

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"pos-app/internal/model"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ProductHandler struct {
	DB *sql.DB
}

// ProductWithStock is a temporary struct for API responses that include stock quantity.
type ProductWithStock struct {
	model.Product
	Quantity int `json:"quantity"`
}

// GetProducts handles the request to get all products with their stock.
func (h *ProductHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT p.id, p.sku, p.name, p.description, p.price, p.created_at, i.quantity
		FROM products p
		LEFT JOIN inventory i ON p.id = i.product_id
	`
	rows, err := h.DB.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	products := []ProductWithStock{}
	for rows.Next() {
		var p ProductWithStock
		if err := rows.Scan(&p.ID, &p.SKU, &p.Name, &p.Description, &p.Price, &p.CreatedAt, &p.Quantity); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// CreateProduct handles the request to create a new product and its inventory.
func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string  `json:"name"`
		SKU         string  `json:"sku"`
		Description *string `json:"description"`
		Price       float64 `json:"price"`
		Quantity    int     `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// Insert into products table
	productStmt, err := tx.Prepare("INSERT INTO products(name, sku, description, price) VALUES(?, ?, ?, ?)")
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer productStmt.Close()

	res, err := productStmt.Exec(req.Name, req.SKU, req.Description, req.Price)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	productID, _ := res.LastInsertId()

	// Insert into inventory table
	invStmt, err := tx.Prepare("INSERT INTO inventory(product_id, quantity) VALUES(?, ?)")
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer invStmt.Close()

	_, err = invStmt.Exec(productID, req.Quantity)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	log.Printf("Product created with ID: %d", productID)
}

// GetProduct handles the request to get a single product by ID with its stock.
func (h *ProductHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	query := `
		SELECT p.id, p.sku, p.name, p.description, p.price, p.created_at, i.quantity
		FROM products p
		LEFT JOIN inventory i ON p.id = i.product_id
		WHERE p.id = ?
	`
	var p ProductWithStock
	err = h.DB.QueryRow(query, id).Scan(&p.ID, &p.SKU, &p.Name, &p.Description, &p.Price, &p.CreatedAt, &p.Quantity)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Product not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// UpdateProduct handles the request to update a product and its stock.
func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Name        string  `json:"name"`
		SKU         string  `json:"sku"`
		Description *string `json:"description"`
		Price       float64 `json:"price"`
		Quantity    int     `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// Update products table
	_, err = tx.Exec("UPDATE products SET name = ?, sku = ?, description = ?, price = ? WHERE id = ?",
		req.Name, req.SKU, req.Description, req.Price, id)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update inventory table
	_, err = tx.Exec("UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?",
		req.Quantity, id)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteProduct handles the request to delete a product and its inventory record.
func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	// Must delete from inventory first due to foreign key constraints, if any were enforced that way.
	// It's good practice anyway.
	_, err = tx.Exec("DELETE FROM inventory WHERE product_id = ?", id)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	res, err := tx.Exec("DELETE FROM products WHERE id = ?", id)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		tx.Rollback()
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
