// ============================================================
//  EduLens — script.js   (Fully integrated backend)
//  Firebase Firestore + Google Sheets Apps Script webhook
// ============================================================

// ── 1. FIREBASE CONFIG ──────────────────────────────────────
// Replace these values with your actual Firebase project config
// (Firebase Console → Project Settings → Your apps → SDK setup)
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ── 2. GOOGLE SHEETS APPS SCRIPT WEBHOOK URL ────────────────
// Deploy your Apps Script as a Web App and paste the URL here
// Guide: https://developers.google.com/apps-script/guides/web
const SHEETS_WEBHOOK_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";

// ── 3. GOOGLE SHEET ID ───────────────────────────────────────
// Found in your sheet URL: docs.google.com/spreadsheets/d/SHEET_ID/edit
const SHEET_ID = "YOUR_GOOGLE_SHEET_ID";

// ── 4. FIREBASE SDK INIT ─────────────────────────────────────
let db = null;

async function initFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      showToast('⚠️ Firebase SDK not loaded. Check your index.html script tags.', 'error');
      return false;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    console.log('✅ Firebase connected');
    return true;
  } catch (err) {
    console.error('Firebase init error:', err);
    showToast('❌ Firebase connection failed: ' + err.message, 'error');
    return false;
  }
}

// ── 5. IN-MEMORY FALLBACK DATA ───────────────────────────────
// Used when Firebase is not yet configured
let studentData = [
  {id:'naufal',name:'Naufal',class:'5 Alfa',reading:null,grammar:12,total:null,band:'Pending',initials:'NA',color:'linear-gradient(135deg,#4f8ef7,#a78bfa)'},
  {id:'aisha',name:'Aisha Sofea',class:'5 Beta',reading:13,grammar:11,total:24,band:'Good',initials:'AS',color:'linear-gradient(135deg,#34d399,#059669)'},
  {id:'hariz',name:'Hariz',class:'5 Cekal',reading:9,grammar:8,total:17,band:'Satisfactory',initials:'HA',color:'linear-gradient(135deg,#f472b6,#ec4899)'},
  {id:'balqis',name:'Balqis',class:'5 Alfa',reading:14,grammar:13,total:27,band:'Excellent',initials:'BA',color:'linear-gradient(135deg,#fbbf24,#f59e0b)'},
  {id:'izzat',name:'Izzat',class:'5 Delima',reading:7,grammar:6,total:13,band:'Satisfactory',initials:'IZ',color:'linear-gradient(135deg,#60a5fa,#3b82f6)'},
  {id:'nurul',name:'Nurul Aina',class:'5 Cekal',reading:11,grammar:10,total:21,band:'Good',initials:'NU',color:'linear-gradient(135deg,#a78bfa,#7c3aed)'},
  {id:'farhan',name:'Farhan',class:'5 Beta',reading:8,grammar:7,total:15,band:'Satisfactory',initials:'FA',color:'linear-gradient(135deg,#fb923c,#f97316)'},
  {id:'syafiqah',name:'Syafiqah',class:'5 Alfa',reading:15,grammar:14,total:29,band:'Excellent',initials:'SY',color:'linear-gradient(135deg,#34d399,#a78bfa)'},
  {id:'adam',name:'Adam',class:'5 Delima',reading:5,grammar:5,total:10,band:'Need Intervention',initials:'AD',color:'linear-gradient(135deg,#f87171,#dc2626)'},
  {id:'liyana',name:'Liyana',class:'5 Beta',reading:12,grammar:11,total:23,band:'Good',initials:'LI',color:'linear-gradient(135deg,#4f8ef7,#34d399)'},
];

