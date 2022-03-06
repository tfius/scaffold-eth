import React, { useState, useEffect } from "react";

const useAudio = url => {
  const [audio] = useState(new Audio(url));
  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  useEffect(() => {
    playing ? audio.play() : audio.pause();
  }, [playing]);

  useEffect(() => {
    audio.addEventListener("ended", () => setPlaying(false));
    return () => {
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, []);

  useEffect(() => {
    return () => {
      audio.pause();
      console.log("in cleanup");
    };
  }, []);

  return [playing, toggle];
};

const AudioPlayer = ({ url, fontSize }) => {
  const [playing, toggle] = useAudio(url);

  return (
    <span onClick={toggle} style={{ fontSize: fontSize, cursor: "pointer" }}>
      {playing ? "⏸" : "▶"}
    </span>
  );
};

export default AudioPlayer;
