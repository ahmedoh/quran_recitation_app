// V6 System State & Databases
let currentUser = null;
let database = {
  mosques: [],
  teachers: [],
  students: [],
  logs: [],
  payments: [],
  pendingCerts: [],
  notifications: [],
  theme: 'dark' // default
};

// Seeding 4 Default Mosques & Branch Managers with Gold Package
function seedMockData() {
  if (localStorage.getItem('quran_app_db_v6')) {
    database = JSON.parse(localStorage.getItem('quran_app_db_v6'));
    if (!database.notifications) database.notifications = [];
    checkMosqueSubscriptions(); // Run overdue validation checks at startup
    return;
  }

  // 1. Initialize exactly 4 Default Mosques (defaulted to Gold package, monthly)
  database.mosques = [
    {
      id: "mosque_1",
      name: "مسجد قباء",
      package: "gold", // Tiers: "bronze", "gold", "diamond"
      subType: "monthly", // Durations: "monthly", "annual"
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      amount: 500,
      status: "active", // "active" | "blocked"
      createdDate: "2026-06-01"
    },
    {
      id: "mosque_2",
      name: "مسجد التوحيد",
      package: "gold",
      subType: "monthly",
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      amount: 500,
      status: "active",
      createdDate: "2026-06-01"
    },
    {
      id: "mosque_3",
      name: "مسجد التقوى",
      package: "gold",
      subType: "monthly",
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      amount: 500,
      status: "active",
      createdDate: "2026-06-01"
    },
    {
      id: "mosque_4",
      name: "مسجد النور",
      package: "gold",
      subType: "monthly",
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      amount: 500,
      status: "active",
      createdDate: "2026-06-01"
    }
  ];

  // 2. Initialize Mosque Branch Managers (Password: 1)
  database.teachers = [
    {
      id: "mgr_1",
      mosqueId: "mosque_1",
      name: "مدير مسجد قباء",
      password: "1",
      rank: "مدير فرع",
      permissions: { manageStudents: true, manageFinancials: true, testStudents: true, requestCerts: true, viewLogs: true }
    },
    {
      id: "mgr_2",
      mosqueId: "mosque_2",
      name: "مدير مسجد التوحيد",
      password: "1",
      rank: "مدير فرع",
      permissions: { manageStudents: true, manageFinancials: true, testStudents: true, requestCerts: true, viewLogs: true }
    },
    {
      id: "mgr_3",
      mosqueId: "mosque_3",
      name: "مدير مسجد التقوى",
      password: "1",
      rank: "مدير فرع",
      permissions: { manageStudents: true, manageFinancials: true, testStudents: true, requestCerts: true, viewLogs: true }
    },
    {
      id: "mgr_4",
      mosqueId: "mosque_4",
      name: "مدير مسجد النور",
      password: "1",
      rank: "مدير فرع",
      permissions: { manageStudents: true, manageFinancials: true, testStudents: true, requestCerts: true, viewLogs: true }
    }
  ];

  // 3. Initial Active Students
  database.students = [
    {
      id: "std_1",
      mosqueId: "mosque_1",
      name: "أحمد محمد العباسي",
      phone: "01099887766",
      age: 12,
      memorized: "جزء عم وجزء تبارك",
      goal: "حفظ القرآن الكريم كاملاً خلال عامين",
      status: "active",
      subType: "monthly",
      subDate: "2026-06-01",
      renewDate: "2026-07-01",
      amount: 150,
      payMethod: "فودافون كاش",
      homework: "مراجعة جزء عم وتسميع سورة الملك",
      password: "123",
      phoneVerified: true
    }
  ];

  database.logs = [];
  database.payments = [];
  database.pendingCerts = [];
  database.notifications = [];
  database.theme = 'dark';
  saveToLocalStorage();
  checkMosqueSubscriptions();
}

function saveToLocalStorage() {
  localStorage.setItem('quran_app_db_v6', JSON.stringify(database));
}

// -------------------- V6 HARD LOCKOUT ENGINE --------------------

// Define package limits
function getMosqueLimits(packageType) {
  if (packageType === 'bronze') {
    return { teachers: 2, students: 40 };
  } else if (packageType === 'gold') {
    return { teachers: 8, students: 150 };
  } else if (packageType === 'diamond') {
    return { teachers: Infinity, students: Infinity };
  }
  return { teachers: 8, students: 150 }; // default Gold
}

// Check and update mosque subscription status dynamically based on current date
function checkMosqueSubscriptions() {
  let changed = false;
  database.mosques.forEach(m => {
    const diff = getSubscriptionDaysDiff(m.renewDate);
    // If overdue (diff < 0), block mosque directly
    if (diff < 0 && m.status !== 'blocked') {
      m.status = 'blocked';
      changed = true;
      
      // Log notification to owner
      database.notifications.unshift({
        id: "notif_" + Date.now() + "_" + Math.floor(Math.random()*100),
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        mosqueName: m.name,
        teacherName: "النظام التلقائي",
        studentName: "---",
        status: "إيقاف تلقائي",
        message: `⚠️ تنبيه: تم تجميد وإيقاف ترخيص (${m.name}) تلقائياً لتجاوز موعد تجديد الاشتراك (${m.renewDate}). تم حظر دخول الطلاب والمعلمين.`,
        seen: false
      });
    }
  });

  if (changed) {
    saveToLocalStorage();
  }
}

// -------------------- APP INITIALIZATION --------------------

