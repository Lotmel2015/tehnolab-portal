var COURSE_CONFIG = [{"id":"vr_studio","label":"VR-студия","total":36,"profilesKey":"vr_profiles","mode":"lesson_l","lessonPrefix":"vr_u_","progressSuffix":"_l_","href":"../../Курс-VR-студия/Список занятий VR студии.html"},{"id":"blender_3d","label":"Blender 3D","total":28,"profilesKey":"blender_profiles","mode":"lesson_l","lessonPrefix":"blender_u_","progressSuffix":"_l_","href":"../../Курс-Blender-3D/index.html"},{"id":"csharp_course","label":"Углублённый курс C# (часть VR-студии)","total":6,"profilesKey":"cs_profiles","mode":"lesson_l","lessonPrefix":"cs_u_","progressSuffix":"_l_","href":"../../Курс C#/Доступ к курсу C#.html","parent":"vr_studio","requireLesson":4,"lockText":"Для доступа заверши занятия 3\u20134 в модуле \u00abСтарт в C# и ООП\u00bb VR-студии."},{"id":"pn_navigator","label":"Проектный навигатор","total":36,"profilesKey":"pdn-course-users","idField":"id","mode":"week_obj","progressPrefix":"pdn-course-progress-","href":"../../Курс-Проектный-навигатор/index.html"},{"id":"bpla_course","label":"БАС (беспилотные авиационные системы)","total":28,"profilesKey":"bpla-course-users","idField":"id","mode":"week_obj","progressPrefix":"bpla-course-progress-","href":"../../Курс-БПЛА/index.html"},{"id":"kompas_3d","label":"КОМПАС-3D","total":28,"profilesKey":"kompas-course-users","idField":"id","mode":"week_obj","progressPrefix":"kompas-course-progress-","href":"../../Курс-КОМПАС-3D/index.html"},{"id":"roboto_course","label":"Робототехника (EV3)","total":28,"profilesKey":"roboto-course-users","idField":"id","mode":"week_obj","progressPrefix":"roboto-course-progress-","href":"../../Курс-Робототехника/index.html"},{"id":"electron_course","label":"Электроника","total":28,"profilesKey":"electron-course-users","idField":"id","mode":"week_obj","progressPrefix":"electron-course-progress-","href":"../../Курс-Электроника/index.html"}];

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

  /* ============ Единая точка конфигурации объединения ============
     Используется порталом и курсами. Если цифры меняются — только здесь. */
  var TL_CONST = {
    labsCount: 5,
    labsLabel: '5 лабораторий',
    directionsLabel: '7 направлений',
    directions: [
      { id: 'LAB.01', name: 'Робототехника', short: 'EV3, сборка и программирование роботов' },
      { id: 'LAB.02', name: 'Электроника', short: 'платы, схемы, пайка, ESP/Arduino' },
      { id: 'LAB.03', name: 'Моделирование (Blender 3D + КОМПАС-3D)', short: '3D-модели и инженерная графика' },
      { id: 'LAB.05', name: 'БАС (беспилотные авиационные системы)', short: 'сборка и пилотирование дронов' },
      { id: 'LAB.06', name: 'VR (виртуальная реальность)', short: '3D-сцены и разработка VR-приложений' }
    ],
    projectProgram: 'Проектный навигатор',
    projectProgramNote: 'сквозная программа, не отдельная лаборатория',
    hoursTotal: 784,
    hoursTheory: 260,
    hoursPractice: 524,
    practicePct: 67,
    practicePctNote: 'доля практики в программе (524/784 ч)',
    kpiPracticeMin: 65
  };

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
    if (patch && patch.position !== undefined) u.position = String(patch.position || '').trim();
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

  /* -------- Самостоятельное редактирование профиля (сам пользователь) -------- */
  function updateOwnProfile(patch) {
    var u = currentUser();
    if (!u || !u.email) return { ok: false, error: 'Нет входа.' };
    var users = getUsers();
    var target = users[u.email];
    if (!target) return { ok: false, error: 'Профиль не найден.' };
    if (patch && patch.name !== undefined) target.name = String(patch.name || '').trim();
    if (patch && patch.cls !== undefined) target.cls = String(patch.cls || '').trim();
    if (patch && patch.school !== undefined) target.school = String(patch.school || '').trim();
    if (patch && patch.phone !== undefined) target.phone = String(patch.phone || '').trim();
    if (patch && patch.labs !== undefined) target.labs = Array.isArray(patch.labs) ? patch.labs.slice() : [];
    saveUsers(users);
    emit('profile', { email: target.email });
    return { ok: true, user: target };
  }
  function updateOwnPass(cur, next) {
    var u = currentUser();
    if (!u || !u.email) return { ok: false, error: 'Нет входа.' };
    if (u.passHash !== hashPass(String(cur || ''))) return { ok: false, error: 'Текущий пароль неверен.' };
    var nn = String(next || '');
    if (nn.length < 4) return { ok: false, error: 'Новый пароль слишком короткий (мин. 4 символа).' };
    var users = getUsers();
    var target = users[u.email];
    if (!target) return { ok: false, error: 'Профиль не найден.' };
    target.passHash = hashPass(nn);
    saveUsers(users);
    return { ok: true };
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

  /* -------- Должность сотрудника -------- */
  var POSITIONS = {
    zav:'Руководитель ТЛ', kazakevich:'Казакевич К.М.', ped2:'Второй педагог ДО',
    lab:'Инженер-лаборант', metod:'Методист', stud:'Студент-ведущий модуля',
    auto:'Инженер-автоматизатор', konstr:'Конструктор / нормоконтролёр',
    kipia:'Инженер КИПиА / метролог', rproj:'Руководитель проекта'
  };
  function currentPositionCode() {
    var u = currentUser(); if (!u) return null;
    if (u.role === 'admin') return 'admin';
    return u.position || null;
  }
  function currentPositionLabel() {
    var code = currentPositionCode();
    if (code === 'admin') return 'Администратор';
    return POSITIONS[code] || null;
  }
  function isStaff() {
    var code = currentPositionCode();
    return !!code && code !== 'admin';
  }

  /* -------- Единый реестр педагогов (код учителя + список) -------- */
  var TEACHERS_DEFAULT_CODE = '012345678';
  var TEACHERS_DEFAULT_LIST = ['Казакевич Константин Михайлович'];
  function getTeacherRegistry() {
    var r = read('teachers', null);
    if (!r || typeof r !== 'object' || !Array.isArray(r.list)) {
      r = { code: TEACHERS_DEFAULT_CODE, list: TEACHERS_DEFAULT_LIST.slice() };
      write('teachers', r);
    }
    if (!r.code) r.code = TEACHERS_DEFAULT_CODE;
    return r;
  }
  function saveTeacherRegistry(patch) {
    var u = currentUser();
    if (!u || u.role !== 'admin') return { ok: false, error: 'Только администратор может менять реестр педагогов.' };
    var r = getTeacherRegistry();
    if (patch && patch.code !== undefined) r.code = String(patch.code || '').trim() || TEACHERS_DEFAULT_CODE;
    if (patch && patch.list !== undefined) r.list = Array.isArray(patch.list) ? patch.list.filter(function (x) { return String(x || '').trim(); }).map(String) : r.list;
    write('teachers', r);
    emit('teachers', r);
    return { ok: true, registry: r };
  }
  function teacherList() { return getTeacherRegistry().list.slice(); }
  function teacherCode() { return getTeacherRegistry().code; }
  function isTeacherCode(code) { return String(code || '').trim() === teacherCode(); }
  function addTeacher(name) {
    var nm = String(name || '').trim();
    if (!nm) return { ok: false, error: 'Укажите ФИО педагога.' };
    var r = getTeacherRegistry();
    var exists = r.list.some(function (x) { return String(x).toLowerCase() === nm.toLowerCase(); });
    if (exists) return { ok: false, error: 'Такой педагог уже есть.' };
    return saveTeacherRegistry({ list: r.list.concat([nm]) });
  }
  function removeTeacher(nameOrIdx) {
    var r = getTeacherRegistry();
    var list = r.list.slice();
    var idx = (typeof nameOrIdx === 'number' || /^\d+$/.test(String(nameOrIdx))) ? +nameOrIdx : list.findIndex(function (x) { return String(x).toLowerCase() === String(nameOrIdx).toLowerCase(); });
    if (idx < 0 || idx >= list.length) return { ok: false, error: 'Педагог не найден.' };
    list.splice(idx, 1);
    return saveTeacherRegistry({ list: list });
  }
  function uiSaveTeacherCode() {
    var inp = document.getElementById('tlTeacherCode');
    if (!inp) return;
    saveTeacherRegistry({ code: inp.value });
    renderCabinet();
  }
  function uiAddTeacher() {
    var inp = document.getElementById('tlTeacherAdd');
    if (!inp) return;
    addTeacher(inp.value);
    renderCabinet();
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
      '.tl-labs{display:flex;flex-wrap:wrap;gap:8px;}' +
      '.tl-labs button{background:#0D0F14;border:1px solid #2A2D35;border-radius:10px;color:#8B8FA3;padding:8px 11px;font-size:12px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:2px;max-width:230px;flex:1 1 200px;}' +
      '.tl-labs button .ch-id{font-family:ui-monospace,Consolas,monospace;font-size:10px;color:#2D7AFF;letter-spacing:.06em;}' +
      '.tl-labs button .ch-name{font-size:12.5px;font-weight:600;color:#EAECEF;line-height:1.25;}' +
      '.tl-labs button .ch-short{font-size:11px;color:#8B8FA3;line-height:1.3;}' +
      '.tl-labs button.on{color:#fff;border-color:#2D7AFF;background:rgba(45,122,255,.18);}' +
      '.tl-labs button.on .ch-id{color:#7FB0FF;}' +
      '.tl-labs button.on .ch-name{color:#fff;}' +
      '#tlCabinetPanel{position:fixed;inset:0;z-index:99970;background:#161921;color:#EAECEF;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;display:none;overflow:auto;}' +
      '#tlCabinetPanel.open{display:block;}' +
      '#tlCabinetPanel .tl-cab-frame{max-width:760px;margin:0 auto;padding:28px 24px 60px;}' +
      '#tlCabinetPanel .tl-cab-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}' +
      '#tlCabinetPanel .tl-cab-title{font-size:20px;font-family:"Space Grotesk","Unbounded","Montserrat",system-ui,sans-serif;font-weight:700;}' +
      '#tlCabinetPanel .tl-cab-cls{background:none;border:1px solid #3A3E47;color:#8B8FA3;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;}' +
      '#tlCabinetPanel .tl-cab-tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #24272E;margin-bottom:16px;padding-bottom:10px;}' +
      '#tlCabinetPanel .tl-cab-tab{background:none;border:1px solid transparent;color:#8B8FA3;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:600;}' +
      '#tlCabinetPanel .tl-cab-tab.on{color:#fff;border-color:#2D7AFF;background:rgba(45,122,255,.15);}' +
      '#tlCabinetPanel .tl-cab-tab:hover{color:#fff;}' +
      '#tlCabinetPanel .tl-cab-tab{color:#8B8FA3;}' +
      '#tlCabinetPanel .tl-cab-pane{display:none;}' +
      '#tlCabinetPanel .tl-cab-pane.on{display:block;}' +
      '#tlCabinetPanel .tl-cab-role{font-size:12px;color:#2D7AFF;text-transform:uppercase;letter-spacing:.06em;font-weight:700;}' +
      '#tlCabinetPanel input[type="text"],#tlCabinetPanel input[type="tel"],#tlCabinetPanel input[type="email"],#tlCabinetPanel input[type="password"],#tlCabinetPanel select{width:100%;background:#0D0F14;border:1px solid #2A2D35;border-radius:6px;color:#EAECEF;padding:8px 10px;font-size:13px;}' +
      '#tlCabinetPanel input:focus,#tlCabinetPanel select:focus{outline:none;border-color:#2D7AFF;}' +
      '#tlCabinetPanel label{font-size:12px;color:#8B8FA3;display:block;margin:8px 0 3px;}' +
      '#tlCabinetPanel .tl-btn-save{background:#2D7AFF;border:0;color:#fff;border-radius:6px;padding:9px 18px;font-size:14px;cursor:pointer;font-weight:700;margin-top:10px;}' +
      '#tlCabinetPanel .tl-btn-save:hover{filter:brightness(1.1);}' +
      '#tlCabinetPanel .tl-cab-msg{color:#00D68F;font-size:12.5px;margin-top:8px;min-height:16px;}' +
      '#tlCabinetPanel .tl-cab-err{color:#FF5A5A;font-size:12.5px;margin-top:8px;min-height:16px;}' +
      '#tlCabinetPanel .tl-hint{color:#8B8FA3;font-size:12px;margin-top:8px;}' +
      '#tlCabinetPanel .tl-cab-stat{display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;}' +
      '#tlCabinetPanel .tl-cab-stat .st{font-size:13px;color:#8B8FA3;}' +
      '#tlCabinetPanel .tl-cab-stat .st b{color:#fff;}' +
      '#tlCabinetPanel .tl-labs-chip{display:inline-block;border:1px solid #3A3E47;padding:5px 10px;border-radius:8px;margin:4px 6px 0 0;font-size:12px;color:#EAECEF;}' +
      '#tlCabinetPanel .tl-labs-chip b{color:#2D7AFF;font-family:ui-monospace,Consolas,monospace;font-size:10.5px;margin-right:4px;}' +
      '#tlCabinetPanel .tl-cab-logout{background:transparent;border:1px solid #3A3E47;color:#8B8FA3;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;margin-top:14px;}' +
      '#tlCabinetPanel .tl-cab-logout:hover{color:#fff;}' +
      '@media (max-width:640px){#tlCabinetPanel .tl-cab-frame{padding:18px 14px 50px;}#tlCabinetPanel .tl-cab-top{flex-direction:column;align-items:flex-start;}}' +
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
    { id: 'LAB.01', name: 'Робототехника', short: 'EV3, сборка и программирование роботов' },
    { id: 'LAB.02', name: 'Электроника', short: 'платы, схемы, пайка, ESP/Arduino' },
    { id: 'LAB.03', name: 'Моделирование (Blender + КОМПАС-3D)', short: '3D-модели и инженерная графика' },
    { id: 'LAB.05', name: 'БАС', short: 'сборка и пилотирование дронов' },
    { id: 'LAB.06', name: 'VR-разработка', short: '3D-сцены и разработка VR-приложений' },
    { id: 'LAB.07', name: 'Проектная деятельность (программа)', short: 'сквозная программа, не отдельная лаборатория' }
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
        b.className = 'tl-lab-chip';
        b.dataset.lab = l.id;
        b.title = (l.short ? l.short : l.name);
        var id = document.createElement('span');
        id.className = 'ch-id';
        id.textContent = l.id;
        var nm = document.createElement('span');
        nm.className = 'ch-name';
        nm.textContent = l.name;
        var sh = document.createElement('span');
        sh.className = 'ch-short';
        sh.textContent = l.short || '';
        b.appendChild(id);
        b.appendChild(nm);
        b.appendChild(sh);
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

  var CAB_TAB = 'profile';
  function openCabinet() {
    ensureStyle();
    var user = currentUser();
    if (!user) { openModal('login'); return; }
    var p = document.getElementById(cabinetId);
    if (!p) {
      p = document.createElement('div');
      p.id = cabinetId;
      p.innerHTML =
        '<div class="tl-cab-frame">' +
        '<div class="tl-cab-top"><div><div class="tl-cab-title" id="tlCabName"></div><div class="tl-cab-role" id="tlCabRole"></div></div>' +
        '<button class="tl-cab-cls" id="tlCabCls">✕ Закрыть</button></div>' +
        '<div class="tl-cab-tabs" id="tlCabTabs"></div>' +
        '<div id="tlCabBody"></div>' +
        '<div id="tlAdminPanel" style="display:none;"></div>' +
        '</div>';
      document.body.appendChild(p);
      p.querySelector('#tlCabCls').onclick = function () { closeCabinet(); };
    }
    renderCabinet();
    p.classList.add('open');
  }
  function closeCabinet() { var p = document.getElementById(cabinetId); if (p) p.classList.remove('open'); }
  function cabTab(t) { CAB_TAB = t || 'profile'; renderCabinet(); }
  function cabTabsDef() {
    var u = currentUser();
    var tabs = [{ id: 'profile', label: 'Профиль' }];
    if (u) {
      if (u.role === 'admin') tabs.push({ id: 'users', label: 'Пользователи' }, { id: 'teachers', label: 'Педагоги' }, { id: 'enroll', label: 'Заявки' });
      else if (u.role === 'teacher') tabs.push({ id: 'students', label: 'Мои ученики' });
    }
    tabs.push({ id: 'courses', label: 'Мои курсы' });
    tabs.push({ id: 'achieve', label: 'Достижения' });
    tabs.push({ id: 'notify', label: 'Уведомления' });
    return tabs;
  }
  function cabRenderTabs() {
    var el = document.getElementById('tlCabTabs');
    if (!el) return;
    el.innerHTML = cabTabsDef().map(function (t) { return '<button class="tl-cab-tab' + (CAB_TAB === t.id ? ' on' : '') + '" onclick="TLCore.cabTab(\'' + t.id + '\')">' + t.label + '</button>'; }).join('');
  }
  // Профиль: редактирование полей и смена пароля
  function cabSaveProfile() {
    var u = currentUser(); if (!u) return;
    var upd = { name: (document.getElementById('tlPrName') || {}).value || '', cls: (document.getElementById('tlPrCls') || {}).value || '', school: (document.getElementById('tlPrSchool') || {}).value || '', phone: (document.getElementById('tlPrPhone') || {}).value || '' };
    updateOwnProfile(upd);
    renderCabinet();
    var m = document.getElementById('tlCabMsg'); if (m) m.textContent = '✓ Профиль сохранён.';
  }
  function cabSavePass() {
    var u = currentUser(); if (!u) return;
    var cur = (document.getElementById('tlPrCurPass') || {}).value || '';
    var n1 = (document.getElementById('tlPrNewPass') || {}).value || '';
    var n2 = (document.getElementById('tlPrNewPass2') || {}).value || '';
    var err = document.getElementById('tlCabPassErr');
    var msg = document.getElementById('tlCabPassMsg');
    if (err) err.textContent = ''; if (msg) msg.textContent = '';
    if (n1 !== n2) { if (err) err.textContent = 'Пароли не совпадают.'; return; }
    var res = updateOwnPass(cur, n1);
    if (!res.ok) { if (err) err.textContent = res.error; return; }
    if (msg) msg.textContent = '✓ Пароль изменён.';
  }
  function cabProfileHtml(u) {
    var labs = (LAB_META || []).map(function (l) { return '<span class="tl-labs-chip" title="' + escapeHtml(l.short || l.name) + '"><b>' + l.id + '</b> ' + escapeHtml(l.name) + '</span> '; }).join('') || '';
    var h = '';
    h += '<label>ФИО</label><input type="text" id="tlPrName" value="' + escapeHtml(u.name || '') + '">';
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap;"><div style="flex:1;min-width:140px;"><label>Класс / курс (ученик)</label><input type="text" id="tlPrCls" value="' + escapeHtml(u.cls || '') + '"></div><div style="flex:1;min-width:160px;"><label>Школа</label><input type="text" id="tlPrSchool" value="' + escapeHtml(u.school || '') + '"></div></div>';
    h += '<label>Телефон</label><input type="tel" id="tlPrPhone" value="' + escapeHtml(u.phone || '') + '">';
    h += '<div style="margin-top:12px;"><span style="font-size:12px;color:#8B8FA3;">Интересует лаборатории:</span><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;" id="tlPrLabs">' + labs + '</div></div>';
    h += '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><button class="tl-btn-save" id="tlPrSave" style="margin-top:10px;">Сохранить профиль</button><span class="tl-cab-msg" id="tlCabMsg"></span></div>';
    return h;
  }
  function cabPassHtml() {
    return '<div style="border-top:1px solid #24272E;margin-top:18px;padding-top:14px;">' +
      '<div style="font-weight:700;margin-bottom:6px;">Смена пароля</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;"><div style="flex:1;min-width:140px;"><label>Текущий пароль</label><input type="password" id="tlPrCurPass"></div><div style="flex:1;min-width:140px;"><label>Новый пароль</label><input type="password" id="tlPrNewPass"></div><div style="flex:1;min-width:140px;"><label>Повторите</label><input type="password" id="tlPrNewPass2"></div></div>' +
      '<div class="tl-cab-err" id="tlCabPassErr"></div><div class="tl-cab-msg" id="tlCabPassMsg"></div>' +
      '<button class="tl-btn-save" id="tlPrPassBtn" style="background:#1B1F2A;border:1px solid #3A3E47;color:#fff;">Сменить пароль</button></div>';
  }
  function courseProfileOf(cfg, user) {
    try {
      var profs = JSON.parse(localStorage.getItem(cfg.profilesKey) || '[]') || [];
      var uid = user && (user.id || user.email);
      var p = profs.find(function (x) { return x && (String(x.uid) === String(uid) || String(x.id) === String(uid) || x.email === user.email || (x.name || '').toLowerCase() === (user.name || '').toLowerCase()); });
      return p || null;
    } catch (e) { return null; }
  }
  function myCourseCode(cfg, user) {
    var p = courseProfileOf(cfg, user);
    return p ? (p.code || '') : '';
  }
  function quizSummary(cfg, user) {
    // Квизы TQuiz пишут {idx,score,done} в ключи вида «<prefix>_quiz_<N>»
    var p = courseProfileOf(cfg, user);
    if (!p) return { done: 0, best: 0, totalQ: 0 };
    var uid = p.uid || p.id;
    var done = 0, best = 0, totalQ = 0;
    for (var i = 1; i <= (cfg.total || 0); i++) {
      var key = '';
      try {
        if (cfg.mode === 'lesson_l') key = cfg.lessonPrefix + uid + '_quiz_' + i;
        else key = cfg.lessonPrefix ? cfg.lessonPrefix + uid + '_quiz_' + i : (cfg.id + '_quiz_' + i);
        if (cfg.mode === 'week_obj') {
          // у week_obj-курсов префикс задаётся progressPrefix (напр. roboto-course-progress-); quiz-ключи аналогичны
          var base = cfg.progressPrefix ? cfg.progressPrefix : (cfg.id + '-course-progress-');
          key = String(uid) + '_quiz_' + i;
        }
      } catch (e) {}
      var q = null; try { q = JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){}
      if (q && typeof q === 'object' && q.done > 0) {
        done++;
        var frac = q.totalQ > 0 ? q.score / q.totalQ : 0;
        // ключи quiz содержат score и done, но не totalQ; посчитаем best ~ score*100/3 (3 вопроса в квизах)
        best += q.score;
        totalQ += 3;
      }
    }
    return { done: done, best: totalQ ? Math.round(best / totalQ * 100) : 0, totalQ: totalQ, passed: done };
  }
  function cabExportProgress() {
    var u = currentUser(); if (!u) return;
    var out = { app: 'tl-progress', version: 1, exported: new Date().toISOString(), user: { name: u.name, email: u.email, role: u.role }, courses: {} };
    var ach = getAllAchievements();
    COURSE_CONFIG.forEach(function (cfg) {
      var cp = courseProfileOf(cfg, u);
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      out.courses[cfg.id] = { label: cfg.label, done: pr.done, total: pr.total, uid: cp ? (cp.uid || cp.id || '') : '', code: cp ? (cp.code || '') : '' };
    });
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tl-my-progress-' + String(u.name || 'user').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') + '.json';
    a.click();
    setTimeout(function(){ if (URL.revokeObjectURL) URL.revokeObjectURL(a.href); }, 3000);
  }
  function cabImportProgressFile(ev) {
    var u = currentUser(); if (!u) return;
    var f = ev.target.files && ev.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!d || d.app !== 'tl-progress' || !d.courses) { alert('Это не файл прогресса ТЛ.'); return; }
        // Персонализированная проверка: имя/e-mail должны совпасть или быть пустыми
        if (d.user && d.user.email && String(d.user.email).toLowerCase() !== String(u.email).toLowerCase()) {
          if (!confirm('Файл принадлежит другому пользователю (' + d.user.email + '). Импортировать в свой профиль всё равно?')) { return; }
        }
        var cnt = 0;
        COURSE_CONFIG.forEach(function (cfg) {
          var c = d.courses[cfg.id]; if (!c) return;
          var uid = c.uid; if (!uid) return;
          for (var i = 1; i <= (c.done || 0); i++) {
            try {
              if (cfg.mode === 'lesson_l') { localStorage.setItem(cfg.lessonPrefix + uid + cfg.progressSuffix + i, '1'); cnt++; }
              else if (cfg.mode === 'week_obj') { var obj = {}; try { obj = JSON.parse(localStorage.getItem(cfg.progressPrefix + uid) || '{}') || {}; } catch(e){} obj['w' + i] = true; localStorage.setItem(cfg.progressPrefix + uid, JSON.stringify(obj)); cnt++; }
            } catch (e) {}
          }
        });
        alert('Импортировано отмеченных занятий: ' + cnt);
        renderCabinet();
      } catch (e) { alert('Не удалось прочитать файл.'); }
    };
    rd.readAsText(f);
    ev.target.value = '';
  }
  function cabCoursesHtml(u) {
    var ach = getAllAchievements();
    var h = '<div class="tl-hint">Твой прогресс по курсам объединения. Переходи к занятию, чтобы продолжить.</div>';
    COURSE_CONFIG.forEach(function (cfg) {
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      var pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
      var lock = '';
      if (cfg.parent) { var par = ach.courses[cfg.parent]; var req = cfg.requireLesson || 0; var got = par ? par.done : 0; if (got < req) lock = ' <span style="color:#FFAA00;font-size:11px;">🔒 после ' + req + ' занятий VR</span>'; }
      var code = myCourseCode(cfg, u);
      var qz = (u.role === 'learner' || u.role === 'teacher') ? quizSummary(cfg, u) : { done: 0 };
      var next = '';
      if (pr.done > 0 && pr.done < pr.total) next = ' → занятие ' + (pr.done + 1);
      h += '<div style="margin-top:8px;padding:10px 12px;border:1px solid #2A2D35;border-radius:8px;">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><span style="font-weight:600;">' + escapeHtml(cfg.label) + lock + '</span><span style="font-size:12px;color:#8B8FA3;white-space:nowrap;">' + pr.done + ' / ' + pr.total + ' · ' + pct + '%</span></div>';
      if (code) h += '<div style="font-size:12px;color:#8B8FA3;margin-top:4px;">Код доступа: <b style="color:#EAECEF;font-family:monospace;">' + escapeHtml(code) + '</b></div>';
      if (qz.done) h += '<div style="font-size:12px;color:#8B8FA3;margin-top:2px;">Квизы: пройдено ' + qz.done + ' занятий · средний результат ' + qz.best + '%</div>';
      h += '<a href="' + cfg.href + '" style="display:inline-block;margin-top:6px;font-size:13px;color:#2D7AFF;text-decoration:none;font-weight:600;">' + (pr.done === 0 ? 'Начать курс →' : (pr.done >= pr.total ? 'Открыть курс (пройден) →' : 'Продолжить' + next + ' →')) + '</a>';
      h += '</div>';
    });
    if (u.role === 'learner') {
      h += '<div style="margin-top:14px;border-top:1px solid #24272E;padding-top:12px;">';
      h += '<div style="font-weight:700;margin-bottom:4px;">Перенос прогресса между устройствами</div>';
      h += '<div class="tl-hint">Скачай файл прогресса и импортируй его на другом компьютере — отметки по занятиям восстановятся.</div>';
      h += '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;"><button class="tl-btn-save" style="padding:8px 14px;font-size:12.5px;margin:0;" onclick="TLCore.cabExportProgress()">⬇ Скачать прогресс</button><label class="tl-btn-save" style="background:#1B1F2A;border:1px solid #3A3E47;color:#fff;padding:8px 14px;font-size:12.5px;border-radius:6px;cursor:pointer;">⬆ Импортировать<input type="file" accept=".json,application/json" style="display:none" onchange="TLCore.cabImportProgressFile(event)"></label></div>';
      h += '</div>';
    }
    return h;
  }
  function cabStudentsHtml(u) {
    var ts = getStudentsForTeacher();
    var tsAll = (u.role === 'admin' || u.position === 'zav');
    var h = '<div class="tl-hint">' + (tsAll ? 'Все ученики объединения по курсам' : 'Твои ученики по курсам (привязка по полю «учитель»)') + '</div>';
    if (!ts.total) { h += '<div class="tl-hint" style="margin-top:8px;">Учеников пока нет.</div>'; return h; }
    Object.keys(ts.courses).forEach(function (cid) {
      var g = ts.courses[cid];
      var sum = g.students.reduce(function (a, x) { return a + x.progress.done; }, 0);
      var avg = g.students.length ? Math.round(sum / g.students.length) : 0;
      h += '<div style="margin-top:10px;padding:10px 12px;border:1px solid #2A2D35;border-radius:8px;">';
      h += '<div style="display:flex;justify-content:space-between;gap:6px;font-weight:600;font-size:13px;">' + escapeHtml(g.cfg.label) + '<span style="color:#8B8FA3;font-size:11px;">' + g.students.length + ' · ср. ' + avg + '%</span></div>';
      g.students.forEach(function (x) {
        var pct = x.progress.total ? Math.round(x.progress.done / x.progress.total * 100) : 0;
        h += '<div style="display:flex;justify-content:space-between;gap:6px;align-items:center;padding:4px 0;border-bottom:1px dashed #24272E;font-size:12.5px;">';
        h += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><button class="tl-student-det" data-course="' + cid + '" data-uid="' + String(x.profile.uid || x.profile.id || '') + '" style="background:none;border:0;color:#EAECEF;cursor:pointer;font-size:12.5px;text-align:left;padding:0;">' + escapeHtml(x.profile.name || '—') + '</button>' + (x.profile.klass ? ' <span style="color:#8B8FA3;">' + escapeHtml(String(x.profile.klass)) + '</span>' : '') + '</span>';
        h += '<span style="color:#8B8FA3;white-space:nowrap;">' + x.progress.done + '/' + x.progress.total + ' · ' + pct + '% <button class="tl-student-open" data-course="' + cid + '" data-uid="' + String(x.profile.uid || x.profile.id || '') + '" style="background:transparent;border:1px solid #3A3E47;color:#8B8FA3;border-radius:5px;padding:1px 8px;font-size:11px;cursor:pointer;">Открыть все</button></span>';
        h += '</div>';
      });
      h += '</div>';
    });
    return h;
  }
  function cabUsersListHtml(arr) {
    if (!arr || !arr.length) return '<div class="tl-hint" style="margin-top:6px;">Никого не нашлось.</div>';
    return arr.map(function (u2) {
      var email = u2.email || '';
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #24272E;font-size:13px;"><span>' + escapeHtml(u2.name || email) + ' <span style="color:#8B8FA3;font-size:11px;">(' + escapeHtml(u2.role || '') + (u2.position ? ' · ' + escapeHtml(POSITIONS[u2.position] || u2.position) : '') + ')</span></span><button class="tl-adm-edit" data-email="' + email + '" style="background:transparent;border:1px solid #3A3E47;color:#8B8FA3;font-size:12px;border-radius:6px;padding:2px 8px;cursor:pointer;">Ред.</button></div>';
    }).join('');
  }
  function cabUsersApply() {
    var users = getUsers();
    var arr = Object.keys(users).map(function (k) { return users[k]; });
    var q = ((document.getElementById('tlUserSearch') || {}).value || '').toLowerCase().trim();
    var r = (document.getElementById('tlUserRole') || {}).value || '';
    var p = (document.getElementById('tlUserPos') || {}).value || '';
    if (q) arr = arr.filter(function (x) { return (x.name || '').toLowerCase().indexOf(q) > -1 || (x.email || '').toLowerCase().indexOf(q) > -1; });
    if (r) arr = arr.filter(function (x) { return x.role === r; });
    if (p) arr = arr.filter(function (x) { return x.position === p; });
    var list = document.getElementById('tlUserList');
    if (list) list.innerHTML = cabUsersListHtml(arr);
  }
  function cabUsersHtml() {
    var users = getUsers();
    var arr = Object.keys(users).map(function (k) { return users[k]; });
    var h = '<div style="font-weight:700;margin-bottom:6px;">Пользователи портала</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;"><input type="text" id="tlUserSearch" placeholder="Поиск по имени или e-mail" style="flex:1;min-width:170px;background:#0D0F14;border:1px solid #2A2D35;color:#EAECEF;border-radius:6px;padding:7px 10px;font-size:12.5px;">';
    h += '<select id="tlUserRole" style="background:#0D0F14;border:1px solid #2A2D35;color:#EAECEF;border-radius:6px;padding:7px 8px;font-size:12.5px;"><option value="">Все роли</option><option value="learner">Ученик</option><option value="teacher">Педагог</option><option value="admin">Администратор</option></select>';
    h += '<select id="tlUserPos" style="background:#0D0F14;border:1px solid #2A2D35;color:#EAECEF;border-radius:6px;padding:7px 8px;font-size:12.5px;"><option value="">Все должности</option>' + Object.keys(POSITIONS).map(function (k) { return '<option value="' + k + '">' + escapeHtml(POSITIONS[k]) + '</option>'; }).join('') + '</select>';
    h += '<button class="tl-btn-save" style="margin:0;padding:7px 14px;font-size:12px;" onclick="TLCore.cabUsersApply()">Применить</button></div>';
    h += '<div id="tlUserList">' + cabUsersListHtml(arr) + '</div>';
    return h;
  }
  function cabStudentDetailHtml(cid, uid) {
    var cfg = null;
    COURSE_CONFIG.forEach(function (c) { if (c.id === cid) cfg = c; });
    if (!cfg) return '';
    var profs = [];
    try { profs = JSON.parse(localStorage.getItem(cfg.profilesKey) || '[]') || []; } catch (e) {}
    var sp = profs.find(function (x) { return x && String(x.uid || x.id) === String(uid); });
    if (!sp) return '';
    var pr = progressForStudentProfile(cfg, sp);
    var pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
    var code = sp.code || '';
    var h = '<div style="margin-top:12px;padding:12px;border:1px solid #2D7AFF;border-radius:8px;background:rgba(45,122,255,.07);">';
    h += '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;"><b>' + escapeHtml(sp.name || '—') + '</b><button class="tl-student-back" style="background:transparent;border:1px solid #3A3E47;color:#8B8FA3;border-radius:5px;padding:2px 10px;font-size:11px;cursor:pointer;">← Назад</button></div>';
    h += '<div style="font-size:12.5px;color:#8B8FA3;margin-top:6px;">' + (sp.klass ? 'Класс: ' + escapeHtml(String(sp.klass)) + ' · ' : '') + (sp.teacher ? 'учитель: ' + escapeHtml(sp.teacher) : '') + (code ? ' · код: <b style="color:#EAECEF;">' + escapeHtml(code) + '</b>' : '') + '</div>';
    h += '<div style="margin-top:8px;font-size:13px;">Курс: <b>' + escapeHtml(cfg.label) + '</b> — пройдено ' + pr.done + ' из ' + pr.total + ' (' + pct + '%)</div>';
    h += '<div style="height:6px;background:#2A2D35;border-radius:999px;margin-top:6px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:#2D7AFF;border-radius:999px;"></div></div>';
    var qz = null; try { qz = quizSummary(cfg, { email: sp.email, name: sp.name, id: sp.uid || sp.id }); } catch (e) {}
    if (qz && qz.done) h += '<div style="font-size:12px;color:#8B8FA3;margin-top:6px;">Квизов пройдено: ' + qz.done + ' · средний результат ' + qz.best + '%</div>';
    h += '<div style="margin-top:10px;"><button class="tl-student-open2" data-course="' + cid + '" data-uid="' + String(sp.uid || sp.id) + '" style="background:#2D7AFF;border:0;color:#fff;font-size:12.5px;border-radius:6px;padding:7px 14px;cursor:pointer;font-weight:700;">Открыть все занятия</button></div>';
    h += '</div>';
    return h;
  }
  function cabOpenAll(cid, uid) {
    var u = currentUser();
    if (!u || (u.role !== 'admin' && u.role !== 'teacher')) return;
    var cfg = null;
    COURSE_CONFIG.forEach(function (c) { if (c.id === cid) cfg = c; });
    if (!cfg || !uid) return;
    var done = 0;
    for (var i = 1; i <= cfg.total; i++) {
      try {
        if (cfg.mode === 'lesson_l') { localStorage.setItem(cfg.lessonPrefix + uid + cfg.progressSuffix + i, '1'); done++; }
        else if (cfg.mode === 'week_obj') { var obj = {}; try { obj = JSON.parse(localStorage.getItem(cfg.progressPrefix + uid) || '{}') || {}; } catch(e){} obj['w' + i] = true; localStorage.setItem(cfg.progressPrefix + uid, JSON.stringify(obj)); done++; }
      } catch (e) {}
    }
    alert('Открыты все занятия курса для ученика ✓ (' + done + ' занятий).');
    renderCabinet();
  }
  function cabShowStudent(cid, uid) {
    var elBody = document.getElementById('tlCabBody'); if (!elBody || !uid) return;
    elBody.innerHTML = cabStudentDetailHtml(cid, uid) + '<div style="margin-top:10px;"><button class="tl-btn-save" style="padding:8px 14px;font-size:12.5px;" onclick="TLCore.cabStudents()">← Список учеников</button></div>';
    var open2 = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-student-open2') : [];
    open2.forEach(function (b) { b.onclick = function () { cabOpenAll(cid, uid); }; });
    var back = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-student-back') : [];
    back.forEach(function (b) { b.onclick = function () { renderCabinet(); }; });
  }
  function cabStudents() { CAB_TAB = 'students'; renderCabinet(); }
  function cabTeachersHtml() {
    var reg = getTeacherRegistry();
    var h = '<div style="font-weight:700;margin-bottom:4px;">Единый реестр педагогов</div>';
    h += '<div class="tl-hint">Код открывает режим учителя на курсах. Список — для выбора «своего учителя» учеником.</div>';
    h += '<div style="display:flex;gap:6px;margin-top:8px;"><input type="text" id="tlTeacherCode" value="' + escapeHtml(reg.code) + '" placeholder="Код учителя" style="flex:1;"><button class="tl-btn-save" style="margin:8px 0 0;padding:8px 14px;font-size:12px;" onclick="TLCore.saveTeacherCode()">ОК</button></div>';
    reg.list.forEach(function (nm, idx) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:3px 0;border-bottom:1px dashed #24272E;font-size:12.5px;"><span>' + escapeHtml(nm) + '</span><button style="background:transparent;border:1px solid #3A3E47;color:#8B8FA3;border-radius:5px;padding:2px 8px;font-size:11px;cursor:pointer;" onclick="TLCore.removeTeacher(' + idx + ')">✕</button></div>';
    });
    h += '<div style="display:flex;gap:6px;margin-top:8px;"><input type="text" id="tlTeacherAdd" placeholder="ФИО педагога" style="flex:1;"><button class="tl-btn-save" style="margin:8px 0 0;padding:8px 14px;font-size:12px;" onclick="TLCore.addTeacherUI()">+</button></div>';
    return h;
  }
  function cabEnrollHtml() {
    var h = '<div style="font-weight:700;margin-bottom:6px;">Заявки на запись</div>';
    var arr = [];
    try {
      var raw = JSON.parse(localStorage.getItem('tl-enroll-portal') || '[]');
      if (Array.isArray(raw)) raw.forEach(function (x, i) { arr.push({ src: 'enroll', idx: i, name: x.name || '', phone: x.phone || '', email: x.email || '', lab: x.lab || '', at: x.at || '' }); });
    } catch (e) {}
    var wl = read('waitlist', []) || [];
    wl.forEach(function (x, i) { arr.push({ src: 'waitlist', idx: i, name: x.name || '', phone: '', email: x.email || '', lab: x.label || x.courseId || '', at: x.at || '' }); });
    if (!arr.length) {
      return h + '<div class="tl-hint" style="margin-top:8px;">Заявок пока нет. Как только родители оставят заявку в секции «Записаться» на главной, она появится здесь.</div>';
    }
    arr.sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    h += '<div style="font-size:12.5px;color:#8B8FA3;margin-bottom:6px;">Всего: ' + arr.length + ' · источник: анкета с главной / лист ожидания</div>';
    arr.forEach(function (it) {
      var when = '';
      try { if (it.at) { var d = new Date(it.at); when = d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); } } catch (e) {}
      h += '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #2A2D35;border-radius:8px;margin-top:8px;flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:180px;"><div style="font-size:13.5px;font-weight:600;">' + escapeHtml(it.name) + '</div>' +
        '<div style="font-size:12px;color:#8B8FA3;">' + (it.phone ? escapeHtml(it.phone) + ' · ' : '') + (it.email ? escapeHtml(it.email) + ' · ' : '') + (it.lab ? escapeHtml(it.lab) : 'лаборатория не выбрана') + (when ? ' · ' + when : '') + '</div></div>' +
        '<button style="background:transparent;border:1px solid #2A2D35;color:#EAECEF;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;" onclick="TLCore.cabEnrollDone(\'' + it.src + '\',' + it.idx + ')">✓ Связались</button></div>';
    });
    return h;
  }
  function cabEnrollDone(src, idx) {
    try {
      if (src === 'enroll') {
        var raw = JSON.parse(localStorage.getItem('tl-enroll-portal') || '[]');
        if (Array.isArray(raw) && raw[idx]) { raw.splice(idx, 1); localStorage.setItem('tl-enroll-portal', JSON.stringify(raw)); }
      } else {
        var wl = read('waitlist', []) || [];
        if (wl[idx]) { wl.splice(idx, 1); write('waitlist', wl); }
      }
    } catch (e) {}
    renderCabinet();
  }
  /* ============ Достижения и сертификаты ============ */
  var TL_METALS = [
    { name: 'Железо', icon: '⚙', need: 5, bg: 'linear-gradient(160deg,#6b7a8c,#39434f)', fg: '#fff' },
    { name: 'Медь', icon: '◎', need: 15, bg: 'linear-gradient(160deg,#ee7a4b,#b23c1f)', fg: '#fff' },
    { name: 'Бронза', icon: '⑂', need: 25, bg: 'linear-gradient(160deg,#c98a3d,#7c4e18)', fg: '#fff' },
    { name: 'Олово', icon: '❆', need: 35, bg: 'linear-gradient(160deg,#9fc2da,#56748e)', fg: '#0f1c28' },
    { name: 'Серебро', icon: '◐', need: 45, bg: 'linear-gradient(160deg,#eef1f5,#aab4c0)', fg: '#232a36' },
    { name: 'Золото', icon: '☀', need: 55, bg: 'linear-gradient(160deg,#ffd75e,#c3940f)', fg: '#3a2c00' },
    { name: 'Платина', icon: '✧', need: 65, bg: 'linear-gradient(160deg,#9aa6b3,#616e7d)', fg: '#fff' },
    { name: 'Палладий', icon: '❖', need: 75, bg: 'linear-gradient(160deg,#e0c69a,#976f34)', fg: '#2b2006' },
    { name: 'Родий', icon: '✪', need: 85, bg: 'linear-gradient(160deg,#fbfdff,#c6cdd6)', fg: '#1a2430' },
    { name: 'Иридий', icon: '✦', need: 93, bg: 'linear-gradient(160deg,#4a5561,#232b34)', fg: '#fff' }
  ];
  function tlMetalOf(t) { var m = TL_METALS[0]; for (var i = 0; i < TL_METALS.length; i++) { if (t >= TL_METALS[i].need) m = TL_METALS[i]; } return m; }
  function tlScaleHtml() {
    var u = currentUser(); if (!u) return '';
    var ach = getAllAchievements();
    var pts = ach.totalAll ? Math.round(ach.doneTotal / ach.totalAll * 100 * 0.4 + 60 * 0.6) : 0;
    var m = tlMetalOf(pts);
    var h = '<div style="margin-top:12px;padding:12px;border:1px solid #2A2D35;border-radius:10px;">';
    h += '<div style="font-weight:700;margin-bottom:8px;">🏆 Мотивационная шкала</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    var copy = TL_METALS.slice().reverse();
    for (var i = 0; i < copy.length; i++) {
      var st = copy[i];
      var cur = st.name === m.name;
      h += '<span style="padding:3px 9px;border-radius:999px;font-size:11.5px;white-space:nowrap;color:' + st.fg + ';background:' + st.bg + (cur ? ';box-shadow:0 0 0 2px #fff, 0 0 0 4px #2D7AFF;' : '') + ';">' + st.icon + ' ' + st.name + ' <span style="opacity:.85;">≥ ' + st.need + ' б.</span></span>';
    }
    h += '</div>';
    h += '<div style="margin-top:10px;font-size:13.5px;color:#EAECEF;">Твой уровень: <b style="color:' + (m.fg === '#fff' ? '#fff' : m.bg) + ';">' + m.icon + ' ' + m.name + '</b> · <b>' + pts + ' баллов</b> <span style="color:#8B8FA3;">(прогресс ' + ach.doneTotal + ' из ' + ach.totalAll + ' занятий · ' + (ach.totalAll ? Math.round(ach.doneTotal / ach.totalAll * 100) : 0) + '%)</span></div>';
    h += '<div style="font-size:12px;color:#8B8FA3;margin-top:4px;">Расчёт: 40% прогресса + 60% участия (как на курсах). Занимайся — выходи на новый металл!</div>';
    h += '</div>';
    return h;
  }
  function medalOf(pct) {
    if (pct >= 100) return { name: 'Выпускник', icon: '🏆', color: '#FFD700', bg: 'rgba(255,215,0,.16)', border: 'rgba(255,215,0,.5)' };
    if (pct >= 80) return { name: 'Профи', icon: '🥇', color: '#B9F1FF', bg: 'rgba(185,241,255,.14)', border: 'rgba(185,241,255,.45)' };
    if (pct >= 60) return { name: 'Финалист', icon: '🥈', color: '#D7E4FF', bg: 'rgba(215,228,255,.14)', border: 'rgba(215,228,255,.45)' };
    if (pct >= 35) return { name: 'Курсант', icon: '🥉', color: '#FFB84D', bg: 'rgba(255,184,77,.14)', border: 'rgba(255,184,77,.45)' };
    return { name: 'Новичок', icon: '🚀', color: '#8B8FA3', bg: 'rgba(139,143,163,.12)', border: 'rgba(139,143,163,.4)' };
  }
  function cabAchieveHtml(u) {
    if (u.role === 'teacher' && u.role !== 'admin') {
      return '<div class="tl-hint">Достижения показываются ученикам. Сводка по ученикам — во вкладке «Мои ученики».</div>';
    }
    var ach = getAllAchievements();
    var totalPct = ach.totalAll ? Math.round(ach.doneTotal / ach.totalAll * 100) : 0;
    var m = medalOf(totalPct);
    var h = '';
    h += '<div style="display:flex;align-items:center;gap:14px;padding:12px;border:1px solid ' + m.border + ';border-radius:10px;background:' + m.bg + ';">';
    h += '<div style="font-size:38px;">' + m.icon + '</div>';
    h += '<div><div style="font-weight:700;color:' + m.color + ';font-size:17px;">' + m.name + '</div>' +
      '<div style="font-size:13px;color:#8B8FA3;">Общий прогресс по всем курсам · ' + ach.doneTotal + ' из ' + ach.totalAll + ' занятий · ' + totalPct + '%</div></div></div>';
    h += tlScaleHtml();
    // Сертификат за каждый полностью пройденный основной курс
    var doneCourses = [];
    COURSE_CONFIG.forEach(function (cfg) {
      if (cfg.parent) return;
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      if (pr.total && pr.done >= pr.total) doneCourses.push(cfg);
    });
    if (doneCourses.length) {
      h += '<div style="margin-top:12px;padding:12px;border:1px dashed #FFD700;border-radius:10px;background:rgba(255,215,0,.08);">';
      h += '<div style="font-weight:700;color:#FFD700;">🏆 Сертификат о прохождении курса</div>';
      h += '<div style="font-size:13px;color:#EAECEF;margin-top:6px;">Ты полностью прошёл(ла): <b>' + doneCourses.map(function (c) { return escapeHtml(c.label); }).join(', ') + '</b>.</div>';
      h += '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><select id="tlCertCourse" style="flex:1;min-width:220px;">' + doneCourses.map(function (c) { return '<option value="' + c.id + '">' + escapeHtml(c.label) + '</option>'; }).join('') + '</select>';
      h += '<button class="tl-btn-save" style="margin:0;padding:8px 14px;font-size:12.5px;" onclick="TLCore.cabPrintCert()">🖨 Печать сертификата</button></div></div>';
    } else {
      h += '<div class="tl-hint" style="margin-top:10px;">Сертификат доступен, когда ты полностью пройдёшь хотя бы один курс.</div>';
    }
    // Прогресс по каждому курсу с медалью
    COURSE_CONFIG.forEach(function (cfg) {
      if (cfg.parent) return;
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      var pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
      var mm = medalOf(pct);
      h += '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;padding:9px 12px;border:1px solid #2A2D35;border-radius:8px;">' +
        '<span style="font-size:20px;">' + mm.icon + '</span>' +
        '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + escapeHtml(cfg.label) + '</div>' +
        '<div style="height:6px;background:#2A2D35;border-radius:999px;margin-top:4px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:#2D7AFF;border-radius:999px;"></div></div></div>' +
        '<span style="font-size:12px;color:#8B8FA3;white-space:nowrap;">' + pr.done + '/' + pr.total + ' · ' + mm.name + '</span></div>';
    });
    return h;
  }
  function cabPrintCert() {
    var u = currentUser(); if (!u) return;
    var sel = document.getElementById('tlCertCourse');
    var cid = sel ? sel.value : '';
    var course = null;
    COURSE_CONFIG.forEach(function (x) { if (x.id === cid) course = x; });
    if (!course) { alert('Выбери курс для сертификата.'); return; }
    var w = window.open('', '_blank', 'width=720,height=520');
    if (!w) { alert('Разрешите всплывающие окна для печати сертификата.'); return; }
    w.document.write('<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Сертификат ТЛ</title><style>' +
      'body{font-family:Georgia,"Times New Roman",serif;margin:0;padding:48px;text-align:center;color:#1B2A4A;}' +
      '.frame{border:4px double #2D7AFF;border-radius:14px;padding:36px 28px;}' +
      'h1{font-size:30px;margin:8px 0;} .sub{letter-spacing:.2em;text-transform:uppercase;color:#5A6B85;font-size:13px;}' +
      '.name{font-size:34px;font-weight:700;color:#2D7AFF;margin:22px 0;}' +
      '.course{font-size:24px;font-weight:700;color:#1B2A4A;margin:4px 0 14px;}' +
      '.txt{font-size:15px;color:#334;max-width:480px;margin:0 auto;line-height:1.5;}' +
      '.date{margin-top:30px;color:#5A6B85;font-size:13px;}' +
      '</style></head><body><div class="frame"><div class="sub">Технологическая лаборатория · сертификат</div>' +
      '<h1>О прохождении курса</h1>' +
      '<div class="txt">Настоящий сертификат подтверждает, что</div>' +
      '<div class="name">' + escapeHtml(u.name || '') + '</div>' +
      '<div class="txt">успешно прошёл(ла) курс</div>' +
      '<div class="course">' + escapeHtml(course.label) + '</div>' +
      '<div class="txt">объединения «Технологическая лаборатория»</div>' +
      '<div class="date">' + new Date().toLocaleDateString('ru-RU') + '</div>' +
      '</div><script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>');
    w.document.close();
  }
  /* ============ Уведомления ============ */
  function cabNotifyHtml(u) {
    var items = [];
    // Ученику: сколько занятий до конца
    var ach = getAllAchievements();
    COURSE_CONFIG.forEach(function (cfg) {
      if (cfg.parent) return;
      var pr = ach.courses[cfg.id] || { done: 0, total: cfg.total };
      if (pr.done === 0) items.push({ icon: '🔓', text: 'Начни курс «' + cfg.label + '»' });
      else if (pr.done >= pr.total) items.push({ icon: '🏆', text: 'Курс «' + cfg.label + '» пройден полностью!' });
    });
    // Педагогу: просроченные задачи / ученики с отставанием
    try {
      var lateN = 0;
      if (typeof CTL_TASKS !== 'undefined' && typeof ctlCurDay !== 'undefined' && typeof ctlPeriodRange === 'function' && typeof ctlStatusForPeriod === 'function') {
        var days = ctlPeriodRange(ctlCurDay);
        CTL_TASKS.forEach(function (t, i) { if (ctlStatusForPeriod(i, days) === 'late') lateN++; });
      }
      if (lateN) items.push({ icon: '⚠️', text: 'Просроченных задач в контроле: ' + lateN + '. Открой панель «Контроль».' });
    } catch (e) {}
    try {
      if (typeof TLCore !== 'undefined' && TLCore.getStudents) {
        var ts = TLCore.getStudents();
        if (ts && ts.total) items.push({ icon: '👨‍🎓', text: 'Учеников в твоих группах: ' + ts.total + '.' });
      }
    } catch (e) {}
    if (!items.length) items.push({ icon: '✅', text: 'Всё в порядке — новых событий нет.' });
    return items.map(function (it) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #2A2D35;border-radius:8px;margin-top:8px;"><span style="font-size:18px;">' + it.icon + '</span><span style="font-size:13.5px;">' + escapeHtml(it.text) + '</span></div>';
    }).join('');
  }
  function renderCabinetPane() {
    var u = currentUser(); if (!u) return;
    var elBody = document.getElementById('tlCabBody'); if (!elBody) return;
    var html = '';
    if (CAB_TAB === 'profile') { html = cabProfileHtml(u) + cabPassHtml(); }
    else if (CAB_TAB === 'courses') { html = cabCoursesHtml(u); }
    else if (CAB_TAB === 'students') { html = cabStudentsHtml(u); }
    else if (CAB_TAB === 'users') { html = cabUsersHtml(); }
    else if (CAB_TAB === 'teachers') { html = cabTeachersHtml(); }
    else if (CAB_TAB === 'enroll') { html = cabEnrollHtml(); }
    else if (CAB_TAB === 'achieve') { html = cabAchieveHtml(u); }
    else if (CAB_TAB === 'notify') { html = cabNotifyHtml(u); }
    else { html = cabProfileHtml(u) + cabPassHtml(); }
    elBody.innerHTML = html;
    // Проводка
    var saveBtn = document.getElementById('tlPrSave');
    if (saveBtn) saveBtn.onclick = function () { cabSaveProfile(); };
    var passBtn = document.getElementById('tlPrPassBtn');
    if (passBtn) passBtn.onclick = function () { cabSavePass(); };
    var labChips = elBody.querySelectorAll && elBody.querySelectorAll('#tlPrLabs .tl-labs-chip');
    if (labChips && labChips.length && !document.getElementById('tlPrLabs').dataset.attached) {
      document.getElementById('tlPrLabs').dataset.attached = '1';
      var cur = (u.labs || []).slice();
      labChips.forEach(function (ch) {
        var id = ch.textContent.trim();
        if (cur.indexOf(id) > -1) ch.style.borderColor = '#2D7AFF'; ch.style.color = '#2D7AFF';
        ch.style.cursor = 'pointer'; ch.title = 'Нажми, чтобы выбрать';
        ch.onclick = function () {
          var i = cur.indexOf(id);
          if (i === -1) { cur.push(id); ch.style.borderColor = '#2D7AFF'; ch.style.color = '#2D7AFF'; }
          else { cur.splice(i, 1); ch.style.borderColor = '#3A3E47'; ch.style.color = '#EAECEF'; }
          updateUser(u.email, { labs: cur });
        };
      });
    }
    var admList = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-adm-edit') : [];
    admList.forEach(function (b) { b.onclick = function () { adminEdit(b.getAttribute('data-email')); }; });
    if (CAB_TAB === 'students') {
      var detBtns = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-student-det') : [];
      detBtns.forEach(function (b) { b.onclick = function () { cabShowStudent(b.getAttribute('data-course'), b.getAttribute('data-uid')); }; });
      var openBtns = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-student-open') : [];
      openBtns.forEach(function (b) { b.onclick = function () { cabOpenAll(b.getAttribute('data-course'), b.getAttribute('data-uid')); }; });
      var backBtns = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-student-back') : [];
      backBtns.forEach(function (b) { b.onclick = function () { renderCabinet(); }; });
      var open2 = elBody.querySelectorAll ? elBody.querySelectorAll('.tl-student-open2') : [];
      open2.forEach(function (b) { b.onclick = function () { cabOpenAll(b.getAttribute('data-course'), b.getAttribute('data-uid')); }; });
    }
    if (CAB_TAB === 'users') {
      var searchInput = document.getElementById('tlUserSearch');
      if (searchInput) searchInput.onkeyup = function (e) { if ((e || {}).key === 'Enter') cabUsersApply(); };
    }
  }
  function renderCabinet() {
    var u = currentUser(); if (!u) return;
    var elName = document.getElementById('tlCabName');
    var elRole = document.getElementById('tlCabRole');
    if (elName) elName.textContent = u.name || u.email;
    if (elRole) elRole.textContent = u.role === 'admin' ? 'Администратор' : (u.role === 'teacher' ? 'Педагог / наставник' : 'Обучающийся');
    cabRenderTabs();
    renderCabinetPane();
    var ap = document.getElementById('tlAdminPanel');
    if (ap) { ap.style.display = 'none'; var isAdmin = (u.role === 'admin'); ap.style.display = isAdmin ? 'block' : 'none'; }
  }
  
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
      var pr = courseProgressOf(cfg, u);
      result.courses[cfg.id] = pr;
      if (!cfg.parent) {
        result.doneTotal += pr.done;
        result.totalAll += pr.total;
      }
    });
    return result;
  }
  /* -------- Сводка учеников для педагога / руководителя -------- */
  function normName(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function surnameOf(s) { return normName(s).split(' ')[0] || ''; }
  function teacherMatches(teacherField, teacherUser) {
    if (!teacherField || !teacherUser) return false;
    var t = normName(teacherField);
    var n = teacherUser.name ? normName(teacherUser.name) : '';
    var pos = teacherUser.position || '';
    var posLabel = POSITIONS[pos] || '';
    if (n && (t === n || (surnameOf(n) && t.indexOf(surnameOf(n)) !== -1))) return true;
    var sn = surnameOf(posLabel);
    if (pos === 'kazakevich' && t.indexOf('казакевич') !== -1) return true;
    if (sn && t.indexOf(sn) !== -1) return true;
    return false;
  }
  function studentsOfCourse(cfg) {
    try { return JSON.parse(localStorage.getItem(cfg.profilesKey) || '[]') || []; } catch (e) { return []; }
  }
  function progressForStudentProfile(cfg, sp) {
    var courseUid = sp && (sp.uid || sp.id);
    var res = { done: 0, total: cfg.total };
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
  function getStudentsForTeacher() {
    var u = currentUser();
    var result = { courses: {}, total: 0 };
    if (!u) return result;
    var all = (u.role === 'admin' || u.position === 'zav');
    COURSE_CONFIG.forEach(function (cfg) {
      var list = [];
      studentsOfCourse(cfg).forEach(function (sp) {
        if (!sp || sp.role === 'teacher' || sp.role === 'admin') return;
        if (!all && !teacherMatches(sp.teacher, u)) return;
        list.push({ profile: sp, progress: progressForStudentProfile(cfg, sp), courseId: cfg.id });
      });
      if (list.length) { result.courses[cfg.id] = { cfg: cfg, students: list }; result.total += list.length; }
    });
    return result;
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
      '<div style="margin-top:6px;"><label style="font-size:12px;color:#8B8FA3;">Должность/роль</label><select id="tlAdmRole" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;"><option value="learner">Обучающийся</option><option value="teacher">Педагог / сотрудник</option><option value="admin">Администратор</option></select></div>' +
      (target.role === 'admin' ? '' : '<div style="margin-top:6px;"><label style="font-size:12px;color:#8B8FA3;">Должность (для сотрудника)</label><select id="tlAdmPosition" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;">' + Object.keys(POSITIONS).map(function(k){ return '<option value="' + k + '">' + POSITIONS[k] + '</option>'; }).join('') + '</select></div>') +
      '<div style="margin-top:6px;"><label style="font-size:12px;color:#8B8FA3;">Класс</label><input id="tlAdmCls" value="' + escapeHtml(target.cls || '') + '" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;"></div>' +
      '<div style="margin-top:6px;"><label style="font-size:12px;color:#8B8FA3;">Школа</label><input id="tlAdmSchool" value="' + escapeHtml(target.school || '') + '" style="width:100%;background:#1B1E26;border:1px solid #2A2D35;color:#EAECEF;padding:6px 8px;border-radius:6px;"></div>' +
      '<div style="margin-top:10px;"><button class="tl-adm-save" style="background:#2D7AFF;border:0;color:#fff;font-size:13px;border-radius:6px;padding:6px 14px;cursor:pointer;">Сохранить</button></div>';
    var selR = ap.querySelector('#tlAdmRole'); if (selR) selR.value = target.role === 'teacher' ? 'teacher' : (target.role === 'admin' ? 'admin' : 'learner');
    var selP = ap.querySelector('#tlAdmPosition'); if (selP) selP.value = target.position || '';
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
    var roleSel = document.getElementById('tlAdmRole');
    if (roleSel) target.role = roleSel.value === 'teacher' ? 'teacher' : (roleSel.value === 'admin' ? 'admin' : 'learner');
    var posSel = document.getElementById('tlAdmPosition');
    if (posSel && target.role !== 'admin') target.position = posSel.value || '';
    else if (target.role === 'admin') target.position = '';
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
    isStaff: isStaff,
    currentPositionCode: currentPositionCode,
    currentPositionLabel: currentPositionLabel,
    POSITIONS: POSITIONS,
    listUsers: listUsers,
    updateUser: updateUser,
    updateOwnProfile: updateOwnProfile,
    updateOwnPass: updateOwnPass,
    getProgress: getProgress,
    setLessonDone: setLessonDone,
    isLessonDone: isLessonDone,
    getAchievements: getAllAchievements,
    tlScaleHtml: tlScaleHtml,
    getStudents: getStudentsForTeacher,
    getTeacherRegistry: getTeacherRegistry,
    saveTeacherRegistry: saveTeacherRegistry,
    teacherList: teacherList,
    teacherCode: teacherCode,
    isTeacherCode: isTeacherCode,
    addTeacher: addTeacher,
    removeTeacher: removeTeacher,
    saveTeacherCode: uiSaveTeacherCode,
    addTeacherUI: uiAddTeacher,
    waitlist: waitlist,
    cabExportProgress: cabExportProgress,
    cabImportProgressFile: cabImportProgressFile,
    cabPrintCert: cabPrintCert,
    cabOpenAll: cabOpenAll,
    cabUsersApply: cabUsersApply,
    cabEnrollDone: cabEnrollDone,
    cabStudents: cabStudents,
    openAuth: function (tab) { openModal(tab || 'login'); },
    closeAuth: closeModal,
    authTab: switchTab,
    openCabinet: openCabinet,
    closeCabinet: closeCabinet,
    cabTab: cabTab,
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
  global.TL_CONST = TL_CONST;

  // Автоподключение, если на странице есть кнопки с data-tl-auth
  if (global.document) {
    document.addEventListener('DOMContentLoaded', function () {
      renderAuthWidget();
    });
  }
})(window);