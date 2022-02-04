import "./styles.css";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";


// https://github.com/shuding/cobe
// "cobe": "0.4.0",
// https://github.com/pissang/papercut-box-art
// https://github.com/pissang/claygl


export default function Globe() {
  const canvasRef = useRef();

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 300 * 2,
      height: 300 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 }
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.01;
      }
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className="App">
      <h1>COBE</h1>
      <p>
        A lightweight (5kB) WebGL globe lib:{" "}
        <a href="https://github.com/shuding/cobe" target="_blank">
          GitHub
        </a>
      </p>
      <canvas ref={canvasRef} style={{ width: 300, height: 300 }} />
    </div>
  );
}
