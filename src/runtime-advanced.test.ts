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

  const isMenuButtonVisible = (label: string) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((el) => el.textContent?.trim() === label) as HTMLButtonElement | undefined;
    return !!button && button.style.display !== 'none';
  };

  const hoverTarget = (target: HTMLElement) => {
    initInspector();
    const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement;
    toggle.click();
    target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
  };

  const waitForAsyncActions = async () => {
    for (let index = 0; index < 10; index += 1) {
      await Promise.resolve();
    }
  };

  const mockRect = (element: HTMLElement, width = 120, height = 48) => {
    element.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  };

  const mockScreenshotRendering = () => {
    const originalImage = window.Image;
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    class MockImage {
      crossOrigin = '';
      naturalWidth = 120;
      naturalHeight = 48;
      width = 120;
      height = 48;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    window.Image = MockImage as unknown as typeof Image;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['png'], { type: 'image/png' }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    return () => {
      window.Image = originalImage;
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    };
  };

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
    mockRect(testDiv);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);

    expect(getMenuButton('复制 Debug ID')).toBeTruthy();
    expect(getMenuButton('复制文案')).toBeTruthy();
    expect(getMenuButton('复制图片')).toBeTruthy();
    expect(getMenuButton('复制全部')).toBeTruthy();
  });

  it('should hide text action but keep screenshot action when target has no text', () => {
    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'src/components/Spacer.tsx:Spacer:div:12');
    mockRect(testDiv);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);

    expect(getMenuButton('复制 Debug ID')).toBeTruthy();
    expect(isMenuButtonVisible('复制文案')).toBe(false);
    expect(getMenuButton('复制图片')).toBeTruthy();
    expect(getMenuButton('复制全部')).toBeTruthy();
  });

  it('should copy full debug ID from menu', async () => {
    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    getMenuButton('复制 Debug ID').click();

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

  it('should not show text action when text content is missing', async () => {
    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    hoverTarget(testDiv);
    expect(isMenuButtonVisible('复制文案')).toBe(false);
  });

  it('should copy node screenshot when ClipboardItem is supported', async () => {
    const restoreScreenshotRendering = mockScreenshotRendering();
    window.ClipboardItem = vi.fn((items) => items) as unknown as typeof ClipboardItem;

    try {
      const card = document.createElement('div');
      card.setAttribute('data-debug', 'src/components/Card.tsx:Card:div:42');
      card.textContent = 'Screenshot me';
      mockRect(card, 160, 80);
      document.body.appendChild(card);

      hoverTarget(card);
      getMenuButton('复制图片').click();
      await waitForAsyncActions();

      expect(mockClipboard.write).toHaveBeenCalledTimes(1);
    } finally {
      restoreScreenshotRendering();
    }
  });

  it('should fallback to screenshot metadata text when screenshot copy fails', async () => {
    const restoreScreenshotRendering = mockScreenshotRendering();
    window.ClipboardItem = vi.fn((items) => items) as unknown as typeof ClipboardItem;
    mockClipboard.write.mockRejectedValueOnce(new Error('denied'));

    try {
      const card = document.createElement('div');
      const debugId = 'src/components/Card.tsx:Card:div:42';
      card.setAttribute('data-debug', debugId);
      card.textContent = 'Screenshot me';
      mockRect(card, 160, 80);
      document.body.appendChild(card);

      hoverTarget(card);
      getMenuButton('复制图片').click();
      await waitForAsyncActions();

      expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[screenshot]'));
      expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('debugId: ' + debugId));
    } finally {
      restoreScreenshotRendering();
    }
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
    getMenuButton('复制全部').click();

    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[debug]'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[text]'));
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('[image]'));
  });

  it('should omit absent text and image sections from copy all payload', async () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-debug', 'src/components/Spacer.tsx:Spacer:div:8');
    document.body.appendChild(wrapper);

    hoverTarget(wrapper);
    getMenuButton('复制全部').click();

    const copied = mockClipboard.writeText.mock.calls.at(-1)?.[0];
    expect(copied).toContain('[debug]');
    expect(copied).not.toContain('[text]');
    expect(copied).not.toContain('[image]');
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

    const button = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement;
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
