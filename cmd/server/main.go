package main

import (
	"log"
	"net/http"
	"os"
	"pos-app/internal/database"
	"pos-app/internal/router"
)

func main() {
	// Get DB path from environment variable or use default for Docker
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		// Default path for Docker volume
		os.MkdirAll("/app/data", os.ModePerm)
		dbPath = "/app/data/pos.db"
	}

	// Initialize database
	db := database.InitDB(dbPath)
	defer db.Close()

	// Setup router
	r := router.SetupRouter(db)

	// Start server
	log.Println("Starting server on :8081")
	if err := http.ListenAndServe(":8081", r); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}
