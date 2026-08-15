package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSAllowsConfiguredOrigin(t *testing.T) {
	h := CORS([]string{"https://kalender.mgm-lab.id"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
	req.Header.Set("Origin", "https://kalender.mgm-lab.id")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://kalender.mgm-lab.id" {
		t.Fatalf("allow-origin = %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("allow-credentials = %q", got)
	}
}

func TestCORSRejectsUnknownOrigin(t *testing.T) {
	h := CORS([]string{"https://kalender.mgm-lab.id"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
	req.Header.Set("Origin", "https://evil.example")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unexpected allow-origin %q for unknown origin", got)
	}
}

func TestCORSVariesOnOrigin(t *testing.T) {
	h := CORS([]string{"https://kalender.mgm-lab.id"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for _, origin := range []string{"", "https://evil.example"} {
		req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
		if origin != "" {
			req.Header.Set("Origin", origin)
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if origin == "" {
			if got := rec.Header().Get("Vary"); got != "" {
				t.Fatalf("Vary = %q for same-origin request, want empty", got)
			}
			continue
		}
		if got := rec.Header().Get("Vary"); got != "Origin" {
			t.Fatalf("Vary = %q for cross-origin request, want Origin", got)
		}
	}
}

func TestCORSAllowsAnyListedOrigin(t *testing.T) {
	h := CORS([]string{"https://kalender.mgm-lab.id", "http://localhost:3000"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for _, origin := range []string{"https://kalender.mgm-lab.id", "http://localhost:3000"} {
		req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
		req.Header.Set("Origin", origin)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != origin {
			t.Errorf("origin %q: allow-origin = %q", origin, got)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
	req.Header.Set("Origin", "https://elsewhere.example")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unlisted origin was allowed: %q", got)
	}
}

func TestCORSWildcardEchoesOrigin(t *testing.T) {
	h := CORS([]string{"*"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
	req.Header.Set("Origin", "https://anywhere.example")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://anywhere.example" {
		t.Fatalf("allow-origin = %q, want the requesting origin echoed", got)
	}
}

func TestCORSPreflightShortCircuits(t *testing.T) {
	var called bool
	h := CORS([]string{"https://kalender.mgm-lab.id"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodOptions, "/api/admin/events", nil)
	req.Header.Set("Origin", "https://kalender.mgm-lab.id")
	req.Header.Set("Access-Control-Request-Method", "POST")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if called {
		t.Fatal("preflight should not reach the wrapped handler")
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("preflight status = %d, want 204", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Methods"); got == "" {
		t.Fatal("expected Access-Control-Allow-Methods on preflight")
	}
}
