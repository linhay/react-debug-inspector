/**
 * 初始化浏览器端的元素定位器交互界面
 */
export function initInspector() {
  if (typeof window === 'undefined') return;

  let isInspecting = false;

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

  // 2. 创建高亮遮罩
  const overlay = document.createElement('div');
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
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed;
    pointer-events: none;
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
  `;
  document.body.appendChild(tooltip);

  const stopInspecting = () => {
    isInspecting = false;
    toggleBtn.style.transform = 'scale(1)';
    toggleBtn.style.background = '#0ea5e9';
    document.body.style.cursor = '';
    overlay.style.display = 'none';
    tooltip.style.display = 'none';
  };

  toggleBtn.onclick = () => {
    isInspecting = !isInspecting;
    if (isInspecting) {
      toggleBtn.style.transform = 'scale(0.9)';
      toggleBtn.style.background = '#ef4444';
      document.body.style.cursor = 'crosshair';
    } else {
      stopInspecting();
    }
  };

  window.addEventListener('mousemove', (e) => {
    if (!isInspecting) return;
    const target = e.target as HTMLElement;
    if (target === toggleBtn || target === overlay || target === tooltip) return;

    const debugEl = target.closest('[data-debug]') as HTMLElement;
    if (debugEl) {
      const debugId = debugEl.getAttribute('data-debug') || '';
      const rect = debugEl.getBoundingClientRect();

      overlay.style.display = 'block';
      overlay.style.top = rect.top + 'px';
      overlay.style.left = rect.left + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';

      tooltip.style.display = 'block';
      tooltip.textContent = debugId;
      tooltip.style.color = '#38bdf8';

      const tooltipY = rect.top < 30 ? rect.bottom + 4 : rect.top - 28;
      tooltip.style.top = tooltipY + 'px';
      tooltip.style.left = rect.left + 'px';
    } else {
      overlay.style.display = 'none';
      tooltip.style.display = 'none';
    }
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
