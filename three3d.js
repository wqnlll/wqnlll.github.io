/* =====================================================================
   three3d.js —— 方案 A：仅 3D 渲染层（SIM 不动，只读 getState()，绝不写回）
   - 由 index.html 在 ?3d=1 时动态 import('./three3d.js')，再调 init3d()
   - 暴露 window.draw3d（每帧）/ window.resize3d
   - ESM：通过裸标识符直接读全局 SIM/cam/groundColor（经典脚本的顶层 const/function）
   - 范围：地形 InstancedMesh + 坦克低模 + 建筑低模 + 矿石晶体 + 正交(可倾斜)相机
     其余（子弹/特效/选中圈/血条/充能条）仍由 2D canvas 覆盖层绘制
   ===================================================================== */
import * as THREE from './three.module.js';

let renderer=null, scene=null, cam3d=null;
let terrain=null, TANK_PARTS=null, BLD_PARTS=null;
const MAXTANK=256;           // M23 坦克实例槽位上限（覆盖整局所有坦克）
let TANK_IMESH=null;         // M23 部件级 InstancedMesh {track,body,turret,barrel}
let TANK_DEF=null;           // M23 部件变换表（含预计算局部矩阵）
const _imDummy=new THREE.Object3D();   // 父变换合成临时对象
const _partDummy=new THREE.Object3D(); // 部件局部矩阵合成临时对象
let bldPool=new Map();       // e.id -> THREE.Group（建筑，按实体复用）
let flyPool=new Map();       // e.id -> THREE.Group（飞行单位，按实体复用）
let oreMesh=null, lastOreSig='';  // 矿石 InstancedMesh（一次 drawcall）
const TANK_TYPES={};         // init3d 里填坦克类 SIM.T_*
const BLD_TYPES={};          // init3d 里填建筑类 SIM.T_*
const FLY_TYPES={};          // init3d 里填飞行类 SIM.T_*
const KIROV_H=40, HARRIER_H=30;   // 飞行高度（与 2D drawKirov/drawHarrier 一致）
const COL=new THREE.Color();
const _o=new THREE.Object3D();   // 矿石实例矩阵合成临时对象
const SHADOW_GEO=new THREE.CircleGeometry(1, 20);   // 飞行单位贴地阴影
const FAC_MAT=[];            // [side] = {wall,roof,lit,conc} 阵营共享材质
const M={};                  // 非阵营共享材质（dark/gray/gold/brown）

