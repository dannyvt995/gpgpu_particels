import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import glsl from 'babel-plugin-glsl/macro'
import { useGLTF } from '@react-three/drei'
function getPoint(v, size, data, offset) {
  v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
  if (v.length() > 1) return getPoint(v, size, data, offset)
  return v.normalize().multiplyScalar(size).toArray(data, offset)
}

function getSphere(count, size, p = new THREE.Vector4()) {
  const data = new Float32Array(count * 4)
  for (let i = 0; i < count * 4; i += 4) getPoint(p, size, data, i)
  return data
}

class SimulationMaterial extends THREE.ShaderMaterial {
  constructor() {


    // const positionsTexture = new THREE.DataTexture(getSphere(150 * 150, 128), 150, 150, THREE.RGBAFormat, THREE.FloatType)


    const aa = useGLTF('whale_glb.glb')

    // const positionsTexture = new THREE.DataTexture(aa.scene.children[0].geometry.attributes.position, 150, 150, THREE.RGBAFormat, THREE.FloatType)
    // const positionsTexture = new THREE.DataTexture(a.attributes.position, 150, 150, THREE.RGBAFormat, THREE.FloatType)

    const cloneMesh = aa.scene.children[0].clone()
    console.log(cloneMesh);
   // cloneMesh.rotateOnAxis(new THREE.Vector3(1.,1.,0.),.5)
    const model = new THREE.SphereGeometry(4, 100, 100);

    const targetPosition = cloneMesh.geometry.attributes.position
   

    const width = 150;
    const height = 150;

    const size = width * height;
    const data = new Float32Array(4 * size);

    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      // Access x, y, z components of targetPosition
      const x = targetPosition.getX(i);
      const y = targetPosition.getY(i);
      const z = targetPosition.getZ(i);


      // Assign targetPosition values to data array
      data[stride] = x / 5;
      data[stride + 1] = y / 5;
      data[stride + 2] = z / 5;
      data[stride + 3] = 1; // Alpha channel, set to 1 (fully opaque)
    }
    const  positionsTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);


    const   positionsTextureCC= new THREE.DataTexture(getSphere(150 * 150, 4), width, height, THREE.RGBAFormat, THREE.FloatType);


    positionsTexture.needsUpdate = true
    console.log(positionsTexture.source.data.data, positionsTextureCC.source.data.data)
    super({
      vertexShader: `varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
      fragmentShader: glsl`uniform sampler2D positions;
      uniform float uTime;
      uniform float uCurlFreq;
      uniform vec3 mousePos;
      varying vec2 vUv;
      #pragma glslify: curl = require(glsl-curl-noise2)
      #pragma glslify: noise = require(glsl-noise/classic/3d.glsl)   
      
      
      //
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float noise(vec2 v)
{
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                    0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                   -0.577350269189626,  // -1.0 + 2.0 * C.x
                    0.024390243902439); // 1.0 / 41.0
  // First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

  // Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  // Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

  // Gradients: 41 points uniformly over a line, mapped onto a diamond.
  // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  // Normalise gradients implicitly by scaling m
  // Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

  // Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 curl(float	x,	float	y,	float	z)
{

  float	eps	= 1., eps2 = 2. * eps;
  float	n1,	n2,	a,	b;

  x += uTime * .005;
  y += uTime * .005;
  z += uTime * .005;

  vec3	curl = vec3(0.);

  n1	=	noise(vec2( x,	y	+	eps ));
  n2	=	noise(vec2( x,	y	-	eps ));
  a	=	(n1	-	n2)/eps2;

  n1	=	noise(vec2( x,	z	+	eps));
  n2	=	noise(vec2( x,	z	-	eps));
  b	=	(n1	-	n2)/eps2;

  curl.x	=	a	-	b;

  n1	=	noise(vec2( y,	z	+	eps));
  n2	=	noise(vec2( y,	z	-	eps));
  a	=	(n1	-	n2)/eps2;

  n1	=	noise(vec2( x	+	eps,	z));
  n2	=	noise(vec2( x	+	eps,	z));
  b	=	(n1	-	n2)/eps2;

  curl.y	=	a	-	b;

  n1	=	noise(vec2( x	+	eps,	y));
  n2	=	noise(vec2( x	-	eps,	y));
  a	=	(n1	-	n2)/eps2;

  n1	=	noise(vec2(  y	+	eps,	z));
  n2	=	noise(vec2(  y	-	eps,	z));
  b	=	(n1	-	n2)/eps2;

  curl.z	=	a	-	b;

  return	curl;
}

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}

      void main() {
        float t = uTime * 0.00015;
        vec3 pos = texture2D(positions, vUv).rgb; // basic simulation: displays the particles in place.
        // vec3 curlPos = texture2D(positions, vUv).rgb;
        // pos = curl(pos  + t);
        // curlPos = curl(curlPos * uCurlFreq + t);
        // // curlPos += curl(curlPos * uCurlFreq * 2.0) * 0.5;
        // // curlPos += curl(curlPos * uCurlFreq * 4.0) * 0.25;
        // // curlPos += curl(curlPos * uCurlFreq * 8.0) * 0.125;
        // // curlPos += curl(pos * uCurlFreq * 16.0) * 0.0625;




        vec3 axis = vec3(.2,.2,.2); 
        float angle = radians(70.0 + uTime/5.);     
        // Get rotation mat
        mat4 rotationMatrix = rotation3d(axis, angle);
    
        // Apply mat rot
        pos = (rotationMatrix * vec4(pos, 1.0)).xyz;


        float frequency = 1.8;
        float amplitude = .5;
        float maxDistance = 1.;
        vec3 tar = pos + curl( pos.x * frequency, pos.y * frequency, pos.z * frequency ) * amplitude;

        float d = length( pos-tar ) / maxDistance;
        // pos = mix( pos, tar, pow( d, 5. ) );

        float dsMouse =  min(distance(pos, vec3(mousePos.x,mousePos.y,0.)), .05);
         if(dsMouse < 0.1) {
          pos.x =  mix(pos.x,1.,dsMouse);
         }
       


        gl_FragColor = vec4(pos, 1.0);
        
      }`,
      uniforms: {
        positions: { value: positionsTexture },
        uTime: { value: 0 },
        mousePos:{value : new THREE.Vector3(0,0,0)},
        uCurlFreq: { value: 0.25 }
      }
    })
  }
}

extend({ SimulationMaterial })
