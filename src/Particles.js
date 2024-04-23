import * as THREE from 'three'
import { useMemo, useState, useRef, useEffect } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { useFBO, useGLTF } from '@react-three/drei'
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

    {/*   <Boxes i={350} j={350} />
      <directionalLight color={'white'}/>
      <pointLight position={[5, 5, 5]} /> */}
      <axesHelper args={[5]} />
    
    </>
  )
}


const tempBoxes = new THREE.Object3D();

const Boxes = ({ i, j }) => {
  const aa = useGLTF('whale_glb.glb')
  const cloneMesh = aa.scene.children[0].clone()
  const targetPosition = cloneMesh.geometry.attributes.position.array
  const material = new THREE.MeshLambertMaterial({ color: "red" });
  const boxesGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
  const ref = useRef();
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2();

  document.addEventListener( 'mousemove', onPointerMove );
  function onPointerMove( event ) {

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  }
  const uniforms = {
    offset: { type: 'f', value: 0.001 },
    color: { type: 'c', value: new THREE.Color(0x6B6B6B) },
    intensity: { type: 'f', value: 1.0 },
  };
  const matShader = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: `
    // apply instanceMatrix on shader
    void main() {
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    void main() {
      gl_FragColor = vec4( vec3(1.,.5,.6), 1. );
    }
    `
});
  useEffect(() => {
    let counter = 0;
    
    for (let i = 0; i < targetPosition.length; i += 3) {
      const id = counter++;
      tempBoxes.updateMatrix();
      tempBoxes.position.set(targetPosition[i], targetPosition[i + 1], targetPosition[i + 2])
      tempBoxes.rotation.set(targetPosition[i], targetPosition[i + 1], targetPosition[i + 2])
      ref.current.setMatrixAt(id, tempBoxes.matrix);
    }
    console.log(ref.current)
    ref.current.instanceMatrix.needsUpdate = true;
  })
  useFrame((state) => {
    raycaster.setFromCamera( pointer, state.camera );

				// const intersects = raycaster.intersectObjects(ref.current, false );
        // if ( intersects.length > 0 ) {
        //   console.log('>0')
			

				// } else {
        //   console.log('lee')
				// }

  })

  return <instancedMesh ref={ref} args={[boxesGeometry, matShader, i * j]} />;
};



  // useFrame(({ clock }) => {
  //   let counter = 0;
  //   const t = clock.oldTime * 0.001;
  //   for (let x = 0; x < i; x++) {
  //     for (let z = 0; z < j; z++) {
  //       const id = counter++;
  //       tempBoxes.position.set(i / 2 - x, 0, j / 2 - z);
  //       tempBoxes.rotation.y = t;
  //       tempBoxes.updateMatrix();
  //       ref.current.setMatrixAt(id, tempBoxes.matrix);
  //     }
  //   }
  //   ref.current.instanceMatrix.needsUpdate = true;
  // });