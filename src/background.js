chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_CHESSKIT_APP') {
    const bigData = message.payload;
    chrome.tabs.create({ url: 'https://chesskit.org' }, (tab) => {
      const tabId = tab.id;
      const waitForReactRender = () => {
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            return !!document.querySelector('[data-boardid="AnalysisBoard-true"]');
          }
        }, (results) => {
          if (results && results[0] && results[0].result) {
            chrome.scripting.executeScript({
              target: { tabId },
              func: (data) => {
                window.postMessage(data, '*');
              },
              args: [bigData]
            });
          } else {
            setTimeout(waitForReactRender, 300);
          }
        });
      };
      const onTabUpdated = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onTabUpdated);
          waitForReactRender();
        }
      };
      chrome.tabs.onUpdated.addListener(onTabUpdated);
    });
  }
});
