import * as THREE from 'three'
import { extend } from '@react-three/fiber'

class DofPointsMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: `uniform sampler2D positions;
      uniform float uTime;
      uniform float uFocus;
      uniform vec3 mousePos;
      uniform float uFov;
      uniform float uBlur;
      varying float vDistance;
      varying float zDis;
      float lerp(float a, float b, float amount) {
          return a + (b - a) * amount;
      }

      void main() { 
        float lerpFactor = 1.;
        
        vec3 pos = texture2D(positions, position.xy).xyz;
        float distCalc = distance(vec2(mousePos.x,mousePos.y),vec2(0.,0.));
        float dist = min(distance(pos, vec3(mousePos.x,mousePos.y,0.4)), .2);
      //  dist =  sin(pow(dist,1.0));
     // dist = sin(dist*dist);
        if(dist > 0.01) {
          pos.x = lerp(pos.x, min(pos.x * dist,.2), lerpFactor);
          pos.y = lerp(pos.y, min(pos.y * dist,.2), lerpFactor);
          pos.z = lerp(pos.z, min(pos.z * dist,.2), lerpFactor);
        }
     
        
      
   
       // pos.z = lerp(pos.z, pos.z * dist / 1., lerpFactor);//Mouse is always in z=0


        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vDistance = abs(uFocus - -mvPosition.z);
        zDis =  pos.z;
        gl_PointSize = (step(1.0 - (1.0 / uFov), position.x)) * vDistance * uBlur;
        gl_PointSize = 5.;
      }`,
      fragmentShader: `uniform float uOpacity;
      varying float vDistance;
      varying float zDis;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        if (dot(cxy, cxy) > 1.0) discard;
        gl_FragColor = vec4(vec3(1.0), (1.04 - clamp(zDis * 1.5, 0.0, 1.0)));
        gl_FragColor = vec4(vec3(1.0),zDis*55.);
      }`,
      uniforms: {
        positions: { value: null },
        uTime: { value: 0 },
        mousePos:{value : new THREE.Vector3(0,0,0)},
        uFocus: { value: 5.1 },
        uFov: { value: 50 },
        uBlur: { value: 30 }
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    })
  }
}

extend({ DofPointsMaterial })
