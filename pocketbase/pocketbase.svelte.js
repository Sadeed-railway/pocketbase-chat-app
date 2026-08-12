// src/pocketbase.svelte.js
import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

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