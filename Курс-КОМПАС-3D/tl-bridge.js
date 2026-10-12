/* ============================================================
   ТЛ — МОСТ МЕЖДУ ПОРТАЛОМ И КУРСАМИ (tl-bridge.js)
   ------------------------------------------------------------
   Адаптировано для курса: КОМПАС-3D
   courseId: kompas_3d · занятий/модулей: 28
   Ключи: profiles=kompas-course-users, session=kompas-course-active
   ============================================================ */
(function (global) {
  'use strict';

  var COURSE_ID = 'kompas_3d';
  var COURSE_LABEL = 'КОМПАС-3D';
  var COURSE_TOTAL = 28;

  var PROFILES_KEY = 'kompas-course-users';
  var SESSION_KEY = 'kompas-course-active';
  var ID_FIELD = 'id';
  var PROGRESS_MODE = 'week_obj';       // 'lesson_l' или 'week_obj'
  var PROGRESS_KEY_PREFIX = 'kompas-course-progress-'; // для week_obj: bpla-course-progress-, и т.п.

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsJ(k) { try { return JSON.parse(ls(k) || 'null'); } catch (e) { return null; } }
  function lsW(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function getWeb() {
    return {
      session: lsJ('tl.session'),
      users: lsJ('tl.users') || {},
      get link() { return this.session ? lsJ('tl.link.' + this.session.email) : null; }
    };
  }

  function portalUser() {
    var w = getWeb();
    if (!w.session) return null;
    return w.users[w.session.email] || null;
  }

  function courseProfiles() { try { return JSON.parse(ls(PROFILES_KEY) || '[]'); } catch (e) { return []; } }
  function saveCourseProfiles(a) { lsW(PROFILES_KEY, a); }

  function findOrCreateCourseUser(portalU) {
    if (!portalU) return null;
    var profiles = courseProfiles();
    var name = portalU.name || portalU.email;
    var linked = portalU && lsJ('tl.link.' + portalU.email);
    if (linked && linked.course === COURSE_ID) {
      var p = profiles.find(function (x) { return String(x[ID_FIELD]) === String(linked.uid); });
      if (p) return p;
    }
    var byName = profiles.find(function (x) { return (x.name || '').toLowerCase() === name.toLowerCase(); });
    if (byName) {
      lsW('tl.link.' + portalU.email, { course: COURSE_ID, uid: byName[ID_FIELD] });
      return byName;
    }
    var _uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var np = {};
    np[ID_FIELD] = _uid;
    np.uid = _uid;
    np.role = 'student';
    np.name = portalU.name || portalU.email;
    np.klass = portalU.cls || '';
    np.school = portalU.school || '';
    np.teacher = 'Казакевич Константин Михайлович';
    np.code = String(Math.floor(1000 + Math.random() * 9000)) + '/' + Math.random().toString(36).slice(2, 6).toUpperCase();
    np.created = new Date().toISOString();
    profiles.push(np);
    saveCourseProfiles(profiles);
    lsW('tl.link.' + portalU.email, { course: COURSE_ID, uid: _uid });
    return np;
  }

  function syncSessionToCourse() {
    var u = portalUser();
    if (!u) return false;
    var cp = findOrCreateCourseUser(u);
    if (!cp) return false;
    try {
      var cur = lsJ(SESSION_KEY);
      if (cur && String(cur[ID_FIELD] || cur.uid || cur.id) === String(cp[ID_FIELD])) return true;
      var s = {}; s[ID_FIELD] = cp[ID_FIELD]; s.uid = cp.uid; s.role = cp.role;
      localStorage.setItem(SESSION_KEY, String(s.id || s.uid || ""));
      if (global.document) {
        document.dispatchEvent(new CustomEvent('tl:course-user', { detail: cp }));
      }
    } catch (e) {}
    return true;
  }

  function lessonDone(uid, n) {
    // Проверяем, пройдено ли занятие n — по формату хранения прогресса курса
    try {
      if (PROGRESS_MODE === 'lesson_l') {
        return ls(uid + '_l_' + n) === '1';
      }
      // week_obj: объект { "w1": true, ... } в ключе PROGRESS_KEY_PREFIX + uid
      var obj = lsJ(PROGRESS_KEY_PREFIX + uid) || {};
      return !!obj['w' + n];
    } catch (e) { return false; }
  }

  
  function qp(name) { try { return new URLSearchParams(window.location.search || '').get(name); } catch (e) { return null; } }
  function syncFromUrl() {
    var email = qp('tl_email');
    if (!email) return false;
    // Создаём/используем профиль курса по email прямо здесь
    var profiles = courseProfiles();
    var cp = profiles.find(function (x) { return x.email === email || (x.name || '').toLowerCase() === email.replace(/@.*$/, '').toLowerCase(); });
    if (!cp) {
      cp = { email: email, name: email.split('@')[0] || email, role: 'student', klass: '', school: '', teacher: 'Казакевич Константин Михайлович' };
      cp.uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      if (ID_FIELD === 'id') { cp.id = cp.uid; } else { cp.id = cp.uid; }
      profiles.push(cp);
      saveCourseProfiles(profiles);
    }
    try { localStorage.setItem(SESSION_KEY, String(cp.id || cp.uid || '')); } catch (e) {}
    return !!cp;
  }
function init(opts) {
    opts = opts || {};
    if (opts.total) COURSE_TOTAL = opts.total;
    if (global.TLCore) {
      TLCore.on('login', function () { setTimeout(syncSessionToCourse, 50); });
      TLCore.on('logout', function () { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} });
    }
    if (portalUser()) syncSessionToCourse();
    if (!portalUser()) syncFromUrl();
    if (global.addEventListener) {
      global.addEventListener('storage', function (e) {
        if (e && (e.key === 'tl.session' || e.key === 'tl.users' || e.key === SESSION_KEY)) {
          setTimeout(function () {
            if (portalUser()) syncSessionToCourse();
            if (global.document) {
              try { if (typeof global.renderAuth === 'function') global.renderAuth(); } catch (e2) {}
              try { if (typeof global.render === 'function') global.render(); } catch (e3) {}
              try { if (typeof global.renderStudents === 'function') global.renderStudents(); } catch (e4) {}
            }
          }, 60);
        }
      });
    }
    if (global.TLCore && global.TLCore.setLessonDone) {
      try {
        var uid = null;
        var cs = lsJ(SESSION_KEY); if (cs) uid = cs.uid || cs.id || null;
        if (uid) {
          for (var i = 1; i <= COURSE_TOTAL; i++) {
            if (lessonDone(uid, i)) TLCore.setLessonDone(COURSE_ID, String(i), true);
          }
        }
      } catch (e) {}
    }
    if (global.TLCore && global.TLCore.refreshUI) global.TLCore.refreshUI();
    return { ok: true, courseId: COURSE_ID };
  }

  global.TLBridge = { init: init, syncFromUrl: syncFromUrl, COURSE_ID: COURSE_ID, COURSE_LABEL: COURSE_LABEL, COURSE_TOTAL: COURSE_TOTAL, syncSessionToCourse: syncSessionToCourse };
})(window);
