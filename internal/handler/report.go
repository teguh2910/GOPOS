package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type ReportHandler struct {
	DB *sql.DB
}

type SalesReport struct {
	StartDate          string        `json:"start_date"`
	EndDate            string        `json:"end_date"`
	TotalRevenue       float64       `json:"total_revenue"`
	TotalTransactions  int           `json:"total_transactions"`
	TopSellingProducts []ProductSale `json:"top_selling_products"`
}

type ProductSale struct {
	ProductID   int     `json:"product_id"`
	ProductName string  `json:"product_name"`
	TotalSold   int     `json:"total_sold"`
	TotalValue  float64 `json:"total_value"`
}

// GetSalesReport handles generating a sales report for a given date range.
func (h *ReportHandler) GetSalesReport(w http.ResponseWriter, r *http.Request) {
	startDateStr := r.URL.Query().Get("start_date") // Expected format: YYYY-MM-DD
	endDateStr := r.URL.Query().Get("end_date")     // Expected format: YYYY-MM-DD

	// Default to the last 30 days if no dates are provided
	if startDateStr == "" || endDateStr == "" {
		endDate := time.Now()
		startDate := endDate.AddDate(0, 0, -30)
		startDateStr = startDate.Format("2006-01-02")
		endDateStr = endDate.Format("2006-01-02")
	}

	// Ensure end date includes the whole day
	endDateStr += " 23:59:59"

	report := SalesReport{
		StartDate: startDateStr,
		EndDate:   endDateStr,
	}

	// 1. Get total revenue and transaction count
	err := h.DB.QueryRow(`
		SELECT COALESCE(SUM(final_amount), 0), COUNT(id)
		FROM sales
		WHERE transaction_time BETWEEN ? AND ?`,
		startDateStr, endDateStr).Scan(&report.TotalRevenue, &report.TotalTransactions)
	if err != nil {
		http.Error(w, "Failed to generate sales summary: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Get top selling products
	rows, err := h.DB.Query(`
		SELECT
			p.id,
			p.name,
			SUM(si.quantity) as total_quantity_sold,
			SUM(si.quantity * si.price_at_sale) as total_value_sold
		FROM sale_items si
		JOIN products p ON si.product_id = p.id
		JOIN sales s ON si.sale_id = s.id
		WHERE s.transaction_time BETWEEN ? AND ?
		GROUP BY p.id, p.name
		ORDER BY total_quantity_sold DESC
		LIMIT 10`,
		startDateStr, endDateStr)
	if err != nil {
		http.Error(w, "Failed to generate top products report: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var ps ProductSale
		if err := rows.Scan(&ps.ProductID, &ps.ProductName, &ps.TotalSold, &ps.TotalValue); err != nil {
			http.Error(w, "Failed to scan product sale row: "+err.Error(), http.StatusInternalServerError)
			return
		}
		report.TopSellingProducts = append(report.TopSellingProducts, ps)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}
