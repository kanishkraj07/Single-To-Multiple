import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";

enum From {
    SENDER = 'sender',
    RECEIVER = 'receiver'
}

interface User {
    id: number;
    socket: Socket;
    from: From
}

let globalCount: number = 1;

const app = express();

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

const users: User[] = [];

const socketMap = new Map<Socket, number>();


io.on('connection', (socket: Socket) => {

    const id: number = globalCount++;

    socket.on('registerUser', (event: {from: From}) => {
        if(event.from === From.SENDER) {
            const id = findSender();
            if(id !== -1) {
                clearUser(id);
            }
        }
       addUser(id, event.from, socket);
    });

    socket.on('createOffer', (event: {toId: number, offer: any}) => {
        getSocketById(event.toId)?.emit('createOffer', {offer: event.offer});
    });

    socket.on('createAnswer', (event: {from: From, answer: any, fromId?: number}) => {
        if(event.from === From.RECEIVER) {
            console.log(findSender(), id);
            getSocketById(findSender())?.emit('createAnswer', {answer: event.answer, fromId: id})
        }
    });

    socket.on('iceCandidate', (event: {from: From, toId: number, candidate: any}) => {
        const id: number = event.from === From.SENDER ? event.toId : findSender();
        getSocketById(id)?.emit('iceCandidate', {fromId: id, candidate: event.candidate})
    });

    socket.on('disconnect', () => {
        clearUser(socketMap.get(socket) || -1);
    });
});

app.get('/allReceivers', (req, res) => {
    res.status(200).json({
        receivers: getReceivers().map(user => user.id)
    })
})


const getSocketById = (id: number) => {
    return users.find(user => user.id === id)?.socket;
}

const getReceivers = () => {
    return users.filter(user => user.from === From.RECEIVER);
}

const findSender = () => {
    return users.find(user => user.from === From.SENDER)?.id || -1;
}

const clearUser = (id: number) => {
    return users.splice(users.findIndex(user => user.id === id), 1);
}

const addUser = (id: number, from: From, socket: Socket, ) => {
    users.push({ id, socket, from } as User);
    socketMap.set(socket, id);
}

server.listen(3000, () => {
    console.log('server started');
});