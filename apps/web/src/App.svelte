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
    type DndEvent,
  } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import { onMount } from 'svelte'

  import ProviderMark from './ProviderMark.svelte'
  import { preferences, savePreferences, type Preferences } from './preferences.js'
  import {
    dismissPwaUpdate,
    pwaUpdateAvailable,
    updatePwa,
  } from './pwa-update.js'

  type ProviderDndLink = ProviderLink<ProviderId> & { isDndShadowItem?: boolean }

  const providerById = new Map(providers.map((provider) => [provider.id, provider]))
  const providerLabels = providers.map((provider) => provider.label).join(' · ')

  let input = $state('')
  let board = $state('')
  let result = $state<ParseResult | null>(null)
  let copiedProvider = $state<ProviderId | null>(null)
  let copyFailedProvider = $state<ProviderId | null>(null)
  let copyFeedback = $state('')
  let preferenceState = $state<Preferences>(preferences.get())
  let showPwaUpdate = $state(pwaUpdateAvailable.get())
  let isMounted = $state(false)
  let isParsing = $state(false)
  let dndLinks = $state<ProviderDndLink[] | null>(null)

  const flipDurationMs = 180

  setAriaStrings({
    dragStarted: ({ itemLabel, zoneLabel, canMoveBetweenZones }) =>
      `已開始移動 ${itemLabel}。使用方向鍵調整在「${zoneLabel}」中的位置${canMoveBetweenZones ? '，也可以切換到其他排序區域' : ''}。`,
    movedToPosition: ({ itemLabel, zoneLabel, position }) =>
      `${itemLabel} 已移到「${zoneLabel}」的第 ${position} 位。`,
    movedToZoneEnd: ({ itemLabel, zoneLabel }) =>
      `${itemLabel} 已移到「${zoneLabel}」的最後一位。`,
    movedToZoneStart: ({ itemLabel, zoneLabel }) =>
      `${itemLabel} 已移到「${zoneLabel}」的第一位。`,
    dropped: ({ itemLabel, zoneLabel, position, count }) =>
      `${itemLabel} 已放在「${zoneLabel}」的第 ${position} 位，共 ${count} 個項目。`,
    zoneActiveInstruction: '移到項目後按空白鍵或 Enter 開始排序。',
    zoneDragDisabledInstruction: '請使用票券上的拖曳把手調整順序。',
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
    const linksInSavedOrder = visibleOrder.flatMap((id) => {
      const link = linkById.get(id)
      return link === undefined ? [] : [link]
    })
    if (dndLinks === null) return linksInSavedOrder
    const currentIds = new Set(linksInSavedOrder.map((link) => link.id))
    return dndLinks.filter((link) => currentIds.has(link.id) || link.isDndShadowItem)
  })
  const defaultLink = $derived(
    providerLinks.find((link) => link.id === preferenceState.defaultProvider) ?? null,
  )

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
        return `目前不支援 ${error.host}，請改貼 PTT 官方、BePTT、MoPTT 或 PTTweb 網址。`
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
    copyFeedback = ''
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
      copyFeedback = `${link.label} 網址已複製。`
    } catch {
      copiedProvider = null
      copyFailedProvider = link.id
      copyFeedback = `${link.label} 網址複製失敗，請直接選取網址。`
    }
    window.setTimeout(() => {
      if (copiedProvider === link.id) copiedProvider = null
      if (copyFailedProvider === link.id) copyFailedProvider = null
    }, 1800)
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

  function moveProvider(id: ProviderId, offset: -1 | 1): void {
    const currentIndex = preferenceState.providerOrder.indexOf(id)
    const nextIndex = currentIndex + offset
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= providers.length) return
    const providerOrder = [...preferenceState.providerOrder]
    ;[providerOrder[currentIndex], providerOrder[nextIndex]] = [
      providerOrder[nextIndex]!,
      providerOrder[currentIndex]!,
    ]
    savePreferences({ ...preferenceState, providerOrder })
  }

  function moveVisibleProvider(id: ProviderId, offset: -1 | 1): void {
    const visibleOrder = preferenceState.providerOrder.filter(
      (providerId) => !preferenceState.hiddenProviders.includes(providerId),
    )
    const currentIndex = visibleOrder.indexOf(id)
    const adjacentId = visibleOrder[currentIndex + offset]
    if (adjacentId === undefined) return

    const providerOrder = [...preferenceState.providerOrder]
    const adjacentIndex = providerOrder.indexOf(adjacentId)
    const fullIndex = providerOrder.indexOf(id)
    ;[providerOrder[fullIndex], providerOrder[adjacentIndex]] = [
      providerOrder[adjacentIndex]!,
      providerOrder[fullIndex]!,
    ]
    savePreferences({ ...preferenceState, providerOrder })
  }

  function mergeVisibleOrder(visibleOrder: ProviderId[]): ProviderId[] {
    const visibleIds = new Set(visibleOrder)
    let visibleIndex = 0
    return preferenceState.providerOrder.map((id) =>
      visibleIds.has(id) ? visibleOrder[visibleIndex++]! : id,
    )
  }

  function previewProviderOrder(event: CustomEvent<DndEvent>): void {
    dndLinks = event.detail.items as ProviderDndLink[]
  }

  function saveProviderOrder(event: CustomEvent<DndEvent>): void {
    const links = event.detail.items as ProviderDndLink[]
    dndLinks = links
    savePreferences({
      ...preferenceState,
      providerOrder: mergeVisibleOrder(links.map((link) => link.id)),
    })
    dndLinks = null
  }
</script>

<svelte:head>
  <link rel="canonical" href="https://vp-tw.github.io/ptt-link-switcher/" />
</svelte:head>

