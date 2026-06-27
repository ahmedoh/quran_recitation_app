// System State & Databases
let currentUser = null;
let database = {
  students: [],
  logs: [],
  payments: [],
  pendingCerts: [],
  bannedTeachers: {
    assistant1: false,
    assistant2: false
  },
  theme: 'dark' // default
};

// Seed Mock Data if LocalStorage is empty
function seedMockData() {
  if (localStorage.getItem('quran_app_db')) {
    database = JSON.parse(localStorage.getItem('quran_app_db'));
    return;
  }

  // 1. Initial Students
  database.students = [
    {
      id: "std_1",
      name: "أحمد محمد العباسي",
      phone: "01099887766",
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      amount: 150,
      payMethod: "فودافون كاش",
      homework: "مراجعة جزء عم وتسميع سورة الملك"
    },
    {
      id: "std_2",
      name: "سارة محمود حسن",
      phone: "01234567890",
      subDate: "2026-05-15",
      renewDate: "2026-06-15", // Expired subscription
      amount: 100,
      payMethod: "نقدي (كاش)",
      homework: "حفظ أول 10 آيات من سورة الكهف"
    },
    {
      id: "std_3",
      name: "يوسف أحمد عبد الله",
      phone: "01511223344",
      subDate: "2026-06-25",
      renewDate: "2026-07-25",
      amount: 200,
      payMethod: "تحويل بنكي",
      homework: "تسميع جزء تبارك كاملاً"
    }
  ];

  // 2. Initial Logs
  database.logs = [
    {
      id: "log_1",
      date: "2026-06-25 10:30",
      studentId: "std_1",
      studentName: "أحمد محمد العباسي",
      teacherRole: "admin",
      teacherName: "د. أحمد فاضل",
      type: "اختبار عشوائي",
      content: "سورة الملك - الآية 5 (صفحة 562)",
      evaluation: "ممتاز مرتفع (100%)",
      notes: "حفظ ممتاز وضبط متقن لأحكام المدود"
    },
    {
      id: "log_2",
      date: "2026-06-26 18:15",
      studentId: "std_2",
      studentName: "سارة محمود حسن",
      teacherRole: "assistant2",
      teacherName: "مساعد أحمد فاضل 2",
      type: "تسميع محدد",
      content: "سورة الكهف - من الآية 1 إلى 10",
      evaluation: "جيد جداً (70%)",
      notes: "أخطأت في مخرج حرف الضاد وتكرر التردد في الآية 7"
    }
  ];

  // 3. Initial Payments
  database.payments = [
    {
      id: "pay_1",
      date: "2026-06-01",
      studentId: "std_1",
      studentName: "أحمد محمد العباسي",
      amount: 150,
      payMethod: "فودافون كاش",
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      recordedBy: "مساعد أحمد فاضل 1",
      notes: "دفعة شهر يونيو"
    },
    {
      id: "pay_2",
      date: "2026-05-15",
      studentId: "std_2",
      studentName: "سارة محمود حسن",
      amount: 100,
      payMethod: "نقدي (كاش)",
      subDate: "2026-05-15",
      renewDate: "2026-06-15",
      recordedBy: "د. أحمد فاضل",
      notes: "دفعة كاش بالمسجد"
    },
    {
      id: "pay_3",
      date: "2026-06-25",
      studentId: "std_3",
      studentName: "يوسف أحمد عبد الله",
      amount: 200,
      payMethod: "تحويل بنكي",
      subDate: "2026-06-25",
      renewDate: "2026-07-25",
      recordedBy: "مساعد أحمد فاضل 1",
      notes: "محول من حساب بنك مصر"
    }
  ];

  // 4. Initial Pending Certificates
  database.pendingCerts = [
    {
      id: "cert_req_1",
      date: "2026-06-26",
      studentId: "std_3",
      studentName: "يوسف أحمد عبد الله",
      part: "جزء تبارك كامل",
      level: "silver",
      evaluation: "امتياز مع مرتبة الشرف",
      teacherName: "مساعد أحمد فاضل 2"
    }
  ];

  database.bannedTeachers = {
    assistant1: false,
    assistant2: false
  };
  
  database.theme = 'dark';

  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem('quran_app_db', JSON.stringify(database));
}

// Global App Initialization
window.addEventListener('DOMContentLoaded', () => {
  seedMockData();
  applyTheme(database.theme || 'dark');
  checkSession();
  populateDropdowns();
});

// Theme Management
function toggleTheme() {
  const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  applyTheme(newTheme);
  database.theme = newTheme;
  saveToLocalStorage();
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
}

// User Authentication Session check
function checkSession() {
  const session = sessionStorage.getItem('quran_app_session');
  if (session) {
    currentUser = JSON.parse(session);
    
    // Check if banned
    if (database.bannedTeachers[currentUser.username]) {
      alert("عذراً، لقد تم حظر هذا الحساب من قبل د. أحمد فاضل.");
      handleLogout();
      return;
    }
    
    showDashboard();
  } else {
    showLogin();
  }
}

