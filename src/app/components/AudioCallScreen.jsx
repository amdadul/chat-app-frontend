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
  const [iceCandidates, setIceCandidates] = useState([]); // Store ICE candidates before setting remote description
  const [callStatus, setCallStatus] = useState("idle"); // 'idle', 'calling', 'ringing', 'in-call'

  const pendingCandidates = useRef([]);

  const userAudioRef = useRef();
  const peerAudioRef = useRef();
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      setStream(stream);
      if (userAudioRef.current) {
        userAudioRef.current.srcObject = stream;
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
            console.log("Remote description set after answer.");
            // Process pending ICE candidates
            pendingCandidates.current.forEach((candidate) => {
              try {
                peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
              } catch (error) {
                console.error("Error adding pending candidate:", error);
              }
            });
            pendingCandidates.current = []; // Clear pending candidates
          })
          .catch((error) =>
            console.error("Error setting remote description:", error)
          );
      }
    });

    socket.on("ice-candidate", ({ from, candidate }) => {
      console.log("🔹 ICE Candidate received:", candidate);

      if (!peerConnectionRef.current) {
        console.warn("Peer connection not established. Storing ICE candidate.");
        pendingCandidates.current.push(candidate);
        return;
      }

      if (!peerConnectionRef.current.remoteDescription) {
        console.warn("Remote description not set. Storing ICE candidate.");
        pendingCandidates.current.push(candidate);
        return;
      }

      try {
        peerConnectionRef.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .then(() => console.log("ICE candidate added."))
          .catch((error) =>
            console.error("Error adding ICE candidate:", error)
          );
      } catch (error) {
        console.error("ICE candidate handling error:", error);
      }
    });

    callUser();

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      peerConnectionRef.current?.close();
      setCallStatus("idle"); // Reset call status
    };
  }, []);

  const createPeerConnection = (otherUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      console.log("🎧 Audio track received:", event.streams[0]);
      if (peerAudioRef.current) {
        peerAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📡 Sending ICE Candidate:", event.candidate);
        socket.emit("ice-candidate", {
          to: otherUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offerOptions = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        };
        const offer = await pc.createOffer(offerOptions);
        console.log("Local Offer SDP:", offer.sdp);
        await pc.setLocalDescription(offer);
        socket.emit("call-user", { to: selectedFriend.id, offer });
      } catch (error) {
        console.error("Error during negotiation:", error);
      }
    };

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    return pc;
  };

  const callUser = async () => {
    if (!selectedFriend?.id || callStatus !== "idle") return; // Prevent multiple calls
    console.log("📞 Calling user:", selectedFriend.id);
    setCallStatus("calling");

    const pc = createPeerConnection(selectedFriend.id);
    peerConnectionRef.current = pc;

    try {
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      };
      const offer = await pc.createOffer(offerOptions);
      console.log("Local Offer SDP:", offer.sdp);
      await pc.setLocalDescription(offer);
      socket.emit("call-user", { to: selectedFriend.id, offer });
    } catch (error) {
      console.error("Error during call setup:", error);
      setCallStatus("idle"); // Reset on error
      peerConnectionRef.current?.close(); // Close the connection
      peerConnectionRef.current = null;
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || callStatus !== "ringing") return; // Prevent multiple acceptances
    const { from, offer } = incomingCall;
    console.log("✅ Accepting call from:", from);
    setCallStatus("in-call");

    const pc = createPeerConnection(from);
    peerConnectionRef.current = pc;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("Remote Offer SDP:", offer.sdp);

      const answer = await pc.createAnswer();
      console.log("Local Answer SDP:", answer.sdp);
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", { to: from, answer });
      setIncomingCall(null);

      // Process pending ICE candidates (if any)
      pendingCandidates.current.forEach((candidate) => {
        try {
          peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Error adding pending candidate:", error);
        }
      });
      pendingCandidates.current = []; // Clear pending candidates
    } catch (error) {
      console.error("Error accepting call:", error);
      setCallStatus("idle"); // Reset on error
      peerConnectionRef.current?.close(); // Close the connection
      peerConnectionRef.current = null;
      setIncomingCall(null);
      return; // Exit to prevent further execution
    }
  };

  const endCall = () => {
    console.log("❌ Ending call...");
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      socket.emit("call-ended", { to: selectedFriend?.id }); // Notify the other peer
    }

    userAudioRef.current = null;

    setStream(null);
    setIncomingCall(null);
    setCallStatus("idle"); // Reset the call status
    setSelectedScreen("chat");
    onBack();
    pendingCandidates.current = []; // Clear pending candidates
    peerConnectionRef.current = null;
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
          <p className="text-gray-500">From: {incomingCall.from}</p>
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
