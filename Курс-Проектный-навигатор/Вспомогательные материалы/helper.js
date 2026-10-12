(function () {
  "use strict";

  // ===== Параметры текущего URL =====
  function qp(name) { try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; } }
  var P_UID = qp("uid");
  var P_FIRST = qp("first");
  var P_LAST = qp("last");
  var P_CLS = qp("cls");
  var P_SCHOOL = qp("school");
  var P_LESSON = qp("lesson");

  function lessonFromPath() {
    var p = decodeURIComponent(window.location.pathname || "");
    var m = p.match(/(\d{1,2})/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return (n >= 1 && n <= 37) ? n : 0;
  }
  function isMainLesson() {
    var name = decodeURIComponent(window.location.pathname || "").split("/").pop();
    return /Занятие-\d{1,2}-/.test(name) && name.indexOf("Приложение") === -1 && name.indexOf("Игра") === -1;
  }
  function isAnketa() {
    var name = decodeURIComponent(window.location.pathname || "").split("/").pop();
    return name.indexOf("Анкета") === 0;
  }
  function pageLabel() {
    var name = decodeURIComponent(window.location.pathname || "").split("/").pop().replace(/\.html?$/i, "");
    return name || "работа";
  }

  // ===== Профиль (из query) =====
  function profileFull() { return [(P_LAST || ""), (P_FIRST || "")].join(" ").trim(); }

  // ===== Автозаполнение полей (формы занятий и анкеты) =====
  function fillProfile() {
    if (!P_FIRST && !P_LAST && !P_CLS && !P_SCHOOL) return;
    var full = profileFull();
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var yyyy = today.getFullYear();
    var dateStr = dd + "." + mm + "." + yyyy;

    var map = isAnketa()
      ? { "i-name": full, "i-class": P_CLS || "", "i-school": P_SCHOOL || "" }
      : { "f-name": full, "f-class": P_CLS || "", "f-school": P_SCHOOL || "", "f-date": dateStr };

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        el.value = map[id];
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // ===== Пропагация query во внутренние ссылки =====
  function myParams() {
    var out = [];
    function add(k, v) { if (v !== null && v !== "") out.push(k + "=" + encodeURIComponent(v)); }
    add("uid", P_UID); add("first", P_FIRST); add("last", P_LAST); add("cls", P_CLS); add("school", P_SCHOOL);
    return out;
  }
  function propagateQuery() {
    var params = myParams();
    if (params.length === 0) return;
    var query = "?" + params.join("&");
    var links = document.querySelectorAll('a[href$=".html"], a[href$=".HTML"]');
    Array.prototype.forEach.call(links, function (a) {
      var href = a.getAttribute("href");
      if (!href || /^https?:\/\//i.test(href) || /^#/.test(href) || !/\.html?$/i.test(href)) return;
      var base = href.split("?")[0];
      document.querySelectorAll("body"); // no-op, keep scope
      a.setAttribute("href", base + query);
    });
  }

  // ===== Нижняя панель =====
  function barEl() {
    var bar = document.getElementById("pdn-course-bar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "pdn-course-bar";
    bar.setAttribute("style", "position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#422C50;color:#fff;" +
      "font:600 13px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px;" +
      "align-items:center;justify-content:center;box-shadow:0 -2px 12px rgba(20,33,61,.2);");
    document.body.appendChild(bar);
    return bar;
  }
  function btn(label, bg) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    b.setAttribute("style", "background:" + (bg || "#5B21B6") + ";color:#fff;border:none;border-radius:8px;" +
      "padding:6px 12px;font-weight:700;cursor:pointer;font:inherit;");
    return b;
  }

  function buildBar() {
    var bar = barEl();
    var full = profileFull();
    var label = document.createElement("span");
    label.textContent = "Профиль: " + (full || "не выбран") + (P_CLS ? " · " + P_CLS : "");
    bar.appendChild(label);

    // К списку занятий
    var toCourse = document.createElement("a");
    toCourse.textContent = "К списку занятий";
    var idx = "../index.html";
    if (P_UID) idx += "?uid=" + encodeURIComponent(P_UID);
    toCourse.href = idx;
    toCourse.setAttribute("style", "color:#D8CCE8;font-weight:700;text-decoration:none;");
    bar.appendChild(toCourse);

    // Экспорт заполненной формы в Word + HTML (если на странице есть поля)
    if (hasFormFields()) {
      var ex = btn("💾 Сохранить (Word + HTML)", "#167A4D");
      ex.addEventListener("click", function () { exportForm(); });
      bar.appendChild(ex);
    }

    // Если выбран UID — кнопка «Завершить занятие» на главной странице занятия
    var lesson = lessonFromPath();
    if (isMainLesson() && P_UID && lesson >= 1 && lesson <= 36) {
      var done = btn("✓ Завершить занятие " + lesson, "#167A4D");
      done.addEventListener("click", function () {
        window.location.href = "../index.html?lesson=" + lesson + "&done=1&uid=" + encodeURIComponent(P_UID);
      });
      bar.appendChild(done);
    }

    propagateQuery();
  }

  // ===== Проверка: есть ли заполняемые поля =====
  function hasFormFields() {
    var els = document.querySelectorAll("input:not([type=button]):not([type=submit]):not([type=hidden]), textarea, select");
    return els.length > 0;
  }

  // ===== Сбор значений всех полей =====
  function collectFields() {
    var items = [];
    var els = document.querySelectorAll("input, textarea, select");
    Array.prototype.forEach.call(els, function (el) {
      if (el.type === "button" || el.type === "submit" || el.type === "hidden") return;
      var label = "";
      var lab = el.closest ? el.closest(".field, .q, label") : null;
      if (lab) { label = lab.textContent.trim().slice(0, 80); }
      var id = el.id || el.name || "";
      var value;
      if (el.type === "checkbox") value = el.checked ? "☑ да" : "☐ нет";
      else if (el.type === "radio") { if (!el.checked) return; value = (el.value || "да"); }
      else value = el.value || "";
      var ph = el.placeholder || "";
      items.push({ id: id, label: label, ph: ph, value: value });
    });
    return items;
  }

  // ===== Генерация HTML-представления заполненной формы =====
  function formHTML(title) {
    var full = profileFull() || "ученик";
    var items = collectFields();
    var rows = "";
    items.forEach(function (it) {
      var cap = it.label || it.ph || it.id;
      if (!cap && !it.value) return;
      rows += "<tr><td style=\"width:38%;padding:6px 8px;border:1px solid #DDD8E6;vertical-align:top;\">" +
        escapeHtml(cap) + "</td><td style=\"padding:6px 8px;border:1px solid #DDD8E6;vertical-align:top;\">" +
        escapeHtml(it.value) + "</td></tr>";
    });
    var now = new Date().toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
    return "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"utf-8\">" +
      "<title>" + escapeHtml(title) + "</title></head><body style=\"font:14px/1.5 system-ui,sans-serif;margin:24px;\">" +
      "<h2>" + escapeHtml(title) + "</h2>" +
      "<p><b>Ученик:</b> " + escapeHtml(full) + (P_CLS ? " · " + escapeHtml(P_CLS) : "") + "</p>" +
      "<table style=\"width:100%;border-collapse:collapse;\">" + rows + "</table>" +
      "<p style=\"color:#888;font-size:12px;\">Сохранено: " + now + "</p></body></html>";
  }
  function escapeHtml(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ===== Имя файла =====
  function fileBase() {
    var full = profileFull().replace(/\s+/g, "_") || "ученик";
    var lesson = lessonFromPath();
    var pref = lesson ? ("Занятие-" + lesson) : "Входное-тестирование";
    var tag = pageLabel().replace(/\s+/g, "-");
    return full + "--" + pref + "--" + tag;
  }

  // ===== Экспорт: скачиваем заполненную форму =====
  function exportForm() {
    var title = pageLabel();
    var html = formHTML(title);
    var base = fileBase();
    // HTML
    downloadBlob(html, base + ".html", "text/html;charset=utf-8");
    // WORD (HTML с расширением .doc — Word открывает как HTML-документ)
    var doc = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>" +
      "<head><meta charset=\"utf-8\"><title>" + escapeHtml(title) + "</title>" +
      "<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>" +
      "</head><body>" + html.slice(html.indexOf("<body>")) + "</body></html>";
    downloadBlob(doc, base + ".doc", "application/msword;charset=utf-8");
    if (barEl) toastMsg("Скачано: " + base + " (.html и .doc)");
  }

  function downloadBlob(text, filename, mime) {
    try {
      var blob = new Blob(["\ufeff" + text], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    } catch (e) {
      alert("Скачивание не удалось в этом браузере. Скопируй текст формы и вставь в документ Word.");
    }
  }
  function toastMsg(msg) {
    var t = document.getElementById("pdn-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "pdn-toast";
      t.setAttribute("style", "position:fixed;bottom:64px;left:50%;transform:translateX(-50%);background:#167A4D;color:#fff;padding:8px 16px;border-radius:10px;font-weight:700;z-index:2147483999;");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = "none"; }, 5000);
    t.style.display = "block";
  }

  // ===== Выбор личной папки ученика (File System Access API) =====
  // Включается, если страница открыта в Chromium с доступом к API и это index-подобный контекст.
  function setupDirPicker() {
    if (typeof window.showDirectoryPicker !== "function") return; // не поддерживается
    var bar = barEl();
    var dirBtn = btn("📁 Моя папка", "#B45309");
    dirBtn.title = "Выбрать личную папку ученика — заполненные формы будут сохраняться туда";
    var note = document.createElement("span");
    note.textContent = "";
    dirBtn.addEventListener("click", function () {
      window.showDirectoryPicker({ mode: "readwrite" }).then(function (handle) {
        sessionStorage.setItem("pdn-dir-handle", "1");
        note.textContent = " ✓ Папка выбрана";
      }).catch(function () { /* отменено */ });
    });
    bar.appendChild(dirBtn);
    bar.appendChild(note);
  }

  function boot() {
    fillProfile();
    buildBar();
    if (isAnketa()) setupDirPicker();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();