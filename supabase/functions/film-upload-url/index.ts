import {
  errorResponse,
  filmStoragePathIsValid,
  filmStorageTeamId,
  jsonResponse,
} from '../_shared/filmStorage.ts';
import { createR2UploadUrl } from '../_shared/r2Client.ts';
import {
  createUserClient,
  requireAuthenticatedUser,
  requireTeamEditor,
} from '../_shared/supabaseAuth.ts';

type UploadUrlRequest = {
  storagePath?: string;
  contentType?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({});
  }

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const body = (await request.json()) as UploadUrlRequest;
    const storagePath = body.storagePath?.trim();
    const contentType = body.contentType?.trim();

    if (!storagePath || !filmStoragePathIsValid(storagePath)) {
      return errorResponse('Invalid film storage path.');
    }

    if (!contentType?.startsWith('video/')) {
      return errorResponse('Invalid video content type.');
    }

    const teamId = filmStorageTeamId(storagePath);

    if (!teamId) {
      return errorResponse('Invalid film storage path.');
    }

    const supabase = createUserClient(request.headers.get('Authorization'));
    await requireAuthenticatedUser(supabase);
    await requireTeamEditor(supabase, teamId);

    const uploadUrl = await createR2UploadUrl(storagePath, contentType);

    return jsonResponse({ uploadUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create upload URL.';
    const status = message === 'Unauthorized.' ? 401 : 400;

    return errorResponse(message, status);
  }
});