// Pending marks queue (simulates open-ended answers awaiting approval)
let markingQueue = [
  {
    id: 'mark-001', studentId: 'naufal', studentName: 'Naufal', class: '5 Alfa',
    question: 'Q2 — Information Interpretation',
    prompt: 'Why do you think Aina went to the old woman? (2 marks)',
    answer: '"She wants to help her"',
    aiMark: 1, maxMark: 2, approved: false,
    aiReason: 'Student shows a basic inference (wanting to help) but lacks the contextual reason linked to the passage. Expected answer should mention the woman\'s fatigued appearance or heavy bag. Recommend 1 mark.'
  },
  {
    id: 'mark-002', studentId: 'naufal', studentName: 'Naufal', class: '5 Alfa',
    question: 'Q3 — Evidence-Based Interpretation',
    prompt: 'Explain how you know that Aina is a caring person. (3 marks)',
    answer: '"Because she helps the woman"',
    aiMark: 1, maxMark: 3, approved: false,
    aiReason: 'Response is weak. Student identifies the action but provides no text evidence and no reasoning. A full-mark answer requires: (1) identification of caring action, (2) specific text evidence (e.g., "Aina hastened over"), (3) clear explanation. Recommend 1 mark.'
  },
];

// Upload history
let uploadHistory = [
  {source:'Google Forms Auto-sync', type:'Forms', records:1, uploaded:'Today, 6:51 PM', status:'Synced'}
];

// ── 6. FIREBASE CRUD ─────────────────────────────────────────

async function saveStudentToFirebase(student) {
  if (!db) return;
  try {
    await db.collection('students').doc(student.id).set(student, { merge: true });
  } catch (err) {
    console.error('saveStudent error:', err);
  }
}

async function loadStudentsFromFirebase() {
  if (!db) return false;
  try {
    const snap = await db.collection('students').get();
    if (!snap.empty) {
      studentData = snap.docs.map(d => d.data());
      return true;
    }
    return false;
  } catch (err) {
    console.error('loadStudents error:', err);
    return false;
  }
}

async function saveMarkToFirebase(markItem) {
  if (!db) return;
  try {
    await db.collection('markingQueue').doc(markItem.id).set(markItem, { merge: true });
  } catch (err) {
    console.error('saveMark error:', err);
  }
}

async function loadMarkingQueueFromFirebase() {
  if (!db) return false;
  try {
    const snap = await db.collection('markingQueue').where('approved', '==', false).get();
    if (!snap.empty) {
      markingQueue = snap.docs.map(d => d.data());
      return true;
    }
    return false;
  } catch (err) {
    console.error('loadMarkingQueue error:', err);
    return false;
  }
}

async function saveUploadHistoryToFirebase(entry) {
  if (!db) return;
  try {
    await db.collection('uploadHistory').add(entry);
  } catch (err) {
    console.error('saveUploadHistory error:', err);
  }
}

async function loadUploadHistoryFromFirebase() {
  if (!db) return false;
  try {
    const snap = await db.collection('uploadHistory').orderBy('timestamp', 'desc').limit(20).get();
    if (!snap.empty) {
      uploadHistory = snap.docs.map(d => d.data());
      return true;
    }
    return false;
  } catch (err) {
    console.error('loadUploadHistory error:', err);
    return false;
  }
}

// ── 7. GOOGLE SHEETS SYNC ────────────────────────────────────

let lastSyncTime = null;
let syncStatus = 'Not synced';
let sheetResponses = [];

