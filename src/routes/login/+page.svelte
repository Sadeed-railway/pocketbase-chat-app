<script>
    import { goto } from '$app/navigation';
    import { signInWithPopup } from 'firebase/auth';
    import { auth, db, googleProvider } from '$fb/firebase';
    import { fbsession } from '$fb/session.svelte.js';
    import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

    let usernameInput = $state('');
    let usernameError = $state('');
    let isSubmitting = $state(false);
    let isGoogleLoading = $state(false);

    // Fully signed-in users (with a username) go straight to chats.
    // New Google users stay here for the username onboarding step.
    $effect(() => {
        if (fbsession.ready && fbsession.user && fbsession.profile?.username) {
            goto('/chats', { replaceState: true });
        }
    });

    async function loginWithGoogle() {
        isGoogleLoading = true;
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged + profile snapshot take it from here
        } catch (error) {
            console.error('Google login error:', error);
        } finally {
            isGoogleLoading = false;
        }
    }

    async function saveUsername(e) {
        e.preventDefault();
        usernameError = '';
        const cleanUsername = usernameInput.trim().toLowerCase();

        if (!cleanUsername) {
            usernameError = 'Username cannot be empty.';
            return;
        }
        if (cleanUsername.length < 3) {
            usernameError = 'Username must be at least 3 characters.';
            return;
        }
        if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
            usernameError = 'Only lowercase letters, numbers, and underscores allowed.';
            return;
        }

        isSubmitting = true;
        try {
            // Ensure the username is not taken
            const taken = await getDocs(
                query(collection(db, 'users'), where('username', '==', cleanUsername))
            );
            if (!taken.empty) {
                usernameError = 'That username is already taken.';
                return;
            }

            await updateDoc(doc(db, 'users', fbsession.user.uid), {
                username: cleanUsername
            });
            // The profile snapshot in fbsession updates -> effect navigates to /chats
        } catch (err) {
            console.error('Username save error:', err);
            usernameError = 'Failed to save username. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex min-h-screen w-full items-center justify-center p-4">
    {#if fbsession.user && fbsession.profile && !fbsession.profile.username}
        <!-- Username onboarding (replaces the old /googleAuth route) -->
        <form
            onsubmit={saveUsername}
            class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-surface-500/20 bg-surface-100-800-token p-6 shadow-xl backdrop-blur-md"
        >
            <h2 class="text-center text-2xl font-bold tracking-tight text-surface-900-50-token">
                Pick a username
            </h2>
            <p class="text-center text-sm text-surface-600-300-token">
                Welcome, {fbsession.user.displayName}! Choose a username your friends can find you by.
            </p>

            {#if usernameError}
                <div class="rounded-lg border border-error-500/40 bg-error-500/10 p-3 text-center text-sm font-medium text-error-500">
                    {usernameError}
                </div>
            {/if}

            <div class="flex flex-col gap-1.5">
                <label for="username" class="ml-1 text-xs font-semibold uppercase tracking-wider text-surface-600-300-token">
                    Username
                </label>
                <input
                    type="text"
                    id="username"
                    bind:value={usernameInput}
                    placeholder="gamertag123"
                    required
                    class="input preset-tonal rounded-lg p-2.5 text-sm transition-colors"
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                class="btn preset-filled-primary-500 mt-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
            >
                {#if isSubmitting}
                    Saving...
                {:else}
                    Continue
                {/if}
            </button>
        </form>
    {:else}
        <!-- Google sign-in -->
        <div class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-surface-500/20 bg-surface-100-800-token p-8 shadow-xl backdrop-blur-md">
            <h2 class="text-center text-2xl font-bold tracking-tight text-surface-900-50-token">
                Welcome Back
            </h2>
            <p class="text-center text-sm text-surface-600-300-token">Sign in to start chatting</p>

            <button
                type="button"
                onclick={loginWithGoogle}
                disabled={isGoogleLoading}
                class="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-surface-500/20 bg-surface-100-800-token px-4 py-2.5 text-sm font-medium text-surface-900-50-token shadow-sm hover:bg-surface-50-900-token focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors disabled:opacity-50"
            >
                <svg class="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {#if isGoogleLoading}
                    Signing in with Google...
                {:else}
                    Sign in with Google
                {/if}
            </button>
        </div>
    {/if}
</div>
