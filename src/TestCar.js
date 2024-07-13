"use client";
import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { CubeTextureLoader, MeshStandardMaterial } from "three";

export default function TestCar() {
  const { scene : scene1 } = useGLTF("buggati_face_max.glb");
  const { scene : scene2 } = useGLTF("buggati_face.glb");
  const [envMap, setEnvMap] = useState(null);
  const meshCar = scene1.children[0].geometry;
  meshCar.center()
  meshCar.renderOrder = 1
  
  const meshWireCar = scene2.children[0].geometry
  meshWireCar.center()
  meshWireCar.renderOrder = 2
  
  useEffect(() => {
    const loader = new CubeTextureLoader();
    const envMapTexture = loader.load(
      [
        "env.jpg",
        "env.jpg",
        "env.jpg",
        "env.jpg",
        "env.jpg",
        "env.jpg",
      ],
      () => {
        console.log(envMapTexture)
        setEnvMap(envMapTexture);
      }
    );
  }, []);

  const matCar = new MeshStandardMaterial({
    envMap:envMap,
    metalness: 0.7,
    roughness: 0.1,
    side:2
  });

  return (
      <>
      

        <directionalLight position={[10, 10, 5]} intensity={.2} /> 
       <group scale={0.02}>
            <mesh geometry={meshCar} material={matCar} />
            
        </group>
        <group scale={0.02}>
            <mesh geometry={meshWireCar} >
                <meshBasicMaterial 
                    wireframe={true}
                    transparent={true}
                    opacity={.2}
                />
            </mesh>
        </group>
      
      </>
  );
}

useGLTF.preload("buggati_face_max.glb");
useGLTF.preload("buggati_face.glb");