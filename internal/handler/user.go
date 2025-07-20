package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"pos-app/internal/model"
	"strconv"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	DB *sql.DB
}

type RegisterUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// RegisterUser handles creating a new user with a hashed password.
func (h *UserHandler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	var req RegisterUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Set default role if not provided
	if req.Role == "" {
		req.Role = "cashier"
	}

	stmt, err := h.DB.Prepare("INSERT INTO users(username, password_hash, role) VALUES(?, ?, ?)")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	res, err := stmt.Exec(req.Username, string(hashedPassword), req.Role)
	if err != nil {
		// Handle unique constraint violation for username
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}

	id, _ := res.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"user_id": id})
}

// GetUsers handles listing all users (omitting password hash).
func (h *UserHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, username, role, created_at FROM users")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []model.User{}
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Role, &u.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// DeleteUser handles deleting a user.
func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Add check to prevent deleting the last admin or self, etc. in a real app
	res, err := h.DB.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