export function init3d(){
  // 坦克类（轻坦/重坦/光棱/磁暴/幻影/天启）
  TANK_TYPES[SIM.T_LTANK]=1; TANK_TYPES[SIM.T_HTANK]=1; TANK_TYPES[SIM.T_PRISM]=1;
  TANK_TYPES[SIM.T_TESLA]=1; TANK_TYPES[SIM.T_MIRAGE]=1; TANK_TYPES[SIM.T_APOC]=1;
  // 建筑类（电厂/矿场/基地/超时空传送仪/铁幕装置）——其余单位留给 2D
  BLD_TYPES[SIM.T_POWER]=1; BLD_TYPES[SIM.T_REFIN]=1; BLD_TYPES[SIM.T_BASE]=1;
  BLD_TYPES[SIM.T_CHRONO]=1; BLD_TYPES[SIM.T_CURTAIN]=1;
  // 飞行类（基洛夫空艇/入侵者战机）
  FLY_TYPES[SIM.T_KIROV]=1; FLY_TYPES[SIM.T_HARRIER]=1;

  renderer=new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(cv.width, cv.height);
  renderer.domElement.style.cssText='position:fixed;top:0;left:0;z-index:0;';
  document.body.insertBefore(renderer.domElement, document.body.firstChild);

  scene=new THREE.Scene();

  // 正交相机（标准 up，top>bottom，无反转 frustum）。
  // 2D 画布是 y 向下（左手系），故把世界 y 取负放进 Three（几何 (wx,-wy)、相机 (cx,-cy)），
  // 使 screen 右=世界+X、screen 下=世界+Y，与 w2sx/w2sy 完全一致。
  // 倾斜：up=(0,cosP,sinP)，相机沿 -f 后撤 L 使整图落在 near/far 内。
  cam3d=new THREE.OrthographicCamera(-1,1,1,-1, 1, 4000);
  cam3d.up.set(0, cam.cosP, cam.sinP);
  cam3d.position.set(cam.cx, -cam.cy - 1500*cam.sinP, 1500*cam.cosP);
  cam3d.lookAt(cam.cx, -cam.cy, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const dir=new THREE.DirectionalLight(0xffffff, 0.7);
  // M23 阴影：光要放远（near=100 才不裁掉场景）——方向 (0.6,-0.6,1) 不变，距离拉到 ~1330
  dir.position.set(600,-600,1000);
  dir.castShadow=true;
  dir.shadow.mapSize.set(2048,2048);
  const sc=dir.shadow.camera;
  sc.left=-2300; sc.right=2300; sc.top=2300; sc.bottom=-2300;   // 覆盖 64×64 地图（斜投影下边缘可超 ±1500）
  sc.near=100; sc.far=4000;
  dir.shadow.bias=-0.0005;                 // 防 z-fighting
  scene.add(dir);

  renderer.shadowMap.enabled=true;         // M23 阴影映射
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  buildTerrain();
  buildTankParts();
  buildBldParts();

  window.draw3d=draw3d;
  window.resize3d=resize3d;
  window.__r3d={renderer,scene,cam3d,terrain};   // 调试句柄
}

function resize3d(){ if(renderer) renderer.setSize(cv.width, cv.height); }

/* ---- 地形：单个 Mesh + 顶点色逐格（M23：原 InstancedMesh.receiveShadow 在 three r160 失效→改 Mesh 才能收影）---- */
function buildTerrain(){
  const T=SIM.TILE, MW=SIM.MW, MH=SIM.MH;
  // toNonIndexed 把每 quad 拆成 6 独立顶点，可逐格填同色（保留逐格色块），且 Mesh 能正常接收阴影
  const geo=new THREE.PlaneGeometry(MW*T, MH*T, MW, MH).toNonIndexed();
  const pos=geo.attributes.position;
  const colors=new Float32Array(pos.count*3);
  const c=new THREE.Color();
  for(let i=0;i<pos.count;i+=6){
    const wx=pos.getX(i)+MW*T/2, wy=pos.getY(i)-MH*T/2;      // 世界坐标（y 取负对齐 2D y 向下）
    const gx=Math.max(0,Math.min(MW-1,Math.floor(wx/T)));
    const gy=Math.max(0,Math.min(MH-1,Math.floor(-wy/T)));
    c.set(groundColor(gx,gy));
    for(let v=0;v<6;v++){ colors[(i+v)*3]=c.r; colors[(i+v)*3+1]=c.g; colors[(i+v)*3+2]=c.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  terrain=new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors:true}));
  terrain.receiveShadow=true;                  // M23 地形收影
  terrain.position.set(MW*T/2, -MH*T/2, 0);    // 中心平移到原 tile 铺满范围
  scene.add(terrain);
}

