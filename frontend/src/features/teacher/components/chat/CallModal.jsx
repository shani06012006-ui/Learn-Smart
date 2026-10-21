// frontend/src/features/teacher/components/chat/CallModal.jsx
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CallModal({
  isOpen,
  callType,
  status,
  remoteStream,
  localStream,
  onAccept,
  onDecline,
  onEnd,
  remoteUser,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);


  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);


  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle
      });
      setIsMuted(!isMuted);
    }
  };


  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
      >
        {/* Remote Video / Call Info */}
        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-900">
          {status === "incoming" ? (
            <div className="flex flex-col items-center text-white text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold animate-pulse">
                {remoteUser?.name?.[0] || "?"}
              </div>
              <h2 className="text-2xl font-bold">{remoteUser?.name} is calling...</h2>
              <p className="text-slate-400 mt-2">Incoming {callType} call</p>
              <div className="mt-10 flex gap-6">
                <button onClick={onDecline} className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-xl">
                  <PhoneOff size={28} />
                </button>
                <button onClick={onAccept} className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl animate-bounce">
                  <Video size={28} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Remote user video (full screen) */}
              {callType === "video" && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-white">
                  <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-purple-600 text-5xl font-bold">
                    {remoteUser?.name?.[0] || "?"}
                  </div>
                  <h2 className="text-xl font-bold">{remoteUser?.name}</h2>
                  <p className="text-slate-400 mt-2">{status === "calling" ? "Calling..." : "Connected"}</p>
                </div>
              )}

              {/* Local PIP video (if video call and connected/calling) */}
              {callType === "video" && localStream && (
                <div className="absolute bottom-6 right-6 h-48 w-32 overflow-hidden rounded-xl border-2 border-white shadow-2xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Controls bottom bar */}
              <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-full bg-slate-800/80 px-8 py-4 backdrop-blur-md">
                <button
                  onClick={toggleMute}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    isMuted ? "bg-white text-slate-900" : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                      isVideoOff ? "bg-white text-slate-900" : "bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                  >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>
                )}

                <button
                  onClick={onEnd}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-lg transition"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}