/**
 * Shared circular event buffer for context log capture.
 * The ActivityTracker pushes events here; the FeedbackWidget reads them on submit.
 */

const MAX_BUFFER_SIZE = 100;

interface BufferedEvent {
  event_type: string;
  page_url: string;
  page_route: string;
  session_id: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

const buffer: BufferedEvent[] = [];

export function pushEvent(event: BufferedEvent): void {
  buffer.push(event);
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.shift();
  }
}

export function getRecentEvents(count: number): BufferedEvent[] {
  const start = Math.max(0, buffer.length - count);
  return buffer.slice(start);
}
