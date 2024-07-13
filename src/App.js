import { OrbitControls, CameraShake,PerspectiveCamera } from '@react-three/drei'
import { useControls } from 'leva'
import { Particles } from './Particles'
import { Camera } from '@react-three/fiber'
import TestCar from './TestCar'
import { Perf } from 'r3f-perf'
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'

export default function App() {
  const props = useControls({
    focus: { value: 5.1, min: 3, max: 7, step: 0.01 },
    speed: { value: 100, min: 0.1, max: 100, step: 0.1 },
    aperture: { value: 1.8, min: 1, max: 5.6, step: 0.1 },
    fov: { value: 20, min: 0, max: 200 },
    curl: { value: 0.25, min: 0.01, max: 0.5, step: 0.01 }
  })
  return (
    <>
      <Perf/>
      <OrbitControls   zoomSpeed={5} />
      <PerspectiveCamera makeDefault position={[0,0,.5]} near={0.001} far={1000} />
      {/* <Particles {...props} /> */}
      <TestCar/>

      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
        <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
      
    </>
  )
}
