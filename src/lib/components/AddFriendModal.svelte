<script>
  import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from '$fb/firebase';
  import { X, UserPlus, Search } from '@lucide/svelte';

  let { open = $bindable(false), currentUid = null, incomingRequests = [], onFriendsChanged } = $props();

  // Search state
  let searchTerm = $state('');
  let results = $state([]);
  let isSearching = $state(false);
  let sendingTo = $state(null);
  let message = $state('');

  function close() {
    open = false;
    searchTerm = '';
    results = [];
    message = '';
  }

  // Prefix search over the Firestore `users` collection by username
  async function searchUsers(e) {
    e?.preventDefault();
    message = '';
    results = [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    isSearching = true;
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('username', '>=', term), where('username', '<=', term + '\uf8ff'))
      );
      results = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.id !== currentUid);
      if (results.length === 0) {
        message = `No users found matching "${term}".`;
      }
    } catch (err) {
      console.error('User search error:', err);
      message = 'Search failed. Please try again.';
    } finally {
      isSearching = false;
    }
  }

  async function sendRequest(user) {
    message = '';
    sendingTo = user.id;
    try {
      // Duplicate check in both directions, any status
      const [sentByMe, sentToMe] = await Promise.all([
        getDocs(query(collection(db, 'friend_requests'), where('sender', '==', currentUid), where('receiver', '==', user.id))),
        getDocs(query(collection(db, 'friend_requests'), where('sender', '==', user.id), where('receiver', '==', currentUid)))
      ]);

      if (!sentByMe.empty || !sentToMe.empty) {
        message = `You already have a connection with @${user.username}.`;
        return;
      }

      await addDoc(collection(db, 'friend_requests'), {
        sender: currentUid,
        receiver: user.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      message = `Friend request sent to @${user.username}!`;
    } catch (err) {
      console.error('Friend request error:', err);
      message = 'Failed to send friend request. Please try again.';
    } finally {
      sendingTo = null;
    }
  }

  // Accept flips the request to accepted (the friend then appears in the sidebar);
  // Decline removes the request entirely.
  async function respondToRequest(request, action) {
    try {
      if (action === 'accept') {
        await updateDoc(doc(db, 'friend_requests', request.id), { status: 'accepted' });
      } else {
        await deleteDoc(doc(db, 'friend_requests', request.id));
      }
      onFriendsChanged?.();
    } catch (err) {
      console.error('Friend request response error:', err);
    }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    role="presentation"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
  >
    <div class="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-surface-500/20 bg-surface-100-800-token shadow-2xl">
      <!-- Header -->
      <div class="flex shrink-0 items-center justify-between border-b border-surface-500/20 p-4">
        <h3 class="text-lg font-bold text-surface-900-50-token">Add Friend</h3>
        <button
          type="button"
          onclick={close}
          class="btn-icon hover:preset-tonal cursor-pointer"
          aria-label="Close"
        >
          <X class="size-5" />
        </button>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <!-- Incoming Requests -->
        {#if incomingRequests.length > 0}
          <section>
            <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-600-300-token">
              Friend Requests ({incomingRequests.length})
            </h4>
            <ul class="space-y-2">
              {#each incomingRequests as request (request.id)}
                <li class="flex items-center justify-between gap-2 rounded-xl bg-surface-50-900-token p-3">
                  <div class="min-w-0">
                    <span class="block truncate text-sm font-semibold text-surface-900-50-token">
                      @{request.senderUsername || 'unknown'}
                    </span>
                    <span class="text-xs text-surface-400">wants to be your friend</span>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onclick={() => respondToRequest(request, 'accept')}
                      class="btn preset-filled-primary-500 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onclick={() => respondToRequest(request, 'decline')}
                      class="btn preset-tonal rounded-lg px-3 py-1.5 text-xs font-semibold"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              {/each}
            </ul>
          </section>
        {/if}

        <!-- Search Form -->
        <form onsubmit={searchUsers} class="flex gap-2">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search by username..."
            class="input preset-tonal flex-1 rounded-lg p-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={isSearching || !searchTerm.trim()}
            class="btn preset-filled-primary-500 rounded-lg px-4 text-sm font-semibold disabled:opacity-50"
          >
            <Search class="size-4" />
          </button>
        </form>

        {#if message}
          <p class="rounded-lg bg-surface-500/10 p-2.5 text-center text-sm text-surface-600-300-token">{message}</p>
        {/if}

        <!-- Search Results -->
        {#if results.length > 0}
          <ul class="space-y-2">
            {#each results as user (user.id)}
              <li class="flex items-center justify-between gap-2 rounded-xl bg-surface-50-900-token p-3">
                <div class="flex min-w-0 items-center gap-3">
                  {#if user.avatar?.startsWith('http')}
                    <img src={user.avatar} alt={user.username} class="size-10 shrink-0 rounded-full object-cover" />
                  {:else}
                    <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white uppercase">
                      {user.username?.charAt(0) || '?'}
                    </div>
                  {/if}
                  <div class="min-w-0">
                    <span class="block truncate text-sm font-semibold text-surface-900-50-token">{user.displayName || user.username}</span>
                    <span class="block truncate text-xs text-surface-400">@{user.username}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onclick={() => sendRequest(user)}
                  disabled={sendingTo === user.id}
                  class="btn preset-filled-primary-500 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                >
                  <UserPlus class="size-4" />
                  {sendingTo === user.id ? 'Sending...' : 'Add'}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
{/if}

