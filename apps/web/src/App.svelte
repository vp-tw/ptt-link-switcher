<script lang="ts">
  import {
    articleIdToAid,
    generateProviderLinks,
    parsePttInput,
    providers,
    type ParseError,
    type ParseResult,
    type ProviderId,
    type ProviderLink,
  } from '@vp-tw/ptt-link-switcher'
  import {
    dragHandle,
    dragHandleZone,
    setAriaStrings,
    SOURCES,
    TRIGGERS,
    type DndEvent,
  } from 'svelte-dnd-action'
  import { onMount, tick } from 'svelte'

  import ProviderMark from './ProviderMark.svelte'
  import { preferences, resetPreferences, savePreferences, type Preferences } from './preferences.js'
  import {
    dismissPwaUpdate,
    pwaUpdateAvailable,
    updatePwa,
  } from './pwa-update.js'

  type ProviderOrderItem = {
    id: string
    providerId: ProviderId
    label: string
    isDndShadowItem?: boolean
  }

  const providerById = new Map(providers.map((provider) => [provider.id, provider]))
  const providerLabels = providers.map((provider) => provider.label).join(' · ')

  let input = $state('')
  let board = $state('')
  let result = $state<ParseResult | null>(null)
  let copiedProvider = $state<ProviderId | null>(null)
  let copyFailedProvider = $state<ProviderId | null>(null)
  let statusMessage = $state('')
  let preferenceState = $state<Preferences>(preferences.get())
  let showPwaUpdate = $state(pwaUpdateAvailable.get())
  let isMounted = $state(false)
  let isParsing = $state(false)
  let dndItems = $state<ProviderOrderItem[] | null>(null)
  let isSorting = $state(false)

  setAriaStrings({
    dragStarted: ({ itemLabel, zoneLabel, canMoveBetweenZones }) =>
      `已開始移動 ${itemLabel}。使用方向鍵調整在「${zoneLabel}」中的位置${canMoveBetweenZones ? '，也可以切換到其他排序區域' : ''}。按空白鍵或 Enter 完成，Escape 結束。`,
    movedToPosition: ({ itemLabel, zoneLabel, position }) =>
      `${itemLabel} 已移到「${zoneLabel}」的第 ${position} 位。`,
    movedToZoneEnd: ({ itemLabel, zoneLabel }) =>
      `${itemLabel} 已移到「${zoneLabel}」的最後一位。`,
    movedToZoneStart: ({ itemLabel, zoneLabel }) =>
      `${itemLabel} 已移到「${zoneLabel}」的第一位。`,
    dropped: ({ itemLabel, zoneLabel, position, count }) =>
      `${itemLabel} 已放在「${zoneLabel}」的第 ${position} 位，共 ${count} 個項目。`,
    zoneActiveInstruction: '移到項目後按空白鍵或 Enter 開始排序。',
    zoneDragDisabledInstruction: '請使用設定清單中的拖曳把手調整順序。',
  })

  const article = $derived(result?.ok === true ? result.article : null)
  const missingBoard = $derived(
    result?.ok === false && result.error.code === 'missing_board',
  )
  const providerLinks = $derived.by(() => {
    if (article === null) return []
    const links = generateProviderLinks(article)
    const linkById = new Map(links.map((link) => [link.id, link]))
    const visibleOrder = preferenceState.providerOrder.filter(
      (id) => !preferenceState.hiddenProviders.includes(id),
    )
    return visibleOrder.flatMap((id) => {
      const link = linkById.get(id)
      return link === undefined ? [] : [link]
    })
  })
  const settingsProviders = $derived<ProviderOrderItem[]>(
    dndItems ?? preferenceState.providerOrder.map((id) => ({
      id,
      providerId: id,
      label: providerById.get(id)?.label ?? id,
    })),
  )
  const defaultLink = $derived(
    providerLinks.find((link) => link.id === preferenceState.defaultProvider) ?? null,
  )

  $effect(() => {
    if (article === null) {
      dndItems = null
      isSorting = false
    }
  })

  $effect(() => {
    const pendingInput = input
    const pendingBoard = board
    if (!isMounted) return

    if (pendingInput.trim().length === 0) {
      result = null
      isParsing = false
      syncQuery()
      return
    }

    isParsing = true
    const timeout = window.setTimeout(() => {
      parse(pendingInput, pendingBoard)
      isParsing = false
    }, 180)
    return () => window.clearTimeout(timeout)
  })

  onMount(() => {
    const queryInput = new URLSearchParams(window.location.search).get('input')
    if (queryInput !== null) {
      input = queryInput
    }
    isMounted = true
    const unsubscribe = preferences.subscribe((next) => {
      preferenceState = next
    })
    const unsubscribePwaUpdate = pwaUpdateAvailable.subscribe((available) => {
      showPwaUpdate = available
    })
    return () => {
      unsubscribe()
      unsubscribePwaUpdate()
    }
  })

  function errorMessage(error: ParseError): string {
    switch (error.code) {
      case 'empty_input':
        return '請貼上 PTT 文章網址、分享文字或完整 AID。'
      case 'invalid_aid':
        return 'AID 或看板名稱格式不正確，請檢查後再試一次。'
      case 'missing_board':
        return '完整 AID 不含看板資料；補上看板名稱即可離線轉換。'
      case 'unsupported_provider':
        return `目前不支援 ${error.host}，請改貼支援的閱讀站網址：${providerLabels}。`
      case 'unrecognized_input':
        return '找不到可辨識的 PTT 文章網址或完整 AID。'
    }
  }

  function syncQuery(): void {
    const url = new URL(window.location.href)
    if (input.trim().length === 0) url.searchParams.delete('input')
    else url.searchParams.set('input', input.trim())
    history.replaceState(null, '', url)
  }

  function parse(pendingInput = input, pendingBoard = board): void {
    result = parsePttInput(
      pendingInput,
      pendingBoard.trim() ? { board: pendingBoard } : {},
    )
    copiedProvider = null
    copyFailedProvider = null
    statusMessage = ''
    syncQuery()
  }

  function useExample(): void {
    input = 'https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html'
    board = ''
  }

  async function copyLink(link: ProviderLink<ProviderId>): Promise<void> {
    try {
      await navigator.clipboard.writeText(link.url)
      copiedProvider = link.id
      copyFailedProvider = null
      statusMessage = `${link.label} 網址已複製。`
    } catch {
      copiedProvider = null
      copyFailedProvider = link.id
      statusMessage = `${link.label} 網址複製失敗，請直接選取網址。`
    }
    window.setTimeout(() => {
      if (copiedProvider === link.id) copiedProvider = null
      if (copyFailedProvider === link.id) copyFailedProvider = null
    }, 1800)
  }

  function resetReaderPreferences(): void {
    resetPreferences()
    dndItems = null
    copiedProvider = null
    copyFailedProvider = null
    statusMessage = '已重設閱讀站偏好。'
  }

  function updateDefault(defaultProvider: ProviderId): void {
    savePreferences({ ...preferenceState, defaultProvider })
  }

  function toggleVisibility(id: ProviderId): void {
    const isHidden = preferenceState.hiddenProviders.includes(id)
    const visibleProviders = preferenceState.providerOrder.filter(
      (providerId) => !preferenceState.hiddenProviders.includes(providerId),
    )
    if (!isHidden && visibleProviders.length === 1) return

    const hiddenProviders = isHidden
      ? preferenceState.hiddenProviders.filter((providerId) => providerId !== id)
      : [...preferenceState.hiddenProviders, id]
    const defaultProvider =
      !isHidden && preferenceState.defaultProvider === id
        ? (visibleProviders.find((providerId) => providerId !== id) ?? id)
        : preferenceState.defaultProvider
    savePreferences({ ...preferenceState, defaultProvider, hiddenProviders })
  }

  async function finishProviderMove(
    id: ProviderId,
    orderedIds: readonly ProviderId[],
    trigger: HTMLButtonElement,
  ): Promise<void> {
    const provider = providerById.get(id)
    statusMessage = `${provider?.label ?? id} 已移至第 ${orderedIds.indexOf(id) + 1} 位，共 ${orderedIds.length} 站。`
    await tick()
    if (!trigger.isConnected) return
    const focusTarget = trigger.disabled
      ? trigger.closest('.settings-row')?.querySelector<HTMLElement>('.reader-name')
      : trigger
    focusTarget?.focus({ preventScroll: true })
    focusTarget?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }

  async function moveProvider(
    id: ProviderId,
    offset: -1 | 1,
    trigger: HTMLButtonElement,
  ): Promise<void> {
    const currentIndex = preferenceState.providerOrder.indexOf(id)
    const nextIndex = currentIndex + offset
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= providers.length) return
    const providerOrder = [...preferenceState.providerOrder]
    ;[providerOrder[currentIndex], providerOrder[nextIndex]] = [
      providerOrder[nextIndex]!,
      providerOrder[currentIndex]!,
    ]
    savePreferences({ ...preferenceState, providerOrder })
    await finishProviderMove(id, providerOrder, trigger)
  }

  async function previewProviderOrder(event: CustomEvent<DndEvent<ProviderOrderItem>>): Promise<void> {
    if (
      event.detail.info.source === SOURCES.KEYBOARD &&
      event.detail.info.trigger === TRIGGERS.DRAG_STOPPED
    ) {
      isSorting = false
      dndItems = null
      const zone = event.currentTarget
      if (!(zone instanceof HTMLElement)) return
      await tick()
      if (document.activeElement !== document.body) return
      const index = settingsProviders.findIndex((provider) => provider.id === event.detail.info.id)
      zone.children[index]?.querySelector<HTMLElement>('.reader-name')?.focus({ preventScroll: true })
      return
    }
    isSorting = true
    dndItems = event.detail.items
  }

  function saveProviderOrder(event: CustomEvent<DndEvent<ProviderOrderItem>>): void {
    if (event.detail.info.source === SOURCES.POINTER) isSorting = false
    savePreferences({
      ...preferenceState,
      providerOrder: event.detail.items.map((provider) => provider.providerId),
    })
    dndItems = null
  }
