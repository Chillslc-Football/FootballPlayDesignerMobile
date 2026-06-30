import {
  errorResponse,
  filmStoragePathIsValid,
  filmStorageTeamId,
  jsonResponse,
} from '../_shared/filmStorage.ts';
import { deleteLegacyFilmObject } from '../_shared/legacyFilmStorage.ts';
import { deleteR2Object, r2ObjectExists } from '../_shared/r2Client.ts';
import {
  createServiceClient,
  createUserClient,
  requireAuthenticatedUser,
  requireTeamEditor,
} from '../_shared/supabaseAuth.ts';

type DeleteObjectRequest = {
  storagePath?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({});
  }

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const body = (await request.json()) as DeleteObjectRequest;
    const storagePath = body.storagePath?.trim();

    if (!storagePath || !filmStoragePathIsValid(storagePath)) {
      return errorResponse('Invalid film storage path.');
    }

    const teamId = filmStorageTeamId(storagePath);

    if (!teamId) {
      return errorResponse('Invalid film storage path.');
    }

    const supabase = createUserClient(request.headers.get('Authorization'));
    await requireAuthenticatedUser(supabase);
    await requireTeamEditor(supabase, teamId);

    if (await r2ObjectExists(storagePath)) {
      await deleteR2Object(storagePath);
    }

    const admin = createServiceClient();
    await deleteLegacyFilmObject(admin, storagePath);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete team film.';
    const status = message === 'Unauthorized.' ? 401 : 400;

    return errorResponse(message, status);
  }
});
