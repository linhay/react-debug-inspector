// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { initInspector } from './runtime';

describe('react-debug-inspector runtime', () => {
  const waitNextFrame = () => new Promise((resolve) => setTimeout(resolve, 20));
  const getToggleCapsule = () =>
    document.body.querySelector('div[title="组件定位器"]') as HTMLDivElement | null;
  const getSingleToggle = () =>
    document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
  const getContinuousToggle = () =>
    document.body.querySelector('button[title="持续定位：保持开启，按 Esc 退出"]') as HTMLButtonElement | null;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should move toggle button to left when dialog is visible', async () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    await waitNextFrame();

    expect(button.style.left).toBe('24px');
    expect(button.style.right).toBe('');
  });

  it('should not move toggle button when pointer moves after mousedown', () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    const initialLeft = button.style.left;
    const initialTop = button.style.top;
    const initialRight = button.style.right;
    const initialBottom = button.style.bottom;

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 30, clientY: 30 }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 160 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 200, clientY: 160 }));

    expect(button.style.left).toBe(initialLeft);
    expect(button.style.top).toBe(initialTop);
    expect(button.style.right).toBe(initialRight);
    expect(button.style.bottom).toBe(initialBottom);
  });

  it('should keep toggle button on body while dialog is visible', async () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    await waitNextFrame();

    expect(button.parentElement).toBe(document.body);
  });

  it('should ignore aria-hidden dialog hosts', async () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    const hiddenDialog = document.createElement('div');
    hiddenDialog.setAttribute('role', 'dialog');
    hiddenDialog.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hiddenDialog);

    const visibleDialog = document.createElement('div');
    visibleDialog.setAttribute('role', 'dialog');
    document.body.appendChild(visibleDialog);
    await waitNextFrame();

    expect(button.parentElement).toBe(document.body);
  });

  it('should remain visible when dialog has transform host', async () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.overflow = 'hidden';
    document.body.appendChild(dialog);
    await waitNextFrame();

    expect(button.parentElement).toBe(document.body);
    expect(button.style.left).toBe('24px');
    expect(button.style.right).toBe('');
  });

  it('should move toggle button into radix dialog node when dialog is visible', async () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    const portalHost = document.createElement('div');
    portalHost.setAttribute('data-radix-portal', '');
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    portalHost.appendChild(dialog);
    document.body.appendChild(portalHost);
    await waitNextFrame();

    expect(button.parentElement).toBe(dialog);
  });

  it('should clear hidden and inert flags from toggle button while dialog is visible', async () => {
    initInspector();
    const button = getToggleCapsule();
    expect(button).not.toBeNull();
    if (!button) return;

    button.setAttribute('aria-hidden', 'true');
    button.setAttribute('data-aria-hidden', 'true');
    button.setAttribute('inert', '');

    const portalHost = document.createElement('div');
    portalHost.setAttribute('data-radix-portal', '');
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    portalHost.appendChild(dialog);
    document.body.appendChild(portalHost);
    await waitNextFrame();

    expect(button.getAttribute('aria-hidden')).toBeNull();
    expect(button.getAttribute('data-aria-hidden')).toBeNull();
    expect(button.hasAttribute('inert')).toBe(false);
    expect(button.style.pointerEvents).toBe('auto');
  });

  it('should avoid bottom-right when that area is obstructed', async () => {
    const obstruction = document.createElement('div');
    obstruction.id = 'obstruction';
    document.body.appendChild(obstruction);

    const original = document.elementsFromPoint;
    document.elementsFromPoint = (() => {
      const btn = getToggleCapsule();
      if (btn?.style.right === '24px' && btn?.style.bottom === '24px') {
        return [obstruction, document.body];
      }
      if (typeof original === 'function') return original.call(document, 0, 0);
      return [document.body];
    }) as typeof document.elementsFromPoint;

    try {
      initInspector();
      const button = getToggleCapsule();
      expect(button).not.toBeNull();
      if (!button) return;

      expect(button.style.right === '24px' && button.style.bottom === '24px').toBe(false);
    } finally {
      if (original) {
        document.elementsFromPoint = original;
      } else {
        // @ts-expect-error restore optional API in jsdom
        delete document.elementsFromPoint;
      }
    }
  });

  it('should shield toggle button click from document bubble listeners', () => {
    initInspector();
    const button = getSingleToggle();
    expect(button).not.toBeNull();
    if (!button) return;

    let documentBubbleClicks = 0;
    const bubbleListener = () => {
      documentBubbleClicks += 1;
    };
    document.addEventListener('click', bubbleListener, false);

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    document.removeEventListener('click', bubbleListener, false);
    expect(documentBubbleClicks).toBe(0);
  });

  it('should shield toggle button mousedown from document bubble listeners', () => {
    initInspector();
    const button = getSingleToggle();
    expect(button).not.toBeNull();
    if (!button) return;

    let documentBubbleDown = 0;
    const bubbleListener = () => {
      documentBubbleDown += 1;
    };
    document.addEventListener('mousedown', bubbleListener, false);

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    document.removeEventListener('mousedown', bubbleListener, false);
    expect(documentBubbleDown).toBe(0);
  });

  it('should stop later window capture listeners while selecting a debug target', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => undefined,
      },
    });

    const target = document.createElement('article');
    target.setAttribute('data-debug', 'src/pages/DetailCard.tsx:DetailCard:article:12');
    target.textContent = 'Open details';
    document.body.appendChild(target);

    initInspector();
    const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
    expect(toggle).not.toBeNull();
    if (!toggle) return;

    let laterCaptureClicks = 0;
    const laterCaptureListener = () => {
      laterCaptureClicks += 1;
    };
    window.addEventListener('click', laterCaptureListener, { capture: true });

    try {
      toggle.click();
      laterCaptureClicks = 0;
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(laterCaptureClicks).toBe(0);
    } finally {
      window.removeEventListener('click', laterCaptureListener, { capture: true });
    }
  });

  it('should exit after one selection in single mode', async () => {
    vi.useFakeTimers();
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    try {
      const target = document.createElement('article');
      const debugId = 'src/pages/DetailCard.tsx:DetailCard:article:12';
      target.setAttribute('data-debug', debugId);
      target.textContent = 'Open details';
      document.body.appendChild(target);

      initInspector();
      const toggle = getSingleToggle();
      expect(toggle).not.toBeNull();
      if (!toggle) return;

      toggle.click();
      expect(document.body.style.cursor).toBe('crosshair');
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(601);

      expect(writeSpyCalls).toContain(debugId);
      expect(document.body.style.cursor).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should keep inspecting after selection in continuous mode', async () => {
    vi.useFakeTimers();
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    try {
      const target = document.createElement('article');
      const debugId = 'src/pages/DetailCard.tsx:DetailCard:article:12';
      target.setAttribute('data-debug', debugId);
      target.textContent = 'Open details';
      document.body.appendChild(target);

      initInspector();
      const toggle = getContinuousToggle();
      expect(toggle).not.toBeNull();
      if (!toggle) return;

      toggle.click();
      expect(document.body.style.cursor).toBe('crosshair');
      target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();

      const feedback = Array.from(document.querySelectorAll('div')).find((element) =>
        element.textContent?.includes('已复制 Debug ID'),
      ) as HTMLDivElement | undefined;
      expect(feedback).toBeTruthy();
      expect(feedback?.style.display).not.toBe('none');

      await vi.advanceTimersByTimeAsync(601);

      expect(writeSpyCalls).toContain(debugId);
      expect(document.body.style.cursor).toBe('crosshair');
      expect(feedback?.style.display).toBe('none');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(document.body.style.cursor).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should stop later window mousedown capture listeners while selecting a debug target', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => undefined,
      },
    });

    const target = document.createElement('article');
    target.setAttribute('data-debug', 'src/pages/DetailCard.tsx:DetailCard:article:12');
    target.textContent = 'Open details';
    document.body.appendChild(target);

    initInspector();
    const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
    expect(toggle).not.toBeNull();
    if (!toggle) return;

    let laterCaptureMouseDowns = 0;
    const laterCaptureListener = () => {
      laterCaptureMouseDowns += 1;
    };
    window.addEventListener('mousedown', laterCaptureListener, { capture: true });

    try {
      toggle.click();
      laterCaptureMouseDowns = 0;
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

      expect(laterCaptureMouseDowns).toBe(0);
    } finally {
      window.removeEventListener('mousedown', laterCaptureListener, { capture: true });
    }
  });

  it('should stop later window pointerdown capture listeners while selecting a debug target', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => undefined,
      },
    });

    const target = document.createElement('article');
    target.setAttribute('data-debug', 'src/pages/DetailCard.tsx:DetailCard:article:12');
    target.textContent = 'Open details';
    document.body.appendChild(target);

    initInspector();
    const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
    expect(toggle).not.toBeNull();
    if (!toggle) return;

    let laterCapturePointerDowns = 0;
    const laterCaptureListener = () => {
      laterCapturePointerDowns += 1;
    };
    window.addEventListener('pointerdown', laterCaptureListener, { capture: true });

    try {
      toggle.click();
      laterCapturePointerDowns = 0;
      target.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));

      expect(laterCapturePointerDowns).toBe(0);
    } finally {
      window.removeEventListener('pointerdown', laterCaptureListener, { capture: true });
    }
  });

  it('should copy debug id on touchend selection without waiting for click', async () => {
    const writeSpyCalls: string[] = [];
    const clipboard = {
      writeText: async (value: string) => {
        writeSpyCalls.push(value);
      },
    };
    Object.assign(navigator, { clipboard });

    const target = document.createElement('article');
    const debugId = 'src/pages/DetailCard.tsx:DetailCard:article:12';
    target.setAttribute('data-debug', debugId);
    target.textContent = 'Open details';
    document.body.appendChild(target);

    initInspector();
    const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
    expect(toggle).not.toBeNull();
    if (!toggle) return;

    let laterCaptureTouchEnds = 0;
    const laterCaptureListener = () => {
      laterCaptureTouchEnds += 1;
    };
    window.addEventListener('touchend', laterCaptureListener, { capture: true });

    try {
      toggle.click();
      laterCaptureTouchEnds = 0;
      target.dispatchEvent(new Event('touchend', { bubbles: true, cancelable: true }));

      expect(laterCaptureTouchEnds).toBe(0);
      expect(writeSpyCalls).toContain(debugId);
    } finally {
      window.removeEventListener('touchend', laterCaptureListener, { capture: true });
    }
  });

  it('should select the best debug target from a dragged area', () => {
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    const parent = document.createElement('section');
    parent.setAttribute('data-debug', 'src/pages/App.tsx:App:section:1');
    parent.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const target = document.createElement('button');
    const debugId = 'src/pages/Button.tsx:Button:button:12';
    target.setAttribute('data-debug', debugId);
    target.getBoundingClientRect = () => ({
      left: 50, top: 50, right: 90, bottom: 90, width: 40, height: 40, x: 50, y: 50,
      toJSON: () => ({}),
    } as DOMRect);

    parent.appendChild(target);
    document.body.appendChild(parent);

    initInspector();
    const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
    expect(toggle).not.toBeNull();
    if (!toggle) return;

    toggle.click();
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 45, clientY: 45 }));
    target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 95, clientY: 95 }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 95, clientY: 95 }));

    expect(writeSpyCalls).toContain(debugId);
  });

  it('should use elementsFromPoint candidates for point selection', () => {
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    const wrong = document.createElement('div');
    wrong.setAttribute('data-debug', 'src/pages/Wrong.tsx:Wrong:div:1');
    const right = document.createElement('div');
    const debugId = 'src/pages/Right.tsx:Right:div:2';
    right.setAttribute('data-debug', debugId);
    document.body.append(wrong, right);

    const original = document.elementsFromPoint;
    document.elementsFromPoint = (() => [right, wrong, document.body]) as typeof document.elementsFromPoint;

    try {
      initInspector();
      const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
      expect(toggle).not.toBeNull();
      if (!toggle) return;

      toggle.click();
      wrong.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));

      expect(writeSpyCalls).toContain(debugId);
    } finally {
      if (original) {
        document.elementsFromPoint = original;
      } else {
        // @ts-expect-error restore optional API in jsdom
        delete document.elementsFromPoint;
      }
    }
  });

  it('should show point candidates on context menu and select clicked candidate', () => {
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    const parent = document.createElement('section');
    const parentDebugId = 'src/pages/Card.tsx:Card:section:8';
    parent.setAttribute('data-debug', parentDebugId);
    const child = document.createElement('button');
    const childDebugId = 'src/pages/Button.tsx:Button:button:12';
    child.setAttribute('data-debug', childDebugId);
    const other = document.createElement('aside');
    const otherDebugId = 'src/pages/Other.tsx:Other:aside:20';
    other.setAttribute('data-debug', otherDebugId);
    parent.appendChild(child);
    document.body.append(parent, other);

    const original = document.elementsFromPoint;
    let pointStack: Element[] = [child, parent, document.body];
    document.elementsFromPoint = (() => pointStack) as typeof document.elementsFromPoint;

    try {
      initInspector();
      const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
      expect(toggle).not.toBeNull();
      if (!toggle) return;

      toggle.click();
      child.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));

      const parentCandidate = document.body.querySelector(`button[title="${parentDebugId}"]`) as HTMLButtonElement | null;
      expect(parentCandidate).not.toBeNull();
      expect(document.body.querySelector(`button[title="${childDebugId}"]`)).not.toBeNull();

      pointStack = [other, document.body];
      other.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 30, clientY: 30 }));
      const stillPreviewingChild = Array.from(document.body.querySelectorAll('div'))
        .some((el) => el.getAttribute('title') === childDebugId);
      const previewingOther = Array.from(document.body.querySelectorAll('div'))
        .some((el) => el.getAttribute('title') === otherDebugId);
      expect(stillPreviewingChild).toBe(true);
      expect(previewingOther).toBe(false);

      parentCandidate?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      expect(document.body.querySelector('button[title="复制选项: 复制 Debug ID"]')).not.toBeNull();
      parentCandidate?.click();

      expect(writeSpyCalls).toContain(parentDebugId);
    } finally {
      if (original) {
        document.elementsFromPoint = original;
      } else {
        // @ts-expect-error restore optional API in jsdom
        delete document.elementsFromPoint;
      }
    }
  });

  it('should open copy action menu from a point candidate', () => {
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    const target = document.createElement('button');
    const debugId = 'src/pages/Button.tsx:Button:button:12';
    target.setAttribute('data-debug', debugId);
    target.textContent = 'Copy me';
    document.body.appendChild(target);

    const original = document.elementsFromPoint;
    document.elementsFromPoint = (() => [target, document.body]) as typeof document.elementsFromPoint;

    try {
      initInspector();
      const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
      expect(toggle).not.toBeNull();
      if (!toggle) return;

      toggle.click();
      target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));

      const candidate = document.body.querySelector(`button[title="${debugId}"]`) as HTMLButtonElement | null;
      expect(candidate).not.toBeNull();
      candidate?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      const textAction = document.body.querySelector('button[title="复制选项: 复制文案"]') as HTMLButtonElement | null;
      expect(textAction).not.toBeNull();
      expect(document.body.querySelector('button[title="复制选项: 复制图片"]')).toBeNull();
      textAction?.click();

      expect(writeSpyCalls).toContain('Copy me');
    } finally {
      if (original) {
        document.elementsFromPoint = original;
      } else {
        // @ts-expect-error restore optional API in jsdom
        delete document.elementsFromPoint;
      }
    }
  });

  it('should show point candidates on touch long press without selecting on release', () => {
    vi.useFakeTimers();
    const writeSpyCalls: string[] = [];
    Object.assign(navigator, {
      clipboard: {
        writeText: async (value: string) => {
          writeSpyCalls.push(value);
        },
      },
    });

    const target = document.createElement('button');
    const debugId = 'src/pages/Button.tsx:Button:button:12';
    target.setAttribute('data-debug', debugId);
    document.body.appendChild(target);

    const original = document.elementsFromPoint;
    document.elementsFromPoint = (() => [target, document.body]) as typeof document.elementsFromPoint;

    try {
      initInspector();
      const toggle = document.body.querySelector('button[title="单次定位：选中后自动退出"]') as HTMLButtonElement | null;
      expect(toggle).not.toBeNull();
      if (!toggle) return;

      toggle.click();
      const pointerDown = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 });
      Object.defineProperty(pointerDown, 'pointerType', { value: 'touch' });
      target.dispatchEvent(pointerDown);
      vi.advanceTimersByTime(500);

      const candidate = document.body.querySelector(`button[title="${debugId}"]`) as HTMLButtonElement | null;
      expect(candidate).not.toBeNull();

      const pointerUp = new MouseEvent('pointerup', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 });
      Object.defineProperty(pointerUp, 'pointerType', { value: 'touch' });
      target.dispatchEvent(pointerUp);
      expect(writeSpyCalls).not.toContain(debugId);

      candidate?.click();
      expect(writeSpyCalls).toContain(debugId);
    } finally {
      vi.useRealTimers();
      if (original) {
        document.elementsFromPoint = original;
      } else {
        // @ts-expect-error restore optional API in jsdom
        delete document.elementsFromPoint;
      }
    }
  });
});
