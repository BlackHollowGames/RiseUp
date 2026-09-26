// 1. MOCK SOCIAL PLAYER AND ACTIVE CHAT DICTIONARIES
const FRIENDS_ROSTER_DATABASE = [
    { id: "f1", username: "AlexVoxel", status: "ingame", activity: "Playing Sandbox", icon: "🦊", dialogueThread: [
        { type: "in", text: "Yo stive! Did you see the new clay models render update?" },
        { type: "out", text: "Yeah! Dropped the file loaders entirely, it rendering natively now." }
    ]},
    { id: "f2", username: "BuilderPro_99", status: "online", activity: "In Menus", icon: "🧱", dialogueThread: [
        { type: "in", text: "Hey! Let me know when you open up creator studio server access." }
    ]},
    { id: "f3", username: "PixelDev", status: "offline", activity: "Offline", icon: "🕹️", dialogueThread: [] }
];

let selectedActiveFriendPointer = null;

const rosterSlotContainer = document.getElementById("friendsRosterTarget");
const countLabel = document.getElementById("totalFriendsCount");

// Interactive panel view selectors
const windowBlankEmpty = document.getElementById("emptyChatWindow");
const windowActiveChat = document.getElementById("activeChatWindow");
const headerTitleStr = document.getElementById("chatHeaderName");
const headerStatusStr = document.getElementById("chatHeaderStatus");
const messagesBoxContainer = document.getElementById("chatMessagesBoxSlot");

const msgFormEngine = document.getElementById("chatFormEngine");
const textInputBoxField = document.getElementById("chatMessageField");

// Start processing sequence loop
refreshFriendsRosterHUD();

function refreshFriendsRosterHUD() {
    if (!rosterSlotContainer) return;
    rosterSlotContainer.innerHTML = "";

    if (countLabel) countLabel.textContent = FRIENDS_ROSTER_DATABASE.length;

    FRIENDS_ROSTER_DATABASE.forEach(friend => {
        const itemRowCard = document.createElement("div");
        itemRowCard.className = `friendItemRowCard ${selectedActiveFriendPointer?.id === friend.id ? "selectedTarget" : ""}`;

        // Process color channels depending on user state configurations
        let presenceStyleClass = "offline";
        if (friend.status === "online") presenceStyleClass = "online";
        if (friend.status === "ingame") presenceStyleClass = "ingame";

        itemRowCard.innerHTML = `
            <div class="avatarPfpCircle">
                <span>${friend.icon}</span>
                <div class="onlinePulseDot ${presenceStyleClass}"></div>
            </div>
            <div class="friendRowMeta">
                <div class="friendRowName">${friend.username}</div>
                <div class="friendRowPresence ${friend.status === "ingame" ? "ingame" : ""}">${friend.activity}</div>
            </div>
        `;

        // Execution pipeline: Target selection node click row trigger
        itemRowCard.addEventListener("click", () => {
            selectedActiveFriendPointer = friend;
            refreshFriendsRosterHUD();
            loadActiveChatSessionWindow(friend);
        });

        rosterSlotContainer.appendChild(itemRowCard);
    });
}

function loadActiveChatSessionWindow(friend) {
    if (!windowBlankEmpty || !windowActiveChat) return;

    windowBlankEmpty.classList.add("hidden");
    windowActiveChat.classList.remove("hidden");

    if (headerTitleStr) headerTitleStr.textContent = friend.username;
    if (headerStatusStr) {
        headerStatusStr.textContent = friend.activity;
        headerStatusStr.style.color = friend.status === "ingame" ? "#ba8fff" : "rgba(255,255,255,0.4)";
    }

    rebuildMessageThreadBubbles();
}

function rebuildMessageThreadBubbles() {
    if (!messagesBoxContainer || !selectedActiveFriendPointer) return;
    messagesBoxContainer.innerHTML = "";

    selectedActiveFriendPointer.dialogueThread.forEach(chatLine => {
        const msgRowBlock = document.createElement("div");
        msgRowBlock.className = `msgRowBlock ${chatLine.type === "in" ? "incoming" : "outgoing"}`;

        msgRowBlock.innerHTML = `
            <div class="speechBubble">${chatLine.text}</div>
        `;
        messagesBoxContainer.appendChild(msgRowBlock);
    });

    // Automatically slide canvas content downwards to reveal newest entries
    messagesBoxContainer.scrollTop = messagesBoxContainer.scrollHeight;
}

// Intercept form engine validation to push custom messages
if (msgFormEngine) {
    msgFormEngine.addEventListener("submit", (event) => {
        event.preventDefault(); // Stop page refreshes
        if (!textInputBoxField || !selectedActiveFriendPointer) return;

        const dynamicMessageString = textInputBoxField.value.trim();
        if (dynamicMessageString === "") return; // Escape empty entries

        // Append line object into active memory references array
        selectedActiveFriendPointer.dialogueThread.push({
            type: "out",
            text: dynamicMessageString
        });

        // Clear entry slot fields
        textInputBoxField.value = "";

        // Rerender layout blocks updates
        rebuildMessageThreadBubbles();
    });
}
