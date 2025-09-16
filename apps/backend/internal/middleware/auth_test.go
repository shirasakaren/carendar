package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTokenFromRequestBearer(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/admin/me", nil)
	req.Header.Set("Authorization", "Bearer abc.def.ghi")
	if got := tokenFromRequest(req); got != "abc.def.ghi" {
		t.Fatalf("tokenFromRequest = %q", got)
	}
}

func TestTokenFromRequestCookie(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/admin/me", nil)
	req.AddCookie(&http.Cookie{Name: CookieName, Value: "cookie-token"})
	if got := tokenFromRequest(req); got != "cookie-token" {
		t.Fatalf("tokenFromRequest = %q", got)
	}
}

func TestTokenFromRequestPrecedence(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/admin/me", nil)
	req.Header.Set("Authorization", "Bearer header-token")
	req.AddCookie(&http.Cookie{Name: CookieName, Value: "cookie-token"})
	if got := tokenFromRequest(req); got != "header-token" {
		t.Fatalf("tokenFromRequest = %q, want the bearer header to win", got)
	}
}

func TestTokenFromRequestEmpty(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/admin/me", nil)
	if got := tokenFromRequest(req); got != "" {
		t.Fatalf("tokenFromRequest = %q, want empty", got)
	}
}
