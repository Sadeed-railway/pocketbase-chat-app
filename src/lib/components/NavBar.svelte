<script lang="ts">
	import MenuIcon from '@lucide/svelte/icons/menu';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
	import { getSidebarState } from '$lib/stores/ui.svelte.js';

  	const sidebar = getSidebarState();
</script>

<AppBar class="bg-transparent">
	<AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
		<AppBar.Lead>
			<button type="button" class="btn-icon btn-icon-lg hover:preset-tonal" onclick={sidebar.toggle}><MenuIcon /></button>
		</AppBar.Lead>
		<AppBar.Headline>
			<p class="text-2xl">Chats</p>
		</AppBar.Headline>
		<AppBar.Trail>
			<Avatar class="size-10">
		<Avatar.Image src="https://api.dicebear.com/10.x/lorelei/svg" alt="base" />
		<Avatar.Fallback>SK</Avatar.Fallback>
	</Avatar>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
<hr class="hr" />
