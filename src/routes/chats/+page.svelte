<script>
  import SideBar from '$lib/components/SideBar.svelte';
  import { pb, session } from '$pb/pocketbase.svelte.js';
  import { goto } from '$app/navigation';
	import ActiveChat from '$lib/components/ActiveChat.svelte';

  let friendsList = $state([]);

  $effect(() => {
      if (session.isValid) {
        loadFriends();
      } else {
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