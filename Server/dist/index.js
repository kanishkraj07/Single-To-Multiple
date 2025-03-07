"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
var From;
(function (From) {
    From["SENDER"] = "sender";
    From["RECEIVER"] = "receiver";
})(From || (From = {}));
let globalCount = 1;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*'
    }
});
const users = [];
const socketMap = new Map();
io.on('connection', (socket) => {
    const id = globalCount++;
    socket.on('registerUser', (event) => {
        if (event.from === From.SENDER) {
            const id = findSender();
            if (id !== -1) {
                clearUser(id);
            }
        }
        addUser(id, event.from, socket);
    });
    socket.on('createOffer', (event) => {
        var _a;
        (_a = getSocketById(event.toId)) === null || _a === void 0 ? void 0 : _a.emit('createOffer', { offer: event.offer });
    });
    socket.on('createAnswer', (event) => {
        var _a;
        if (event.from === From.RECEIVER) {
            console.log(findSender(), id);
            (_a = getSocketById(findSender())) === null || _a === void 0 ? void 0 : _a.emit('createAnswer', { answer: event.answer, fromId: id });
        }
    });
    socket.on('iceCandidate', (event) => {
        var _a;
        const id = event.from === From.SENDER ? event.toId : findSender();
        (_a = getSocketById(id)) === null || _a === void 0 ? void 0 : _a.emit('iceCandidate', { fromId: id, candidate: event.candidate });
    });
    socket.on('disconnect', () => {
        clearUser(socketMap.get(socket) || -1);
    });
});
app.get('/allReceivers', (req, res) => {
    res.status(200).json({
        receivers: getReceivers().map(user => user.id)
    });
});
const getSocketById = (id) => {
    var _a;
    return (_a = users.find(user => user.id === id)) === null || _a === void 0 ? void 0 : _a.socket;
};
const getReceivers = () => {
    return users.filter(user => user.from === From.RECEIVER);
};
const findSender = () => {
    var _a;
    return ((_a = users.find(user => user.from === From.SENDER)) === null || _a === void 0 ? void 0 : _a.id) || -1;
};
const clearUser = (id) => {
    return users.splice(users.findIndex(user => user.id === id), 1);
};
const addUser = (id, from, socket) => {
    users.push({ id, socket, from });
    socketMap.set(socket, id);
};
server.listen(3000, () => {
    console.log('server started');
});
