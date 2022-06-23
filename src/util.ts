export function getCurrentTabId(): Promise<number|undefined> {
  return new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if(!tabs.length) {
        return undefined
      }

      resolve(tabs[0]?.id || undefined)
    })
  })
}