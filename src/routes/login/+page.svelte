<script>
    import { pb, session } from '$pb/pocketbase.svelte.js';
     import { goto } from '$app/navigation';

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

    <div class="mt-1 flex items-center justify-center gap-1.5 text-xs text-surface-600-300-token">
      <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
      <button 
        type="button" 
        onclick={toggleMode} 
        class="font-semibold text-primary-500 underline hover:text-primary-600 focus:outline-none"
      >
        {isSignUp ? 'Log In' : 'Sign Up'}
      </button>
    </div>
  </form>
</div>