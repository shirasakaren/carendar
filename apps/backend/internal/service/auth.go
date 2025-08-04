package service

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Auth struct {
	adminPassword string
	secret        []byte
	ttl           time.Duration
}

func NewAuth(password string, secret []byte, ttl time.Duration) *Auth {
	return &Auth{adminPassword: password, secret: secret, ttl: ttl}
}

func (a *Auth) CheckPassword(provided string) bool {
	if a.adminPassword == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(provided), []byte(a.adminPassword)) == 1
}

func (a *Auth) Mint() (string, time.Time, error) {
	now := time.Now()
	exp := now.Add(a.ttl)
	claims := jwt.MapClaims{
		"sub": "admin",
		"iat": now.Unix(),
		"exp": exp.Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(a.secret)
	if err != nil {
		return "", time.Time{}, err
	}
	return signed, exp, nil
}

func (a *Auth) Verify(token string) error {
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return a.secret, nil
	})
	if err != nil {
		return err
	}
	if !parsed.Valid {
		return errors.New("invalid token")
	}
	return nil
}

func (a *Auth) TTL() time.Duration { return a.ttl }