<header class="site-header">
  <a class="brand" href="./" aria-label="PTT Link Switcher 首頁">
    <svg aria-hidden="true" class="brand-mark" viewBox="0 0 56 36">
      <path class="brand-mark-signal" d="M8 4h12v28H8l-6-6V10z" />
      <path class="brand-mark-ticket" d="M8 4h40l6 6v16l-6 6H8l-6-6V10z" />
      <path class="brand-mark-divider" d="M20 4v28" />
      <path class="brand-mark-input" d="M8 18h12" />
      <path class="brand-mark-route" d="M20 18h5m0 0 9-9h10m-19 9 9 9h10" />
      <circle class="brand-mark-node" cx="25" cy="18" r="2.5" />
      <circle class="brand-mark-node" cx="44" cy="9" r="2.5" />
      <circle class="brand-mark-node" cx="44" cy="27" r="2.5" />
    </svg>
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
      <span>ROUTE / 001</span>
    </div>
    <div class="converter-fields">
      <label for="ptt-input">文章網址、分享文字或完整 AID</label>
      <div class="input-row">
        <textarea
          id="ptt-input"
          bind:value={input}
          placeholder="例如 https://www.ptt.cc/bbs/... 或 #1eMgfVyi"
          rows="3"
          spellcheck="false"
        ></textarea>
        <div class:parsing={isParsing} class="conversion-status" role="status" aria-live="polite">
          {#if isParsing}
            <span>正在更新</span>
            <strong>辨識路線中</strong>
          {:else if article !== null}
            <span>ROUTE READY</span>
            <strong>網址已轉換</strong>
            {#if defaultLink}
              <a href={defaultLink.url} target="_blank" rel="noreferrer">開啟預設閱讀站</a>
            {/if}
          {:else if missingBoard}
            <span>BOARD NEEDED</span>
            <strong>需要看板名稱</strong>
          {:else if result?.ok === false}
            <span>CHECK INPUT</span>
            <strong>尚未辨識</strong>
          {:else}
            <span>LIVE CONVERSION</span>
            <strong>輸入即時更新</strong>
          {/if}
        </div>
      </div>
      <div class="input-meta">
        <button class="text-button" type="button" onclick={useExample}>填入範例</button>
        <span>支援 {providerLabels}</span>
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
          <p>所有可用路線一次攤開；拖曳票券即可調整順序。</p>
        </div>
        <details class="settings">
          <summary>排列與顯示設定</summary>
          <div class="settings-sheet">
            <p>選擇預設閱讀站、調整順序，或隱藏不常用的站。</p>
            <ol>
              {#each preferenceState.providerOrder as id, index}
                {@const provider = providerById.get(id)}
                {#if provider}
                  <li>
                    <span>{provider.label}</span>
                    <label>
                      <input
                        type="radio"
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
                          !preferenceState.hiddenProviders.includes(id) &&
                          preferenceState.hiddenProviders.length === providers.length - 1
                        }
                        onchange={() => toggleVisibility(id)}
                      />
                      顯示
                    </label>
                    <span class="order-buttons">
                      <button
                        type="button"
                        aria-label={`將 ${provider.label} 往前移`}
                        disabled={index === 0}
                        onclick={() => moveProvider(id, -1)}
                      >↑</button>
                      <button
                        type="button"
                        aria-label={`將 ${provider.label} 往後移`}
                        disabled={index === preferenceState.providerOrder.length - 1}
                        onclick={() => moveProvider(id, 1)}
                      >↓</button>
                    </span>
                  </li>
                {/if}
              {/each}
            </ol>
          </div>
        </details>
      </div>

      <div
        aria-label="閱讀站排序"
        class="provider-grid"
        use:dragHandleZone={{
          items: providerLinks,
          flipDurationMs,
          dropTargetClasses: ['provider-grid--sorting'],
          useCursorForDetection: true,
        }}
        onconsider={previewProviderOrder}
        onfinalize={saveProviderOrder}
      >
        {#each providerLinks as link, index (link.id)}
          <article
            animate:flip={{ duration: flipDurationMs }}
            aria-label={`${link.label} 閱讀站`}
            class="provider-ticket"
            style={`--dispatch-index: ${index}`}
          >
            <div class="ticket-head">
              <ProviderMark id={link.id} />
              <div>
                <span>READ VIA</span>
                <h3>{link.label}</h3>
              </div>
              {#if link.id === preferenceState.defaultProvider}
                <span class="default-tag">預設閱讀站</span>
              {/if}
              <span
                aria-label={`拖曳以調整 ${link.label} 的順序`}
                class="drag-handle"
                use:dragHandle
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M8 7h.01M16 7h.01M8 12h.01M16 12h.01M8 17h.01M16 17h.01" />
                </svg>
              </span>
            </div>
            <p class="provider-url">{link.url}</p>
            <div class="ticket-actions">
              <button type="button" onclick={() => copyLink(link)}>
                {copiedProvider === link.id
                  ? '已複製'
                  : copyFailedProvider === link.id
                    ? '複製失敗'
                    : '複製網址'}
              </button>
              <a href={link.url} target="_blank" rel="noreferrer">
                開啟
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7m-8 0h8v8" /></svg>
              </a>
            </div>
            <div class="mobile-order" aria-label={`${link.label} 排序控制`}>
              <button
                type="button"
                disabled={index === 0}
                onclick={() => moveVisibleProvider(link.id, -1)}
              >往前移</button>
              <button
                type="button"
                disabled={index === providerLinks.length - 1}
                onclick={() => moveVisibleProvider(link.id, 1)}
              >往後移</button>
            </div>
          </article>
        {/each}
      </div>
      <p class="copy-status" role="status" aria-live="polite">{copyFeedback}</p>
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
