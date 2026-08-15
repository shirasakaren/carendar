package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/shirasakaren/carendar/apps/backend/internal/service"
)

func testDeps() Deps {
	return Deps{
		Auth:           service.NewAuth("pw", []byte("0123456789abcdef"), 0),
		AllowedOrigins: []string{"http://localhost:3000"},
	}
}

func TestRouterNotFoundIsJSON(t *testing.T) {
	r := NewRouter(testDeps())
	req := httptest.NewRequest(http.MethodGet, "/nope", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"error"`) {
		t.Fatalf("body = %q, want a JSON error", rec.Body.String())
	}
}

func TestRouterHealthzThroughMiddleware(t *testing.T) {
	r := NewRouter(testDeps())
	req := httptest.NewRequest(http.MethodGet, "/api/healthz", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := rec.Header().Get("X-Request-ID"); got == "" {
		t.Fatal("expected the request-ID middleware to stamp the response")
	}
	if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Fatal("expected the security headers middleware to run")
	}
}

func TestRouterAdminWithoutToken(t *testing.T) {
	r := NewRouter(testDeps())
	req := httptest.NewRequest(http.MethodGet, "/api/admin/me", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 without a token", rec.Code)
	}
}
