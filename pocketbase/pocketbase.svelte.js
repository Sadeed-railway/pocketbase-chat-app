import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

// Only create a new instance if one doesn't already exist on the window in dev mode
const createPocketBase = () => {
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.__pb__) {
        return window.__pb__;
    }
    const instance = new PocketBase(PUBLIC_POCKETBASE_URL);
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.__pb__ = instance;
    }
    return instance;
};

export const pb = createPocketBase();

export const session = $state({
    isValid: pb.authStore.isValid,
    user: pb.authStore.model
});

pb.authStore.onChange((token, model) => {
    session.isValid = pb.authStore.isValid;
    session.user = model;
});

export function logout() {
    pb.authStore.clear();
}