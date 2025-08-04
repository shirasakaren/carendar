package handler

import (
	"testing"
	"time"
)

func TestParseMonth(t *testing.T) {
	y, m, err := parseMonth("2026-05")
	if err != nil {
		t.Fatalf("parseMonth(2026-05) error: %v", err)
	}
	if y != 2026 || m != time.May {
		t.Fatalf("parseMonth(2026-05) = (%d, %v), want (2026, May)", y, m)
	}
}

func TestParseMonthEmptyDefaultsToNow(t *testing.T) {
	now := time.Now()
	y, m, err := parseMonth("")
	if err != nil {
		t.Fatalf("parseMonth(\"\") error: %v", err)
	}
	if y != now.Year() || m != now.Month() {
		t.Fatalf("parseMonth(\"\") = (%d, %v), want (%d, %v)", y, m, now.Year(), now.Month())
	}
}

func TestParseMonthRejectsBadInput(t *testing.T) {
	for _, in := range []string{"bogus", "2026", "2026-13", "2026-00", "abcd-05"} {
		if _, _, err := parseMonth(in); err == nil {
			t.Errorf("parseMonth(%q) should fail", in)
		}
	}
}

func TestTrimList(t *testing.T) {
	got := trimList([]string{" A ", "  ", "B", ""})
	if len(got) != 2 || got[0] != "A" || got[1] != "B" {
		t.Fatalf("trimList = %#v, want [A B]", got)
	}
	if trimList(nil) != nil {
		t.Fatal("trimList(nil) should stay nil")
	}
	if trimList([]string{"  "}) != nil {
		t.Fatal("trimList of blank-only input should collapse to nil")
	}
}