function handleLogin(event) {
  event.preventDefault();
  const userSelect = document.getElementById('loginUser').value;
  const passwordInput = document.getElementById('loginPassword').value.trim();
  const errorMsg = document.getElementById('loginError');

  let valid = false;
  let roleName = "";
  let fullName = "";

  if (userSelect === 'admin' && passwordInput === '2486') {
    valid = true;
    roleName = "admin";
    fullName = "د. أحمد فاضل";
  } else if (userSelect === 'assistant1' && passwordInput === '1') {
    // Check ban status
    if (database.bannedTeachers.assistant1) {
      alert("هذا الحساب محظور حالياً.");
      return;
    }
    valid = true;
    roleName = "assistant1";
    fullName = "مساعد أحمد فاضل 1";
  } else if (userSelect === 'assistant2' && passwordInput === '2') {
    // Check ban status
    if (database.bannedTeachers.assistant2) {
      alert("هذا الحساب محظور حالياً.");
      return;
    }
    valid = true;
    roleName = "assistant2";
    fullName = "مساعد أحمد فاضل 2";
  }

  if (valid) {
    currentUser = { username: userSelect, role: roleName, name: fullName };
    sessionStorage.setItem('quran_app_session', JSON.stringify(currentUser));
    errorMsg.style.display = 'none';
    document.getElementById('loginPassword').value = '';
    showDashboard();
  } else {
    errorMsg.style.display = 'block';
  }
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('quran_app_session');
  showLogin();
}

function showLogin() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('appContainer').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';

  // Set Profile Section
  document.getElementById('currentUserName').innerText = currentUser.name;
  document.getElementById('currentUserAvatar').innerText = currentUser.name.charAt(0);
  
  let roleTitle = "";
  if (currentUser.role === 'admin') roleTitle = "مدير النظام ومالك الأكاديمية";
  else if (currentUser.role === 'assistant1') roleTitle = "إداري تسجيل وماليات";
  else if (currentUser.role === 'assistant2') roleTitle = "مشرف ومعلم تسميع";
  document.getElementById('currentUserRole').innerText = roleTitle;

  // Apply Role-Based Navigation Restrictions
  setupRoleUI();

  // Render content
  renderStats();
  renderStudentsTable();
  renderRecitationTable();
  
  // Default to students tab
  switchTab('students');
}

function setupRoleUI() {
  // Hide all optional tabs first
  document.getElementById('nav-logs').style.display = 'none';
  document.getElementById('nav-financials').style.display = 'none';
  document.getElementById('nav-pending-certs').style.display = 'none';
  document.getElementById('nav-admin').style.display = 'none';
  document.getElementById('btnAddNewStudent').style.display = 'none';
  document.getElementById('btnAddNewPayment').style.display = 'none';

  if (currentUser.role === 'admin') {
    document.getElementById('nav-logs').style.display = 'flex';
    document.getElementById('nav-financials').style.display = 'flex';
    document.getElementById('nav-pending-certs').style.display = 'flex';
    document.getElementById('nav-admin').style.display = 'flex';
    document.getElementById('btnAddNewStudent').style.display = 'block';
    document.getElementById('btnAddNewPayment').style.display = 'block';
    renderLogsTable();
    renderPaymentsTable();
    renderPendingCertsTable();
    renderAdminPanel();
  } 
  else if (currentUser.role === 'assistant1') {
    document.getElementById('nav-financials').style.display = 'flex';
    document.getElementById('btnAddNewStudent').style.display = 'block';
    document.getElementById('btnAddNewPayment').style.display = 'block';
    renderPaymentsTable();
  }
  else if (currentUser.role === 'assistant2') {
    // Only has Students list & Recitation list (both visible by default)
  }
}

// Tab Switching
function switchTab(tabId) {
  // Toggle active class on sidebar buttons
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle active tab screen
  document.querySelectorAll('.tab-screen').forEach(screen => screen.classList.remove('active'));
  const activeScreen = document.getElementById(`screen-${tabId}`);
  if (activeScreen) activeScreen.classList.add('active');
  
  // Refresh specific views on open
  if (tabId === 'students') {
    renderStats();
    renderStudentsTable();
  } else if (tabId === 'recitation') {
    renderRecitationTable();
  } else if (tabId === 'logs') {
    renderLogsTable();
  } else if (tabId === 'financials') {
    renderPaymentsTable();
  } else if (tabId === 'pending-certs') {
    renderPendingCertsTable();
  }
}

// Stats Card Calculation
function renderStats() {
  const total = database.students.length;
  
  // Subscription is active if renew date >= today
  const today = new Date().toISOString().split('T')[0];
  const activeCount = database.students.filter(std => std.renewDate >= today).length;
  const expiredCount = total - activeCount;

  document.getElementById('statTotalStudents').innerText = total;
  document.getElementById('statSubscribedStudents').innerText = activeCount;
  document.getElementById('statUnsubscribedStudents').innerText = expiredCount;
}

// Student Filtering State
let currentStudentFilter = 'all';

function filterStudents(filterType) {
  currentStudentFilter = filterType;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`student-filter-${filterType === 'subscribed' ? 'sub' : filterType === 'unsubscribed' ? 'unsub' : 'all'}`).classList.add('active');
  renderStudentsTable();
}

