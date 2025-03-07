import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const Receiver = () => {

    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const videoEle = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket: Socket = io('http://localhost:3000');
        socket.emit('registerUser', {from: 'receiver'});
        const peer = new RTCPeerConnection();

        peer.onicecandidate = (event) => {
            if(event.candidate) {
                socket?.emit('iceCandidate', {from: 'receiver', candidate: event.candidate})
            }
        }

        socket.on('createOffer', async(event: {offer: any, toId: number}) => {
            console.log('inn');
            await peer.setRemoteDescription(event.offer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('createAnswer', {from: 'receiver', answer});
            setPc(peer);
        });

        socket.on('iceCandidate', (event: {candidate: any}) => {
            pc?.addIceCandidate(event.candidate);
        });

        peer.ontrack = (event) => {
            if(videoEle.current) {
                videoEle.current.srcObject = new MediaStream([event.track]);
                videoEle.current.play();
            }
        }


        return () => {
            socket.disconnect();
        }
    }, []);


    return <>
    <video ref={videoEle} autoPlay muted></video>
    </>
}

export default Receiver;