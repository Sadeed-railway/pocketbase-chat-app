<script>
  import { onMount } from 'svelte';
  import SideBar from '$lib/components/SideBar.svelte';
  import { pb, session } from '$pb/pocketbase.svelte.js';
  import { onAuthStateChanged } from 'firebase/auth';
  import { auth } from '$fb/firebase';
  import { goto } from '$app/navigation';
	import ActiveChat from '$lib/components/ActiveChat.svelte';

  let friendsList = $state([]);

  // Track Firebase auth so PocketBase-only guards don't bounce
  // Firebase-authenticated users back to /login (infinite loop)
  let fbUser = $state(null);
  let fbAuthReady = $state(false);

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      fbUser = currentUser;
      fbAuthReady = true;
    });
    return () => unsubscribe();
  });

  $effect(() => {
      if (session.isValid) {
        loadFriends();
      } else if (fbAuthReady && !fbUser) {
        // Only redirect when there is no Firebase session either
        goto('/login', { replaceState: true });
      }
    });
    
    async function loadFriends() {
      const acceptedConnections = await pb.collection('friend_requests').getFullList({
        filter: `(sender = "${session.user.id}" || receiver = "${session.user.id}") && status = "accepted"`,
        expand: 'sender,receiver'
      });
      
      friendsList = acceptedConnections.map(conn => {
        return conn.sender === session.user.id ? conn.expand.receiver : conn.expand.sender;
      });
    }
</script>

<div class="flex h-[calc(100vh-73px)] min-w-0 overflow-hidden">
  <SideBar items={friendsList} />
  <main class="min-w-0 flex-1">
    <ActiveChat />
  </main>
</div>