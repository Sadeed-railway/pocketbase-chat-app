<script lang="ts">
    import MenuIcon from '@lucide/svelte/icons/menu';
    import { AppBar, Avatar, Menu, Portal } from '@skeletonlabs/skeleton-svelte';
    import { getSidebarState } from '$lib/stores/ui.svelte.js';
    import { pb, session, logout } from '$pb/pocketbase.svelte.js';
    import { signOut } from 'firebase/auth';
    import { auth } from '$fb/firebase';
    import { onMount } from 'svelte';
    import { LogOut } from '@lucide/svelte';

    let mounted = $state(false);

    onMount(() => {
        mounted = true;
    });

    // Sign out from both auth sources so the user fully logs out
    async function handleLogout() {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Firebase sign-out error:', err);
        }
        logout();
    }

    let url = $derived(
        session.user?.id && session.user?.avatar
            ? pb.files.getURL(session.user, session.user.avatar)
            : ''
    );

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
        <button type="button" class="btn-icon btn-icon-lg hover:preset-tonal" onclick={handleLogout}>
            <LogOut />
        </button>
            <!-- <Menu>
                <Menu.Trigger class="rounded-lg p-1 hover:preset-tonal cursor-pointer">
                    <Avatar class="size-10">
                        {#if mounted && url}
                            <Avatar.Image src={url} alt="base" class="size-10" />
                        {/if}
                        <Avatar.Fallback>{session.user?.username?.charAt(0).toUpperCase() ?? 'U'}</Avatar.Fallback>
                    </Avatar>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            <Menu.Item value="logout" onclick={logout}>Logout</Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu> -->
        </AppBar.Trail>
    </AppBar.Toolbar>
</AppBar>
<hr class="hr" />