import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function createEarthMaterial() {
  const mat = new THREE.MeshPhongMaterial({
    color: '#1f5ea8',
    emissive: '#061425',
    shininess: 18,
    specular: new THREE.Color('#6fc9ff'),
  })
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>\nvarying vec3 vPos;\nvarying vec3 vNrm;`,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\nvPos = normalize(position);\nvNrm = normalize(normalMatrix * normal);`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>\nvarying vec3 vPos;\nvarying vec3 vNrm;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i=floor(p); vec2 f=fract(p);
        float a=hash(i); float b=hash(i+vec2(1.,0.)); float c=hash(i+vec2(0.,1.)); float d=hash(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
      }
      float fbm(vec2 p){ float v=0.; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5;} return v; }`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `
      vec2 uv = vec2(atan(vPos.z, vPos.x) / 6.2831853 + 0.5, asin(clamp(vPos.y,-1.,1.)) / 3.14159265 + 0.5);
      float continents = fbm(uv * vec2(7.0, 3.5) + vec2(0.3, 1.2));
      float detail = fbm(uv * vec2(18.0, 9.0));
      float landMask = smoothstep(0.46, 0.58, continents + detail * 0.12);
      float ice = smoothstep(0.78, 0.92, abs(vPos.y)) * smoothstep(0.42, 0.55, continents);
      vec3 oceanDeep = vec3(0.03, 0.18, 0.42);
      vec3 oceanShallow = vec3(0.06, 0.42, 0.72);
      vec3 land = mix(vec3(0.16, 0.42, 0.22), vec3(0.42, 0.52, 0.24), detail);
      vec3 desert = mix(land, vec3(0.58, 0.50, 0.30), smoothstep(0.0, 0.28, abs(vPos.y)) * smoothstep(0.52, 0.66, continents));
      vec3 ocean = mix(oceanDeep, oceanShallow, fbm(uv * 10.0) * 0.6 + 0.2);
      vec3 surface = mix(ocean, desert, landMask);
      surface = mix(surface, vec3(0.92, 0.97, 1.0), ice);
      float lights = smoothstep(0.72, 0.98, fbm(uv * 28.0 + 4.0)) * landMask * (1.0 - ice) * smoothstep(0.65, 0.15, abs(vPos.y));
      vec4 diffuseColor = vec4(surface, opacity);
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      totalEmissiveRadiance += vec3(1.0, 0.78, 0.42) * lights * 0.55;`,
    )
  }
  return mat
}

export function EarthGlobe({
  radius = 1.65,
  rotate = true,
  showAtmosphere = true,
}: {
  radius?: number
  rotate?: boolean
  showAtmosphere?: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const clouds = useRef<THREE.Mesh>(null)
  const material = useMemo(() => createEarthMaterial(), [])

  useFrame((_, delta) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (rotate && group.current) group.current.rotation.y += delta * 0.045
    if (clouds.current) clouds.current.rotation.y += delta * 0.012
  })

  return (
    <group>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <primitive object={material} attach="material" />
        </mesh>
        <mesh ref={clouds} scale={1.012}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.14}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      </group>
      {showAtmosphere && (
        <mesh scale={1.085}>
          <sphereGeometry args={[radius, 48, 48]} />
          <shaderMaterial
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{}}
            vertexShader={`
              varying vec3 vNormal;
              varying vec3 vWorld;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorld = wp.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec3 vNormal;
              varying vec3 vWorld;
              void main() {
                vec3 viewDir = normalize(cameraPosition - vWorld);
                float rim = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 4.2);
                vec3 col = mix(vec3(0.0, 0.55, 1.0), vec3(0.0, 0.85, 1.0), rim);
                gl_FragColor = vec4(col, rim * 0.55);
              }
            `}
          />
        </mesh>
      )}
    </group>
  )
}
