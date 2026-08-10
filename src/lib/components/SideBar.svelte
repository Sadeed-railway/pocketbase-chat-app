<script>
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { page } from '$app/state';
  import { getSidebarState } from '$lib/stores/ui.svelte.js';
  import ChatCard from './ChatCard.svelte';

  const sidebar = getSidebarState();
  
  let value = $state("All");
</script>

<div class="flex h-screen w-screen overflow-hidden bg-surface-50-900-token">

  {#if sidebar.isOpen}
  <aside
    class="inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-500/20 bg-surface-100-800-token transition-transform duration-200 ease-in-out md:static md:translate-x-0 {sidebar.isOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="flex flex-col items-center gap-4 pt-4">
        <SegmentedControl {value} onValueChange={(details) => (value = details.value ?? null)}>
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
    </div>

    <!-- Navigation List -->
    <nav class="flex-1 space-y-1 overflow-y-auto p-4">
     {#if value === 'All'}
        <ChatCard info={{ name: 'General' }} />
        <ChatCard info={{ name: 'John Doe' }} />
      {:else if value === 'Channels'}
        <ChatCard info={{ name: 'General' }} />
      {:else if value === 'DMs'}
        <ChatCard info={{ name: 'John Doe' }} />
      {/if}

    </nav>
  </aside>
  {/if}
</div>
