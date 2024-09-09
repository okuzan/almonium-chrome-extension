document.getElementById('checkStatus').addEventListener('click', function () {
    // Send message to background.js to trigger the API request
    chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
        // Update the UI based on the response status
        const statusElement = document.getElementById("status");
        if (response.status === 200) {
            statusElement.innerText = "Authenticated! Status: 200";
        } else if (response.status === 401) {
            statusElement.innerText = "Unauthorized! Status: 401, attempted refresh";
        } else if (response.status === 403) {
            statusElement.innerText = "Forbidden! Status: 403, redirecting to sign-in...";
        } else if (response.status === "error") {
            statusElement.innerText = "Error: " + response.error || "Unknown error";
        } else {
            statusElement.innerText = "Status: " + response.status + ", " + response.message;
        }
    });
});
// popup.js
document.getElementById('togglePopup').addEventListener('click', function () {
    // Send a message to background.js to toggle the floating icon feature
    chrome.runtime.sendMessage({ action: "toggleFloatingIcon" });
});
