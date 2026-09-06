// ========================================
// RISEUP AUTH
// ========================================

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

const signupPanel = document.getElementById("signupPanel");
const loginPanel = document.getElementById("loginPanel");

const showLogin = document.getElementById("showLogin");
const showSignup = document.getElementById("showSignup");

const topLogin = document.getElementById("topLogin");

const messageEl = document.getElementById("message");


// ========================================
// MESSAGE
// ========================================

function showMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = type;
}


// ========================================
// GET USERS
// ========================================

function getUsers() {
  const savedUsers =
    localStorage.getItem("riseup_users");

  return savedUsers
    ? JSON.parse(savedUsers)
    : {};
}


// ========================================
// SAVE USERS
// ========================================

function saveUsers(users) {
  localStorage.setItem(
    "riseup_users",
    JSON.stringify(users)
  );
}


// ========================================
// SHOW LOGIN
// ========================================

function openLogin() {

  signupPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");

  showMessage("");

}


// ========================================
// SHOW SIGN UP
// ========================================

function openSignup() {

  loginPanel.classList.add("hidden");
  signupPanel.classList.remove("hidden");

  showMessage("");

}


// ========================================
// BUTTONS
// ========================================

showLogin.addEventListener("click", openLogin);

showSignup.addEventListener("click", openSignup);

topLogin.addEventListener("click", openLogin);


// ========================================
// SIGN UP
// ========================================

signupForm.addEventListener("submit", function (event) {

  event.preventDefault();


  const username =
    document.getElementById("signupUsername")
      .value
      .trim();

  const password =
    document.getElementById("signupPassword")
      .value;

  const confirmPassword =
    document.getElementById("signupConfirm")
      .value;


  // Avatar
  const avatar =
    document.querySelector(
      'input[name="avatar"]:checked'
    );


  // ========================================
  // VALIDATION
  // ========================================

  if (username.length < 3) {

    showMessage(
      "Username must be at least 3 characters.",
      "error"
    );

    return;
  }


  if (password.length < 6) {

    showMessage(
      "Password must be at least 6 characters.",
      "error"
    );

    return;
  }


  if (password !== confirmPassword) {

    showMessage(
      "Passwords do not match.",
      "error"
    );

    return;
  }


  if (!avatar) {

    showMessage(
      "Choose your avatar.",
      "error"
    );

    return;
  }


  // ========================================
  // CHECK USERNAME
  // ========================================

  const users = getUsers();


  if (users[username]) {

    showMessage(
      "That username is already taken.",
      "error"
    );

    return;
  }


  // ========================================
  // CREATE ACCOUNT
  // ========================================

  users[username] = {

    password: password,

    avatar: avatar.value,

    createdAt:
      new Date().toISOString()

  };


  saveUsers(users);


  // ========================================
  // LOGIN USER
  // ========================================

  localStorage.setItem(
    "riseup_currentUser",
    username
  );


  // Starting RUX
  if (
    localStorage.getItem("riseup_rux") === null
  ) {

    localStorage.setItem(
      "riseup_rux",
      "0"
    );

  }


  showMessage(
    "Account created! Opening RiseUp...",
    "success"
  );


  // ========================================
  // GO HOME
  // ========================================

  setTimeout(() => {

    window.location.href = "home.html";

  }, 700);

});


// ========================================
// LOGIN
// ========================================

loginForm.addEventListener("submit", function (event) {

  event.preventDefault();


  const username =
    document.getElementById("loginUsername")
      .value
      .trim();

  const password =
    document.getElementById("loginPassword")
      .value;


  const users = getUsers();


  // ========================================
  // CHECK LOGIN
  // ========================================

  if (
    !users[username] ||
    users[username].password !== password
  ) {

    showMessage(
      "Invalid username or password.",
      "error"
    );

    return;
  }


  // ========================================
  // SAVE SESSION
  // ========================================

  localStorage.setItem(
    "riseup_currentUser",
    username
  );


  // Give existing users RUX if needed
  if (
    localStorage.getItem("riseup_rux") === null
  ) {

    localStorage.setItem(
      "riseup_rux",
      "0"
    );

  }


  showMessage(
    "Login successful! Opening RiseUp...",
    "success"
  );


  // ========================================
  // GO HOME
  // ========================================

  setTimeout(() => {

    window.location.href = "home.html";

  }, 700);

});


// ========================================
// TOP LOGIN
// ========================================

if (topLogin) {

  topLogin.addEventListener("click", () => {

    openLogin();

  });

}