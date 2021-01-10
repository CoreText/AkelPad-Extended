// http://akelpad.sourceforge.net/forum/viewtopic.php?p=30143#30143
// Version: 1.1 (2015-12-23)
// Author: Andrey Tzar aka beotiger
//
//
// Description(1033): Mark/unmark current word/line/selected phrase using Coder::HighLight plugin, case sensitive. Every time marker color changes.
// Description(1049): Помечает/снимает пометку с текущего слова/строки/выделенной фразы используя плагин Coder::HighLight. Учитывает регистр. Цвет маркера каждый раз новый.

/*
    Inspired by SuperMultiMarker.vbs script by Andrey Averin
   Thanks to Andrey, Instructor, VladSh, Infocatcher, KDJ and other contributors to AkelPad

   Arguments
    Use -clear=1 to remove all highlightings and clear file with data
      Example: Call("Scripts::Main", 1, "MarkIt.js", `-clear=1`)

    -tabs=nFlag - highlight in other tabs.
          nFlag: 1 - process next tab, 2 - previous tab, 3 - next and previous tabs and 4 - all tabs
       Note: current tab always highlights

       Example: remove highlightings in all tabs:
          Call("Scripts::Main", 1, "MarkIt.js", `-clear=1 -tabs=4`)
      Highlight next tab also: Call("Scripts::Main", 1, "MarkIt.js", `-tabs=1`)

   Other notes:
      Uses datafile MarkIt.ini in scripts folder. See code below.
      Possible hot keys: `Ins` for MarkIt.js script, and `Ctrl+Shift+Ins` for clear command (use in Hotkeys, ToolBar or ContextMenu plugins for example)

   RU: Написано под вдохновением от скрипта SuperMultiMarker.vbs Аверина Андрея
   Мои благодарности Андрею, Instructor, VladSh, Infocatcher, KDJ и всем поддерживающим проект AkelPad

   Аргументы
    -clear=1 убрать все подсветки и сбросить файл данных
      Пример вызова: Call("Scripts::Main", 1, "MarkIt.js", `-clear=1`)

    -tabs=nFlag - подсветить в других вкладках
          nFlag: 1 - в следующей, 2 - в предыдущей, 3 - в следующей и в предыдущей и
                 4 - во всех вкладках
       Замечание: текущая вкладка всегда подсвечивается
       Пример: убрать подсветку во всех вкладках:
          Call("Scripts::Main", 1, "MarkIt.js", `-clear=1 -tabs=4`)
      Подсветить также и следующую вкладку: Call("Scripts::Main", 1, "MarkIt.js", `-tabs=1`)

    -text=custom text to mark
          Call("Scripts::Main", 1, "MarkIt.js", `-text=some`)

   Другие замечания:
      Используется файл MarkIt.ini в каталоге скриптов. Подробности смотрите в коде ниже.
      Возможные горячие клавиши: `Ins` для самого MarkIt.js и `Ctrl+Shift+Ins` для команды очистки, которую можно использовать к примеру в плагинах Hotkeys, ToolBar или ContextMenu.
*/

// colors and backgrounds from SuperMultiMarker.vbs script by Averin Andrey
// цвета и фоны взяты из скрипта SuperMultiMarker.vbs Аверина Андрея
var colors = [
	"#000000", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#000000",
	"#FFFF00", "#94FEFE", "#FFEFD5", "#FF00FF", "#9932CC", "#FF00FF",
	"#FFD700", "#C0C0C0", "#66CCCC", "#6600FF", "#CCFFCC", "#00FFFF",
	"#B8860B", "#008B8B", "#000000", "#000000", "#FFFFFF", "#000000",
	"#000000", "#000000", "#FFFFFF", "#F0F8FF", "#FFC1C1", "#FFC1C1",
	"#B0E2FF", "#002100", "#CDCD00", "#CFFF7C"
];

