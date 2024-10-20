import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import dotenv from 'dotenv';

dotenv.config();
const app = express();
const server = http.createServer(app);
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));
const io = new Server(server,{
  cors: {
    origin:"*", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('Socket.io Chat Server');
});
io.on('connection', (socket) => {
  console.log('New connection established');

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  socket.on('chatMessage', ({ room, message, username }) => {
    io.to(room).emit('message', { username, message });
  });
});
console.log(process.env.PORT,'env')
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log(server,"server")