/* ---- 坦克：部件级 InstancedMesh（M23：drawcall 5×N → 5）+ 部件变换表 ---- */
function buildTankParts(){
  TANK_PARTS={
    track: new THREE.BoxGeometry(1,1,1),
    body:  new THREE.BoxGeometry(1,1,1),
    turret:new THREE.CylinderGeometry(1,1,1,18),
    barrel:new THREE.BoxGeometry(1,1,1),
  };
  TANK_IMESH={
    track: new THREE.InstancedMesh(TANK_PARTS.track, new THREE.MeshLambertMaterial({color:0xffffff}), MAXTANK),
    body:  new THREE.InstancedMesh(TANK_PARTS.body,  new THREE.MeshLambertMaterial({color:0xffffff}), MAXTANK),
    turret:new THREE.InstancedMesh(TANK_PARTS.turret,new THREE.MeshLambertMaterial({color:0xffffff}), MAXTANK),
    barrel:new THREE.InstancedMesh(TANK_PARTS.barrel,new THREE.MeshLambertMaterial({color:0xffffff}), MAXTANK),
  };
  for(const key in TANK_IMESH){
    TANK_IMESH[key].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    TANK_IMESH[key].castShadow=true;                 // M23 阴影
    scene.add(TANK_IMESH[key]);
  }
  // 部件变换表（与 M14 makeTank 逐字段一致，视觉零变化；局部矩阵预计算、颜色预缓存）
  const mk=(i,geo,s,p,rx,color)=>{
    _partDummy.position.set(p[0],p[1],p[2]);
    _partDummy.scale.set(s[0],s[1],s[2]);
    _partDummy.rotation.set(rx||0,0,0);
    _partDummy.updateMatrix();
    return {i,geo,color,mLocal:_partDummy.matrix.clone(),color3:color<0?null:new THREE.Color(color)};
  };
  TANK_DEF=[
    mk('track','track',[2.24,0.46,0.35],[0,-0.51,0.17],0,0x232323),
    mk('track','track',[2.24,0.46,0.35],[0, 0.51,0.17],0,0x232323),
    mk('body','body',[1.48,1.04,0.5],[0,0,0.25],0,-1),              // -1=阵营色（运行时 set）
    mk('turret','turret',[0.42,0.35,0.42],[-0.06,0,0.5],Math.PI/2,0xb9bdc1),
    mk('barrel','barrel',[1.14,0.24,0.24],[0.71,0,0.5],0,0x2b2b2b),
  ];
}

/* ---- 建筑部件几何 + 共享材质 ---- */
function buildBldParts(){
  const mk=(hex)=>new THREE.MeshLambertMaterial({color:hex});
  FAC_MAT[0]={wall:mk(0x28527e), roof:mk(0x3570ad), lit:mk(0x6fbaff), conc:mk(0xa3b6cc)};
  FAC_MAT[1]={wall:mk(0x8e3227), roof:mk(0xc24538), lit:mk(0xff8570), conc:mk(0xb3a699)};
  M.dark=mk(0x2a2f33); M.gray=mk(0x9aa2a8); M.gold=mk(0xe8b830); M.goldL=mk(0xf7dc7a); M.brown=mk(0x7a6a55);
  M.flyBlue=mk(0x9fb2c0); M.flyRed=mk(0xc09f9f); M.cockpit=mk(0x4a9fd8);
  M.shadow=new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.25, depthWrite:false});
  BLD_PARTS={
    box:   new THREE.BoxGeometry(1,1,1),
    sphere:new THREE.SphereGeometry(0.5, 16, 12),
    cone:  new THREE.ConeGeometry(0.5, 1, 4),       // 4 段=金字塔
    cyl:   new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
    octa:  new THREE.OctahedronGeometry(0.5),
    torus: new THREE.TorusGeometry(0.5, 0.07, 8, 28),
  };
}

