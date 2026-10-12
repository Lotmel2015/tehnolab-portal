/* Интерактивный квиз занятия (геймификация) — общий модуль для курсов ТЛ
   Подключение: <script src="tl-quiz.js"></script>
   Разметка: <div class="quiz-game" id="quiz-box" data-q="[{q,opts:[{t,good,why}]}]"></div>
   Инициализация: TQuiz.init(ключ, номерЗанятия) */
(function (global) {
  'use strict';

  function start(KEY) {
    var state = { idx: 0, score: 0, done: 0 };
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) state = s; } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
    var qBox = document.getElementById('quiz-box');
    if (!qBox) return;
    var data = [];
    try { data = JSON.parse(qBox.getAttribute('data-q')); } catch (e) {}
    function bOnClick(o, i) {
      var bs = qBox.querySelectorAll('.opt');
      bs.forEach(function (x, idx) { x.className = 'opt ' + (data[state.idx].opts[idx].good ? 'ok' : 'bad'); x.disabled = true; });
      if (o.good) state.score++;
      state.done++;
      var ex = document.createElement('div');
      ex.className = 'explain show ' + (o.good ? 'ok' : 'bad');
      ex.textContent = (o.good ? '✓ Верно! ' : '✗ Внимание: ') + o.why;
      qBox.appendChild(ex);
      var nx = document.createElement('button');
      nx.className = 'again';
      nx.type = 'button';
      nx.textContent = state.idx + 1 < data.length ? 'Следующий вопрос →' : 'К результату';
      nx.addEventListener('click', function () { state.idx++; save(); render(); });
      qBox.appendChild(nx);
      save();
    }
    function render() {
      if (state.idx >= data.length) {
        var ok = data.length ? Math.round(state.score / data.length * 100) : 0;
        var msg = document.createElement('div');
        msg.className = 'stats';
        msg.textContent = 'Верно: ' + state.score + ' из ' + data.length + ' (' + ok + '%)';
        var note = document.createElement('p');
        note.textContent = ok >= 60 ? 'Отличная работа! Тема закреплена.' : 'Пройди ещё раз — вопросы помогут закрепить тему.';
        var again = document.createElement('button');
        again.className = 'again';
        again.type = 'button';
        again.textContent = 'Пройти заново';
        again.addEventListener('click', function () { location.reload(); });
        qBox.innerHTML = '';
        qBox.appendChild(msg);
        qBox.appendChild(note);
        qBox.appendChild(again);
        return;
      }
      var q = data[state.idx];
      var h = document.createElement('h4');
      h.textContent = 'Квиз занятия';
      var qn = document.createElement('div');
      qn.className = 'qn';
      qn.textContent = 'Вопрос ' + (state.idx + 1) + ' из ' + data.length + ' · верно: ' + state.score;
      var qt = document.createElement('div');
      qt.className = 'qt';
      qt.textContent = q.q;
      qBox.innerHTML = '';
      qBox.appendChild(h);
      qBox.appendChild(qn);
      qBox.appendChild(qt);
      q.opts.forEach(function (o, i) {
        var b = document.createElement('button');
        b.className = 'opt';
        b.type = 'button';
        b.textContent = o.t;
        b.addEventListener('click', function () { bOnClick(o, i); });
        qBox.appendChild(b);
      });
    }
    render();
  }

  global.TQuiz = {
    start: function (key) { start(key); }
  };
})(window);