// Render Students Table (Tab 1)
function renderStudentsTable() {
  const searchVal = document.getElementById('studentSearchInput').value.toLowerCase();
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '';

  const today = new Date().toISOString().split('T')[0];

  database.students.forEach(std => {
    // Search filter
    const matchesSearch = std.name.toLowerCase().includes(searchVal) || std.phone.includes(searchVal);
    
    // Status filter
    const isSubscribed = std.renewDate >= today;
    let matchesStatus = true;
    if (currentStudentFilter === 'subscribed' && !isSubscribed) matchesStatus = false;
    if (currentStudentFilter === 'unsubscribed' && isSubscribed) matchesStatus = false;

    if (matchesSearch && matchesStatus) {
      const tr = document.createElement('tr');
      
      const statusBadge = isSubscribed 
        ? `<span class="badge success">مشترك نشط</span>` 
        : `<span class="badge danger">منتهي الاشتراك</span>`;

      // Define buttons based on role
      let actionButtons = "";
      if (currentUser.role === 'admin' || currentUser.role === 'assistant1') {
        actionButtons = `
          <button class="btn-sm primary" onclick="openEditStudentModal('${std.id}')"><i class="fa-solid fa-edit"></i> تعديل</button>
          <button class="btn-sm danger" onclick="deleteStudent('${std.id}')"><i class="fa-solid fa-trash"></i> حذف</button>
          <button class="btn-sm accent" onclick="openDirectPaymentModal('${std.id}')"><i class="fa-solid fa-receipt"></i> دفع</button>
        `;
      } else {
        // Teacher view
        actionButtons = `
          <button class="btn-sm primary" onclick="switchTab('recitation')">تسميع / اختبار</button>
        `;
      }

      tr.innerHTML = `
        <td style="font-weight:700;">${std.name}</td>
        <td>${std.phone}</td>
        <td>${std.subDate}</td>
        <td>${std.renewDate}</td>
        <td style="font-weight:bold; color:var(--accent-color);">${std.amount || 0} ج.م</td>
        <td>${std.payMethod || '---'}</td>
        <td>${statusBadge}</td>
        <td style="font-size:0.8rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${std.homework || 'لا يوجد واجب'}">${std.homework || 'لا يوجد واجب'}</td>
        <td>
          <div class="btn-icon-group">${actionButtons}</div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد طلاب مطابقين للبحث.</td></tr>`;
  }
}

// Student Modal operations
function openAddStudentModal() {
  document.getElementById('studentModalTitle').innerText = "إضافة طالب جديد";
  document.getElementById('studentId').value = "";
  document.getElementById('studentForm').reset();
  
  // Auto fill dates
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  document.getElementById('studentSubDate').value = today;
  document.getElementById('studentRenewDate').value = nextMonthStr;

  document.getElementById('studentModal').classList.add('active');
}

function openEditStudentModal(id) {
  const std = database.students.find(s => s.id === id);
  if (!std) return;

  document.getElementById('studentModalTitle').innerText = "تعديل بيانات الطالب";
  document.getElementById('studentId').value = std.id;
  document.getElementById('studentName').value = std.name;
  document.getElementById('studentPhone').value = std.phone;
  document.getElementById('studentSubDate').value = std.subDate;
  document.getElementById('studentRenewDate').value = std.renewDate;
  document.getElementById('studentAmount').value = std.amount || 100;
  document.getElementById('studentPayMethod').value = std.payMethod || 'فودافون كاش';

  document.getElementById('studentModal').classList.add('active');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.remove('active');
}

function saveStudent(event) {
  event.preventDefault();
  const id = document.getElementById('studentId').value;
  const name = document.getElementById('studentName').value.trim();
  const phone = document.getElementById('studentPhone').value.trim();
  const subDate = document.getElementById('studentSubDate').value;
  const renewDate = document.getElementById('studentRenewDate').value;
  const amount = parseFloat(document.getElementById('studentAmount').value);
  const payMethod = document.getElementById('studentPayMethod').value;

  if (id) {
    // Edit existing
    const idx = database.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      // Check if amount or dates changed, log a payment if so
      const old = database.students[idx];
      if (old.subDate !== subDate || old.amount !== amount || old.payMethod !== payMethod) {
        logNewPaymentRecord(old.id, name, amount, payMethod, subDate, renewDate, "تحديث تعديل بيانات الطالب");
      }
      database.students[idx] = { ...old, name, phone, subDate, renewDate, amount, payMethod };
    }
  } else {
    // Add new
    const newId = "std_" + Date.now();
    database.students.push({
      id: newId,
      name,
      phone,
      subDate,
      renewDate,
      amount,
      payMethod,
      homework: ""
    });
    // Log initial payment
    logNewPaymentRecord(newId, name, amount, payMethod, subDate, renewDate, "رسم اشتراك ابتدائي جديد");
  }

  saveToLocalStorage();
  closeStudentModal();
  renderStats();
  renderStudentsTable();
}

function deleteStudent(id) {
  if (confirm("هل أنت متأكد من رغبتك في حذف هذا الطالب نهائياً من النظام؟ جميع سجلات التسميع والدفع الخاصة به ستُحذف.")) {
    database.students = database.students.filter(s => s.id !== id);
    database.logs = database.logs.filter(l => l.studentId !== id);
    database.payments = database.payments.filter(p => p.studentId !== id);
    saveToLocalStorage();
    renderStats();
    renderStudentsTable();
  }
}

// Payment logging helper
function logNewPaymentRecord(studentId, studentName, amount, payMethod, subDate, renewDate, notes = "") {
  const newPayLog = {
    id: "pay_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    date: new Date().toISOString().split('T')[0],
    studentId,
    studentName,
    amount,
    payMethod,
    subDate,
    renewDate,
    recordedBy: currentUser.name,
    notes: notes || "تجديد اشتراك دوري"
  };
  database.payments.unshift(newPayLog);
}

// Direct payment recording modal
function openDirectPaymentModal(studentId) {
  openAddPaymentModal();
  document.getElementById('payStudentId').value = studentId;
}

// Open general Payment modal
function openAddPaymentModal() {
  const select = document.getElementById('payStudentId');
  select.innerHTML = '';
  database.students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.innerText = s.name;
    select.appendChild(opt);
  });

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  document.getElementById('payAmount').value = 100;
  document.getElementById('payDate').value = today;
  document.getElementById('payRenewDate').value = nextMonthStr;
  document.getElementById('payNotes').value = "";

  document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
}

