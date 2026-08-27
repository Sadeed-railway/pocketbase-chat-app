<script>
	import NavBar from '$lib/components/NavBar.svelte';
    import { setSidebarState } from '$lib/stores/ui.svelte.js';
	import { setActiveChatState } from '$lib/stores/chat.svelte.js';

	setSidebarState();
	setActiveChatState();

	let { children } = $props();
</script>

<div class="h-full">
	<NavBar />
	{@render children()}
</div>