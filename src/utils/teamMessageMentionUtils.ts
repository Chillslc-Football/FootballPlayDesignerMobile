export type TeamMessageBodySegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string };

export const USER_MENTION_BODY_PATTERN =
  /@\[([^\]]+)\]\(mention:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi;

export const AUDIENCE_MENTION_BODY_PATTERN =
  /(^|[^\w])@(everyone|coaches|players|parents)(?!\w)/gi;

type MentionSpan = {
  start: number;
  end: number;
  display: string;
};

function collectMentionSpans(body: string): MentionSpan[] {
  const spans: MentionSpan[] = [];

  const userPattern = new RegExp(USER_MENTION_BODY_PATTERN.source, 'gi');
  let userMatch: RegExpExecArray | null;
  while ((userMatch = userPattern.exec(body)) !== null) {
    spans.push({
      start: userMatch.index,
      end: userPattern.lastIndex,
      display: `@${userMatch[1] ?? 'Team member'}`,
    });
  }

  const audiencePattern = new RegExp(AUDIENCE_MENTION_BODY_PATTERN.source, 'gi');
  let audienceMatch: RegExpExecArray | null;
  while ((audienceMatch = audiencePattern.exec(body)) !== null) {
    const prefix = audienceMatch[1] ?? '';
    spans.push({
      start: audienceMatch.index + prefix.length,
      end: audiencePattern.lastIndex,
      display: `@${audienceMatch[2] ?? ''}`,
    });
  }

  return spans.sort((left, right) => left.start - right.start);
}

export function splitTeamMessageBodyForDisplay(body: string): TeamMessageBodySegment[] {
  if (!body) {
    return [];
  }

  const spans = collectMentionSpans(body);
  if (spans.length === 0) {
    return [{ type: 'text', value: body }];
  }

  const segments: TeamMessageBodySegment[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ type: 'text', value: body.slice(cursor, span.start) });
    }

    segments.push({ type: 'mention', value: span.display });
    cursor = span.end;
  }

  if (cursor < body.length) {
    segments.push({ type: 'text', value: body.slice(cursor) });
  }

  return segments;
}
