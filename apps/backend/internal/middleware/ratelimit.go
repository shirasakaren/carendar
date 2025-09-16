package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/shirasakaren/carendar/apps/backend/internal/httpx"
)

// RateLimit is a per-IP fixed-window limiter. It's intentionally small
// and in-memory — the login endpoint is the only protected route, so a
// single process-wide map is plenty. Behind a multi-replica deployment
// the limit applies per replica, which is acceptable for this use.
func RateLimit(max int, window time.Duration) func(http.Handler) http.Handler {
	type entry struct {
		count int
		reset time.Time
	}
	var (
		mu    sync.Mutex
		state = map[string]entry{}
	)

	// Opportunistically drop expired entries so the map can't grow
	// unbounded from spoofed IPs.
	go func() {
		t := time.NewTicker(window)
		defer t.Stop()
		for range t.C {
			now := time.Now()
			mu.Lock()
			for ip, e := range state {
				if now.After(e.reset) {
					delete(state, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			now := time.Now()

			mu.Lock()
			e, ok := state[ip]
			if !ok || now.After(e.reset) {
				e = entry{reset: now.Add(window)}
			}
			e.count++
			state[ip] = e
			allowed := e.count <= max
			mu.Unlock()

			if !allowed {
				httpx.Error(w, http.StatusTooManyRequests, "too many attempts, try again later")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// clientIP extracts the client address, preferring X-Forwarded-For when
// the service sits behind a proxy. Only the first hop is trusted.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		for i := 0; i < len(xff); i++ {
			if xff[i] == ',' {
				return xff[:i]
			}
		}
		return xff
	}
	return r.RemoteAddr
}
