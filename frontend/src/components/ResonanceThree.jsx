import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Three.js: cordas virtuais vibrando em profundidade ao redor da escultura da home. */
export default function ResonanceThree() {
  const host = useRef(null);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch { return; } // WebGL indisponível: a escultura SVG permanece visível.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35,1,.1,100);
    camera.position.set(0,0,8.6);
    const group = new THREE.Group(); scene.add(group);
    const gold = new THREE.MeshBasicMaterial({color:0xe9aa8b,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false});
    const lilac = new THREE.MeshBasicMaterial({color:0xc68fd0,transparent:true,opacity:.30,depthWrite:false});
    const rings = [];
    [2.25,2.65,3.05].forEach((radius,i) => {
      const geometry = new THREE.TorusGeometry(radius,.008+i*.003,6,128);
      const mesh = new THREE.Mesh(geometry,i%2?lilac:gold);
      mesh.rotation.set(.5+i*.32,.7+i*.4,.1+i*.6);
      group.add(mesh); rings.push(mesh);
    });
    const cords = [];
    for (let i=0;i<5;i++) {
      const positions = new Float32Array(80*3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      const line = new THREE.Line(geometry,new THREE.LineBasicMaterial({color:i%2?0xf0b3aa:0xd8afd4,transparent:true,opacity:.46,depthWrite:false}));
      line.frustumCulled = false; group.add(line); cords.push({line,positions,geometry,index:i});
    }
    const size=()=>{ const w=container.clientWidth||400,h=container.clientHeight||440;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false); };
    const observer=new ResizeObserver(size);observer.observe(container);size();
    let raf=0;let last=0; const clock=new THREE.Clock();
    const render=(time)=> {
      // Pausar enquanto invisível, para economizar CPU/GPU.
      if (time-last > 1000/35) {
        last=time;
        const pause = reduced.matches || document.documentElement.classList.contains('sonorum-less-motion');
        const t=pause?0:clock.getElapsedTime();
        rings.forEach((ring,i)=>{ring.rotation.z=t*(i%2?.045:-.055)+i*.5;});
        cords.forEach(({geometry,positions,index})=>{
          for(let j=0;j<80;j++) {
            const u=j/79;
            positions[j*3]=(u-.5)*5.0;
            positions[j*3+1]=(index-2)*.19+Math.sin(u*19+t*3.8+index)*Math.sin(Math.PI*u)*(.055+index*.012);
            positions[j*3+2]=Math.sin(u*Math.PI+index*.7)*.35;
          }
          geometry.attributes.position.needsUpdate=true;
        });
        renderer.render(scene,camera);
      }
      raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    return ()=>{ cancelAnimationFrame(raf);observer.disconnect();cords.forEach(o=>{o.geometry.dispose();o.line.material.dispose();});rings.forEach(r=>r.geometry.dispose());gold.dispose();lilac.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="sonorum-three-layer" ref={host} aria-hidden="true"/>;
}
