package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"pos-app/internal/model"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type DiscountHandler struct {
	DB *sql.DB
}

// GetDiscounts handles the request to get all discounts.
func (h *DiscountHandler) GetDiscounts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, code, description, discount_type, value, is_active, valid_from, valid_until, created_at FROM discounts")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	discounts := []model.Discount{}
	for rows.Next() {
		var d model.Discount
		if err := rows.Scan(&d.ID, &d.Code, &d.Description, &d.DiscountType, &d.Value, &d.IsActive, &d.ValidFrom, &d.ValidUntil, &d.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		discounts = append(discounts, d)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(discounts)
}

// CreateDiscount handles the request to create a new discount.
func (h *DiscountHandler) CreateDiscount(w http.ResponseWriter, r *http.Request) {
	var d model.Discount
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	stmt, err := h.DB.Prepare("INSERT INTO discounts(code, description, discount_type, value, is_active, valid_from, valid_until) VALUES(?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	res, err := stmt.Exec(d.Code, d.Description, d.DiscountType, d.Value, d.IsActive, d.ValidFrom, d.ValidUntil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	d.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

// GetDiscount handles the request to get a single discount by ID.
func (h *DiscountHandler) GetDiscount(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid discount ID", http.StatusBadRequest)
		return
	}

	var d model.Discount
	err = h.DB.QueryRow("SELECT id, code, description, discount_type, value, is_active, valid_from, valid_until, created_at FROM discounts WHERE id = ?", id).Scan(&d.ID, &d.Code, &d.Description, &d.DiscountType, &d.Value, &d.IsActive, &d.ValidFrom, &d.ValidUntil, &d.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Discount not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(d)
}

// UpdateDiscount handles the request to update a discount.
func (h *DiscountHandler) UpdateDiscount(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid discount ID", http.StatusBadRequest)
		return
	}

	var d model.Discount
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	stmt, err := h.DB.Prepare("UPDATE discounts SET code = ?, description = ?, discount_type = ?, value = ?, is_active = ?, valid_from = ?, valid_until = ? WHERE id = ?")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = stmt.Exec(d.Code, d.Description, d.DiscountType, d.Value, d.IsActive, d.ValidFrom, d.ValidUntil, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	d.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(d)
}

// DeleteDiscount handles the request to delete a discount.
func (h *DiscountHandler) DeleteDiscount(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid discount ID", http.StatusBadRequest)
		return
	}

	res, err := h.DB.Exec("DELETE FROM discounts WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Discount not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