async function syncGoogleSheets() {
  const btn = document.getElementById('sheetSyncBtn');
  const statusEl = document.getElementById('sheetSyncStatus');
  const dotEl = document.getElementById('sheetSyncDot');

  if (btn) { btn.textContent = 'Syncing…'; btn.disabled = true; }
  if (dotEl) dotEl.style.background = 'var(--amber)';

  // Check if webhook is configured
  if (SHEETS_WEBHOOK_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
    showToast('⚠️ Paste your Apps Script URL into SHEETS_WEBHOOK_URL in script.js', 'warn');
    if (btn) { btn.textContent = 'Sync Now'; btn.disabled = false; }
    if (dotEl) dotEl.style.background = 'var(--amber)';
    if (statusEl) statusEl.textContent = 'Not configured — see script.js';
    return;
  }

  try {
    const res = await fetch(SHEETS_WEBHOOK_URL + '?action=getResponses&sheetId=' + SHEET_ID);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();

    sheetResponses = json.responses || [];
    lastSyncTime = new Date();
    syncStatus = 'Connected';

    // Merge sheet data into studentData
    let newCount = 0;
    for (const row of sheetResponses) {
      const matched = studentData.find(s =>
        s.name.toLowerCase().includes((row.name || '').toLowerCase())
      );
      if (matched) {
        if (row.readingScore != null) matched.reading = parseInt(row.readingScore);
        recalcStudent(matched);
        await saveStudentToFirebase(matched);
        newCount++;
      }
    }

    renderSheetStatus();
    renderUploadHistory();
    if (document.getElementById('page-students').classList.contains('active')) renderStudents(studentData);

    showToast(`✅ Synced ${sheetResponses.length} responses · ${newCount} students updated`);
  } catch (err) {
    console.error('Sheets sync error:', err);
    syncStatus = 'Error';
    if (dotEl) dotEl.style.background = 'var(--red)';
    if (statusEl) statusEl.textContent = 'Sync failed — check your webhook URL';
    showToast('❌ Google Sheets sync failed: ' + err.message, 'error');
  } finally {
    if (btn) { btn.textContent = 'Sync Now'; btn.disabled = false; }
  }
}

function renderSheetStatus() {
  const dotEl = document.getElementById('sheetSyncDot');
  const statusEl = document.getElementById('sheetSyncStatus');
  const responsesEl = document.getElementById('sheetResponseCount');

  const configured = SHEETS_WEBHOOK_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL';

  if (dotEl) dotEl.style.background = configured && syncStatus === 'Connected' ? 'var(--green)' : 'var(--amber)';
  if (statusEl) {
    statusEl.textContent = configured
      ? (syncStatus === 'Connected'
          ? 'Last sync: ' + (lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'never') + ' · ' + sheetResponses.length + ' response(s)'
          : syncStatus)
      : 'Not configured — edit SHEETS_WEBHOOK_URL in script.js';
  }
  if (responsesEl) responsesEl.textContent = sheetResponses.length + ' response(s) found';
}

// ── 8. BAND + SCORING LOGIC ──────────────────────────────────

function getBand(total) {
  if (total == null) return 'Pending';
  if (total >= 25) return 'Excellent';
  if (total >= 19) return 'Good';
  if (total >= 13) return 'Satisfactory';
  return 'Need Intervention';
}

function recalcStudent(s) {
  if (s.reading != null && s.grammar != null) {
    s.total = s.reading + s.grammar;
    s.band = getBand(s.total);
  } else {
    s.total = null;
    s.band = 'Pending';
  }
}

const bandPill = {
  'Excellent':'pill-excellent','Good':'pill-good',
  'Satisfactory':'pill-satisfactory','Need Intervention':'pill-intervention','Pending':'badge-amber'
};

// ── 9. NAVIGATION ─────────────────────────────────────────────

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'" + page + "'")) n.classList.add('active');
  });
  if (page === 'students') renderStudents(studentData);
  if (page === 'classes') renderClass('5 Alfa');
  if (page === 'marking') renderMarkingQueue();
  if (page === 'upload') { renderSheetStatus(); renderUploadHistory(); }
}

// ── 10. STUDENTS PAGE ─────────────────────────────────────────

