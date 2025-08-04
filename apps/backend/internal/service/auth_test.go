package service

import (
	"testing"
	"time"
)

func TestAuthPasswordCheck(t *testing.T) {
	a := NewAuth("s3cret", []byte("0123456789abcdef"), time.Hour)
	if !a.CheckPassword("s3cret") {
		t.Fatal("expected correct password to pass")
	}
	if a.CheckPassword("wrong") {
		t.Fatal("expected wrong password to fail")
	}
	if a.CheckPassword("") {
		t.Fatal("expected empty password to fail")
	}
}

func TestAuthMintAndVerifyRoundtrip(t *testing.T) {
	a := NewAuth("pw", []byte("0123456789abcdef"), 2*time.Hour)
	token, exp, err := a.Mint()
	if err != nil {
		t.Fatalf("mint: %v", err)
	}
	if time.Until(exp) < 90*time.Minute {
		t.Fatalf("expiry %v too soon", exp)
	}
	if err := a.Verify(token); err != nil {
		t.Fatalf("verify: %v", err)
	}

	other := NewAuth("pw", []byte("ffffffffffffffff"), 2*time.Hour)
	if err := other.Verify(token); err == nil {
		t.Fatal("token signed with a different secret should not verify")
	}
}

func TestAuthTTL(t *testing.T) {
	a := NewAuth("pw", []byte("0123456789abcdef"), 8*time.Hour)
	if a.TTL() != 8*time.Hour {
		t.Fatalf("TTL = %v", a.TTL())
	}
}
