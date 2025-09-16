package handler

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
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
