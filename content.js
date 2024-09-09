// Global variable to store the currently displayed icon
let currentIcon = null;

// Function to display the icon near the selected text and make it clickable
function showIconNearSelection() {
    chrome.runtime.sendMessage({action: "checkFloatingIconState"}, function (response) {
        if (response.isEnabled) {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            // Check if the selected text exceeds 300 characters
            if (selectedText.length > 300) {
                if (currentIcon) {
                    currentIcon.remove();
                    currentIcon = null;
                }
                return;  // Do not show icon if selection exceeds 300 characters
            }

            // Clear the previous icon if one exists
            if (currentIcon) {
                currentIcon.remove();
                currentIcon = null;  // Reset the currentIcon reference
            }

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Get the bounding box of the entire selection
                const rect = range.getBoundingClientRect();

                // Get the start and end points of the selection
                const startNode = selection.anchorNode;
                const endNode = selection.focusNode;
                const startOffset = selection.anchorOffset;
                const endOffset = selection.focusOffset;

                // Create new range for both start and end to compare
                const startRange = document.createRange();
                startRange.setStart(startNode, startOffset);
                startRange.setEnd(startNode, startOffset);
                const startRect = startRange.getBoundingClientRect();

                const endRange = document.createRange();
                endRange.setStart(endNode, endOffset);
                endRange.setEnd(endNode, endOffset);
                const endRect = endRange.getBoundingClientRect();

                // Determine if selection is backward (end is to the left of the start)
                const isBackward = endRect.left < startRect.left;

                // Create the floating icon (your logo)
                const icon = document.createElement('img');
                icon.src = chrome.runtime.getURL('icons/icon128-bg.png');
                icon.style.width = '30px';
                icon.style.height = '30px';
                icon.style.pointerEvents = 'auto';
                icon.style.position = 'absolute';
                icon.style.zIndex = 1000; // Make sure it appears on top
                icon.onerror = function () {
                    console.error('Failed to load the icon');
                };

                // Add a click event to the icon
                icon.addEventListener('click', function () {
                    if (selectedText) {
                        console.log("Icon clicked! Selected text: ", selectedText); // Log for debugging
                        // Send the selected text to the background script
                        chrome.runtime.sendMessage({action: "openTab", text: selectedText}, function (response) {
                            console.log("Message sent to background.js", response); // Log the response
                        });
                    }
                });

                // Position the icon based on the direction of the selection
                if (isBackward) {
                    // If backward, position icon at the start of the selection
                    icon.style.left = `${startRect.left + window.scrollX - 5}px`; // A little to the right
                    icon.style.top = `${startRect.top + window.scrollY + 20}px`;  // A little below the start
                } else {
                    // If forward, position icon at the end of the selection
                    icon.style.left = `${endRect.left + window.scrollX - 5}px`; // A little to the right
                    icon.style.top = `${endRect.top + window.scrollY + 20}px`;  // A little below the end
                }

                // Append the icon to the body
                document.body.appendChild(icon);

                // Store reference to the current icon so it can be removed later
                currentIcon = icon;
            }
        }
    });
}

// Listen for selection events
document.addEventListener('mouseup', () => {
    const selection = window.getSelection().toString();

    // Remove the icon if no text is selected
    if (selection.length === 0) {
        if (currentIcon) {
            currentIcon.remove();
            currentIcon = null;
        }
        return;  // Exit if no text is selected
    }

    // Show icon only if text is selected and its length is less than or equal to 300 characters
    showIconNearSelection();
});
