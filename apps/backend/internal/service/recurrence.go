package service

import (
	"fmt"
	"time"

	"github.com/teambition/rrule-go"
)

// ExpandRecurrence returns the start times of every occurrence after
// the parent's DTSTART (i.e. the second occurrence onward). The parent
// row already represents the first occurrence; we materialise the rest.
//
// The expansion is bounded by two ceilings, whichever is sooner:
//
//   - the rule's own UNTIL / COUNT, if present
//   - `recurrenceEndDate`, if non-nil (inclusive)
//   - a hard cap of 2 years from `parentStart`, to keep insert volume sane
func ExpandRecurrence(rule string, parentStart time.Time, recurrenceEndDate *time.Time) ([]time.Time, error) {
	opts, err := rrule.StrToROption(rule)
	if err != nil {
		return nil, fmt.Errorf("parse rrule: %w", err)
	}
	opts.Dtstart = parentStart

	r, err := rrule.NewRRule(*opts)
	if err != nil {
		return nil, fmt.Errorf("build rrule: %w", err)
	}

	upper := parentStart.AddDate(2, 0, 0)
	if recurrenceEndDate != nil {
		// recurrenceEndDate is a DATE — treat it as the *last* eligible day
		// by extending to the end of that day.
		inclEnd := time.Date(
			recurrenceEndDate.Year(), recurrenceEndDate.Month(), recurrenceEndDate.Day(),
			23, 59, 59, 0, recurrenceEndDate.Location(),
		)
		if inclEnd.Before(upper) {
			upper = inclEnd
		}
	}

	all := r.Between(parentStart, upper, true)
	if len(all) <= 1 {
		return nil, nil
	}
	return all[1:], nil
}
