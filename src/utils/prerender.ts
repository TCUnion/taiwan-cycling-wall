// 預渲染環境偵測與工具

/** 是否在 Puppeteer 預渲染環境中 */
export const 是否預渲染 =
  typeof window !== 'undefined' &&
  '__PRERENDER_INJECTED' in window

/** 通知預渲染器頁面已就緒，可以擷取 HTML */
export function 觸發預渲染就緒() {
  document.dispatchEvent(new Event('prerender-ready'))
}