/* 造一个建筑 Group（几何/材质全共享，阵营色靠 FAC_MAT[side] 选） */
function makeBuilding(t, side){
  const g=new THREE.Group();
  const B=BLD_PARTS, f=FAC_MAT[side];
  const add=(geo,mat,sx,sy,sz,x,y,z)=>{ const m=new THREE.Mesh(geo,mat); m.scale.set(sx,sy,sz); m.position.set(x,y,z); m.castShadow=true; g.add(m); return m; };   // M23 建筑投影

  if(t===SIM.T_CHRONO){
    // 超时空传送仪：圆形平台 + 光环 + 中央发光
    add(B.cyl,f.wall,1.06,1.06,0.22,0,0,0.11);
    add(B.cyl,f.roof,0.82,0.82,0.18,0,0,0.28);
    g.userData.glow=add(B.torus,f.lit,0.82,0.82,0.82,0,0,0.32);
    add(B.cyl,M.gray,0.42,0.42,0.16,0,0,0.44);
  }else if(t===SIM.T_CURTAIN){
    // 铁幕装置：方形基座 + 中央尖顶塔
    add(B.box,f.wall,1.06,1.06,0.34,0,0,0.17);
    add(B.box,f.roof,0.86,0.86,0.42,0,0,0.44);
    g.userData.spire=add(B.cone,M.gray,0.5,0.5,0.8,0,0,0.86);
    g.userData.spire.rotation.x=Math.PI/2;         // 锥尖朝 +Z(上)
  }else if(t===SIM.T_BASE){
    // 建造场：混凝土基座 + 组装楼 + 旋转吊臂
    add(B.box,f.conc,1.30,1.30,0.18,0,0,0.09);
    add(B.box,f.wall,0.56,0.80,0.50,0,0,0.43);
    add(B.box,f.roof,0.44,0.68,0.44,0,0,0.62);
    add(B.box,f.lit,0.08,0.68,0.44,-0.18,0,0.62);
    const crane=new THREE.Group(); crane.position.set(0.30,0.05,0.66); g.add(crane);
    const arm=new THREE.Mesh(B.box,M.dark); arm.scale.set(0.95,0.09,0.09); arm.position.set(0.40,0,0.06); crane.add(arm);
    const cable=new THREE.Mesh(B.box,M.gray); cable.scale.set(0.05,0.05,0.34); cable.position.set(0.82,0,-0.16); crane.add(cable);
    g.userData.crane=crane;
  }else if(t===SIM.T_POWER){
    // 电厂：房体 + 反应堆穹顶 + 冷却塔 + 烟囱
    add(B.box,f.wall,1.0,1.0,0.5,0,0,0.25);
    add(B.box,f.roof,0.7,0.7,0.28,0,0,0.62);
    add(B.sphere,M.gray,0.30,0.30,0.30,0,0,0.70);
    const cool=add(B.cyl,M.gray,0.17,0.17,0.52,-0.32,0.30,0.55); cool.rotation.x=Math.PI/2;
    add(B.box,M.brown,0.20,0.20,0.52,0.32,-0.40,0.55);
  }else if(t===SIM.T_REFIN){
    // 矿场：房体 + 中央金色矿堆
    add(B.box,f.wall,1.0,1.0,0.5,0,0,0.25);
    add(B.box,f.roof,0.7,0.7,0.28,0,0,0.62);
    add(B.octa,M.gold,0.55,0.55,0.42,0,0,0.62);
  }else{
    // 通用房：墙 + 屋顶
    add(B.box,f.wall,1.0,1.0,0.5,0,0,0.25);
    add(B.box,f.roof,0.72,0.72,0.30,0,0,0.62);
  }
  g.userData.t=t;
  return g;
}

/* 造一个基洛夫空艇 Group（艇体沿 +X，朝向由 group.rotation 控制） */
function makeKirov(side){
  const g=new THREE.Group(), B=BLD_PARTS;
  const hullMat=side===0?M.flyBlue:M.flyRed;
  const hull=new THREE.Mesh(B.sphere,hullMat); hull.scale.set(1.15,0.52,0.5); g.add(hull);              // 艇体（纵向椭圆）
  const fin=new THREE.Mesh(B.box,M.dark); fin.scale.set(0.28,0.68,0.5); fin.position.set(-1.08,0,0); g.add(fin);    // 尾翼
  const finV=new THREE.Mesh(B.box,M.dark); finV.scale.set(0.30,0.24,0.5); finV.position.set(-1.12,0,0.12); g.add(finV);
  const hub=new THREE.Mesh(B.cyl,M.gray); hub.scale.set(0.14,0.14,0.16); hub.rotation.x=Math.PI/2; hub.position.set(0,0,0.5); g.add(hub);  // 顶部螺旋桨
  for(let k=0;k<3;k++){ const a=k*Math.PI*2/3;
    const bl=new THREE.Mesh(B.box,M.dark); bl.scale.set(0.44,0.07,0.04); bl.position.set(Math.cos(a)*0.25,Math.sin(a)*0.25,0.5); bl.rotation.z=a; g.add(bl);
  }
  const shadow=new THREE.Mesh(SHADOW_GEO,M.shadow); shadow.scale.set(1.15,0.62,1); g.add(shadow);        // 贴地阴影（sync 里设 z）
  g.userData.shadow=shadow;
  return g;
}
/* 造一个入侵者战机 Group（机身沿 +X） */
function makeHarrier(side){
  const g=new THREE.Group(), B=BLD_PARTS;
  const bodyMat=side===0?M.flyBlue:M.flyRed;
  const fus=new THREE.Mesh(B.box,bodyMat); fus.scale.set(1.85,0.34,0.34); g.add(fus);                    // 机身
  const wing=new THREE.Mesh(B.box,bodyMat); wing.scale.set(0.7,2.0,0.06); wing.position.set(-0.2,0,0.12); g.add(wing);   // 后掠主翼
  const tail=new THREE.Mesh(B.box,M.gray); tail.scale.set(0.3,0.56,0.08); tail.position.set(-0.95,0,0.16); g.add(tail);    // 尾翼
  const ck=new THREE.Mesh(B.sphere,M.cockpit); ck.scale.set(0.2,0.24,0.18); ck.position.set(0.2,0,0.2); g.add(ck);        // 座舱
  const shadow=new THREE.Mesh(SHADOW_GEO,M.shadow); shadow.scale.set(1.0,0.55,1); g.add(shadow);
  g.userData.shadow=shadow;
  return g;
}