function savePayment(event) {
  event.preventDefault();
  const studentId = document.getElementById('payStudentId').value;
  const amount = parseFloat(document.getElementById('payAmount').value);
  const payMethod = document.getElementById('payMethod').value;
  const subDate = document.getElementById('payDate').value;
  const renewDate = document.getElementById('payRenewDate').value;
  const notes = document.getElementById('payNotes').value.trim();

  const student = database.students.find(s => s.id === studentId);
  if (!student) return;

  // Update student financial/renewal state
  student.subDate = subDate;
  student.renewDate = renewDate;
  student.amount = amount;
  student.payMethod = payMethod;

  // Save log
  logNewPaymentRecord(studentId, student.name, amount, payMethod, subDate, renewDate, notes);

  saveToLocalStorage();
  closePaymentModal();
  renderStats();
  renderStudentsTable();
  if (currentUser.role === 'admin' || currentUser.role === 'assistant1') {
    renderPaymentsTable();
  }
}

// Render Payments Table
function renderPaymentsTable() {
  const tbody = document.getElementById('paymentsTableBody');
  tbody.innerHTML = '';

  database.payments.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.date}</td>
      <td style="font-weight:700;">${p.studentName}</td>
      <td style="font-weight:bold; color:var(--accent-color);">${p.amount} ج.م</td>
      <td><span class="badge info">${p.payMethod}</span></td>
      <td>${p.subDate}</td>
      <td>${p.renewDate}</td>
      <td>${p.recordedBy}</td>
      <td style="font-size:0.8rem; color:var(--text-secondary);">${p.notes || '---'}</td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد دفعات مسجلة بعد.</td></tr>`;
  }
}

// ==================== RECITATION & TESTING TAB ====================

function renderRecitationTable() {
  const searchVal = document.getElementById('recitationSearchInput').value.toLowerCase();
  const tbody = document.getElementById('recitationTableBody');
  tbody.innerHTML = '';

  database.students.forEach(std => {
    if (std.name.toLowerCase().includes(searchVal) || std.phone.includes(searchVal)) {
      // Find latest recitation log for this student
      const stdLogs = database.logs.filter(l => l.studentId === std.id && l.type !== "واجب منزلي");
      const latestPart = stdLogs.length > 0 ? stdLogs[0].content : "لا يوجد تسميع سابق";

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700;">${std.name}</td>
        <td>${std.phone}</td>
        <td style="font-size:0.85rem; color:var(--accent-color); font-weight:600;">${latestPart}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${std.homework || 'لم يحدد واجب'}</td>
        <td>
          <button class="btn-sm primary" onclick="openRecitationSession('${std.id}')">
            <i class="fa-solid fa-bolt"></i> بدء جلسة تسميع / اختبار
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد طلاب للمراجعة.</td></tr>`;
  }
}

// Active student session inside popup
let activeSessionStudentId = null;
let currentPopupTab = 'random';
let currentRandomAyah = null;
let randomTestChecklist = {
  h: true, // Hifdh
  t: true, // Tajweed
  m: true, // Makharij
  w: true  // Waqf
};
let reciteChecklist = {
  h: true,
  t: true,
  m: true,
  w: true
};

function openRecitationSession(studentId) {
  const std = database.students.find(s => s.id === studentId);
  if (!std) return;

  activeSessionStudentId = studentId;
  document.getElementById('sessionModalTitle').innerText = `تسميع واختبار الطالب: ${std.name}`;
  
  // Reset tabs & fields
  switchPopupTab('random');
  document.getElementById('randomQuestionBox').style.display = 'none';
  document.getElementById('randNotes').value = "";
  
  // Setup standard recite defaults
  document.getElementById('reciteJuz').value = "";
  document.getElementById('reciteVerseDisplayContainer').style.display = 'none';
  document.getElementById('recNotes').value = "";
  
  // Setup homework field
  document.getElementById('hwDescription').value = std.homework || "";

  // Setup certificate pre-fill
  document.getElementById('certStudentName').innerText = std.name;
  document.getElementById('certPart').value = "";
  document.getElementById('certLevel').value = "bronze";
  updateCertificatePreview();

  // Populate surah list
  populateSurahsList();
  
  document.getElementById('recitationSessionModal').classList.add('active');
}

function closeRecitationSessionModal() {
  document.getElementById('recitationSessionModal').classList.remove('active');
  renderRecitationTable();
}

function switchPopupTab(tabId) {
  currentPopupTab = tabId;
  document.querySelectorAll('.popup-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-btn-${tabId}`).classList.add('active');

  document.querySelectorAll('.popup-tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`popup-tab-${tabId}`).classList.add('active');
}

// Populate Surahs & Juz Dropdowns
function populateDropdowns() {
  // Populate Specific Recitation dropdowns
  const surahSelect = document.getElementById('reciteSurah');
  surahSelect.innerHTML = '<option value="">-- اختر السورة --</option>';
  
  QURAN_DATA.surahs.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.number;
    opt.innerText = `سورة ${s.name} (${s.ayahsCount} آية)`;
    surahSelect.appendChild(opt);
  });

  const juzSelect = document.getElementById('reciteJuz');
  juzSelect.innerHTML = '<option value="">-- اختر الجزء --</option>';
  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = `الجزء ${i}`;
    juzSelect.appendChild(opt);
  }
}

function populateSurahsList() {
  // Already populated by populateDropdowns globally
}