function renderStudents(data) {
  const grid = document.getElementById('studentGrid');
  if (!data.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div>No students found</div>';
    return;
  }
  grid.innerHTML = data.map(s => `
    <div class="student-card" onclick="openStudentDetail('${s.id}')">
      <div class="student-header">
        <div class="student-avatar" style="background:${s.color}">${s.initials}</div>
        <div>
          <div class="student-name">${s.name}</div>
          <div class="student-class">${s.class}</div>
        </div>
        <div style="margin-left:auto"><span class="pill ${bandPill[s.band] || 'badge-blue'}">${s.band}</span></div>
      </div>
      <div class="student-scores">
        <div class="score-chip"><div class="score-chip-label">Reading</div><div class="score-chip-val" style="color:#60a5fa">${s.reading != null ? s.reading : '—'}</div></div>
        <div class="score-chip"><div class="score-chip-label">Grammar</div><div class="score-chip-val" style="color:#a78bfa">${s.grammar != null ? s.grammar : '—'}</div></div>
        <div class="score-chip"><div class="score-chip-label">Total</div><div class="score-chip-val" style="color:#34d399">${s.total != null ? s.total + '/30' : '—'}</div></div>
      </div>
    </div>
  `).join('');
}

function openStudentDetail(id) {
  const s = studentData.find(x => x.id === id);
  if (!s) return;
  showToast(`${s.name} · ${s.class} · Total: ${s.total != null ? s.total + '/30' : 'Pending'}`);
}

function filterStudents() {
  const q = document.getElementById('studentSearch').value.toLowerCase();
  const cls = document.getElementById('classFilter').value;
  const band = document.getElementById('bandFilter').value;
  renderStudents(studentData.filter(s =>
    (!q || s.name.toLowerCase().includes(q)) &&
    (!cls || s.class === cls) &&
    (!band || s.band === band)
  ));
}

// ── 11. CLASSES PAGE ──────────────────────────────────────────

const classData = {
  '5 Alfa':   { students: 32 },
  '5 Beta':   { students: 30 },
  '5 Cekal':  { students: 33 },
  '5 Delima': { students: 32 },
};

const qAccuracy = {
  '5 Alfa':   [95,82,61,98,79,68,96,84,90,88,92,95,85,88],
  '5 Beta':   [90,75,55,95,72,62,93,80,85,82,88,91,80,83],
  '5 Cekal':  [85,68,48,90,65,55,88,72,80,75,82,86,74,77],
  '5 Delima': [82,65,44,88,61,52,85,69,76,71,78,82,70,73],
};

function computeClassStats(cls) {
  const members = studentData.filter(s => s.class === cls && s.total != null);
  if (!members.length) {
    const base = classData[cls] || {};
    return { avg: 0, reading: 0, grammar: 0, students: base.students || 0 };
  }
  const avg     = +(members.reduce((a, s) => a + s.total, 0) / members.length).toFixed(1);
  const reading = +(members.reduce((a, s) => a + (s.reading || 0), 0) / members.length).toFixed(1);
  const grammar = +(members.reduce((a, s) => a + (s.grammar || 0), 0) / members.length).toFixed(1);
  return { avg, reading, grammar, students: classData[cls]?.students || members.length };
}

