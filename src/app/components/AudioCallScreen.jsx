import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicOffIcon from "@mui/icons-material/MicOff";
import { useEffect, useRef, useState } from "react";
import { useFriend } from "../context/FriendContext";
import { useScreen } from "../context/ScreenContext";

export default function AudioCallScreen({ onBack, session, socket }) {
  const { setSelectedScreen } = useScreen();
  const { selectedFriend } = useFriend();
  const [stream, setStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");

  const pendingCandidates = useRef([]);
  const userAudioRef = useRef();
  const peerAudioRef = useRef();
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      if (userAudioRef.current) {
        userAudioRef.current.srcObject = mediaStream;
      }
    });

    socket.on("incoming-call", ({ from, offer }) => {
      console.log("📞 Incoming call from:", from);
      setIncomingCall({ from, offer });
      setCallStatus("ringing");
    });

    socket.on("call-answered", ({ from, answer }) => {
      console.log("✅ Call answered by:", from);
      setCallStatus("in-call");

      if (peerConnectionRef.current) {
        peerConnectionRef.current
          .setRemoteDescription(new RTCSessionDescription(answer))
          .then(() => {
            pendingCandidates.current.forEach((candidate) => {
              peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            });
            pendingCandidates.current = [];
          })
          .catch((error) => console.error("Remote description error:", error));
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (
        !peerConnectionRef.current ||
        !peerConnectionRef.current.remoteDescription
      ) {
        pendingCandidates.current.push(candidate);
        return;
      }
      peerConnectionRef.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((error) => console.error("ICE candidate error:", error));
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");

      stream?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Once stream is ready, initiate call
    if (stream && selectedFriend?.id && callStatus === "idle") {
      callUser();
    }
  }, [stream]);

  const createPeerConnection = (otherUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      if (peerAudioRef.current) {
        peerAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: otherUserId,
          candidate: event.candidate,
        });
      }
    };

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    return pc;
  };

  const callUser = async () => {
    if (!selectedFriend?.id) return;

    setCallStatus("calling");
    const pc = createPeerConnection(selectedFriend.id);
    peerConnectionRef.current = pc;

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      socket.emit("call-user", { to: selectedFriend.id, offer });
    } catch (error) {
      console.error("Call setup error:", error);
      setCallStatus("idle");
      pc.close();
      peerConnectionRef.current = null;
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    const { from, offer } = incomingCall;
    setCallStatus("in-call");
    const pc = createPeerConnection(from);
    peerConnectionRef.current = pc;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", { to: from, answer });
      setIncomingCall(null);

      pendingCandidates.current.forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
      pendingCandidates.current = [];
    } catch (error) {
      console.error("Error accepting call:", error);
      setCallStatus("idle");
      pc.close();
      peerConnectionRef.current = null;
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      socket.emit("call-ended", { to: selectedFriend?.id });
    }
    setCallStatus("idle");
    setIncomingCall(null);
    setStream(null);
    setSelectedScreen("chat");
    onBack();
  };

  const toggleMute = () => {
    if (!stream) return;
    const enabled = !muted;
    stream.getAudioTracks().forEach((track) => (track.enabled = enabled));
    setMuted(enabled);
  };

  return (
    <div className="w-3/4 h-screen flex flex-col items-center justify-center bg-blue-100 relative">
      <button
        className="absolute top-4 left-4 bg-gray-300 rounded-full p-2 hover:bg-gray-400"
        onClick={onBack}
        title="Back to Chat"
      >
        <ArrowBackIcon />
      </button>

      {callStatus === "ringing" ? (
        <div className="text-center p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-gray-800">Incoming Call</h3>
          <p className="text-gray-500">From: {incomingCall?.from}</p>
          <div className="flex space-x-4 mt-4">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={acceptCall}
            >
              Accept
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={endCall}
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center mb-8">
          <img
            src="https://via.placeholder.com/150"
            alt="Contact"
            className="w-36 h-36 rounded-full mb-4 mx-auto"
          />
          <h2 className="text-2xl font-bold text-gray-800">John Doe</h2>
          <p className="text-gray-500">
            {callStatus === "calling" ? "Calling..." : "In Call"}
          </p>
        </div>
      )}

      <audio ref={userAudioRef} autoPlay muted />
      <audio ref={peerAudioRef} autoPlay />

      <div className="flex space-x-8 mt-12">
        <button
          className="p-4 bg-gray-300 rounded-full text-gray-700 hover:bg-gray-400"
          onClick={toggleMute}
          title="Mute/Unmute"
        >
          <MicOffIcon />
        </button>
        <button
          className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600"
          onClick={endCall}
          title="End Call"
        >
          <CallEndIcon />
        </button>
      </div>
    </div>
  );
}
