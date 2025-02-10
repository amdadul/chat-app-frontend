import { Pause, PlayArrow } from "@mui/icons-material"; // Import Material icons
import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ audioSrc }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;

      const updateProgress = () => {
        if (!isNaN(audioElement.currentTime) && audioElement.currentTime >= 0) {
          setCurrentTime(audioElement.currentTime);
        }
        if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
          setDuration(audioElement.duration);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0); // Reset the current time when the audio ends
      };

      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("ended", handleEnded);

      // Handle loading error and set duration if valid
      audioElement.addEventListener("loadedmetadata", () => {
        if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
          setDuration(audioElement.duration);
        }
      });

      return () => {
        audioElement.removeEventListener("timeupdate", updateProgress);
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.removeEventListener("loadedmetadata", () => {});
      };
    }
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && !isNaN(duration) && duration > 0) {
      const seekTime = (e.target.value / 100) * duration;

      // Ensure we set valid currentTime
      if (seekTime >= 0 && seekTime <= duration) {
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);

        // If the audio was paused, start playing from the new position
        if (!isPlaying) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  // Ensure currentTime and duration are valid numbers before passing them to the range
  const progressValue =
    duration && !isNaN(duration) ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player w-full max-w-md p-3 bg-gray-200 rounded-lg shadow-md">
      <audio ref={audioRef} src={audioSrc} preload="auto" />
      <div className="controls flex items-center space-x-3">
        {/* Play/Pause Button with Material Icons */}
        <button
          onClick={togglePlayPause}
          className="play-pause-btn text-gray-700"
        >
          {isPlaying ? (
            <Pause fontSize="large" />
          ) : (
            <PlayArrow fontSize="large" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={progressValue}
            onChange={handleSeek}
            ref={progressBarRef}
            className="progress-bar w-full cursor-pointer bg-gray-300 rounded-lg h-2"
            disabled={isNaN(duration) || duration === 0}
          />
        </div>

        {/* Time Display */}
        <div className="time-display text-xs text-gray-600">
          <span>{formatTime(currentTime)}</span> /{" "}
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time as MM:SS
const formatTime = (time) => {
  if (isNaN(time) || time === Infinity || time < 0) {
    return "0:00";
  }
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
