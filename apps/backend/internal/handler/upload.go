package handler

import (
	"net/http"

	"mgm.lab/calendar-backend/internal/httpx"
)

const maxUploadBytes = 100 << 20 // 100 MiB

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if h.s3 == nil {
		httpx.Error(w, http.StatusServiceUnavailable, "uploads not configured")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(16 << 20); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid or too-large upload: "+err.Error())
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "missing 'file' field")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	res, err := h.s3.Upload(r.Context(), header.Filename, contentType, header.Size, file)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, res)
}
