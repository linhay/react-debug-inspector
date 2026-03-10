/**
 * 初始化浏览器端的元素定位器交互界面
 */
export function initInspector() {
  if (typeof window === 'undefined') return;
  const win = window;
  const doc = document;
  const scopedWindow = win as Window & { __reactDebugInspectorCleanup__?: () => void };
  scopedWindow.__reactDebugInspectorCleanup__?.();

  type Anchor = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  type FeedbackTone = 'success' | 'warning';
  type InspectContext = {
    debugEl: HTMLElement;
    debugId: string;
    rect: DOMRect;
  };
  type ResolvedImage = {
    url: string;
    alt: string;
    title: string;
    filename: string;
    source: 'img' | 'background';
  };

  let isInspecting = false;
  let overlay: HTMLDivElement | null = null;
  let tooltip: HTMLDivElement | null = null;
  let actionMenu: HTMLDivElement | null = null;
  let latestContext: InspectContext | null = null;
  let lastHoveredDebugEl: HTMLElement | null = null;
  let latestHoverEvent: MouseEvent | null = null;
  let pendingHoverFrame = false;
  let anchorUpdatePending = false;
  let hideMenuTimer: number | null = null;
  let isPointerInsideMenu = false;
  const edgeOffset = 24;
  const successColor = '#10b981';
  const defaultOverlayBg = 'rgba(14, 165, 233, 0.15)';
  const defaultOverlayBorder = '#0ea5e9';

  const scheduleFrame = (cb: FrameRequestCallback) => {
    if (typeof win.requestAnimationFrame === 'function') {
      return win.requestAnimationFrame(cb);
    }
    return win.setTimeout(() => cb(Date.now()), 16);
  };

  const toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = '🎯';
  toggleBtn.title = '开启组件定位器';
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: #0ea5e9;
    color: white;
    border: 2px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    z-index: 9999999;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  doc.body.appendChild(toggleBtn);

  const applyAnchor = (anchor: Anchor) => {
    toggleBtn.style.top = anchor.startsWith('top') ? `${edgeOffset}px` : '';
    toggleBtn.style.bottom = anchor.startsWith('bottom') ? `${edgeOffset}px` : '';
    if (anchor.endsWith('left')) {
      toggleBtn.style.left = `${edgeOffset}px`;
      toggleBtn.style.right = '';
      return;
    }
    toggleBtn.style.right = `${edgeOffset}px`;
    toggleBtn.style.left = '';
  };

  const getVisibleDialogs = () => {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('[role="dialog"], dialog[open], [aria-modal="true"]'),
    );
    return candidates.filter((node) => {
      if (node.getAttribute('aria-hidden') === 'true') return false;
      if (node.getAttribute('data-aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  };

  const getPreferredHost = (dialogs: HTMLElement[]) => {
    if (dialogs.length === 0) return document.body;
    const topDialog = dialogs[dialogs.length - 1];
    const portalHost = topDialog.closest<HTMLElement>('[data-radix-portal]');
    if (portalHost) return topDialog;
    return document.body;
  };

  const ensureToggleHost = (host: HTMLElement) => {
    if (toggleBtn.parentElement !== host) {
      host.appendChild(toggleBtn);
    }
  };

  const ensureToggleVisible = () => {
    toggleBtn.removeAttribute('aria-hidden');
    toggleBtn.removeAttribute('data-aria-hidden');
    toggleBtn.removeAttribute('inert');
    if ('inert' in toggleBtn) {
      (toggleBtn as HTMLButtonElement & { inert?: boolean }).inert = false;
    }
    toggleBtn.style.pointerEvents = 'auto';
  };

  const isIgnorableObstacle = (el: Element) => {
    if (el === toggleBtn || el === overlay || el === tooltip || el === actionMenu) return true;
    if (el instanceof HTMLElement) {
      if (el.contains(toggleBtn) || toggleBtn.contains(el)) return true;
      if (overlay && el.contains(overlay)) return true;
      if (tooltip && el.contains(tooltip)) return true;
      if (actionMenu && (el.contains(actionMenu) || actionMenu.contains(el))) return true;
      if (el === doc.body || el === doc.documentElement) return true;
      if (el.getAttribute('data-inspector-ignore') === 'true') return true;
      const style = window.getComputedStyle(el);
      if (style.pointerEvents === 'none') return true;
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return true;
    }
    return false;
  };

  const sampleAnchorObstructionScore = () => {
    const pickStack =
      typeof document.elementsFromPoint === 'function'
        ? (x: number, y: number) => document.elementsFromPoint(x, y)
        : (x: number, y: number) => {
          const one = doc.elementFromPoint?.(x, y);
          return one ? [one] : [];
        };
    const rect = toggleBtn.getBoundingClientRect();
    const points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + 2, rect.top + 2],
      [rect.right - 2, rect.top + 2],
      [rect.left + 2, rect.bottom - 2],
      [rect.right - 2, rect.bottom - 2],
    ];
    let score = 0;
    for (const [x, y] of points) {
      const stack = pickStack(x, y);
      const blocker = stack.find((el) => !isIgnorableObstacle(el));
      if (blocker) score += 1;
    }
    return score;
  };

  const pickBestAnchor = (preferLeft = false) => {
    const candidates: Anchor[] = preferLeft
      ? ['bottom-left', 'top-left', 'bottom-right', 'top-right']
      : ['bottom-right', 'top-right', 'bottom-left', 'top-left'];
    let best = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const anchor of candidates) {
      applyAnchor(anchor);
      const score = sampleAnchorObstructionScore();
      if (score < bestScore) {
        bestScore = score;
        best = anchor;
      }
      if (score === 0) break;
    }
    applyAnchor(best);
  };

  const updateAnchorForDialogs = () => {
    const dialogs = getVisibleDialogs();
    ensureToggleHost(getPreferredHost(dialogs));
    ensureToggleVisible();
    if (dialogs.length > 0) {
      pickBestAnchor(true);
      return;
    }
    pickBestAnchor(false);
  };

  const scheduleAnchorUpdate = () => {
    if (anchorUpdatePending) return;
    anchorUpdatePending = true;
    scheduleFrame(() => {
      anchorUpdatePending = false;
      updateAnchorForDialogs();
    });
  };

  const formatDebugId = (debugId: string) => {
    const parts = debugId.split(':');
    if (parts.length === 4) {
      const [filePath, componentName, tagName, line] = parts;
      const fileName = filePath.split('/').pop() || filePath;
      return `${fileName} › ${componentName} › ${tagName}:${line}`;
    }
    return debugId.replace(/:/g, ' › ');
  };

  const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

  const truncateText = (value: string, limit = 500) => {
    if (value.length <= limit) return value;
    return `${value.slice(0, limit - 3)}...`;
  };

  const extractTextContent = (target: HTMLElement) => {
    const ariaLabel = normalizeText(target.getAttribute('aria-label') || '');
    if (ariaLabel) return truncateText(ariaLabel);

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      const inputValue = normalizeText(target.value || '');
      if (inputValue) return truncateText(inputValue);
    }

    const alt = normalizeText(target.getAttribute('alt') || '');
    if (alt) return truncateText(alt);

    const title = normalizeText(target.getAttribute('title') || '');
    if (title) return truncateText(title);

    const textValue = normalizeText((target.innerText || target.textContent || ''));
    if (textValue) return truncateText(textValue);

    return null;
  };

  const resolveImageTarget = (target: HTMLElement): ResolvedImage | null => {
    const imageEl = target instanceof HTMLImageElement
      ? target
      : target.querySelector('img') || target.closest('img');

    if (imageEl instanceof HTMLImageElement) {
      const url = imageEl.currentSrc || imageEl.src;
      if (!url) return null;
      return {
        url,
        alt: imageEl.alt || '',
        title: imageEl.title || '',
        filename: url.split('/').pop()?.split('?')[0] || '',
        source: 'img',
      };
    }

    let node: HTMLElement | null = target;
    while (node) {
      const bg = window.getComputedStyle(node).backgroundImage;
      const match = bg.match(/url\(["']?(.*?)["']?\)/);
      if (match?.[1]) {
        const url = match[1];
        return {
          url,
          alt: node.getAttribute('aria-label') || '',
          title: node.getAttribute('title') || '',
          filename: url.split('/').pop()?.split('?')[0] || '',
          source: 'background',
        };
      }
      node = node.parentElement;
    }

    return null;
  };

  const buildImageMetadataText = (image: ResolvedImage, debugId: string) => [
    '[image]',
    `url: ${image.url}`,
    `alt: ${image.alt}`,
    `title: ${image.title}`,
    `filename: ${image.filename}`,
    `debugId: ${debugId}`,
  ].join('\n');

  const buildCopyAllPayload = (context: InspectContext) => {
    const textValue = extractTextContent(context.debugEl) || context.debugId;
    const image = resolveImageTarget(context.debugEl);
    return [
      '[debug]',
      `id: ${context.debugId}`,
      `display: ${formatDebugId(context.debugId)}`,
      '',
      '[text]',
      `value: ${textValue}`,
      '',
      '[image]',
      `status: ${image ? 'copied-metadata' : 'none'}`,
      `url: ${image?.url || ''}`,
      `alt: ${image?.alt || ''}`,
      `title: ${image?.title || ''}`,
      `filename: ${image?.filename || ''}`,
    ].join('\n');
  };

  const setOverlayTone = (tone: FeedbackTone) => {
    if (!overlay) return;
    if (tone === 'success') {
      overlay.style.background = 'rgba(16, 185, 129, 0.2)';
      overlay.style.borderColor = successColor;
      return;
    }
    overlay.style.background = 'rgba(245, 158, 11, 0.18)';
    overlay.style.borderColor = '#f59e0b';
  };

  const resetOverlayTone = () => {
    if (!overlay) return;
    overlay.style.background = defaultOverlayBg;
    overlay.style.borderColor = defaultOverlayBorder;
  };

  const showCopyFeedback = (message: string, tone: FeedbackTone) => {
    if (!tooltip) return;
    tooltip.textContent = tone === 'success' ? `✅ ${message}` : `⚠️ ${message}`;
    tooltip.style.color = tone === 'success' ? successColor : '#f59e0b';
    tooltip.title = latestContext?.debugId || '';
    setOverlayTone(tone);
  };

  const resetTooltipContent = (context: InspectContext) => {
    if (!tooltip) return;
    tooltip.textContent = formatDebugId(context.debugId);
    tooltip.style.color = '#38bdf8';
    tooltip.title = context.debugId;
    resetOverlayTone();
  };

  const positionActionMenu = (context: InspectContext) => {
    if (!tooltip || !actionMenu) return;
    const rect = context.rect;
    const menuWidth = actionMenu.offsetWidth || 248;
    const menuHeight = actionMenu.offsetHeight || 40;
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = tooltipRect.right + 2;
    if (left + menuWidth > win.innerWidth - 8) {
      left = Math.max(8, tooltipRect.left - menuWidth - 2);
    }

    let top = tooltipRect.top;
    if (top + menuHeight > win.innerHeight - 8) {
      top = Math.max(8, rect.bottom - menuHeight);
    }
    if (top < 8) {
      top = Math.min(win.innerHeight - menuHeight - 8, rect.bottom + 8);
    }

    actionMenu.style.left = `${left}px`;
    actionMenu.style.top = `${top}px`;
  };

  const showActionMenu = (context: InspectContext) => {
    if (!actionMenu) return;
    if (hideMenuTimer !== null) {
      win.clearTimeout(hideMenuTimer);
      hideMenuTimer = null;
    }
    actionMenu.style.display = 'flex';
    positionActionMenu(context);
  };

  const scheduleHideActionMenu = () => {
    if (!actionMenu || isPointerInsideMenu) return;
    if (hideMenuTimer !== null) {
      win.clearTimeout(hideMenuTimer);
    }
    hideMenuTimer = win.setTimeout(() => {
      if (isPointerInsideMenu) return;
      actionMenu.style.display = 'none';
      hideMenuTimer = null;
    }, 180);
  };

  const hideActionMenu = () => {
    if (!actionMenu) return;
    if (hideMenuTimer !== null) {
      win.clearTimeout(hideMenuTimer);
      hideMenuTimer = null;
    }
    actionMenu.style.display = 'none';
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const copyImageBinary = async (image: ResolvedImage, debugId: string): Promise<'binary' | 'metadata'> => {
    if (image.url.startsWith('data:')) {
      await copyText(buildImageMetadataText(image, debugId));
      return 'metadata';
    }
    const canWriteBinary = typeof navigator.clipboard?.write === 'function' && typeof window.ClipboardItem === 'function';
    if (canWriteBinary) {
      try {
        const response = await win.fetch(image.url);
        if (!response.ok) throw new Error(`failed:${response.status}`);
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error('not-image');
        const item = new window.ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        return 'binary';
      } catch {
        // fallback below
      }
    }

    await copyText(buildImageMetadataText(image, debugId));
    return 'metadata';
  };

  const performCopyAction = async (action: 'id' | 'text' | 'image' | 'all', context: InspectContext) => {
    if (action === 'id') {
      await copyText(context.debugId);
      showCopyFeedback('已复制 Debug ID', 'success');
      return;
    }

    if (action === 'text') {
      const textValue = extractTextContent(context.debugEl) || context.debugId;
      await copyText(textValue);
      showCopyFeedback('已复制文案', 'success');
      return;
    }

    if (action === 'image') {
      const image = resolveImageTarget(context.debugEl);
      if (!image) {
        showCopyFeedback('未找到图片', 'warning');
        return;
      }
      const copyResult = await copyImageBinary(image, context.debugId);
      showCopyFeedback(copyResult === 'binary' ? '已复制图片' : '已复制图片信息', 'success');
      return;
    }

    await copyText(buildCopyAllPayload(context));
    showCopyFeedback('已复制全部信息', 'success');
  };

  const inspectByPointer = (event: MouseEvent) => {
    if (!isInspecting || !overlay || !tooltip) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target === toggleBtn || target === overlay || target === tooltip || target.closest('[data-inspector-ignore="true"]')) {
      if (latestContext) {
        showActionMenu(latestContext);
      }
      return;
    }

    const debugEl = target.closest('[data-debug]') as HTMLElement | null;
    if (debugEl && debugEl === lastHoveredDebugEl && latestContext) {
      showActionMenu(latestContext);
      return;
    }

    if (
      debugEl &&
      latestContext &&
      (latestContext.debugEl.contains(debugEl) || debugEl.contains(latestContext.debugEl))
    ) {
      showActionMenu(latestContext);
      return;
    }

    if (!debugEl) {
      overlay.style.display = 'none';
      tooltip.style.display = 'none';
      scheduleHideActionMenu();
      return;
    }

    const debugId = debugEl.getAttribute('data-debug') || '';
    const rect = debugEl.getBoundingClientRect();
    latestContext = { debugEl, debugId, rect };
    lastHoveredDebugEl = debugEl;

    overlay.style.display = 'block';
    overlay.style.top = `${rect.top}px`;
    overlay.style.left = `${rect.left}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    tooltip.style.display = 'block';
    resetTooltipContent(latestContext);
    const tooltipY = rect.top < 30 ? rect.bottom + 4 : rect.top - 28;
    tooltip.style.top = `${tooltipY}px`;
    tooltip.style.left = `${rect.left}px`;

    showActionMenu(latestContext);
  };

  const stopInspecting = () => {
    isInspecting = false;
    latestContext = null;
    lastHoveredDebugEl = null;
    toggleBtn.style.transform = 'scale(1)';
    toggleBtn.style.background = '#0ea5e9';
    document.body.style.cursor = '';
    if (overlay) overlay.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
    hideActionMenu();
    resetOverlayTone();
  };

  const dialogObserver = new MutationObserver(() => {
    scheduleAnchorUpdate();
  });

  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999998;
    background: ${defaultOverlayBg};
    border: 2px dashed ${defaultOverlayBorder};
    display: none;
    transition: all 0.1s ease-out;
  `;
  doc.body.appendChild(overlay);

  tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed;
    pointer-events: auto;
    z-index: 9999999;
    background: #1e293b;
    color: #38bdf8;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    display: none;
    white-space: nowrap;
    transition: all 0.1s ease-out;
    cursor: help;
  `;
  doc.body.appendChild(tooltip);

  actionMenu = document.createElement('div');
  actionMenu.setAttribute('data-inspector-ignore', 'true');
  actionMenu.style.cssText = `
    position: fixed;
    z-index: 10000000;
    display: none;
    gap: 6px;
    padding: 6px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.96);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.28);
    border: 1px solid rgba(148, 163, 184, 0.25);
    align-items: center;
  `;
  actionMenu.addEventListener('mouseenter', () => {
    isPointerInsideMenu = true;
    if (hideMenuTimer !== null) {
      win.clearTimeout(hideMenuTimer);
      hideMenuTimer = null;
    }
  });
  actionMenu.addEventListener('mouseleave', () => {
    isPointerInsideMenu = false;
    scheduleHideActionMenu();
  });
  const actionDefinitions: Array<{ action: 'id' | 'text' | 'image' | 'all'; label: string }> = [
    { action: 'id', label: '复制 ID' },
    { action: 'text', label: '复制文案' },
    { action: 'image', label: '复制图片' },
    { action: 'all', label: '全部复制' },
  ];
  for (const definition of actionDefinitions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = definition.label;
    button.dataset.inspectorIgnore = 'true';
    button.dataset.inspectorAction = definition.action;
    button.style.cssText = `
      border: 0;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      background: rgba(30, 41, 59, 0.95);
      cursor: pointer;
      white-space: nowrap;
    `;
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!latestContext) return;
      await performCopyAction(definition.action, latestContext);
    });
    actionMenu.appendChild(button);
  }
  doc.body.appendChild(actionMenu);

  const stopTogglePropagation = (event: Event) => {
    event.stopPropagation();
  };
  const shieldedEvents = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
  for (const eventName of shieldedEvents) {
    toggleBtn.addEventListener(eventName, stopTogglePropagation);
  }

  const handleToggleClick = (event: MouseEvent) => {
    event.stopPropagation();
    isInspecting = !isInspecting;
    if (isInspecting) {
      toggleBtn.style.transform = 'scale(0.9)';
      toggleBtn.style.background = '#ef4444';
      doc.body.style.cursor = 'crosshair';
      return;
    }
    stopInspecting();
  };
  toggleBtn.onclick = handleToggleClick;

  const handleMouseMove = (event: MouseEvent) => {
    if (!isInspecting) return;
    latestHoverEvent = event;
    if (pendingHoverFrame) return;
    pendingHoverFrame = true;
    scheduleFrame(() => {
      pendingHoverFrame = false;
      if (!latestHoverEvent) return;
      inspectByPointer(latestHoverEvent);
    });
  };

  const handleWindowClick = (event: MouseEvent) => {
    if (!isInspecting) return;
    const target = event.target as HTMLElement | null;
    if (!target || target === toggleBtn) return;
    if (target.closest('[data-inspector-ignore="true"]')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const debugEl = target.closest('[data-debug]') as HTMLElement | null;
    if (!debugEl) {
      latestContext = null;
      lastHoveredDebugEl = null;
      stopInspecting();
      return;
    }

    const debugId = debugEl.getAttribute('data-debug');
    if (!debugId) return;
    copyText(debugId).then(() => {
      showCopyFeedback('Copied!', 'success');
      win.setTimeout(stopInspecting, 600);
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isInspecting) stopInspecting();
  };

  const handleBeforeUnload = () => {
    dialogObserver.disconnect();
  };

  dialogObserver.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'open', 'aria-hidden', 'data-aria-hidden', 'inert'],
  });
  win.addEventListener('beforeunload', handleBeforeUnload, { once: true });
  win.addEventListener('resize', scheduleAnchorUpdate);
  win.addEventListener('scroll', scheduleAnchorUpdate, true);
  doc.addEventListener('mousemove', handleMouseMove);
  win.addEventListener('click', handleWindowClick, { capture: true });
  win.addEventListener('keydown', handleKeyDown);
  updateAnchorForDialogs();

  scopedWindow.__reactDebugInspectorCleanup__ = () => {
    dialogObserver.disconnect();
    win.removeEventListener('beforeunload', handleBeforeUnload);
    win.removeEventListener('resize', scheduleAnchorUpdate);
    win.removeEventListener('scroll', scheduleAnchorUpdate, true);
    doc.removeEventListener('mousemove', handleMouseMove);
    win.removeEventListener('click', handleWindowClick, { capture: true });
    win.removeEventListener('keydown', handleKeyDown);
    if (hideMenuTimer !== null) {
      win.clearTimeout(hideMenuTimer);
      hideMenuTimer = null;
    }
    for (const eventName of shieldedEvents) {
      toggleBtn.removeEventListener(eventName, stopTogglePropagation);
    }
    toggleBtn.onclick = null;
    overlay?.remove();
    tooltip?.remove();
    actionMenu?.remove();
    toggleBtn.remove();
    delete scopedWindow.__reactDebugInspectorCleanup__;
  };
}
