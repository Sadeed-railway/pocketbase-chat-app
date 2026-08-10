<script>
	import NavBar from '$lib/components/NavBar.svelte';
    import { setSidebarState } from '$lib/stores/ui.svelte.js';

	setSidebarState();

	let { children } = $props();
</script>

<div class="w-full">
	<NavBar />
	{@render children()}
</div>