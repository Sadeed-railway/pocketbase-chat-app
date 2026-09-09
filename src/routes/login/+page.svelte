<script>
    import { onMount } from 'svelte';
    import { pb, session } from '$pb/pocketbase.svelte.js';
    import { goto } from '$app/navigation';
    import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
    import {
        doc,
        getDoc,
        setDoc,
        updateDoc,
        serverTimestamp
    } from 'firebase/firestore';
    import { auth, db, googleProvider } from '$fb/firebase';

    $effect(() => {
        if (session.isValid) {
            goto('/chats', { replaceState: true });
        }
    });

    let isSignUp = $state(false);

    // Form Fields
    let email = $state('');
    let username = $state('');
    let password = $state('');
    let passwordConfirm = $state('');

    // UI State
    let errorMessage = $state('');
    let isLoading = $state(false);
    let isGoogleLoading = $state(false);

    // Firebase Google auth: resolve/create the user profile, then navigate.
    // Mirrors the logic from the /googleAuth test route.
    onMount(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) return;

            try {
                const needsUsername = await resolveUserProfile(currentUser);
                if (needsUsername) {
                    // Send to the onboarding flow to pick a username
                    await goto('/googleAuth', { replaceState: true });
                } else {
                    await goto('/chats', { replaceState: true });
                }
            } catch (err) {
                console.error('Profile resolution error:', err);
                errorMessage = 'Google sign-in succeeded but profile setup failed. Please try again.';
            } finally {
                isGoogleLoading = false;
            }
        });

        return () => unsubscribe();
    });

    // Fetch or create profile once; returns whether username onboarding is needed
    async function resolveUserProfile(currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();

            // Update last login timestamp without touching the username field
            await updateDoc(userRef, { lastLogin: serverTimestamp() });

            return !(data.username && data.username.trim() !== '');
        }

        // First-time registration
        const newProfile = {
            uid: currentUser.uid,
            email: currentUser.email?.toLowerCase() ?? '',
            displayName: currentUser.displayName ?? '',
            avatar: currentUser.photoURL ?? '',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            username: null
        };

        await setDoc(userRef, newProfile);
        return true;
    }

    async function loginWithGoogle() {
        errorMessage = '';
        isGoogleLoading = true;

        try {
            // Do not write to Firestore here - onAuthStateChanged handles resolution cleanly
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google login error:', error);
            isGoogleLoading = false;
        }
    }

    function toggleMode() {
        isSignUp = !isSignUp;
        errorMessage = '';
        password = '';
        passwordConfirm = '';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        errorMessage = '';
        isLoading = true;

        try {
            if (isSignUp) {
                if (password !== passwordConfirm) {
                throw new Error('Passwords do not match');
                }
                await pb.collection('users').create({
                    username: username.trim() || undefined,
                    email: email.trim(),
                    password,
                    passwordConfirm
                });
                await pb.collection('users').authWithPassword(email, password);

            }

            else {
                await pb.collection('users').authWithPassword(email, password);
            }
        } catch (err) {
          console.error('Auth error:', err);
          if (err.data?.data?.name?.message) {
            errorMessage = `Name: ${err.data.data.name.message}`; 
          } else if (err.data?.data?.email?.message) {
            errorMessage = `Email: ${err.data.data.email.message}`;
          } else {
            errorMessage = err.message || 'Authentication failed. Please try again.';
          }
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="flex min-h-screen w-full items-center justify-center p-4">
  <form 
    onsubmit={handleSubmit} 
    class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-surface-500/20 bg-surface-100-800-token p-6 shadow-xl backdrop-blur-md"
  >
    <h2 class="text-center text-2xl font-bold tracking-tight text-surface-900-50-token">
      {isSignUp ? 'Create Account' : 'Welcome Back'}
    </h2>

    {#if errorMessage}
      <div class="rounded-lg border border-error-500/40 bg-error-500/10 p-3 text-center text-sm font-medium text-error-500">
        {errorMessage}
      </div>
    {/if}

    {#if isSignUp}
      <div class="flex flex-col gap-1.5">
        <label for="name" class="ml-1 text-xs font-semibold text-surface-600-300-token uppercase tracking-wider">
          Name
        </label>
        <input 
          type="text" 
          id="name" 
          bind:value={username} 
          placeholder="gamertag123" 
          required 
          class="input preset-tonal rounded-lg p-2.5 text-sm transition-colors"
        />
      </div>
    {/if}

    <div class="flex flex-col gap-1.5">
      <label for="email" class="ml-1 text-xs font-semibold text-surface-600-300-token uppercase tracking-wider">
        Email
      </label>
      <input 
        type="email" 
        id="email" 
        bind:value={email} 
        placeholder="you@example.com" 
        required 
        class="input preset-tonal rounded-lg p-2.5 text-sm transition-colors"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="password" class="ml-1 text-xs font-semibold text-surface-600-300-token uppercase tracking-wider">
        Password
      </label>
      <input 
        type="password" 
        id="password" 
        bind:value={password} 
        placeholder="••••••••" 
        required 
        class="input preset-tonal rounded-lg p-2.5 text-sm transition-colors"
      />
    </div>

    {#if isSignUp}
      <div class="flex flex-col gap-1.5">
        <label for="passwordConfirm" class="ml-1 text-xs font-semibold text-surface-600-300-token uppercase tracking-wider">
          Confirm Password
        </label>
        <input 
          type="password" 
          id="passwordConfirm" 
          bind:value={passwordConfirm} 
          placeholder="••••••••" 
          required 
          class="input preset-tonal rounded-lg p-2.5 text-sm transition-colors"
        />
      </div>
    {/if}

    <button 
      type="submit" 
      disabled={isLoading}
      class="btn preset-filled-primary-500 mt-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
    >
      {#if isLoading}
        Connecting...
      {:else}
        {isSignUp ? 'Sign Up' : 'Login'}
      {/if}
    </button>

    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-surface-500/20"></div>
      <span class="text-xs font-medium uppercase tracking-wider text-surface-600-300-token">or</span>
      <div class="h-px flex-1 bg-surface-500/20"></div>
    </div>

    <button
      type="button"
      onclick={loginWithGoogle}
      disabled={isGoogleLoading || isLoading}
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

    <div class="mt-1 flex items-center justify-center gap-1.5 text-xs text-surface-600-300-token">
      <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
      <button 
        type="button" 
        onclick={toggleMode} 
        class="font-semibold text-primary-500 underline hover:text-primary-600 focus:outline-none cursor-pointer"
      >
        {isSignUp ? 'Log In' : 'Sign Up'}
      </button>
    </div>
  </form>
</div>