function updateReciteAyahOptions() {
  const surahNum = parseInt(document.getElementById('reciteSurah').value);
  const startSelect = document.getElementById('reciteStartAyah');
  const endSelect = document.getElementById('reciteEndAyah');

  startSelect.innerHTML = '';
  endSelect.innerHTML = '';

  if (isNaN(surahNum)) {
    document.getElementById('reciteVerseDisplayContainer').style.display = 'none';
    return;
  }

  const surah = QURAN_DATA.surahs.find(s => s.number === surahNum);
  if (!surah) return;

  for (let i = 1; i <= surah.ayahsCount; i++) {
    const optStart = document.createElement('option');
    optStart.value = i;
    optStart.innerText = `آية ${i}`;
    startSelect.appendChild(optStart);

    const optEnd = document.createElement('option');
    optEnd.value = i;
    optEnd.innerText = `آية ${i}`;
    endSelect.appendChild(optEnd);
  }

  // Pre-select first and last ayahs
  startSelect.value = 1;
  endSelect.value = surah.ayahsCount;

  // Bind change events to show verses text
  startSelect.onchange = showReciteVersesText;
  endSelect.onchange = showReciteVersesText;

  showReciteVersesText();
}

function showReciteVersesText() {
  const surahNum = parseInt(document.getElementById('reciteSurah').value);
  const start = parseInt(document.getElementById('reciteStartAyah').value);
  const end = parseInt(document.getElementById('reciteEndAyah').value);

  if (isNaN(surahNum) || isNaN(start) || isNaN(end)) return;

  // Filter verses
  const verses = QURAN_DATA.ayahs.filter(a => a.surah === surahNum && a.number >= start && a.number <= end);
  const textBox = document.getElementById('reciteVerseText');
  textBox.innerHTML = '';

  verses.forEach(v => {
    textBox.innerHTML += `${v.text} ﴿${v.number}﴾ `;
  });

  document.getElementById('reciteVerseDisplayContainer').style.display = 'block';
}

// -------------------- EVALUATION CHECKLISTS --------------------

function toggleCheck(prefix, pass) {
  // prefix is 'rand-h', 'rand-t', etc.
  const category = prefix.split('-')[1]; // 'h', 't', 'm', 'w'
  const isRandom = prefix.split('-')[0] === 'rand';

  const passBtn = document.getElementById(`chk-${prefix}-pass`);
  const failBtn = document.getElementById(`chk-${prefix}-fail`);

  if (pass) {
    passBtn.classList.add('active');
    failBtn.classList.remove('active');
    if (isRandom) randomTestChecklist[category] = true;
    else reciteChecklist[category] = true;
  } else {
    passBtn.classList.remove('active');
    failBtn.classList.add('active');
    if (isRandom) randomTestChecklist[category] = false;
    else reciteChecklist[category] = false;
  }

  calculateEvaluationGrade(isRandom);
}

function calculateEvaluationGrade(isRandom) {
  const checklist = isRandom ? randomTestChecklist : reciteChecklist;
  let correctCount = 0;
  if (checklist.h) correctCount++;
  if (checklist.t) correctCount++;
  if (checklist.m) correctCount++;
  if (checklist.w) correctCount++;

  let grade = "";
  if (correctCount === 4) grade = "ممتاز مرتفع (100%)";
  else if (correctCount === 3) grade = "ممتاز (85%)";
  else if (correctCount === 2) grade = "جيد جداً (70%)";
  else if (correctCount === 1) grade = "مقبول (50%)";
  else grade = "ضعيف (30%)";

  const display = document.getElementById(isRandom ? 'randGradeDisplay' : 'recGradeDisplay');
  display.innerText = grade;
  
  // Set styling color
  if (correctCount >= 3) {
    display.style.color = 'var(--accent-color)';
  } else if (correctCount === 2) {
    display.style.color = 'var(--warning-color)';
  } else {
    display.style.color = 'var(--danger-color)';
  }
}

// -------------------- RANDOM TEST GENERATION --------------------

function generateRandomQuranQuestion() {
  // Reset checklist
  randomTestChecklist = { h: true, t: true, m: true, w: true };
  toggleCheck('rand-h', true);
  toggleCheck('rand-t', true);
  toggleCheck('rand-m', true);
  toggleCheck('rand-w', true);
  
  // Pick random Ayah
  const totalVerses = QURAN_DATA.ayahs.length;
  const randomIndex = Math.floor(Math.random() * totalVerses);
  const pickedAyah = QURAN_DATA.ayahs[randomIndex];
  
  currentRandomAyah = pickedAyah;

  // Render metadata
  document.getElementById('randSurahName').innerText = pickedAyah.surahName;
  document.getElementById('randAyahNum').innerText = pickedAyah.number;
  document.getElementById('randPageNum').innerText = pickedAyah.page;
  document.getElementById('randJuzNum').innerText = pickedAyah.juz;
  document.getElementById('randHizbNum').innerText = pickedAyah.hizb;

  // Render target verse
  document.getElementById('randVerseText').innerText = pickedAyah.text;

  // Find other verses on the same page
  const pageVerses = QURAN_DATA.ayahs.filter(a => a.page === pickedAyah.page);
  let surroundingText = "";
  pageVerses.forEach(v => {
    if (v.number === pickedAyah.number) {
      surroundingText += `<span style="color:var(--accent-color); font-weight:800; text-decoration: underline;">${v.text} ﴿${v.number}﴾</span> `;
    } else {
      surroundingText += `${v.text} ﴿${v.number}﴾ `;
    }
  });
  document.getElementById('randSurroundingVerses').innerHTML = surroundingText;

  // Display Box
  document.getElementById('randomQuestionBox').style.display = 'block';
}

