const os = require("os");
const path = require("path");
const CFG = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
const SKILL = path.join(CFG, "gigatool", "skills", "xlsx");
const ExcelJS = require(path.join(SKILL, "vendor", "exceljs.bundle.cjs"));
const H = require(path.join(SKILL, "helpers", "index.cjs"));

(async () => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ТЛ";

  const calc = H.addSheet(wb, "Расчёт");
  const spr = H.addSheet(wb, "Справочники");
  const src = H.addSheet(wb, "Источники");

  const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // ---------- Лист «Справочники» ----------
  spr.getCell("A1").value = "Лаборатории (из перечня оборудования ТЛ)";
  spr.getCell("A2").value = "Код"; spr.getCell("B2").value = "Лаборатория"; spr.getCell("C2").value = "Оборудование, руб. (база)"; spr.getCell("D2").value = "Расходные материалы/год, руб."; spr.getCell("E2").value = "Нужна зона 3D-печати"; spr.getCell("F2").value = "Нужен полётный зал/манеж"; spr.getCell("G2").value = "Нужна VR-зона"; spr.getCell("H2").value = "Комментарий";
  H.headerRow(spr, "A2:H2");
  const labs = [
    ["Л1", "Инициативная робототехника", 732500, 30000, "нет", "нет", "нет", "LEGO EV3 + Arduino"],
    ["Л2", "Инициативная электроника", 404400, 25000, "нет", "нет", "нет", "Пайка, мультиметры, осциллографы"],
    ["Л3", "Blender 3D (вкл. ПК)", 1737500, 70000, "да", "нет", "нет", "ПК с GPU, FDM-принтеры, пластик"],
    ["Л4", "КОМПАС-3D", 924000, 15000, "нет", "нет", "нет", "ПК (можно совмещать с Л3)"],
    ["Л5", "Навигация (БПЛА)", 611000, 40000, "нет", "да", "нет", "Геоскан, манеж, LiPo"],
    ["Л6", "VR-разработка", 646600, 20000, "нет", "нет", "да", "Pico 4 Ultra, Unity, ПК"],
    ["Л7", "Проектная деятельность", 315250, 10000, "нет", "нет", "нет", "Панель, ноутбуки, флипчарты"],
  ];
  labs.forEach((row, i) => {
    row.forEach((v, j) => { spr.getCell(`${cols[j]}${i + 3}`).value = v; });
  });
  H.body(spr, "A3:H9");
  spr.getColumn(3).numFmt = H.FMT.rub;
  spr.getColumn(4).numFmt = H.FMT.rub;

  spr.getCell("A11").value = "Помещение и общие зоны"; H.headerRow(spr, "A11:B11");
  spr.getCell("A12").value = "Мебель и оснащение общих зон (база)"; spr.getCell("B12").value = 378750;
  spr.getCell("A13").value = "Площадь на лабораторию (кв. м, ориентир)"; spr.getCell("B13").value = 60;
  spr.getCell("A15").value = "Коэффициент региона (0,85–1,5; базовый 1,0)"; spr.getCell("B15").value = 1.0;
  spr.getCell("A16").value = "Запас на непредвиденные (по умолчанию 5%)"; spr.getCell("B16").value = 0.05;
  H.body(spr, "A12:B16");

  // ---------- Лист «Расчёт» ----------
  H.titleBand(calc, "A1:H1", "Калькулятор запуска площадки «Технологическая лаборатория»", "Синие ячейки — редактируемые входные. Остальные — формулы. Отмечайте лаборатории столбцом «Участвует» (1/0).");
  calc.getCell("A3").value = "Сценарий (для справки)"; H.headerRow(calc, "A3:B3");
  calc.getCell("A4").value = "ТЛ-лайт (3–4 лаборатории)";
  calc.getCell("A5").value = "ТЛ-стандарт (7 лабораторий)";
  calc.getCell("A6").value = "ТЛ-флагман (7 + выставка + вуз)";
  H.body(calc, "A4:B6");
  H.widths(calc, [["A", 52], ["B", 26], ["C", 18], ["E", 42], ["F", 18], ["G", 20], ["H", 26]]);

  // Таблица выбора лабораторий
  calc.getCell("E3").value = "Выбор лабораторий (1 = участвует)"; H.headerRow(calc, "E3:H3");
  calc.getCell("E4").value = "Лаборатория"; calc.getCell("F4").value = "Участвует"; calc.getCell("G4").value = "Оборудование, руб."; calc.getCell("H4").value = "Расходные материалы/год, руб.";
  H.headerRow(calc, "E4:H4");
  labs.forEach((row, i) => {
    calc.getCell(`E${5 + i}`).value = row[1];
    calc.getCell(`F${5 + i}`).value = 1;
    calc.getCell(`G${5 + i}`).value = row[2];
    calc.getCell(`H${5 + i}`).value = row[3];
  });
  H.body(calc, "E5:H11");
  calc.getColumn(6).numFmt = "0";
  calc.getColumn(7).numFmt = H.FMT.rub;
  calc.getColumn(8).numFmt = H.FMT.rub;
  calc.addTable({
    name: "ТаблЛаб", ref: "E4:H11", headerRow: true,
    columns: [
      { name: "Лаборатория", filterButton: false },
      { name: "Участвует", filterButton: false },
      { name: "Оборудование, руб. (база)", filterButton: false },
      { name: "Расходные материалы/год, руб.", filterButton: false },
    ],
    rows: labs.map((r) => [r[1], 1, r[2], r[3]]),
    style: { theme: "TableStyleMedium2", showRowStripes: true },
  });

  // Расчётные блоки
  calc.getCell("A13").value = "Параметры площадки"; H.headerRow(calc, "A13:B13");
  calc.getCell("A14").value = "Выбрано лабораторий"; calc.getCell("B14").value = "=COUNT(ТаблЛаб[Участвует])";
  calc.getCell("A15").value = "Оборудование лабораторий (база)"; calc.getCell("B15").value = "=SUMPRODUCT(ТаблЛаб[Участвует],ТаблЛаб[Оборудование, руб. (база)])";
  calc.getCell("A16").value = "Расходные материалы (год)"; calc.getCell("B16").value = "=SUMPRODUCT(ТаблЛаб[Участвует],ТаблЛаб[Расходные материалы/год, руб.])";
  calc.getCell("A17").value = "Мебель и оснащение общих зон (пропорц.)"; calc.getCell("B17").value = "=Справочники!B12 * B14/7";
  calc.getCell("A18").value = "Помещение, кв. м (ориентир)"; calc.getCell("B18").value = "=B14 * Справочники!B13";
  calc.getCell("A19").value = "Коэффициент региона"; calc.getCell("B19").value = "=Справочники!B15";
  calc.getCell("A20").value = "Непредвиденные расходы (доля)"; calc.getCell("B20").value = "=Справочники!B16";
  calc.getCell("A21").value = "Непредвиденные, руб."; calc.getCell("B21").value = "=ROUND((B15+B16+B17)*B20,0)";
  calc.getCell("A22").value = "ИТОГО на запуск (без ФОТ), руб."; calc.getCell("B22").value = "=B15+B16+B17+B21";
  H.body(calc, "A14:B22");

  calc.getCell("A24").value = "Штат (расчёт по выбранным лабораториям)"; H.headerRow(calc, "A24:C24");
  calc.getCell("A25").value = "Педагог ДО (1 ставка на 1–2 лаборатории)"; calc.getCell("B25").value = "=ROUNDUP(B14/2,0)"; calc.getCell("C25").value = 38000;
  calc.getCell("A26").value = "Инженер-лаборант (1 на 4+, иначе 0,5)"; calc.getCell("B26").value = "=IF(B14>=4,1,IF(B14>=1,0.5,0))"; calc.getCell("C26").value = 32000;
  calc.getCell("A27").value = "Методист (0,5 при 7 лабораториях)"; calc.getCell("B27").value = "=IF(B14>=7,0.5,0)"; calc.getCell("C27").value = 36000;
  calc.getCell("A28").value = "ФОТ/мес (оклад × ставка), руб."; calc.getCell("B28").value = "=B25*C25+B26*C26+B27*C27";
  calc.getCell("A29").value = "ФОТ/год (10 мес.), руб."; calc.getCell("B29").value = "=B28*10";
  H.body(calc, "A25:B29");
  calc.getColumn(3).numFmt = H.FMT.rub;
  for (let r = 15; r <= 22; r++) calc.getCell(`B${r}`).numFmt = H.FMT.rub;
  calc.getCell("B14").numFmt = "0";
  calc.getCell("B18").numFmt = "#,##0";
  calc.getCell("B19").numFmt = "0.00";
  calc.getCell("B20").numFmt = "0%";
  calc.getCell("B28").numFmt = H.FMT.rub;
  calc.getCell("B29").numFmt = H.FMT.rub;

  // ---------- Лист «Источники» ----------
  H.titleBand(src, "A1:D1", "Источники для калькулятора", "Цены — ориентировочные, по данным перечня оборудования ТЛ (2026).");
  src.getCell("A2").value = "Показатель"; src.getCell("B2").value = "Значение"; src.getCell("C2").value = "По состоянию на"; src.getCell("D2").value = "Источник";
  H.headerRow(src, "A2:D2");
  const srcRows = [
    ["Оборудование Лаб. 1–7 (база)", "5 371 250 руб.", "2026", "Перечень оборудования ТЛ (файл 5)"],
    ["Мебель и оснащение общих зон", "378 750 руб.", "2026", "Перечень оборудования ТЛ (файл 5)"],
    ["Запись в записке губернатору (флагман)", "8 728 650 руб.", "2026", "Аналитическая записка (файл 2)"],
    ["Бюджет гранта, год 1 (стандарт)", "7 704 900 руб.", "2026", "Заявка на грант (файл 3)"],
    ["ФОТ: ставки", "38 000 / 32 000 / 36 000 руб.", "2026", "Штатное расписание (файл 4)"],
  ];
  srcRows.forEach((r, i) => { r.forEach((v, j) => src.getCell(`${cols[j]}${i + 3}`).value = v); });
  H.body(src, "A3:D7");
  H.widths(spr, [["A", 34], ["B", 52], ["C", 24], ["D", 26], ["E", 18], ["F", 20], ["G", 14], ["H", 30]]);
  H.widths(src, [["A", 40], ["B", 30], ["C", 16], ["D", 50]]);

  await wb.xlsx.writeFile("Калькулятор запуска ТЛ.xlsx");
  console.log("wrote Калькулятор запуска ТЛ.xlsx");
})();