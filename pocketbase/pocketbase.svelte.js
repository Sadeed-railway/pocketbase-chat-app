// src/pocketbase.svelte.js
import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Create a globally reactive session object using Runes
export const session = $state({
    isValid: pb.authStore.isValid,
    user: pb.authStore.model
});

// Listen to PocketBase's internal auth changes and update our rune
pb.authStore.onChange((token, model) => {
    session.isValid = pb.authStore.isValid;
    session.user = model;
});

export function logout() {
    pb.authStore.clear(); // This will automatically trigger the onChange listener above
}