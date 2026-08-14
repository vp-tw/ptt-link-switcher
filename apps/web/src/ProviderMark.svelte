<script lang="ts">
  import type { ProviderId } from '@vp-tw/ptt-link-switcher'

  let { id }: { id: ProviderId } = $props()
</script>

<svg aria-hidden="true" class="provider-mark" viewBox="0 0 48 48">
  {#if id === 'official'}
    <path d="M9 8h30v32H9zM15 15h18M15 22h18M15 29h11" />
    <path d="m30 29 5 5m0-5-5 5" />
  {:else if id === 'beptt'}
    <path d="M12 8h17c6 0 10 3 10 8 0 4-2 6-6 7 5 1 7 4 7 8 0 6-4 9-11 9H12z" />
    <path d="M20 16h8c2 0 3 1 3 3s-1 3-3 3h-8m0 7h9c2 0 3 1 3 3s-1 3-3 3h-9" />
  {:else if id === 'moptt'}
    <path d="M8 39V9l16 15L40 9v30" />
    <circle cx="24" cy="24" r="4" />
  {:else}
    <path d="M7 13h34v26H7zM7 13l6-6h28v32" />
    <path d="M15 22h18M15 29h12" />
  {/if}
</svg>
