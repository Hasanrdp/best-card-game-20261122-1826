// Court of Embers: headless playtest. Drives the real game in headless Chrome
// over CDP with plain clicks — start the duel, play two cards, end the turn,
// let Sable answer — and reports console errors, failed requests and whether
// the table actually changed. Also saves a mid-play frame for a last look.
// Run: node playtest.mjs   (expects game/ served on http://localhost:8080)
import { execFile, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const PORT = 9223;
const URL = 'http://localhost:8080/index.html?seed=11';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(path) {
  const response = await fetch('http://localhost:' + PORT + path);
  return response.json();
}

const chrome = spawn(CHROME, [
  '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,800', '--remote-debugging-port=' + PORT, 'about:blank',
], { stdio: 'ignore' });

const errors = [];
const failedRequests = [];
let shot = null;

try {
  await sleep(1500);
  const targets = await getJson('/json/list');
  const page = targets.find((target) => target.type === 'page');
  if (!page) throw new Error('no page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let messageId = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id !== undefined && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    } else if (data.method) {
      events.push(data);
    }
  };
  const send = (method, params) => new Promise((resolve) => {
    const id = ++messageId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    return result.result?.result?.value;
  };
  const click = async (selector) => evaluate(
    `(() => { const node = document.querySelector(${JSON.stringify(selector)}); if (!node) return 'missing'; node.click(); return 'clicked'; })()`,
  );

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Page.navigate', { url: URL });
  await sleep(1500);

  const state = async () => evaluate(
    `(() => { const text = (sel) => { const n = document.querySelector(sel); return n ? n.textContent.trim() : 'missing'; }; return { title: !!document.querySelector('.overlay-title'), overlayVisible: !document.querySelector('.overlay').classList.contains('hidden'), playerLife: text('.player-side-box .lifebar-text'), foeLife: text('.opponent-side-box .lifebar-text'), hand: document.querySelectorAll('.player-hand .card').length, log: text('.log'), endTurn: text('.end-turn') }; })()`,
  );

  console.log('loaded:', JSON.stringify(await state()));
  console.log('start click:', await click('.big-button'));
  await sleep(600);
  console.log('after start:', JSON.stringify(await state()));
  console.log('play card 1:', await click('.player-hand .card'));
  await sleep(400);
  console.log('after card 1:', JSON.stringify(await state()));
  console.log('play card 2:', await click('.player-hand .card'));
  await sleep(400);
  console.log('after card 2:', JSON.stringify(await state()));
  console.log('end turn:', await click('.end-turn'));
  await sleep(3500);
  const after = await state();
  console.log('after Sable:', JSON.stringify(after));
  const shotResult = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  shot = shotResult.result?.data;
  if (shot) writeFileSync('/tmp/card-playtest.jpg', Buffer.from(shot, 'base64'));

  for (const event of events) {
    if (event.method === 'Runtime.exceptionThrown') {
      errors.push(event.params.exceptionDetails?.exception?.description || 'exception');
    }
    if (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error') {
      errors.push(event.params.args.map((arg) => arg.value || arg.description || '').join(' '));
    }
    if (event.method === 'Network.loadingFailed') {
      failedRequests.push(event.params.errorText || 'failed');
    }
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) {
      failedRequests.push(event.params.response.status + ' ' + event.params.response.url);
    }
  }
  ws.close();
} finally {
  chrome.kill();
}

console.log('console errors: ' + (errors.length ? JSON.stringify(errors) : 'none'));
console.log('failed requests: ' + (failedRequests.length ? JSON.stringify(failedRequests) : 'none'));
console.log('mid-play frame: ' + (shot ? 'saved to /tmp/card-playtest.jpg' : 'NOT TAKEN'));
const ok = errors.length === 0 && failedRequests.length === 0 && shot !== null;
console.log(ok ? 'PLAYTEST PASS' : 'PLAYTEST FAIL');
process.exit(ok ? 0 : 1);
