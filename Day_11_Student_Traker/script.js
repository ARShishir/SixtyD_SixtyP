
/* ------------------------------
   DOM Alert Utility
------------------------------ */
function showAlert(message, type='success', duration=3000){
  let alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} show`;
  alertDiv.textContent = message;
  document.body.prepend(alertDiv);
  setTimeout(()=> {
    alertDiv.classList.remove('show');
    alertDiv.remove();
  }, duration);
}

/* ------------------------------
   Auto expand textarea
------------------------------ */
const noticeText = document.getElementById('noticeText');
if(noticeText){
  noticeText.addEventListener('input', function(){
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
}

/* ------------------------------
   Helpers
------------------------------ */
const uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,9)}`;
const todayISO = () => new Date().toISOString().split('T')[0];
const timeNow = () => {
  const d = new Date();
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0');
  const ampm = h>=12?'PM':'AM'; h = h%12||12;
  return `${h}:${m} ${ampm}`;
};
// Author: Abdur Rahaman Shishir
function load(key){ try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e){ return []; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

/* ------------------------------
   Initialize default data
------------------------------ */
if(!localStorage.getItem('users')) {
  const demoTeacher = { id: 't1', role: 'teacher', name: 'Demo Teacher', password: '123' };
  const demoStudents = [
    { id: 's1', role: 'student', name: 'Rakib', roll: '01' },
    { id: 's2', role: 'student', name: 'Sima', roll: '02' },
    { id: 's3', role: 'student', name: 'Imran', roll: '03' }
  ];
  save('users', [demoTeacher, ...demoStudents]);
}
if(!localStorage.getItem('attendance')) save('attendance', []);
if(!localStorage.getItem('notices')) save('notices', []);

/* ------------------------------
   App State
------------------------------ */
let currentUser = null;

/* ------------------------------
   UI Elements
------------------------------ */
const screenLogin = document.getElementById('screenLogin');
const screenApp = document.getElementById('screenApp');
const headerControls = document.getElementById('headerControls');
const mainTabs = document.getElementById('mainTabs');
const studentSelect = document.getElementById('studentSelect');

/* ------------------------------
   Populate student dropdown
------------------------------ */
function refreshStudentSelect(){
  const users = load('users').filter(u=>u.role==='student');
  studentSelect.innerHTML = '<option value="">-- choose student --</option>';
  users.forEach(s=> studentSelect.insertAdjacentHTML('beforeend', `<option value="${s.id}">${s.name} (${s.roll||''})</option>`));
}
refreshStudentSelect();

/* ------------------------------
   Login Flows
------------------------------ */
function teacherLogin(){
  const name = (document.getElementById('teacherName').value || '').trim() || 'Teacher';
  const pass = (document.getElementById('teacherPass').value || '').trim() || '123';
  const users = load('users');
  let teacher = users.find(u=>u.role==='teacher' && u.name.toLowerCase()===name.toLowerCase());
  if(!teacher){
    teacher = { id: uid('t'), role: 'teacher', name, password: pass };
    users.unshift(teacher);
    save('users', users);
  } else {
    if(teacher.password && teacher.password!==pass){
      return showAlert('Password mismatch', 'error');
    }
  }
  currentUser = teacher;
  afterLogin();
}

function studentLogin(){
  const sid = studentSelect.value;
  if(!sid){ return showAlert('Choose a student', 'error'); }
  const users = load('users');
  const s = users.find(u=>u.id===sid);
  if(!s) return showAlert('Student not found', 'error');
  currentUser = s;
  afterLogin();
}

/* ------------------------------
   After Login
------------------------------ */
function afterLogin(){
  screenLogin.style.display = 'none';
  screenApp.style.display = 'block';
  headerControls.innerHTML = `
    <div>Signed in: <strong>${currentUser.name}</strong> <span class="small-muted">(${currentUser.role})</span></div>
    <div class="right">
      <button onclick="logout()" class="tab">Logout</button>
    </div>
  `;
  renderTabs();
  if(currentUser.role==='teacher') openTab('teacher');
  else openTab('student');
}

function logout(){
  currentUser = null;
  screenApp.style.display = 'none';
  screenLogin.style.display = 'block';
  headerControls.innerHTML = '';
  refreshStudentSelect();
}

/* ------------------------------
   Tabs
------------------------------ */
function renderTabs(){
  mainTabs.innerHTML = '';
  if(currentUser.role==='teacher'){
    mainTabs.insertAdjacentHTML('beforeend', `<div class="tab active" id="tabBtn_teacher" onclick="openTab('teacher')">Teacher Dashboard</div>`);
  }
  mainTabs.insertAdjacentHTML('beforeend', `<div class="tab" id="tabBtn_student" onclick="openTab('student')">Student Dashboard</div>`);
}

function openTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const btn = document.getElementById('tabBtn_'+name);
  if(btn) btn.classList.add('active');

  document.getElementById('tabTeacher').style.display = (name==='teacher' && currentUser.role==='teacher') ? 'block' : 'none';
  document.getElementById('tabStudent').style.display = (name==='student') ? 'block' : 'none';

  if(name==='teacher'){
    renderStudents();
    populateAttendanceTable();
    renderNotices();
    renderReports();
    document.getElementById('attDate').value = todayISO();
  }
  if(name==='student'){
  renderStudentAttendanceReport();  // <-- update here
    renderStudentNotices();
  }
}

