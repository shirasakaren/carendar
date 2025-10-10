package handler

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func multipartUpload(t *testing.T) (*http.Request, error) {
	t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	fw, err := w.CreateFormFile("file", "agenda.pdf")
	if err != nil {
		return nil, err
	}
	if _, err := fw.Write([]byte("%PDF-1.4 fake content")); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	req := httptest.NewRequest(http.MethodPost, "/api/admin/upload", &body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	return req, nil
}

func TestUploadWithoutS3Returns503(t *testing.T) {
	h := &Handler{} // s3 == nil
	req, err := multipartUpload(t)
	if err != nil {
		t.Fatalf("build multipart: %v", err)
	}
	rec := httptest.NewRecorder()
	h.Upload(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 when S3 is not configured", rec.Code)
	}
}

func TestUploadSkipsParsingWhenS3Disabled(t *testing.T) {
	h := &Handler{}
	// A malformed multipart body: a parse would 400, but the S3 check
	// must short-circuit first and answer 503 instead.
	req := httptest.NewRequest(http.MethodPost, "/api/admin/upload", strings.NewReader("this is not multipart"))
	req.Header.Set("Content-Type", "multipart/form-data; boundary=x")
	rec := httptest.NewRecorder()
	h.Upload(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 short-circuit before parsing", rec.Code)
	}
}
