/**
 * R79 original elemental VFX for the existing Three.js duel arena.
 * No third-party code, media, characters or textures.
 * Scene-only presentation: consumes resolved card events; never modifies rules.
 */
export const EFFECT_BY_CARD = Object.freeze({
  E05:'aurora', E06:'meteor', G05:'crystal', G06:'glyph',
  T05:'tidal', T06:'lightning',
});
const ELEMENT_BY_PREFIX = Object.freeze({E:'ember',G:'grove',T:'tide',M:'tide'});
const COLORS = Object.freeze({
  ember:[0xffa54e,0xff423d,0xffe8ad],
  grove:[0x79ffad,0x38cfc4,0xd8ffe4],
  tide:[0x89caff,0x547dff,0xe1f5ff],
});
const DURATIONS = Object.freeze({portal:1.90,lightning:1.32,meteor:1.60,
  crystal:1.65,aurora:1.30,glyph:1.52,tidal:1.58});
const clamp = v => Math.max(0,Math.min(1,v));
const smooth = v => {const t=clamp(v);return t*t*(3-2*t);};
const hash = (i,s) => {
  let x = (i * 1664525 + s * 1013904223 + 0x9e3779b9) >>> 0;
  x ^= x >>> 16;x=Math.imul(x,0x7feb352d)>>>0;x ^= x>>>15;
  return (x>>>0)/4294967295;
};
export function presetForCard(item) {
  if (!item || !/^[EGTM]\d\d$/.test(item.id || '') ||
    !['player','ai'].includes(item.side)) return null;
  const element=ELEMENT_BY_PREFIX[item.id[0]];
  const kind=item.kind==='unit'?'portal':EFFECT_BY_CARD[item.id]||'glyph';
  return {kind,element,side:item.side,cardId:item.id};
}
export function createElementalVfx(THREE,scene,{reducedMotion=false}={}) {
  const root=new THREE.Group();root.name='R79_Original_Elemental_Cast_Events';
  scene.add(root);
  const active=[];
  let played=0,expired=0;
  const blend=THREE.AdditiveBlending;
  const makeMat=(color,opacity=1)=>new THREE.MeshBasicMaterial({
    color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:blend,
    toneMapped:false
  });
  const torusGeo=new THREE.TorusGeometry(1,.023,8,96);
  const shardGeo=new THREE.ConeGeometry(.15,.92,5,1);
  const orbGeo=new THREE.IcosahedronGeometry(.19,2);
  const diskGeo=new THREE.RingGeometry(.55,1,64);
  const sparkVertex = `
    attribute float aPhase;
    uniform float uTime;
    uniform float uSize;
    varying float vAlpha;
    void main() {
      vec3 p=position;
      p.y+=sin(uTime*2.4+aPhase*6.28318)*0.24;
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(uSize*(110.0/max(1.0,-mv.z)),1.0,42.0);
      vAlpha=0.66+0.34*sin(aPhase*6.28318+uTime*2.2);
    }`;
  const sparkFragment = `
    uniform vec3 uColor;
    uniform float uAlpha;
    varying float vAlpha;
    void main() {
      vec2 p=gl_PointCoord-0.5;
      float r=length(p);
      float glow=pow(max(0.0,1.0-r*2.0),2.4);
      gl_FragColor=vec4(uColor,glow*vAlpha*uAlpha);
    }`;
  const vortexGeo=new THREE.PlaneGeometry(2.08,2.32);
  const runeGeo=new THREE.BoxGeometry(.085,.02,.024);
  const vortexVertex=`
    varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
  `;
  const vortexFragment=`
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    void main(){
      vec2 p=(vUv-0.5)*vec2(1.0,1.15);
      float r=length(p);
      float theta=atan(p.y,p.x);
      float spin=sin(theta*6.0-r*22.0-uTime*5.0);
      float layers=sin(theta*13.0+r*35.0+uTime*3.3);
      float lens=1.0-smoothstep(0.36,0.52,r);
      float glow=pow(max(0.0,1.0-r*1.88),2.2);
      float filaments=smoothstep(0.42,0.95,spin)*0.27+
                      smoothstep(0.62,0.98,layers)*0.13;
      float alpha=(glow*0.29+lens*filaments)*uOpacity;
      vec3 color=mix(uColor,vec3(1.0),0.25+0.32*max(0.0,spin));
      gl_FragColor=vec4(color,alpha);
    }
  `;
  function sparkCloud(col,seed) {
    const count=128,pos=new Float32Array(count*3),phase=new Float32Array(count);
    for(let i=0;i<count;i++){
      const a=hash(i,seed)*Math.PI*2,r=Math.sqrt(hash(i+200,seed))*1.15;
      pos[3*i]=r*Math.cos(a);pos[3*i+1]=hash(i+400,seed)*2.15;
      pos[3*i+2]=r*Math.sin(a);phase[i]=hash(i+600,seed);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('aPhase',new THREE.BufferAttribute(phase,1));
    const mat=new THREE.ShaderMaterial({
      vertexShader:sparkVertex,fragmentShader:sparkFragment,
      uniforms:{uTime:{value:0},uAlpha:{value:1},uSize:{value:7.8},
        uColor:{value:new THREE.Color(col)}},
      transparent:true,depthWrite:false,blending:blend,
    });
    return new THREE.Points(geo,mat);
  }
  function ring(parent,col,r,vertical=false) {
    const m=new THREE.Mesh(torusGeo,makeMat(col,.9));
    m.scale.setScalar(r);
    if(!vertical)m.rotation.x=Math.PI/2;
    parent.add(m);return m;
  }
  function bolt(parent,col,seed){
    const count=9,positions=new Float32Array(count*3);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const line=new THREE.Line(geo,new THREE.LineBasicMaterial({
      color:col,transparent:true,opacity:1,depthWrite:false,blending:blend
    }));
    parent.add(line);
    const update=(t)=>{
      for(let i=0;i<count;i++){
        const u=i/(count-1),jitter=(hash(i+Math.floor(t*21)*11,seed)-.5)*.28;
        positions[3*i]=u*1.7-0.85;
        positions[3*i+1]=1.8-u*1.03+(i===0||i===count-1?0:jitter);
        positions[3*i+2]=.15+Math.sin(u*11+t*4)*.17;
      }
      geo.attributes.position.needsUpdate=true;
    };
    return {line,update};
  }
  const cameraCenters={player:-1.75,ai:1.75};
  function playCard(item,now=0){
    const preset=presetForCard(item);if(!preset)return false;
    const {kind,element,side,cardId}=preset;
    const palette=COLORS[element];
    const group=new THREE.Group();group.name='R79_'+kind+'_'+cardId;
    group.position.set(cameraCenters[side],0,0);
    root.add(group);
    const disk=new THREE.Mesh(diskGeo,makeMat(palette[0],.32));
    disk.rotation.x=-Math.PI/2;disk.position.y=.11;group.add(disk);
    const floor=ring(group,palette[0],.83);floor.position.y=.12;
    const floor2=ring(group,palette[2],1.05);floor2.position.y=.125;
    const arch=ring(group,palette[0],.77,true);arch.position.y=1.12;
    arch.rotation.y=.3;
    const core=new THREE.Mesh(orbGeo,makeMat(palette[2],.85));
    core.position.y=1.18;group.add(core);
    const burst=sparkCloud(palette[1],cardId.charCodeAt(0)*97+Number(cardId.slice(1)));
    burst.position.y=.13;group.add(burst);
    const vortex=new THREE.Mesh(vortexGeo,new THREE.ShaderMaterial({
      vertexShader:vortexVertex,fragmentShader:vortexFragment,
      uniforms:{uTime:{value:now},uOpacity:{value:0},
        uColor:{value:new THREE.Color(palette[0])}},
      transparent:true,depthWrite:false,blending:blend,side:THREE.DoubleSide
    }));
    vortex.position.set(0,1.12,-.40);
    vortex.visible=kind==='portal';
    group.add(vortex);
    arch.position.z=-.38;
    const insignia=[];
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const rune=new THREE.Mesh(runeGeo,
        makeMat(i%2?palette[0]:palette[2],.9));
      rune.position.set(Math.cos(a)*.9,1.12+Math.sin(a)*.9,-.34);
      rune.rotation.z=a;
      rune.visible=kind==='portal';
      group.add(rune);insignia.push(rune);
    }
    const shards=[];
    for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7;
      const mesh=new THREE.Mesh(shardGeo,makeMat(palette[i%3],.8));
      mesh.position.set(Math.cos(a)*.75,.42,Math.sin(a)*.75);
      mesh.rotation.y=a;group.add(mesh);shards.push(mesh);
    }
    const bolts=[];
    for(let i=0;i<3;i++){
      const b=bolt(group,palette[i%3],17+11*i+cardId.charCodeAt(0));
      bolts.push(b);
    }
    const light=new THREE.PointLight(palette[0],0,3.6,2);
    light.position.y=1.33;group.add(light);
    active.push({kind,element,group,created:now,duration:reducedMotion?.72:DURATIONS[kind],
      disk,floor,floor2,arch,core,burst,vortex,insignia,shards,bolts,light});
    played++;
    while(active.length>7){destroy(active.shift());expired++;}
    return true;
  }
  function destroy(a){
    root.remove(a.group);
    a.group.traverse(o=>{
      // Shared geometry (torus, shard, ring, orb) is disposed once in dispose().
      if(o.material){
        if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());
        else o.material.dispose();
      }
      if(o.isPoints||o.isLine)o.geometry.dispose();
    });
  }
  function update(now){
    for(let i=active.length-1;i>=0;i--){
      const a=active[i],age=Math.max(0,now-a.created);
      if(age>=a.duration){destroy(a);active.splice(i,1);expired++;continue;}
      const t=clamp(age/a.duration),inEase=smooth(age/.24),
        fade=1-smooth((t-.70)/.30),strength=inEase*fade;
      const portal=a.kind==='portal';
      const castScale=.12+inEase*.88;
      a.floor.scale.setScalar(.64+.7*inEase+.28*t);
      a.floor2.scale.setScalar(.65+.6*inEase+.37*t);
      a.floor.material.opacity=.68*strength;
      a.floor2.material.opacity=.45*strength;
      a.disk.material.opacity=.27*strength;
      a.disk.scale.setScalar(.65+1.03*inEase);
      a.arch.visible=portal||a.kind==='glyph'||a.kind==='aurora';
      a.arch.scale.setScalar((portal?1:.57)*castScale);
      a.arch.rotation.z=now*(portal?.58:1.1);
      a.arch.material.opacity=.87*strength;
      a.vortex.material.uniforms.uTime.value=now;
      a.vortex.material.uniforms.uOpacity.value=portal?strength:0;
      a.vortex.visible=portal;
      a.vortex.scale.setScalar(.4+.6*castScale);
      a.insignia.forEach((r,k)=>{
        r.visible=portal;r.material.opacity=.7*strength;
        const rad=1+.10*Math.sin(now*1.75+k*.6);
        r.position.x=Math.cos(k*Math.PI/6+now*.27)*.9*rad;
        r.position.y=1.12+Math.sin(k*Math.PI/6+now*.27)*.9*rad;
      });

      a.core.visible=!portal;
      a.core.scale.setScalar((a.kind==='meteor'?1.8:1)*(.5+1.3*strength));
      a.core.material.opacity=.68*strength;
      a.core.position.y=a.kind==='meteor'?3.0-2.15*smooth(t/.62):1.20+Math.sin(t*13)*.20;
      a.burst.material.uniforms.uTime.value=now;
      a.burst.material.uniforms.uAlpha.value=.9*strength;
      a.burst.rotation.y=now*.35;
      for(let k=0;k<a.shards.length;k++){
        const shard=a.shards[k];
        const isShard=a.kind==='crystal'||a.kind==='meteor'||a.kind==='tidal';
        shard.visible=isShard;
        if(isShard){
          const rise=smooth((t-.13)/.45);
          shard.position.y=.42+rise*(a.kind==='crystal'?.92:.46);
          shard.scale.setScalar((.2+.9*rise)*fade);
          shard.material.opacity=.8*strength;
        }
      }
      a.bolts.forEach((b,j)=>{
        b.line.visible=a.kind==='lightning'||a.kind==='aurora';
        if(b.line.visible){
          b.update(now+j*.2);
          b.line.rotation.y=j*2*Math.PI/3;
          b.line.material.opacity=(.45+.45*Math.sin(now*20+j)) *strength;
        }
      });
      a.light.intensity=4.5*strength;
    }
  }
  function dispose(){
    while(active.length)destroy(active.pop());
    [torusGeo,shardGeo,orbGeo,diskGeo,vortexGeo,runeGeo].forEach(g=>g.dispose());
    scene.remove(root);
  }
  return {root,playCard,update,dispose,
    get stats(){return {layer:'R79_ORIGINAL_ELEMENTAL_VFX',played,expired,
      active:active.length,activeTypes:active.map(x=>x.kind),usesGameRuleMutation:false};}
  };
}