/* ------------------------------
   Students CRUD (Teacher)
------------------------------ */
function getUsers(){ return load('users'); }
function saveUsers(u){ save('users', u); refreshStudentSelect(); }

function generateNextRoll(){
  const students = getUsers().filter(u=>u.role==='student');
  if(students.length===0) return '01';
  const rolls = students.map(s=>parseInt(s.roll||'0')).filter(n=>!isNaN(n));
  const maxRoll = rolls.length ? Math.max(...rolls) : 0;
  return String(maxRoll+1).padStart(2,'0');
}

function addStudent(){
  const name = document.getElementById('newStudentName').value.trim();
  if(!name) return showAlert('Enter student name', 'error');
  const roll = generateNextRoll();
  const users = getUsers();
  const s = { id: uid('s'), role:'student', name, roll };
  users.push(s);
  saveUsers(users);
  document.getElementById('newStudentName').value = '';
  renderStudents();
  populateAttendanceTable();
  showAlert(`Student added with Roll ${roll}`);
}

function renderStudents(){
  const users = getUsers().filter(u=>u.role==='student');
  const tbody = document.querySelector('#studentsTable tbody');
  tbody.innerHTML = '';
  users.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.roll||''}</td>
      <td class="center small">
        <button class="tab" onclick="startEditStudent('${s.id}')">Edit</button>
        <button class="tab" onclick="deleteStudent('${s.id}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function startEditStudent(id){
  const users = getUsers();
  const s = users.find(u=>u.id===id);
  if(!s) return;
  const newName = prompt('Edit name', s.name);
  if(newName===null) return;
  s.name = newName.trim() || s.name;
  saveUsers(users);
  renderStudents();
  populateAttendanceTable();
}

function deleteStudent(id){
  if(!confirm('Delete this student?')) return;
  let users = getUsers().filter(u=>u.id!==id);
  let attendance = load('attendance').filter(a=>a.studentId!==id);
  saveUsers(users);
  save('attendance', attendance);
  renderStudents();
  populateAttendanceTable();
}

/* ------------------------------
   Attendance (Teacher)
------------------------------ */
function populateAttendanceTable(){
  const students = getUsers().filter(u=>u.role==='student');
  const tbody = document.querySelector('#attTable tbody');
  tbody.innerHTML = '';
  students.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name}</td><td>${s.roll||''}</td>
      <td class="center"><input type="checkbox" data-student="${s.id}" /></td>`;
    tbody.appendChild(tr);
  });
  loadAttendanceForDate();
}

function loadAttendanceForDate(){
  const date = document.getElementById('attDate').value || todayISO();
  const attendance = load('attendance');
  document.querySelectorAll('#attTable input[type="checkbox"]').forEach(cb=>{
    const sid = cb.dataset.student;
    const rec = attendance.find(a=>a.studentId===sid && a.date===date && a.status==='present');
    cb.checked = !!rec;
  });
}

function saveAttendance(){
  const date = document.getElementById('attDate').value || todayISO();
  const attendance = load('attendance');
  document.querySelectorAll('#attTable input[type="checkbox"]').forEach(cb=>{
    const sid = cb.dataset.student;
    const existingIndex = attendance.findIndex(a=>a.studentId===sid && a.date===date);
    if(cb.checked){
      const time = timeNow();
      if(existingIndex>=0){
        attendance[existingIndex].status='present';
        attendance[existingIndex].time=time;
      } else {
        attendance.push({id: uid('a'), studentId: sid, date, status:'present', time});
      }
    } else if(existingIndex>=0){
      attendance.splice(existingIndex,1);
    }
  });
  save('attendance', attendance);
  showAlert(`Attendance saved for ${date}`);
  renderReports();
}

/* ------------------------------
   Notices
------------------------------ */
function postNotice(){
  const title = document.getElementById('noticeTitle').value.trim();
  const text = document.getElementById('noticeText').value.trim();
  if(!title || !text) return showAlert('Provide title and text','error');
  const notices = load('notices');
  notices.unshift({ id: uid('n'), title, text, date: todayISO(), from: currentUser.id });
  save('notices', notices);
  document.getElementById('noticeTitle').value='';
  document.getElementById('noticeText').value='';
  renderNotices();
  showAlert('Notice posted');
}

function renderNotices(){
  const notices = load('notices');
  const container = document.getElementById('noticeList');
  container.innerHTML='';
  if(notices.length===0) container.innerHTML='<div class="small-muted">No notices yet</div>';
  notices.forEach(n=>{
    const el = document.createElement('div');
    el.className='notice';
    el.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="flex:1">
        <strong>${n.title}</strong>
        <div class="small-muted">${n.date}</div>
        <div style="margin-top:6px">${n.text}</div>
      </div>
      <div style="min-width:80px; text-align:right">
        <button class="tab" onclick="editNotice('${n.id}')">Edit</button>
        <button class="tab" onclick="deleteNotice('${n.id}')">Delete</button>
      </div>
    </div>`;
    container.appendChild(el);
  });
}

