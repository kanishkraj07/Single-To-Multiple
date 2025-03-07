import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";


const URL = 'http://localhost:3000';

interface Peer {
    id: number;
    pc: RTCPeerConnection
}

const Sender = () => {
    let peers: Peer[] = [];
    const [socket, setSocket] = useState<Socket | null>(null)

    const [localMediaTrack, setLocalMediaTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteMediaTrack, setRemoteMediaTrack] = useState<MediaStreamTrack | null>(null)

    useEffect(() => {
        const sockt: Socket = io(URL);
        sockt.emit('registerUser', {from: 'sender'});
        socket?.on('createAnswer', (event: {answer: any, fromId: number}) => {
            peers.find(peer => peer.id === event.fromId)?.pc.setRemoteDescription(event.answer);
        });
    
        socket?.on('iceCandidate', (event: {fromId: number, candidate: any}) => {
            peers.find(peer => peer.id === event.fromId)?.pc.addIceCandidate(event.candidate);
        })
        setSocket(sockt);
    }, []);

    useEffect(()=> {
        peers.forEach(peer => {
            if(localMediaTrack && peer?.pc) {
                peer.pc.addTrack(localMediaTrack)
            }
        })
    }, [localMediaTrack]);

    const getAllReceivers = useCallback(async() => {
        const response = await axios.get(`${URL}/allReceivers`);
         return response.data.receivers as number[];
    }, []);

    const startCall = async() => {
        const receivers = await getAllReceivers();
       receivers.forEach(async (receiverId: number) => {
        const pc = new RTCPeerConnection();    

        pc.onnegotiationneeded = async() => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('createOffer', {toId: receiverId, offer});
        }

        pc.onicecandidate = (event) => {
            if(event.candidate) {
                socket?.emit('iceCandidate', {from: 'sender', toId: receiverId, candidate: event.candidate})
            }
        }
        peers.push({id: receiverId, pc} as Peer);
       });

       const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
       setLocalMediaTrack(stream.getVideoTracks()[0]);
    }

    return <>
    <button onClick={startCall}>Start Video call</button>
    </>
}

export default Sender;