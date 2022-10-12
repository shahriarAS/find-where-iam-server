const http = require('http');
//const { Server } = require("socket.io");
const socketIO = require('socket.io');
require('dotenv').config()
const { instrument } = require("@socket.io/admin-ui");

// Just to test server
const server = http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <h4>Yes! Your server is working.</h4>
    <p>This is a server of an online game <a target="_blank" href="https://github.com/shahriar-programmer/find-where-i-am">Find Where I Am</a><p>
    `);
});

const io = socketIO(server, {
  transports:['polling'],
  cors: {
    origin: [process.env.CLIENT_URL, process.env.CLIENT_URL2, "https://admin.socket.io"],
    credentials: true
  }
});

io.on('connect', (socket) => {
  // console.log('A user connected: ', socket.id);

  socket.on("host-game", (gameCode, username, hostCallBack) => {
    socket.nickname = username
    socket.join(gameCode)
    hostCallBack("Waiting for others to join...")
  })

  socket.on("join-game", async (gameCode, username, questionSet, joinCallBack) => {
    const sockets = await io.in(gameCode).fetchSockets();

    if (sockets.length == 1) {
      socket.nickname = username
      socket.join(gameCode)
      socket.to(gameCode).emit("server-question", questionSet)
      io.in(gameCode).emit("other-joined", "Game Start")
    } else {
      joinCallBack("The Game is not hosted yet or already it's started.")
    }
  })

  socket.on("add-score", (gameCode, score, correctCount, opponentHighScore) => {
    // console.log("Add Score", socket.nickname, score, correctCount, opponentHighScore)
    socket.to(gameCode).emit("show-score", score, correctCount, opponentHighScore)
  })

  socket.on("game-over", (gameCode, username, highScore, correctCount, incorrectCount, score) => {
    // console.log("Game Over")
    socket.to(gameCode).emit("over-show", username, highScore, correctCount, incorrectCount, score)
  })

});

instrument(io, {
  auth: false
});

server.listen(process.env.PORT || 4000, () => {
console.log(`Server listening at port ${process.env.PORT || 4000}`)
}); 
