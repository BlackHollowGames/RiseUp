(() => {
  "use strict";

  const currentUser = localStorage.getItem("riseup_currentUser");

  const $ = id => document.getElementById(id);

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("riseup_users") || "{}");
    } catch {
      return {};
    }
  }

  function getFriends() {
    if (!currentUser) return [];

    try {
      const friends = JSON.parse(
        localStorage.getItem(`riseup_friends_${currentUser}`) || "[]"
      );

      return Array.isArray(friends) ? friends : [];
    } catch {
      return [];
    }
  }

  function saveFriends(friends) {
    localStorage.setItem(
      `riseup_friends_${currentUser}`,
      JSON.stringify(friends)
    );
  }

  function toast(message) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.classList.remove("show");
    }, 2200);
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function openFriends() {
    $("friendsModal").classList.remove("hidden");
    $("friendSearch").value = "";
    $("friendSearchResults").innerHTML = "";
    $("friendSearch").focus();
  }

  function closeFriends() {
    $("friendsModal").classList.add("hidden");
  }

  function renderSearch() {
    const search = $("friendSearch").value
      .trim()
      .toLowerCase();

    const results = $("friendSearchResults");
    results.innerHTML = "";

    if (!search) return;

    const users = getUsers();
    const friends = getFriends();

    const matches = Object.keys(users)
      .filter(username => {
        if (username === currentUser) return false;
        if (friends.includes(username)) return false;

        return username.toLowerCase().includes(search);
      })
      .slice(0, 10);

    if (!matches.length) {
      results.innerHTML = `
        <div style="padding:20px;text-align:center;color:#8b949e">
          No players found.
        </div>
      `;
      return;
    }

    matches.forEach(username => {
      const row = document.createElement("div");
      row.className = "friend-result";

      row.innerHTML = `
        <div class="result-user">
          <div class="result-avatar">
            ${escapeHTML(username.charAt(0).toUpperCase())}
          </div>

          <strong>${escapeHTML(username)}</strong>
        </div>

        <button class="add-friend">
          Add Friend
        </button>
      `;

      row.querySelector(".add-friend")
        .addEventListener("click", () => {
          addFriend(username);
        });

      results.appendChild(row);
    });
  }

  function addFriend(username) {
    const friends = getFriends();

    if (friends.includes(username)) return;

    friends.push(username);
    saveFriends(friends);

    renderFriends();
    renderSearch();

    toast(`${username} added to your friends!`);
  }

  function removeFriend(username) {
    const friends = getFriends()
      .filter(friend => friend !== username);

    saveFriends(friends);
    renderFriends();

    toast(`${username} removed.`);
  }

  function renderFriends() {
    const list = $("friendsList");
    const friends = getFriends();
    const users = getUsers();

    list.innerHTML = "";

    if (!friends.length) {
      list.innerHTML = `
        <div class="empty-friends">
          <div class="empty-icon">♧</div>
          <h3>No friends yet</h3>
          <p>Find people to add as friends and play together.</p>
          <button id="newFindFriends">Find Friends</button>
        </div>
      `;

      $("newFindFriends").addEventListener(
        "click",
        openFriends
      );

      return;
    }

    friends.forEach(username => {
      if (!users[username]) return;

      const row = document.createElement("div");
      row.className = "friend-row";

      row.innerHTML = `
        <div class="friend-avatar">
          ${escapeHTML(username.charAt(0).toUpperCase())}
        </div>

        <div class="friend-details">
          <span class="friend-name">
            ${escapeHTML(username)}
          </span>

          <span class="friend-status">
            <span class="online-dot"></span>
            Online
          </span>
        </div>
      `;

      row.addEventListener("contextmenu", event => {
        event.preventDefault();

        if (
          confirm(
            `Remove ${username} from your friends?`
          )
        ) {
          removeFriend(username);
        }
      });

      list.appendChild(row);
    });
  }

  $("findFriendsButton").addEventListener(
    "click",
    openFriends
  );

  $("findFriendsMain").addEventListener(
    "click",
    openFriends
  );

  $("closeFriendsModal").addEventListener(
    "click",
    closeFriends
  );

  $("friendsModal").addEventListener(
    "click",
    event => {
      if (event.target === $("friendsModal")) {
        closeFriends();
      }
    }
  );

  $("friendSearch").addEventListener(
    "input",
    renderSearch
  );

  renderFriends();
})();