var backgrounds = [
	"#9BFF9B", "#FFA000", "#00A000", "#A0A0FF", "#FF0000", "#FFFF00",
	"#000000", "#000000", "#FF00FF", "#8B008B", "#ADFF2F", "#00FA9A",
	"#00BFFF", "#2F4F4F", "#9900CC", "#99FFCC", "#3366FF", "#8B008B",
	"#F5DEB3", "#E0FFFF", "#9BFFFF", "#FFCD9B", "#FF0000", "#BE7DFF",
	"#88E188", "#C6C6C6", "#000000", "#B0171F", "#006400", "#A54700",
	"#4B0082", "#CDFF00", "#000000", "#7F6A00"
];

// plugin name and window descriptors - имя плагина подсветки
var CH = "Coder::HighLight",
  hMainWnd = AkelPad.GetMainWnd(),
  hWndEdit = AkelPad.GetEditWnd(),
  // datafile name - имя файла с данными
  myIni = WScript.ScriptFullName.replace(/\.js$/i, '.ini');

// check Coder::HighLight status and turn it on
// проверка работы плагина Coder::HighLight и включение его, если не работает
if (! AkelPad.IsPluginRunning(CH))
  if (AkelPad.Call(CH) != 1 /*UD_NONUNLOAD_ACTIVE*/ )
  {
    AkelPad.MessageBox(hMainWnd, 'Could not activate `' + CH + '`.\nPlease install Coder plugin', WScript.ScriptName, 0x40 /*MB_ICONINFORMATION*/ );
    WScript.Quit();
  }

/*Check arguments - Проверим аргументы*/

// if we should process other tabs - надо ли обрабатывать соседние вкладки
var tabs = AkelPad.GetArgValue("tabs", 0);

if (AkelPad.IsMDI() == 0)
  tabs = 0;

// parameter clear: unhighlight all and reset datafile
// если задан параметр clear, снимаем выделение и чистим файл с данными
var bUnLight = AkelPad.GetArgValue("clear", false);

setRedraw(hMainWnd, false);
setRedraw(hWndEdit, false);

if (bUnLight)
{
  clearAll();
  setRedraw(hMainWnd, true);
  setRedraw(hWndEdit, true);
  WScript.Quit();
}

// for detecting word - для поиска слова
var nSelStart, nSelEnd,
  nWordBegin, nWordEnd;

// current word/phrase - текущее слово/фраза
var pWord = '';

/*
   Getting word under caret from ChmKeyword.js by Instructor
      and CaretSelect.js by VladSh

   Получение слова под курсором или сразу за ним
   взято из ChmKeyword.js by Instructor и CaretSelect.js by VladSh
*/

// get selection - получим текущий селект
nSelStart = AkelPad.GetSelStart();
nSelEnd = AkelPad.GetSelEnd();

if (nSelStart == nSelEnd)
{
  // there is no selection - нет выделения (селекта)
  nWordBegin = AkelPad.SendMessage(hWndEdit, 1100 /*EM_FINDWORDBREAK*/ , 0 /*WB_LEFT*/ , nSelStart);
  nWordEnd = AkelPad.SendMessage(hWndEdit, 1100 /*EM_FINDWORDBREAK*/ , 7 /*WB_RIGHTBREAK*/ , nWordBegin);

  // for cases when caret located on word start position
  // для случаев, когда курсор прямо перед словом
  if (nWordEnd < nSelStart)
  {
    nWordBegin = AkelPad.SendMessage(hWndEdit, 1100 /*EM_FINDWORDBREAK*/ , 0 /*WB_LEFT*/ , nSelStart + 1);
    nWordEnd = AkelPad.SendMessage(hWndEdit, 1100 /*EM_FINDWORDBREAK*/ , 7 /*WB_RIGHTBREAK*/ , nWordBegin);
  }

  // word found? - слово найдено?
  if (nWordEnd > nSelStart)
  {
    pWord = AkelPad.GetTextRange(nWordBegin, nWordEnd);
    AkelPad.SetSel(nWordBegin, nWordEnd);
  }
  else
  {
    // try to select whole line - пробуем выделить текущую строку целиком
    selectCaretLine(hWndEdit);
    nWordBegin = AkelPad.GetSelStart();
    nWordEnd = AkelPad.GetSelEnd();
  }
}
else
{
  nWordBegin = nSelStart;
  nWordEnd = nSelEnd;
}

