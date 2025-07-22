package router

import (
	"database/sql"
	"net/http"
	"os"
	"pos-app/internal/handler"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func SetupRouter(db *sql.DB) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Handlers
	productHandler := &handler.ProductHandler{DB: db}
	customerHandler := &handler.CustomerHandler{DB: db}
	discountHandler := &handler.DiscountHandler{DB: db}
	transactionHandler := &handler.TransactionHandler{DB: db}
	userHandler := &handler.UserHandler{DB: db}
	reportHandler := &handler.ReportHandler{DB: db}

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Product routes
		r.Route("/products", func(r chi.Router) {
			r.Get("/", productHandler.GetProducts)
			r.Post("/", productHandler.CreateProduct)
			r.Get("/{id}", productHandler.GetProduct)
			r.Put("/{id}", productHandler.UpdateProduct)
			r.Delete("/{id}", productHandler.DeleteProduct)
		})

		// Customer routes
		r.Route("/customers", func(r chi.Router) {
			r.Get("/", customerHandler.GetCustomers)
			r.Post("/", customerHandler.CreateCustomer)
			r.Get("/{id}", customerHandler.GetCustomer)
			r.Put("/{id}", customerHandler.UpdateCustomer)
			r.Delete("/{id}", customerHandler.DeleteCustomer)
		})

		// Discount routes
		r.Route("/discounts", func(r chi.Router) {
			r.Get("/", discountHandler.GetDiscounts)
			r.Post("/", discountHandler.CreateDiscount)
			r.Get("/{id}", discountHandler.GetDiscount)
			r.Put("/{id}", discountHandler.UpdateDiscount)
			r.Delete("/{id}", discountHandler.DeleteDiscount)
		})

		// Sales (Transaction) routes
		r.Route("/sales", func(r chi.Router) {
			r.Post("/", transactionHandler.CreateSale)
			r.Get("/", transactionHandler.GetSales)
			r.Get("/{id}", transactionHandler.GetSale)
		})

		// User routes
		r.Route("/users", func(r chi.Router) {
			r.Post("/register", userHandler.RegisterUser)
			r.Get("/", userHandler.GetUsers)
			r.Delete("/{id}", userHandler.DeleteUser)
		})

		// Report routes
		r.Route("/reports", func(r chi.Router) {
			r.Get("/sales", reportHandler.GetSalesReport)
		})
	})

	// Serve static files - try Next.js build first, fallback to original
	// Check if Next.js build exists, otherwise use original static files
	var staticDir string
	if _, err := os.Stat("./web/static/index.html"); err == nil {
		staticDir = "./web/static"
	} else if _, err := os.Stat("./web/static-original/index.html"); err == nil {
		staticDir = "./web/static-original"
	} else {
		staticDir = "./web/static"
	}

	fs := http.FileServer(http.Dir(staticDir))
	r.Handle("/*", fs)

	return r
}
