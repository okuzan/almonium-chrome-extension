let isFloatingIconEnabled = true;  // Default state: floating icon is enabled
// Listen for the toggle request from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleFloatingIcon") {
        isFloatingIconEnabled = !isFloatingIconEnabled;  // Toggle the state
        console.log("Floating icon is now " + (isFloatingIconEnabled ? "enabled" : "disabled"));
    }
});

// Provide this state to content.js when it needs it
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkFloatingIconState") {
        sendResponse({ isEnabled: isFloatingIconEnabled });
    }
});

// Function to make the API request
function makeApiRequest(sendResponse) {
    fetch("https://api.almonium.com/api/v1/users/me", {
        method: "GET",
        credentials: "include"  // Ensures cookies are sent
    })
        .then(response => {
            if (response.status === 401) {
                // If 401 Unauthorized, attempt to refresh the token
                refreshToken(sendResponse);
            } else if (response.status === 403) {
                // If 403, open the sign-in page
                chrome.tabs.create({ url: "https://almonium.com/auth#sign-in" });
                sendResponse({ status: response.status, message: "Failed to refresh token, redirecting to sign-in" });
            } else {
                // Send response status back to popup.js
                sendResponse({ status: response.status });
            }
        })
        .catch(error => {
            console.error("API call error:", error);
            sendResponse({ status: "error", error: error.message });
        });
}

// Function to refresh the token
function refreshToken(sendResponse) {
    fetch("https://api.almonium.com/api/v1/public/auth/refresh-token", {
        method: "POST",
        credentials: "include"  // Ensures cookies are sent
    })
        .then(refreshResponse => {
            if (refreshResponse.status === 200) {
                // Token refreshed successfully, retry the original request
                makeApiRequest(sendResponse);
            } else if (refreshResponse.status === 403) {
                // If refresh fails with 403, open the sign-in page
                chrome.tabs.create({ url: "https://almonium.com/auth#sign-in" });
                sendResponse({ status: refreshResponse.status, message: "Failed to refresh token, redirecting to sign-in" });
            } else {
                // If refresh fails with any other error, return the status
                sendResponse({ status: refreshResponse.status, message: "Failed to refresh token" });
            }
        })
        .catch(error => {
            console.error("Refresh token error:", error);
            sendResponse({ status: "error", error: error.message });
        });
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkStatus') {
        makeApiRequest(sendResponse);
    }
    return true; // Required to indicate that the response is async
});
// Create a context menu for text selection
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'almoniumDiscover',
        title: 'Discover on Almonium',
        contexts: ['selection']
    });
});

// Listen for the context menu click event
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'almoniumDiscover') {
        const selectedText = info.selectionText;
        const discoverUrl = `https://almonium.com/discover?text=${encodeURIComponent(selectedText)}`;

        // Open a new tab with the discover URL
        chrome.tabs.create({ url: discoverUrl });
    }
});
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js: ", message); // Log to ensure message is received
    if (message.action === "openTab") {
        const selectedText = message.text;
        const discoverUrl = `https://almonium.com/discover?text=${encodeURIComponent(selectedText)}`;

        // Open a new tab with the discover URL
        chrome.tabs.create({ url: discoverUrl }, () => {
            console.log("Tab created with URL: ", discoverUrl); // Log the tab creation
        });
    }
});
