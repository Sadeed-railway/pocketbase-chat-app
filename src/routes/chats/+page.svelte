<script>
  import { onMount } from 'svelte';
  import SideBar from '$lib/components/SideBar.svelte';
  import { pb, session } from '$pb/pocketbase.svelte.js';
  import { onAuthStateChanged } from 'firebase/auth';
  import { auth, db } from '$fb/firebase';
  import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
      } else if (fbUser) {
        // Firebase-authenticated user: load friends from Firestore
        loadFirebaseFriends(fbUser.uid);
      } else if (fbAuthReady) {
        // Only redirect when there is no Firebase session either
        goto('/login', { replaceState: true });
      }
    });
    
    async function loadFirebaseFriends(uid) {
      // Mirror of the PocketBase schema: friend_requests docs hold sender/receiver
      // UIDs and a status field; accepted ones are the user's friends.
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