var COURSE_CONFIG = [{"id":"vr_studio","label":"VR-студия","total":36,"profilesKey":"vr_profiles","mode":"lesson_l","lessonPrefix":"vr_u_","progressSuffix":"_l_","href":"../../Курс-VR-студия/Список занятий VR студии.html"},{"id":"blender_3d","label":"Blender 3D","total":28,"profilesKey":"blender_profiles","mode":"lesson_l","lessonPrefix":"blender_u_","progressSuffix":"_l_","href":"../../Курс-Blender-3D/index.html"},{"id":"csharp_course","label":"Углублённый курс C# (часть VR-студии)","total":6,"profilesKey":"cs_profiles","mode":"lesson_l","lessonPrefix":"cs_u_","progressSuffix":"_l_","href":"../../Курс C#/Доступ к курсу C#.html","parent":"vr_studio","requireLesson":4,"lockText":"Для доступа заверши занятия 3\u20134 в модуле \u00abСтарт в C# и ООП\u00bb VR-студии."},{"id":"pn_navigator","label":"Проектный навигатор","total":36,"profilesKey":"pdn-course-users","idField":"id","mode":"week_obj","progressPrefix":"pdn-course-progress-","href":"../../Курс-Проектный-навигатор/index.html"},{"id":"bpla_course","label":"БПЛА","total":28,"profilesKey":"bpla-course-users","idField":"id","mode":"week_obj","progressPrefix":"bpla-course-progress-","href":"../../Курс-БПЛА/index.html"},{"id":"kompas_3d","label":"КОМПАС-3D","total":28,"profilesKey":"kompas-course-users","idField":"id","mode":"week_obj","progressPrefix":"kompas-course-progress-","href":"../../Курс-КОМПАС-3D/index.html"},{"id":"roboto_course","label":"Робототехника (EV3)","total":28,"profilesKey":"roboto-course-users","idField":"id","mode":"week_obj","progressPrefix":"roboto-course-progress-","href":"../../Курс-Робототехника/index.html"},{"id":"electron_course","label":"Электроника","total":28,"profilesKey":"electron-course-users","idField":"id","mode":"week_obj","progressPrefix":"electron-course-progress-","href":"../../Курс-Электроника/index.html"}];

/* ============================================================
   ТЕХНОЛОГИЧЕСКАЯ ЛАБОРАТОРИЯ — сквозная система ЛК и прогресса
   tl-portal-core.js  ·  version 0.1.0 (фундамент)
   ------------------------------------------------------------
   Единый модуль для портала ТЛ и страниц курсов (которые ещё
   создаются). Работает офлайн без сервера: профиль, сессия и
   прогресс хранятся в localStorage под общими ключами, поэтому
   «сквозная регистрация» даст одно окно входа и на портале, и
   на курсе (при открытии через одинаковый хостинг/локально).

   КЛЮЧИ (общие для портала и курсов):
     tl.users           — база зарегистрированных пользователей {email: profile}
     tl.session         — текущая сессия (email + роль)
     tl.progress.<crID> — прогресс занятий курса {lessonId: done}
     tl.waitlist        — «напомнить о записи/курсе» (когда курс готовится)

   КАК ПОДКЛЮЧИТЬ НА ЛЮБОЙ СТРАНИЦЕ (портал или курс):
     <script src="tl-portal-core.js"></script>
     <script> TLCore.init({ cabinetEl:'#cabinet', loginBtn:'#loginBtn' }); </script>
   ============================================================ */
