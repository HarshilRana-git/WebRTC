import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../services/peer";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setremoteSocketId] = useState(null);
  const [myStream, setmyStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [remoteIsPlaying, setRemoteIsPlaying] = useState(true);
  const [remoteStream, setremoteStream] = useState(null);

  const handleTogglePlaying = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRemoteTogglePlaying = () => {
    setRemoteIsPlaying(!remoteIsPlaying);
  };

  const handleUserJoined = useCallback(({ email, room }) => {
    console.log(`${email} joined room ${room}`);
    setremoteSocketId(room);
  }, []);

  const sendStream = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallaccepted = useCallback(
    async ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("CALL ACCEPTED");
      sendStream();
    },
    [sendStream]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handlefinal = useCallback(
    async ({ ans }) => {
      await peer.setLocalDescription(ans);
    },
    [socket]
  );

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setremoteStream(remoteStream[0]);
    });
  }, []);

  const handleIncomingcall = useCallback(
    async ({ from, offer }) => {
      setremoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setmyStream(stream);

      console.log("Incoming call from:" + from + " & " + offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingcall);
    socket.on("call:accepted", handleCallaccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncoming);
    socket.on("peer:nego:final", handlefinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingcall);
      socket.off("call:accepted", handleCallaccepted);
      socket.off("peer:nego:final", handlefinal);
      socket.off("peer:nego:needed", handleNegoNeedIncoming);
    };
  }, [
    socket,
    handlefinal,
    handleUserJoined,
    handleIncomingcall,
    handleCallaccepted,
  ]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      //   audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });

    setmyStream(stream);
  }, [remoteSocketId, socket]);

  return (
    <div>
      <h1>ROOM PAGE</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in Room"}</h4>
      {myStream && <button onClick={sendStream}>Send Stream</button>}
      {remoteSocketId ? <button onClick={handleCallUser}>Call</button> : null}
      {myStream && (
        <>
          <h1> My Video </h1> <br />{" "}
          <ReactPlayer controls={true} playing={isPlaying} url={myStream} />
          <button onClick={handleTogglePlaying}>
            {isPlaying ? "Pause" : "Play"}
          </button>
        </>
      )}

      {remoteStream && (
        <>
          <h1> Remote Video</h1> <br />{" "}
          <ReactPlayer
            controls={true}
            playing={remoteIsPlaying}
            url={remoteStream}
          />
          <button onClick={handleRemoteTogglePlaying}>
            {remoteIsPlaying ? "Pause" : "Play"}
          </button>
        </>
      )}
    </div>
  );
};

export default Room;
