
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stage, Float, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// Modelos abstractos según categoría
function Model({ category, color }) {
  const meshRef = useRef()

  // Animación suave extra si se desea
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
  })

  // Selección de geometría basada en categoría
  const getGeometry = () => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('motor') || cat.includes('pistón') || cat.includes('anillo')) {
      return <cylinderGeometry args={[1, 1, 2, 32]} /> // Cilindro (Pistón)
    }
    if (cat.includes('llanta') || cat.includes('rueda')) {
      return <torusGeometry args={[1, 0.4, 16, 50]} /> // Dona (Llanta)
    }
    if (cat.includes('freno') || cat.includes('disco')) {
      return <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} /> // Disco plano
    }
    if (cat.includes('aceite') || cat.includes('líquido')) {
       // Forma de botella simple (Cilindro con cuello)
       return <capsuleGeometry args={[0.8, 1.5, 4, 16]} />
    }
    // Default: Caja (Repuesto genérico)
    return <boxGeometry args={[1.5, 1.5, 1.5]} />
  }

  // Material "Premium"
  const material = new THREE.MeshPhysicalMaterial({
    color: color || '#f97316', // Naranja corporativo por defecto
    metalness: 0.6,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} castShadow receiveShadow material={material}>
        {getGeometry()}
      </mesh>
    </Float>
  )
}

export default function Product3DViewer({ 
  category = 'General', 
  color = '#f97316',
  className = ''
}) {
  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '300px', width: '100%' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* Iluminación Standard (Más segura que Stage) */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <group position={[0, -1, 0]}>
           <Model category={category} color={color} />
        </group>
        
        {/* Controles Orbitales (Girar, Zoom) */}
        <OrbitControls 
          autoRotate 
          autoRotateSpeed={1.5} 
          enableZoom={true} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* Sombra de contacto suave en el suelo */}
        <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} />
      </Canvas>
    </div>
  )
}
