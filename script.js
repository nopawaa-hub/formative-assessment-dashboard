
const studentData = [
  {name:'Naufal',class:'5 Alfa',reading:null,grammar:12,total:null,band:'Pending',initials:'NA',color:'linear-gradient(135deg,#4f8ef7,#a78bfa)'},
  {name:'Aisha Sofea',class:'5 Beta',reading:13,grammar:11,total:24,band:'Good',initials:'AS',color:'linear-gradient(135deg,#34d399,#059669)'},
  {name:'Hariz',class:'5 Cekal',reading:9,grammar:8,total:17,band:'Satisfactory',initials:'HA',color:'linear-gradient(135deg,#f472b6,#ec4899)'},
  {name:'Balqis',class:'5 Alfa',reading:14,grammar:13,total:27,band:'Excellent',initials:'BA',color:'linear-gradient(135deg,#fbbf24,#f59e0b)'},
  {name:'Izzat',class:'5 Delima',reading:7,grammar:6,total:13,band:'Satisfactory',initials:'IZ',color:'linear-gradient(135deg,#60a5fa,#3b82f6)'},
  {name:'Nurul Aina',class:'5 Cekal',reading:11,grammar:10,total:21,band:'Good',initials:'NU',color:'linear-gradient(135deg,#a78bfa,#7c3aed)'},
  {name:'Farhan',class:'5 Beta',reading:8,grammar:7,total:15,band:'Satisfactory',initials:'FA',color:'linear-gradient(135deg,#fb923c,#f97316)'},
  {name:'Syafiqah',class:'5 Alfa',reading:15,grammar:14,total:29,band:'Excellent',initials:'SY',color:'linear-gradient(135deg,#34d399,#a78bfa)'},
  {name:'Adam',class:'5 Delima',reading:5,grammar:5,total:10,band:'Need Intervention',initials:'AD',color:'linear-gradient(135deg,#f87171,#dc2626)'},
  {name:'Liyana',class:'5 Beta',reading:12,grammar:11,total:23,band:'Good',initials:'LI',color:'linear-gradient(135deg,#4f8ef7,#34d399)'},
];

const classData = {
  '5 Alfa': {avg:23.1,reading:11.4,grammar:11.7,students:32},
  '5 Beta': {avg:21.8,reading:11.1,grammar:10.7,students:30},
  '5 Cekal': {avg:19.4,reading:9.8,grammar:9.6,students:33},
  '5 Delima': {avg:18.2,reading:9.3,grammar:8.9,students:32},
};

const qAccuracy = {
  '5 Alfa': [95,82,61,98,79,68,96,84,90,88,92,95,85,88],
  '5 Beta': [90,75,55,95,72,62,93,80,85,82,88,91,80,83],
  '5 Cekal': [85,68,48,90,65,55,88,72,80,75,82,86,74,77],
  '5 Delima': [82,65,44,88,61,52,85,69,76,71,78,82,70,73],
};

const bandPill = {
  'Excellent':'pill-excellent','Good':'pill-good',
  'Satisfactory':'pill-satisfactory','Need Intervention':'pill-intervention','Pending':'badge-amber'
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if(n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+page+"'")) n.classList.add('active');
  });
  if(page==='students') renderStudents(studentData);
  if(page==='classes') renderClass('5 Alfa');
}

function renderStudents(data) {
  const grid = document.getElementById('studentGrid');
  if(!data.length){grid.innerHTML='<div class="empty-state"><div class="empty-icon">🔍</div>No students found</div>';return;}
  grid.innerHTML = data.map(s => `
    <div class="student-card" onclick="showToast('${s.name} · ${s.class} · Total: ${s.total||'Pending'}')">
      <div class="student-header">
        <div class="student-avatar" style="background:${s.color}">${s.initials}</div>
        <div>
          <div class="student-name">${s.name}</div>
          <div class="student-class">${s.class}</div>
        </div>
        <div style="margin-left:auto"><span class="pill ${bandPill[s.band]||'badge-blue'}">${s.band}</span></div>
      </div>
      <div class="student-scores">
        <div class="score-chip"><div class="score-chip-label">Reading</div><div class="score-chip-val" style="color:#60a5fa">${s.reading!=null?s.reading+'':'—'}</div></div>
        <div class="score-chip"><div class="score-chip-label">Grammar</div><div class="score-chip-val" style="color:#a78bfa">${s.grammar!=null?s.grammar+'':'—'}</div></div>
        <div class="score-chip"><div class="score-chip-label">Total</div><div class="score-chip-val" style="color:#34d399">${s.total!=null?s.total+'/30':'—'}</div></div>
      </div>
    </div>
  `).join('');
}

