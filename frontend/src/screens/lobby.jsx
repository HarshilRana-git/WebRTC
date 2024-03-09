import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
    console.log("hello there:", email, room);
  }, []);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, []);

  return (
    <div>
      <div className="container">
        <h1>VIDEO CALL</h1>
        <form onSubmit={handleSubmitForm}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <br />
          <div className="mb-3">
            <label htmlFor="room" className="form-label">
              Room Number
            </label>
            <input
              type="text"
              className="form-control"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <br />

          <button type="submit" className="btn btn-primary">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
