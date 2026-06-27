export type TeamEventRsvpStatus = 'accepted' | 'tentative' | 'declined';

export const TEAM_EVENT_RSVP_STATUSES: TeamEventRsvpStatus[] = [
  'accepted',
  'tentative',
  'declined',
];

export type TeamEventRsvp = {
  id: string;
  event_id: string;
  team_id: string;
  user_id: string;
  status: TeamEventRsvpStatus;
  created_at: string;
  updated_at: string;
  display_name: string | null;
};

export type EventDetailTab = 'details' | 'rsvps';

export const EVENT_DETAIL_TABS: EventDetailTab[] = ['details', 'rsvps'];

export const EVENT_DETAIL_TAB_LABELS: Record<EventDetailTab, string> = {
  details: 'Details',
  rsvps: 'RSVPs',
};
