const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, safeStorage } = require('electron');
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
const PRELOAD = path.join(__dirname, 'preload.js');
const DEFAULTS = {
  enabled: true, visitMinutes: 5, waterMinutes: 60, checkins: true, sound: true,
  animSpeed: 1, petSize: 1, aiEnabled: false, apiKeyEnc: '', launchAtStartup: false,
  alwaysOnTop: true, quietEnabled: false, quietStart: '22:00', quietEnd: '08:00',
  buttonPos: null, nextVisit: 0, nextWater: 0, pausedUntil: 0
};
let S = { ...DEFAULTS }, petWin, btnWin, setWin, tray, memKey = '', dragStart = null;
const PET_H = 340, BTN = 64;
const file = () => path.join(app.getPath('userData'), 'settings.json');
const load = () => { try { S = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file(), 'utf8')) }; } catch { S = { ...DEFAULTS }; } };
const save = () => { try { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(S, null, 2)); } catch (e) { console.error(e); } };
const readCfg = n => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'config', n), 'utf8')); } catch { return {}; } };
const pick = a => a[Math.floor(Math.random() * a.length)];

function getKey() {
  if (memKey) return memKey;
  try { return S.apiKeyEnc ? safeStorage.decryptString(Buffer.from(S.apiKeyEnc, 'base64')) : ''; } catch { return ''; }
}
function setKey(k) {
  memKey = '';
  if (!k) { S.apiKeyEnc = ''; return; }
  if (safeStorage.isEncryptionAvailable()) S.apiKeyEnc = safeStorage.encryptString(k).toString('base64');
  else { memKey = k; S.apiKeyEnc = ''; }
}

function inQuiet() {
  if (!S.quietEnabled) return false;
  const m = t => { const [h, mi] = t.split(':').map(Number); return h * 60 + mi; };
  const now = new Date(), c = now.getHours() * 60 + now.getMinutes(), a = m(S.quietStart), b = m(S.quietEnd);
  return a <= b ? c >= a && c < b : c >= a || c < b;
}
function visit(msg, manual) {
  if (!petWin) return;
  petWin.showInactive();
  petWin.webContents.send('visit', { msg, manual: !!manual, stay: manual ? 25 : 10 + Math.random() * 20 });
}
function resetTimers() {
  const n = Date.now();
  S.nextVisit = n + S.visitMinutes * 6e4;
  S.nextWater = S.waterMinutes > 0 ? n + S.waterMinutes * 6e4 : 0;
  save();
}
function tick() {
  const n = Date.now();
  if (!S.enabled || n < S.pausedUntil || inQuiet()) return;
  const M = readCfg('messages.json');
  if (S.waterMinutes > 0 && n >= S.nextWater) {
    S.nextWater = n + S.waterMinutes * 6e4; save(); return visit(pick(M.water || ['Hi, water check.']));
  }
  if (n >= S.nextVisit) {
    S.nextVisit = n + S.visitMinutes * 6e4; save();
    const cats = S.checkins ? ['greeting', 'stretch', 'break', 'mood'] : ['stretch', 'break'];
    visit(pick(M[pick(cats)] || ['Hi.']));
  }
}
function pause(min) { S.pausedUntil = Date.now() + min * 6e4; save(); }
function pauseTomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); S.pausedUntil = d.getTime(); save(); }

function createPet() {
  const wa = screen.getPrimaryDisplay().workArea;
  petWin = new BrowserWindow({
    x: wa.x, y: wa.y + wa.height - PET_H, width: wa.width, height: PET_H,
    transparent: true, frame: false, alwaysOnTop: S.alwaysOnTop, skipTaskbar: true, hasShadow: false,
    resizable: false, show: false, webPreferences: { preload: PRELOAD, contextIsolation: true }
  });
  petWin.setAlwaysOnTop(S.alwaysOnTop, 'screen-saver');
  petWin.setIgnoreMouseEvents(true, { forward: true });
  petWin.loadFile(path.join(__dirname, 'pet.html'));
}
function clampBtn(x, y) {
  const wa = screen.getDisplayNearestPoint({ x, y }).workArea;
  return { x: Math.min(Math.max(x, wa.x), wa.x + wa.width - BTN), y: Math.min(Math.max(y, wa.y), wa.y + wa.height - BTN) };
}
function defaultBtn() { const wa = screen.getPrimaryDisplay().workArea; return { x: wa.x + wa.width - BTN - 8, y: wa.y + Math.round(wa.height / 2) }; }
function btnStart() { const b = S.buttonPos || defaultBtn(); return clampBtn(b.x, b.y); }
function createButton() {
  const p = btnStart();
  btnWin = new BrowserWindow({
    x: p.x, y: p.y, width: BTN, height: BTN, transparent: true, frame: false, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: false, focusable: false,
    webPreferences: { preload: PRELOAD, contextIsolation: true }
  });
  btnWin.setAlwaysOnTop(true, 'screen-saver');
  btnWin.loadFile(path.join(__dirname, 'button.html'));
}
function openSettings() {
  if (setWin && !setWin.isDestroyed()) return setWin.focus();
  setWin = new BrowserWindow({ width: 440, height: 720, title: 'Pet Settings', autoHideMenuBar: true,
    webPreferences: { preload: PRELOAD, contextIsolation: true } });
  setWin.setMenu(null);
  setWin.loadFile(path.join(__dirname, 'settings.html'));
}
function fitPet() { const wa = screen.getPrimaryDisplay().workArea; petWin.setBounds({ x: wa.x, y: wa.y + wa.height - PET_H, width: wa.width, height: PET_H }); }
function summon() { visit(pick((readCfg('messages.json').greeting) || ['Hi!']), true); }
function openChat() { petWin.showInactive(); petWin.webContents.send('open-chat'); }
function resetPositions() {
  S.buttonPos = null; S.enabled = true; save();
  const p = defaultBtn(); btnWin.setPosition(p.x, p.y); btnWin.show();
  fitPet(); summon();
}
function buildTray() {
  let img = nativeImage.createFromPath(path.join(ROOT, 'assets', 'icon.png'));
  if (process.platform === 'darwin') img = img.resize({ width: 18, height: 18 });
  tray = new Tray(img); tray.setToolTip('Desktop Pet');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Summon Pet', click: summon },
    { label: 'Chat', click: openChat },
    { label: 'Settings', click: openSettings },
    { label: 'Pause Pet', submenu: [
      { label: 'Pause for 30 minutes', click: () => pause(30) },
      { label: 'Pause for 1 hour', click: () => pause(60) },
      { label: 'Pause until tomorrow', click: pauseTomorrow },
      { label: 'Resume', click: () => { S.pausedUntil = 0; save(); } } ] },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));
  tray.on('click', summon);
}

