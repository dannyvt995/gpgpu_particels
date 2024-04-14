import * as THREE from 'three'
import { useMemo, useState, useRef } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import './shaders/simulationMaterial'
import './shaders/dofPointsMaterial'


export function Particles({ speed, fov, aperture, focus, curl, size = 150, ...props }) {
  const simRef = useRef()
  const renderRef = useRef()
  // Set up FBO
  const [scene] = useState(() => new THREE.Scene())
  const [camera] = useState(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1))
  const [positions] = useState(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]))
  const [uvs] = useState(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]))
  const target = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  })
  // Normalize points
  const particles = useMemo(() => {
    const length = size * size
    const particles = new Float32Array(length * 3)
    for (let i = 0; i < length; i++) {
      let i3 = i * 3
      particles[i3 + 0] = (i % size) / size
      particles[i3 + 1] = i / size / size
    }
    return particles
  }, [size])
  console.log(particles)
  // Update FBO and pointcloud every frame
  useFrame((state) => {
    state.gl.setRenderTarget(target)
    state.gl.clear()
    state.gl.render(scene, camera)
    state.gl.setRenderTarget(null)
    renderRef.current.uniforms.positions.value = target.texture
   // renderRef.current.uniforms.uTime.value = state.clock.elapsedTime
    renderRef.current.uniforms.uFocus.value = 1
    renderRef.current.uniforms.uFov.value = 1
    renderRef.current.uniforms.uBlur.value = 1
      
    renderRef.current.uniforms.mousePos.value = new THREE.Vector3(state.mouse.x,state.mouse.y,0)
    simRef.current.uniforms.mousePos.value = new THREE.Vector3(state.mouse.x,state.mouse.y,0)
    simRef.current.uniforms.uTime.value = state.clock.elapsedTime * speed
    simRef.current.uniforms.uCurlFreq.value = 1
  })
  return (
    <>
      {/* Simulation goes into a FBO/Off-buffer */}
      {createPortal(
        <mesh>
          <simulationMaterial ref={simRef} />
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
          </bufferGeometry>
        </mesh>,
        scene
      )}
      {/* The result of which is forwarded into a pointcloud via data-texture */}
      <points {...props}>
        <dofPointsMaterial ref={renderRef} />
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
        </bufferGeometry>
      </points>
    

    </>
  )
}
