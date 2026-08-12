<script>
    let { item } = $props();
</script>

<div class="
    /* Default: Rectangular, full-width row */
    flex w-full items-center justify-start gap-3 rounded-xl p-4 cursor-pointer
    bg-[#28243e] hover:bg-[#28243e94]

    /* Narrow Mode (< 220px): Force a specific 64px x 64px Square */
    aspect-square w-auto h-15 flex-col justify-center mx-auto

    /* Wide Mode (>= 220px): Expand back to full width rectangle */
    @min-[180px]:w-full @min-[180px]:h-auto @min-[180px]:aspect-auto @min-[180px]:flex-row
">
    <span class="text-xl">{item.icon}</span>
    <span class="text-xs truncate">{item.title}</span>
</div>