function filterStudents() {
  const q = document.getElementById('studentSearch').value.toLowerCase();
  const cls = document.getElementById('classFilter').value;
  const band = document.getElementById('bandFilter').value;
  renderStudents(studentData.filter(s =>
    (!q || s.name.toLowerCase().includes(q)) &&
    (!cls || s.class===cls) &&
    (!band || s.band===band)
  ));
}

function renderClass(cls) {
  const d = classData[cls];
  const acc = qAccuracy[cls];
  const qLabels = ['R-Q1','R-Q2','R-Q3','R-Q4','R-Q5','R-Q6','R-Q7','R-Q8','G-Q1','G-Q2','G-Q3','G-Q4','G-Q5','G-Q6'];
  document.getElementById('classQBreakdown').innerHTML = qLabels.map((l,i) => {
    const pct = acc[i]||0;
    const col = pct>=80?'#34d399':pct>=60?'#fbbf24':'#f87171';
    return `<div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:11px;color:var(--text3);min-width:40px">${l}</span>
      <div style="flex:1;height:10px;background:rgba(255,255,255,0.05);border-radius:5px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:5px;transition:width 0.8s ease"></div>
      </div>
      <span style="font-size:11px;color:var(--text2);min-width:32px">${pct}%</span>
    </div>`;
  }).join('');

  const band = d.avg>=25?'Excellent':d.avg>=19?'Good':d.avg>=13?'Satisfactory':'Need Intervention';
  const pillClass = bandPill[band];
  document.getElementById('classSummaryContent').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;padding:12px;background:rgba(0,0,0,0.2);border-radius:10px">
        <span style="font-size:13px;color:var(--text2)">Class Average</span>
        <span style="font-size:18px;font-weight:700;color:var(--accent)">${d.avg}/30</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text2)">Reading avg</span><span style="font-weight:600">${d.reading}/15</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text2)">Grammar avg</span><span style="font-weight:600">${d.grammar}/15</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text2)">Students</span><span style="font-weight:600">${d.students}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text2)">Overall Band</span><span class="pill ${pillClass}">${band}</span>
      </div>
    </div>`;

  const filtered = studentData.filter(s=>s.class===cls);
  document.getElementById('classStudentBody').innerHTML = filtered.length ? filtered.map(s=>`
    <tr><td style="color:var(--text)">${s.name}</td>
    <td>${s.reading!=null?s.reading:'-'}</td>
    <td>${s.grammar!=null?s.grammar:'-'}</td>
    <td style="font-weight:600">${s.total!=null?s.total:'-'}</td>
    <td><span class="pill ${bandPill[s.band]||'badge-blue'}">${s.band}</span></td></tr>
  `).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text3)">Sample data — upload real CSV to populate</td></tr>';
}

function selectClass(el, cls) {
  document.querySelectorAll('#classTabs .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderClass(cls);
}

function adjustMark(btn, delta, max) {
  const display = btn.parentElement.querySelector('.mark-display');
  let val = parseInt(display.textContent) + delta;
  val = Math.max(0, Math.min(max, val));
  display.textContent = val;
  display.style.color = val===max?'var(--green)':val===0?'var(--red)':'var(--text)';
}

function approveAnswer(btn) {
  const card = btn.closest('.student-answer-card');
  card.style.opacity='0.4';
  card.style.pointerEvents='none';
  showToast('Mark approved and saved');
}

function skipAnswer(btn) {
  const card = btn.closest('.student-answer-card');
  card.style.borderColor='rgba(251,191,36,0.4)';
  showToast('Skipped — will return to queue');
}

function simulateUpload() {
  const prog = document.getElementById('uploadProgress');
  const bar = document.getElementById('uploadBar');
  const pct = document.getElementById('uploadPct');
  const status = document.getElementById('uploadStatus');
  const fname = document.getElementById('uploadFileName');
  prog.classList.add('show');
  fname.textContent = 'Wayground_Report_5Alfa.csv';
  let p = 0;
  const msgs = ['Parsing CSV headers...','Reading participant data...','Matching student names...','Calculating scores...','Syncing to Firebase...','Done!'];
  const timer = setInterval(()=>{
    p += Math.random()*18+5;
    if(p>100)p=100;
    bar.style.width=p+'%';
    pct.textContent=Math.round(p)+'%';
    status.textContent = msgs[Math.min(Math.floor(p/20),5)];
    if(p>=100){clearInterval(timer);showToast('CSV uploaded · 32 students synced to Firebase');}
  },300);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}

// Init
renderStudents(studentData);
renderClass('5 Alfa');
