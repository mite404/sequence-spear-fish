import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { test } from 'node:test';
import { chromium } from 'playwright-core';

// Real Chromium pixels catch subtraction, ignored masks, and wrong alpha ordering.
test('Difference and masks independently composite real canvas pixels and editor controls', async () => {
  const server = spawn(
    'node',
    ['node_modules/vite/bin/vite.js', '--port', '4174', '--strictPort'],
    {
      stdio: 'pipe',
    },
  );
  let serverOutput = '';
  server.stdout.on('data', (data) => (serverOutput += data));
  server.stderr.on('data', (data) => (serverOutput += data));
  let browser;
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`Test server exited: ${serverOutput}`);
      try {
        if ((await fetch('http://localhost:4174')).ok) break;
      } catch {
        /* Wait for Vite. */
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    let executablePath = process.env.CHROME_PATH;
    if (!executablePath) {
      const installed = await readdir(`${homedir()}/.agent-browser/browsers`);
      const chrome = installed
        .filter((name) => name.startsWith('chrome-'))
        .sort()
        .at(-1);
      executablePath = `${homedir()}/.agent-browser/browsers/${chrome}/chrome`;
    }
    browser = await chromium.launch({
      executablePath,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:4174');
    const pixels = await page.evaluate(async () => {
      const { composite } = await import('/src/lib/compositor.ts');
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const solid = (color) => {
        const source = document.createElement('canvas');
        source.width = 100;
        source.height = 100;
        const ctx = source.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 100, 100);
        return source;
      };
      const lower = solid('rgb(20, 180, 60)');
      const upper = solid('rgb(200, 40, 100)');
      const mask = {
        shape: 'rectangle',
        x: 50,
        y: 50,
        width: 50,
        height: 50,
        feather: 0,
        invert: false,
      };
      const render = (blend, shape, opacity = 1, source = upper) => {
        composite(canvas, [
          { source: lower, blend: 'normal', opacity: 1, mask: null },
          { source, blend, opacity, mask: shape },
        ]);
        const ctx = canvas.getContext('2d');
        return (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
      };
      const difference = render('difference', null)(50, 50);
      const reversed = (() => {
        composite(canvas, [
          { source: upper, blend: 'normal', opacity: 1, mask: null },
          { source: lower, blend: 'difference', opacity: 1, mask: null },
        ]);
        return Array.from(canvas.getContext('2d').getImageData(50, 50, 1, 1).data);
      })();
      const identical = render('difference', null, 1, lower)(50, 50);
      const normalMask = render('normal', mask);
      const masked = [normalMask(50, 50), normalMask(5, 5)];
      const invertedMask = render('normal', { ...mask, invert: true });
      const inverted = [invertedMask(50, 50), invertedMask(5, 5)];
      const ellipseMask = render('normal', { ...mask, shape: 'ellipse' });
      const ellipse = [ellipseMask(50, 50), ellipseMask(27, 27)];
      const featheredMask = render('normal', { ...mask, feather: 10 });
      const feathered = [featheredMask(25, 50), featheredMask(30, 50), featheredMask(50, 50)];
      const combinedMask = render('difference', mask);
      const combined = [combinedMask(50, 50), combinedMask(5, 5)];
      const opacity = render('difference', null, 0.5)(50, 50);
      const transparent = solid('rgba(200, 40, 100, 0.5)');
      const alpha = render('normal', mask, 1, transparent)(50, 50);
      return {
        difference,
        reversed,
        identical,
        masked,
        inverted,
        ellipse,
        feathered,
        combined,
        opacity,
        alpha,
      };
    });
    assert.deepEqual(pixels.difference, [180, 140, 40, 255]);
    assert.deepEqual(pixels.reversed, [180, 140, 40, 255]);
    assert.deepEqual(pixels.identical, [0, 0, 0, 255]);
    assert.deepEqual(pixels.masked, [
      [200, 40, 100, 255],
      [20, 180, 60, 255],
    ]);
    assert.deepEqual(pixels.inverted, [
      [20, 180, 60, 255],
      [200, 40, 100, 255],
    ]);
    assert.deepEqual(pixels.ellipse, [
      [200, 40, 100, 255],
      [20, 180, 60, 255],
    ]);
    // Canvas premultiplied 8-bit alpha may round each channel by one.
    for (const [sample, expected] of [
      [pixels.feathered[0], [29, 173, 62, 255]],
      [pixels.feathered[1], [119, 103, 82, 255]],
    ]) {
      for (const [index, channel] of expected.entries()) {
        assert.ok(Math.abs(sample[index] - channel) <= 1);
      }
    }
    assert.deepEqual(pixels.feathered[2], [200, 40, 100, 255]);
    assert.deepEqual(pixels.combined, [
      [180, 140, 40, 255],
      [20, 180, 60, 255],
    ]);
    assert.deepEqual(pixels.opacity, [100, 160, 50, 255]);
    for (const [index, expected] of [110, 110, 80, 255].entries()) {
      assert.ok(Math.abs(pixels.alpha[index] - expected) <= 1);
    }

    // Through the real user controls: uploaded pixels must reach the same compositor.
    const svg = (color) => ({
      name: 'test.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><path fill="${color}" d="M0 0h960v540H0z"/></svg>`,
      ),
    });
    await page.waitForFunction(() =>
      document.querySelector('[role="status"]').textContent.includes('Ready'),
    );
    await page.getByLabel('Blend mode').selectOption('difference');
    await page.waitForTimeout(100);
    const identicalPreview = await page.locator('canvas').evaluate((canvas) => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let maxRGB = 0;
      let minAlpha = 255;
      for (let i = 0; i < pixels.length; i += 4) {
        maxRGB = Math.max(maxRGB, pixels[i], pixels[i + 1], pixels[i + 2]);
        minAlpha = Math.min(minAlpha, pixels[i + 3]);
      }
      return { maxRGB, minAlpha };
    });
    assert.deepEqual(identicalPreview, { maxRGB: 0, minAlpha: 255 });
    await page.getByLabel('Blend mode').selectOption('normal');
    await page.getByLabel('Replace lower image').setInputFiles(svg('#14b43c'));
    await page.waitForFunction(() =>
      document.querySelector('[role="status"]').textContent.includes('Ready'),
    );
    await page.getByLabel('Replace upper image').setInputFiles(svg('#c82864'));
    const center = () =>
      page
        .locator('canvas')
        .evaluate((canvas) =>
          Array.from(canvas.getContext('2d').getImageData(480, 270, 1, 1).data),
        );
    await page.waitForFunction(() =>
      document.querySelector('[role="status"]').textContent.includes('Ready'),
    );
    await assertEventually(center, [200, 40, 100, 255]);
    await page.getByLabel('Blend mode').selectOption('difference');
    await assertEventually(center, [180, 140, 40, 255]);
    await page.getByLabel('Blend mode').selectOption('normal');
    await page.getByLabel('Mask shape').selectOption('ellipse');
    await assertEventually(center, [200, 40, 100, 255]);
    const outside = () =>
      page
        .locator('canvas')
        .evaluate((canvas) => Array.from(canvas.getContext('2d').getImageData(5, 5, 1, 1).data));
    await assertEventually(outside, [20, 180, 60, 255]);
    await page.getByLabel('Invert mask').check();
    await assertEventually(center, [20, 180, 60, 255]);
    await page.getByRole('button', { name: 'Select lower clip' }).click();
    assert.equal(await page.getByLabel('Mask shape').inputValue(), 'none');
    await page.getByRole('button', { name: 'Select upper clip' }).click();
    assert.equal(await page.getByLabel('Mask shape').inputValue(), 'ellipse');
    assert.equal(await page.getByLabel('Invert mask').isChecked(), true);
    await page.getByLabel('Invert mask').uncheck();
    await page.getByLabel('Mask position X').press('Home');
    await assertEventually(center, [20, 180, 60, 255]);
    await page.getByRole('button', { name: 'Reset clip' }).click();
    await assertEventually(center, [200, 40, 100, 255]);
    assert.equal(await page.getByLabel('Mask shape').inputValue(), 'none');
    for (const width of [390, 700, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.getByLabel('Replace upper image').isVisible(), true);
      assert.equal(await page.getByLabel('Blend mode').isVisible(), true);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
    }
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
});

async function assertEventually(read, expected) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const value = await read();
    if (JSON.stringify(value) === JSON.stringify(expected)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.deepEqual(await read(), expected);
}
