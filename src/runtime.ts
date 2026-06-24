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
  type ActionKind = 'id' | 'text' | 'image' | 'all';
  type Point = { clientX: number; clientY: number };
  type DebugCandidate = { debugEl: HTMLElement; debugId: string };

  let isInspecting = false;
  let overlay: HTMLDivElement | null = null;
  let selectionOverlay: HTMLDivElement | null = null;
  let tooltip: HTMLDivElement | null = null;
  let actionMenu: HTMLDivElement | null = null;
  let candidateMenu: HTMLDivElement | null = null;
  let candidateActionMenu: HTMLDivElement | null = null;
  let activeCandidateActionAnchor: HTMLElement | null = null;
  let candidateMenuEntries = new WeakMap<HTMLElement, DebugCandidate>();
  let latestContext: InspectContext | null = null;
  let lastHoveredDebugEl: HTMLElement | null = null;
  let latestHoverEvent: MouseEvent | null = null;
  let pendingHoverFrame = false;
  let anchorUpdatePending = false;
  let selectionLocked = false;
  let inspectMode: 'single' | 'continuous' = 'single';
  let areaStart: { x: number; y: number } | null = null;
  let isAreaSelecting = false;
  let longPressTimer: number | null = null;
  const edgeOffset = 24;
  const areaSelectionThreshold = 6;
  const longPressDelay = 500;
  const successColor = '#10b981';
  const defaultOverlayBg = 'rgba(14, 165, 233, 0.15)';
  const defaultOverlayBorder = '#0ea5e9';
  const actionButtons: Partial<Record<ActionKind, HTMLButtonElement>> = {};

  const scheduleFrame = (cb: FrameRequestCallback) => {
    if (typeof win.requestAnimationFrame === 'function') {
      return win.requestAnimationFrame(cb);
    }
    return win.setTimeout(() => cb(Date.now()), 16);
  };

  const toggleBtn = document.createElement('div');
  toggleBtn.title = '组件定位器';
  toggleBtn.dataset.inspectorIgnore = 'true';
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.92);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.86);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  const singleToggleBtn = document.createElement('button');
  singleToggleBtn.type = 'button';
  singleToggleBtn.textContent = '单次';
  singleToggleBtn.title = '单次定位：选中后自动退出';
  singleToggleBtn.dataset.inspectorIgnore = 'true';
  const continuousToggleBtn = document.createElement('button');
  continuousToggleBtn.type = 'button';
  continuousToggleBtn.textContent = '持续';
  continuousToggleBtn.title = '持续定位：保持开启，按 Esc 退出';
  continuousToggleBtn.dataset.inspectorIgnore = 'true';
  const toggleSegmentStyle = 'border: 0; border-radius: 999px; padding: 7px 10px; color: #cbd5e1; background: transparent; cursor: pointer; font-size: 12px; font-weight: 800; line-height: 1; white-space: nowrap; transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;';
  singleToggleBtn.style.cssText = toggleSegmentStyle;
  continuousToggleBtn.style.cssText = toggleSegmentStyle;
  toggleBtn.append(singleToggleBtn, continuousToggleBtn);
  doc.body.appendChild(toggleBtn);

  const inspectorStyle = doc.createElement('style');
  inspectorStyle.textContent = `
    [data-inspector-menu-item="true"]:hover,
    [data-inspector-menu-item="true"]:focus-visible,
    [data-inspector-menu-active="true"] {
      background: rgba(14, 165, 233, 0.22) !important;
      color: #ffffff !important;
    }
  `;
  doc.head.appendChild(inspectorStyle);

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

  const updateToggleAppearance = () => {
    toggleBtn.style.transform = isInspecting ? 'scale(0.98)' : 'scale(1)';
    toggleBtn.style.background = isInspecting ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.92)';
    const applySegmentState = (button: HTMLButtonElement, active: boolean) => {
      button.style.background = active ? '#0ea5e9' : 'transparent';
      button.style.color = active ? '#ffffff' : '#cbd5e1';
      button.style.boxShadow = active ? '0 3px 10px rgba(14, 165, 233, 0.34)' : 'none';
    };
    applySegmentState(singleToggleBtn, isInspecting && inspectMode === 'single');
    applySegmentState(continuousToggleBtn, isInspecting && inspectMode === 'continuous');
  };

  updateToggleAppearance();

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
      (toggleBtn as HTMLElement & { inert?: boolean }).inert = false;
    }
    toggleBtn.style.pointerEvents = 'auto';
  };

  const isIgnorableObstacle = (el: Element) => {
    if (el === toggleBtn || el === overlay || el === tooltip || el === actionMenu || el === candidateMenu || el === candidateActionMenu) return true;
    if (el instanceof HTMLElement) {
      if (el.contains(toggleBtn) || toggleBtn.contains(el)) return true;
      if (overlay && el.contains(overlay)) return true;
      if (tooltip && el.contains(tooltip)) return true;
      if (actionMenu && (el.contains(actionMenu) || actionMenu.contains(el))) return true;
      if (candidateMenu && (el.contains(candidateMenu) || candidateMenu.contains(el))) return true;
      if (candidateActionMenu && (el.contains(candidateActionMenu) || candidateActionMenu.contains(el))) return true;
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

  const formatCompactDebugId = (debugId: string) => {
    const parts = debugId.split(':');
    if (parts.length === 4) {
      const [, componentName, tagName, line] = parts;
      return `${componentName} › ${tagName}:${line}`;
    }
    return formatDebugId(debugId);
  };

  const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

  const truncateText = (value: string, limit = 500) => {
    if (value.length <= limit) return value;
    return `${value.slice(0, limit - 3)}...`;
  };

  const suppressEvent = (event: Event, { preventDefault = false, immediate = false } = {}) => {
    if (preventDefault) {
      event.preventDefault();
    }
    event.stopPropagation();
    if (immediate) {
      event.stopImmediatePropagation?.();
    }
  };

  const isInspectorChromeTarget = (target: HTMLElement | null) => {
    if (!target) return false;
    if (target === toggleBtn || target === overlay || target === selectionOverlay || target === tooltip || target === actionMenu || target === candidateMenu || target === candidateActionMenu) return true;
    return !!target.closest('[data-inspector-ignore="true"]');
  };

  const hasPointerPoint = (event: Event): event is MouseEvent => 'clientX' in event && 'clientY' in event;

  const getEventPoint = (event: Event): Point | null => {
    if (hasPointerPoint(event)) return { clientX: event.clientX, clientY: event.clientY };
    const touchEvent = event as TouchEvent;
    if ('touches' in event && touchEvent.touches.length > 0) {
      const touch = touchEvent.touches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    if ('changedTouches' in event && touchEvent.changedTouches.length > 0) {
      const touch = touchEvent.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return null;
  };

  const buildAreaRect = (event: MouseEvent) => {
    if (!areaStart) return null;
    const left = Math.min(areaStart.x, event.clientX);
    const top = Math.min(areaStart.y, event.clientY);
    const right = Math.max(areaStart.x, event.clientX);
    const bottom = Math.max(areaStart.y, event.clientY);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };

  const clearAreaSelection = () => {
    areaStart = null;
    isAreaSelecting = false;
    if (selectionOverlay) selectionOverlay.style.display = 'none';
  };

  const renderAreaSelection = (rect: { left: number; top: number; width: number; height: number }) => {
    if (!selectionOverlay) return;
    selectionOverlay.style.display = 'block';
    selectionOverlay.style.left = `${rect.left}px`;
    selectionOverlay.style.top = `${rect.top}px`;
    selectionOverlay.style.width = `${rect.width}px`;
    selectionOverlay.style.height = `${rect.height}px`;
  };

  const updateAreaSelection = (event: MouseEvent) => {
    if (!areaStart) return false;
    const rect = buildAreaRect(event);
    if (!rect) return false;
    if (!isAreaSelecting && Math.max(rect.width, rect.height) < areaSelectionThreshold) return false;
    isAreaSelecting = true;
    clearLongPress();
    renderAreaSelection(rect);
    hideActionMenu();
    if (tooltip) tooltip.style.display = 'none';
    return true;
  };

  const getIntersectionArea = (
    a: { left: number; top: number; right: number; bottom: number },
    b: { left: number; top: number; right: number; bottom: number },
  ) => {
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return width * height;
  };

  const findAreaDebugTarget = (areaRect: { left: number; top: number; right: number; bottom: number }) => {
    let best: { el: HTMLElement; score: number; area: number } | null = null;
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[data-debug]'))) {
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area <= 0) continue;
      const overlap = getIntersectionArea(areaRect, rect);
      if (overlap <= 0) continue;
      const score = overlap / area;
      if (!best || score > best.score || (score === best.score && area < best.area)) {
        best = { el, score, area };
      }
    }
    return best?.el || null;
  };

  const collectDebugCandidate = (candidates: DebugCandidate[], seen: Set<HTMLElement>, debugEl: HTMLElement | null) => {
    if (!debugEl || seen.has(debugEl)) return;
    const debugId = debugEl.getAttribute('data-debug');
    if (!debugId) return;
    seen.add(debugEl);
    candidates.push({ debugEl, debugId });
  };

  const getPointDebugCandidates = (point: Point | null, target?: HTMLElement | null) => {
    const candidates: DebugCandidate[] = [];
    const seen = new Set<HTMLElement>();
    const stack = point && typeof doc.elementsFromPoint === 'function'
      ? doc.elementsFromPoint(point.clientX, point.clientY)
      : target ? [target] : [];

    for (const el of stack) {
      if (!(el instanceof HTMLElement) || isInspectorChromeTarget(el)) continue;
      let node: HTMLElement | null = el;
      while (node && node !== doc.body && node !== doc.documentElement) {
        collectDebugCandidate(candidates, seen, node.hasAttribute('data-debug') ? node : null);
        node = node.parentElement;
      }
    }

    collectDebugCandidate(candidates, seen, target?.closest('[data-debug]') as HTMLElement | null);
    return candidates;
  };

  const findPointDebugTarget = (target: HTMLElement | null, event?: MouseEvent) => {
    return getPointDebugCandidates(event ? getEventPoint(event) : null, target)[0]?.debugEl || null;
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

  const buildScreenshotMetadataText = (context: InspectContext) => [
    '[screenshot]',
    `debugId: ${context.debugId}`,
    `display: ${formatDebugId(context.debugId)}`,
    `width: ${Math.round(context.rect.width)}`,
    `height: ${Math.round(context.rect.height)}`,
  ].join('\n');

  const buildCopyAllPayload = (context: InspectContext) => {
    const textValue = extractTextContent(context.debugEl);
    const image = resolveImageTarget(context.debugEl);
    const lines = [
      '[debug]',
      `id: ${context.debugId}`,
      `display: ${formatDebugId(context.debugId)}`,
    ];
    if (textValue) {
      lines.push('', '[text]', `value: ${textValue}`);
    }
    if (image) {
      lines.push('', '[image]', `url: ${image.url}`, `alt: ${image.alt}`, `title: ${image.title}`, `filename: ${image.filename}`);
    }
    return lines.join('\n');
  };

  const syncActionMenuVisibility = (context: InspectContext) => {
    actionButtons.id && (actionButtons.id.style.display = '');
    actionButtons.all && (actionButtons.all.style.display = '');
    if (actionButtons.text) {
      actionButtons.text.style.display = extractTextContent(context.debugEl) ? '' : 'none';
    }
    if (actionButtons.image) {
      actionButtons.image.style.display = context.rect.width > 0 && context.rect.height > 0 ? '' : 'none';
    }
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
    tooltip.style.display = 'block';
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

    let left = tooltipRect.right + 8;
    if (left + menuWidth > win.innerWidth - 8) {
      left = Math.max(8, tooltipRect.left - menuWidth - 8);
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
    syncActionMenuVisibility(context);
    actionMenu.style.display = 'flex';
    positionActionMenu(context);
  };

  const hideActionMenu = () => {
    if (!actionMenu) return;
    actionMenu.style.display = 'none';
  };

  const clearLongPress = () => {
    if (longPressTimer === null) return;
    win.clearTimeout(longPressTimer);
    longPressTimer = null;
  };

  const hideCandidateMenu = () => {
    if (!candidateMenu) return;
    candidateMenu.style.display = 'none';
    candidateMenu.replaceChildren();
    hideCandidateActionMenu();
  };

  const isCandidateMenuOpen = () => candidateMenu?.style.display !== 'none';

  const hideCandidateActionMenu = () => {
    if (!candidateActionMenu) return;
    activeCandidateActionAnchor?.removeAttribute('data-inspector-menu-active');
    candidateActionMenu.style.display = 'none';
    candidateActionMenu.replaceChildren();
    activeCandidateActionAnchor = null;
  };

  const positionCandidateActionMenu = (anchor: HTMLElement) => {
    if (!candidateActionMenu) return;
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = candidateMenu?.getBoundingClientRect();
    const menuWidth = candidateActionMenu.offsetWidth || 150;
    const menuHeight = candidateActionMenu.offsetHeight || 150;
    let left = (menuRect?.right ?? anchorRect.right) + 6;
    if (left + menuWidth > win.innerWidth - 8) {
      left = Math.max(8, (menuRect?.left ?? anchorRect.left) - menuWidth - 6);
    }
    const top = Math.min(Math.max(8, anchorRect.top), Math.max(8, win.innerHeight - menuHeight - 8));
    candidateActionMenu.style.left = `${left}px`;
    candidateActionMenu.style.top = `${top}px`;
  };

  const showCandidateActionMenu = (anchor: HTMLElement, candidate: DebugCandidate) => {
    if (!candidateActionMenu) return;
    if (activeCandidateActionAnchor === anchor && candidateActionMenu.style.display !== 'none') return;
    activeCandidateActionAnchor?.removeAttribute('data-inspector-menu-active');
    activeCandidateActionAnchor = anchor;
    anchor.dataset.inspectorMenuActive = 'true';
    hideActionMenu();
    candidateActionMenu.replaceChildren();
    showDebugElement(candidate.debugEl);
    hideActionMenu();
    const context = latestContext;
    if (!context) return;

    for (const definition of actionDefinitions) {
      if (definition.action === 'text' && !extractTextContent(context.debugEl)) continue;
      if (definition.action === 'image' && (context.rect.width <= 0 || context.rect.height <= 0)) continue;
      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = definition.label;
      button.title = `复制选项: ${definition.label}`;
      button.dataset.inspectorIgnore = 'true';
      button.dataset.inspectorMenuItem = 'true';
      button.style.cssText = `
        display: block;
        width: 100%;
        border: 0;
        border-radius: 7px;
        padding: 7px 10px;
        color: #e2e8f0;
        background: transparent;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
        white-space: nowrap;
      `;
      button.addEventListener('click', async (event) => {
        suppressEvent(event, { preventDefault: true });
        hideCandidateActionMenu();
        hideCandidateMenu();
        await performCopyAction(definition.action, context);
      });
      candidateActionMenu.appendChild(button);
    }

    candidateActionMenu.style.display = 'block';
    positionCandidateActionMenu(anchor);
  };

  const showCandidateActionMenuFromEvent = (event: Event) => {
    if (!candidateMenu || !isCandidateMenuOpen()) return;
    const target = event.target;
    if (!(target instanceof win.Element)) return;
    const anchor = target.closest<HTMLElement>('[data-inspector-candidate-action-anchor="true"]');
    if (!anchor || !candidateMenu.contains(anchor)) return;
    const candidate = candidateMenuEntries.get(anchor);
    if (!candidate) return;
    showCandidateActionMenu(anchor, candidate);
  };

  const positionCandidateMenu = (point: Point) => {
    if (!candidateMenu) return;
    const width = candidateMenu.offsetWidth || 280;
    const height = candidateMenu.offsetHeight || 180;
    const left = Math.min(Math.max(8, point.clientX), Math.max(8, win.innerWidth - width - 8));
    const top = Math.min(Math.max(8, point.clientY), Math.max(8, win.innerHeight - height - 8));
    candidateMenu.style.left = `${left}px`;
    candidateMenu.style.top = `${top}px`;
  };

  const showCandidateMenu = (point: Point, target: HTMLElement | null) => {
    if (!candidateMenu) return false;
    const candidates = getPointDebugCandidates(point, target).slice(0, 12);
    if (candidates.length === 0) return false;
    const previewCandidate = (debugEl: HTMLElement) => {
      showDebugElement(debugEl);
      hideActionMenu();
    };
    const formatCandidateLabel = (candidate: DebugCandidate) => {
      const debugLabel = formatCompactDebugId(candidate.debugId);
      const text = extractTextContent(candidate.debugEl);
      return text ? `${debugLabel} · ${truncateText(text, 28)}` : debugLabel;
    };

    hideActionMenu();
    clearAreaSelection();
    candidateMenuEntries = new WeakMap();
    candidateMenu.replaceChildren();

    const title = doc.createElement('div');
    title.textContent = '选择目标';
    title.style.cssText = `
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px 6px;
      white-space: nowrap;
    `;
    candidateMenu.appendChild(title);

    for (const candidate of candidates) {
      const row = doc.createElement('div');
      row.dataset.inspectorIgnore = 'true';
      row.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
      `;

      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = formatCandidateLabel(candidate);
      button.title = candidate.debugId;
      button.dataset.inspectorIgnore = 'true';
      button.dataset.inspectorCandidateActionAnchor = 'true';
      button.dataset.inspectorMenuItem = 'true';
      button.style.cssText = `
        display: block;
        flex: 1;
        min-width: 0;
        border: 0;
        border-radius: 7px;
        padding: 7px 8px;
        text-align: left;
        color: #e2e8f0;
        background: transparent;
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      button.addEventListener('mouseenter', () => showCandidateActionMenu(button, candidate));
      button.addEventListener('click', (event) => {
        suppressEvent(event, { preventDefault: true });
        hideCandidateMenu();
        showDebugElement(candidate.debugEl);
        finalizeSelection(candidate.debugId);
      });

      candidateMenuEntries.set(button, candidate);
      row.appendChild(button);
      candidateMenu.appendChild(row);
    }

    candidateMenu.style.display = 'block';
    positionCandidateMenu(point);
    previewCandidate(candidates[0].debugEl);
    return true;
  };

  const finalizeSelection = (debugId: string) => {
    selectionLocked = true;
    copyText(debugId)
      .then(() => {
        showCopyFeedback('已复制 Debug ID', 'success');
        win.setTimeout(() => {
          selectionLocked = false;
          if (inspectMode === 'single') {
            stopInspecting();
          } else {
            hideCurrentTarget();
          }
        }, 600);
      })
      .catch(() => {
        selectionLocked = false;
      });
  };

  const selectDebugTarget = (target: HTMLElement | null, event?: MouseEvent) => {
    if (selectionLocked) return;
    const debugEl = findPointDebugTarget(target, event);
    if (!debugEl) {
      selectionLocked = false;
      if (inspectMode === 'single') {
        stopInspecting();
      } else {
        hideCurrentTarget();
      }
      return;
    }

    const debugId = debugEl.getAttribute('data-debug');
    if (!debugId) return;
    finalizeSelection(debugId);
  };

  const selectAreaDebugTarget = (areaRect: { left: number; top: number; right: number; bottom: number }) => {
    if (selectionLocked) return;
    const debugEl = findAreaDebugTarget(areaRect);
    if (!debugEl) {
      selectionLocked = false;
      if (inspectMode === 'single') {
        stopInspecting();
      } else {
        hideCurrentTarget();
      }
      return;
    }

    const debugId = debugEl.getAttribute('data-debug');
    if (!debugId) return;
    showDebugElement(debugEl);
    finalizeSelection(debugId);
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const writeImageBlobToClipboard = async (blob: Blob) => {
    const item = new window.ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
  };

  const renderImageUrlToPng = async (url: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const imageEl = new Image();
      imageEl.crossOrigin = 'anonymous';
      imageEl.onload = () => {
        const canvas = doc.createElement('canvas');
        canvas.width = imageEl.naturalWidth || imageEl.width;
        canvas.height = imageEl.naturalHeight || imageEl.height;
        const context = canvas.getContext('2d');
        if (!context || !canvas.width || !canvas.height) {
          resolve(null);
          return;
        }
        context.drawImage(imageEl, 0, 0);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
      imageEl.onerror = () => resolve(null);
      imageEl.src = url;
    });
  };

  const inlineElementStyles = (source: Element, clone: Element) => {
    if (source instanceof HTMLElement && clone instanceof HTMLElement) {
      const computed = win.getComputedStyle(source);
      for (const property of Array.from(computed)) {
        clone.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
      }
      clone.style.transform = 'none';
      clone.style.transition = 'none';
      clone.style.animation = 'none';
      if (source instanceof HTMLInputElement && clone instanceof HTMLInputElement) clone.value = source.value;
      if (source instanceof HTMLTextAreaElement && clone instanceof HTMLTextAreaElement) clone.value = source.value;
      if (source instanceof HTMLSelectElement && clone instanceof HTMLSelectElement) clone.value = source.value;
    }

    const sourceChildren = Array.from(source.children);
    const cloneChildren = Array.from(clone.children);
    for (let index = 0; index < sourceChildren.length; index += 1) {
      const sourceChild = sourceChildren[index];
      const cloneChild = cloneChildren[index];
      if (sourceChild && cloneChild) inlineElementStyles(sourceChild, cloneChild);
    }
  };

  const renderElementToPng = async (target: HTMLElement): Promise<Blob | null> => {
    const rect = target.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    if (width <= 0 || height <= 0) return null;

    const clone = target.cloneNode(true) as HTMLElement;
    inlineElementStyles(target, clone);
    clone.style.margin = '0';
    clone.style.width = width + 'px';
    clone.style.height = height + 'px';
    clone.style.boxSizing = 'border-box';

    const wrapper = doc.createElement('div');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    wrapper.style.width = width + 'px';
    wrapper.style.height = height + 'px';
    wrapper.style.overflow = 'hidden';
    wrapper.appendChild(clone);

    const serialized = new XMLSerializer().serializeToString(wrapper);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><foreignObject width="100%" height="100%">' + serialized + '</foreignObject></svg>';
    return renderImageUrlToPng('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  };

  const copyElementScreenshot = async (context: InspectContext): Promise<'binary' | 'metadata'> => {
    const canWriteBinary = typeof navigator.clipboard?.write === 'function' && typeof window.ClipboardItem === 'function';
    if (canWriteBinary) {
      const blob = await renderElementToPng(context.debugEl);
      if (blob) {
        try {
          await writeImageBlobToClipboard(blob);
          return 'binary';
        } catch {
          // fallback below
        }
      }
    }

    await copyText(buildScreenshotMetadataText(context));
    return 'metadata';
  };

  const performCopyAction = async (action: 'id' | 'text' | 'image' | 'all', context: InspectContext) => {
    if (action === 'id') {
      await copyText(context.debugId);
      showCopyFeedback('已复制 Debug ID', 'success');
      return;
    }

    if (action === 'text') {
      const textValue = extractTextContent(context.debugEl);
      if (!textValue) return;
      await copyText(textValue);
      showCopyFeedback('已复制文案', 'success');
      return;
    }

    if (action === 'image') {
      const copyResult = await copyElementScreenshot(context);
      showCopyFeedback(copyResult === 'binary' ? '已复制节点截图' : '已复制截图信息', 'success');
      return;
    }

    await copyText(buildCopyAllPayload(context));
    showCopyFeedback('已复制全部信息', 'success');
  };

  const hideCurrentTarget = () => {
    if (!overlay || !tooltip) return;
    overlay.style.display = 'none';
    tooltip.style.display = 'none';
    hideActionMenu();
    latestContext = null;
    lastHoveredDebugEl = null;
  };

  const showDebugElement = (debugEl: HTMLElement) => {
    if (!overlay || !tooltip) return;
    const debugId = debugEl.getAttribute('data-debug') || '';
    if (!debugId) {
      hideCurrentTarget();
      return;
    }

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

  const inspectByPointer = (event: MouseEvent) => {
    if (!isInspecting || !overlay || !tooltip) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (isInspectorChromeTarget(target)) {
      return;
    }

    const debugEl = findPointDebugTarget(target, event);
    if (debugEl && debugEl === lastHoveredDebugEl && latestContext) {
      showActionMenu(latestContext);
      return;
    }

    if (!debugEl) {
      hideCurrentTarget();
      return;
    }

    showDebugElement(debugEl);
  };

  const stopInspecting = () => {
    isInspecting = false;
    selectionLocked = false;
    latestContext = null;
    lastHoveredDebugEl = null;
    clearAreaSelection();
    clearLongPress();
    document.body.style.cursor = '';
    if (overlay) overlay.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
    hideActionMenu();
    hideCandidateMenu();
    hideCandidateActionMenu();
    resetOverlayTone();
    updateToggleAppearance();
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

  selectionOverlay = document.createElement('div');
  selectionOverlay.setAttribute('data-inspector-ignore', 'true');
  selectionOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999999;
    background: rgba(14, 165, 233, 0.08);
    border: 1px solid ${defaultOverlayBorder};
    display: none;
  `;
  doc.body.appendChild(selectionOverlay);

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
  const actionDefinitions: Array<{ action: ActionKind; label: string }> = [
    { action: 'id', label: '复制 Debug ID' },
    { action: 'text', label: '复制文案' },
    { action: 'image', label: '复制图片' },
    { action: 'all', label: '复制全部' },
  ];
  for (const definition of actionDefinitions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = definition.label;
    button.dataset.inspectorIgnore = 'true';
    button.dataset.inspectorAction = definition.action;
    button.dataset.inspectorMenuItem = 'true';
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
      suppressEvent(event, { preventDefault: true });
      if (!latestContext) return;
      await performCopyAction(definition.action, latestContext);
    });
    actionButtons[definition.action] = button;
    actionMenu.appendChild(button);
  }
  doc.body.appendChild(actionMenu);

  candidateMenu = document.createElement('div');
  candidateMenu.setAttribute('data-inspector-ignore', 'true');
  candidateMenu.style.cssText = `
    position: fixed;
    z-index: 10000001;
    display: none;
    min-width: 220px;
    max-width: 320px;
    width: min(460px, calc(100vw - 16px));
    max-height: min(360px, calc(100vh - 16px));
    overflow: auto;
    padding: 6px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.98);
    box-shadow: 0 12px 34px rgba(15, 23, 42, 0.32);
    border: 1px solid rgba(148, 163, 184, 0.25);
  `;
  doc.body.appendChild(candidateMenu);
  candidateMenu.addEventListener('pointerover', showCandidateActionMenuFromEvent, { capture: true });
  candidateMenu.addEventListener('mouseover', showCandidateActionMenuFromEvent, { capture: true });
  candidateMenu.addEventListener('mousemove', showCandidateActionMenuFromEvent, { capture: true });

  candidateActionMenu = document.createElement('div');
  candidateActionMenu.setAttribute('data-inspector-ignore', 'true');
  candidateActionMenu.style.cssText = `
    position: fixed;
    z-index: 10000002;
    display: none;
    min-width: 132px;
    padding: 6px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.98);
    box-shadow: 0 12px 34px rgba(15, 23, 42, 0.32);
    border: 1px solid rgba(148, 163, 184, 0.25);
  `;
  doc.body.appendChild(candidateActionMenu);

  const stopTogglePropagation = (event: Event) => {
    suppressEvent(event);
  };
  const shieldedEvents = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
  for (const eventName of shieldedEvents) {
    toggleBtn.addEventListener(eventName, stopTogglePropagation);
  }

  const startInspecting = (mode: 'single' | 'continuous', event: MouseEvent) => {
    suppressEvent(event);
    if (isInspecting && inspectMode === mode) {
      stopInspecting();
      return;
    }
    inspectMode = mode;
    isInspecting = true;
    doc.body.style.cursor = 'crosshair';
    updateToggleAppearance();
  };
  const handleSingleToggleClick = (event: MouseEvent) => startInspecting('single', event);
  const handleContinuousToggleClick = (event: MouseEvent) => startInspecting('continuous', event);
  singleToggleBtn.addEventListener('click', handleSingleToggleClick);
  continuousToggleBtn.addEventListener('click', handleContinuousToggleClick);

  const handleMouseMove = (event: MouseEvent) => {
    if (!isInspecting) return;
    if (isCandidateMenuOpen()) return;
    if (updateAreaSelection(event)) return;
    latestHoverEvent = event;
    if (pendingHoverFrame) return;
    pendingHoverFrame = true;
    scheduleFrame(() => {
      pendingHoverFrame = false;
      if (!latestHoverEvent) return;
      inspectByPointer(latestHoverEvent);
    });
  };

  const handleAreaSelectionMove = (event: Event) => {
    if (!isInspecting || selectionLocked || !hasPointerPoint(event)) return;
    if (isCandidateMenuOpen()) return;
    if (updateAreaSelection(event)) {
      suppressEvent(event, { preventDefault: true, immediate: true });
    }
  };

  const scheduleLongPressCandidateMenu = (event: Event, target: HTMLElement | null) => {
    const isPointerLongPress = event.type === 'pointerdown' && 'pointerType' in event && (event as PointerEvent).pointerType !== 'mouse';
    const isTouchLongPress = event.type === 'touchstart';
    if (!isPointerLongPress && !isTouchLongPress) return;

    const point = getEventPoint(event);
    if (!point) return;
    clearLongPress();
    longPressTimer = win.setTimeout(() => {
      longPressTimer = null;
      if (!isInspecting || selectionLocked || isAreaSelecting) return;
      showCandidateMenu(point, target);
    }, longPressDelay);
  };

  const handlePointerSuppression = (event: Event) => {
    if (!isInspecting) return;
    const target = event.target as HTMLElement | null;
    if (!target || isInspectorChromeTarget(target)) return;
    if (selectionLocked) {
      suppressEvent(event, { preventDefault: true, immediate: true });
      return;
    }

    const isTouchSelectionEvent =
      event.type === 'touchend' ||
      (event.type === 'pointerup' && 'pointerType' in event && (event as PointerEvent).pointerType !== 'mouse');

    if ((event.type === 'pointerdown' || event.type === 'mousedown') && hasPointerPoint(event)) {
      areaStart = { x: event.clientX, y: event.clientY };
      isAreaSelecting = false;
    }
    scheduleLongPressCandidateMenu(event, target);

    suppressEvent(event, { preventDefault: true, immediate: true });
    if ((event.type === 'pointerup' || event.type === 'mouseup') && hasPointerPoint(event)) {
      clearLongPress();
      const areaRect = buildAreaRect(event);
      if (isAreaSelecting && areaRect) {
        clearAreaSelection();
        selectAreaDebugTarget(areaRect);
        return;
      }
      clearAreaSelection();
    }
    if (event.type === 'touchend') clearLongPress();
    if ((event.type === 'pointerup' || event.type === 'mouseup' || event.type === 'touchend') && isCandidateMenuOpen()) {
      clearAreaSelection();
      return;
    }

    if (isTouchSelectionEvent) {
      selectDebugTarget(target, hasPointerPoint(event) ? event : undefined);
    }
  };

  const handleContextMenu = (event: MouseEvent) => {
    if (!isInspecting) return;
    const target = event.target as HTMLElement | null;
    if (!target || isInspectorChromeTarget(target)) return;
    suppressEvent(event, { preventDefault: true, immediate: true });
    clearLongPress();
    showCandidateMenu({ clientX: event.clientX, clientY: event.clientY }, target);
  };

  const handleWindowClick = (event: MouseEvent) => {
    if (!isInspecting) return;
    const target = event.target as HTMLElement | null;
    if (!target || target === toggleBtn) return;
    if (isInspectorChromeTarget(target)) {
      return;
    }

    suppressEvent(event, { preventDefault: true, immediate: true });
    if (isCandidateMenuOpen()) {
      hideCandidateMenu();
      return;
    }
    if (selectionLocked) {
      return;
    }
    selectDebugTarget(target, event);
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
  win.addEventListener('pointermove', handleAreaSelectionMove, { capture: true });
  win.addEventListener('mousemove', handleAreaSelectionMove, { capture: true });
  win.addEventListener('pointerdown', handlePointerSuppression, { capture: true });
  win.addEventListener('pointerup', handlePointerSuppression, { capture: true });
  win.addEventListener('mousedown', handlePointerSuppression, { capture: true });
  win.addEventListener('mouseup', handlePointerSuppression, { capture: true });
  win.addEventListener('touchstart', handlePointerSuppression, { capture: true });
  win.addEventListener('touchend', handlePointerSuppression, { capture: true });
  win.addEventListener('click', handleWindowClick, { capture: true });
  win.addEventListener('contextmenu', handleContextMenu, { capture: true });
  win.addEventListener('keydown', handleKeyDown);
  updateAnchorForDialogs();

  scopedWindow.__reactDebugInspectorCleanup__ = () => {
    dialogObserver.disconnect();
    win.removeEventListener('beforeunload', handleBeforeUnload);
    win.removeEventListener('resize', scheduleAnchorUpdate);
    win.removeEventListener('scroll', scheduleAnchorUpdate, true);
    doc.removeEventListener('mousemove', handleMouseMove);
    win.removeEventListener('pointermove', handleAreaSelectionMove, { capture: true });
    win.removeEventListener('mousemove', handleAreaSelectionMove, { capture: true });
    win.removeEventListener('pointerdown', handlePointerSuppression, { capture: true });
    win.removeEventListener('pointerup', handlePointerSuppression, { capture: true });
    win.removeEventListener('mousedown', handlePointerSuppression, { capture: true });
    win.removeEventListener('mouseup', handlePointerSuppression, { capture: true });
    win.removeEventListener('touchstart', handlePointerSuppression, { capture: true });
    win.removeEventListener('touchend', handlePointerSuppression, { capture: true });
    win.removeEventListener('click', handleWindowClick, { capture: true });
    win.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    win.removeEventListener('keydown', handleKeyDown);
    for (const eventName of shieldedEvents) {
      toggleBtn.removeEventListener(eventName, stopTogglePropagation);
    }
    singleToggleBtn.removeEventListener('click', handleSingleToggleClick);
    continuousToggleBtn.removeEventListener('click', handleContinuousToggleClick);
    overlay?.remove();
    selectionOverlay?.remove();
    tooltip?.remove();
    actionMenu?.remove();
    candidateMenu?.remove();
    candidateActionMenu?.remove();
    inspectorStyle.remove();
    toggleBtn.remove();
    delete scopedWindow.__reactDebugInspectorCleanup__;
  };
}
