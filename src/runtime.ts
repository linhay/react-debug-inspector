/**
 * 初始化浏览器端的元素定位器交互界面
 */
export function initInspector() {
  if (typeof window === 'undefined') return;

  let isInspecting = false;
  let hasUserPosition = false;
  let isDragging = false;
  let pointerMoved = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let overlay: HTMLDivElement | null = null;
  let tooltip: HTMLDivElement | null = null;
  const edgeOffset = 24;
  type Anchor = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  // 1. 创建触发按钮
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
  document.body.appendChild(toggleBtn);

  const applyAnchor = (anchor: Anchor) => {
    if (hasUserPosition) return;
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
    if (typeof document === 'undefined') return [] as HTMLElement[];
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
    // Some dialog libraries mark outside nodes as hidden/inert.
    // Ensure the inspector trigger always remains interactive.
    toggleBtn.removeAttribute('aria-hidden');
    toggleBtn.removeAttribute('data-aria-hidden');
    toggleBtn.removeAttribute('inert');
    if ('inert' in toggleBtn) {
      (toggleBtn as HTMLButtonElement & { inert?: boolean }).inert = false;
    }
    toggleBtn.style.pointerEvents = 'auto';
  };

  const isIgnorableObstacle = (el: Element) => {
    if (el === toggleBtn || el === overlay || el === tooltip) return true;
    if (el instanceof HTMLElement) {
      if (el.contains(toggleBtn) || toggleBtn.contains(el)) return true;
      if (overlay && el.contains(overlay)) return true;
      if (tooltip && el.contains(tooltip)) return true;
      if (el === document.body || el === document.documentElement) return true;
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
          const one = document.elementFromPoint?.(x, y);
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
    if (typeof document === 'undefined') return;
    const dialogs = getVisibleDialogs();
    ensureToggleHost(getPreferredHost(dialogs));
    ensureToggleVisible();
    if (dialogs.length > 0) {
      pickBestAnchor(true);
      return;
    }
    pickBestAnchor(false);
  };

  let anchorUpdatePending = false;
  const scheduleAnchorUpdate = () => {
    if (typeof window === 'undefined') return;
    if (anchorUpdatePending) return;
    anchorUpdatePending = true;
    const schedule = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (cb: FrameRequestCallback) => window.setTimeout(() => cb(Date.now()), 16);
    schedule(() => {
      anchorUpdatePending = false;
      updateAnchorForDialogs();
    });
  };

  const dialogObserver = new MutationObserver(() => {
    scheduleAnchorUpdate();
  });

  // 2. 创建高亮遮罩
  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999998;
    background: rgba(14, 165, 233, 0.15);
    border: 2px dashed #0ea5e9;
    display: none;
    transition: all 0.1s ease-out;
  `;
  document.body.appendChild(overlay);

  // 3. 创建提示标签
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
  document.body.appendChild(tooltip);
  dialogObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'open', 'aria-hidden', 'data-aria-hidden', 'inert'],
  });
  window.addEventListener(
    'beforeunload',
    () => {
      dialogObserver.disconnect();
    },
    { once: true },
  );
  window.addEventListener('resize', scheduleAnchorUpdate);
  window.addEventListener('scroll', scheduleAnchorUpdate, true);
  updateAnchorForDialogs();

  const stopInspecting = () => {
    isInspecting = false;
    toggleBtn.style.transform = 'scale(1)';
    toggleBtn.style.background = '#0ea5e9';
    document.body.style.cursor = '';
    overlay.style.display = 'none';
    tooltip.style.display = 'none';
  };

  const onPointerMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = Math.abs(e.clientX - dragStartX);
    const deltaY = Math.abs(e.clientY - dragStartY);
    if (deltaX > 3 || deltaY > 3) {
      pointerMoved = true;
    }
    const left = Math.max(8, Math.min(window.innerWidth - 52, e.clientX - dragOffsetX));
    const top = Math.max(8, Math.min(window.innerHeight - 52, e.clientY - dragOffsetY));
    toggleBtn.style.left = `${left}px`;
    toggleBtn.style.top = `${top}px`;
    toggleBtn.style.right = '';
    toggleBtn.style.bottom = '';
    hasUserPosition = true;
  };

  const onPointerUp = () => {
    isDragging = false;
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
  };

  // Prevent dialog outside-click handlers from receiving toggle pointer/click events.
  const stopTogglePropagation = (event: Event) => {
    event.stopPropagation();
  };
  const shieldedEvents = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
  for (const eventName of shieldedEvents) {
    toggleBtn.addEventListener(eventName, stopTogglePropagation);
  }
  toggleBtn.addEventListener('mousedown', (e) => {
    const rect = toggleBtn.getBoundingClientRect();
    isDragging = true;
    pointerMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
  });

  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    if (pointerMoved) {
      e.preventDefault();
      e.stopPropagation();
      pointerMoved = false;
      return;
    }
    isInspecting = !isInspecting;
    if (isInspecting) {
      toggleBtn.style.transform = 'scale(0.9)';
      toggleBtn.style.background = '#ef4444';
      document.body.style.cursor = 'crosshair';
    } else {
      stopInspecting();
    }
  };

  // 格式化显示文本：优化长路径显示
  const formatDebugId = (debugId: string) => {
    const parts = debugId.split(':');
    if (parts.length === 4) {
      // 新格式: filePath:componentName:tagName:line
      const [filePath, componentName, tagName, line] = parts;
      // 只显示文件名（不含路径）
      const fileName = filePath.split('/').pop() || filePath;
      return `${fileName} › ${componentName} › ${tagName}:${line}`;
    }
    // 兼容旧格式: componentName:tagName:line
    return debugId.replace(/:/g, ' › ');
  };

  const inspectByPointer = (e: MouseEvent) => {
    if (!isInspecting) return;
    const target = e.target as HTMLElement;
    if (target === toggleBtn || target === overlay || target === tooltip) return;

    const debugEl = target.closest('[data-debug]') as HTMLElement;
    if (debugEl && debugEl === lastHoveredDebugEl) return;
    if (debugEl) {
      const debugId = debugEl.getAttribute('data-debug') || '';
      const rect = debugEl.getBoundingClientRect();

      overlay.style.display = 'block';
      overlay.style.top = rect.top + 'px';
      overlay.style.left = rect.left + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';

      tooltip.style.display = 'block';
      tooltip.textContent = formatDebugId(debugId);
      tooltip.style.color = '#38bdf8';
      tooltip.title = debugId; // 完整路径显示在 title 中

      const tooltipY = rect.top < 30 ? rect.bottom + 4 : rect.top - 28;
      tooltip.style.top = tooltipY + 'px';
      tooltip.style.left = rect.left + 'px';
      lastHoveredDebugEl = debugEl;
    } else {
      overlay.style.display = 'none';
      tooltip.style.display = 'none';
      lastHoveredDebugEl = null;
    }
  };

  let pendingHoverFrame = false;
  let latestHoverEvent: MouseEvent | null = null;
  let lastHoveredDebugEl: HTMLElement | null = null;
  document.addEventListener('mousemove', (e) => {
    if (!isInspecting) return;
    latestHoverEvent = e;
    if (pendingHoverFrame) return;
    pendingHoverFrame = true;
    const schedule = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (cb: FrameRequestCallback) => window.setTimeout(() => cb(Date.now()), 16);
    schedule(() => {
      pendingHoverFrame = false;
      if (!latestHoverEvent) return;
      inspectByPointer(latestHoverEvent);
    });
  });

  window.addEventListener(
    'click',
    (e) => {
      if (!isInspecting) return;
      const target = e.target as HTMLElement;
      if (target === toggleBtn) return;

      e.preventDefault();
      e.stopPropagation();

      const debugEl = target.closest('[data-debug]') as HTMLElement;
      if (debugEl) {
        const debugId = debugEl.getAttribute('data-debug');
        if (debugId) {
          navigator.clipboard.writeText(debugId).then(() => {
            tooltip.textContent = '✅ Copied!';
            tooltip.style.color = '#10b981';
            overlay.style.background = 'rgba(16, 185, 129, 0.2)';
            overlay.style.borderColor = '#10b981';
            setTimeout(stopInspecting, 600);
          });
        }
      } else {
        stopInspecting();
      }
    },
    { capture: true },
  );

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isInspecting) stopInspecting();
  });
}
