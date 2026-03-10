import { test, expect } from '@playwright/test';

test.describe('React Debug Inspector E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should inject data-debug attributes with file paths', async ({ page }) => {
    // 检查主容器是否有 data-debug 属性
    const appDiv = page.locator('.app');
    await expect(appDiv).toBeVisible();

    const debugAttr = await appDiv.getAttribute('data-debug');
    expect(debugAttr).toBeTruthy();
    expect(debugAttr).toContain('App.tsx:App:div');

    // 检查 header 元素
    const header = page.locator('header');
    const headerDebug = await header.getAttribute('data-debug');
    expect(headerDebug).toContain('App.tsx:App:header');

    // 检查 h1 元素
    const h1 = page.locator('h1');
    const h1Debug = await h1.getAttribute('data-debug');
    expect(h1Debug).toContain('App.tsx:App:h1');
  });

  test('should show toggle button', async ({ page }) => {
    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveText('🎯');
  });

  test('should enter inspection mode on button click', async ({ page }) => {
    const toggleBtn = page.locator('button[title="开启组件定位器"]');

    // 点击进入检查模式
    await toggleBtn.click();

    // 检查按钮样式变化（背景色变红）
    const bgColor = await toggleBtn.evaluate((el) => (el as HTMLElement).style.background);
    // 可能是 #ef4444 或 rgb(239, 68, 68)
    expect(bgColor === '#ef4444' || bgColor === 'rgb(239, 68, 68)').toBe(true);

    // 检查 body cursor 变化
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('crosshair');
  });

  test('should highlight element on hover in inspection mode', async ({ page }) => {
    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    // 悬停在 h1 元素上
    const h1 = page.locator('h1');
    await h1.hover();

    // 等待一下让 overlay 和 tooltip 显示
    await page.waitForTimeout(100);

    // 检查 overlay 是否显示
    const overlay = page.locator('div').filter({
      has: page.locator('css=[style*="pointer-events: none"]')
    }).first();

    // 检查 tooltip 是否显示并包含正确的文本
    const tooltips = page.locator('div').filter({
      hasText: /App\.tsx.*App.*h1/
    });
    const tooltipCount = await tooltips.count();
    expect(tooltipCount).toBeGreaterThan(0);
  });

  test('should copy debug info on click in inspection mode', async ({ page }) => {
    // 授予剪贴板权限
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    // 点击 h1 元素
    const h1 = page.locator('h1');
    await h1.click();

    // 等待复制完成
    await page.waitForTimeout(200);

    // 检查剪贴板内容
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('App.tsx:App:h1');

    // 检查是否显示成功提示
    const successTooltip = page.locator('div:has-text("✅ Copied!")');
    await expect(successTooltip).toBeVisible();

    // 等待自动退出检查模式
    await page.waitForTimeout(700);

    // 检查是否退出了检查模式
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('');
  });

  test('should exit inspection mode on Escape key', async ({ page }) => {
    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    // 按 Escape 键
    await page.keyboard.press('Escape');

    // 检查是否退出了检查模式
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('');

    // 检查按钮样式恢复
    const bgColor = await toggleBtn.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(14, 165, 233)'); // #0ea5e9
  });

  test('should show copy menu items in inspection mode', async ({ page }) => {
    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    const h1 = page.locator('h1');
    await h1.hover();
    await page.waitForTimeout(100);

    await expect(page.getByRole('button', { name: '复制 ID' })).toBeVisible();
    await expect(page.getByRole('button', { name: '复制文案' })).toBeVisible();
    await expect(page.getByRole('button', { name: '复制图片' })).toBeVisible();
    await expect(page.getByRole('button', { name: '全部复制' })).toBeVisible();
  });

  test('should support copying visible text and image metadata from menu', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    const h1 = page.locator('h1');
    await h1.hover();
    await page.getByRole('button', { name: '复制文案' }).click();
    await expect(page.locator('div:has-text("已复制文案")')).toBeVisible();

    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Inspect Faster, Fix Sooner');

    const image = page.locator('img[alt="Inspector preview card"]');
    await image.hover();
    await page.getByRole('button', { name: '复制图片' }).click();
    await page.waitForTimeout(100);

    const imagePayload = await page.evaluate(() => navigator.clipboard.readText());
    expect(imagePayload).toContain('[image]');
  });

  test('should support copy all payload from menu', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    const example = page.locator('.copy-showcase');
    await example.hover();
    await page.getByRole('button', { name: '全部复制' }).click();
    await page.waitForTimeout(100);

    const payload = await page.evaluate(() => navigator.clipboard.readText());
    expect(payload).toContain('[debug]');
    expect(payload).toContain('[text]');
    expect(payload).toContain('[image]');
  });

  test('should format debug info correctly', async ({ page }) => {
    const toggleBtn = page.locator('button[title="开启组件定位器"]');
    await toggleBtn.click();

    // 悬停在 h1 元素上（更容易定位）
    const h1 = page.locator('h1');
    await h1.hover();

    await page.waitForTimeout(300);

    // 检查页面上是否有包含格式化文本的 tooltip
    const tooltipText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div'));
      const tooltip = elements.find(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'fixed' &&
               style.zIndex === '9999999' &&
               (el.textContent || '').includes('App.tsx');
      });
      return tooltip?.textContent || '';
    });

    expect(tooltipText).toContain('App.tsx');
    expect(tooltipText).toContain('App');
    expect(tooltipText).toContain('h1');
  });

  test('should handle nested components correctly', async ({ page }) => {
    // 检查 Card 组件内标题元素
    const cardTitle = page.locator('.card h3', { hasText: 'Counter' });
    await expect(cardTitle).toBeVisible();
    const titleDebug = await cardTitle.getAttribute('data-debug');
    expect(titleDebug).toContain('App.tsx:Card:h3');

    // 检查 Button 组件（重置按钮）
    const resetButton = page.getByRole('button', { name: 'Reset Counter' });
    await expect(resetButton).toBeVisible();
    const buttonDebug = await resetButton.getAttribute('data-debug');
    expect(buttonDebug).toContain('App.tsx:Button:button');
  });

  test('should work with dynamic content', async ({ page }) => {
    // 点击 Increment 按钮
    const incrementBtn = page.locator('button:has-text("Increment")');
    await incrementBtn.click();

    // 检查计数是否更新
    await expect(page.locator('text=Count: 1')).toBeVisible();

    // 验证 data-debug 属性仍然存在
    const debugAttr = await incrementBtn.getAttribute('data-debug');
    expect(debugAttr).toBeTruthy();
    expect(debugAttr).toContain('App.tsx:Card:button');
  });
});
