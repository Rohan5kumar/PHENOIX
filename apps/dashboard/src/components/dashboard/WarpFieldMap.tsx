'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Compass, Zap, RefreshCw } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ── 3D Spacetime Curvature Wireframe Grid ────────────────────────
function SpacetimeGrid({ curvatureMesh }: { curvatureMesh: number[][] }) {
  const geomRef1 = useRef<THREE.PlaneGeometry>(null);
  const geomRef2 = useRef<THREE.PlaneGeometry>(null);
  const { clock } = useThree();

  useFrame(() => {
    const time = clock.getElapsedTime();
    
    [geomRef1, geomRef2].forEach((ref) => {
      if (!ref.current) return;
      const posAttr = ref.current.attributes.position;
      
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          const idx = r * 15 + c;
          const val = curvatureMesh[r]?.[c] ?? 0;
          // Apply a gentle secondary wave fluctuation
          const wave = Math.sin(time * 2.2 + r * 0.45 + c * 0.45) * 0.04;
          // Set local vertex Z coordinate (height offset in world space)
          posAttr.setZ(idx, val * 3.5 + wave);
        }
      }
      posAttr.needsUpdate = true;
      ref.current.computeVertexNormals();
    });
  });

  return (
    <group rotation={[-Math.PI / 2.2, 0, 0]}>
      {/* Primary cyan wireframe grid */}
      <mesh>
        <planeGeometry ref={geomRef1} args={[8, 8, 14, 14]} />
        <meshBasicMaterial wireframe color="#06b6d4" transparent opacity={0.6} />
      </mesh>
      {/* Secondary purple depth wireframe grid */}
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry ref={geomRef2} args={[8, 8, 14, 14]} />
        <meshBasicMaterial wireframe color="#8b5cf6" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ── 3D Orbiting Quantum Particles (Gravitons) ────────────────────
function OrbitingParticles({ count, warpFactor }: { count: number; warpFactor: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.025,
        radius: 1.0 + Math.random() * 2.8,
        yOffset: (Math.random() - 0.5) * 0.3
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const time = state.clock.getElapsedTime();

    particles.forEach((p, i) => {
      // Orbital angular speed scales with Alcubierre warpFactor
      p.angle += p.speed * (warpFactor * 1.6);
      const x = Math.cos(p.angle) * p.radius;
      const z = Math.sin(p.angle) * p.radius;

      // Metric contraction pulls particles down towards gravity well at coordinates (0, 0)
      const dist = Math.sqrt(x * x + z * z);
      const yGravity = -1.1 * Math.exp(-0.75 * dist * dist);

      posAttr.setXYZ(i, x, yGravity + p.yOffset + Math.sin(time + i) * 0.05, z);
    });
    posAttr.needsUpdate = true;
  });

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#22d3ee" transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function WarpFieldMap() {
  // HUD Parameter slider states
  const [warpFactor, setWarpFactor] = useState(1.0);
  const [expansionRate, setExpansionRate] = useState(0.5);
  
  // Real-time backend gravity metrics
  const [powerDraw, setPowerDraw] = useState(180.45);
  const [frequency, setFrequency] = useState(14.285);
  const [tensorT00, setTensorT00] = useState(-1.25e40);
  const [exoticMass, setExoticMass] = useState(-1.25e25);
  const [frameDragging, setFrameDragging] = useState(1.0);
  
  // Real-time stabilization loop states
  const [stabilizing, setStabilizing] = useState(false);
  const [phaseAngle, setPhaseAngle] = useState(0.0);
  const [fieldStable, setFieldStable] = useState(true);
  const [fluctuationIndex, setFluctuationIndex] = useState(0.045);

  // Spacetime curvature mesh grid (15x15 default)
  const [curvatureMesh, setCurvatureMesh] = useState<number[][]>(() => {
    const mesh: number[][] = [];
    for (let r = 0; r < 15; r++) {
      const row: number[] = [];
      const dy = (r - 7) / 7.0;
      for (let c = 0; c < 15; c++) {
        const dx = (c - 7) / 7.0;
        const dist = Math.sqrt(dx * dx + dy * dy);
        row.push(-0.5 * Math.exp(-4 * dist * dist));
      }
      mesh.push(row);
    }
    return mesh;
  });

  // 1. Telemetry Fetching Loop from FastAPI Server
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`http://localhost:8000/antigravity/telemetry?warp_factor=${warpFactor}&expansion_rate=${expansionRate}`);
        if (res.ok) {
          const data = await res.json();
          setPowerDraw(data.power_draw_mw);
          setFrequency(data.oscillation_frequency_ghz);
          setTensorT00(data.stress_energy.tensor_T00);
          setExoticMass(data.stress_energy.required_exotic_mass_kg);
          setFrameDragging(data.stress_energy.frame_dragging_index);
          setCurvatureMesh(data.spacetime_curvature_mesh);
        }
      } catch (err) {
        // Backend offline — fall back to simulated parameters
      }
    };
    
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, [warpFactor, expansionRate]);

  // 2. Continuous Fluctuation Simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setFluctuationIndex(prev => {
        const delta = (Math.random() - 0.5) * 0.015;
        return Math.max(0.01, Math.min(0.25, prev + delta));
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // 3. Stabilization Trigger Route
  const executeStabilization = async () => {
    setStabilizing(true);
    try {
      const res = await fetch('http://localhost:8000/antigravity/stabilize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warp_factor: warpFactor,
          expansion_rate: expansionRate,
          coil_temperatures: [120.4, 122.1, 119.8, 121.5],
          fluctuation_index: fluctuationIndex
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPhaseAngle(data.phase_correction_angle);
        setFieldStable(data.stable);
        if (data.stable) {
          setFluctuationIndex(0.038); // Reset to stable bounds
        }
      }
    } catch (err) {
      // Backend offline
    } finally {
      setTimeout(() => {
        setStabilizing(false);
      }, 600);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs text-slate-300 space-y-4">
      {/* Title Header */}
      <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 flex justify-between items-center">
        <span className="flex items-center gap-1.5 uppercase tracking-wider">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          Quantum Space-Time Metric Warp HUD
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
          fieldStable ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400 border border-red-500/20'
        }`}>
          <Zap className="w-3 h-3 text-emerald-400" />
          {fieldStable ? 'Warp Bubble: Stable' : 'Coherence Warning'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Canvas Display Viewport (7 Cols) */}
        <div className="lg:col-span-7 bg-black/60 rounded-xl border border-slate-900 relative overflow-hidden flex items-center justify-center p-1 min-h-[240px]">
          <div className="w-full h-[240px] rounded-lg overflow-hidden relative">
            <Canvas camera={{ position: [0, -4.5, 4.5], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <SpacetimeGrid curvatureMesh={curvatureMesh} />
              <OrbitingParticles count={35} warpFactor={warpFactor} />
              <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={0.1} />
            </Canvas>
          </div>
          
          {/* Absolute float metrics overlay */}
          <div className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur border border-slate-850 p-2 rounded text-[9px] space-y-1 select-all z-10 pointer-events-none">
            <div className="text-slate-500">EXOTIC_MASS_KG:</div>
            <div className="text-cyan-400 font-bold">{exoticMass.toExponential(4)}</div>
            <div className="text-slate-500">FRAME_DRAGGING:</div>
            <div className="text-purple-400 font-bold">{frameDragging.toFixed(6)}</div>
          </div>

          {/* Instruction overlay */}
          <div className="absolute bottom-2 left-2 text-[8px] text-slate-500 bg-slate-950/60 p-1.5 rounded z-10 pointer-events-none font-mono">
            3D ORBIT: CLICK + DRAG | ZOOM: SCROLL
          </div>
        </div>

        {/* Stabilization Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* Curvature Telemetry Metrics */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">POWER_DRAW:</span>
              <span className="font-bold text-cyan-400">{powerDraw} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FREQUENCY:</span>
              <span className="font-bold text-purple-400">{frequency} GHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VACUUM_JITTER:</span>
              <span className={`font-bold ${fluctuationIndex > 0.1 ? 'text-orange-400 animate-pulse' : 'text-cyan-400'}`}>
                {(fluctuationIndex * 100).toFixed(3)}%
              </span>
            </div>
          </div>

          {/* Dials & Parameters */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>WARP_BUBBLE_VELOCITY:</span>
                <span className="text-cyan-400 font-bold">{warpFactor.toFixed(2)}c</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="2.0" 
                step="0.05"
                value={warpFactor} 
                onChange={(e) => setWarpFactor(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>COIL_EXPANSION_RATE:</span>
                <span className="text-purple-400 font-bold">{expansionRate.toFixed(2)} Hz</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1.5" 
                step="0.05"
                value={expansionRate} 
                onChange={(e) => setExpansionRate(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Stabilize Field Button */}
          <button
            onClick={executeStabilization}
            disabled={stabilizing}
            className="w-full py-2 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/30 rounded-lg font-bold tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${stabilizing ? 'animate-spin' : ''}`} />
            {stabilizing ? 'ADJUSTING FIELD COIL PHASES...' : 'STABILIZE FIELD COIL'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WarpFieldMap;
