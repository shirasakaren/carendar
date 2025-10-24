package repository

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"

	"github.com/shirasakaren/carendar/apps/backend/internal/model"
)

func TestMarshalAttachments(t *testing.T) {
	if got, err := marshalAttachments(nil); err != nil || string(got) != "[]" {
		t.Fatalf("marshalAttachments(nil) = %q, %v", got, err)
	}
	att := []model.Attachment{{Name: "a.pdf", URL: "https://x/a.pdf", Type: "application/pdf", Size: 10}}
	got, err := marshalAttachments(att)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var back []model.Attachment
	if err := json.Unmarshal(got, &back); err != nil {
		t.Fatalf("roundtrip: %v", err)
	}
	if len(back) != 1 || back[0].Name != "a.pdf" {
		t.Fatalf("roundtrip = %#v", back)
	}
}

func TestNullableUUID(t *testing.T) {
	if nullableUUID(nil) != nil {
		t.Fatal("nil should stay nil")
	}
	id := uuid.New()
	if nullableUUID(&id) != id {
		t.Fatal("pointer should unwrap to the value")
	}
}

func TestNullableJSON(t *testing.T) {
	if nullableJSON(nil) != nil {
		t.Fatal("empty raw message should stay nil")
	}
	raw := json.RawMessage(`{"a":1}`)
	got, ok := nullableJSON(raw).([]byte)
	if !ok || string(got) != `{"a":1}` {
		t.Fatalf("nullableJSON = %#v", got)
	}
}
