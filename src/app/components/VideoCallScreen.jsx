import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallEndIcon from "@mui/icons-material/CallEnd";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import { useEffect, useRef, useState } from "react";
import { useFriend } from "../context/FriendContext";
import { useScreen } from "../context/ScreenContext";

export default function VideoCallScreen({ onBack, session, socket }) {
  const { setSelectedScreen } = useScreen();
  const { selectedFriend } = useFriend();
  const [stream, setStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCamera, setCurrentCamera] = useState("user");
  const [callStatus, setCallStatus] = useState("idle"); // 'idle', 'calling', 'ringing', 'in-call'
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const pendingCandidates = useRef([]);

  const userVideoRef = useRef();
  const peerVideoRef = useRef();
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    startUserMedia();

    socket.on("incoming-call", ({ from, offer }) => {
      console.log("📞 Incoming call from:", from);
      setIncomingCall({ from, offer });
      setCallStatus("ringing");
    });

    socket.on("call-answered", ({ from, answer }) => {
      console.log("✅ Call answered by:", from);
      setCallStatus("in-call");
      setIsCallStarted(true);

      if (peerConnectionRef.current) {
        peerConnectionRef.current
          .setRemoteDescription(new RTCSessionDescription(answer))
          .then(() => {
            console.log("Remote description set after answer.");
            pendingCandidates.current.forEach((candidate) => {
              try {
                peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(candidate)
                );
              } catch (error) {
                console.error("Error adding pending candidate:", error);
              }
            });
            pendingCandidates.current = [];
          })
          .catch((error) =>
            console.error("Error setting remote description:", error)
          );
      }
    });

    socket.on("ice-candidate", ({ from, candidate }) => {
      console.log("🔹 ICE Candidate received:", candidate);

      if (
        !peerConnectionRef.current ||
        !peerConnectionRef.current.remoteDescription
      ) {
        console.warn("Peer connection not ready. Storing ICE candidate.");
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

    callUser(); // Call the user if selectedFriend exists

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      peerConnectionRef.current?.close();
      setCallStatus("idle");
      setRemoteStream(null);
      setIsCallStarted(false);
    };
  }, []);

  const startUserMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamera },
        audio: true,
      });
      setStream(mediaStream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("❌ Error accessing camera/microphone:", error);
    }
  };

  const createPeerConnection = (otherUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const remoteStream = new MediaStream();
    setRemoteStream(remoteStream); // Update state with the new remote stream

    // Bind the remote stream to the peerVideoRef
    if (peerVideoRef.current) {
      peerVideoRef.current.srcObject = remoteStream;
    }

    pc.ontrack = (event) => {
      console.log("🔹 Remote track received:", event.streams[0]);

      // Add tracks to the remote stream
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      // Ensure the peerVideoRef is updated with the remote stream
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🔹 Sending ICE Candidate:", event.candidate);
        socket.emit("ice-candidate", {
          to: otherUserId,
          candidate: event.candidate,
        });
      } else {
        console.log("🔹 ICE Gathering Complete.");
      }
    };

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    return pc;
  };

  const callUser = async () => {
    if (!selectedFriend?.id || callStatus !== "idle") return;
    setCallStatus("calling");
    console.log("📞 Calling user:", selectedFriend.id);

    const pc = createPeerConnection(selectedFriend.id);
    peerConnectionRef.current = pc;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log("📞 Calling user with offer:", offer);
      socket.emit("call-user", { to: selectedFriend.id, offer });
    } catch (error) {
      console.error("Error during call setup:", error);
      setCallStatus("idle");
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    }
  };

  const answerCall = async () => {
    if (!incomingCall || callStatus !== "ringing") return;
    setCallStatus("in-call");
    setIsCallStarted(true);

    const pc = createPeerConnection(incomingCall.from);
    peerConnectionRef.current = pc;

    try {
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("✅ Answering call with:", answer);
      socket.emit("answer-call", { to: incomingCall.from, answer });
      setIncomingCall(null);

      // Add pending ICE candidates
      pendingCandidates.current.forEach((candidate) => {
        try {
          peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Error adding pending candidate:", error);
        }
      });
      pendingCandidates.current = [];
    } catch (error) {
      console.error("Error answering call:", error);
      setCallStatus("idle");
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      setIncomingCall(null);
      setIsCallStarted(false);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      setVideoEnabled(videoTracks.some((track) => track.enabled));
    }
  };

  const switchCamera = async () => {
    setCurrentCamera((prev) => (prev === "user" ? "environment" : "user"));
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }
    }
    startUserMedia();
  };

  const endCall = () => {
    peerConnectionRef.current?.close();
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setSelectedScreen("chat");
    setIncomingCall(null);
    setIsCallStarted(false);
    onBack();
  };

  return (
    <div className="w-3/4 h-screen flex flex-col items-center justify-center bg-black relative">
      <button
        className="absolute top-4 left-4 z-50 bg-gray-300 rounded-full p-2 hover:bg-gray-400"
        onClick={onBack}
        title="Back to Chat"
      >
        <ArrowBackIcon />
      </button>

      {callStatus === "ringing" ? (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg text-center">
          <h3 className="text-xl font-bold text-gray-800">Incoming Call</h3>
          <p className="text-gray-500">From: {incomingCall.from}</p>
          <div className="flex space-x-4 mt-4">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={answerCall}
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <video
            ref={peerVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            srcobject={remoteStream}
          />
        </div>
      )}

      <div className="absolute bottom-4 right-4 w-24 h-32 bg-gray-700 rounded-md overflow-hidden">
        <video
          ref={userVideoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute bottom-8 w-full flex justify-center space-x-8">
        <button
          className="p-4 rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400"
          onClick={toggleVideo}
        >
          <VideocamOffIcon />
        </button>
        <button
          className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600"
          onClick={endCall}
        >
          <CallEndIcon />
        </button>
        <button
          className="p-4 bg-gray-300 rounded-full text-gray-700 hover:bg-gray-400"
          onClick={switchCamera}
        >
          <FlipCameraAndroidIcon />
        </button>
      </div>
    </div>
  );
}
