package model

import (
	"strings"
	"testing"
)

var allCategories = []Category{
	CategoryInternalEvents,
	CategoryExternalEvents,
	CategoryRnDWebsite,
	CategoryRnDGame,
	CategoryRnDMobile,
	CategoryRnDUX,
	CategoryMajorEvents,
	CategoryWorkshop,
	CategoryProjectDevelopment,
	CategoryAcademicEvents,
	CategoryHoliday,
}

func TestCategoryValid(t *testing.T) {
	for _, c := range allCategories {
		if !c.Valid() {
			t.Errorf("%q should be valid", c)
		}
	}
	if Category("made_up").Valid() {
		t.Error("unknown category should be invalid")
	}
	if Category("").Valid() {
		t.Error("empty category should be invalid")
	}
}

func TestCategoryDefaultColors(t *testing.T) {
	for _, c := range allCategories {
		color := c.DefaultColor()
		if !strings.HasPrefix(color, "#") || len(color) != 7 {
			t.Errorf("%q default color %q is not a hex color", c, color)
		}
	}
}

func TestLocationKindValid(t *testing.T) {
	for _, k := range []LocationKind{LocationPhysical, LocationOnline, LocationHybrid} {
		if !k.Valid() {
			t.Errorf("%q should be valid", k)
		}
	}
	if LocationKind("virtual").Valid() {
		t.Error("unknown location kind should be invalid")
	}
}
