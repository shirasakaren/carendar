package httpx

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestJSONSetsContentType(t *testing.T) {
	rec := httptest.NewRecorder()
	JSON(rec, http.StatusOK, map[string]string{"status": "ok"})
	if got := rec.Header().Get("Content-Type"); got != "application/json; charset=utf-8" {
		t.Fatalf("content-type = %q", got)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	if strings.TrimSpace(rec.Body.String()) != `{"status":"ok"}` {
		t.Fatalf("body = %q", rec.Body.String())
	}
}

func TestJSONNilBody(t *testing.T) {
	rec := httptest.NewRecorder()
	JSON(rec, http.StatusNoContent, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("expected empty body, got %q", rec.Body.String())
	}
}

func TestError(t *testing.T) {
	rec := httptest.NewRecorder()
	Error(rec, http.StatusUnauthorized, "Password salah.")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"error":"Password salah."`) {
		t.Fatalf("body = %q", rec.Body.String())
	}
}

func TestDecodeJSONRejectsUnknownFields(t *testing.T) {
	var dst struct {
		Title string `json:"title"`
	}
	body := strings.NewReader(`{"title":"x","nope":true}`)
	req := httptest.NewRequest(http.MethodPost, "/", body)
	if err := DecodeJSON(req, &dst); err == nil {
		t.Fatal("expected an error for unknown field")
	}
}

func TestDecodeJSONRejectsTrailingData(t *testing.T) {
	var dst struct {
		Title string `json:"title"`
	}
	body := strings.NewReader(`{"title":"x"} {"title":"y"}`)
	req := httptest.NewRequest(http.MethodPost, "/", body)
	if err := DecodeJSON(req, &dst); err == nil {
		t.Fatal("expected an error for trailing JSON data")
	}
}

func TestJSONNilValue(t *testing.T) {
	rec := httptest.NewRecorder()
	JSON(rec, http.StatusOK, nil)
	// Status is still written; a nil payload simply skips the encoder.
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body = %q, want empty for nil payloads", rec.Body.String())
	}
}
