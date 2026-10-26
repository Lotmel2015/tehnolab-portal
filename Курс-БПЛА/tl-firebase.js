/* ============================================================
   tl-firebase.js — облачная синхронизация ТЛ (Firebase Firestore)
   Прогрессивное улучшение: если Firebase недоступен или не
   настроен — портал и курсы работают как раньше (localStorage).

   Подключается ДО tl-portal-core.js:
     <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
     <script src="tl-firebase.js"></script>
   ============================================================ */
(function (global) {
  'use strict';

  var CONFIG = {
    apiKey: "AIzaSyDiR1xvKbxzx6JVreVOe3qeOzPu_7tVvhQ",
    authDomain: "tehnolab-portal.firebaseapp.com",
    projectId: "tehnolab-portal",
    storageBucket: "tehnolab-portal.firebasestorage.app",
    messagingSenderId: "774749466415",
    appId: "1:774749466415:web:4eaf788d50b5ade44f7bda"
  };

  var cloud = { enabled: false, ready: false, uid: null, app: null, db: null, auth: null };

  function init() {
    try {
      if (!global.firebase) return;                       // SDK не загрузился — офлайн-режим
      cloud.app = firebase.initializeApp(CONFIG, 'tl');
      cloud.auth = firebase.auth(cloud.app);
      cloud.db = firebase.firestore(cloud.app);
      try { cloud.db.settings({}); } catch (e) {}
      cloud.enabled = true;
      cloud.auth.signInAnonymously().then(function (r) {
        cloud.uid = r.user.uid;
        cloud.ready = true;
      }).catch(function () { cloud.ready = false; });
    } catch (e) { cloud.enabled = false; }
  }

  function safeEmail(e) { return String(e || '').trim().toLowerCase(); }
  function docId(e) { return safeEmail(e).replace(/[^a-z0-9@._-]/g, '_') || 'user'; }

  /* Профиль пользователя → Firestore users/{email} (без пароля) */
  function pushUser(profile) {
    if (!cloud.enabled || !cloud.db || !profile) return;
    var d = {
      email: safeEmail(profile.email),
      name: String(profile.name || ''),
      role: profile.role === 'teacher' ? 'teacher' : (profile.role === 'admin' ? 'admin' : 'learner'),
      cls: String(profile.cls || ''),
      school: String(profile.school || ''),
      phone: String(profile.phone || ''),
      labs: Array.isArray(profile.labs) ? profile.labs : [],
      createdAt: profile.createdAt || new Date().toISOString()
    };
    if (!d.email) return;
    try { cloud.db.collection('users').doc(docId(d.email)).set(d, { merge: true }); } catch (e) {}
  }

  /* Прогресс пользователя по курсу → Firestore progress/{courseId}/users/{uid}
     map: { lessonId: { done:true, at:... } } */
  function pushProgress(courseId, uid, map) {
    if (!cloud.enabled || !cloud.db || !courseId || !uid) return;
    var obj = {};
    Object.keys(map || {}).forEach(function (k) { if (map[k] && map[k].done) obj[k] = true; });
    var total = Object.keys(obj).length;
    try {
      cloud.db.collection('progress').doc(String(courseId)).collection('users')
        .doc(String(uid).replace(/[^a-zA-Z0-9._-]/g, '_') || 'u')
        .set({ uid: String(uid), lessons: obj, total: total, at: new Date().toISOString() }, { merge: true });
    } catch (e) {}
  }

  /* Выгрузка с сервера: все профили + прогресс курсов.
     cb(result, err) — result: { users:[...], progress: {courseId: [{uid, lessons, total, at}]} } */
  function fetchAll(cb) {
    var result = { users: [], progress: {} };
    if (!cloud.enabled || !cloud.db) { cb(result); return; }
    var remaining = 2;
    function done() { remaining--; if (remaining <= 0) cb(result); }
    cloud.db.collection('users').get().then(function (snap) {
      snap.forEach(function (doc) { result.users.push(doc.data()); });
      done();
    }).catch(function () { done(); });
    cloud.db.collection('progress').get().then(function (snapCourses) {
      var proms = [];
      snapCourses.forEach(function (doc) {
        proms.push(doc.ref.collection('users').get().then(function (snapUsers) {
          result.progress[doc.id] = [];
          snapUsers.forEach(function (u) { result.progress[doc.id].push(u.data()); });
        }));
      });
      Promise.all(proms).then(done).catch(done);
    }).catch(function () { done(); });
  }

  function isEnabled() { return !!(cloud.enabled && cloud.ready); }

  init();
  cloud.pushUser = pushUser;
  cloud.pushProgress = pushProgress;
  cloud.fetchAll = fetchAll;
  cloud.isEnabled = isEnabled;
  global.TLCloud = cloud;
})(window);