// @vitest-environment jsdom

import { describe, expect, it, beforeEach } from 'vitest';
import { initInspector } from './runtime';

describe('react-debug-inspector runtime', () => {
  const waitNextFrame = () => new Promise((resolve) => setTimeout(resolve, 20));

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should move toggle button to left when dialog is visible', async () => {
    initInspector();
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
      const btn = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
      if (btn?.style.right === '24px' && btn?.style.bottom === '24px') {
        return [obstruction, document.body];
      }
      if (typeof original === 'function') return original.call(document, 0, 0);
      return [document.body];
    }) as typeof document.elementsFromPoint;

    try {
      initInspector();
      const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const toggle = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
    const toggle = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
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
});
