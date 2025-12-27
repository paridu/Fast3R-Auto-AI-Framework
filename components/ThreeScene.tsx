
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeSceneProps {
  isLoading: boolean;
  isCompleted: boolean;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ isLoading, isCompleted }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Grid Helper
    const grid = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    scene.add(grid);

    let object: THREE.Object3D | null = null;

    if (isCompleted) {
      // Create a simulated point cloud or mesh
      const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x3b82f6, 
        wireframe: true,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.2
      });
      object = new THREE.Mesh(geometry, material);
      scene.add(object);
    } else if (isLoading) {
      // Loading animation object
      const geometry = new THREE.IcosahedronGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true });
      object = new THREE.Mesh(geometry, material);
      scene.add(object);
    } else {
      // Idle state
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
      object = new THREE.Mesh(geometry, material);
      scene.add(object);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      if (object) {
        object.rotation.y += 0.01;
        object.rotation.x += 0.005;
      }
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isLoading, isCompleted]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-black border border-gray-800 shadow-2xl">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-blue-400 border border-blue-900/50">
        FAST3R_VIEWER_V1.0.0
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-blue-400 font-medium animate-pulse">RECONSTRUCTING NEURAL FIELD...</p>
        </div>
      )}
      {!isLoading && !isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <p className="text-gray-500 font-light italic uppercase tracking-widest">Waiting for Input...</p>
        </div>
      )}
    </div>
  );
};

export default ThreeScene;
