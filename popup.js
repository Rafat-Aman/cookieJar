async function currentWindowId() {
  return new Promise(res => chrome.windows.getCurrent({}, w => res(w.id)));
}
async function refresh() {
  const windowId = await currentWindowId();
  chrome.runtime.sendMessage({ type: 'GET_WINDOW_ARMED', windowId }, (reply) => {
    const armed = !!reply?.armed;
    document.getElementById('status').textContent =
      armed ? 'This window is ARMED — data will be wiped on close.' :
              'This window is NOT armed.';
    const btn = document.getElementById('toggle');
    btn.textContent = armed ? 'Disarm this window' : 'Arm this window';
    btn.onclick = () => {
      chrome.runtime.sendMessage({ type: 'SET_WINDOW_ARMED', windowId, armed: !armed }, refresh);
    };
  });
}
refresh();
