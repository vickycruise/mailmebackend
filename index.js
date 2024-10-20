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


const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  }
});


app.get('/', (req, res) => {
  res.send('Socket.io Chat Server');
});


const roomTimeouts = {};
const ROOM_INACTIVITY_LIMIT = 10 * 60 * 1000; 


io.on('connection', (socket) => {
  console.log('New connection established');

  
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);

    
    if (roomTimeouts[room]) {
      clearTimeout(roomTimeouts[room]);
      delete roomTimeouts[room];
    }
  });

  
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);

    
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    if (roomSize === 0) {
      roomTimeouts[room] = setTimeout(() => clearRoom(room), ROOM_INACTIVITY_LIMIT);
    }
  });

  
  socket.on('chatMessage', ({ room, message, username }) => {
    if (!room || !message || !username) {
      socket.emit('error', 'Invalid message payload');
      return;
    }

    io.to(room).emit('message', { username, message });
    console.log(`Message sent to room ${room} by ${username}`);

    
    if (roomTimeouts[room]) {
      clearTimeout(roomTimeouts[room]);
      delete roomTimeouts[room];
    }
  });

  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


const clearRoom = (room) => {
  console.log(`Clearing room ${room} due to inactivity.`);
  io.in(room).emit('room-cleared', `Room ${room} closed due to inactivity.`);
  io.socketsLeave(room); 
  delete roomTimeouts[room]; 
};


server.on('error', (error) => {
  console.error('Server error:', error);
});


const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1); 
});


process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
