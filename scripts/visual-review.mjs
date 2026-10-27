// Isolated Chrome review of our local development app; never uses a personal profile.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = await mkdtemp(join(tmpdir(), "museum-visual-"));
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    "--user-data-dir=" + profile,
    "about:blank",
  ],
  { stdio: "ignore" },
);
let ws;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try {
      port = (
        await readFile(join(profile, "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      break;
    } catch {
      await delay(100);
    }
  }
  if (!port) throw new Error("Chrome did not start");
  const pages = await (
    await fetch("http://127.0.0.1:" + port + "/json/list")
  ).json();
  ws = new WebSocket(pages.find((p) => p.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.on("message", (data) => {
    const m = JSON.parse(data);
    if (m.id) {
      const p = pending.get(m.id);
      if (p) {
        clearTimeout(p.timer);
        pending.delete(m.id);
        m.error
          ? p.reject(new Error(JSON.stringify(m.error)))
          : p.resolve(m.result);
      }
    }
    if (m.method === "Runtime.exceptionThrown")
      errors.push(
        m.params.exceptionDetails.exception?.description ??
          m.params.exceptionDetails.text,
      );
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const request = ++id;
      const timer = setTimeout(
        () => reject(new Error("CDP timeout " + method)),
        20000,
      );
      pending.set(request, { resolve, reject, timer });
      ws.send(JSON.stringify({ id: request, method, params }));
    });
  await send("Page.enable");
  await send("Runtime.enable");
  for (const [name, query, width, height] of [
    ["birthday", "?capture=birthday", 1440, 1000],
    ["exterior", "?capture=exterior", 1440, 1000],
    ["garden", "?capture=garden", 1440, 1000],
    ["her-mobile", "?portal=her", 390, 844],
    ["him", "?portal=him", 1440, 1000],
    ["guest", "?portal=guests", 1440, 1000],
  ]) {
    if (process.argv.length > 2 && !process.argv.slice(2).includes(name)) continue;
    errors.length = 0;
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 500,
    });
    await send("Page.navigate", {
      url: (process.env.MUSEUM_REVIEW_URL ?? "http://localhost:5173/") + query,
    });
    await delay(6000);
    const text = await send("Runtime.evaluate", {
      expression: "document.body.innerText",
      returnByValue: true,
    });
    const capture = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(
      "/tmp/museum-pink-" + name + ".png",
      Buffer.from(capture.data, "base64"),
    );
    console.log(
      name,
      JSON.stringify({ errors, text: text.result.value?.slice(0, 250) }),
    );
    if (errors.length) throw new Error("Browser errors in " + name);
    if (name === "her-mobile") {
      await send("Runtime.evaluate", {
        expression:
          "document.querySelector('.character-stage').scrollIntoView({block:'center'})",
      });
      await delay(350);
      const shot = await send("Page.captureScreenshot", { format: "png" });
      await writeFile(
        "/tmp/museum-pink-her-mobile-character.png",
        Buffer.from(shot.data, "base64"),
      );
    }
    if (name === "guest") {
      await send("Runtime.evaluate", {
        expression: "document.querySelector('.portal-form input').focus()",
      });
      await send("Input.insertText", {text:"Visual Guest"});
      await delay(200);
      await send("Runtime.evaluate", {
        expression: "document.querySelector('.portal-form').requestSubmit()",
      });
      await delay(6000);
      const result = await send("Runtime.evaluate", {
        expression:
          "({entered:!!document.querySelector('.museum-hud'),error:document.querySelector('.portal-error')?.textContent,body:document.body.innerText.slice(0,200)})",
        returnByValue: true,
      });
      console.log(
        "guest-entry",
        JSON.stringify({ result: result.result.value, errors }),
      );
      if (!result.result.value?.entered || errors.length)
        throw new Error("Guest browser entry failed");
    }
  }
} finally {
  ws?.close();
  chrome.kill("SIGTERM");
}
