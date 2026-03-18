import { test, expect } from '@playwright/test';

test.describe('Demo 视频录制', () => {
  test('应演示多步骤选择与粘贴流程（含可见鼠标）', async ({ page, context }) => {
    test.setTimeout(60_000);

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    await page.addStyleTag({
      content: `
        #demo-visible-cursor {
          position: fixed;
          width: 18px;
          height: 18px;
          border: 2px solid #0ea5e9;
          border-radius: 50%;
          background: rgba(14, 165, 233, 0.2);
          pointer-events: none;
          z-index: 2147483647;
          transform: translate(-9px, -9px);
          transition: width 0.08s ease, height 0.08s ease, background 0.08s ease;
        }
        #demo-visible-cursor.is-clicking {
          width: 24px;
          height: 24px;
          background: rgba(14, 165, 233, 0.35);
        }
      `,
    });

    await page.evaluate(() => {
      const cursor = document.createElement('div');
      cursor.id = 'demo-visible-cursor';
      document.body.appendChild(cursor);

      window.addEventListener('mousemove', (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
      });
      window.addEventListener('mousedown', () => cursor.classList.add('is-clicking'));
      window.addEventListener('mouseup', () => cursor.classList.remove('is-clicking'));
    });

    const inspectButton = page.locator('button[title="开启组件定位器"]');
    const title = page.getByRole('heading', { name: 'Inspect Faster, Fix Sooner' });
    const image = page.locator('img[alt="Inspector preview card"]');
    const copyImageButton = page.getByRole('button', { name: '复制图片' });
    const copyAllButton = page.getByRole('button', { name: '全部复制' });
    const pasteInput = page.locator('#demo-paste-input');

    await expect(inspectButton).toBeVisible();
    await expect(pasteInput).toBeVisible();

    const ensureInspectionMode = async () => {
      const isOn = await page.evaluate(() => document.body.style.cursor === 'crosshair');
      if (!isOn) {
        await inspectButton.click();
        await page.waitForTimeout(700);
      }
    };

    const appendToInput = async (text: string) => {
      await pasteInput.click();
      await page.waitForTimeout(200);

      await page.evaluate((payload) => {
        const input = document.querySelector<HTMLInputElement>('#demo-paste-input');
        if (!input) return;

        const nextValue = input.value ? `${input.value}\n---\n${payload}` : payload;
        const data = new DataTransfer();
        data.setData('text/plain', payload);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(pasteEvent);
        input.value = nextValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, text);
      await page.waitForTimeout(600);
    };

    // Step 1: 开场 + 进入检查模式
    await page.mouse.move(1200, 740);
    await page.waitForTimeout(500);
    await page.mouse.move(1260, 780);
    await page.waitForTimeout(500);

    await ensureInspectionMode();

    // Step 2: 选择标题复制 debug id，然后粘贴到输入框
    await title.hover();
    await page.waitForTimeout(700);
    await title.click();
    await page.waitForTimeout(500);

    const copiedDebugId = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedDebugId).toContain('App.tsx');
    await appendToInput(`[STEP1] ${copiedDebugId}`);

    // Step 3: 再次进入检查模式，复制图片信息并粘贴
    await page.mouse.move(1260, 780);
    await page.waitForTimeout(500);
    await ensureInspectionMode();

    await image.hover();
    await page.waitForTimeout(700);
    await copyImageButton.click();
    await page.waitForTimeout(500);

    const copiedImagePayload = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedImagePayload).toContain('[image]');
    await appendToInput(`[STEP2]\n${copiedImagePayload}`);

    // Step 4: 在同一轮检查模式中执行“全部复制”并继续粘贴
    await ensureInspectionMode();
    await image.hover();
    await page.waitForTimeout(500);
    await expect(copyAllButton).toBeVisible();
    await copyAllButton.click();
    await page.waitForTimeout(500);

    const copiedAllPayload = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedAllPayload).toContain('[debug]');
    await appendToInput(`[STEP3]\n${copiedAllPayload}`);

    // Step 5: 退出检查模式收尾
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    await expect(pasteInput).toHaveValue(/App\.tsx/);
    await expect(pasteInput).toHaveValue(/\[image\]/);
    await expect(pasteInput).toHaveValue(/\[debug\]/);
    await page.waitForTimeout(1200);
  });
});