// get selected text till \r char
// получим выбранный текст до первого встреченного перевода строки (\r)
pWord = AkelPad.GetArgValue("text", truncSel(AkelPad.GetTextRange(nWordBegin, nWordEnd)));

if (! pWord)
{
  setRedraw(hMainWnd, true);
  setRedraw(hWndEdit, true);
  WScript.Quit(); // silently
}

// if there is no datafile create new one
// если файла с данными ещё нет, создать новый
if (! IsFileExists(myIni))
  // codepage: UTF8 without BOM, new lines in Mac-way
  // кодировка: UTF8 без BOM, перевод строк Mac-way
  AkelPad.WriteFile(myIni, '[colorIndex]\r20\r[HighLight]', -1, 65001, false);

// read datafile in UTF8
// читаем файл с данными, кодировка UTF8 without BOM
var data = AkelPad.ReadFile(myIni, 0, 65001, false),
  // a file lines - все строки файла
  lines = data.split('\r'),
  // highlight index - индекс подсветки, должно быть целым
  Cindex = +lines[1] % colors.length;

var bHighlight = true, // to highlight - стоит ли подсвечивать слово
  i;

if (lines.length >= 4)
  // check for word/phrase - ищем слово/фразу
  for (i = 3; i < lines.length; i++)
    if (lines[i] === pWord)
    {
      // delete lines[i] - есть значение, удаляем
      // wipe it out with array shift - удалим текущее значение со сдвигом массива
      lines.splice(i, 1);
      bHighlight = false;
      break;
    }

if (bHighlight)
{
  // highlight and save word - подсвечиваем и сохраняем слово
  lines[lines.length] = pWord;
  AkelPad.Call(CH, 2, colors[Cindex], backgrounds[Cindex], 1, 0 /*FONTSTYLE*/ , -1 /*ID*/ , pWord /*"TEXT"*/ /*, TEXTLENGTH*/ );
  // doHighlight(1);

  // repeat for other tabs - тж для других вкладок
  if (tabs)
    processTabs(1);
  // next index - следующий цвет, цикл по длине массива цветов
  lines[1] = ++Cindex % colors.length;
}
else
{
  // unhighlight it - снимаем отметки текста
  AkelPad.Call(CH, 3, -2 /*удалить отметки выделенного текста*/ );
  // doHighlight(2);

  // repeat for other tabs - тж для других вкладок
  if (tabs)
    processTabs(2);
}

// save datafile - сохраняем файл
AkelPad.WriteFile(myIni, lines.join('\r'), -1, 65001, false);
// restore original selection
// восстанавливаем оригинальный селект
AkelPad.SetSel(nSelStart, nSelEnd);

setRedraw(hMainWnd, true);

// redrawing current window for MDI mode - thanks to KDJ for remark
// AkelPad.SystemFunction().Call("User32::InvalidateRect", hWndEdit, 0, 1);
setRedraw(hWndEdit, true);

/*  **********************************************
      Auxiliary functions / Вспомогательные функции
**********************************************  */
// cut line off till \r character
// обрежем строку до символа \r, если есть
function truncSel(text)
{
  if (text.indexOf('\r') != -1)
  {
    text = text.substring(0, text.indexOf('\r'));
    AkelPad.SetSel(nWordBegin, nWordBegin + text.length);
  }
  return text;
}

function IsFileExists(pFile)
{
  return (AkelPad.SystemFunction().Call("Kernel32::GetFileAttributes" + _TCHAR, pFile) != -1);
}

// unhighlight all and reset datafile
// снимем все пометки HighLight'ера и очистим файл с данными
function clearAll()
{
  AkelPad.Call(CH, 3);
  //doHighlight(3);

  // if we should process other tabs
  // если надо обработать ещё и вкладки
  if (tabs)
    processTabs(3);

  AkelPad.WriteFile(myIni, '[colorIndex]\r20\r[HighLight]', -1, 65001, false);
}

