import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import App from './App';
import './styles.css';

// Extend THREE globally
extend(THREE);

const root = createRoot(document.getElementById('root'));

root.render(
  <Canvas
    camera={{ fov: 25, position: [0, 0, 6] }}
    gl={{
      antialias: true,
      alpha: true,
    }}
    onCreated={({ gl }) => {
      gl.setSize(window.innerWidth, window.innerHeight);
      window.addEventListener('resize', () => {
        gl.setSize(window.innerWidth, window.innerHeight);
        gl.setPixelRatio(window.devicePixelRatio);
      });
    }}
  >
    <App />
  </Canvas>
);
