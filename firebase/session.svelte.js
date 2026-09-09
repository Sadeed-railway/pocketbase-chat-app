import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

// Reactive Firebase session, mirrors the old PocketBase `session` shape:
// - ready: false until the initial auth state is resolved
// - user: the Firebase auth user (uid, displayName, photoURL, email)
// - profile: the Firestore users/{uid} document (username, avatar, ...)
export const fbsession = $state({
    ready: false,
    user: null,
    profile: null
});

let unsubProfile = null;

if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, async (user) => {
        fbsession.user = user;
        fbsession.ready = true;

        if (unsubProfile) {
            unsubProfile();
            unsubProfile = null;
        }

        if (!user) {
            fbsession.profile = null;
            return;
        }

        // Load the profile synchronously first so consumers see it right away,
        // then keep it in sync with realtime updates
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            fbsession.profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        } catch (err) {
            console.error('Failed to load user profile:', err);
        }

        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            fbsession.profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        });
    });
}
