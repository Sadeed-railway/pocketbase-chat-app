<script>
  import SideBar from '$lib/components/SideBar.svelte';
  import { pb, session } from '$pb/pocketbase.svelte.js';
  import { goto } from '$app/navigation';
	import ActiveChat from '$lib/components/ActiveChat.svelte';

  let friendsList = $state([]);
  let activeChatFriend = $state(null); 

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

<SideBar items={friendsList} activeFriendId={activeChatFriend?.id} />
<ActiveChat {activeChatFriend} conversationId={activeChatFriend?.conversationId} />