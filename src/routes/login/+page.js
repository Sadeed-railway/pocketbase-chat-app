// src/routes/+page.js
import { redirect } from '@sveltejs/kit';
import { session } from '$pb/pocketbase.svelte.js';

export function load() {
  if (session.isValid) {
    redirect(303, '/chats');
  }
}