/* M23：坦克改为部件级 InstancedMesh（见 buildTankParts），makeTank 已废弃 */

/* ---- 每帧：相机 + 坦克/建筑/矿同步 + 渲染 ---- */
function draw3d(){
  const st=SIM.getState();

  // 相机与 2D 的 cam 同步（正交缩放 = cam.s）
  const hw=cv.width/(2*cam.s), hh=cv.height/(2*cam.s);
  cam3d.left=-hw; cam3d.right=hw; cam3d.top=hh; cam3d.bottom=-hh;
  cam3d.up.set(0, cam.cosP, cam.sinP);
  cam3d.position.set(cam.cx, -cam.cy - 1500*cam.sinP, 1500*cam.cosP);
  cam3d.lookAt(cam.cx, -cam.cy, 0);
  cam3d.updateProjectionMatrix();
  if(renderer.domElement.width!==cv.width||renderer.domElement.height!==cv.height){
    renderer.setSize(cv.width, cv.height);
  }

  // 坦克同步（M23 实例化）：SIM.tf 还原定点→浮点，槽位循环写 5 部件 instanceMatrix + instanceColor
  const tankList=[];
  for(const e of st.ents){ if(e.dead||!TANK_TYPES[e.t]) continue; tankList.push(e); }
  const n=Math.min(tankList.length,MAXTANK);
  for(let i=0;i<n;i++){
    const e=tankList[i];
    const d=SIM.DEF[e.t];
    const wx=SIM.tf(e.x), wy=SIM.tf(e.y);
    const v=Math.max(d.sz*1.7, 10/cam.s);      // 与 2D 的 vr 一致（世界单位）
    let txp=SIM.tf(e.tx), typ=SIM.tf(e.ty);
    if(e.tgt){ const tt=SIM.findE(e.tgt); if(tt){ txp=SIM.tf(tt.x); typ=SIM.tf(tt.y); } }
    const ang=Math.atan2(typ-wy, txp-wx);
    _imDummy.position.set(wx, -wy, 0);   // y 取负
    _imDummy.rotation.set(0,0,-ang);     // y 取负 → 旋转角取反
    _imDummy.scale.set(v,v,v);
    _imDummy.updateMatrix();
    COL.set(e.side===0?'#4aa3ff':'#ff5a4a');
    for(const part of TANK_DEF){
      TANK_IMESH[part.i].setMatrixAt(i, _partDummy.matrix.copy(_imDummy.matrix).multiply(part.mLocal));
      TANK_IMESH[part.i].setColorAt(i, part.color3||COL);
    }
  }
  for(let i=n;i<MAXTANK;i++){                 // 未用槽位隐藏（scale 0）
    _imDummy.position.set(0,0,0); _imDummy.rotation.set(0,0,0); _imDummy.scale.set(0,0,0); _imDummy.updateMatrix();
    for(const key in TANK_IMESH) TANK_IMESH[key].setMatrixAt(i,_imDummy.matrix);
  }
  for(const key in TANK_IMESH){
    TANK_IMESH[key].instanceMatrix.needsUpdate=true;
    if(TANK_IMESH[key].instanceColor) TANK_IMESH[key].instanceColor.needsUpdate=true;
  }

  // 建筑同步
  const bldSeen=new Set();
  for(const e of st.ents){
    if(e.dead||!BLD_TYPES[e.t]) continue;
    const d=SIM.DEF[e.t];
    bldSeen.add(e.id);
    let g=bldPool.get(e.id);
    if(!g||g.userData.t!==e.t){ if(g) scene.remove(g); g=makeBuilding(e.t,e.side); scene.add(g); bldPool.set(e.id,g); }
    const wx=SIM.tf(e.x), wy=SIM.tf(e.y);
    g.position.set(wx, -wy, 0);
    g.scale.setScalar(d.sz);
  }
  for(const [id,g] of bldPool){
    if(!bldSeen.has(id)){ scene.remove(g); bldPool.delete(id); }
  }

  // 飞行单位（基洛夫/入侵者）：3D 模型 + 高度 + 贴地阴影
  const flySeen=new Set();
  for(const e of st.ents){
    if(e.dead||!FLY_TYPES[e.t]) continue;
    const d=SIM.DEF[e.t];
    flySeen.add(e.id);
    let g=flyPool.get(e.id);
    if(!g||g.userData.t!==e.t){ if(g) scene.remove(g); g=e.t===SIM.T_KIROV?makeKirov(e.side):makeHarrier(e.side); g.userData.t=e.t; scene.add(g); flyPool.set(e.id,g); }
    const wx=SIM.tf(e.x), wy=SIM.tf(e.y);
    const v=Math.max(d.sz*1.7, 10/cam.s);
    const H=e.t===SIM.T_KIROV?KIROV_H:HARRIER_H;
    let txp=SIM.tf(e.tx), typ=SIM.tf(e.ty);
    if(e.tgt){ const tt=SIM.findE(e.tgt); if(tt){ txp=SIM.tf(tt.x); typ=SIM.tf(tt.y); } }
    const ang=Math.atan2(typ-wy, txp-wx);
    g.position.set(wx, -wy, H);
    g.scale.setScalar(v);
    g.rotation.z=-ang;
    g.userData.shadow.position.z=(0.5-H)/v;   // 阴影贴地（略高于地形防 z-fighting）
  }
  for(const [id,g] of flyPool){
    if(!flySeen.has(id)){ scene.remove(g); flyPool.delete(id); }
  }

  // 矿石晶体（InstancedMesh：一次 drawcall；采空实例 scale 0 隐藏；种子/重启变化时重建）
  const oreN=st.ore.length;
  const oreSig=oreN+':'+(st.ore[0]?st.ore[0].x+'_'+st.ore[0].y:'');
  if(!oreMesh||oreSig!==lastOreSig){
    if(oreMesh){ scene.remove(oreMesh); oreMesh.dispose(); }
    oreMesh=new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshLambertMaterial({color:0xe8b830}), oreN);
    oreMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(oreMesh);
    lastOreSig=oreSig;
  }
  for(let i=0;i<oreN;i++){
    const o=st.ore[i];
    const r=Math.max(3/cam.s, 7);            // 与 2D 的 max(3,7*cam.s)px 一致（世界单位）
    if(o.amt<=0){ _o.scale.set(0,0,0); }
    else { _o.scale.set(r,r,r); _o.rotation.set(0,0,(i*1.7)%6); }
    _o.position.set(SIM.tf(o.x), -SIM.tf(o.y), r*0.5);
    _o.updateMatrix();
    oreMesh.setMatrixAt(i, _o.matrix);
  }
  oreMesh.instanceMatrix.needsUpdate=true;

  // 建造场吊臂摆动（render-only，不进 SIM，与 2D drawBuilding 同源）
  const tA=performance.now()*0.001;
  for(const g of bldPool.values()){
    if(g.userData.crane) g.userData.crane.rotation.z=Math.sin(tA*0.7)*0.5;
  }

  renderer.render(scene, cam3d);
}
