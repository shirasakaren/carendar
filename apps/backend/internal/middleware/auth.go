package middleware

import (
	"net/http"
	"strings"

	"mgm.lab/calendar-backend/internal/httpx"
	"mgm.lab/calendar-backend/internal/service"
)

const CookieName = "mgm_admin_token"

func RequireAdmin(auth *service.Auth) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tok := tokenFromRequest(r)
			if tok == "" {
				httpx.Error(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			if err := auth.Verify(tok); err != nil {
				httpx.Error(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func tokenFromRequest(r *http.Request) string {
	if h := r.Header.Get("Authorization"); h != "" {
		if strings.HasPrefix(h, "Bearer ") {
			return strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		}
	}
	if c, err := r.Cookie(CookieName); err == nil {
		return c.Value
	}
	return ""
}