function editNotice(id){
  const notices = load('notices');
  const n = notices.find(x=>x.id===id);
  if(!n) return;
  const newTitle = prompt('Edit title', n.title);
  if(newTitle===null) return;
  const newText = prompt('Edit text', n.text);
  n.title=newTitle; n.text=newText;
  save('notices', notices);
  renderNotices();
}

function deleteNotice(id){
  if(!confirm('Delete this notice?')) return;
  let notices = load('notices').filter(n=>n.id!==id);
  save('notices', notices);
  renderNotices();
}

/* ------------------------------
   Reports
------------------------------ */
function showReport() {
  const tbody = document.querySelector('#reportTable tbody');
  tbody.innerHTML = ''; // Clear previous rows

  const students = getUsers().filter(u => u.role === 'student');
  const attendance = load('attendance');

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No students found</td></tr>`;
    return;
  }

  const allDates = [...new Set(attendance.map(a => a.date))];
  const totalDays = allDates.length || 0;

  students.forEach((s, index) => {
    const studentAttendance = attendance.filter(a => a.studentId === s.id && a.status === 'present');
    const presentCount = studentAttendance.length;
    const percent = totalDays ? Math.round((presentCount / totalDays) * 100) : 0;
    const datesList = studentAttendance.map(a => a.date).join(', ') || 'No attendance';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${s.name}</td>
      <td>${presentCount} / ${totalDays} (${percent}%)</td>
      <td>${datesList}</td>
    `;
    tbody.appendChild(tr);
  });
}



/* ------------------------------
   Student Dashboard
------------------------------ */
function renderStudentAttendanceReport() {
  if (!currentUser || currentUser.role !== 'student') return;

  const studentId = currentUser.id;
  const tbody = document.querySelector('#studentAttTable tbody');
  tbody.innerHTML = '';

  const attendance = load('attendance');
  const allDates = [...new Set(attendance.map(a => a.date))].sort();
  const studentAttendance = attendance.filter(a => a.studentId === studentId);

  if(allDates.length === 0){
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No attendance recorded yet</td></tr>`;
    return;
  }

  allDates.forEach((date, index) => {
    const rec = studentAttendance.find(a => a.date === date && a.status === 'present');
    const status = rec ? 'Present' : 'Absent';
    const time = rec ? rec.time : '--';

    const tr = document.createElement('tr');
    tr.innerHTML = `
              <td>${index + 1}</td>
                <td class="center">${date}</td>
                <td class="center">${status}</td>
      <td class="center">${time}</td>
    `;
    tbody.appendChild(tr);
  });

  const presentCount = studentAttendance.length;
  const totalDays = allDates.length;
  const pct = totalDays ? Math.round((presentCount/totalDays)*100) : 0;

  const info = document.getElementById('studentInfo');
  info.innerHTML = `<div><strong>${currentUser.name}</strong> (Roll: ${currentUser.roll||'--'})</div>
                    <div class="small-muted">Present: ${presentCount} / ${totalDays} days (${pct}%).</div>`;
}


function renderStudentNotices(){
  const notices = load('notices');
  const container = document.getElementById('studentNotices');
  container.innerHTML='';
  if(notices.length===0) container.innerHTML='<div class="small-muted">No notices</div>';
  notices.forEach(n=>{
    const el = document.createElement('div');
    el.className='notice';
    el.innerHTML=`<strong>${n.title}</strong><div class="small-muted">${n.date}</div><div style="margin-top:6px">${n.text}</div>`;
    container.appendChild(el);
  });
}

/* ------------------------------
   Initial refresh
------------------------------ */
refreshStudentSelect();
