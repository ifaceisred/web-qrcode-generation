// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "toggleQRCode",
        title: "显示/隐藏二维码",
        contexts: ["page"]
    });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "toggleQRCode") {
        // 获取当前状态并切换
        chrome.storage.local.get(['qrCodeClosed'], function(result) {
            const newState = !result.qrCodeClosed;
            chrome.storage.local.set({ qrCodeClosed: newState }, function() {
                // 向内容脚本发送消息
                chrome.tabs.sendMessage(tab.id, {
                    action: newState ? "hideQRCode" : "showQRCode"
                });
            });
        });
    }
}); 