function saveRandomTestResult() {
  if (!currentRandomAyah) return;
  const student = database.students.find(s => s.id === activeSessionStudentId);
  if (!student) return;

  const notes = document.getElementById('randNotes').value.trim();
  const evaluation = document.getElementById('randGradeDisplay').innerText;

  const log = {
    id: "log_" + Date.now(),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    studentId: student.id,
    studentName: student.name,
    teacherRole: currentUser.role,
    teacherName: currentUser.name,
    type: "اختبار عشوائي",
    content: `${currentRandomAyah.surahName} - آية ${currentRandomAyah.number} (صفحة ${currentRandomAyah.page})`,
    evaluation,
    notes
  };

  database.logs.unshift(log);
  saveToLocalStorage();
  alert("تم حفظ نتيجة الاختبار العشوائي بنجاح في السجل.");
  closeRecitationSessionModal();
}

// -------------------- SPECIFIC RECITATION SAVE --------------------

function saveRecitationResult() {
  const student = database.students.find(s => s.id === activeSessionStudentId);
  if (!student) return;

  const surahNum = parseInt(document.getElementById('reciteSurah').value);
  const start = document.getElementById('reciteStartAyah').value;
  const end = document.getElementById('reciteEndAyah').value;
  const juzNum = document.getElementById('reciteJuz').value;

  let contentDetails = "";
  if (!isNaN(surahNum)) {
    const surah = QURAN_DATA.surahs.find(s => s.number === surahNum);
    contentDetails = `سورة ${surah.name} (من آية ${start} إلى ${end})`;
  } else if (juzNum) {
    contentDetails = `الجزء رقم ${juzNum}`;
  } else {
    alert("يرجى اختيار السورة أو الجزء المراد تسميعه أولاً.");
    return;
  }

  const notes = document.getElementById('recNotes').value.trim();
  const evaluation = document.getElementById('recGradeDisplay').innerText;

  const log = {
    id: "log_" + Date.now(),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    studentId: student.id,
    studentName: student.name,
    teacherRole: currentUser.role,
    teacherName: currentUser.name,
    type: "تسميع محدد",
    content: contentDetails,
    evaluation,
    notes
  };

  database.logs.unshift(log);
  saveToLocalStorage();
  alert("تم حفظ سجل التسميع بنجاح.");
  closeRecitationSessionModal();
}

// -------------------- HOMEWORK ASSIGNMENT SAVE --------------------

function saveHomework() {
  const student = database.students.find(s => s.id === activeSessionStudentId);
  if (!student) return;

  const desc = document.getElementById('hwDescription').value.trim();
  student.homework = desc;

  // Log homework assignment
  const log = {
    id: "log_" + Date.now(),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    studentId: student.id,
    studentName: student.name,
    teacherRole: currentUser.role,
    teacherName: currentUser.name,
    type: "تعديل واجب",
    content: desc || "تم إفراغ الواجب",
    evaluation: "---",
    notes: ""
  };
  database.logs.unshift(log);

  saveToLocalStorage();
  alert("تم حفظ الواجب الجديد للطالب بنجاح.");
  closeRecitationSessionModal();
}

// -------------------- CERTIFICATE GENERATION --------------------

