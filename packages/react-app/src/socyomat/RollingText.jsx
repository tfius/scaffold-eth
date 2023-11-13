import React, { useState, useEffect } from "react";
import "./RollingText.css"; // Import the CSS for styling

const RollingLetterText = ({ text }) => {
  return (
    <>
      {text.split("").map(function (char, index) {
        const style = { "animation-delay": 0.05 + index / 50 + "s" };
        return (
          <span aria-hidden="true" key={index} style={style} className="rolling-span">
            {char}
          </span>
        );
      })}
    </>
  );
};

export const RollingText = ({ textArray, interval }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  var [text, setCurrentText] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const idx = Math.floor(Math.random() * textArray.length);
      setCurrentText(null);
      setCurrentIdx(idx);
    }, interval);

    return () => clearInterval(timer);
  }, [textArray.length.interval]);

  useEffect(() => {
    setCurrentText(textArray[currentIdx]);
  }, [currentIdx]);

  return <>{text === null ? null : <RollingLetterText text={text} />}</>;
};

export default RollingText;
