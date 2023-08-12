chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^https?:\/\/www.google.com\//.test(tab.url)) {
        console.log("injecting content script on url:", tab.url);
        chrome.scripting
            .executeScript({
                target: { tabId: tabId },
                files: ["./search-voting.js"]
            })
            .then(() => console.log("content script injected"))
            .catch(err => console.log('injecting content script failed:', err));
    }
});