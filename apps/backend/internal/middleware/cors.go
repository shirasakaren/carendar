package middleware

import (
	"net/http"
	"strings"
)

// CORS builds a middleware that allows the listed origins. "*" in the
// list means "any origin" and echoes the requesting origin back.
func CORS(allowed []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				// Cache correctness: responses differ per Origin whether the
				// origin is allowed or not, so always signal that to caches.
				w.Header().Add("Vary", "Origin")
			}
			if origin != "" && isAllowed(allowed, origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Max-Age", "3600")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// isAllowed reports whether the request origin matches any entry in the
// allowed list. Comparison is case-insensitive (origins are scheme+host
// so case differences only ever come from typos).
func isAllowed(allowed []string, origin string) bool {
	for _, a := range allowed {
		if a == "*" || strings.EqualFold(a, origin) {
			return true
		}
	}
	return false
}