window.addEventListener('DOMContentLoaded', () => {
  seedMockData();
  applyTheme(database.theme || 'dark');
  checkSession();
  populateDropdowns();
  populateMosquesDropdown();
  setupMosqueFilters();
  
  const mosqueSubDateInput = document.getElementById('newMosqueSubDate');
  if (mosqueSubDateInput) {
    mosqueSubDateInput.value = new Date().toISOString().split('T')[0];
  }
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

// Populate Mosques Dropdown
function populateMosquesDropdown() {
  const selects = ['loginMosque', 'regStudentMosque', 'saasTeacherMosque', 'studentFilterMosque', 'teacherFilterMosque'];
  
  selects.forEach(selId => {
    const el = document.getElementById(selId);
    if (!el) return;
    el.innerHTML = selId.includes('Filter') 
      ? '<option value="all">كل المساجد</option>' 
      : '<option value="" disabled selected>اختر المسجد التابع له...</option>';
      
    database.mosques.forEach(m => {
      // Don't hide blocked mosques from dropdowns so users see they exist, but they can't log in
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.innerText = m.name + (m.status === 'blocked' ? ' (موقوف)' : '');
      el.appendChild(opt);
    });
  });
}

// Setup Mosque Filtering Dropdowns for Super Admin
function setupMosqueFilters() {
  const sf = document.getElementById('studentFilterMosque');
  const tf = document.getElementById('teacherFilterMosque');
  if (sf) sf.addEventListener('change', () => renderStudentsTable());
  if (tf) tf.addEventListener('change', () => renderTeachersAdminPanelList());
}

// Tab switcher on Login Card
let activeLoginPortal = 'staff';
function switchLoginPortal(portalType) {
  activeLoginPortal = portalType;
  document.querySelectorAll('.login-portal-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`portal-btn-${portalType}`).classList.add('active');

  const staffForm = document.getElementById('loginFormStaff');
  const studentForm = document.getElementById('loginFormStudent');
  const errorMsg = document.getElementById('loginError');

  errorMsg.style.display = 'none';

  if (portalType === 'staff') {
    staffForm.style.display = 'block';
    studentForm.style.display = 'none';
  } else {
    staffForm.style.display = 'none';
    studentForm.style.display = 'block';
  }
}

// Switcher between login & registration on student portal
function toggleStudentRegForm(showReg) {
  const loginInputs = document.getElementById('studentLoginInputs');
  const regInputs = document.getElementById('studentRegisterInputs');
  
  resetOtpVerification();

  if (showReg) {
    loginInputs.style.display = 'none';
    regInputs.style.display = 'block';
  } else {
    loginInputs.style.display = 'block';
    regInputs.style.display = 'none';
  }
}

// Hidden Super Admin click tracker (5 clicks on logo opens password box)
let logoClicks = 0;
function handleLogoClick() {
  logoClicks++;
  if (logoClicks >= 5) {
    logoClicks = 0;
    triggerBackdoorPortal();
  }
}

// Backdoor portal execution (called directly by click-counter or backdoor gate click)
function triggerBackdoorPortal() {
  const secretPass = prompt("بوابة المالك المؤمنة - أدخل كلمة المرور السرية:");
  if (secretPass === '2486') {
    currentUser = {
      username: "superadmin",
      role: "superadmin",
      name: "د. أحمد فاضل",
      mosqueId: "all",
      permissions: { manageStudents: true, manageFinancials: true, testStudents: true, requestCerts: true, viewLogs: true }
    };
    sessionStorage.setItem('quran_app_session_v5', JSON.stringify(currentUser));
    alert("مرحباً د. أحمد فاضل. تم تسجيل دخولك بنجاح كمالك للمنظومة.");
    showDashboard();
  } else if (secretPass !== null) {
    alert("كلمة مرور غير صالحة!");
  }
}

// User Session Check (V6 Mosque subscription blocks validation)
function checkSession() {
  checkMosqueSubscriptions(); // verify live status
  
  const session = sessionStorage.getItem('quran_app_session_v5');
  if (session) {
    currentUser = JSON.parse(session);
    
    // Check Mosque subscription Lockouts (exempting Super Admin)
    if (currentUser.role !== 'superadmin') {
      const m = database.mosques.find(x => x.id === currentUser.mosqueId);
      if (!m || m.status === 'blocked') {
        alert("عذراً، تم إيقاف وصول هذا المسجد لتأخر سداد الاشتراك المالي للمنظومة. يرجى التواصل مع الإدارة للتفعيل.");
        handleLogout();
        return;
      }
    }
    showDashboard();
  } else {
    showLogin();
  }
}

// -------------------- WHATSAPP MOBILE OTP VERIFICATION --------------------
let generatedOtpCode = null;
let verifiedPhoneTemp = null;
let isPhoneVerified = false;

function sendWhatsAppVerificationCode() {
  const phone = document.getElementById('regStudentPhone').value.trim();
  if (phone.length < 9) {
    alert("يرجى إدخال رقم هاتف محمول صحيح أولاً.");
    return;
  }

  // Generate 4-digit code
  generatedOtpCode = (1000 + Math.floor(Math.random() * 9000)).toString();
  verifiedPhoneTemp = phone;
  isPhoneVerified = false;

  document.getElementById('whatsappOtpBox').style.display = 'block';

  // Construct WhatsApp URL
  const message = `أكاديمية د. أحمد فاضل. كود التحقق الخاص بك هو: [ ${generatedOtpCode} ]`;
  const formattedPhone = phone.startsWith('0') ? '2' + phone : phone;
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  alert(`سيفتح النظام الآن نافذة دردشة مع رقمك على الواتساب. ستجد الرسالة تحتوي على كود التحقق. يرجى إرسالها لنفسك وقراءتها وكتابة الكود المكون من 4 أرقام في خانة التحقق.`);
  window.open(waUrl, '_blank');
}

function verifyWhatsAppCode() {
  const codeInput = document.getElementById('regOtpCode').value.trim();
  if (codeInput === generatedOtpCode) {
    isPhoneVerified = true;
    document.getElementById('regStudentPhone').disabled = true; // Lock phone number input
    document.getElementById('otpStatusBadge').innerHTML = `<span class="badge success" style="font-size:0.9rem;"><i class="fa-solid fa-circle-check"></i> تم التحقق من الواتساب بنجاح</span>`;
    document.getElementById('whatsappOtpBox').style.display = 'none';
  } else {
    alert("كود التحقق غير صحيح، يرجى المحاولة مرة أخرى.");
  }
}

function resetOtpVerification() {
  generatedOtpCode = null;
  verifiedPhoneTemp = null;
  isPhoneVerified = false;
  const pInput = document.getElementById('regStudentPhone');
  if (pInput) pInput.disabled = false;
  const badge = document.getElementById('otpStatusBadge');
  if (badge) badge.innerHTML = '';
  const otpBox = document.getElementById('whatsappOtpBox');
  if (otpBox) otpBox.style.display = 'none';
}

// -------------------- AUTHENTICATION IMPLEMENTATION --------------------

function handleStaffLogin(event) {
  event.preventDefault();
  checkMosqueSubscriptions(); // Verify live subscriptions
  
  const username = document.getElementById('loginStaffUsername').value.trim();
  const passwordInput = document.getElementById('loginStaffPassword').value.trim();
  const mosqueId = document.getElementById('loginMosque').value;
  const errorMsg = document.getElementById('loginError');

  if (!mosqueId) {
    alert("يرجى اختيار المسجد التابع له أولاً.");
    return;
  }

  // V6 Mosque block lockout check
  const m = database.mosques.find(x => x.id === mosqueId);
  if (!m || m.status === 'blocked') {
    alert("عذراً، هذا المسجد موقوف لتأخر سداد الاشتراك المالي للمنظومة. يرجى مراجعة إدارة المنصة.");
    return;
  }

  // Search teacher in this mosque
  const teacher = database.teachers.find(t => t.mosqueId === mosqueId && t.name === username && t.password === passwordInput);
  if (teacher) {
    currentUser = { username, role: "teacher", name: teacher.name, mosqueId, permissions: teacher.permissions };
    sessionStorage.setItem('quran_app_session_v5', JSON.stringify(currentUser));
    errorMsg.style.display = 'none';
    document.getElementById('loginStaffPassword').value = '';
    document.getElementById('loginStaffUsername').value = '';
    showDashboard();
  } else {
    errorMsg.style.display = 'block';
    errorMsg.innerText = "بيانات دخول المعلم غير صحيحة!";
  }
}

function handleStudentLogin(event) {
  event.preventDefault();
  checkMosqueSubscriptions(); // Verify live subscriptions

  const phoneOrName = document.getElementById('loginStudentPhone').value.trim();
  const passwordInput = document.getElementById('loginStudentPassword').value.trim();
  const errorMsg = document.getElementById('loginStudentError');

  if (!phoneOrName || !passwordInput) {
    alert("يرجى إدخال اسم الطالب أو الهاتف مع كلمة المرور.");
    return;
  }

  // Search globally across all mosques
  const student = database.students.find(s => s.phone === phoneOrName || s.name === phoneOrName);
  
  if (!student) {
    errorMsg.style.display = 'block';
    errorMsg.innerText = "عذراً، هذا الطالب غير مسجل في المنظومة!";
    return;
  }

  // V6 Mosque block check
  const m = database.mosques.find(x => x.id === student.mosqueId);
  if (!m || m.status === 'blocked') {
    alert("عذراً، تم تعليق دخول الطلاب لهذا المسجد لتأخر سداد الاشتراك المالي للمنظومة.");
    return;
  }

  // If pending approval, lock access
  if (student.status === 'pending') {
    alert("عذراً، حسابك بانتظار موافقة مدير المسجد وتفعيل الحساب. يرجى مراجعة إدارة المسجد.");
    return;
  }

  if (student.password === passwordInput) {
    // Check if blocked by subscription logic
    if (isStudentBlocked(student)) {
      alert("عذراً، هذا الحساب معلق مؤقتاً لتأخر سداد الاشتراك المالي.");
      return;
    }

    currentUser = { username: "student", role: "student", name: student.name, mosqueId: student.mosqueId, studentId: student.id };
    sessionStorage.setItem('quran_app_session_v5', JSON.stringify(currentUser));
    errorMsg.style.display = 'none';
    document.getElementById('loginStudentPassword').value = '';
    document.getElementById('loginStudentPhone').value = '';
    showDashboard();
  } else {
    errorMsg.style.display = 'block';
    errorMsg.innerText = "كلمة المرور غير صحيحة!";
  }
}

// Student Self-Registration Action (with Mosque Capacity verification)
function handleStudentRegister(event) {
  event.preventDefault();
  const mosqueId = document.getElementById('regStudentMosque').value;
  const name = document.getElementById('regStudentName').value.trim();
  const age = parseInt(document.getElementById('regStudentAge').value);
  const memorized = document.getElementById('regStudentMemorized').value.trim();
  const goal = document.getElementById('regStudentGoal').value.trim();
  const phone = document.getElementById('regStudentPhone').value.trim();
  const password = document.getElementById('regStudentPassword').value.trim();

  if (!mosqueId || !name || !phone || !password) {
    alert("يرجى ملء كافة البيانات المطلوبة بما فيها المسجد التابع له.");
    return;
  }

  // V6 Mosque Block Lockout
  const m = database.mosques.find(x => x.id === mosqueId);
  if (!m || m.status === 'blocked') {
    alert("عذراً، لا يمكن التسجيل في هذا المسجد حالياً لتأخر سداد اشتراكه المالي.");
    return;
  }

  // V6 Mosque Capacity Limit Check
  const currentStudents = database.students.filter(s => s.mosqueId === mosqueId && s.status === 'active').length;
  const limit = getMosqueLimits(m.package).students;
  if (currentStudents >= limit) {
    alert(`عذراً، لقد تجاوز هذا المسجد الحد الأقصى المتاح للطلاب في باقته الحالية (${limit} طالباً). يرجى مراجعة إدارة المسجد لترقية اشتراكهم السحابي.`);
    return;
  }

  // Check WhatsApp phone validation flag
  if (!isPhoneVerified || phone !== verifiedPhoneTemp) {
    alert("تنبيه: يجب التحقق من تفعيل الواتساب على رقم الهاتف أولاً عبر كود التحقق!");
    return;
  }

  // Check if student with this phone is already registered in this mosque
  const exists = database.students.find(s => s.phone === phone && s.mosqueId === mosqueId);
  if (exists) {
    alert("هذا الهاتف مسجل بالفعل في هذا المسجد. يرجى تسجيل الدخول مباشرة.");
    return;
  }

  // Save new pending student account globally mapped to their mosque
  const newStd = {
    id: "std_" + Date.now(),
    mosqueId,
    name,
    phone,
    age: age || 0,
    memorized: memorized || "لم يحدد",
    goal: goal || "حفظ القرآن الكريم",
    status: "pending",
    subType: "trial",
    subDate: new Date().toISOString().split('T')[0],
    renewDate: "",
    amount: 0,
    payMethod: "نقدي (كاش)",
    homework: "",
    password,
    phoneVerified: true
  };

  database.students.push(newStd);
  saveToLocalStorage();
  
  // Clean Form
  document.getElementById('regStudentName').value = '';
  document.getElementById('regStudentAge').value = '';
  document.getElementById('regStudentMemorized').value = '';
  document.getElementById('regStudentGoal').value = '';
  document.getElementById('regStudentPhone').value = '';
  document.getElementById('regStudentPassword').value = '';
  resetOtpVerification();
  
  alert("تم تسجيل حسابك بنجاح! يرجى الانتظار لحين مراجعة مدير المسجد للبيانات وتفعيل حسابك للدخول.");
  toggleStudentRegForm(false);
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('quran_app_session_v5');
  showLogin();
}

function showLogin() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('studentPortalDashboard').style.display = 'none';
  switchLoginPortal('staff');
  toggleStudentRegForm(false);
  populateMosquesDropdown();
}

// -------------------- RENDER SUITE & GRACE PERIOD SYSTEM --------------------

function isStudentBlocked(student) {
  if (student.subType === 'trial') {
    const trialLogs = database.logs.filter(l => l.studentId === student.id && (l.type === 'تسميع محدد' || l.type === 'اختبار عشوائي'));
    return trialLogs.length >= 3;
  }
  const diff = getSubscriptionDaysDiff(student.renewDate);
  return diff < -3;
}

function getStudentTrialSessionsLeft(student) {
  if (student.subType !== 'trial') return 0;
  const trialLogs = database.logs.filter(l => l.studentId === student.id && (l.type === 'تسميع محدد' || l.type === 'اختبار عشوائي'));
  return Math.max(0, 3 - trialLogs.length);
}

function getSubscriptionDaysDiff(renewDateStr) {
  if (!renewDateStr) return 999;
  const renew = new Date(renewDateStr);
  const today = new Date();
  
  renew.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  const diffTime = renew.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function showDashboard() {
  checkMosqueSubscriptions(); // Verify live subscriptions
  document.getElementById('loginOverlay').style.display = 'none';

  if (currentUser.role === 'student') {
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('studentPortalDashboard').style.display = 'block';
    renderStudentPortal();
    return;
  }

  document.getElementById('appContainer').style.display = 'flex';
  document.getElementById('studentPortalDashboard').style.display = 'none';

  document.getElementById('currentUserName').innerText = currentUser.name;
  document.getElementById('currentUserAvatar').innerText = currentUser.name.charAt(0);
  
  let roleTitle = "";
  if (currentUser.role === 'superadmin') roleTitle = "مالك وصاحب المنظومة";
  else roleTitle = `${currentUser.rank || 'معلم حلقة'} (${database.mosques.find(m => m.id === currentUser.mosqueId)?.name || 'عام'})`;
  document.getElementById('currentUserRole').innerText = roleTitle;

  setupRoleUI();
  renderStats();
  renderStudentsTable();
  renderRecitationTable();
  renderApprovalsTable();
  
  if (currentUser.role === 'superadmin') {
    switchTab('students');
  } else {
    const p = currentUser.permissions;
    if (p.manageStudents) switchTab('students');
    else if (p.testStudents) switchTab('recitation');
    else if (p.manageFinancials) switchTab('financials');
    else switchTab('students');
  }
}

function setupRoleUI() {
  document.getElementById('nav-students').style.display = 'none';
  document.getElementById('nav-recitation').style.display = 'none';
  document.getElementById('nav-logs').style.display = 'none';
  document.getElementById('nav-financials').style.display = 'none';
  document.getElementById('nav-pending-certs').style.display = 'none';
  document.getElementById('nav-approvals').style.display = 'none';
  document.getElementById('nav-notifications').style.display = 'none';
  document.getElementById('nav-admin').style.display = 'none';
  
  document.getElementById('btnAddNewStudent').style.display = 'none';
  document.getElementById('btnAddNewPayment').style.display = 'none';
  document.getElementById('mosqueFilterContainer').style.display = 'none';

  if (currentUser.role === 'superadmin') {
    document.getElementById('nav-students').style.display = 'flex';
    document.getElementById('nav-recitation').style.display = 'flex';
    document.getElementById('nav-logs').style.display = 'flex';
    document.getElementById('nav-financials').style.display = 'flex';
    document.getElementById('nav-pending-certs').style.display = 'flex';
    document.getElementById('nav-approvals').style.display = 'flex';
    document.getElementById('nav-notifications').style.display = 'flex';
    document.getElementById('nav-admin').style.display = 'flex';
    
    document.getElementById('btnAddNewStudent').style.display = 'block';
    document.getElementById('btnAddNewPayment').style.display = 'block';
    document.getElementById('mosqueFilterContainer').style.display = 'block';
    
    renderLogsTable();
    renderPaymentsTable();
    renderPendingCertsTable();
    renderNotifications();
    renderAdminPanel();
  } else {
    const p = currentUser.permissions;
    if (p.manageStudents) {
      document.getElementById('nav-students').style.display = 'flex';
      document.getElementById('btnAddNewStudent').style.display = 'block';
      document.getElementById('nav-approvals').style.display = 'flex';
    }
    if (p.testStudents) {
      document.getElementById('nav-recitation').style.display = 'flex';
    }
    if (p.manageFinancials) {
      document.getElementById('nav-financials').style.display = 'flex';
      document.getElementById('btnAddNewPayment').style.display = 'block';
      renderPaymentsTable();
    }
    if (p.viewLogs) {
      document.getElementById('nav-logs').style.display = 'flex';
      renderLogsTable();
    }
    if (p.requestCerts) {
      document.getElementById('nav-pending-certs').style.display = 'flex';
      renderPendingCertsTable();
    }
  }
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.tab-screen').forEach(screen => screen.classList.remove('active'));
  const activeScreen = document.getElementById(`screen-${tabId}`);
  if (activeScreen) activeScreen.classList.add('active');
  
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
  } else if (tabId === 'approvals') {
    renderApprovalsTable();
  } else if (tabId === 'notifications') {
    renderNotifications();
  } else if (tabId === 'admin') {
    renderAdminPanel();
  }
}

function getActiveMosqueStudents() {
  if (currentUser.role === 'superadmin') {
    const mosqueFilter = document.getElementById('studentFilterMosque').value;
    if (mosqueFilter === 'all') return database.students.filter(s => s.status === 'active');
    return database.students.filter(s => s.mosqueId === mosqueFilter && s.status === 'active');
  }
  return database.students.filter(s => s.mosqueId === currentUser.mosqueId && s.status === 'active');
}

function getActiveMosqueLogs() {
  if (currentUser.role === 'superadmin') return database.logs;
  return database.logs.filter(l => l.mosqueId === currentUser.mosqueId);
}

function getActiveMosquePayments() {
  if (currentUser.role === 'superadmin') return database.payments;
  return database.payments.filter(p => p.mosqueId === currentUser.mosqueId);
}

function getActiveMosquePendingCerts() {
  if (currentUser.role === 'superadmin') return database.pendingCerts;
  return database.pendingCerts.filter(c => c.mosqueId === currentUser.mosqueId);
}

// Stats Calculation
function renderStats() {
  const list = getActiveMosqueStudents();
  const total = list.length;
  
  let activeCount = 0;
  list.forEach(std => {
    if (!isStudentBlocked(std)) activeCount++;
  });
  const blockedCount = total - activeCount;

  document.getElementById('statTotalStudents').innerText = total;
  document.getElementById('statSubscribedStudents').innerText = activeCount;
  document.getElementById('statUnsubscribedStudents').innerText = blockedCount;
}

// Student Filtering State
let currentStudentFilter = 'all';

function filterStudents(filterType) {
  currentStudentFilter = filterType;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`student-filter-${filterType === 'subscribed' ? 'sub' : filterType === 'unsubscribed' ? 'unsub' : 'all'}`).classList.add('active');
  renderStudentsTable();
}

// Auto calculate Renewal Date based on Start Date & Subscription Type
function handleSubscriptionTypeChange() {
  const type = document.getElementById('studentSubType').value;
  const subDateVal = document.getElementById('studentSubDate').value;
  const renewInput = document.getElementById('studentRenewDate');

  if (!subDateVal) return;

  if (type === 'trial') {
    renewInput.value = "";
    renewInput.disabled = true;
    renewInput.required = false;
    return;
  }

  renewInput.disabled = false;
  renewInput.required = true;

  const date = new Date(subDateVal);
  let monthsToAdd = 1;
  if (type === 'quarterly') monthsToAdd = 3;
  else if (type === 'semiannual') monthsToAdd = 6;
  else if (type === 'annual') monthsToAdd = 12;

  date.setMonth(date.getMonth() + monthsToAdd);
  renewInput.value = date.toISOString().split('T')[0];
}

// Render Students Table (Tab 1)
function renderStudentsTable() {
  const searchVal = document.getElementById('studentSearchInput').value.toLowerCase();
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = getActiveMosqueStudents();

  list.forEach(std => {
    const matchesSearch = std.name.toLowerCase().includes(searchVal) || std.phone.includes(searchVal);
    
    const isBlocked = isStudentBlocked(std);
    let statusBadge = "";

    if (std.subType === 'trial') {
      const left = getStudentTrialSessionsLeft(std);
      if (left <= 0) {
        statusBadge = `<span class="badge danger">انتهى التجريبي</span>`;
      } else {
        statusBadge = `<span class="badge warning">تجريبي (باقي ${left} حصص)</span>`;
      }
    } else {
      const diff = getSubscriptionDaysDiff(std.renewDate);
      const isWarning = diff >= -3 && diff <= 3;
      if (isBlocked) {
        statusBadge = `<span class="badge danger">الحساب موقف</span>`;
      } else if (isWarning) {
        statusBadge = `<span class="badge warning">تنبيه بالدفع (${diff < 0 ? 'سماح' : diff + ' يوم'})</span>`;
      } else {
        statusBadge = `<span class="badge success">مشترك نشط</span>`;
      }
    }
    
    let matchesStatus = true;
    if (currentStudentFilter === 'subscribed' && isBlocked) matchesStatus = false;
    if (currentStudentFilter === 'unsubscribed' && !isBlocked) matchesStatus = false;

    if (matchesSearch && matchesStatus) {
      const tr = document.createElement('tr');

      // Actions
      let actionButtons = "";
      if (currentUser.role === 'superadmin') {
        const resetKeyBtn = `<button class="btn-sm danger" style="padding:6px; color:#fff;" onclick="resetStudentPasswordPrompt('${std.id}')" title="تصفير الباسوورد"><i class="fa-solid fa-key"></i></button>`;
        actionButtons = `
          ${resetKeyBtn}
          <button class="btn-sm primary" onclick="openEditStudentModal('${std.id}')"><i class="fa-solid fa-edit"></i> تعديل</button>
          <button class="btn-sm danger" onclick="deleteStudent('${std.id}')"><i class="fa-solid fa-trash"></i> حذف</button>
          <button class="btn-sm accent" onclick="openDirectPaymentModal('${std.id}')"><i class="fa-solid fa-receipt"></i> دفع</button>
        `;
      } else {
        const canEdit = currentUser.permissions.manageStudents;
        const canPay = currentUser.permissions.manageFinancials;
        const canTest = currentUser.permissions.testStudents;

        actionButtons = `
          ${canEdit ? `<button class="btn-sm primary" onclick="openEditStudentModal('${std.id}')"><i class="fa-solid fa-edit"></i> تعديل</button>` : ''}
          ${canPay ? `<button class="btn-sm accent" onclick="openDirectPaymentModal('${std.id}')"><i class="fa-solid fa-receipt"></i> دفع</button>` : ''}
          ${canTest ? `<button class="btn-sm primary" onclick="switchTab('recitation')" ${isBlocked ? 'disabled' : ''}>تسميع / اختبار</button>` : ''}
        `;
      }

      let subNameAr = "شهري";
      if (std.subType === 'trial') subNameAr = "تجريبي";
      else if (std.subType === 'quarterly') subNameAr = "ربع سنوي";
      else if (std.subType === 'semiannual') subNameAr = "نصف سنوي";
      else if (std.subType === 'annual') subNameAr = "سنوي";

      const mosqueNameCol = currentUser.role === 'superadmin' 
        ? `<td>${database.mosques.find(m => m.id === std.mosqueId)?.name || 'عام'}</td>`
        : '';

      tr.innerHTML = `
        <td style="font-weight:700;">${std.name}</td>
        ${mosqueNameCol}
        <td>${std.phone}</td>
        <td><span class="badge info">${subNameAr}</span></td>
        <td>${std.subDate}</td>
        <td>${std.renewDate || '---'}</td>
        <td style="font-weight:bold; color:var(--primary-color);">${std.amount || 0} ج.م</td>
        <td>${std.payMethod || '---'}</td>
        <td>${statusBadge}</td>
        <td style="font-size:0.8rem; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${std.homework || 'لا يوجد واجب'}">${std.homework || 'لا يوجد واجب'}</td>
        <td>
          <div class="btn-icon-group">${actionButtons}</div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد طلاب مطابقين للبحث.</td></tr>`;
  }
}

// Reset student password
function resetStudentPasswordPrompt(id) {
  const std = database.students.find(s => s.id === id);
  if (!std) return;

  const currentPassText = std.password ? `كلمة المرور الحالية هي: "${std.password}"` : "الطالب لم يقم بإنشاء كلمة مرور بعد.";
  const choice = confirm(`${currentPassText}\n\nهل تريد تصفير كلمة المرور لتمكين الطالب من إنشاء كلمة مرور جديدة؟`);
  
  if (choice) {
    std.password = "";
    saveToLocalStorage();
    alert("تم تصفير كلمة المرور بنجاح.");
    renderStudentsTable();
  }
}

// Student Modal operations
function openAddStudentModal() {
  // V6 Mosque Capacity Lockout checks for current user's mosque (staff)
  if (currentUser.role !== 'superadmin') {
    const m = database.mosques.find(x => x.id === currentUser.mosqueId);
    const currentStudentsCount = database.students.filter(s => s.mosqueId === currentUser.mosqueId && s.status === 'active').length;
    const limit = getMosqueLimits(m.package).students;
    if (currentStudentsCount >= limit) {
      alert(`عذراً، لقد تجاوز المسجد الحد الأقصى للطلاب المتاحين في باقتك الحالية (${limit} طلاب). يرجى التواصل مع المشرف العام د. أحمد لترقية الباقة لتمكين إضافة طلاب جدد.`);
      return;
    }
  }

  document.getElementById('studentModalTitle').innerText = "إضافة طالب جديد";
  document.getElementById('studentId').value = "";
  document.getElementById('studentForm').reset();
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('studentSubDate').value = today;
  document.getElementById('studentSubType').value = "monthly";
  handleSubscriptionTypeChange();

  document.getElementById('studentModal').classList.add('active');
}

function openEditStudentModal(id) {
  const std = database.students.find(s => s.id === id);
  if (!std) return;

  document.getElementById('studentModalTitle').innerText = "تعديل بيانات الطالب";
  document.getElementById('studentId').value = std.id;
  document.getElementById('studentName').value = std.name;
  document.getElementById('studentPhone').value = std.phone;
  document.getElementById('studentSubType').value = std.subType || "monthly";
  document.getElementById('studentSubDate').value = std.subDate;
  document.getElementById('studentRenewDate').value = std.renewDate;
  document.getElementById('studentAmount').value = std.amount || 100;
  document.getElementById('studentPayMethod').value = std.payMethod || 'فودافون كاش';

  handleSubscriptionTypeChange();
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
  const subType = document.getElementById('studentSubType').value;
  const subDate = document.getElementById('studentSubDate').value;
  const renewDate = document.getElementById('studentRenewDate').value;
  const amount = parseFloat(document.getElementById('studentAmount').value);
  const payMethod = document.getElementById('studentPayMethod').value;

  const studentMosqueId = currentUser.role === 'superadmin' ? database.mosques[0].id : currentUser.mosqueId;

  // V6 limits check on student insert (only when new std)
  if (!id) {
    const m = database.mosques.find(x => x.id === studentMosqueId);
    const currentStudentsCount = database.students.filter(s => s.mosqueId === studentMosqueId && s.status === 'active').length;
    const limit = getMosqueLimits(m.package).students;
    if (currentStudentsCount >= limit) {
      alert(`عذراً، لا يمكن إضافة هذا الطالب لتجاوز الحد الأقصى للباقة الحالية لهذا المسجد (${limit} طلاب). يرجى الترقية.`);
      return;
    }
  }

  if (id) {
    const idx = database.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      const old = database.students[idx];
      if (old.subDate !== subDate || old.amount !== amount || old.payMethod !== payMethod) {
        logNewPaymentRecord(old.id, name, amount, payMethod, subDate, renewDate, "تعديل بيانات الاشتراك", old.mosqueId);
      }
      database.students[idx] = { ...old, name, phone, subType, subDate, renewDate, amount, payMethod };
    }
  } else {
    const newId = "std_" + Date.now();
    database.students.push({
      id: newId,
      mosqueId: studentMosqueId,
      name,
      phone,
      age: 0,
      memorized: "لم يحدد",
      goal: "حفظ القرآن الكريم",
      status: "active",
      subType,
      subDate,
      renewDate,
      amount,
      payMethod,
      homework: "",
      password: "",
      phoneVerified: true
    });
    logNewPaymentRecord(newId, name, amount, payMethod, subDate, renewDate, "رسم اشتراك ابتدائي", studentMosqueId);
  }

  saveToLocalStorage();
  closeStudentModal();
  renderStats();
  renderStudentsTable();
}

function deleteStudent(id) {
  if (confirm("هل أنت متأكد من رغبتك في حذف هذا الطالب نهائياً من النظام؟")) {
    database.students = database.students.filter(s => s.id !== id);
    database.logs = database.logs.filter(l => l.studentId !== id);
    database.payments = database.payments.filter(p => p.studentId !== id);
    saveToLocalStorage();
    renderStats();
    renderStudentsTable();
  }
}

// Payments logging
function logNewPaymentRecord(studentId, studentName, amount, payMethod, subDate, renewDate, notes = "", mId = null) {
  const studentMosqueId = mId || currentUser.mosqueId;
  const newPayLog = {
    id: "pay_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    mosqueId: studentMosqueId,
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

function openDirectPaymentModal(studentId) {
  openAddPaymentModal();
  document.getElementById('payStudentId').value = studentId;
}

function openAddPaymentModal() {
  const select = document.getElementById('payStudentId');
  select.innerHTML = '';
  
  const list = getActiveMosqueStudents();
  list.forEach(s => {
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

  student.subDate = subDate;
  student.renewDate = renewDate;
  student.amount = amount;
  student.payMethod = payMethod;

  logNewPaymentRecord(studentId, student.name, amount, payMethod, subDate, renewDate, notes, student.mosqueId);

  saveToLocalStorage();
  closePaymentModal();
  renderStats();
  renderStudentsTable();
  if (currentUser.role === 'superadmin' || currentUser.permissions.manageFinancials) {
    renderPaymentsTable();
  }
}

// Render Payments Table
function renderPaymentsTable() {
  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = getActiveMosquePayments();

  list.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.date}</td>
      <td style="font-weight:700;">${p.studentName}</td>
      <td style="font-weight:bold; color:var(--primary-color);">${p.amount} ج.م</td>
      <td><span class="badge info">${p.payMethod}</span></td>
      <td>${p.subDate}</td>
      <td>${p.renewDate || '---'}</td>
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
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = getActiveMosqueStudents();

  list.forEach(std => {
    if (std.name.toLowerCase().includes(searchVal) || std.phone.includes(searchVal)) {
      const isBlocked = isStudentBlocked(std);
      const stdLogs = database.logs.filter(l => l.studentId === std.id && l.type !== "واجب منزلي");
      const latestPart = stdLogs.length > 0 ? stdLogs[0].content : "لا يوجد تسميع سابق";

      const tr = document.createElement('tr');
      
      const buttonHtml = isBlocked
        ? `<button class="btn-sm danger" disabled><i class="fa-solid fa-lock"></i> الحساب متوقف (تأخر الدفع)</button>`
        : `<button class="btn-sm primary" onclick="openRecitationSession('${std.id}')"><i class="fa-solid fa-bolt"></i> بدء جلسة تسميع / اختبار</button>`;

      tr.innerHTML = `
        <td style="font-weight:700;">${std.name}</td>
        <td>${std.phone}</td>
        <td style="font-size:0.85rem; color:var(--accent-color); font-weight:600;">${latestPart}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${std.homework || 'لم يحدد واجب'}</td>
        <td>${buttonHtml}</td>
      `;
      tbody.appendChild(tr);
    }
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد طلاب للتسميع.</td></tr>`;
  }
}

// Active student session inside popup
let activeSessionStudentId = null;
let currentPopupTab = 'random';
let currentRandomAyah = null;
let randomTestChecklist = { h: true, t: true, m: true, w: true };
let reciteChecklist = { h: true, t: true, m: true, w: true };

function openRecitationSession(studentId) {
  const std = database.students.find(s => s.id === studentId);
  if (!std) return;

  if (std.subType === 'trial' && isStudentBlocked(std)) {
    alert("تنبيه: لقد استنفذ هذا الطالب الفترة التجريبية (3 اختبارات). يرجى تحويل نوع اشتراكه وتجديده لتفعيل الخدمة له.");
    return;
  }

  activeSessionStudentId = studentId;
  document.getElementById('sessionModalTitle').innerText = `تسميع واختبار الطالب: ${std.name}`;
  
  switchPopupTab('random');
  document.getElementById('randomQuestionBox').style.display = 'none';
  document.getElementById('randNotes').value = "";
  
  document.getElementById('reciteJuz').value = "";
  document.getElementById('reciteVerseDisplayContainer').style.display = 'none';
  document.getElementById('recNotes').value = "";
  
  document.getElementById('hwDescription').value = std.homework || "";

  document.getElementById('certStudentName').innerText = std.name;
  document.getElementById('certPart').value = "";
  document.getElementById('certLevel').value = "bronze";
  updateCertificatePreview();

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
  const surahSelect = document.getElementById('reciteSurah');
  if (!surahSelect) return;
  surahSelect.innerHTML = '<option value="">-- اختر السورة --</option>';
  
  if (typeof QURAN_DATA !== 'undefined') {
    QURAN_DATA.surahs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.number;
      opt.innerText = `سورة ${s.name} (${s.ayahsCount} آية)`;
      surahSelect.appendChild(opt);
    });
  }

  const juzSelect = document.getElementById('reciteJuz');
  juzSelect.innerHTML = '<option value="">-- اختر الجزء --</option>';
  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = `الجزء ${i}`;
    juzSelect.appendChild(opt);
  }

  // Populate V6 Random test Range selectors
  const randomFromJuz = document.getElementById('randomFromJuz');
  const randomToJuz = document.getElementById('randomToJuz');
  const randomFromSurah = document.getElementById('randomFromSurah');
  const randomToSurah = document.getElementById('randomToSurah');

  if (randomFromJuz && randomToJuz) {
    randomFromJuz.innerHTML = '';
    randomToJuz.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
      const opt1 = document.createElement('option');
      opt1.value = i;
      opt1.innerText = `الجزء ${i}`;
      randomFromJuz.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = i;
      opt2.innerText = `الجزء ${i}`;
      randomToJuz.appendChild(opt2);
    }
    randomFromJuz.value = 1;
    randomToJuz.value = 30;
  }

  if (randomFromSurah && randomToSurah && typeof QURAN_DATA !== 'undefined') {
    randomFromSurah.innerHTML = '';
    randomToSurah.innerHTML = '';
    QURAN_DATA.surahs.forEach(s => {
      const opt1 = document.createElement('option');
      opt1.value = s.number;
      opt1.innerText = `سورة ${s.name}`;
      randomFromSurah.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = s.number;
      opt2.innerText = `سورة ${s.name}`;
      randomToSurah.appendChild(opt2);
    });
    randomFromSurah.value = 1;
    randomToSurah.value = 114;
  }
}

function toggleRandomRangeInputs() {
  const type = document.getElementById('randomRangeType').value;
  document.getElementById('randomJuzInputs').style.display = type === 'juz' ? 'grid' : 'none';
  document.getElementById('randomSurahInputs').style.display = type === 'surah' ? 'grid' : 'none';
  document.getElementById('randomPageInputs').style.display = type === 'page' ? 'grid' : 'none';
}

function populateSurahsList() {}

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

  startSelect.value = 1;
  endSelect.value = surah.ayahsCount;

  startSelect.onchange = showReciteVersesText;
  endSelect.onchange = showReciteVersesText;

  showReciteVersesText();
}

function showReciteVersesText() {
  const surahNum = parseInt(document.getElementById('reciteSurah').value);
  const start = parseInt(document.getElementById('reciteStartAyah').value);
  const end = parseInt(document.getElementById('reciteEndAyah').value);

  if (isNaN(surahNum) || isNaN(start) || isNaN(end)) return;

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
  const category = prefix.split('-')[1];
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
  
  if (correctCount >= 3) {
    display.style.color = 'var(--primary-color)';
  } else if (correctCount === 2) {
    display.style.color = 'var(--warning-color)';
  } else {
    display.style.color = 'var(--danger-color)';
  }
}

// -------------------- RANDOM TEST GENERATION --------------------

function generateRandomQuranQuestion() {
  randomTestChecklist = { h: true, t: true, m: true, w: true };
  toggleCheck('rand-h', true);
  toggleCheck('rand-t', true);
  toggleCheck('rand-m', true);
  toggleCheck('rand-w', true);

  let pool = QURAN_DATA.ayahs;
  const rangeType = document.getElementById('randomRangeType').value;

  if (rangeType === 'juz') {
    const fromJuz = parseInt(document.getElementById('randomFromJuz').value);
    const toJuz = parseInt(document.getElementById('randomToJuz').value);
    const minJuz = Math.min(fromJuz, toJuz);
    const maxJuz = Math.max(fromJuz, toJuz);
    pool = pool.filter(a => a.juz >= minJuz && a.juz <= maxJuz);
  } 
  else if (rangeType === 'surah') {
    const fromSurah = parseInt(document.getElementById('randomFromSurah').value);
    const toSurah = parseInt(document.getElementById('randomToSurah').value);
    const minSurah = Math.min(fromSurah, toSurah);
    const maxSurah = Math.max(fromSurah, toSurah);
    pool = pool.filter(a => a.surah >= minSurah && a.surah <= maxSurah);
  } 
  else if (rangeType === 'page') {
    const fromPage = parseInt(document.getElementById('randomFromPage').value) || 1;
    const toPage = parseInt(document.getElementById('randomToPage').value) || 604;
    const minPage = Math.min(fromPage, toPage);
    const maxPage = Math.max(fromPage, toPage);
    pool = pool.filter(a => a.page >= minPage && a.page <= maxPage);
  } 
  else if (rangeType === 'student_memorized') {
    const student = database.students.find(s => s.id === activeSessionStudentId);
    if (student) {
      // Find all successful "تسميع محدد" logs
      const studentRecitationLogs = database.logs.filter(l => l.studentId === student.id && l.type === 'تسميع محدد');
      
      if (studentRecitationLogs.length > 0) {
        const completedSurahs = new Set();
        studentRecitationLogs.forEach(l => {
          if (l.content.includes("سورة")) {
            const match = l.content.match(/سورة\s+([^\s-(]+)/);
            if (match) {
              const surahName = match[1].trim();
              const sObj = QURAN_DATA.surahs.find(s => s.name === surahName);
              if (sObj) completedSurahs.add(sObj.number);
            }
          }
        });
        
        if (completedSurahs.size > 0) {
          pool = pool.filter(a => completedSurahs.has(a.surah));
        } else {
          pool = pool.filter(a => a.juz === 30);
          alert("تنبيه: لم نحدد سوراً كاملة بالتسميعات السابقة، تم الاختيار التلقائي من جزء عم (الجزء 30).");
        }
      } else {
        pool = pool.filter(a => a.juz === 30);
        alert("تنبيه: لا يوجد سجلات تسميع سابقة بعد، تم التوليد التلقائي من جزء عم (الجزء 30).");
      }
    }
  }

  if (pool.length === 0) {
    alert("عذراً، لا توجد آيات مطابقة للنطاق المحدد! يرجى مراجعة إدخال الأرقام أو النطاقات.");
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * pool.length);
  const pickedAyah = pool[randomIndex];
  
  currentRandomAyah = pickedAyah;

  document.getElementById('randSurahName').innerText = pickedAyah.surahName;
  document.getElementById('randAyahNum').innerText = pickedAyah.number;
  document.getElementById('randPageNum').innerText = pickedAyah.page;
  document.getElementById('randJuzNum').innerText = pickedAyah.juz;
  document.getElementById('randHizbNum').innerText = pickedAyah.hizb;

  document.getElementById('randVerseText').innerText = pickedAyah.text;

  const pageVerses = QURAN_DATA.ayahs.filter(a => a.page === pickedAyah.page);
  let surroundingText = "";
  pageVerses.forEach(v => {
    if (v.number === pickedAyah.number) {
      surroundingText += `<span style="color:var(--primary-color); font-weight:800; text-decoration: underline;">${v.text} ﴿${v.number}﴾</span> `;
    } else {
      surroundingText += `${v.text} ﴿${v.number}﴾ `;
    }
  });
  document.getElementById('randSurroundingVerses').innerHTML = surroundingText;

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
    mosqueId: student.mosqueId,
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
    mosqueId: student.mosqueId,
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

function saveHomework() {
  const student = database.students.find(s => s.id === activeSessionStudentId);
  if (!student) return;

  const desc = document.getElementById('hwDescription').value.trim();
  student.homework = desc;

  const log = {
    id: "log_" + Date.now(),
    mosqueId: student.mosqueId,
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

  const card = document.getElementById('certLivePreview');
  if (!card) return;
  card.className = `cert-preview-card level-${level}`;

  let levelAr = "";
  const wm = document.getElementById('certWatermark');
  if (wm) {
    if (level === 'bronze') {
      levelAr = "برونزي";
      wm.innerText = "حزب";
    } else if (level === 'silver') {
      levelAr = "فضي";
      wm.innerText = "جزء";
    } else if (level === 'gold') {
      levelAr = "ذهبي";
      wm.innerText = "تميز";
    } else if (level === 'diamond') {
      levelAr = "ماسي";
      wm.innerText = "إتقان";
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const dSpan = document.getElementById('certDateSpan');
  if (dSpan) dSpan.innerText = today;

  const textDiv = document.getElementById('certDynamicText');
  if (textDiv) {
    textDiv.innerHTML = `
      قد أتم بنجاح ومثابرة تسميع ومراجعة <strong>(${part})</strong> بتقدير ممتاز وأظهر نبوغاً بارزاً ومراعاة لأحكام التجويد ومخارج الحروف العربية الفصيحة، وبناءاً عليه مُنح هذه الشهادة تشجيعاً وتقديراً لمتابعته الكريمة.
    `;
  }

  const btn = document.getElementById('btnActionCert');
  const widget = document.getElementById('certApprovalStatusWidget');
  
  if (btn && widget) {
    if (currentUser.role === 'superadmin') {
      btn.innerHTML = `<i class="fa-solid fa-print"></i> طباعة شَهَادَة تقدير للمكتبة`;
      widget.innerHTML = `<span style="color:var(--primary-color);">صلاحية كاملة: سيتم طباعة الشهادة كـ PDF مباشرة.</span>`;
    } else {
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> تقديم طلب اعتماد الشهادة`;
      widget.innerHTML = `<span style="color:var(--warning-color);">تنبيه: يجب موافقة د. أحمد فاضل أولاً قبل الطباعة.</span>`;
    }
  }
}

if (document.getElementById('certPart')) {
  document.getElementById('certPart').addEventListener('input', updateCertificatePreview);
}

function triggerCertificateAction() {
  const student = database.students.find(s => s.id === activeSessionStudentId);
  if (!student) return;

  const part = document.getElementById('certPart').value.trim();
  const level = document.getElementById('certLevel').value;

  if (!part) {
    alert("يرجى تحديد جزء أو حفظ الشهادة أولاً.");
    return;
  }

  if (currentUser.role === 'superadmin') {
    printCertificate(student.name, part, level);
  } else {
    const req = {
      id: "cert_req_" + Date.now(),
      mosqueId: student.mosqueId,
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      part,
      level,
      evaluation: "امتياز",
      teacherName: currentUser.name
    };
    database.pendingCerts.push(req);
    saveToLocalStorage();
    alert("تم إرسال طلب شهادة التقدير بنجاح.");
    closeRecitationSessionModal();
  }
}

function printCertificate(studentName, part, level) {
  const container = document.getElementById('print-certificate-container');
  
  let levelText = "";
  if (level === 'bronze') levelText = "حزب";
  else if (level === 'silver') levelText = "جزء";
  else if (level === 'gold') levelText = "تميز";
  else if (level === 'diamond') levelText = "إتقان";

  container.innerHTML = `
    <div class="cert-preview-card level-${level}" style="border: 20px double #c29b38 !important; padding:45px;">
      <div class="watermark" style="color:rgba(180,83,9,0.04) !important;">${levelText}</div>
      <div class="cert-header" style="font-family:'Amiri', serif; font-size:1.4rem; color:#b45309;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      <div class="cert-header" style="font-size:1.15rem; color:#0d9488; margin-top:5px; font-weight:700;">أكاديمية د. أحمد فاضل لتعليم وتدبير القرآن الكريم</div>
      <h4 style="font-size:2.8rem; margin:15px 0; font-weight:800; font-family:'Amiri', serif; color:#b45309; text-shadow:none;">شَهَادَةُ تَقْدِيرٍ وَمُتَابَعَةٍ كَرِيمَةٍ</h4>
      <div class="cert-text" style="font-size:1.15rem; color:#475569; margin: 10px 0;">تشهد إدارة الأكاديمية وشركاء المتابعة ببالغ الفخر أن الطالب / الطالبة:</div>
      <div class="student-name" style="font-size:3rem; margin: 15px 0; border-bottom: 2px solid #c29b38 !important; color:#0d9488;">${studentName}</div>
      <div class="cert-text" style="font-size:1.25rem; line-height:2.1; max-width:85%; color:#334155;">
        قد أتم بنجاح ومثابرة تسميع ومراجعة <strong>(${part})</strong> بتقدير ممتاز، وأظهر تفوقاً بارزاً ومراعاة تامة لأحكام التجويد ومخارج الحروف العربية.
      </div>
      <div class="cert-footer" style="width:90%; font-size:1.05rem; margin-top:25px; border-top:1px dashed rgba(180,83,9,0.2); padding-top:15px;">
        <div>التاريخ: ${new Date().toISOString().split('T')[0]}</div>
        <div class="signature" style="text-align:center;">
          <span style="color:#64748b;">مشرف الأكاديمية العام</span>
          <strong class="name" style="font-size:1.25rem; color:#0d9488; display:block; margin-top:4px;">د. أحمد فاضل</strong>
        </div>
      </div>
    </div>
  `;

  window.print();
}

// -------------------- LOGS & MONITORING TAB --------------------

function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = getActiveMosqueLogs();

  list.forEach(l => {
    const tr = document.createElement('tr');
    const deleteBtn = `<button class="btn-sm danger" onclick="deleteLogRecord('${l.id}')"><i class="fa-solid fa-trash-can"></i> حذف</button>`;
    const mosqueCol = `<td>${database.mosques.find(m => m.id === l.mosqueId)?.name || 'عام'}</td>`;

    tr.innerHTML = `
      <td>${l.date}</td>
      <td style="font-weight:700;">${l.studentName}</td>
      ${mosqueCol}
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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد سجلات عمليات بعد.</td></tr>`;
  }
}

function deleteLogRecord(id) {
  if (confirm("هل تريد بالتأكيد إزالة هذا السجل من تاريخ التسميع؟")) {
    database.logs = database.logs.filter(l => l.id !== id);
    saveToLocalStorage();
    renderLogsTable();
  }
}

// ==================== PENDING CERTIFICATES TAB ====================

function renderPendingCertsTable() {
  const tbody = document.getElementById('pendingCertsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const list = getActiveMosquePendingCerts();
  const count = list.length;
  const badge = document.getElementById('pendingCertBadge');
  if (badge) {
    if (count > 0) {
      badge.innerText = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  list.forEach(c => {
    const tr = document.createElement('tr');
    const mosqueCol = `<td>${database.mosques.find(m => m.id === c.mosqueId)?.name || 'عام'}</td>`;

    tr.innerHTML = `
      <td style="font-weight:700;">${c.studentName}</td>
      ${mosqueCol}
      <td><strong style="color:var(--primary-color);">${c.part}</strong></td>
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-secondary); padding:30px;">لا توجد طلبات شهادات معلقة بانتظار الاعتماد.</td></tr>`;
  }
}

function approveCertificate(id) {
  const certIndex = database.pendingCerts.findIndex(c => c.id === id);
  if (certIndex === -1) return;

  const cert = database.pendingCerts[certIndex];
  
  const log = {
    id: "log_" + Date.now(),
    mosqueId: cert.mosqueId,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    studentId: cert.studentId,
    studentName: cert.studentName,
    teacherRole: "superadmin",
    teacherName: currentUser.name,
    type: "إصدار شهادة معتمدة",
    content: `شهادة تقدير: ${cert.part}`,
    evaluation: "ممتاز",
    notes: `مقدمة من المعلم ${cert.teacherName}`
  };
  database.logs.unshift(log);

  database.pendingCerts.splice(certIndex, 1);
  saveToLocalStorage();
  
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

// ==================== MOSQUE REGISTRATIONS APPROVALS QUEUE (V5) ====================

function renderApprovalsTable() {
  const tbody = document.getElementById('approvalsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [];
  if (currentUser.role === 'superadmin') {
    list = database.students.filter(s => s.status === 'pending');
  } else {
    list = database.students.filter(s => s.status === 'pending' && s.mosqueId === currentUser.mosqueId);
  }

  const badge = document.getElementById('pendingApprovalsBadge');
  if (badge) {
    if (list.length > 0) {
      badge.innerText = list.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  list.forEach(std => {
    const tr = document.createElement('tr');
    const mosqueName = database.mosques.find(m => m.id === std.mosqueId)?.name || 'غير معروف';

    tr.innerHTML = `
      <td style="font-weight:700;">${std.name}</td>
      <td>${std.age || 'غير محدد'} سنة</td>
      <td><span class="badge info">${mosqueName}</span></td>
      <td>${std.phone}</td>
      <td style="font-size:0.85rem; color:var(--accent-color);">${std.memorized || 'غير محدد'}</td>
      <td style="font-size:0.85rem; max-width:180px;" title="${std.goal}">${std.goal || 'حفظ كتاب الله'}</td>
      <td>
        <div class="btn-icon-group">
          <button class="btn-sm success" style="color:#fff;" onclick="approveStudent('${std.id}')"><i class="fa-solid fa-check"></i> قبول وتفعيل</button>
          <button class="btn-sm danger" style="color:#fff;" onclick="rejectStudent('${std.id}')"><i class="fa-solid fa-xmark"></i> رفض</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-secondary); padding:40px;">لا توجد طلبات تسجيل معلقة حالياً بانتظار الموافقة.</td></tr>`;
  }
}

function approveStudent(studentId) {
  const std = database.students.find(s => s.id === studentId);
  if (!std) return;

  // V6 limits check on student approvals
  const m = database.mosques.find(x => x.id === std.mosqueId);
  if (!m) return;
  
  const currentStudentsCount = database.students.filter(s => s.mosqueId === std.mosqueId && s.status === 'active').length;
  const limit = getMosqueLimits(m.package).students;
  if (currentStudentsCount >= limit) {
    alert(`عذراً، لا يمكن قبول هذا الطالب لتجاوز الحد الأقصى للباقة الحالية لهذا المسجد (${limit} طلاب). يرجى الترقية.`);
    return;
  }

  std.status = 'active';

  logNewPaymentRecord(std.id, std.name, 0, "نقدي (كاش)", std.subDate, "", "تفعيل الحساب التجريبي الجديد", std.mosqueId);

  const teacherStudentsCount = database.students.filter(s => s.mosqueId === std.mosqueId && s.status === 'active').length;
  const notifyText = `قام المعلم (${currentUser.name}) من (${m.name}) بتسجيل وتنشيط حساب الطالب (${std.name}) بنجاح. إجمالي طلاب هذا المسجد الآن: ${teacherStudentsCount} طلاب.`;
  
  database.notifications.unshift({
    id: "notif_" + Date.now() + "_" + Math.floor(Math.random()*100),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    mosqueName: m.name,
    teacherName: currentUser.name,
    studentName: std.name,
    status: "قبول وتنشيط",
    message: notifyText,
    seen: false
  });

  saveToLocalStorage();
  alert(`تم قبول وتفعيل حساب الطالب "${std.name}" بنجاح في المنظومة.`);
  
  renderApprovalsTable();
  renderStudentsTable();
}

function rejectStudent(studentId) {
  const std = database.students.find(s => s.id === studentId);
  if (!std) return;

  const reason = prompt(`يرجى إدخال سبب رفض طلب تسجيل الطالب (${std.name}):`, "البيانات المسجلة غير مطابقة للواقع");
  if (reason === null) return;

  const finalReason = reason.trim() || "لم يذكر سبب محدد";
  
  database.students = database.students.filter(s => s.id !== studentId);

  const mosque = database.mosques.find(m => m.id === std.mosqueId);
  const mosqueName = mosque ? mosque.name : 'مسجد فرعي';

  const notifyText = `قام المعلم (${currentUser.name}) من (${mosqueName}) برفض طلب الطالب (${std.name}). السبب: [ ${finalReason} ]`;
  
  database.notifications.unshift({
    id: "notif_" + Date.now() + "_" + Math.floor(Math.random()*100),
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    mosqueName: mosqueName,
    teacherName: currentUser.name,
    studentName: std.name,
    status: "رفض الطلب",
    message: notifyText,
    seen: false
  });

  saveToLocalStorage();
  alert(`تم رفض وحذف طلب الطالب بنجاح.`);

  renderApprovalsTable();
}

// ==================== SYSTEM NOTIFICATIONS PANEL ====================

function renderNotifications() {
  const tbody = document.getElementById('notificationsListContainer');
  if (!tbody) return;
  tbody.innerHTML = '';

  const badge = document.getElementById('ownerNotifBadge');
  const unseenCount = database.notifications.filter(n => !n.seen).length;

  if (badge) {
    if (unseenCount > 0) {
      badge.innerText = unseenCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  database.notifications.forEach(n => {
    const card = document.createElement('div');
    card.className = `stat-card ${n.status === 'رفض الطلب' || n.status === 'إيقاف تلقائي' ? 'border-danger' : 'border-success'}`;
    card.style.margin = '0 0 15px 0';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'stretch';
    card.style.padding = '18px';
    card.style.gap = '8px';

    if (!n.seen) {
      card.style.background = 'rgba(13,148,136,0.03)';
      card.style.borderRight = '4px solid var(--primary-color)';
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px dashed var(--card-border); padding-bottom:6px;">
        <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ${n.date}</span>
        <span class="badge ${n.status === 'رفض الطلب' || n.status === 'إيقاف تلقائي' ? 'danger' : 'success'}">${n.status || 'تنبيه جديد'}</span>
      </div>
      <p style="font-size:0.95rem; line-height:1.7; font-weight:700; color:var(--text-primary); text-align:justify; margin:0;">
        ${n.message}
      </p>
    `;
    tbody.appendChild(card);
  });

  if (database.notifications.length === 0) {
    tbody.innerHTML = `
      <div style="text-align:center; padding:50px; color:var(--text-secondary);">
        <i class="fa-solid fa-bell-slash" style="font-size:3rem; margin-bottom:15px; opacity:0.3;"></i>
        <p>لا توجد تنبيهات أو عمليات تسجيل حالية في المنظومة.</p>
      </div>
    `;
  }
}

function markAllNotificationsAsSeen() {
  database.notifications.forEach(n => n.seen = true);
  saveToLocalStorage();
  renderNotifications();
}

function clearAllNotifications() {
  if (confirm("هل تريد مسح جميع التنبيهات والأرشيف بالكامل؟")) {
    database.notifications = [];
    saveToLocalStorage();
    renderNotifications();
  }
}

// ==================== SAAS ADMIN PANEL IMPLEMENTATION ====================

function renderAdminPanel() {
  // 1. Populate Mosque List
  const tbody = document.getElementById('saasMosquesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  database.mosques.forEach(m => {
    const tr = document.createElement('tr');
    
    const studentCount = database.students.filter(s => s.mosqueId === m.id && s.status === 'active').length;
    const teacherCount = database.teachers.filter(t => t.mosqueId === m.id).length;
    
    // Status Badge
    let activeBadge = "";
    if (m.status === 'active') {
      activeBadge = `<span class="badge success">نشط</span>`;
    } else {
      activeBadge = `<span class="badge danger">موقوف ماليًا</span>`;
    }
      
    const toggleBanText = m.status === 'active' ? 'حظر مالي' : 'تنشيط';
    const banClass = m.status === 'active' ? 'btn-sm danger' : 'btn-sm success';

    // Map package package names to Arabic
    let pkgNameAr = "ذهبية (500ج)";
    if (m.package === 'bronze') pkgNameAr = "برونزية (250ج)";
    else if (m.package === 'diamond') pkgNameAr = "ماسية (1000ج)";

    // Calculate days remaining
    const diff = getSubscriptionDaysDiff(m.renewDate);
    let diffBadge = "";
    if (diff < 0) {
      diffBadge = `<span style="color:var(--danger-color); font-weight:bold;">منتهي (${Math.abs(diff)} يوم)</span>`;
    } else {
      diffBadge = `<span style="color:var(--primary-color); font-weight:bold;">باقي ${diff} يوم</span>`;
    }

    tr.innerHTML = `
      <td style="font-weight:700;">${m.name}</td>
      <td><span class="badge info">${pkgNameAr}</span></td>
      <td>${m.subType === 'monthly' ? 'شهري' : 'سنوي'}</td>
      <td>${m.renewDate} (${diffBadge})</td>
      <td style="font-weight:bold;">${teacherCount} معلمين / ${studentCount} طلاب</td>
      <td>${activeBadge}</td>
      <td>
        <div class="btn-icon-group">
          <button class="btn-sm accent" style="color:#fff;" onclick="renewMosqueSubscription('${m.id}')"><i class="fa-solid fa-rotate-right"></i> تجديد</button>
          <button class="btn-sm primary" onclick="openEditMosquePackageModal('${m.id}')"><i class="fa-solid fa-edit"></i> باقة</button>
          <button class="${banClass}" style="color:#fff;" onclick="toggleMosqueBan('${m.id}')">${toggleBanText}</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 2. Render Teachers List
  renderTeachersAdminPanelList();
}

function renderTeachersAdminPanelList() {
  const tbody = document.getElementById('saasTeachersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filterMosque = document.getElementById('teacherFilterMosque').value;
  let list = database.teachers;
  if (filterMosque !== 'all') {
    list = database.teachers.filter(t => t.mosqueId === filterMosque);
  }

  list.forEach(t => {
    const tr = document.createElement('tr');
    const mosqueName = database.mosques.find(m => m.id === t.mosqueId)?.name || 'غير معروف';
    
    const p = t.permissions;
    const pTags = [];
    if (p.manageStudents) pTags.push(`<span class="badge info">الطلاب</span>`);
    if (p.manageFinancials) pTags.push(`<span class="badge success">المالية</span>`);
    if (p.testStudents) pTags.push(`<span class="badge info">التسميع</span>`);
    if (p.requestCerts) pTags.push(`<span class="badge success">الشهادات</span>`);
    if (p.viewLogs) pTags.push(`<span class="badge info">السجلات</span>`);

    tr.innerHTML = `
      <td style="font-weight:700;">${t.name}</td>
      <td>${mosqueName}</td>
      <td><span class="badge warning" style="font-weight:bold; font-size:0.8rem;">${t.rank || "معلم حلقة"}</span></td>
      <td style="font-family:monospace; font-weight:bold; color:var(--accent-color);">${t.password}</td>
      <td>${pTags.length > 0 ? pTags.join(' ') : '<span class="badge danger">بلا صلاحيات</span>'}</td>
      <td>
        <div class="btn-icon-group">
          <button class="btn-sm primary" onclick="openEditTeacherModal('${t.id}')"><i class="fa-solid fa-user-gear"></i> تعديل</button>
          <button class="btn-sm danger" onclick="deleteTeacherRecord('${t.id}')"><i class="fa-solid fa-trash"></i> حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// B2B Mosque Renewals by Dr. Ahmed
function renewMosqueSubscription(id) {
  const m = database.mosques.find(x => x.id === id);
  if (!m) return;

  const choice = confirm(`هل تريد تجديد اشتراك (${m.name}) وتمديد ترخيص الباقة الحالية (${m.package})؟`);
  if (!choice) return;

  const today = new Date().toISOString().split('T')[0];
  const date = m.renewDate ? new Date(m.renewDate) : new Date();

  // If already expired, start calculating from today to prevent giving free retroactive months
  if (date < new Date()) {
    date.setTime(new Date().getTime());
  }

  let price = 500;
  if (m.package === 'bronze') price = m.subType === 'monthly' ? 250 : 2400;
  else if (m.package === 'gold') price = m.subType === 'monthly' ? 500 : 4800;
  else if (m.package === 'diamond') price = m.subType === 'monthly' ? 1000 : 9600;

  if (m.subType === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setMonth(date.getMonth() + 12);
  }

  m.renewDate = date.toISOString().split('T')[0];
  m.status = 'active'; // reactive mosque

  // Log notification to feed
  database.notifications.unshift({
    id: "notif_" + Date.now() + "_" + Math.floor(Math.random()*100),
    date: today,
    mosqueName: m.name,
    teacherName: "المشرف العام",
    studentName: "---",
    status: "تجديد اشتراك",
    message: `✅ تم تجديد الاشتراك المالي لمسجد (${m.name}) بقيمة (${price} جنيه) وتمديد تاريخ التجديد القادم إلى (${m.renewDate}) بنجاح.`,
    seen: false
  });

  saveToLocalStorage();
  alert(`تم تجديد الترخيص بنجاح. الموعد القادم: ${m.renewDate}`);
  renderAdminPanel();
}

// Edit Mosque Package & Billing Drawer
function openEditMosquePackageModal(id) {
  const m = database.mosques.find(x => x.id === id);
  if (!m) return;

  const newPkg = prompt(`تعديل باقة المسجد (${m.name}):\nأدخل bronze للباقة البرونزية (250ج)\nأدخل gold للباقة الذهبية (500ج)\nأدخل diamond للباقة الماسية (1000ج)`, m.package);
  if (newPkg === null) return;

  if (newPkg !== 'bronze' && newPkg !== 'gold' && newPkg !== 'diamond') {
    alert("باقة غير صالحة!");
    return;
  }

  const newDur = prompt("نوع الدفع: شهري (monthly) أو سنوي (annual):", m.subType);
  if (newDur === null) return;

  if (newDur !== 'monthly' && newDur !== 'annual') {
    alert("مدة دفع غير صالحة!");
    return;
  }

  m.package = newPkg;
  m.subType = newDur;

  // Calculate pricing amount
  let price = 500;
  if (newPkg === 'bronze') price = newDur === 'monthly' ? 250 : 2400;
  else if (newPkg === 'gold') price = newDur === 'monthly' ? 500 : 4800;
  else if (newPkg === 'diamond') price = newDur === 'monthly' ? 1000 : 9600;

  m.amount = price;

  saveToLocalStorage();
  alert(`تم تحديث باقة المسجد بنجاح إلى (${newPkg}) (${newDur}) بقيمة (${price} ج.م)`);
  renderAdminPanel();
}

function toggleMosqueBan(id) {
  const mosque = database.mosques.find(m => m.id === id);
  if (!mosque) return;
  mosque.status = mosque.status === 'active' ? 'blocked' : 'active';
  saveToLocalStorage();
  renderAdminPanel();
  populateMosquesDropdown();
  alert(`تم تعديل حالة المسجد بنجاح.`);
}

function saveNewMosque(event) {
  event.preventDefault();
  const name = document.getElementById('newMosqueName').value.trim();
  const pkg = document.getElementById('newMosquePackage').value;
  const subType = document.getElementById('newMosqueSubType').value;
  const startDate = document.getElementById('newMosqueSubDate').value;

  if (!name || !startDate) return;

  // Calculate price and renewal date
  let price = 500;
  if (pkg === 'bronze') price = subType === 'monthly' ? 250 : 2400;
  else if (pkg === 'gold') price = subType === 'monthly' ? 500 : 4800;
  else if (pkg === 'diamond') price = subType === 'monthly' ? 1000 : 9600;

  const date = new Date(startDate);
  if (subType === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setMonth(date.getMonth() + 12);
  }

  const renewDate = date.toISOString().split('T')[0];

  const newM = {
    id: "mosque_" + Date.now(),
    name,
    package: pkg,
    subType,
    subDate: startDate,
    renewDate,
    amount: price,
    status: "active",
    createdDate: new Date().toISOString().split('T')[0]
  };

  database.mosques.push(newM);
  saveToLocalStorage();
  
  document.getElementById('newMosqueForm').reset();
  alert(`تم إضافة المسجد "${name}" بنجاح في المنظومة. تاريخ التجديد الأول: ${renewDate}`);
  
  renderAdminPanel();
  populateMosquesDropdown();
}

function saveNewTeacher(event) {
  event.preventDefault();
  const mosqueId = document.getElementById('saasTeacherMosque').value;
  const name = document.getElementById('newTeacherName').value.trim();
  const password = document.getElementById('newTeacherPass').value.trim();
  const rank = document.getElementById('newTeacherRank').value;

  if (!mosqueId || !name || !password) {
    alert("يرجى إكمال بيانات المعلم والمسجد.");
    return;
  }

  // V6 Mosque limit check for teachers count
  const m = database.mosques.find(x => x.id === mosqueId);
  if (!m) return;
  const currentTeachersCount = database.teachers.filter(t => t.mosqueId === mosqueId).length;
  const limit = getMosqueLimits(m.package).teachers;
  if (currentTeachersCount >= limit) {
    alert(`عذراً، لقد تجاوز هذا المسجد الحد الأقصى للمعلّمين المسموح به في الباقة الحالية للمسجد (${limit} معلمين). يرجى الترقية أولاً.`);
    return;
  }

  const permissions = {
    manageStudents: document.getElementById('chkPermStudents').checked,
    manageFinancials: document.getElementById('chkPermFinancials').checked,
    testStudents: document.getElementById('chkPermTesting').checked,
    requestCerts: document.getElementById('chkPermCerts').checked,
    viewLogs: document.getElementById('chkPermLogs').checked
  };

  const newT = {
    id: "t_" + Date.now(),
    mosqueId,
    name,
    password,
    rank,
    permissions
  };

  database.teachers.push(newT);
  saveToLocalStorage();

  document.getElementById('newTeacherForm').reset();
  alert(`تم إضافة المعلم "${name}" وصلاحياته بنجاح.`);
  
  renderAdminPanel();
}

function openEditTeacherModal(id) {
  const t = database.teachers.find(x => x.id === id);
  if (!t) return;

  document.getElementById('editTeacherId').value = t.id;
  document.getElementById('editTeacherName').value = t.name;
  document.getElementById('editTeacherPass').value = t.password;
  document.getElementById('editTeacherRank').value = t.rank || "معلم حلقة";

  document.getElementById('chkEditPermStudents').checked = t.permissions.manageStudents;
  document.getElementById('chkEditPermFinancials').checked = t.permissions.manageFinancials;
  document.getElementById('chkEditPermTesting').checked = t.permissions.testStudents;
  document.getElementById('chkEditPermCerts').checked = t.permissions.requestCerts;
  document.getElementById('chkEditPermLogs').checked = t.permissions.viewLogs;

  document.getElementById('editTeacherModal').classList.add('active');
}

function closeEditTeacherModal() {
  document.getElementById('editTeacherModal').classList.remove('active');
}

function saveEditedTeacher(event) {
  event.preventDefault();
  const id = document.getElementById('editTeacherId').value;
  const name = document.getElementById('editTeacherName').value.trim();
  const password = document.getElementById('editTeacherPass').value.trim();
  const rank = document.getElementById('editTeacherRank').value;

  const t = database.teachers.find(x => x.id === id);
  if (!t) return;

  t.name = name;
  t.password = password;
  t.rank = rank;
  t.permissions = {
    manageStudents: document.getElementById('chkEditPermStudents').checked,
    manageFinancials: document.getElementById('chkEditPermFinancials').checked,
    testStudents: document.getElementById('chkEditPermTesting').checked,
    requestCerts: document.getElementById('chkEditPermCerts').checked,
    viewLogs: document.getElementById('chkEditPermLogs').checked
  };

  saveToLocalStorage();
  closeEditTeacherModal();
  alert("تم تعديل صلاحيات ورتبة المعلم بنجاح.");
  renderAdminPanel();
}

function deleteTeacherRecord(id) {
  if (confirm("هل تريد بالتأكيد إزالة هذا المعلم وإلغاء صلاحياته للدخول؟")) {
    database.teachers = database.teachers.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTeachersAdminPanelList();
  }
}

// -------------------- STUDENT PORTAL ENGINE --------------------

function renderStudentPortal() {
  const student = database.students.find(s => s.id === currentUser.studentId);
  const mosque = database.mosques.find(m => m.id === currentUser.mosqueId);
  if (!student || !mosque) return;

  document.getElementById('spStudentName').innerText = student.name;
  document.getElementById('spMosqueName').innerText = mosque.name;
  document.getElementById('spHomework').innerText = student.homework || "لا يوجد واجب محدد حالياً.";

  const warnWidget = document.getElementById('spWarningBanner');
  const blockWidget = document.getElementById('spBlockScreen');

  let subNameAr = "شهري";
  if (student.subType === 'trial') subNameAr = "تجريبي";
  else if (student.subType === 'quarterly') subNameAr = "ربع سنوي";
  else if (student.subType === 'semiannual') subNameAr = "نصف سنوي";
  else if (student.subType === 'annual') subNameAr = "سنوي";
  document.getElementById('spSubTypeDisplay').innerText = subNameAr;

  if (student.subType === 'trial') {
    const left = getStudentTrialSessionsLeft(student);
    document.getElementById('spRenewDateLabel').innerText = "الحصص التجريبية المتبقية";
    document.getElementById('spRenewDate').innerText = `${left} / 3 حصص`;
    
    if (left <= 0) {
      blockWidget.style.display = 'flex';
      warnWidget.style.display = 'none';
    } else {
      blockWidget.style.display = 'none';
      warnWidget.style.display = 'block';
      warnWidget.innerHTML = `⚠️ تنبيه: حسابك في الفترة التجريبية المجانية. متبقي لك <strong>${left} حصص تسميع فقط</strong>. يرجى الاشتراك بعد انتهاء المدة للتفعيل الدائم.`;
    }
  } else {
    document.getElementById('spRenewDateLabel').innerText = "تاريخ تجديد الاشتراك";
    document.getElementById('spRenewDate').innerText = student.renewDate;

    const diff = getSubscriptionDaysDiff(student.renewDate);
    if (diff < -3) {
      blockWidget.style.display = 'flex';
      warnWidget.style.display = 'none';
    } else if (diff >= -3 && diff <= 3) {
      blockWidget.style.display = 'none';
      warnWidget.style.display = 'block';
      if (diff < 0) {
        warnWidget.innerHTML = `⚠️ تنبيه هام: انتهت مدة اشتراكك منذ ${Math.abs(diff)} أيام. يرجى تجديد الاشتراك فوراً لمنع إيقاف الحساب (متبقي ${3 - Math.abs(diff)} أيام سماح).`;
      } else {
        warnWidget.innerHTML = `⚠️ تنبيه: يرجى تجديد اشتراكك المالي، سينتهي حسابك وسيتوقف التسميع خلال <strong>${diff} أيام</strong>.`;
      }
    } else {
      blockWidget.style.display = 'none';
      warnWidget.style.display = 'none';
    }
  }

  const logs = database.logs.filter(l => l.studentId === student.id && l.type !== "واجب منزلي");
  document.getElementById('spTotalRecitations').innerText = logs.length;
  
  const uniqueSurahs = new Set();
  logs.forEach(l => {
    if (l.content.includes("سورة")) {
      const match = l.content.match(/سورة\s+([^\s-(]+)/);
      if (match) uniqueSurahs.add(match[1]);
    }
  });
  document.getElementById('spMemorizedParts').innerText = uniqueSurahs.size > 0 ? Array.from(uniqueSurahs).join('، ') : "جاري تحديد الأجزاء المسجلة";

  const tbody = document.getElementById('spGradesTableBody');
  tbody.innerHTML = '';
  logs.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${l.date}</td>
      <td><span class="badge info">${l.type}</span></td>
      <td>${l.content}</td>
      <td><span class="badge success" style="font-weight:800;">${l.evaluation}</span></td>
      <td style="font-size:0.8rem; color:var(--text-secondary);">${l.notes || '---'}</td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody.children.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding:20px;">لا يوجد سجل تسميع مسجل حالياً.</td></tr>`;
  }
}

// ==================== EXCEL EXPORT LOGIC ====================

function exportToExcel(type) {
  if (currentUser.role !== 'superadmin') {
    alert("عذراً، هذه الصلاحية متوفرة فقط لحساب المشرف العام د. أحمد فاضل.");
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  if (type === 'subscribed') {
    const data = database.students
      .filter(s => s.status === 'active' && !isStudentBlocked(s))
      .map(s => ({
        "المسجد التابع له": database.mosques.find(m => m.id === s.mosqueId)?.name || 'عام',
        "اسم الطالب": s.name,
        "رقم الهاتف": s.phone,
        "نوع الاشتراك": s.subType,
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
      .filter(s => s.status === 'active' && isStudentBlocked(s))
      .map(s => ({
        "المسجد التابع له": database.mosques.find(m => m.id === s.mosqueId)?.name || 'عام',
        "اسم الطالب": s.name,
        "رقم الهاتف": s.phone,
        "نوع الاشتراك": s.subType,
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
      "المسجد": database.mosques.find(m => m.id === l.mosqueId)?.name || 'عام',
      "التاريخ والوقت": l.date,
      "اسم الطالب": l.studentName,
      "المعلم / المشرف": l.teacherName,
      "نوع العملية": l.type,
      "المحتوى": l.content,
      "التقييم": l.evaluation,
      "ملاحظات": l.notes
    }));
    
    downloadExcel(data, "سجلات المعلمين والمراقبة");
  } 
  else if (type === 'all') {
    const wb = XLSX.utils.book_new();

    const activeStds = database.students.map(s => ({
      "المسجد": database.mosques.find(m => m.id === s.mosqueId)?.name || 'عام',
      "الاسم": s.name, "الهاتف": s.phone, "نوع الاشتراك": s.subType, "الاشتراك": s.subDate, "التجديد": s.renewDate, "الحالة": isStudentBlocked(s) ? "موقوف" : "نشط"
    }));
    const mosquesList = database.mosques.map(m => ({
      "اسم المسجد": m.name, "تاريخ الإنشاء": m.createdDate, "الحالة": m.status === 'active' ? "نشط" : "موقوف"
    }));
    const teachersList = database.teachers.map(t => ({
      "المعلم": t.name, "المسجد": database.mosques.find(m => m.id === t.mosqueId)?.name || 'عام', "الرتبة": t.rank, "الباسوورد": t.password
    }));
    const teacherLogs = database.logs.map(l => ({
      "المسجد": database.mosques.find(m => m.id === l.mosqueId)?.name || 'عام',
      "التاريخ": l.date, "الطالب": l.studentName, "المعلم": l.teacherName, "العملية": l.type, "التقدير": l.evaluation
    }));
    const payRecords = database.payments.map(p => ({
      "المسجد": database.mosques.find(m => m.id === p.mosqueId)?.name || 'عام',
      "التاريخ": p.date, "الطالب": p.studentName, "المبلغ": p.amount, "طريقة الدفع": p.payMethod, "المسجل": p.recordedBy
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mosquesList), "إدارة المساجد");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teachersList), "المعلمون والصلاحيات");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activeStds), "الطلاب المسجلين");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherLogs), "سجلات التسميع");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payRecords), "سجلات المقبوضات والمالية");

    XLSX.writeFile(wb, "أكاديمية_أحمد_فاضل_تقرير_شامل_SaaS_V6.xlsx");
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
  downloadAnchor.setAttribute("download", `نسخة_احتياطية_منظومة_أحمد_فاضل_V6_${new Date().toISOString().split('T')[0]}.json`);
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
      if (importedDb.students && importedDb.logs && importedDb.mosques && importedDb.teachers) {
        database = importedDb;
        saveToLocalStorage();
        alert("تم استعادة النسخة الاحتياطية وتحديث قاعدة البيانات بنجاح!");
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
