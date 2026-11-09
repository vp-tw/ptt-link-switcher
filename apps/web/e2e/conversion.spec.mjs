import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, test as base } from "@playwright/test";
import { preview } from "vite-plus";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const article = "https://www.ptt.cc/bbs/Gossiping/M.1771671779.A.6ED.html";
const inputLabel = "文章網址、分享文字或完整 AID";
const settingsLabel = "排列與顯示設定";

const test = base.extend({
  production: async ({ context }, use) => {
    const worker = await readFile(new URL("../dist/sw.js", import.meta.url), "utf8");
    let updateReady = false;
    const server = await preview({
      root: appRoot,
      configFile: false,
      preview: { host: "127.0.0.1", port: 0 },
      plugins: [
        {
          name: "test-worker-update",
          configurePreviewServer({ middlewares }) {
            middlewares.use("/sw.js", (_request, response) => {
              response.setHeader("Content-Type", "text/javascript");
              response.setHeader("Cache-Control", "no-store");
              response.end(updateReady ? `${worker}\n// Test deployment\n` : worker);
            });
          },
        },
      ],
    });

    try {
      const { port } = server.httpServer.address();
      await context.route("https://**", (route) => route.abort());
      await use({
        url: `http://127.0.0.1:${port}/`,
        publishUpdate() {
          updateReady = true;
        },
      });
    } finally {
      await server.close();
    }
  },
});

test("converts, copies and restores a shared article and reader preferences", async ({
  context,
  page,
  production,
}) => {
  const url = new URL(production.url);
  url.searchParams.set("input", `Extra share text ${article}`);
  url.searchParams.set("keep", "1");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(url.href);
  const officialUrl = page.getByRole("textbox", { name: "PTT 官方 文章網址" });
  await expect(officialUrl).toHaveValue(article);
  url.searchParams.set("input", article);
  await expect(page).toHaveURL(url.href);
  await page.getByRole("button", { name: "複製 PTT 官方 網址" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(article);

  await page.getByText(settingsLabel).click();
  await page.getByRole("button", { name: "將 BePTT 上移" }).press("Enter");
  await expect(page.getByRole("article").first()).toHaveAccessibleName("BePTT 閱讀站");

  await page.getByRole("textbox", { name: inputLabel }).fill("#1fcP3ZRj");
  await page.getByRole("textbox", { name: "看板名稱" }).fill("Gossiping");
  await expect(officialUrl).toHaveValue(article);
  await page.reload();
  await expect(page.getByRole("textbox", { name: inputLabel })).toHaveValue(article);
  await expect(page.getByRole("article").first()).toHaveAccessibleName("BePTT 閱讀站");

  await page.getByRole("textbox", { name: inputLabel }).fill("invalid");
  await expect(page.getByText("尚未辨識")).toBeVisible();
  url.searchParams.delete("input");
  await expect(page).toHaveURL(url.href);
});

test("reopens the conversion offline and waits for consent before applying an update", async ({
  context,
  page,
  production,
}) => {
  const url = new URL(production.url);
  url.searchParams.set("input", article);
  await page.goto(url.href);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "PTT 官方 文章網址" })).toHaveValue(article);
  await context.setOffline(false);

  production.publishUpdate();
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update().then(() => {}));
  const update = page.getByRole("button", { name: "立即更新" });
  await expect(update).toBeVisible();
  await page.getByRole("button", { name: "稍後" }).click();
  await expect(update).toBeHidden();
  expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(
    true,
  );

  await page.reload();
  await expect(update).toBeVisible();
  await Promise.all([page.waitForEvent("framenavigated"), update.click()]);
  await expect(update).toBeHidden();
  await expect(page.getByRole("textbox", { name: "PTT 官方 文章網址" })).toHaveValue(article);
  expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(
    false,
  );
});

test.describe("touch controls", () => {
  test.use({ viewport: { width: 393, height: 851 }, hasTouch: true, isMobile: true });

  test("reorders readers with the move buttons", async ({ page, production }) => {
    await page.goto(production.url);
    await page.getByRole("button", { name: "填入範例" }).tap();
    await page.getByText(settingsLabel).tap();
    await page.getByRole("button", { name: "將 BePTT 上移" }).tap();
    await expect(page.getByRole("article").first()).toHaveAccessibleName("BePTT 閱讀站");
  });
});
