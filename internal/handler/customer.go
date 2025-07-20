package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"pos-app/internal/model"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type CustomerHandler struct {
	DB *sql.DB
}

// GetCustomers handles the request to get all customers.
func (h *CustomerHandler) GetCustomers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, name, phone_number, email, address, created_at FROM customers")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	customers := []model.Customer{}
	for rows.Next() {
		var c model.Customer
		if err := rows.Scan(&c.ID, &c.Name, &c.PhoneNumber, &c.Email, &c.Address, &c.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		customers = append(customers, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customers)
}

// CreateCustomer handles the request to create a new customer.
func (h *CustomerHandler) CreateCustomer(w http.ResponseWriter, r *http.Request) {
	var c model.Customer
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	stmt, err := h.DB.Prepare("INSERT INTO customers(name, phone_number, email, address) VALUES(?, ?, ?, ?)")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	res, err := stmt.Exec(c.Name, c.PhoneNumber, c.Email, c.Address)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	c.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

// GetCustomer handles the request to get a single customer by ID.
func (h *CustomerHandler) GetCustomer(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	var c model.Customer
	err = h.DB.QueryRow("SELECT id, name, phone_number, email, address, created_at FROM customers WHERE id = ?", id).Scan(&c.ID, &c.Name, &c.PhoneNumber, &c.Email, &c.Address, &c.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Customer not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

// UpdateCustomer handles the request to update a customer.
func (h *CustomerHandler) UpdateCustomer(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	var c model.Customer
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	stmt, err := h.DB.Prepare("UPDATE customers SET name = ?, phone_number = ?, email = ?, address = ? WHERE id = ?")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = stmt.Exec(c.Name, c.PhoneNumber, c.Email, c.Address, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	c.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

// DeleteCustomer handles the request to delete a customer.
func (h *CustomerHandler) DeleteCustomer(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	res, err := h.DB.Exec("DELETE FROM customers WHERE id = ?", id)
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
		http.Error(w, "Customer not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
