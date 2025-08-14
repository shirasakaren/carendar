package service

import (
	"strings"
	"testing"
)

func TestSanitizeFilename(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"agenda.pdf", "agenda.pdf"},
		{"../../etc/passwd", "passwd"},
		{"/absolute/path/notes.txt", "notes.txt"},
		{"rapat bulanan (final!).docx", "rapat_bulanan_final_.docx"},
		{"  spaces  .pdf", "spaces_.pdf"},
		{"", "file"},
		{".", "file"},
		{"/", "file"},
	}
	for _, c := range cases {
		if got := sanitizeFilename(c.in); got != c.want {
			t.Errorf("sanitizeFilename(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestSanitizeFilenameTruncatesLongNames(t *testing.T) {
	long := strings.Repeat("a", 200) + ".pdf"
	got := sanitizeFilename(long)
	if len(got) > 120 {
		t.Fatalf("sanitized name is %d chars, want <= 120", len(got))
	}
	if !strings.HasSuffix(got, ".pdf") {
		t.Fatalf("extension lost: %q", got)
	}
}