</script>

<svelte:head>
  <link rel="canonical" href="https://vp-tw.github.io/ptt-link-switcher/" />
</svelte:head>

<header class="site-header">
  <a class="brand" href="./" aria-label="PTT Link Switcher 首頁">
    <img
      class="brand-mark"
      src="./brand-mark-128.png"
      srcset="./brand-mark-128.png 2x, ./brand-mark-256.png 4x"
      width="64"
      height="32"
      alt=""
    />
    <span>PTT LINK<br />SWITCHER</span>
  </a>
  <p>閱讀站轉乘 · 全程離線</p>
</header>

<main>
  <section class="intro" aria-labelledby="page-title">
    <h1 id="page-title">貼一次，<br /><em>換站也能看。</em></h1>
    <p>
      貼上文章網址、分享文字或完整 AID。解析只在瀏覽器內完成，不會送出你的輸入。
    </p>
  </section>

  <section class="manifest" aria-labelledby="manifest-title">
    <div class="manifest-heading">
      <h2 id="manifest-title">文章轉乘單</h2>
    </div>
    <div class="converter-fields">
      <label for="ptt-input">文章網址、分享文字或完整 AID</label>
      <div class="input-row">
        <textarea
          id="ptt-input"
          bind:value={input}
          placeholder="例如 https://www.ptt.cc/bbs/... 或 #1eMgfVyi"
          rows="2"
          spellcheck="false"
        ></textarea>
        <div class:parsing={isParsing} class="conversion-status" role="status" aria-live="polite">
          {#if isParsing}
            <strong>辨識路線中</strong>
          {:else if article !== null}
            <strong>網址已轉換</strong>
            {#if defaultLink}
              <a href={defaultLink.url} target="_blank" rel="noreferrer">開啟預設閱讀站</a>
            {/if}
          {:else if missingBoard}
            <strong>需要看板名稱</strong>
          {:else if result?.ok === false}
            <strong>尚未辨識</strong>
          {:else}
            <strong>輸入即時更新</strong>
          {/if}
        </div>
      </div>
      <div class="input-meta">
        <button class="text-button" type="button" onclick={useExample}>填入範例</button>
        {#if article === null}<span>支援 {providerLabels}</span>{/if}
      </div>

      {#if missingBoard}
        <div class="board-field">
          <label for="board-input">看板名稱</label>
          <input
            id="board-input"
            bind:value={board}
            placeholder="例如 Browsers"
            autocomplete="off"
            spellcheck="false"
          />
          <span>輸入後會自動接續轉換</span>
        </div>
      {/if}
    </div>
  </section>

  {#if result?.ok === false}
    <section class="error-strip" role="alert">
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 2 21h20L12 3Zm0 6v5m0 3v1" /></svg>
      <div>
        <strong>轉乘單未成立</strong>
        <p>{errorMessage(result.error)}</p>
      </div>
    </section>
  {:else if article !== null}
    <section class="canonical" aria-labelledby="canonical-title">
      <div>
        <span id="canonical-title">CANONICAL ROUTE</span>
        <dl>
          <div><dt>看板</dt><dd>{article.board}</dd></div>
          <div><dt>文章 ID</dt><dd>{article.articleId}</dd></div>
          <div><dt>完整 AID</dt><dd>{articleIdToAid(article.articleId) ?? '—'}</dd></div>
        </dl>
      </div>
      <div class="route-stamp" aria-label="解析成功">ROUTE<br />VERIFIED</div>
    </section>

    <section class="providers-section" aria-labelledby="providers-title">
      <div class="section-heading">
        <div>
          <h2 id="providers-title">選擇閱讀站</h2>
          <p>所有可用路線一次攤開；排序與顯示可在設定中調整。</p>
        </div>
        <details class="settings">
          <summary>排列與顯示設定</summary>
          <div class="settings-sheet">
            <p>拖曳把手或使用上下移調整順序，也可選擇預設站與顯示項目。</p>
            <ol
              class="settings-order"
              aria-label="閱讀站排序"
              use:dragHandleZone={{
                items: settingsProviders,
                dropTargetClasses: ['settings-order--sorting'],
                useCursorForDetection: true,
              }}
              onconsider={previewProviderOrder}
              onfinalize={saveProviderOrder}
            >
              {#each settingsProviders as provider, index (provider.id)}
                {@const id = provider.providerId}
                <li
                  class="settings-row"
                  aria-label={`${provider.label} 排序設定`}
                  inert={provider.isDndShadowItem ?? false}
                >
                  <span class="reader-name" tabindex="-1">{provider.label}</span>
                  <label>
                    <input
                      type="radio"
                      disabled={isSorting}
                      name="default-provider"
                      checked={preferenceState.defaultProvider === id}
                      onchange={() => updateDefault(id)}
                    />
                    預設
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={!preferenceState.hiddenProviders.includes(id)}
                      disabled={
                        isSorting || (
                          !preferenceState.hiddenProviders.includes(id) &&
                          preferenceState.hiddenProviders.length === providers.length - 1
                        )
                      }
                      onchange={() => toggleVisibility(id)}
                    />
                    顯示
                  </label>
                  <div class="sort-controls">
                    <span
                      aria-label={`拖曳以調整 ${provider.label} 的順序`}
                      class="drag-handle"
                      use:dragHandle
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M8 7h.01M16 7h.01M8 12h.01M16 12h.01M8 17h.01M16 17h.01" />
                      </svg>
                    </span>
                    <span class="order-buttons">
                      <button
                        type="button"
                        aria-label={`將 ${provider.label} 上移`}
                        disabled={isSorting || index === 0}
                        onclick={(event) => moveProvider(id, -1, event.currentTarget)}
                      >上移</button>
                      <button
                        type="button"
                        aria-label={`將 ${provider.label} 下移`}
                        disabled={isSorting || index === preferenceState.providerOrder.length - 1}
                        onclick={(event) => moveProvider(id, 1, event.currentTarget)}
                      >下移</button>
                    </span>
                  </div>
                </li>
              {/each}
            </ol>
            <button class="reset-preferences" type="button" disabled={isSorting} onclick={resetReaderPreferences}>
              重設閱讀站偏好
            </button>
          </div>
        </details>
      </div>

      <div class="provider-grid">
        {#each providerLinks as link (link.id)}
          <article aria-label={`${link.label} 閱讀站`} class="provider-ticket">
            <div class="ticket-head">
              <ProviderMark id={link.id} />
              <div>
                <h3>{link.label}</h3>
                {#if link.id === preferenceState.defaultProvider}
                  <span class="default-tag">預設閱讀站</span>
                {/if}
              </div>
            </div>
            <div class="ticket-actions">
              <input
                class="provider-url"
                aria-label={`${link.label} 文章網址`}
                value={link.url}
                readonly
                spellcheck="false"
              />
              <button type="button" aria-label={`複製 ${link.label} 網址`} onclick={() => copyLink(link)}>
                {copiedProvider === link.id
                  ? '已複製'
                  : copyFailedProvider === link.id
                    ? '複製失敗'
                    : '複製'}
              </button>
              <a href={link.url} target="_blank" rel="noreferrer">
                開啟
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7m-8 0h8v8" /></svg>
              </a>
            </div>
          </article>
        {/each}
      </div>
      <p class="interaction-status" role="status" aria-live="polite">{statusMessage}</p>
    </section>
  {:else}
    <section class="empty-route" aria-label="等待輸入">
      <span>READY FOR DISPATCH</span>
      <p>輸入一篇 PTT 文章，支援的閱讀路線會在這裡一次展開。</p>
    </section>
  {/if}
</main>

{#if showPwaUpdate}
  <aside class="update-prompt" aria-labelledby="update-title">
    <div>
      <span>NEW ROUTE READY</span>
      <strong id="update-title">新版已準備完成</strong>
      <p>立即重新載入，使用最新版本。</p>
    </div>
    <div class="update-actions">
      <button type="button" onclick={dismissPwaUpdate}>稍後</button>
      <button type="button" onclick={updatePwa}>立即更新</button>
    </div>
  </aside>
{/if}

<footer>
  <p>
    Offline by design ·
    <a href="https://github.com/vp-tw/ptt-link-switcher/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a>
  </p>
  <a href="https://github.com/vp-tw/ptt-link-switcher" target="_blank" rel="noreferrer">
    GitHub · vp-tw/ptt-link-switcher
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7m-8 0h8v8" /></svg>
  </a>
</footer>
