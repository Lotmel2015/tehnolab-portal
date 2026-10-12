/* ============================================================
   ТЛ — МОСТ МЕЖДУ ПОРТАЛОМ И КУРСАМИ (tl-bridge.js)
   ------------------------------------------------------------
   Задача: одна сквозная система регистрации + фиксация всех
   достижений в личном кабинете портала.

   Проблема: курс VR-студии имеет СВОЮ систему (vr_profiles,
   vr_current_user, vr_u_<uid>_l_<N>), портал — свою
   (tl.users, tl.session, tl.progress.*).

   Мост делает следующее:
   1) ВО ВХОДЕ В КУРС: если пользователь вошёл на портале
      (tl.session), то мост автоматически создаёт/находит профиль
      курса с тем же именем и связывает uid курса с аккаунтом
      портала (запись tl.link.<portalEmail> = { course:'vr', uid:... }).
   2) ПРИ ПРОХОЖДЕНИИ ЗАНЯТИЯ: занятие пишет свой прогресс
      (vr_u_<uid>_l_<N>="1"). Личный кабинет портала уже умеет
      читать эти ключи (getAchievements), поэтому все достижения
      автоматически видны в кабинете.
   3) В ЛК ПОРТАЛА: показываются не только занятия VR, но и общий
      счётчик, металлы (мотивационная шкала) и собранные рефлексии.

   КАК ПОДКЛЮЧИТЬ НА СТРАНИЦЕ КУРСА:
     <script src="../ТЛ/ТЛ концепция/tl-portal-core.js"></script>
     <script src="../ТЛ/ТЛ концепция/tl-bridge.js"></script>
   (пути можно менять — файлы кладутся рядом с курсом)
   ============================================================ */
(function (global) {
  'use strict';

  var COURSE_ID = 'vr_studio';       // id курса в общем хранилище портала
  var COURSE_LABEL = 'VR-студия';
  var COURSE_TOTAL = 36;             // количество занятий (можно переопределить из lessons.length)

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

  function courseProfiles() { try { return JSON.parse(ls('vr_profiles') || '[]'); } catch (e) { return []; } }
  function saveCourseProfiles(a) { lsW('vr_profiles', a); }

  function findOrCreateCourseUser(portalU) {
    if (!portalU) return null;
    var profiles = courseProfiles();
    var name = portalU.name || portalU.email;
    // 1) по прямой ссылке tl.link.<email>
    var linked = portalU && lsJ('tl.link.' + portalU.email);
    if (linked && linked.course === COURSE_ID) {
      var p = profiles.find(function (x) { return x.uid === linked.uid; });
      if (p) return p;
    }
    // 2) по имени
    var byName = profiles.find(function (x) { return (x.name || '').toLowerCase() === name.toLowerCase(); });
    if (byName) {
      lsW('tl.link.' + portalU.email, { course: COURSE_ID, uid: byName.uid });
      return byName;
    }
    // 3) создаём новый профиль курса
    var np = {
      uid: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      role: 'student',
      name: portalU.name || portalU.email,
      klass: portalU.cls || '',
      teacher: 'Казакевич Константин Михайлович',
      code: String(Math.floor(1000 + Math.random() * 9000)) + '/' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      created: new Date().toISOString()
    };
    profiles.push(np);
    saveCourseProfiles(profiles);
    lsW('tl.link.' + portalU.email, { course: COURSE_ID, uid: np.uid });
    return np;
  }

  function syncSessionToCourse() {
    // Если на портале вошли — применяем ту же личность в курсе
    var u = portalUser();
    if (!u) return false;
    var cp = findOrCreateCourseUser(u);
    if (!cp) return false;
    try {
      // Не перезаписываем сессию без надобности: если в курсе уже сидит тот же человек — ок.
      var cur = lsJ('vr_current_user');
      if (cur && String(cur.uid) === String(cp.uid)) return true;
      localStorage.setItem('vr_current_user', JSON.stringify({ uid: cp.uid, role: cp.role }));
      // Оповещаем курс, что пользователь сменился (страница перерисуется)
      if (global.document) {
        document.dispatchEvent(new CustomEvent('tl:course-user', { detail: cp }));
      }
    } catch (e) {}
    return true;
  }

  function init(opts) {
    opts = opts || {};
    if (opts.total) COURSE_TOTAL = opts.total;
    // 1) Слушаем события портала (когда вошли/вышли в ЛК)
    if (global.TLCore) {
      TLCore.on('login', function () { setTimeout(syncSessionToCourse, 50); });
      TLCore.on('logout', function () { try { localStorage.removeItem('vr_current_user'); } catch (e) {} });
    }
    // 2) Всегда синхронизируем, если есть портальная сессия —
    //    если в курсе осталась сессия другого человека, она будет заменена на актуальную.
    if (portalUser()) {
      syncSessionToCourse();
    }
    // 2.1) Перерисовка при изменении сессии в ДРУГОЙ вкладке (портала)
    if (global.addEventListener) {
      global.addEventListener('storage', function (e) {
        if (e && (e.key === 'tl.session' || e.key === 'tl.users' || e.key === 'vr_current_user')) {
          setTimeout(function () {
            if (portalUser()) syncSessionToCourse();
            if (global.document) {
              // пробуем перерисовать интерфейс курса
              try { if (typeof global.renderAuth === 'function') global.renderAuth(); } catch (e2) {}
              try { if (typeof global.render === 'function') global.render(); } catch (e3) {}
            }
          }, 60);
        }
      });
    }
    // 3) Публикуем в портальный кабинет достижения (список/счётчик)
    if (global.TLCore && global.TLCore.setLessonDone) {
      // отметим прогресс в общем хранилище
      try {
        var uid = null;
        var cs = lsJ('vr_current_user'); if (cs) uid = cs.uid;
        if (uid) {
          for (var i = 1; i <= COURSE_TOTAL; i++) {
            if (ls('vr_u_' + uid + '_l_' + i) === '1') {
              TLCore.setLessonDone(COURSE_ID, String(i), true);
            }
          }
        }
      } catch (e) {}
    }
    if (global.TLCore && global.TLCore.refreshUI) global.TLCore.refreshUI();
    return { ok: true, courseId: COURSE_ID };
  }

  global.TLBridge = { init: init, COURSE_ID: COURSE_ID, COURSE_LABEL: COURSE_LABEL, COURSE_TOTAL: COURSE_TOTAL, syncSessionToCourse: syncSessionToCourse };
})(window);