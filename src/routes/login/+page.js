// Client-side route load: bounce signed-in users straight to /chats
import { redirect } from '@sveltejs/kit';
import { fbsession } from '$fb/session.svelte.js';

export function load() {
    if (fbsession.ready && fbsession.user && fbsession.profile?.username) {
        redirect(303, '/chats');
    }
}
