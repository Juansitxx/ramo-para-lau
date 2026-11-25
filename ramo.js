const canvas = document.querySelector('#bouquet');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const controls = document.querySelector('#controls');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const palette = {
  stem: '#655a91', leaf: '#8e7abc', paper: '#594c78', ribbon: '#b7a3ed',
  violet: '#9270da', orchid: '#b895ee', lavender: '#d6c2ff', plum: '#7355ad',
  core: '#eee4ff', star: '#65587c'
};
const flowerColors = ['violet', 'orchid', 'lavender', 'plum', 'orchid', 'lavender', 'violet', 'plum', 'orchid'];
const positions = [
  [.15,.30],[.32,.23],[.50,.18],[.68,.23],[.85,.30],
  [.24,.42],[.42,.38],[.59,.39],[.76,.43]
];
const bigFlower = [
  '   .-***-.   ',
  '  (* @ @ *)  ',
  ' (* @***@ *) ',
  '(*@@*o*@@*)',
  ' (* @***@ *) ',
  '  (* @ @ *)  ',
  "   `-***-'   "
];
const smallFlower = [
  '  .-*-.  ',
  ' (* @ *) ',
  '(*@ o @*)',
  ' (* @ *) ',
  "  `-*-'  "
];
let columns = 100, rows = 54, cellW = 10, cellH = 12;
let cells = [], started = false, startedAt = 0, last = 0;
let petals = [], bursts = [], pointer = null;

