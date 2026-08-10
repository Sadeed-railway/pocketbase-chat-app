<script>
    import SideBar from '$lib/components/SideBar.svelte';

    const items = $state([
    { id: 1, title: 'General Announcements', type: 'Channels', href: '/channels/general', icon: '📢' },
    { id: 2, title: 'John Doe', type: 'DMs', href: '/chats/john-doe', icon: '💬' },
    { id: 3, title: 'Dev Team', type: 'Channels', href: '/channels/dev-team', icon: '📢' },
    { id: 4, title: 'Jane Smith', type: 'DMs', href: '/chats/jane-smith', icon: '💬' },
    { id: 5, title: 'Settings', type: 'System', href: '/settings', icon: '⚙️' },
    { id: 6, title: 'Dev Team', type: 'Channels', href: '/channels/dev-team', icon: '📢' },
    { id: 7, title: 'Jane Smith', type: 'DMs', href: '/chats/jane-smith', icon: '💬' },
    { id: 8, title: 'Dev Team', type: 'Channels', href: '/channels/dev-team', icon: '📢' },
    { id: 9, title: 'Jane Smith', type: 'DMs', href: '/chats/jane-smith', icon: '💬' },
  ]);
</script>

<SideBar {items} />