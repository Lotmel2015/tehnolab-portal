/* Мотивационная шкала + таблица лидеров для курсов ТЛ (модуль)
   Использование: TScale.init({ total, prefix, lessonKey, profilesKey, mode })
   - total: число занятий
   - lessonKey: функция (uid, n) => bool — пройдено ли занятие n у пользователя
   - profilesKey: ключ массива профилей
   Разметка: <div id="scaleWrap"></div> */
(function (global) {
  'use strict';
  var METALS = [
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

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsJ(k) { try { return JSON.parse(ls(k) || 'null'); } catch (e) { return null; } }

  function metalOf(t) { var m = METALS[0]; for (var i = 0; i < METALS.length; i++) { if (t >= METALS[i].need) m = METALS[i]; } return m; }

  function render(cfg) {
    var wrap = document.getElementById('scaleWrap');
    if (!wrap) return;
    var profiles = lsJ(cfg.profilesKey) || [];
    var students = profiles.filter(function (p) { return p.role !== 'teacher'; });
    wrap.innerHTML = '';
    var head = document.createElement('h3');
    head.textContent = '🏆 Мотивационная шкала курса';
    wrap.appendChild(head);
    // Степени
    var stepsBox = document.createElement('div');
    stepsBox.className = 'scale-steps';
    var stepsCopy = METALS.slice().reverse();
    stepsCopy.forEach(function (m) {
      var s = document.createElement('div');
      s.className = 'scale-step';
      s.style.background = m.bg;
      s.style.color = m.fg;
      s.innerHTML = '<span class="si">' + m.icon + '</span><span class="sn"><b>' + m.name + '</b><i>итог ≥ ' + m.need + ' б.</i></span>';
      stepsBox.appendChild(s);
    });
    wrap.appendChild(stepsBox);
    // Таблица лидеров
    if (!students.length) {
      var empty = document.createElement('div');
      empty.className = 'scale-empty';
      empty.textContent = 'Пока нет зарегистрированных учеников — войди, чтобы появиться в рейтинге.';
      wrap.appendChild(empty);
      return;
    }
    var rows = students.map(function (p) {
      var done = 0;
      for (var i = 1; i <= cfg.total; i++) { if (cfg.lessonKey(p, i)) done++; }
      var prog = Math.round(done / cfg.total * 100);
      return { name: p.name || 'Без имени', klass: p.klass || '', prog: prog, total: Math.round(prog * 0.4 + 60 * 0.6) };
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    var list = document.createElement('div');
    list.className = 'scale-leaders';
    rows.forEach(function (r, idx) {
      var m = metalOf(r.total);
      var row = document.createElement('div');
      row.className = 'leader-row' + (idx < 3 ? ' top' : '');
      row.innerHTML = '<span class="pos">' + (idx + 1) + '</span><span class="medal" style="background:' + m.bg + ';color:' + m.fg + '">' + m.icon + '</span><span class="who"><b>' + r.name + '</b><i>' + r.klass + '</i></span><span class="bar"><i style="width:' + r.prog + '%"></i></span><b class="pts">' + r.total + ' б.</b>';
      list.appendChild(row);
    });
    wrap.appendChild(list);
  }

  global.TScale = {
    init: function (cfg) { if (document.readyState !== 'loading') render(cfg); document.addEventListener('DOMContentLoaded', function () { render(cfg); }); window.addEventListener('load', function () { render(cfg); }); window.addEventListener('storage', function () { render(cfg); }); }
  };
})(window);