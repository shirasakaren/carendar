package handler

import (
	"net/http"
	"time"

	"mgm.lab/calendar-backend/internal/httpx"
	"mgm.lab/calendar-backend/internal/middleware"
)

type loginRequest struct {
	Password string `json:"password"`
}

type loginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	if !h.auth.CheckPassword(req.Password) {
		// Constant-ish delay to muddy brute force timing.
		time.Sleep(300 * time.Millisecond)
		httpx.Error(w, http.StatusUnauthorized, "Password salah.")
		return
	}
	token, exp, err := h.auth.Mint()
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not mint token")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     middleware.CookieName,
		Value:    token,
		Path:     "/",
		Expires:  exp,
		MaxAge:   int(h.auth.TTL().Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   r.TLS != nil,
	})
	httpx.JSON(w, http.StatusOK, loginResponse{Token: token, ExpiresAt: exp})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.CookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   r.TLS != nil,
	})
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]any{"admin": true})
}
