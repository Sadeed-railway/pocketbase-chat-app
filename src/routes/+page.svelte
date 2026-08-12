<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { session } from '$pb/pocketbase.svelte.js';

  let visible = $state(true);
  let targetRoute = $state('/login');

  
  onMount(async () => {
    const delayPromise = new Promise((res) => setTimeout(res, 1200));

    if (session.isValid) {
      targetRoute = '/chats';
    } else {
      targetRoute = '/login';
    }

    await delayPromise;
    console.log('Navigating to:', targetRoute);

    visible = false;
    await handleOutroEnd();
  });

  async function handleOutroEnd() {
    goto(targetRoute, { replaceState: true });
  }
</script>

{#if visible}
  <div 
    class="splash-container"
    in:fade={{ duration: 400 }}
    out:fly={{ y: -30, duration: 500 }}
  >
    <div 
      class="logo-box" 
      in:fly={{ y: 20, duration: 600, delay: 100 }} 
      out:fade={{ duration: 300 }}
    >
      <div class="app-icon">💬</div>
      <h1>My Desktop App</h1>
      <div class="spinner"></div>
    </div>
  </div>
{/if}

<style>
  .splash-container {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #0f172a;
    color: white;
    font-family: system-ui, sans-serif;
    user-select: none;
    z-index: 9999;
  }

  .logo-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .app-icon {
    font-size: 4rem;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>