<script>
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { pb } from '$pb/pocketbase.svelte.js';
    let { item, class: className = '', isActive = false, onSelect = () => {} } = $props();

    // Safely derive the URL reactively and fix method casing (.getUrl)
    let url = $derived(
        item?.id && item?.avatar 
            ? pb.files.getURL(item, item.avatar) 
            : ''
    );
</script>

<button
    type="button"
    onclick={onSelect}
    class="
    flex flex-row w-full items-center justify-start gap-3 rounded-xl p-4 cursor-pointer
    bg-[#28243e] hover:bg-[#28243e94]
    {isActive ? 'bg-primary-500/20 text-primary-500' : ''}

    aspect-square h-18 justify-center mx-auto

    @min-[180px]:w-full @min-[180px]:h-auto @min-[180px]:aspect-auto @min-[180px]:flex-row
    {className}
">
    <Avatar class="size-10 shrink-0">
    {#if url}
        <Avatar.Image src={url} alt={item.username?.charAt(0).toUpperCase()} class="size-full object-cover rounded-full" />
    {/if}
        <Avatar.Fallback>{item.username?.charAt(0).toUpperCase()}</Avatar.Fallback>
    </Avatar>
    <span class="text-lg truncate @min-[120px]:block hidden">{item.username}</span>
</button>