(function (global) {
  'use strict';

  var NS = 'tl.';
  var VERSION = '0.1.0';

  function read(key, def) {
    try { var v = localStorage.getItem(NS + key); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(NS + key, JSON.stringify(val)); } catch (e) {}
  }

  function uid() {
    return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* -------- Хранилище пользователей -------- */
  function getUsers() { return read('users', {}); }
  function saveUsers(u) { write('users', u); }
  function getUserByEmail(email) {
    var k = String(email || '').trim().toLowerCase();
    return getUsers()[k] || null;
  }
  function getSession() { return read('session', null); }
  function setSession(s) { write('session', s); }
  function clearSession() { write('session', null); }

  function hashPass(pass) {
    // Демо-хэш (не для боевого сервера). При переводе на сервер заменить на bcrypt.
    var h = 0, s = String(pass || '');
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return 'h' + Math.abs(h).toString(36);
  }

  /* -------- Текущий пользователь -------- */
  function currentUser() {
    var s = getSession();
    if (!s || !s.email) return null;
    return getUserByEmail(s.email);
  }

  /* -------- Регистрация / вход / выход -------- */
  function register(data) {
    var email = String(data.email || '').trim().toLowerCase();
    if (!email || !data.pass) return { ok: false, error: 'Укажите e-mail и пароль.' };
    if (getUserByEmail(email)) return { ok: false, error: 'Пользователь с таким e-mail уже зарегистрирован. Выполните вход.' };
    var profile = {
      id: uid(),
      role: data.role === 'teacher' ? 'teacher' : 'learner',
      name: String(data.name || '').trim(),
      cls: String(data.cls || '').trim(),
      school: String(data.school || '').trim(),
      phone: String(data.phone || '').trim(),
      email: email,
      labs: Array.isArray(data.labs) ? data.labs : [],
      passHash: hashPass(data.pass),
      createdAt: new Date().toISOString(),
      extra: {}
    };
    var users = getUsers();
    users[email] = profile;
    saveUsers(users);
    setSession({ email: email, role: profile.role });
    return { ok: true, user: currentUser() };
  }

  function login(email, pass) {
    var e = String(email || '').trim().toLowerCase();
    var u = getUserByEmail(e);
    if (!u) return { ok: false, error: 'Пользователь не найден. Зарегистрируйтесь.' };
    if (u.passHash !== hashPass(pass)) return { ok: false, error: 'Неверный пароль.' };
    setSession({ email: e, role: u.role });
    return { ok: true, user: currentUser() };
  }

  function logout() { clearSession(); emit('logout'); }

  /* -------- Администратор -------- */
  var ADMIN_EMAIL = 'admin';
  var ADMIN_PASS = 'admin';

  function ensureAdmin() {
    var users = getUsers();
    if (!users[ADMIN_EMAIL]) {
      users[ADMIN_EMAIL] = {
        id: 'admin1',
        role: 'admin',
        name: 'Администратор',
        email: ADMIN_EMAIL,
        cls: '',
        school: '',
        phone: '',
        labs: [],
        passHash: hashPass(ADMIN_PASS),
        createdAt: new Date().toISOString(),
        extra: {}
      };
      saveUsers(users);
    }
  }

  function isAdmin() {
    var u = currentUser();
    return !!(u && u.role === 'admin');
  }

  function listUsers() {
    if (!isAdmin()) return { ok: false, error: 'Только администратор может просматривать пользователей.' };
    var users = getUsers();
    var arr = Object.keys(users).map(function (k) { return users[k]; });
    return { ok: true, users: arr };
  }

  // patch: { name, cls, school, phone, labs, role, email, pass }
  // смена email переносит профиль (и прогресс, т.к. привязан к id) на новый ключ
  function updateUser(oldEmail, patch) {
    if (!isAdmin()) return { ok: false, error: 'Только администратор может редактировать пользователей.' };
    if (patch && patch.email && String(patch.email).trim().toLowerCase() === ADMIN_EMAIL) {
      return { ok: false, error: 'Нельзя изменить e-mail администратора.' };
    }
    var users = getUsers();
    var key = String(oldEmail || '').trim().toLowerCase();
    var u = users[key];
    if (!u) return { ok: false, error: 'Пользователь не найден.' };
    var newKey = key;
    if (patch && patch.email) {
      newKey = String(patch.email).trim().toLowerCase();
      if (newKey !== key && users[newKey]) return { ok: false, error: 'Пользователь с таким e-mail уже существует.' };
    }
    if (patch && patch.name !== undefined) u.name = String(patch.name || '').trim();
    if (patch && patch.cls !== undefined) u.cls = String(patch.cls || '').trim();
    if (patch && patch.school !== undefined) u.school = String(patch.school || '').trim();
    if (patch && patch.phone !== undefined) u.phone = String(patch.phone || '').trim();
    if (patch && patch.labs !== undefined) u.labs = Array.isArray(patch.labs) ? patch.labs : [];
    if (patch && patch.role !== undefined) u.role = patch.role === 'teacher' ? 'teacher' : (patch.role === 'admin' ? 'admin' : 'learner');
    if (patch && patch.pass) u.passHash = hashPass(String(patch.pass));
    if (newKey !== key) {
      u.email = newKey;
      delete users[key];
      users[newKey] = u;
      saveUsers(users);
    } else {
      u.email = u.email || key;
      if (patch && patch.email) u.email = newKey;
      saveUsers(users);
    }
    return { ok: true, user: u };
  }

  /* -------- Публичный профиль (для педагога на странице) -------- */
  function publicProfile(u) {
    if (!u) return null;
    return {
      name: u.name,
      role: u.role,
      labs: u.labs || [],
      cls: u.cls,
      school: u.school,
      email: u.email
    };
  }

  /* -------- Прогресс курсов -------- */
  function getProgress(courseId) {
    var cid = String(courseId || '').trim() || 'unknown';
    return read('progress.' + cid, {});
  }
  function setLessonDone(courseId, lessonId, done) {
    var cid = String(courseId || '').trim() || 'unknown';
    var p = getProgress(cid);
    if (done) p[String(lessonId)] = { done: true, at: new Date().toISOString() };
    else delete p[String(lessonId)];
    write('progress.' + cid, p);
    emit('progress', { courseId: cid, lessonId: lessonId, done: !!done });
    return p;
  }
  function isLessonDone(courseId, lessonId) {
    return !!getProgress(courseId)[String(lessonId)];
  }
  function progressStats(courseId) {
    var p = getProgress(courseId);
    var vals = Object.keys(p).filter(function (k) { return p[k] && p[k].done; });
    return { done: vals.length, total: vals.length }; // total заполняется при подключении курса
  }

  /* -------- Лист ожидания (когда курс ещё готовится) -------- */
  function waitlist(courseId, label) {
    var w = read('waitlist', []);
    var u = currentUser();
    if (!u) return { ok: false, error: 'Сначала войдите в личный кабинет.' };
    w = w.filter(function (x) { return !(x.email === u.email && x.courseId === courseId); });
    w.push({ email: u.email, name: u.name, courseId: courseId, label: label || courseId, at: new Date().toISOString() });
    write('waitlist', w);
    return { ok: true };
  }

  /* -------- События -------- */
  var listeners = {};
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }
  function emit(ev, payload) {
    (listeners[ev] || []).forEach(function (fn) { try { fn(payload); } catch (e) {} });
    if (global.document) {
      var d = new CustomEvent('tl:' + ev, { detail: payload || {} });
      document.dispatchEvent(d);
    }
  }

  /* ============================================================
     UI: модальное окно «Вход / Регистрация» и панель ЛК.
     Модуль вставляет стили и DOM самостоятельно, поэтому его
     можно подключить на любую страницу (портал или курс).
     ============================================================ */
  var INJECTED = false;
  var modalId = 'tlAuthModal';
  var cabinetId = 'tlCabinetPanel';

  function ensureStyle() {
    if (INJECTED) return;
    INJECTED = true;
    var css = '' +
      '#tlAuthModal{position:fixed;inset:0;z-index:99990;display:none;align-items:center;justify-content:center;background:rgba(5,7,10,.72);padding:16px;}' +
      '#tlAuthModal.open{display:flex;}' +
      '.tl-box{background:#161921;border:1px solid #2A2D35;border-radius:12px;max-width:460px;width:100%;padding:26px 30px;color:#EAECEF;font-family:system-ui,,-apple-system,"Segoe UI",Arial,sans-serif;position:relative;max-height:92vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.5);}' +
      '.tl-box h2{margin:0 0 4px;font-size:20px;font-family:"Space Grotesk","Unbounded","Montserrat",system-ui,sans-serif;}' +
      '.tl-box .tl-sub{color:#8B8FA3;font-size:13px;margin-bottom:16px;}' +
      '.tl-close{position:absolute;top:12px;right:16px;background:none;border:none;color:#8B8FA3;font-size:22px;cursor:pointer;line-height:1;}' +
      '.tl-close:hover{color:#EAECEF;}' +
      '.tl-field{margin-bottom:12px;}' +
      '.tl-field label{display:block;font-size:13px;color:#8B8FA3;margin-bottom:4px;font-weight:600;}' +
      '.tl-field input,.tl-field select{width:100%;background:#0D0F14;border:1px solid #2A2D35;border-radius:6px;color:#EAECEF;padding:10px 12px;font:14px/1.4 system-ui,sans-serif;}' +
      '.tl-field input:focus,.tl-field select:focus{outline:none;border-color:#2D7AFF;}' +
      '.tl-row{display:flex;gap:10px;}.tl-row .tl-field{flex:1;}' +
      '.tl-switch{display:flex;gap:6px;margin-bottom:14px;}' +
      '.tl-switch button{flex:1;background:#0D0F14;border:1px solid #2A2D35;border-radius:6px;color:#8B8FA3;padding:9px;font-weight:600;cursor:pointer;font-size:13.5px;}' +
      '.tl-switch button.on{color:#fff;border-color:#2D7AFF;background:rgba(45,122,255,.15);}' +
      '.tl-btn{width:100%;background:#2D7AFF;border:none;border-radius:6px;color:#fff;font-weight:700;padding:12px;font-size:15px;cursor:pointer;margin-top:6px;}' +
      '.tl-btn:hover{background:#1A6AE0;}' +
      '.tl-btn.ghost{background:transparent;border:1px solid #2A2D35;color:#EAECEF;}' +
      '.tl-err{color:#FF5A5A;font-size:13px;min-height:18px;margin-top:6px;}' +
      '.tl-ok{color:#00D68F;font-size:13px;min-height:18px;margin-top:6px;}' +
      '.tl-labs{display:flex;flex-wrap:wrap;gap:6px;}' +
      '.tl-labs button{background:#0D0F14;border:1px solid #2A2D35;border-radius:999px;color:#8B8FA3;padding:5px 10px;font-size:12px;cursor:pointer;}' +
      '.tl-labs button.on{color:#fff;border-color:#2D7AFF;background:rgba(45,122,255,.18);}' +
      '#tlCabinetPanel{position:fixed;top:64px;right:16px;z-index:99970;width:300px;background:#161921;border:1px solid #2A2D35;border-radius:12px;color:#EAECEF;padding:18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.45);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;display:none;}' +
      '#tlCabinetPanel.open{display:block;}' +
      '#tlCabinetPanel .tl-cab-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}' +
      '#tlCabinetPanel h3{margin:0;font-size:16px;font-family:"Space Grotesk","Unbounded","Montserrat",system-ui,sans-serif;}' +
      '#tlCabinetPanel .tl-cab-role{font-size:12px;color:#2D7AFF;text-transform:uppercase;letter-spacing:.06em;font-weight:700;}' +
      '#tlCabinetPanel .tl-cab-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#8B8FA3;border-bottom:1px dashed #2A2D35;}' +
      '#tlCabinetPanel .tl-cab-row b{color:#EAECEF;font-weight:600;text-align:right;}' +
      '#tlCabinetPanel .tl-cab-prog{margin-top:10px;}' +
      '#tlCabinetPanel .tl-cab-prog span{font-size:12px;color:#8B8FA3;}' +
      '#tlCabinetPanel a{color:#2D7AFF;text-decoration:none;}' +
      '#tlCabinetPanel .tl-logout{margin-top:12px;width:100%;background:transparent;border:1px solid #2A2D35;color:#8B8FA3;padding:8px;border-radius:6px;cursor:pointer;font-size:13px;}' +
      '#tlCabinetPanel .tl-logout:hover{color:#fff;}' +
      '.tl-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#1B1F2A;border:1px solid #00D68F;color:#00D68F;padding:10px 18px;border-radius:8px;font-size:14px;z-index:99995;box-shadow:0 10px 30px rgba(0,0,0,.4);transition:opacity .3s;opacity:0;}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  var LAB_META = [
    { id: 'LAB.01', name: 'Робототехника' }, { id: 'LAB.02', name: 'Электроника' },
    { id: 'LAB.03', name: 'Blender 3D' }, { id: 'LAB.04', name: 'КОМПАС-3D' },
    { id: 'LAB.05', name: 'БПЛА' }, { id: 'LAB.06', name: 'VR-разработка' },
    { id: 'LAB.07', name: 'Проектная деятельность' }
  ];
  function labLabel(id) { for (var i = 0; i < LAB_META.length; i++) if (LAB_META[i].id === id) return id + ' · ' + LAB_META[i].name; return id; }

  function toast(msg, ok) {
    var el = document.createElement('div');
    el.className = 'tl-toast';
    el.textContent = msg;
    el.style.borderColor = (ok === false ? '#FFAA00' : '#00D68F');
    el.style.color = (ok === false ? '#FFAA00' : '#00D68F');
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = 1; });
    setTimeout(function () { el.style.opacity = 0; setTimeout(function () { el.remove(); }, 400); }, 2600);
  }

  function openModal(tab) {
    ensureStyle();
    var m = document.getElementById(modalId);
    if (!m) { buildModal(); m = document.getElementById(modalId); }
    m.classList.add('open');
    switchTab(tab || (getSession() ? 'reg' : 'login'));
  }
  function closeModal() { var m = document.getElementById(modalId); if (m) m.classList.remove('open'); }
  function switchTab(t) {
    var mode = t === 'login' ? 'login' : 'reg';
    var btnL = document.getElementById('tlSwitchLogin');
    var btnR = document.getElementById('tlSwitchReg');
    if (btnL) btnL.className = 'on' === mode ? 'on' : '';
    if (btnR) btnR.className = mode === 'reg' ? 'on' : '';
    var f = document.getElementById('tlFormLogin');
    var r = document.getElementById('tlFormReg');
    if (f) f.style.display = mode === 'login' ? 'block' : 'none';
    if (r) r.style.display = mode === 'reg' ? 'block' : 'none';
    if (mode === 'reg') syncRoleFields();
  }
  function buildModal() {
    var d = document.createElement('div');
    d.id = modalId;
    d.innerHTML = '' +
      '<div class="tl-box">' +
      '<button class="tl-close" type="button" onclick="TLCore.closeAuth()">&times;</button>' +
      '<h2>Личный кабинет ТЛ</h2>' +
      '<div class="tl-sub">Вход и регистрация работают на портале и на всех курсах объединения.</div>' +
      '<div class="tl-switch">' +
      '<button type="button" id="tlSwitchLogin" onclick="TLCore.authTab(\'login\')">Вход</button>' +
      '<button type="button" id="tlSwitchReg" onclick="TLCore.authTab(\'reg\')">Регистрация</button>' +
      '</div>' +
      '<form id="tlFormLogin" onsubmit="return TLCore.doLogin(event)">' +
      '<div class="tl-field"><label>Логин или e-mail</label><input type="text" id="tlLoginEmail" required autocomplete="username"></div>' +
      '<div class="tl-field"><label>Пароль</label><input type="password" id="tlLoginPass" required></div>' +
      '<div class="tl-err" id="tlLoginErr"></div>' +
      '<button class="tl-btn" type="submit">Войти</button>' +
      '</form>' +
      '<form id="tlFormReg" style="display:none" onsubmit="return TLCore.doRegister(event)">' +
      '<div class="tl-field"><label>ФИО</label><input type="text" id="tlRegName" required></div>' +
      '<div class="tl-field"><label>Роль</label><select id="tlRegRole">' +
      '<option value="learner">Ученик (обучающийся)</option>' +
      '<option value="teacher">Педагог / наставник</option>' +
      '</select></div>' +
      '<div id="tlRegLearnerFields">' +
      '<div class="tl-row">' +
      '<div class="tl-field"><label>Класс / курс</label><input type="text" id="tlRegCls" placeholder="Например: 9 «А»"></div>' +
      '<div class="tl-field"><label>Школа</label><input type="text" id="tlRegSchool" placeholder="СОШ №…"></div>' +
      '</div>' +
      '<div class="tl-field"><label>Телефон родителя (необязательно)</label><input type="tel" id="tlRegPhone"></div>' +
      '</div>' +
      '<div class="tl-field"><label>Выбери лаборатории (можно несколько)</label><div class="tl-labs" id="tlRegLabs"></div></div>' +
      '<div class="tl-row">' +
      '<div class="tl-field"><label>E-mail</label><input type="email" id="tlRegEmail" required></div>' +
      '</div>' +
      '<div class="tl-row">' +
      '<div class="tl-field"><label>Пароль</label><input type="password" id="tlRegPass" required></div>' +
      '<div class="tl-field"><label>Повторите</label><input type="password" id="tlRegPass2" required></div>' +
      '</div>' +
      '<div class="tl-err" id="tlRegErr"></div>' +
      '<button class="tl-btn" type="submit">Создать личный кабинет</button>' +
      '<button class="tl-btn ghost" type="button" style="margin-top:8px;" onclick="TLCore.doGuest()">Продолжить как гость</button>' +
      '</form>' +
      '</div>';
    document.body.appendChild(d);
    // лабораторные чипы
    var labBox = document.getElementById('tlRegLabs');
    if (labBox) {
      var sel = [];
      LAB_META.forEach(function (l) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = l.id;
        b.title = l.name;
        b.onclick = function () {
          var i = sel.indexOf(l.id);
          if (i === -1) sel.push(l.id); else sel.splice(i, 1);
          b.classList.toggle('on', i === -1);
        };
        labBox.appendChild(b);
      });
      labBox._tlSelected = sel;
    }
    var roleSel = document.getElementById('tlRegRole');
    if (roleSel) roleSel.addEventListener('change', syncRoleFields);
    syncRoleFields();
  }

  function selectedLabs() {
    var labBox = document.getElementById('tlRegLabs');
    return labBox && labBox._tlSelected ? labBox._tlSelected : [];
  }

  function syncRoleFields() {
    var role = document.getElementById('tlRegRole');
    var learner = document.getElementById('tlRegLearnerFields');
    if (!role || !learner) return;
    var isTeacher = role.value === 'teacher';
    learner.style.display = isTeacher ? 'none' : 'block';
    // если педагог — очищаем нерелевантные поля
    if (isTeacher) {
      var cls = document.getElementById('tlRegCls');
      var school = document.getElementById('tlRegSchool');
      var phone = document.getElementById('tlRegPhone');
      if (cls) cls.value = '';
      if (school) school.value = '';
      if (phone) phone.value = '';
    }
  }

  function openCabinet() {
    ensureStyle();
    var user = currentUser();
    if (!user) { openModal('login'); return; }
    var p = document.getElementById(cabinetId);
    if (!p) {
      p = document.createElement('div');
      p.id = cabinetId;
      p.innerHTML = '<div class="tl-cab-head"><div><h3 id="tlCabName"></h3><div class="tl-cab-role" id="tlCabRole"></div></div></div>' +
        '<div id="tlCabBody"></div>' +
        '<div id="tlAdminPanel" style="display:none;"></div>' +
        '<button class="tl-logout" id="tlCabLogout">Выйти из кабинета</button>';
      document.body.appendChild(p);
      p.querySelector('#tlCabLogout').onclick = function () { closeCabinet(); logout(); renderAuthWidget(); };
    }
    renderCabinet();
    p.classList.add('open');
  }
  function closeCabinet() { var p = document.getElementById(cabinetId); if (p) p.classList.remove('open'); }
  
  function courseProgressOf(cfg, user) {
    var uid = user && (user.id || user.email);
    var res = { done: 0, total: cfg.total };
    if (!uid) return res;
    var profiles = [];
    try { profiles = JSON.parse(localStorage.getItem(cfg.profilesKey) || '[]') || []; } catch (e) {}
    var p = profiles.find(function (x) { return x && (String(x.uid) === String(user.id) || String(x.id) === String(user.id) || x.email === user.email || (x.name || '').toLowerCase() === (user.name || '').toLowerCase()); });
    var courseUid = p ? (p.uid || p.id) : null;
    if (!courseUid) return res;
    for (var i = 1; i <= cfg.total; i++) {
      var done = false;
      try {
        if (cfg.mode === 'lesson_l') { done = localStorage.getItem(cfg.lessonPrefix + courseUid + cfg.progressSuffix + i) === '1'; }
        else if (cfg.mode === 'week_obj') { var obj = JSON.parse(localStorage.getItem(cfg.progressPrefix + courseUid) || '{}') || {}; done = !!obj['w' + i]; }
      } catch (e) {}
      if (done) res.done++;
    }
    return res;
  }
  function getAllAchievements() {
    var u = currentUser();
    var result = { courses: {}, doneTotal: 0, totalAll: 0 };
    if (!u) return result;
    COURSE_CONFIG.forEach(function (cfg) {
      if (cfg.parent) return;
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      var pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
      html += '<a href="' + cfg.href + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;border:1px solid #2A2D35;border-radius:8px;text-decoration:none;color:#EAECEF;"><span style="font-weight:600;">' + escapeHtml(cfg.label) + '</span><span style="font-size:12px;color:#8B8FA3;">' + pr.done + ' / ' + pr.total + ' · ' + pct + '%</span></a>';
      COURSE_CONFIG.forEach(function (child) {
        if (child.parent !== cfg.id) return;
        var cpr = ach.courses[child.id] || { done: 0, total: child.total };
        var unlocked = pr.done >= (child.requireLesson || 99);
        var status = unlocked
          ? '<span style="font-size:12px;color:#8B8FA3;">открыт · ' + cpr.done + ' / ' + cpr.total + '</span>'
          : '<span style="font-size:12px;color:#B45309;">🔒 ' + escapeHtml(child.lockText || 'Доступ после прохождения условий') + '</span>';
        html += '<a href="' + child.href + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px;padding:6px 10px;border:1px dashed #3A3E47;border-radius:8px;text-decoration:none;color:#EAECEF;"><span style="font-weight:600;font-size:13px;padding-left:14px;">↳ ' + escapeHtml(child.label) + '</span>' + status + '</a>';
      });
    });
    return result;
  }
  function renderCabinet() {
    var u = currentUser();
    if (!u) return;
    var elName = document.getElementById('tlCabName');
    var elRole = document.getElementById('tlCabRole');
    var elBody = document.getElementById('tlCabBody');
    if (elName) elName.textContent = u.name || u.email;
    if (elRole) elRole.textContent = u.role === 'admin' ? 'Администратор' : (u.role === 'teacher' ? 'Педагог / наставник' : 'Обучающийся');
    if (!elBody) return;
    var labs = (u.labs || []).map(labLabel).join(', ') || '—';
    var ach = getAllAchievements();
    var totalPct = ach.totalAll ? Math.round(ach.doneTotal / ach.totalAll * 100) : 0;
    var html = '';
    html += '<div class="tl-cab-row"><span>E-mail</span><b>' + escapeHtml(u.email) + '</b></div>';
    html += '<div class="tl-cab-row"><span>Класс</span><b>' + escapeHtml(u.cls || '—') + '</b></div>';
    html += '<div class="tl-cab-row"><span>Школа</span><b>' + escapeHtml(u.school || '—') + '</b></div>';
    html += '<div class="tl-cab-row"><span>Лаборатории</span><b>' + escapeHtml(labs) + '</b></div>';
    html += '<div style="margin-top:10px;padding:8px 10px;border:1px solid #2A2D35;border-radius:8px;"><span style="font-weight:700;display:block;margin-bottom:4px;">Мои достижения</span>';
    html += '<div class="tl-cab-row"><span>Всего пройдено занятий</span><b>' + ach.doneTotal + ' из ' + ach.totalAll + '</b></div>';
    html += '<div style="margin-top:8px;"><div style="background:#2A2D35;border-radius:999px;height:8px;overflow:hidden;"><div style="width:' + totalPct + '%;height:100%;background:#2D7AFF;border-radius:999px;"></div></div><div style="color:#8B8FA3;font-size:11px;margin-top:4px;">Общий прогресс по всем курсам · ' + totalPct + '%</div></div></div>';
    COURSE_CONFIG.forEach(function (cfg) {
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      var pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
      html += '<a href="' + cfg.href + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;border:1px solid #2A2D35;border-radius:8px;text-decoration:none;color:#EAECEF;"><span style="font-weight:600;">' + escapeHtml(cfg.label) + '</span><span style="font-size:12px;color:#8B8FA3;">' + pr.done + ' / ' + pr.total + ' · ' + pct + '%</span></a>';
    });
    html += '<div style="margin-top:10px;text-align:right;"><button class="tl-logout" onclick="TLCore.logout();TLCore.refreshUI();" style="background:transparent;border:1px solid #3A3E47;color:#8B8FA3;font-size:12px;border-radius:6px;padding:4px 10px;cursor:pointer;">Выйти из кабинета</button></div>';
    elBody.innerHTML = html;
    var ap = document.getElementById('tlAdminPanel');
    if (ap) {
      var isAdmin = (u.role === 'admin');
      ap.style.display = isAdmin ? 'block' : 'none';
      if (isAdmin) {
        var users = getUsers();
        var rows = Object.keys(users).map(function (email) {
          var p = users[email];
          return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #24272E;"><span>' + escapeHtml(p.name || email) + ' <span style="color:#8B8FA3;font-size:11px;">(' + escapeHtml(p.role || '') + ')</span></span><button class="tl-adm-edit" data-email="' + email + '" style="background:transparent;border:1px solid #3A3E47;color:#8B8FA3;font-size:12px;border-radius:6px;padding:2px 8px;cursor:pointer;">Ред.</button></div>';
        }).join('');
        ap.innerHTML = '<div style="padding:6px 0;font-weight:700;">Пользователи</div>' + (rows || '<div style="color:#8B8FA3;font-size:12px;">Нет пользователей.</div>');
        var admlist = ap.querySelectorAll('.tl-adm-edit');
        admlist.forEach(function (b) { b.onclick = function () { adminEdit(b.getAttribute('data-email')); }; });
      }
    }
  }

  function adminEdit(uid) {
    var u = currentUser();
    var ap = document.getElementById('tlAdminPanel');
    if (!ap || !u || u.role !== 'admin') return;
    var users = getUsers();
    var target = users[uid];
    if (!target) return;
    ap.innerHTML = '<div style="padding:8px 0;"><b>Редактирование: ' + escapeHtml(target.name || target.email) + '</b></div>' +
      '<div><label style="font-size:12px;color:#8B8FA3;">Имя</label><input id="tlAdmName" value="' + escapeHtml(target.name || '') + '" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;"></div>' +
      '<div style="margin-top:6px;"><label style="font-size:12px;color:#8B8FA3;">Класс</label><input id="tlAdmCls" value="' + escapeHtml(target.cls || '') + '" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;"></div>' +
      '<div style="margin-top:6px;"><label style="font-size:12px;color:#8B8FA3;">Школа</label><input id="tlAdmSchool" value="' + escapeHtml(target.school || '') + '" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;"></div>' +
      '<div style="margin-top:10px;"><button class="tl-adm-save" style="background:#2D7AFF;border:0;color:#fff;font-size:13px;border-radius:6px;padding:6px 14px;cursor:pointer;">Сохранить</button></div>';
    var sb = ap.querySelector('.tl-adm-save');
    if (sb) sb.onclick = function () { adminSave(uid); };
  }
  function adminSave(uid) {
    var u = currentUser();
    if (!u || u.role !== 'admin') return;
    var users = getUsers();
    var target = users && users[uid];
    if (!target) return;
    target.name = (document.getElementById('tlAdmName') || {}).value || target.name;
    target.cls = (document.getElementById('tlAdmCls') || {}).value || '';
    target.school = (document.getElementById('tlAdmSchool') || {}).value || '';
    saveUsers(users);
    renderCabinet();
  }

  
  function renderAuthWidget() {
    var btns = document.querySelectorAll('.tl-auth-btn');
    var u = currentUser();
    btns.forEach(function (b) {
      if (u) {
        b.textContent = u.role === 'admin' ? 'Панель администратора' : (u.role === 'teacher' ? 'Кабинет педагога' : 'Мой кабинет');
        b.onclick = function () { openCabinet(); };
      } else {
        b.textContent = 'Войти';
        b.onclick = function () { openModal('login'); };
      }
    });
  }

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
var API = {
    version: VERSION,
    init: function (opts) { opts = opts || {}; ensureAdmin(); ensureStyle(); renderAuthWidget(); if (opts.onAuthChange) on('login', opts.onAuthChange), on('logout', opts.onAuthChange); emit('ready', { user: currentUser() }); return API; },
    register: register,
    login: login,
    logout: logout,
    currentUser: currentUser,
    isTeacher: function () { var u = currentUser(); return !!(u && u.role === 'teacher'); },
    isAdmin: isAdmin,
    listUsers: listUsers,
    updateUser: updateUser,
    getProgress: getProgress,
    setLessonDone: setLessonDone,
    isLessonDone: isLessonDone,
    getAchievements: getAllAchievements,
    waitlist: waitlist,
    openAuth: function (tab) { openModal(tab || 'login'); },
    closeAuth: closeModal,
    authTab: switchTab,
    openCabinet: openCabinet,
    closeCabinet: closeCabinet,
    adminEdit: adminEdit,
    adminSave: adminSave,
    refreshUI: renderAuthWidget,
    on: on,
    _publicProfile: publicProfile,
    doRegister: function (e) { if (e && e.preventDefault) e.preventDefault(); var email = (document.getElementById('tlRegEmail') || {}).value || ''; var pass = (document.getElementById('tlRegPass') || {}).value || ''; var pass2 = (document.getElementById('tlRegPass2') || {}).value || ''; var errEl = document.getElementById('tlRegErr'); if (pass !== pass2) { if (errEl) errEl.textContent = 'Пароли не совпадают.'; return false; } var name = (document.getElementById('tlRegName') || {}).value || ''; var data = { name: name, cls: (document.getElementById('tlRegCls') || {}).value, school: (document.getElementById('tlRegSchool') || {}).value, phone: (document.getElementById('tlRegPhone') || {}).value, role: (document.getElementById('tlRegRole') || {}).value, email: email, pass: pass, labs: selectedLabs() }; var res = register(data); if (!res.ok) { if (errEl) errEl.textContent = res.error; return false; } if (errEl) errEl.textContent = ''; closeModal(); renderCabinet(); renderAuthWidget(); emit('login', res.user); toast('Добро пожаловать, ' + (name || email) + '!'); return false; },
    doLogin: function (e) { if (e && e.preventDefault) e.preventDefault(); var email = (document.getElementById('tlLoginEmail') || {}).value || ''; var pass = (document.getElementById('tlLoginPass') || {}).value || ''; var res = login(email, pass); var errEl = document.getElementById('tlLoginErr'); if (!res.ok) { if (errEl) errEl.textContent = res.error; return false; } if (errEl) errEl.textContent = ''; closeModal(); renderCabinet(); renderAuthWidget(); emit('login', res.user); toast('Вы вошли в личный кабинет.'); return false; },
    doGuest: function () { closeModal(); toast('Режим гостя: прогресс не сохранится. Лучше войти.'); location.href = location.pathname; }
  };
global.TLCore = API;

  // Автоподключение, если на странице есть кнопки с data-tl-auth
  if (global.document) {
    document.addEventListener('DOMContentLoaded', function () {
      renderAuthWidget();
    });
  }
})(window);