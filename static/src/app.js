document.getElementById("init-form").addEventListener("submit", onSubmit);

const messagesElement = document.getElementById("messages");
let symbol = "";
let socket = null;

const combinations = [
  ["00", "01", "02"],
  ["10", "11", "12"],
  ["20", "21", "22"],
  ["00", "10", "20"],
  ["01", "11", "21"],
  ["02", "12", "22"],
  ["00", "11", "22"],
  ["02", "11", "20"],
];

function onSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const roomId = formData.get("room");
  const nickname = formData.get("nickname");

  init(roomId, nickname);
}

function init(roomId, nickname) {
  // globals io
  socket = io();

  socket.on("connect", () => {
    socket.emit("selectRoom", { roomId, nickname });
    socket.on("message", addMessage);
  });

  socket.on("symbol", (newSymbol) => {
    symbol = newSymbol;
    socket.on("position", place);
    socket.on("newGame", newGame);
    startGame();
  });

  socket.on("error", (error) => alert(error));
}

function addMessage({ nickname, message }) {
  const liElement = document.createElement("li");

  liElement.textContent = `${nickname}: ${message}`;

  messagesElement.appendChild(liElement);
}

function startGame() {
  const board = document.getElementById("board");
  const chat = document.getElementById("chat");

  document.getElementById("init").style.display = "none";
  board.style.display = "block";
  chat.style.display = "block";

  board.addEventListener("click", onClick);
  chat.addEventListener("submit", onChatMessage);
}

function onChatMessage(e) {
  e.preventDefault();

  const message = document.getElementById("chat-message");

  if (message.value) {
    socket.emit("message", message.value);
    message.value = "";
  }
}

function newGame() {
  [...document.querySelectorAll(".cell")].forEach(
    (el) => (el.textContent = "")
  );
}

function onClick(e) {
  if (e.target.classList.contains("cell")) {
    if (e.target.textContent == "") {
      const id = e.target.id;
      socket.emit("position", {
        id,
        symbol,
      });
    }
  }
}

function place(data) {
  document.getElementById(data.id).textContent = data.symbol;
  hasCombination();
  // setTimeout(hasCombination, 0);
}

function hasCombination() {
  for (let comb of combinations) {
    const result = comb
      .map((pos) => document.getElementById(pos).textContent)
      .join("");
    if (result == "XXX") {
      return endGame("X");
    } else if (result == "OOO") {
      return endGame("O");
    }
  }
}

function endGame(winner) {
  const choice = confirm(`Player ${winner} wins!\nDo you want a rematch?`);

  if (choice) {
    socket.emit("newGame");
    // newGame();
  }
}