function updateCertificatePreview() {
  const name = document.getElementById('certStudentName').innerText;
  let part = document.getElementById('certPart').value.trim();
  const level = document.getElementById('certLevel').value;

  if (!part) part = "(الجزء المحدد)";

  // Update card level styling classes
  const card = document.getElementById('certLivePreview');
  card.className = `cert-preview-card level-${level}`;

  // Watermark text
  let levelAr = "";
  if (level === 'bronze') {
    levelAr = "برونزي";
    document.getElementById('certWatermark').innerText = "حزب";
  } else if (level === 'silver') {
    levelAr = "فضي";
    document.getElementById('certWatermark').innerText = "جزء";
  } else if (level === 'gold') {
    levelAr = "ذهبي";
    document.getElementById('certWatermark').innerText = "تميز";
  } else if (level === 'diamond') {
    levelAr = "ماسي";
    document.getElementById('certWatermark').innerText = "إتقان";
  }

  // Set date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('certDateSpan').innerText = today;

  // Set text
  document.getElementById('certDynamicText').innerHTML = `
    قد أتم بنجاح تسميع ومراجعة <strong>(${part})</strong> بتقدير ممتاز وأظهر تفوقاً بارزاً ومراعاة لأحكام التجويد ومخارج الحروف، وبناءاً عليه مُنح هذه الشهادة تشجيعاً له على الاستمرار.
  `;

  // Action button text & permissions check
  const btn = document.getElementById('btnActionCert');
  const widget = document.getElementById('certApprovalStatusWidget');
  
  if (currentUser.role === 'admin') {
    btn.innerHTML = `<i class="fa-solid fa-print"></i> طباعة الشهادة للكمبيوتر`;
    widget.innerHTML = `<span style="color:var(--accent-color);">صلاحية كاملة: سيتم طباعة الشهادة مباشرة للتحميل كـ PDF.</span>`;
  } else {
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> تقديم طلب اعتماد الشهادة`;
    widget.innerHTML = `<span style="color:var(--warning-color);">تنبيه: يجب موافقة د. أحمد فاضل أولاً قبل الطباعة.</span>`;
  }
}

// Bind live text changes
document.getElementById('certPart').addEventListener('input', updateCertificatePreview);

function triggerCertificateAction() {
  const student = database.students.find(s => s.id === activeSessionStudentId);
  if (!student) return;

  const part = document.getElementById('certPart').value.trim();
  const level = document.getElementById('certLevel').value;

  if (!part) {
    alert("يرجى تحديد الجزء أو الحفظ المنجز للشهادة أولاً.");
    return;
  }

  if (currentUser.role === 'admin') {
    // Print directly
    printCertificate(student.name, part, level);
  } else {
    // Submit request
    const req = {
      id: "cert_req_" + Date.now(),
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      part,
      level,
      evaluation: "ممتاز",
      teacherName: currentUser.name
    };
    database.pendingCerts.push(req);
    saveToLocalStorage();
    alert("تم إرسال طلب الشهادة للدكتور أحمد فاضل للاعتماد بنجاح.");
    closeRecitationSessionModal();
  }
}

function printCertificate(studentName, part, level) {
  // Generate HTML for printer
  const container = document.getElementById('print-certificate-container');
  
  let levelText = "";
  if (level === 'bronze') levelText = "حزب";
  else if (level === 'silver') levelText = "جزء";
  else if (level === 'gold') levelText = "تميز";
  else if (level === 'diamond') levelText = "إتقان";

  container.innerHTML = `
    <div class="cert-preview-card level-${level}">
      <div class="watermark">${levelText}</div>
      <div class="cert-header">أكاديمية أحمد فاضل لتعليم القرآن الكريم</div>
      <h4 style="font-size:2.5rem; margin-top:20px; font-weight:800;">شَهَادَةُ تَمَيُّزٍ وَتَفَوُّقٍ</h4>
      <div class="cert-text" style="font-size:1.2rem; margin-top:20px;">تشهد الأكاديمية ببالغ السرور أن الطالب / الطالبة:</div>
      <div class="student-name" style="font-size:2.8rem; margin: 15px 0;">${studentName}</div>
      <div class="cert-text" style="font-size:1.3rem; line-height:2; max-width:85%;">
        قد أتم بنجاح ومثابرة تسميع ومراجعة <strong>(${part})</strong> بتقدير ممتاز، وقد أظهر انضباطاً متكاملاً في أحكام التجويد ومخارج الحروف العربية.
      </div>
      <div class="cert-footer" style="width:90%; font-size:1rem; margin-top:30px;">
        <div>التاريخ: ${new Date().toISOString().split('T')[0]}</div>
        <div class="signature">
          <span>مشرف عام الأكاديمية</span>
          <strong class="name" style="font-size:1.2rem;">د. أحمد فاضل</strong>
        </div>
      </div>
    </div>
  `;

  // Trigger print
  window.print();
}

// ==================== LOGS & MONITORING TAB (ADMIN ONLY) ====================

function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = '';

  database.logs.forEach(l => {
    const tr = document.createElement('tr');
    
    // Admin operation delete log
    const deleteBtn = `<button class="btn-sm danger" onclick="deleteLogRecord('${l.id}')"><i class="fa-solid fa-trash-can"></i> حذف</button>`;

    tr.innerHTML = `
      <td>${l.date}</td>
      <td style="font-weight:700;">${l.studentName}</td>
      <td>${l.teacherName}</td>
      <td><span class="badge info">${l.type}</span></td>
      <td style="font-size:0.85rem; max-width:200px;">${l.content}</td>
      <td><span class="badge success">${l.evaluation}</span></td>
      <td style="font-size:0.8rem; color:var(--text-secondary);">${l.notes || '---'}</td>
      <td>${deleteBtn}</td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد سجلات عمليات بعد.</td></tr>`;
  }
}

function deleteLogRecord(id) {
  if (confirm("هل تريد بالتأكيد إزالة هذا السجل من تاريخ التسميع؟")) {
    database.logs = database.logs.filter(l => l.id !== id);
    saveToLocalStorage();
    renderLogsTable();
  }
}

// ==================== PENDING CERTIFICATES TAB (ADMIN ONLY) ====================

function renderPendingCertsTable() {
  const tbody = document.getElementById('pendingCertsTableBody');
  tbody.innerHTML = '';
  
  // Badge count on sidebar
  const count = database.pendingCerts.length;
  const badge = document.getElementById('pendingCertBadge');
  if (count > 0) {
    badge.innerText = count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }

  database.pendingCerts.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700;">${c.studentName}</td>
      <td><strong style="color:var(--accent-color);">${c.part}</strong></td>
      <td>${c.evaluation}</td>
      <td>${c.teacherName}</td>
      <td>${c.date}</td>
      <td>
        <div class="btn-icon-group">
          <button class="btn-sm accent" onclick="approveCertificate('${c.id}')"><i class="fa-solid fa-circle-check"></i> موافقة وطباعة</button>
          <button class="btn-sm danger" onclick="rejectCertificate('${c.id}')"><i class="fa-solid fa-circle-xmark"></i> رفض</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-secondary); padding:30px;">لا توجد طلبات شهادات معلقة بانتظار الاعتماد.</td></tr>`;
  }
}

function approveCertificate(id) {
  const certIndex = database.pendingCerts.findIndex(c => c.id === id);
  if (certIndex === -1) return;

  const cert = database.pendingCerts[certIndex];
  
  // Add to logs
  const log = {
    id: "log_" + Date.now(),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    studentId: cert.studentId,
    studentName: cert.studentName,
    teacherRole: "admin",
    teacherName: currentUser.name,
    type: "إصدار شهادة معتمدة",
    content: `شهادة تسميع: ${cert.part}`,
    evaluation: "ممتاز",
    notes: `مقدمة من المعلم ${cert.teacherName}`
  };
  database.logs.unshift(log);

  // Remove from pending
  database.pendingCerts.splice(certIndex, 1);
  saveToLocalStorage();
  
  // Print
  printCertificate(cert.studentName, cert.part, cert.level);

  renderPendingCertsTable();
}

