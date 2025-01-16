// 创建二维码容器
function createQRContainer() {
    // 先检查存储的状态
    chrome.storage.local.get(['qrCodeClosed'], function(result) {
        if (result.qrCodeClosed) {
            return; // 如果之前关闭了，就不创建二维码
        }

        const container = document.createElement('div');
        container.id = 'qr-container';
        
        // 创建关闭按钮
        const closeButton = document.createElement('div');
        closeButton.id = 'qr-close-button';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', function() {
            // 保存关闭状态
            chrome.storage.local.set({ qrCodeClosed: true }, function() {
                container.remove();
            });
        });
        
        // 创建二维码元素
        const qrDiv = document.createElement('div');
        qrDiv.id = 'qr-code';
        
        // 创建网站信息容器
        const infoDiv = document.createElement('div');
        infoDiv.className = 'site-info';
        
        // 获取网站信息
        const siteName = document.domain;
        const pageTitle = document.title.substring(0, 15);
        
        // 设置网站信息
        infoDiv.innerHTML = `
            <div class="domain">${siteName}</div>
            <div class="title">${pageTitle}</div>
        `;
        
        // 创建二维码图片
        const qrImg = document.createElement('img');
        qrImg.id = 'qr-image';
        const url = encodeURIComponent(window.location.href);
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${url}`;
        qrDiv.appendChild(qrImg);
        
        // 组装容器
        container.appendChild(closeButton);
        container.appendChild(qrDiv);
        container.appendChild(infoDiv);
        
        // 确保容器被添加到页面中
        if (document.body) {
            document.body.appendChild(container);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(container);
            });
        }
        
        // 获取网站favicon并添加到二维码中心
        getFavicon().then(logoUrl => {
            if (logoUrl) {
                addLogoToQR(logoUrl);
            }
        });
    });
}

// 添加重新显示二维码的功能（可选）
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "showQRCode") {
        chrome.storage.local.set({ qrCodeClosed: false }, function() {
            createQRContainer();
        });
    } else if (request.action === "hideQRCode") {
        chrome.storage.local.set({ qrCodeClosed: true }, function() {
            const container = document.getElementById('qr-container');
            if (container) {
                container.remove();
            }
        });
    }
});

// 获取网站favicon
async function getFavicon() {
    const favicon = document.querySelector('link[rel="icon"]') || 
                   document.querySelector('link[rel="shortcut icon"]');
    
    if (favicon) {
        return favicon.href;
    }
    
    return `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=64`;
}

// 向二维码添加Logo
function addLogoToQR(logoUrl) {
    const qrImage = document.getElementById('qr-image');
    if (!qrImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 256;
    canvas.height = 256;
    
    const logo = new Image();
    logo.crossOrigin = 'Anonymous';
    
    logo.onload = function() {
        const qrImg = new Image();
        qrImg.crossOrigin = 'Anonymous';
        qrImg.src = qrImage.src;
        
        qrImg.onload = function() {
            ctx.drawImage(qrImg, 0, 0, 256, 256);
            
            // 在中心绘制Logo
            const logoSize = 64;
            const logoX = (256 - logoSize) / 2;
            const logoY = (256 - logoSize) / 2;
            
            // 添加白色背景
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();
            
            qrImage.src = canvas.toDataURL();
        };
    };
    
    logo.src = logoUrl;
}

// 确保在页面加载完成后创建二维码
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createQRContainer);
} else {
    createQRContainer();
} 