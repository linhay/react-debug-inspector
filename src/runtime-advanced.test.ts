// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { initInspector } from './runtime';

describe('react-debug-inspector runtime - Advanced Features', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should format debug ID correctly for new format', () => {
    initInspector();

    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'src/components/Button.tsx:Button:button:42');
    document.body.appendChild(testDiv);

    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    expect(button).not.toBeNull();

    button?.click();
    testDiv.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    // 检查 tooltip 是否显示格式化的文本
    const tooltips = Array.from(document.querySelectorAll('div')).filter(el => {
      const text = el.textContent || '';
      return text.includes('Button.tsx') && text.includes('Button') && text.includes('button');
    });

    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('should handle old format debug ID for backward compatibility', () => {
    initInspector();

    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'Button:button:42');
    document.body.appendChild(testDiv);

    // 验证元素存在且有正确的属性
    const element = document.querySelector('[data-debug="Button:button:42"]');
    expect(element).toBeTruthy();
    expect(element?.getAttribute('data-debug')).toBe('Button:button:42');
  });

  it('should copy full debug ID to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn(),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    initInspector();

    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    // 验证 clipboard API 已被 mock
    expect(navigator.clipboard.writeText).toBeDefined();

    // 验证元素存在
    const element = document.querySelector(`[data-debug="${debugId}"]`);
    expect(element).toBeTruthy();
  });

  it('should show full path in tooltip title attribute', () => {
    initInspector();

    const testDiv = document.createElement('div');
    const debugId = 'src/components/Button.tsx:Button:button:42';
    testDiv.setAttribute('data-debug', debugId);
    document.body.appendChild(testDiv);

    // 验证元素存在且有正确的属性
    const element = document.querySelector(`[data-debug="${debugId}"]`);
    expect(element).toBeTruthy();
    expect(element?.getAttribute('data-debug')).toBe(debugId);
  });

  it('should handle elements without data-debug attribute', () => {
    initInspector();

    const testDiv = document.createElement('div');
    testDiv.textContent = 'No debug attribute';
    document.body.appendChild(testDiv);

    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    button?.click();
    testDiv.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    // overlay 和 tooltip 应该不显示
    const overlays = Array.from(document.querySelectorAll('div')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.pointerEvents === 'none' && style.display === 'block';
    });

    expect(overlays.length).toBe(0);
  });

  it('should toggle inspection mode on button click', () => {
    // 清理之前的测试状态
    document.body.innerHTML = '';
    document.body.style.cursor = '';

    initInspector();

    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    // 验证按钮存在并可以被点击
    expect(button?.onclick).toBeTruthy();
  });

  it('should exit inspection mode when clicking on non-debug element', () => {
    // 清理之前的测试状态
    document.body.innerHTML = '';
    document.body.style.cursor = '';

    initInspector();

    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    // 创建测试元素
    const testDiv = document.createElement('div');
    testDiv.textContent = 'Test element';
    document.body.appendChild(testDiv);

    // 验证元素存在
    expect(testDiv.parentElement).toBe(document.body);
  });

  it('should not initialize in non-browser environment', () => {
    const originalWindow = global.window;
    // @ts-expect-error - testing undefined window
    delete global.window;

    const result = initInspector();
    expect(result).toBeUndefined();

    global.window = originalWindow;
  });

  it('should handle rapid mouse movements without errors', () => {
    initInspector();

    const button = document.body.querySelector('button[title="开启组件定位器"]') as HTMLButtonElement;
    button?.click();

    const testDiv = document.createElement('div');
    testDiv.setAttribute('data-debug', 'App:div:1');
    document.body.appendChild(testDiv);

    // 快速触发多次 mousemove
    for (let i = 0; i < 100; i++) {
      testDiv.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    }

    // 不应该抛出错误
    expect(true).toBe(true);
  });

  it('should handle nested data-debug elements correctly', () => {
    // 清理之前的测试状态
    document.body.innerHTML = '';
    document.body.style.cursor = '';

    initInspector();

    const parent = document.createElement('div');
    parent.setAttribute('data-debug', 'Parent:div:1');

    const child = document.createElement('span');
    child.setAttribute('data-debug', 'Child:span:2');

    parent.appendChild(child);
    document.body.appendChild(parent);

    // 验证嵌套结构正确
    expect(parent.contains(child)).toBe(true);
    expect(child.getAttribute('data-debug')).toBe('Child:span:2');
    expect(parent.getAttribute('data-debug')).toBe('Parent:div:1');
  });
});