function renderClass(cls) {
  const d = computeClassStats(cls);
  const acc = qAccuracy[cls];
  const qLabels = ['R-Q1','R-Q2','R-Q3','R-Q4','R-Q5','R-Q6','R-Q7','R-Q8','G-Q1','G-Q2','G-Q3','G-Q4','G-Q5','G-Q6'];

  document.getElementById('classQBreakdown').innerHTML = qLabels.map((l, i) => {
    const pct = acc[i] || 0;
    const col = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171';
    return `<div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:11px;color:var(--text3);min-width:40px">${l}</span>
      <div style="flex:1;height:10px;background:rgba(255,255,255,0.05);border-radius:5px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:5px;transition:width 0.8s ease"></div>
      </div>
      <span style="font-size:11px;color:var(--text2);min-width:32px">${pct}%</span>
    </div>`;
  }).join('');

  const band = getBand(d.avg);
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

  const filtered = studentData.filter(s => s.class === cls);
  document.getElementById('classStudentBody').innerHTML = filtered.length
    ? filtered.map(s => `
      <tr>
        <td style="color:var(--text)">${s.name}</td>
        <td>${s.reading != null ? s.reading : '-'}</td>
        <td>${s.grammar != null ? s.grammar : '-'}</td>
        <td style="font-weight:600">${s.total != null ? s.total : '-'}</td>
        <td><span class="pill ${bandPill[s.band] || 'badge-blue'}">${s.band}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--text3)">No student data — upload CSV or sync Google Sheets</td></tr>';
}

function selectClass(el, cls) {
  document.querySelectorAll('#classTabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderClass(cls);
}

// ── 12. AI MARKING PAGE ───────────────────────────────────────

function renderMarkingQueue() {
  const container = document.getElementById('markingQueueContainer');
  const pendingCount = markingQueue.filter(m => !m.approved).length;
  const approvedToday = markingQueue.filter(m => m.approved).length;

  document.getElementById('pendingCount').textContent = pendingCount;
  document.getElementById('approvedCount').textContent = approvedToday;
  document.getElementById('approveAllBtn').textContent = `Approve All Remaining (${pendingCount})`;

  const pending = markingQueue.filter(m => !m.approved);
  if (!pending.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>All marks approved!</div>';
    return;
  }

  container.innerHTML = pending.map(m => `
    <div class="student-answer-card" id="card-${m.id}">
      <div class="answer-meta">
        <div>
          <div class="answer-q">${m.question} · ${m.studentName} · ${m.class}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:3px">${m.prompt}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-glass" style="padding:6px 12px;font-size:12px" onclick="skipMark('${m.id}')">Skip</button>
          <button class="btn btn-ai" style="padding:6px 12px;font-size:12px" onclick="approveMark('${m.id}')">✓ Approve</button>
        </div>
      </div>
      <div class="answer-text">${m.answer}</div>
      <div class="ai-suggestion">
        <div class="ai-suggestion-label">AI Suggestion</div>
        <div class="ai-suggestion-text">Suggested mark: <strong style="color:var(--accent2)">${m.aiMark}/${m.maxMark}</strong> — ${m.aiReason}</div>
      </div>
      <div class="mark-controls">
        <span style="font-size:12px;color:var(--text3)">Adjust mark:</span>
        <button class="mark-btn" onclick="adjustMark('${m.id}',-1)">−</button>
        <span class="mark-display" id="mark-val-${m.id}">${m.aiMark}</span>
        <button class="mark-btn" onclick="adjustMark('${m.id}',1)">+</button>
        <span class="mark-max">/ ${m.maxMark}</span>
      </div>
    </div>
  `).join('');
}

function adjustMark(id, delta) {
  const item = markingQueue.find(m => m.id === id);
  if (!item) return;
  item.aiMark = Math.max(0, Math.min(item.maxMark, item.aiMark + delta));
  const el = document.getElementById('mark-val-' + id);
  if (el) {
    el.textContent = item.aiMark;
    el.style.color = item.aiMark === item.maxMark ? 'var(--green)' : item.aiMark === 0 ? 'var(--red)' : 'var(--text)';
  }
}

async function approveMark(id) {
  const item = markingQueue.find(m => m.id === id);
  if (!item) return;

  item.approved = true;
  item.approvedAt = new Date().toISOString();

  // Update student's reading score (open-ended Q is part of reading)
  const student = studentData.find(s => s.id === item.studentId);
  if (student) {
    // Accumulate — add the approved mark to reading total
    student.reading = (student.reading || 0) + item.aiMark;
    student.reading = Math.min(15, student.reading); // cap at max
    recalcStudent(student);
    await saveStudentToFirebase(student);
  }

  await saveMarkToFirebase(item);

  // Fade out card
  const card = document.getElementById('card-' + id);
  if (card) {
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(40px)';
    setTimeout(() => renderMarkingQueue(), 420);
  }

  showToast(`✅ Mark approved: ${item.studentName} · ${item.aiMark}/${item.maxMark} saved to Firebase`);
  updateDashboardStats();
}

function skipMark(id) {
  const card = document.getElementById('card-' + id);
  if (card) {
    card.style.borderColor = 'rgba(251,191,36,0.4)';
    card.style.opacity = '0.5';
  }
  showToast('⏭ Skipped — will return to queue');
}

async function approveAll() {
  const pending = markingQueue.filter(m => !m.approved);
  if (!pending.length) { showToast('No pending marks!'); return; }

  for (const item of pending) {
    item.approved = true;
    item.approvedAt = new Date().toISOString();
    const student = studentData.find(s => s.id === item.studentId);
    if (student) {
      student.reading = Math.min(15, (student.reading || 0) + item.aiMark);
      recalcStudent(student);
      await saveStudentToFirebase(student);
    }
    await saveMarkToFirebase(item);
  }

  renderMarkingQueue();
  updateDashboardStats();
  showToast(`✅ All ${pending.length} marks approved and saved to Firebase`);
}

// ── 13. CSV UPLOAD + PARSING ──────────────────────────────────

function setupUploadZone() {
  const zone = document.getElementById('csvUploadZone');
  const input = document.getElementById('csvFileInput');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processCSVFile(file);
  });
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) processCSVFile(file);
  });
}

function processCSVFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('❌ Please upload a .csv file', 'error');
    return;
  }

  const prog = document.getElementById('uploadProgress');
  const bar = document.getElementById('uploadBar');
  const pct = document.getElementById('uploadPct');
  const status = document.getElementById('uploadStatus');
  const fname = document.getElementById('uploadFileName');

  prog.classList.add('show');
  fname.textContent = file.name;
  bar.style.width = '0%';
  pct.textContent = '0%';
  status.textContent = 'Reading file…';

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      bar.style.width = '30%'; pct.textContent = '30%'; status.textContent = 'Parsing CSV headers…';
      const text = e.target.result;
      const rows = parseCSV(text);

      bar.style.width = '55%'; pct.textContent = '55%'; status.textContent = 'Matching student names…';
      let matched = 0, created = 0;

      for (const row of rows) {
        if (!row['First Name'] && !row['Last Name'] && !row['Score']) continue;

        const firstName = (row['First Name'] || '').trim();
        const lastName  = (row['Last Name'] || '').trim();
        const fullName  = (firstName + ' ' + lastName).trim();
        const score     = parseInt(row['Score']) || parseInt(row['Correct']) || 0;

        // Try to match existing student
        const existing = studentData.find(s =>
          s.name.toLowerCase().includes(firstName.toLowerCase()) ||
          s.name.toLowerCase().includes(lastName.toLowerCase())
        );

        if (existing) {
          existing.grammar = Math.min(15, score);
          recalcStudent(existing);
          await saveStudentToFirebase(existing);
          matched++;
        } else {
          // Create new student entry
          const newStudent = {
            id: fullName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: fullName || 'Unknown',
            class: '5 Alfa', // default; teacher can reassign
            reading: null,
            grammar: Math.min(15, score),
            total: null,
            band: 'Pending',
            initials: (firstName[0] || '?') + (lastName[0] || ''),
            color: 'linear-gradient(135deg,#4f8ef7,#a78bfa)'
          };
          recalcStudent(newStudent);
          studentData.push(newStudent);
          await saveStudentToFirebase(newStudent);
          created++;
        }
      }

      bar.style.width = '85%'; pct.textContent = '85%'; status.textContent = 'Syncing to Firebase…';
      await new Promise(r => setTimeout(r, 400));

      bar.style.width = '100%'; pct.textContent = '100%'; status.textContent = 'Done!';

      const entry = {
        source: file.name,
        type: 'Wayground CSV',
        records: rows.length,
        uploaded: new Date().toLocaleString(),
        timestamp: Date.now(),
        status: 'Synced'
      };
      uploadHistory.unshift(entry);
      await saveUploadHistoryToFirebase(entry);
      renderUploadHistory();
      updateDashboardStats();

      showToast(`✅ CSV processed · ${matched} matched · ${created} new students · synced to Firebase`);
    } catch (err) {
      console.error('CSV error:', err);
      status.textContent = 'Parse error: ' + err.message;
      showToast('❌ CSV parse failed: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    // Handle quoted commas
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').replace(/"/g, '').trim(); });
    return row;
  });
}

// ── 14. UPLOAD HISTORY ────────────────────────────────────────

function renderUploadHistory() {
  const tbody = document.getElementById('uploadHistoryBody');
  if (!tbody) return;
  if (!uploadHistory.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3)">No uploads yet</td></tr>';
    return;
  }
  tbody.innerHTML = uploadHistory.map(h => `
    <tr>
      <td style="color:var(--text)">${h.source}</td>
      <td>${h.type}</td>
      <td>${h.records}</td>
      <td>${h.uploaded}</td>
      <td><span class="pill ${h.status === 'Synced' ? 'pill-excellent' : 'badge-amber'}">${h.status}</span></td>
    </tr>`).join('');
}

// ── 15. DASHBOARD STATS ───────────────────────────────────────

function updateDashboardStats() {
  const total = studentData.length;
  const avgTotal = studentData.filter(s => s.total != null);
  const avg = avgTotal.length
    ? (avgTotal.reduce((a, s) => a + s.total, 0) / avgTotal.length).toFixed(1)
    : '—';
  const pending = markingQueue.filter(m => !m.approved).length;
  const intervention = studentData.filter(s => s.band === 'Need Intervention').length;

  const el = id => document.getElementById(id);
  if (el('statTotal'))        el('statTotal').textContent = total;
  if (el('statAvg'))          el('statAvg').innerHTML = avg + '<span style="font-size:16px;font-weight:400;color:var(--text3)">/30</span>';
  if (el('statPending'))      el('statPending').textContent = pending;
  if (el('statIntervention')) el('statIntervention').textContent = intervention;
}

// ── 16. TOAST ─────────────────────────────────────────────────

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msgEl = document.getElementById('toastMsg');

  const icons = {
    success: '<path d="M20 6L9 17l-5-5" stroke-width="2.5" stroke-linecap="round"/>',
    error:   '<path d="M18 6L6 18M6 6l12 12" stroke-width="2.5" stroke-linecap="round"/>',
    warn:    '<path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-width="1.8"/>'
  };
  const colors = { success: '#34d399', error: '#f87171', warn: '#fbbf24' };

  if (icon) {
    icon.innerHTML = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="${colors[type] || colors.success}" style="flex-shrink:0">${icons[type] || icons.success}</svg>`;
  }
  if (msgEl) msgEl.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3400);
}

// ── 17. FIREBASE STATUS INDICATOR ────────────────────────────

function updateFirebaseIndicator(connected) {
  const el = document.getElementById('firebaseStatus');
  if (!el) return;
  el.innerHTML = connected
    ? '<span style="color:var(--green)">● Firebase Connected</span>'
    : '<span style="color:var(--amber)">● Firebase Not Configured</span>';
}

// ── 18. APP INIT ──────────────────────────────────────────────

async function initApp() {
  // Try Firebase
  const firebaseOk = await initFirebase();
  updateFirebaseIndicator(firebaseOk);

  if (firebaseOk) {
    await loadStudentsFromFirebase();
    await loadMarkingQueueFromFirebase();
    await loadUploadHistoryFromFirebase();
  }

  // Render initial state
  renderStudents(studentData);
  renderClass('5 Alfa');
  renderMarkingQueue();
  renderSheetStatus();
  renderUploadHistory();
  updateDashboardStats();
  setupUploadZone();

  // Show config warning if placeholders still set
  if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    setTimeout(() => showToast('⚠️ Set your Firebase config in script.js to enable cloud sync', 'warn'), 1200);
  }
}

document.addEventListener('DOMContentLoaded', initApp);
