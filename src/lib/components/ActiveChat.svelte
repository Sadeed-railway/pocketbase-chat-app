<script>
  import { tick } from 'svelte';
  import { pb, session } from '$pb/pocketbase.svelte.js';
  import { getActiveChatState } from '$lib/stores/chat.svelte.js';

  const activeChat = getActiveChatState();
  let friend = $derived(activeChat.friend);
  let friendId = $derived(friend?.id);

  let messages = $state([]);
  let inputText = $state('');
  let isSending = $state(false);
  let scrollContainer = $state(null);

  const currentUser = session.user;

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
    const currentUserId = session.user?.id;
    let unsubscribeFn;

    async function loadChat() {
      messages = [];
      if (!activeFriendId || !currentUserId) return;

      const chatFilter = `(sender = "${currentUserId}" && receiver = "${activeFriendId}") || (sender = "${activeFriendId}" && receiver = "${currentUserId}")`;

      messages = await pb.collection('messages').getFullList({
        filter: chatFilter,
        sort: 'created',
        expand: 'sender,receiver'
      });
      await scrollToBottom();

      unsubscribeFn = await pb.collection('messages').subscribe(
        '*',
        async (e) => {
          if (e.action === 'create') {
            const newMsg = await pb.collection('messages').getOne(e.record.id, { expand: 'sender,receiver' });
            if (newMsg.sender === activeFriendId || newMsg.receiver === activeFriendId) {
              messages.push(newMsg);
              await scrollToBottom();
            }
          }
        },
        { filter: chatFilter }
      );
    }

    loadChat();

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
  });

  async function handleSend(e) {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !friendId || !session.user?.id || isSending) return;

    isSending = true;
    inputText = '';

    try {
      await pb.collection('messages').create({
        content: textToSend,
        sender: session.user.id,
        receiver: friendId
      });
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
      {@const isMe = msg.sender === currentUser?.id}
      
      <!-- Apply extra top margin only to the first message in a new group -->
      <div class="flex flex-col {isMe ? 'items-end' : 'items-start'} {msg.isFirstInGroup ? 'mt-4' : 'mt-1'}">
        
        <!-- Only show timestamp/name headers on the first message of the group -->
        {#if msg.isFirstInGroup}
          <span class="px-1 pb-1 text-[11px] text-surface-400 font-medium">
            {isMe ? 'You' : msg.expand?.sender?.username} • {formatTime(msg.created)}
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