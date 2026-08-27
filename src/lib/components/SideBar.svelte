<script>
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { page } from '$app/state';
  import { getSidebarState } from '$lib/stores/ui.svelte.js';
  import ChatCard from './ChatCard.svelte';

  const sidebar = getSidebarState();
  const { items = [], activeFriendId } = $props();
  
  let value = $state("All");
  
  // 1. Resizing state with bounds
  let width = $state(256); // Default 256px (w-64)
  let minWidth = 100;
  let maxWidth = 300;
  let isResizing = $state(false);

  let filteredItems = $derived(
    value === "All" 
      ? items 
      : items.filter((item) => item.type === value)
  );

  // 2. Drag handlers using Pointer Events (handles both mouse and touch)
  function startResizing(e) {
    isResizing = true;
    e.preventDefault();

    function onPointerMove(e) {
      if (!isResizing) return;
      // Clamp width between minWidth and maxWidth
      width = Math.min(Math.max(e.clientX, minWidth), maxWidth);
    }

    function stopResizing() {
      isResizing = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopResizing);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResizing);
  }
</script>

<!-- Disable text selection globally while actively dragging for a smooth experience -->
<div class="flex h-[calc(100vh-73px)] w-screen overflow-hidden bg-surface-50-900-token {isResizing ? 'select-none' : ''}">

  {#if sidebar.isOpen}
  <aside
    style="width: {width}px;"
    class="@container relative inset-y-0 left-0 z-50 flex flex-col border-r border-surface-500/20 bg-surface-100-800-token transition-transform duration-200 ease-in-out md:static md:translate-x-0 {sidebar.isOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <!-- <div class="flex flex-col items-center gap-4 py-4 ">
        <SegmentedControl {value} onValueChange={(details) => (value = details.value ?? "All")}>
            <SegmentedControl.Control>
                <SegmentedControl.Indicator />
                <SegmentedControl.Item value="All">
                    <SegmentedControl.ItemText>All</SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="DMs">
                    <SegmentedControl.ItemText>DMs</SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="Channels">
                    <SegmentedControl.ItemText>Channels</SegmentedControl.ItemText>
                    <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
            </SegmentedControl.Control>
        </SegmentedControl>
    </div> -->

    <!-- Navigation List -->
    <nav class="flex-1 space-y-1 overflow-y-auto p-4">
      {#each filteredItems as item (item.id)}
        <ChatCard {item} class={activeFriendId == item.id ? 'bg-primary-500/20 text-primary-500' : 'hover:bg-surface-200/50'} />
      {:else}
        <p class="p-2 text-sm text-surface-400">No items found.</p>
      {/each}
    </nav>

    <!-- 3. Drag Handle Bar -->
    <div
      role="separator"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      onpointerdown={startResizing}
      class="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary-500/50 active:bg-primary-500 transition-colors {isResizing ? 'bg-primary-500' : ''}"
    ></div>
  </aside>
  {/if}
</div>