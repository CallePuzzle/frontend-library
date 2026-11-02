import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { betterAuthHandle } from '@callepuzzle/auth/hooks';
import { paraglideHandle } from '#lib/paraglide-handle.js';
import { auth } from '#lib/server/auth.js';
import { building } from '$app/env';

export const handle: Handle = sequence(betterAuthHandle(auth, building), paraglideHandle);