async function reply(text, hist) {
  const M = readCfg('messages.json'), P = readCfg('personality.json'), key = getKey();
  if (S.aiEnabled && key) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({ model: P.model || 'gpt-4o-mini', max_tokens: 120,
          messages: [{ role: 'system', content: P.personality }, ...(hist || []).slice(-10), { role: 'user', content: text }] })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(); const t = j.choices?.[0]?.message?.content?.trim();
      if (t) return t;
    } catch (e) { console.error('AI error', e.message); }
  }
  for (const rule of M.replies || []) if (new RegExp(rule.match, 'i').test(text)) return pick(rule.say);
  return pick(M.fallback || ['I am here.']);
}

const pub = () => ({ ...S, apiKeyEnc: undefined, hasKey: !!getKey() });
function applySettings(resched) {
  petWin.setAlwaysOnTop(S.alwaysOnTop, 'screen-saver');
  app.setLoginItemSettings({ openAtLogin: !!S.launchAtStartup });
  if (!S.enabled) petWin.hide();
  petWin.webContents.send('settings', pub());
  if (resched) resetTimers(); else save();
}

ipcMain.handle('get-settings', () => pub());
ipcMain.handle('save-settings', (_, d) => {
  const old = { v: S.visitMinutes, w: S.waterMinutes };
  const { apiKey, ...rest } = d;
  const locked = ['apiKeyEnc', 'buttonPos', 'nextVisit', 'nextWater', 'pausedUntil'];
  for (const k of Object.keys(DEFAULTS)) if (k in rest && !locked.includes(k)) S[k] = rest[k];
  S.visitMinutes = Math.max(1, Number(S.visitMinutes) || 5);
  S.waterMinutes = Math.max(0, Number(S.waterMinutes) || 0);
  S.animSpeed = Math.min(2, Math.max(0.5, Number(S.animSpeed) || 1));
  S.petSize = Math.min(1.6, Math.max(0.6, Number(S.petSize) || 1));
  if (typeof apiKey === 'string' && apiKey.trim()) setKey(apiKey.trim());
  applySettings(old.v !== S.visitMinutes || old.w !== S.waterMinutes);
  return pub();
});
ipcMain.handle('chat', (_, t, h) => reply(String(t).slice(0, 500), h));
ipcMain.on('ignore', (_, v) => petWin && petWin.setIgnoreMouseEvents(v, { forward: true }));
ipcMain.on('away', () => { if (petWin && !petWin.isDestroyed()) petWin.hide(); });
ipcMain.on('focus', () => petWin && petWin.focus());
ipcMain.on('btn-start', () => { dragStart = btnWin.getPosition(); });
ipcMain.on('btn-move', (_, dx, dy) => { if (!dragStart) return; const p = clampBtn(dragStart[0] + dx, dragStart[1] + dy); btnWin.setPosition(p.x, p.y); });
ipcMain.on('btn-drop', () => { const [x, y] = btnWin.getPosition(); S.buttonPos = { x, y }; save(); dragStart = null; });
ipcMain.on('btn-click', () => { dragStart = null; summon(); });

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', (_, argv) => { if (argv.includes('--reset-positions')) resetPositions(); else summon(); });
app.on('window-all-closed', () => {});
app.whenReady().then(() => {
  if (app.dock) app.dock.hide();
  load();
  if (S.nextVisit < Date.now()) resetTimers();
  createPet(); createButton(); buildTray();
  screen.on('display-metrics-changed', () => { const p = btnStart(); btnWin.setPosition(p.x, p.y); fitPet(); });
  if (process.argv.includes('--reset-positions')) setTimeout(resetPositions, 1200);
  else if (S.enabled) setTimeout(summon, 1500);
  setInterval(tick, 20000);
});