// process other tabs with flag op: 1 - highlight, 2 - unhighlight, 3 - unhighlight all
// обработать соседние вкладки флагом tabs (global)
// операцией op: 1 - подсветка, 2 - снятие подсветки, 3 - снятие всех подсветок
function processTabs(op)
{
  // new and current frame - новое и текущее окно (handles)
  var curTab,
    origTab = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/ , 1 /*FWF_CURRENT*/ , 0);

  if (tabs & 4)
  {
    // all tabs - пройдёмся по всем вкладкам
    curTab = AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/ );
    while (curTab != origTab)
    {
      doHighlight(op); // обработаем новую вкладку
      curTab = AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/ );
    }
  }
  else
  {
    if (tabs & 1)
    {
      // next tab
      curTab = AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/ );
      if (curTab != origTab)
      {
        doHighlight(op); // process new tab - обработаем новую вкладку
        // and go back - и вернемся обратно
        AkelPad.Command(4317 /*IDM_WINDOW_FRAMEPREV*/ );
      }
    }
    if (tabs & 2)
    {
      // prev tab
      curTab = AkelPad.Command(4317 /*IDM_WINDOW_FRAMEPREV*/ );
      if (curTab != origTab)
      {
        doHighlight(op); // process new tab - обработаем новую вкладку
        // and go back - и вернемся обратно
        AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/ );
      }
    }
  }
}

// process current tab with flag op: 1 - highlight, 2 - unhighlight, 3 - unhighlight all
// подвсетить/снять подсветку текущего окна
// op: 1 - подсветка, 2 - снятие подсветки, 3 - снятие всех подсветок
function doHighlight(op)
{
  // store current selection and scroll - сохраняем селект и позицию скролла
  var nStart = AkelPad.GetSelStart(),
    nEnd = AkelPad.GetSelEnd(),
    lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/ ),
    hWnd = AkelPad.GetEditWnd();

  setRedraw(hWnd, false);

  if (lpPoint)
    AkelPad.SendMessage(hWnd, 1245 /*EM_GETSCROLLPOS*/ , 0, lpPoint);

  // find word/phrase and continue when found or when we should unhighlight all
  // сперва найдём вхождение (pWord) в тексте,
  // и продолжаем только если оно есть или если op = 3 (убрать всё выделение)
  if (AkelPad.TextFind(0, pWord, 0x00000001 | 0x00000004 | 0x00200000 /*FRF_DOWN|FRF_MATCHCASE|FRF_BEGINNING*/ ) >= 0 || op == 3)
    switch (op)
    {
    case 1: // highlight it!
      AkelPad.Call(CH, 2, colors[Cindex], backgrounds[Cindex], 1, 0 /*FONTSTYLE*/ , -1 /*ID*/ , pWord /*"TEXT"*/ /*, TEXTLENGTH*/ );
      break;
    case 2: // unhighlight it!
      AkelPad.Call(CH, 3, -2 /*удалить отметки выделенного текста*/ );
      break;
    case 3: // unhighlight all!
      AkelPad.Call(CH, 3);
      break;
    }

  // restore original selection - восстанавливаем оригинальный селект
  AkelPad.SetSel(nStart, nEnd);

  // and scroll position - и позицию скролла
  if (lpPoint)
  {
    AkelPad.SendMessage(hWnd, 1246 /*EM_SETSCROLLPOS*/ , 0, lpPoint);
    AkelPad.MemFree(lpPoint);
  }

  setRedraw(hWnd, true);
}

// enable/disable window redraw on changes
function setRedraw(hWnd, bRedraw)
{
  AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/ , bRedraw, 0);
  bRedraw && AkelPad.SystemFunction().Call("user32::InvalidateRect", hWnd, 0, true);
}

function selectCaretLine(hWnd)
{
  var nCaretOffset = AkelPad.SendMessage(hWnd, 3138 /*AEM_GETRICHOFFSET*/ , 5 /*AEGI_CARETCHAR*/ , 0),
    nLineStart = AkelPad.SendMessage(hWnd, 3138 /*AEM_GETRICHOFFSET*/ , 18 /*AEGI_WRAPLINEBEGIN*/ , nCaretOffset),
    nLineEnd = AkelPad.SendMessage(hWnd, 3138 /*AEM_GETRICHOFFSET*/ , 19 /*AEGI_WRAPLINEEND*/ , nCaretOffset);

  AkelPad.SetSel(nLineStart, nLineEnd);
}
