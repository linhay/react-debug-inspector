// @vitest-environment jsdom

import { describe, expect, it, beforeEach } from 'vitest';
import { initInspector } from './runtime';

describe('react-debug-inspector runtime', () => {
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
    await Promise.resolve();

    expect(button.style.left).toBe('24px');
    expect(button.style.right).toBe('');
  });

  it('should keep user dragged position when dialog is visible', async () => {
    initInspector();
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    if (!button) return;

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 30, clientY: 30 }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 160 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 200, clientY: 160 }));

    const draggedLeft = button.style.left;
    const draggedTop = button.style.top;
    expect(draggedLeft).not.toBe('');
    expect(draggedTop).not.toBe('');

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    await Promise.resolve();

    expect(button.style.left).toBe(draggedLeft);
    expect(button.style.top).toBe(draggedTop);
  });

  it('should attach toggle button into dialog while dialog is visible', async () => {
    initInspector();
    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    if (!button) return;

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    await Promise.resolve();

    expect(button.parentElement).toBe(dialog);
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
    await Promise.resolve();

    expect(button.parentElement).toBe(visibleDialog);
  });

  it('should avoid bottom-right when that area is obstructed', async () => {
    const obstruction = document.createElement('div');
    obstruction.id = 'obstruction';
    document.body.appendChild(obstruction);

    const original = document.elementsFromPoint;
    document.elementsFromPoint = ((x: number, y: number) => {
      if (x > window.innerWidth - 120 && y > window.innerHeight - 120) {
        return [obstruction, document.body];
      }
      if (typeof original === 'function') return original.call(document, x, y);
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
});
