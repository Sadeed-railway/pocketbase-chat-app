<script>
  import { onMount } from 'svelte';
  import SideBar from '$lib/components/SideBar.svelte';
  import AddFriendModal from '$lib/components/AddFriendModal.svelte';
  import { onAuthStateChanged } from 'firebase/auth';
  import { auth, db } from '$fb/firebase';
  import { fbsession } from '$fb/session.svelte.js';
  import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
  import { goto } from '$app/navigation';
	import ActiveChat from '$lib/components/ActiveChat.svelte';

  let friendsList = $state([]);
  let fbUser = $state(null);
  let fbAuthReady = $state(false);

  // Add Friend modal + incoming friend requests
  let isAddFriendOpen = $state(false);
  let incomingRequests = $state([]);
  let unsubRequests = null;

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      fbUser = currentUser;
      fbAuthReady = true;

      // (Re)subscribe to incoming pending friend requests in realtime
      if (unsubRequests) {
        unsubRequests();
        unsubRequests = null;
      }
      if (currentUser) {
        unsubRequests = onSnapshot(
          query(
            collection(db, 'friend_requests'),
            where('receiver', '==', currentUser.uid),
            where('status', '==', 'pending')
          ),
          async (snap) => {
            const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            // Resolve sender usernames for display
            incomingRequests = await Promise.all(
              requests.map(async (req) => {
                try {
                  const senderSnap = await getDoc(doc(db, 'users', req.sender));
                  return { ...req, senderUsername: senderSnap.exists() ? senderSnap.data().username : null };
                } catch {
                  return { ...req, senderUsername: null };
                }
              })
            );
          },
          (err) => console.error('Friend request listener error:', err)
        );
      } else {
        incomingRequests = [];
      }
    });
    return () => {
      unsubscribe();
      if (unsubRequests) unsubRequests();
    };
  });

  // Auth guard: only Firebase auth exists now
  $effect(() => {
    if (fbAuthReady && !fbUser) {
      goto('/login', { replaceState: true });
    } else if (fbUser) {
      loadFirebaseFriends(fbUser.uid);
    }
  });

  // Reload friends after a request is accepted/declined
  function refreshFriends() {
    if (fbUser) loadFirebaseFriends(fbUser.uid);
  }

  async function loadFirebaseFriends(uid) {
    // friend_requests docs hold sender/receiver UIDs and a status field;
    // accepted ones are the user's friends.
    try {
      const [asSender, asReceiver] = await Promise.all([
        getDocs(query(collection(db, 'friend_requests'), where('sender', '==', uid), where('status', '==', 'accepted'))),
        getDocs(query(collection(db, 'friend_requests'), where('receiver', '==', uid), where('status', '==', 'accepted')))
      ]);

      const friendIds = new Set();
      asSender.forEach((d) => friendIds.add(d.data().receiver));
      asReceiver.forEach((d) => friendIds.add(d.data().sender));

      const friends = await Promise.all(
        [...friendIds].map(async (id) => {
          const snap = await getDoc(doc(db, 'users', id));
          if (!snap.exists()) return null;
          const data = snap.data();
          return {
            id: snap.id,
            username: data.username,
            avatar: data.avatar,
            type: 'DMs'
          };
        })
      );

      friendsList = friends.filter(Boolean);
    } catch (err) {
      console.error('Failed to load Firestore friends:', err);
    }
  }
</script>

<div class="relative flex h-[calc(100vh-73px)] min-w-0 overflow-hidden">
  <SideBar items={friendsList} />

  {#if fbUser}
    <!-- Add Friend button with pending-request badge -->
    <button
      type="button"
      onclick={() => (isAddFriendOpen = true)}
      class="absolute bottom-4 left-4 z-[90] inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-primary-600 transition-colors"
    >
      <span class="text-lg leading-none">+</span>
      Add Friend
      {#if incomingRequests.length > 0}
        <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 text-xs font-bold text-white">
          {incomingRequests.length}
        </span>
      {/if}
    </button>

    <AddFriendModal bind:open={isAddFriendOpen} currentUid={fbUser.uid} {incomingRequests} onFriendsChanged={refreshFriends} />
  {/if}

  <main class="min-w-0 flex-1">
    <ActiveChat />
  </main>
</div>