function resize() {
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  columns = box.width < 650 ? 52 : 100;
  rows = box.width < 650 ? 58 : 54;
  cellW = box.width / columns;
  cellH = box.height / rows;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(Math.min(cellH * .98, cellW * 1.45))}px Consolas, "Courier New", monospace`;
}

function clearGrid() {
  cells = Array.from({length: rows}, () => Array(columns).fill(null));
}
function put(x, y, glyph, color) {
  x = Math.round(x); y = Math.round(y);
  if (glyph !== ' ' && x >= 0 && y >= 0 && x < columns && y < rows)
    cells[y][x] = [glyph, color];
}
function word(x, y, value, color) {
  for (let i = 0; i < value.length; i++) put(x + i, y, value[i], color);
}
function line(x1, y1, x2, y2, color, progress = 1) {
  const steps = Math.ceil(Math.max(Math.abs(x2-x1), Math.abs(y2-y1)) * progress);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, Math.max(Math.abs(x2-x1), Math.abs(y2-y1)));
    const dx = x2-x1, dy = y2-y1;
    put(x1+dx*t, y1+dy*t, Math.abs(dx)<1 ? '|' : Math.abs(dx)>Math.abs(dy)*1.5 ? '-' : dx*dy<0 ? '/' : '\\', color);
  }
}
function smooth(t) { return Math.max(0, Math.min(1, t)); }
function flower(x, y, color, growth, mobile) {
  const art = mobile ? smallFlower : bigFlower;
  const w = Math.max(...art.map(s => s.length));
  const h = art.length;
  if (growth <= 0) return;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < art[r].length; c++) {
      const glyph = art[r][c];
      const distance = Math.hypot((c-(w-1)/2)/(w/2), (r-(h-1)/2)/(h/2));
      if (distance <= growth * 1.2 && glyph !== ' ')
        put(x + c - Math.floor(w/2), y + r - Math.floor(h/2), glyph,
          glyph === 'o' ? 'core' : glyph === '*' && (r === 0 || r === h-1) ? 'core' : color);
    }
  }
}
function bouquet(elapsed, now) {
  const mobile = columns < 70;
  const cx = Math.floor(columns/2);
  const bottom = Math.floor(rows*.87);
  const open = smooth(elapsed/1.2);
  const spread = mobile ? columns*.41 : columns*.43;
  const paperY = Math.floor(rows*.53);
  line(cx-spread*open, paperY, cx-4, bottom, 'paper', open);
  line(cx+spread*open, paperY, cx+4, bottom, 'paper', open);
  line(cx-spread*.66*open, paperY+5, cx-3, bottom+1, 'paper', open);
  line(cx+spread*.66*open, paperY+5, cx+3, bottom+1, 'paper', open);
  word(cx-5,bottom+1,'\\________/','paper');

  positions.forEach(([px, py], i) => {
    const growth = smooth((elapsed - .25 - i*.22)/.85);
    if (!growth) return;
    const sway = reducedMotion.matches ? 0 : Math.sin(now*.0014 + i*1.7)*.65*growth;
    const x = Math.round(px*columns + sway), y = Math.round(py*rows);
    const center = cx + (i%3-1)*1.5;
    line(center, bottom-2, x, y+2, 'stem', growth);
    const leafY = Math.round(y + (bottom-y)*.5);
    const leafX = Math.round(x + (center-x)*.52);
    if (growth > .45) word(leafX + (i%2 ? -3 : 1), leafY, i%2 ? '<//':'\\\\>', 'leaf');
  });
  positions.forEach(([px, py], i) => {
    const growth = smooth((elapsed - .7 - i*.22)/.7);
    const sway = reducedMotion.matches ? 0 : Math.sin(now*.0014 + i*1.7)*.65*growth;
    flower(Math.round(px*columns+sway), Math.round(py*rows), flowerColors[i], growth, mobile);
  });
  if (elapsed > 2.8) {
    word(cx-6, bottom-8, ' .-.__.-. ', 'ribbon');
    word(cx-6, bottom-7, '(   LAU   )', 'ribbon');
    word(cx-6, bottom-6, " `-.__.-' ", 'ribbon');
  }
}
function addPetals(amount, origin) {
  for (let i=0;i<amount;i++) petals.push({
    x: origin?.x ?? Math.random()*columns,
    y: origin?.y ?? -Math.random()*rows*.3,
    vx: (Math.random()-.5)*.08, vy: .025+Math.random()*.04,
    phase: Math.random()*6.3, color: flowerColors[i%flowerColors.length],
    glyph: i%3 ? '.' : '*', life: 0
  });
}
function draw(now) {
  const dt = Math.min(50, now-last || 16); last = now;
  const box = canvas.getBoundingClientRect();
  ctx.clearRect(0,0,box.width,box.height);
  const glow = ctx.createRadialGradient(box.width*.5,box.height*.55,10,box.width*.5,box.height*.55,box.width*.63);
  glow.addColorStop(0,'#211633'); glow.addColorStop(1,'#090711');
  ctx.fillStyle=glow; ctx.fillRect(0,0,box.width,box.height);
  clearGrid();
  const elapsed = started ? (now-startedAt)/1000 : 0;
  for (let i=0;i<23;i++) {
    const x=(i*41+13)%columns, y=(i*17+9)%(rows-7);
    if (!started || (i+Math.floor(now/750))%3) put(x,y,i%4 ? '.' : '+','star');
  }
  if (started) bouquet(elapsed,now);
  if (started && elapsed > 3 && !reducedMotion.matches && Math.random()<.055 && petals.length<75) addPetals(1);
  petals=petals.filter(p=>p.y<rows+2 && p.life<550);
  petals.forEach(p=>{
    p.life++; p.y+=p.vy*dt; p.x+=(p.vx+Math.sin(p.phase+p.life*.04)*.025)*dt;
    if (pointer) { const dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy); if(dist<8 && dist>0) p.x+=dx/dist*.12; }
    put(p.x,p.y,p.glyph,p.color);
  });
  bursts=bursts.filter(b=>b.life<35);
  bursts.forEach(b=>{b.life++;put(b.x+b.vx*b.life*.22,b.y+b.vy*b.life*.22,b.glyph,b.color)});
  for (let y=0;y<rows;y++) for(let x=0;x<columns;x++) {
    const cell=cells[y][x]; if(!cell) continue;
    ctx.fillStyle=palette[cell[1]];
    ctx.shadowColor=cell[1]==='star' ? 'transparent' : palette[cell[1]];
    ctx.shadowBlur=cell[1]==='star' ? 0 : 6;
    ctx.fillText(cell[0],(x+.5)*cellW,(y+.5)*cellH);
  }
  ctx.shadowBlur=0;
  requestAnimationFrame(draw);
}
function openBouquet() {
  overlay.classList.add('opened');
  controls.hidden=false;
  started=true;
  startedAt=performance.now()-(reducedMotion.matches ? 4000 : 0);
  petals=[];
}
document.querySelector('#open').addEventListener('click',openBouquet);
document.querySelector('#again').addEventListener('click',()=>{startedAt=performance.now();petals=[]});
document.querySelector('#petals').addEventListener('click',()=>addPetals(90));
canvas.addEventListener('pointermove',event=>{
  const r=canvas.getBoundingClientRect();pointer={x:(event.clientX-r.left)/cellW,y:(event.clientY-r.top)/cellH};
});
canvas.addEventListener('pointerleave',()=>pointer=null);
canvas.addEventListener('pointerdown',event=>{
  if(!started)return;
  const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)/cellW,y=(event.clientY-r.top)/cellH;
  for(let i=0;i<16;i++){const a=i*Math.PI/8;bursts.push({x,y,vx:Math.cos(a),vy:Math.sin(a),life:0,glyph:i%3?'*':'+',color:flowerColors[i%9]})}
  addPetals(10,{x,y});
});
window.addEventListener('resize',resize);
resize();requestAnimationFrame(draw);
