<script>
  import { tick, onMount } from 'svelte';
  import { pb, session } from '$pb/pocketbase.svelte.js';
  import { getActiveChatState } from '$lib/stores/chat.svelte.js';
  import { onAuthStateChanged } from 'firebase/auth';
  import { auth, db } from '$fb/firebase';
  import { collection, addDoc, query, where, onSnapshot, getDoc, doc, serverTimestamp } from 'firebase/firestore';

  const activeChat = getActiveChatState();
  let friend = $derived(activeChat.friend);
  let friendId = $derived(friend?.id);

  // Firebase user id is used whenever there's no PocketBase session
  let fbUser = $state(null);
  let currentUserId = $derived(session.user?.id ?? fbUser?.uid);

  // Cache of Firestore uid -> username for message author labels
  let usernameCache = $state({});

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      fbUser = currentUser;
    });
    return () => unsubscribe();
  });

  let messages = $state([]);
  let inputText = $state('');
  let isSending = $state(false);
  let scrollContainer = $state(null);

  // 1. SVELTE 5 DERIVED STATE: Group consecutive messages
  let groupedMessages = $derived(
    messages.map((msg, index) => {
      const prevMsg = messages[index - 1];
      
      // Check if the previous message exists and was sent by the same person
      const isConsecutive = prevMsg && prevMsg.sender === msg.sender;
      
      // Optional: Break group if messages are more than 5 minutes apart
      const isTimeGap = prevMsg && (new Date(msg.created) - new Date(prevMsg.created) > 5 * 60 * 1000);

      const isFirstInGroup = !isConsecutive || isTimeGap;

      return { ...msg, isFirstInGroup };
    })
  );

  async function scrollToBottom() {
    await tick();
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  $effect(() => {
  const activeFriendId = friendId;
  const me = currentUserId;

  let cancelled = false;
  let subscribeTimeout;
  let unsubFirestore = null;

  // ---------- PocketBase path (unchanged behavior) ----------
  async function loadChatPb() {
    messages = [];
    if (!activeFriendId || !me) return;

    const chatFilter = `(sender = "${me}" && receiver = "${activeFriendId}") || (sender = "${activeFriendId}" && receiver = "${me}")`;

    try {
      // 1. Fetch historical messages
      const result = await pb.collection('messages').getFullList({
        filter: chatFilter,
        sort: 'created',
        expand: 'sender,receiver'
      });

      if (cancelled) return;
      messages = result;
      await scrollToBottom();

      // 2. Subscribe to new messages (Debounced to prevent HMR collisions)
      subscribeTimeout = setTimeout(async () => {
        if (cancelled) return;

        try {
          await pb.collection('messages').subscribe('*', async (event) => {
            if (cancelled || event.action !== 'create') return;

            const record = event.record;
            if (!messages.some((m) => m.id === record.id)) {
              messages = [...messages, record];
              await scrollToBottom();
            }
          }, { filter: chatFilter });
        } catch (err) {
          if (!cancelled && !err.isAbort) {
            console.error('Realtime subscription error:', err);
            if (err.status === 400) {
              pb.realtime.disconnect();
            }
          }
        }
      }, 150);

    } catch (error) {
      if (!cancelled && !error.isAbort) {
        console.error('Failed to load chat history:', error);
      }
    }
  }

  // ---------- Firestore path (Firebase-authenticated users) ----------
  function loadChatFirestore() {
    messages = [];
    if (!activeFriendId || !me) return;

    // Deterministic chat id so both participants hit the same thread
    const chatId = [me, activeFriendId].sort().join('_');

    // Sort client-side to avoid needing a composite index
    const q = query(collection(db, 'messages'), where('chatId', '==', chatId));

    unsubFirestore = onSnapshot(
      q,
      async (snap) => {
        if (cancelled) return;

        const docs = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              sender: data.sender,
              content: data.content,
              created: data.createdAt?.toDate?.()?.toISOString() ?? '',
              senderUsername: data.senderUsername
            };
          })
          .sort((a, b) => new Date(a.created) - new Date(b.created));

        messages = docs;

        // Resolve any unknown sender usernames for the group labels
        const unknownSenders = [...new Set(docs.map((m) => m.sender))].filter(
          (uid) => uid && usernameCache[uid] === undefined
        );
        if (unknownSenders.length > 0) {
          const resolved = {};
          await Promise.all(
            unknownSenders.map(async (uid) => {
              try {
                const userSnap = await getDoc(doc(db, 'users', uid));
                resolved[uid] = userSnap.exists() ? userSnap.data().username : null;
              } catch {
                resolved[uid] = null;
              }
            })
          );
          if (!cancelled) usernameCache = { ...usernameCache, ...resolved };
        }

        await scrollToBottom();
      },
      (err) => {
        if (!cancelled) console.error('Firestore chat listener error:', err);
      }
    );
  }

  if (session.isValid) {
    loadChatPb();
  } else if (fbUser) {
    loadChatFirestore();
  }

  return () => {
    cancelled = true;
    clearTimeout(subscribeTimeout);
    if (unsubFirestore) unsubFirestore();
    pb.collection('messages').unsubscribe('*').catch(() => {});
  };
});

  async function handleSend(e) {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !friendId || !currentUserId || isSending) return;

    isSending = true;
    inputText = '';

    try {
      if (session.isValid) {
        await pb.collection('messages').create({
          content: textToSend,
          sender: session.user.id,
          receiver: friendId
        });
      } else if (fbUser) {
        await addDoc(collection(db, 'messages'), {
          chatId: [currentUserId, friendId].sort().join('_'),
          sender: currentUserId,
          senderUsername: usernameCache[currentUserId] ?? fbUser.displayName ?? null,
          receiver: friendId,
          content: textToSend,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      isSending = false;
    }
  }
</script>

<div class="flex h-full flex-col overflow-hidden bg-surface-50-900-token">
  {#if !friend}
    <div class="flex h-full items-center justify-center text-sm text-surface-400">
      Select a friend to start chatting.
    </div>
  {:else}
  <!-- Header Bar -->
  <header class="flex h-16 shrink-0 items-center justify-between border-b border-surface-500/20 bg-surface-100-800-token px-6 shadow-sm z-10">
    <div class="flex items-center gap-3">
      <div class="avatar flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 font-bold text-white uppercase shadow">
        {friend?.name?.charAt(0) || friend?.username?.charAt(0) || '?'}
      </div>
      <div class="flex flex-col">
        <span class="font-semibold leading-tight">{friend?.name || friend?.username}</span>
        <span class="text-xs text-surface-400">@{friend?.username}</span>
      </div>
    </div>
  </header>

  <!-- Message History Feed -->
  <div bind:this={scrollContainer} class="flex-1 overflow-y-auto p-6 flex flex-col gap-1">
    {#if messages.length === 0}
      <div class="flex h-full items-center justify-center text-sm text-surface-400">
        No messages yet. Say hello! 👋
      </div>
    {/if}

    <!-- Loop through our NEW $derived grouped array -->
    {#each groupedMessages as msg (msg.id)}
      {@const isMe = msg.sender === currentUserId}
      
      <!-- Apply extra top margin only to the first message in a new group -->
      <div class="flex flex-col {isMe ? 'items-end' : 'items-start'} {msg.isFirstInGroup ? 'mt-4' : 'mt-1'}">
        
        <!-- Only show timestamp/name headers on the first message of the group -->
        {#if msg.isFirstInGroup}
          <span class="px-1 pb-1 text-[11px] text-surface-400 font-medium">
            {isMe ? 'You' : msg.senderUsername ?? usernameCache[msg.sender] ?? 'Unknown'} • {formatTime(msg.created)}
          </span>
        {/if}

        <div class="flex max-w-[75%] items-end gap-2 {isMe ? 'flex-row-reverse' : 'flex-row'}">
          <div
            class="rounded-2xl px-4 py-2.5 shadow-sm
            {isMe ? 'bg-[#0A84FF] text-white' : 'bg-[#E5E5EA] text-[#111111] dark:bg-[#e8efec] dark:text-black'}
            {msg.isFirstInGroup && isMe ? 'rounded-tr-md' : ''}
            {msg.isFirstInGroup && !isMe ? 'rounded-tl-md' : ''}"
          >
            <p class="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">{msg.content}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Message Input Form -->
  <footer class="shrink-0 border-t border-surface-500/20 bg-surface-100-800-token p-4">
    <form onsubmit={handleSend} class="flex items-center gap-2">
      <input
        type="text"
        bind:value={inputText}
        placeholder="Message @{friend?.username}..."
        class="input variant-form-material flex-1 rounded-xl bg-surface-50-900-token px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
      />
      <button
        type="submit"
        disabled={!inputText.trim() || isSending}
        class="btn variant-filled-primary h-10 px-5 font-semibold disabled:opacity-50 transition-opacity"
      >
        Send
      </button>
    </form>
  </footer>
  {/if}
</div>