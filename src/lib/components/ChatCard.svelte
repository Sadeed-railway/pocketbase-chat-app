<script>
    let { item } = $props();
</script>
<div class="rounded-[0.75rem] bg-[#28243e] card w-full max-w-md preset-filled-surface-100-900 p-4 text-center hover:bg-[#28243e94] cursor-pointer">

    <span>{item.icon}</span>
    <span>{item.title}</span>
</div>