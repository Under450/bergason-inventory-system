
function parseRepo(){
  const m = location.pathname.split('/').filter(Boolean);
  const host = location.host;
  const parts = host.split('.');
  let owner = parts[0];
  let repo = (m.length>0)? m[0] : '';
  return { owner, repo };
}
const BRANCH = 'gh-pages';

async function listDir(path){
  const { owner, repo } = parseRepo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
  const res = await fetch(url);
  if(!res.ok) return [];
  return await res.json();
}
function rawUrl(path){
  const { owner, repo } = parseRepo();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${BRANCH}/${path}`;
}
function uploadUrl(path){
  const { owner, repo } = parseRepo();
  return `https://github.com/${owner}/${repo}/upload/${BRANCH}/${path}`;
}
async function renderIndex(){
  const list = await listDir('content');
  const props = list.filter(x=>x.type==='dir').map(x=>x.name).sort();
  const ul = document.getElementById('prop-list');
  if(!ul) return;
  if(props.length===0){
    ul.innerHTML = `<li>No properties found. Create a folder under <code>content/Property_Inventory_[Address]/</code>.</li>`;
    return;
  }
  ul.innerHTML = props.map(p=>`<li><a href="property.html?p=${encodeURIComponent(p)}">${p}</a></li>`).join('');
}

const ROOMS = [
  "01_Front Garden","02_Porch","03_Hallway","04_WC","05_Lounge","06_Dining Room",
  "07_Store Cupboard","08_Kitchen","09_Pantry","10_Rear Garden","11_Stairs","12_Landing",
  "13_Airing Cupboard","14_Bedroom 1","15_Bedroom 2","16_Bedroom 3","17_Bedroom 4",
  "18_Bedroom 5","19_Ensuite","20_Bathroom"
];
function pill(label){
  let cls='na';
  if(/good/i.test(label)) cls='good';
  else if(/fair/i.test(label)) cls='fair';
  else if(/poor/i.test(label)) cls='poor';
  return `<span class="pill ${cls}">${label}</span>`;
}
async function renderProperty(){
  const params = new URLSearchParams(location.search);
  const prop = params.get('p');
  if(!prop){ document.getElementById('prop-title').textContent = 'No property selected'; return; }
  document.getElementById('prop-title').textContent = prop.replace(/_/g,' ');
  try{
    const metaRes = await fetch(rawUrl(`content/${encodeURIComponent(prop)}/meta.json`));
    if(metaRes.ok){
      const meta = await metaRes.json();
      for(const [k,v] of Object.entries(meta)){
        const el = document.querySelector(`[data-meta="${k}"]`);
        if(el) el.textContent = v;
      }
    }
  }catch(e){}
  const tbody = document.querySelector('#overall tbody');
  const items = [
    ["1.1","General Cleanliness","N/A",""],
    ["1.2","Carpets and Hard Floors","N/A",""],
    ["1.3","Window Dressings","N/A",""],
    ["1.4","Front Garden","N/A",""],
    ["1.5","Decorative Order","N/A",""],
    ["1.6","Windows and Doors","N/A",""],
    ["1.7","Beds and Mattresses","N/A",""],
    ["1.8","Rear Garden","N/A",""]
  ];
  tbody.innerHTML = items.map(r=>`
    <tr>
      <td>${r[0]}</td>
      <td contenteditable="true">${r[1]}</td>
      <td class="cond" data-cond contenteditable="true">${r[2]}</td>
      <td contenteditable="true">${r[3]}</td>
    </tr>
  `).join('');
  const container = document.getElementById('rooms');
  for(const room of ROOMS){
    const encoded = encodeURIComponent(room);
    const list = await listDir(`content/${encodeURIComponent(prop)}/${encoded}`);
    const images = list.filter(x=>x.type==='file' && /\.(jpe?g|png|gif|webp)$/i.test(x.name));
    const count = images.length;
    const upload = uploadUrl(`content/${prop}/${room}`.replace(/ /g,'%20'));
    const grid = images.map(img=>`<img src="${rawUrl(`content/${prop}/${room}/${img.name}`)}" alt="${room}">`).join('');
    const html = `
      <section class="room">
        <details>
          <summary>
            <span class="chev">▸</span>
            <span class="title">${room.replace(/^\d+_/,'')}</span>
            <span class="badge">${count} photo${count===1?'':'s'}</span>
            <span class="pill na">N/A</span>
          </summary>
          <div class="room-toolbar no-print">
            <a class="button" href="${upload}" target="_blank" rel="noopener">Upload photos to this room</a>
          </div>
          <div class="grid">${grid}</div>
          <div class="notes" contenteditable="true">Notes: click to edit before printing.</div>
        </details>
      </section>
    `;
    container.insertAdjacentHTML('beforeend', html);
  }
  setupSignatures();
}
function setupSignatures(){
  function scaleCanvas(canvas){
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width  = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=2.2; ctx.strokeStyle='#111';
    return ctx;
  }
  document.querySelectorAll('.sig-card').forEach(card=>{
    const canvas = card.querySelector('.sig-canvas');
    const img = card.querySelector('.sig-image');
    const hint = card.querySelector('.sig-hint');
    const clearB = card.querySelector('.sig-clear');
    const saveB = card.querySelector('.sig-save');
    const nameI = card.querySelector('.sig-name');
    const dateI = card.querySelector('.sig-date');
    const stamp = card.querySelector('.sig-stamp');
    if(!dateI.value){ dateI.value = new Date().toISOString().slice(0,10); }
    let ctx = scaleCanvas(canvas);
    let drawing=false, touched=false;
    function pos(e){
      const r = canvas.getBoundingClientRect();
      const t = ('touches' in e && e.touches.length)? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function start(e){ e.preventDefault(); const p = pos(e); drawing=true; touched=true; ctx.beginPath(); ctx.moveTo(p.x,p.y); hint.style.opacity='0'; }
    function move(e){ if(!drawing) return; const p = pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); }
    function end(){ drawing=false; }
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, {passive:false});
    canvas.addEventListener('touchmove', move, {passive:false});
    canvas.addEventListener('touchend', end);
    clearB.addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); hint.style.opacity='1'; touched=false; img.style.display='none'; canvas.style.display='block'; stamp.textContent=''; });
    saveB.addEventListener('click', ()=>{
      if(!touched){ alert('Please sign first.'); return; }
      img.src = canvas.toDataURL('image/png');
      img.style.display='block'; canvas.style.display='none';
      const who = (nameI.value||card.dataset.role||'Signer').trim();
      const when = dateI.value || new Date().toISOString().slice(0,10);
      stamp.textContent = `Signed by ${who} on ${when}`;
    });
    window.addEventListener('resize', ()=>{ const data = canvas.toDataURL(); ctx = scaleCanvas(canvas); const im = new Image(); im.onload=()=>ctx.drawImage(im,0,0,canvas.clientWidth,canvas.clientHeight); im.src=data; });
    window.addEventListener('beforeprint', ()=>{ if(canvas.style.display!=='none' && touched){ img.src=canvas.toDataURL('image/png'); img.style.display='block'; canvas.style.display='none'; } });
  });
}
window.InventoryApp = { renderIndex, renderProperty };
