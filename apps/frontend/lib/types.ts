export type Category =
  | "internal_events"
  | "external_events"
  | "rnd_website"
  | "rnd_game"
  | "rnd_mobile"
  | "rnd_ux"
  | "major_events"
  | "workshop"
  | "project_development"
  | "academic_events"
  | "holiday";

export type LocationKind = "physical" | "online" | "hybrid";

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface Event {
  id: string;
  parent_event_id?: string | null;
  title: string;
  category: Category;
  color: string;
  description_json?: unknown;
  thumbnail_url?: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  location?: string | null;
  location_type: LocationKind;
  meeting_link?: string | null;
  dresscode?: string | null;
  attendees?: string[] | null;
  attachments: Attachment[];
  recurrence_rule?: string | null;
  recurrence_end_date?: string | null;
  is_seeded: boolean;
  show_in_subscription: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListEventsResponse {
  month: string;
  events: Event[];
}
