package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimitAllowsUpToMax(t *testing.T) {
	h := RateLimit(3, time.Minute)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", nil)
		req.RemoteAddr = "192.0.2.10:1234"
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("request %d: status %d, want 204", i+1, rec.Code)
		}
	}

	// The fourth request within the window must be rejected.
	req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", nil)
	req.RemoteAddr = "192.0.2.10:1234"
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("4th request: status %d, want 429", rec.Code)
	}
}

func TestRateLimitTracksPerClient(t *testing.T) {
	h := RateLimit(1, time.Minute)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	// A different client IP gets its own window.
	req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", nil)
	req.RemoteAddr = "192.0.2.11:1234"
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("status %d, want 204 for a fresh client", rec.Code)
	}
}

func TestRateLimitPrefersForwardedFor(t *testing.T) {
	h := RateLimit(1, time.Minute)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	mk := func(xff string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", nil)
		req.RemoteAddr = "10.0.0.1:1111"
		if xff != "" {
			req.Header.Set("X-Forwarded-For", xff)
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec
	}

	if rec := mk("198.51.100.7, 10.0.0.2"); rec.Code != http.StatusNoContent {
		t.Fatalf("first: status %d, want 204", rec.Code)
	}
	if rec := mk("198.51.100.7, 10.0.0.2"); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second with same XFF: status %d, want 429", rec.Code)
	}
}

func TestRateLimitWindowResets(t *testing.T) {
	h := RateLimit(1, 40*time.Millisecond)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	mk := func() int {
		req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", nil)
		req.RemoteAddr = "192.0.2.12:1234"
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code
	}

	if got := mk(); got != http.StatusNoContent {
		t.Fatalf("first request: %d, want 204", got)
	}
	if got := mk(); got != http.StatusTooManyRequests {
		t.Fatalf("second request in window: %d, want 429", got)
	}
	time.Sleep(80 * time.Millisecond) // let the window expire
	if got := mk(); got != http.StatusNoContent {
		t.Fatalf("request after window expiry: %d, want 204", got)
	}
}
