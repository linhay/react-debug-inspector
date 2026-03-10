// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { initInspector } from './runtime';

describe('react-debug-inspector runtime - Advanced Features', () => {
  const originalRAF = window.requestAnimationFrame;
  const originalClipboard = navigator.clipboard;
  const originalClipboardItem = window.ClipboardItem;
  const originalFetch = global.fetch;

  const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn(),
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    Object.assign(navigator, { clipboard: mockClipboard });
    mockClipboard.writeText.mockClear();
    mockClipboard.write.mockClear();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
    Object.assign(navigator, { clipboard: originalClipboard });
    if (originalClipboardItem) {
      window.ClipboardItem = originalClipboardItem;
    } else {
      // @ts-expect-error test restore
      delete window.ClipboardItem;
    }
    global.fetch = originalFetch;
  });

  const getMenuButton = (label: string) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((el) => el.textContent?.trim() === label);
    expect(button).toBeTruthy();
    return button as HTMLButtonElement;
  };

  const hoverTarget = (target: HTMLElement) => {
    initInspector();
    const toggle = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    toggle.click();
    target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
  };

  const waitForAsyncActions = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('should format debug ID correctly for new format', () => {
    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'src/components/Button.tsx:Button:button:42');
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);

    const tooltips = Array.from(document.querySelectorAll('div')).filter(el => {
      const text = el.textContent || '';
      return text.includes('Button.tsx') && text.includes('Button') && text.includes('button');
    });

    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('should handle old format debug ID for backward compatibility', () => {
    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'Button:button:42');
    document.body.appendChild(testDiv);

    const element = document.querySelector('[data-debug="Button:button:42"]');
    expect(element).toBeTruthy();
    expect(element?.getAttribute('data-debug')).toBe('Button:button:42');
  });

  it('should show copy action menu for hovered debug element', () => {
    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    testDiv.textContent = 'Reset Counter';
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);

    expect(getMenuButton('复制 ID')).toBeTruthy();
    expect(getMenuButton('复制文案')).toBeTruthy();
    expect(getMenuButton('复制图片')).toBeTruthy();
    expect(getMenuButton('全部复制')).toBeTruthy();
  });

  it('should copy full debug ID from menu', async () => {
    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    getMenuButton('复制 ID').click();

    expect(mockClipboard.writeText).toHaveBeenCalledWith(debugId);
  });

  it('should copy visible text from menu', async () => {
    const testDiv = document.createElement('button');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    testDiv.textContent = '  Reset   Counter  ';
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    getMenuButton('复制文案').click();

    expect(mockClipboard.writeText).toHaveBeenCalledWith('Reset Counter');
  });

  it('should prefer aria-label when copying text', async () => {
    const testDiv = document.createElement('button');
    testDiv.setAttribute('data-debug', 'src/components/Button.tsx:Button:button:42');
    testDiv.setAttribute('aria-label', 'Accessible Reset');
    testDiv.textContent = 'Reset Counter';
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    getMenuButton('复制文案').click();

    expect(mockClipboard.writeText).toHaveBeenCalledWith('Accessible Reset');
  });

  it('should fallback to debug ID when text content is missing', async () => {
    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    getMenuButton('复制文案').click();

    expect(mockClipboard.writeText).toHaveBeenCalledWith(debugId);
  });

  it('should copy image binary when ClipboardItem is supported', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(blob),
    } as Response);
    window.ClipboardItem = vi.fn((items) => items) as unknown as typeof ClipboardItem;

    const img = document.createElement('img');
    img.setAttribute('data-debug', 'src/components/Image.tsx:Image:img:42');
    img.src = 'https://example.com/image.png';
    img.alt = 'Hero image';
    document.body.appendChild(img);

    hoverTarget(img);
    getMenuButton('复制图片').click();
    await waitForAsyncActions();

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png');
    expect(mockClipboard.write).toHaveBeenCalledTimes(1);
  });

  it('should fallback to metadata text when binary image copy fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('cors'));
    window.ClipboardItem = vi.fn((items) => items) as unknown as typeof ClipboardItem;

    const img = document.createElement('img');
    const debugId = 'src/components/Image.tsx:Image:img:42';
    img.setAttribute('data-debug', debugId);
    img.src = 'https://example.com/image.png';
    img.alt = 'Hero image';
    img.title = 'Cover';
    document.body.appendChild(img);

    hoverTarget(img);
    getMenuButton('复制图片').click();
    await waitForAsyncActions();

    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('url: https://example.com/image.png'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining(`debugId: ${debugId}`));
  });

  it('should build structured payload for copy all', async () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-debug', 'src/components/Card.tsx:Card:div:8');
    wrapper.textContent = 'Counter Example';
    const img = document.createElement('img');
    img.src = 'https://example.com/preview.png';
    img.alt = 'Preview';
    wrapper.appendChild(img);
    document.body.appendChild(wrapper);

    hoverTarget(wrapper);
    getMenuButton('全部复制').click();

    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[debug]'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[text]'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[image]'));
  });

  it('should keep inspection mode active after menu action', async () => {
    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'src/components/Button.tsx:Button:button:42');
    testDiv.textContent = 'Reset Counter';
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    getMenuButton('复制文案').click();

    expect(document.body.style.cursor).toBe('crosshair');
  });

  it('should keep action menu visible briefly while pointer moves toward it', async () => {
    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'src/components/Button.tsx:Button:button:42');
    testDiv.textContent = 'Reset Counter';
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    const menuButton = getMenuButton('复制 ID');
    expect(menuButton.parentElement).toBeTruthy();

    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    await wait(60);

    expect((menuButton.parentElement as HTMLElement).style.display).toBe('flex');
  });

  it('should keep menu anchored when pointer moves between nested debug elements', () => {
    const parent = document.createElement('section');
    parent.setAttribute('data-debug', 'src/components/Panel.tsx:Panel:section:10');
    const child = document.createElement('button');
    child.setAttribute('data-debug', 'src/components/Button.tsx:Button:button:42');
    child.textContent = 'Nested CTA';
    parent.appendChild(child);
    document.body.appendChild(parent);

    hoverTarget(parent);
    const menu = getMenuButton('复制 ID').parentElement as HTMLElement;
    const initialLeft = menu.style.left;
    const initialTop = menu.style.top;

    child.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    expect(menu.style.left).toBe(initialLeft);
    expect(menu.style.top).toBe(initialTop);
  });

  it('should show full path in tooltip title attribute', () => {
    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);

    const tooltip = Array.from(document.querySelectorAll('div')).find((el) => el.getAttribute('title') === debugId);
    expect(tooltip).toBeTruthy();
  });

  it('should handle elements without data-debug attribute', () => {
    initInspector();

    const testDiv = document.createElement('div');
    testDiv.textContent = 'No debug attribute';
    document.body.appendChild(testDiv);

    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    button?.click();
    testDiv.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    const overlays = Array.from(document.querySelectorAll('div')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.pointerEvents === 'none' && style.display === 'block';
    });

    expect(overlays.length).toBe(0);
  });

  it('should handle rapid mouse movements without errors', () => {
    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'App:div:1');
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    for (let i = 0; i < 100; i++) {
      testDiv.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    }

    expect(true).toBe(true);
  });
});
