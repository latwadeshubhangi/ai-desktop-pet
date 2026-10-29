const { contextBridge, ipcRenderer: r } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getSettings: () => r.invoke('get-settings'),
  saveSettings: d => r.invoke('save-settings', d),
  onSettings: f => r.on('settings', (_, s) => f(s)),
  onVisit: f => r.on('visit', (_, d) => f(d)),
  onOpenChat: f => r.on('open-chat', () => f()),
  chat: (t, h) => r.invoke('chat', t, h),
  ignore: v => r.send('ignore', v),
  away: () => r.send('away'),
  focus: () => r.send('focus'),
  btnStart: () => r.send('btn-start'),
  btnMove: (dx, dy) => r.send('btn-move', dx, dy),
  btnDrop: () => r.send('btn-drop'),
  btnClick: () => r.send('btn-click')
});
