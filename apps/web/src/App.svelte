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
  import { onMount } from 'svelte'

  import ProviderMark from './ProviderMark.svelte'
  import { preferences, savePreferences, type Preferences } from './preferences.js'

  const providerById = new Map(providers.map((provider) => [provider.id, provider]))

  let input = $state('')
  let board = $state('')
  let result = $state<ParseResult | null>(null)
  let copiedProvider = $state<ProviderId | null>(null)
  let copyFailedProvider = $state<ProviderId | null>(null)
  let copyFeedback = $state('')
  let preferenceState = $state<Preferences>(preferences.get())

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
    const defaultFirst = visibleOrder.includes(preferenceState.defaultProvider)
      ? [
          preferenceState.defaultProvider,
          ...visibleOrder.filter((id) => id !== preferenceState.defaultProvider),
        ]
      : visibleOrder
    return defaultFirst.flatMap((id) => {
      const link = linkById.get(id)
      return link === undefined ? [] : [link]
    })
  })

  onMount(() => {
    const queryInput = new URLSearchParams(window.location.search).get('input')
    if (queryInput !== null) {
      input = queryInput
      parse()
    }
    return preferences.subscribe((next) => {
      preferenceState = next
    })
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

  function parse(): void {
    result = parsePttInput(input, board.trim() ? { board } : {})
    copiedProvider = null
    copyFailedProvider = null
    copyFeedback = ''
    syncQuery()
  }

  function useExample(): void {
    input = 'https://www.ptt.cc/bbs/Browsers/M.1750772319.A.F2C.html'
    board = ''
    parse()
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
</script>

<svelte:head>
  <link rel="canonical" href="https://vp-tw.github.io/ptt-link-switcher/" />
</svelte:head>

<header class="site-header">
  <a class="brand" href="./" aria-label="PTT Link Switcher 首頁">
    <svg aria-hidden="true" viewBox="0 0 36 36">
      <path d="M4 7h28v22H4zM9 12h18M9 18h11M9 24h7" />
      <path d="m22 20 5 5m0-5-5 5" />
    </svg>
    <span>PTT LINK<br />SWITCHER</span>
  </a>
  <p>四站轉乘 · 全程離線</p>
</header>

<main>
  <section class="intro" aria-labelledby="page-title">
    <h1 id="page-title">貼一次，<br /><em>四站都能看。</em></h1>
    <p>
      貼上文章網址、分享文字或完整 AID。解析只在瀏覽器內完成，不會送出你的輸入。
    </p>
  </section>

  <section class="manifest" aria-labelledby="manifest-title">
    <div class="manifest-heading">
      <h2 id="manifest-title">文章轉乘單</h2>
      <span>ROUTE / 001</span>
    </div>
    <form onsubmit={(event) => { event.preventDefault(); parse() }}>
      <label for="ptt-input">文章網址、分享文字或完整 AID</label>
      <div class="input-row">
        <textarea
          id="ptt-input"
          bind:value={input}
          placeholder="例如 https://www.ptt.cc/bbs/... 或 #1eMgfVyi"
          rows="3"
          spellcheck="false"
        ></textarea>
        <button class="dispatch-button" type="submit">
          <span>解析並轉乘</span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 12h13m-5-5 5 5-5 5" />
          </svg>
        </button>
      </div>
      <div class="input-meta">
        <button class="text-button" type="button" onclick={useExample}>填入範例</button>
        <span>支援 PTT 官方 · BePTT · MoPTT · PTTweb</span>
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
          <button type="submit">補上看板並轉換</button>
        </div>
      {/if}
    </form>
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
          <p>所有可用路線一次攤開；預設站會排在最前。</p>
        </div>
        <details class="settings">
          <summary>排列與顯示設定</summary>
          <div class="settings-sheet">
            <p>選擇預設站、調整順序，或隱藏不常用的站。</p>
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

      <div class="provider-grid">
        {#each providerLinks as link, index (link.id)}
          <article class="provider-ticket" style={`--dispatch-index: ${index}`}>
            <div class="ticket-head">
              <ProviderMark id={link.id} />
              <div>
                <span>READ VIA</span>
                <h3>{link.label}</h3>
              </div>
              {#if link.id === preferenceState.defaultProvider}
                <span class="default-tag">預設</span>
              {/if}
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
          </article>
        {/each}
      </div>
      <p class="copy-status" role="status" aria-live="polite">{copyFeedback}</p>
    </section>
  {:else}
    <section class="empty-route" aria-label="等待輸入">
      <span>READY FOR DISPATCH</span>
      <p>輸入一篇 PTT 文章，四條閱讀路線會在這裡一次展開。</p>
    </section>
  {/if}
</main>

<footer>
  <p>Offline by design. No metadata lookup, no network conversion.</p>
  <a href="https://github.com/vp-tw/ptt-link-switcher" target="_blank" rel="noreferrer">
    GitHub · vp-tw/ptt-link-switcher
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7m-8 0h8v8" /></svg>
  </a>
</footer>
