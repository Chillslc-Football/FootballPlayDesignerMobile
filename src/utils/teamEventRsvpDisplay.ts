import type { TeamRosterMember } from '../types/team';
import type { TeamEventRsvp, TeamEventRsvpStatus } from '../types/teamEventRsvp';

export type RsvpGroupMember = {
  user_id: string;
  display_name: string | null;
};

export type TeamEventRsvpSummary = {
  accepted: RsvpGroupMember[];
  tentative: RsvpGroupMember[];
  declined: RsvpGroupMember[];
  noResponse: RsvpGroupMember[];
  counts: {
    accepted: number;
    tentative: number;
    declined: number;
    noResponse: number;
  };
};

function memberLabel(member: RsvpGroupMember): string {
  return member.display_name?.trim() || 'Team member';
}

function compareMembers(left: RsvpGroupMember, right: RsvpGroupMember): number {
  return memberLabel(left).localeCompare(memberLabel(right), undefined, { sensitivity: 'base' });
}

function rosterMemberToGroupMember(member: TeamRosterMember): RsvpGroupMember {
  return {
    user_id: member.user_id,
    display_name: member.display_name,
  };
}

export function buildTeamEventRsvpSummary(
  rsvps: TeamEventRsvp[],
  roster: TeamRosterMember[],
): TeamEventRsvpSummary {
  const statusByUserId = new Map<string, TeamEventRsvpStatus>();
  const displayNameByUserId = new Map<string, string | null>();

  for (const rsvp of rsvps) {
    statusByUserId.set(rsvp.user_id, rsvp.status);
    displayNameByUserId.set(rsvp.user_id, rsvp.display_name);
  }

  const accepted: RsvpGroupMember[] = [];
  const tentative: RsvpGroupMember[] = [];
  const declined: RsvpGroupMember[] = [];
  const noResponse: RsvpGroupMember[] = [];

  for (const member of roster) {
    const status = statusByUserId.get(member.user_id);
    const groupMember = rosterMemberToGroupMember(member);

    if (!status) {
      noResponse.push(groupMember);
      continue;
    }

    if (status === 'accepted') {
      accepted.push(groupMember);
    } else if (status === 'tentative') {
      tentative.push(groupMember);
    } else {
      declined.push(groupMember);
    }
  }

  for (const rsvp of rsvps) {
    const onRoster = roster.some((member) => member.user_id === rsvp.user_id);

    if (onRoster) {
      continue;
    }

    const groupMember: RsvpGroupMember = {
      user_id: rsvp.user_id,
      display_name: rsvp.display_name,
    };

    if (rsvp.status === 'accepted') {
      accepted.push(groupMember);
    } else if (rsvp.status === 'tentative') {
      tentative.push(groupMember);
    } else {
      declined.push(groupMember);
    }
  }

  accepted.sort(compareMembers);
  tentative.sort(compareMembers);
  declined.sort(compareMembers);
  noResponse.sort(compareMembers);

  return {
    accepted,
    tentative,
    declined,
    noResponse,
    counts: {
      accepted: accepted.length,
      tentative: tentative.length,
      declined: declined.length,
      noResponse: noResponse.length,
    },
  };
}

export const RSVP_STATUS_SUMMARY_LABELS: Record<
  keyof TeamEventRsvpSummary['counts'],
  string
> = {
  accepted: 'Accepted',
  tentative: 'Tentative',
  declined: 'Declined',
  noResponse: 'No Response',
};
