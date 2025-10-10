package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/shirasakaren/carendar/apps/backend/internal/service"
)

func TestLoginRejectsWrongPassword(t *testing.T) {
	h := &Handler{auth: service.NewAuth("correct", []byte("0123456789abcdef"), time.Hour)}
	req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", strings.NewReader(`{"password":"wrong"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.Login(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestLoginMintsTokenAndCookie(t *testing.T) {
	h := &Handler{auth: service.NewAuth("correct", []byte("0123456789abcdef"), time.Hour)}
	req := httptest.NewRequest(http.MethodPost, "/api/admin/auth", strings.NewReader(`{"password":"correct"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.Login(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"token":`) {
		t.Fatalf("body = %q, want a token", rec.Body.String())
	}
	cookies := rec.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected the mgm_admin_token cookie to be set")
	}
}

func TestLogoutClearsCookie(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest(http.MethodPost, "/api/admin/logout", nil)
	rec := httptest.NewRecorder()
	h.Logout(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	for _, c := range rec.Result().Cookies() {
		if c.Name == "mgm_admin_token" && c.MaxAge >= 0 {
			t.Fatal("expected the admin cookie to be expired")
		}
	}
}