function rejectCertificate(id) {
  if (confirm("هل تريد بالتأكيد رفض طلب اعتماد هذه الشهادة؟")) {
    database.pendingCerts = database.pendingCerts.filter(c => c.id !== id);
    saveToLocalStorage();
    renderPendingCertsTable();
  }
}

// ==================== ADMIN PANEL, EXPORTS, BACKUP (ADMIN ONLY) ====================

function renderAdminPanel() {
  // Update Ban Buttons statuses
  const ban1 = document.getElementById('ban-btn-assistant1');
  const ban2 = document.getElementById('ban-btn-assistant2');

  if (database.bannedTeachers.assistant1) {
    ban1.innerText = "محظور (إلغاء الحظر)";
    ban1.className = "btn-sm danger";
  } else {
    ban1.innerText = "نشط (حظر)";
    ban1.className = "btn-sm primary";
  }

  if (database.bannedTeachers.assistant2) {
    ban2.innerText = "محظور (إلغاء الحظر)";
    ban2.className = "btn-sm danger";
  } else {
    ban2.innerText = "نشط (حظر)";
    ban2.className = "btn-sm primary";
  }
}

function toggleTeacherBan(teacherKey) {
  database.bannedTeachers[teacherKey] = !database.bannedTeachers[teacherKey];
  saveToLocalStorage();
  renderAdminPanel();
  alert(`تم تعديل حالة الحساب بنجاح.`);
}

// -------------------- EXCEL EXPORT LOGIC --------------------

function exportToExcel(type) {
  if (currentUser.role !== 'admin') {
    alert("عذراً، هذه الصلاحية متوفرة فقط لحساب المدير العام د. أحمد فاضل.");
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  if (type === 'subscribed') {
    const data = database.students
      .filter(s => s.renewDate >= today)
      .map(s => ({
        "اسم الطالب": s.name,
        "رقم الهاتف": s.phone,
        "تاريخ الاشتراك": s.subDate,
        "تاريخ التجديد": s.renewDate,
        "المبلغ المدفوع": s.amount,
        "طريقة الدفع": s.payMethod,
        "الواجب الحالي": s.homework
      }));
    
    downloadExcel(data, "الطلاب المشتركون");
  } 
  else if (type === 'unsubscribed') {
    const data = database.students
      .filter(s => s.renewDate < today)
      .map(s => ({
        "اسم الطالب": s.name,
        "رقم الهاتف": s.phone,
        "تاريخ الاشتراك": s.subDate,
        "تاريخ التجديد": s.renewDate,
        "المبلغ المدفوع": s.amount,
        "طريقة الدفع": s.payMethod,
        "الواجب الحالي": s.homework
      }));
    
    downloadExcel(data, "الطلاب غير المشتركين");
  } 
  else if (type === 'teachers') {
    const data = database.logs.map(l => ({
      "التاريخ والوقت": l.date,
      "اسم الطالب": l.studentName,
      "المعلم / المشرف": l.teacherName,
      "نوع العملية": l.type,
      "المحتوى": l.content,
      "التقييم": l.evaluation,
      "ملاحظات": l.notes
    }));
    
    downloadExcel(data, "سجلات المعلمين والقرآن");
  } 
  else if (type === 'all') {
    // Generate Workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    const activeStds = database.students.filter(s => s.renewDate >= today).map(s => ({
      "الاسم": s.name, "الهاتف": s.phone, "الاشتراك": s.subDate, "التجديد": s.renewDate, "المبلغ": s.amount, "الطريقة": s.payMethod
    }));
    const inactiveStds = database.students.filter(s => s.renewDate < today).map(s => ({
      "الاسم": s.name, "الهاتف": s.phone, "الاشتراك": s.subDate, "التجديد": s.renewDate, "المبلغ": s.amount, "الطريقة": s.payMethod
    }));
    const teacherLogs = database.logs.map(l => ({
      "التاريخ": l.date, "الطالب": l.studentName, "المعلم": l.teacherName, "العملية": l.type, "التفاصيل": l.content, "الدرجة": l.evaluation, "الملاحظات": l.notes
    }));
    const payRecords = database.payments.map(p => ({
      "التاريخ": p.date, "الطالب": p.studentName, "المبلغ": p.amount, "الطريقة": p.payMethod, "المسجل": p.recordedBy, "التفاصيل": p.notes
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activeStds), "الطلاب المشتركون");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inactiveStds), "الطلاب غير المشتركون");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherLogs), "سجلات التسميع");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payRecords), "سجلات المقبوضات والمالية");

    // Write file
    XLSX.writeFile(wb, "أكاديمية_أحمد_فاضل_تقرير_شامل.xlsx");
  }
}

function downloadExcel(jsonData, sheetName) {
  const ws = XLSX.utils.json_to_sheet(jsonData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${sheetName}.xlsx`);
}

// -------------------- BACKUP & RESTORE --------------------

function backupDatabase() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(database));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `نسخة_احتياطية_أكاديمية_أحمد_فاضل_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function restoreDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedDb = JSON.parse(e.target.result);
      
      // Simple verification of fields
      if (importedDb.students && importedDb.logs && importedDb.payments) {
        database = importedDb;
        saveToLocalStorage();
        alert("تم استعادة النسخة الاحتياطية وتحديث قاعدة البيانات بنجاح!");
        // Refresh page
        window.location.reload();
      } else {
        alert("الملف غير متوافق! يرجى التأكد من رفع ملف نسخة احتياطية صالح.");
      }
    } catch (err) {
      alert("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}
