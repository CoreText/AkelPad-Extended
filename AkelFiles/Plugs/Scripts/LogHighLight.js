// AZJIO, 20.09.2019
// Description(1033): Highlight the text in the console (Log plugin)
// Description(1049): Подсветить текст в консоли (Log плагин)
//
// Usage:
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="Привет" -bNotRegExp=1'); // элементарный вызов
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="' + sWhatText + '" -bNotRegExp=1'); // sWhatText - переменная с текстом
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="' + sWhatText + '" -bNotRegExp=' + (SendDlgItemMessage(hDlg, IDC_SEARCH_REGEXP, 240 /*BM_GETCHECK*/, 0, 0)?0:1)); // здесь пример захвата чекбокса рег.выр. в скрипте FindReplaceEx.js

var hWndOutput = GetOutputWindow() // получить дескриптор окна консоли
if(!hWndOutput) {
   WScript.Echo("Консоль закрыта, нечего подсвечивать");
   WScript.Quit();
};

var pPath = AkelPad.GetAkelDir();
var pPathCoder = pPath + "\\AkelFiles\\Plugs\\Coder\\sss1.tmp";
if (!FileExists(pPathCoder)) {
   WScript.Echo('Нужен файл "\\AkelFiles\\Plugs\\Coder\\sss1.tmp"');
   WScript.Quit();
}

// Добавлена обработка параметров
var bNotRegExp = AkelPad.GetArgValue("bNotRegExp", 1);
var sSelText = AkelPad.GetArgValue("sSelText", AkelPad.GetSelText());
// WScript.Echo(sSelText + ' ' + bNotRegExp);

// var sSelText = AkelPad.GetSelText()
if(sSelText == "") {
   var hMainWnd = AkelPad.GetMainWnd();
   if(AkelPad.MessageBox(hMainWnd, "Нужно выделить текст!\nИспользовать регулярное выражения из буфера обмена?", WScript.ScriptName, 4+256+32) == 6) {
      sSelText = AkelPad.GetClipboardText();
      bNotRegExp=0;
   }
   else {
      WScript.Quit();
   }
}

AkelPad.SetEditWnd(hWndOutput); // устанавливает консоль окном редактирования
var sLogText = AkelPad.GetTextRange(0, -1); // получает текст консоли
var pPathCoder1 = pPath + "\\AkelFiles\\Plugs\\Coder\\ss1.coder";
var pTextCoder = AkelPad.ReadFile(pPathCoder, 0xD, 1200, true); // 1200 = 16LE
if(/[\r\n]/.test(sSelText)) { // отменяем подсветку если выделен многострочный текст, Coder это не переварит
   AkelPad.SetEditWnd(0);
   WScript.Echo("Не для многострочного текста");
   WScript.Quit();
}

if (bNotRegExp) {
   sSelText = sSelText.replace(/[\]\[\{\}\(\)\*\+\?\.\^\$\|\=\<\>\#\\]/g, escaper); // экранировать спецсимволы регулярного выражения
}
pTextCoder = pTextCoder.replace(/%#\$&@/g, sSelText); // замена шаблона в рег.выр. секции
AkelPad.WriteFile(pPathCoder1, pTextCoder, -1, 1200, true); // 1200 = 16LE
AkelPad.Call("Log::Output", 4, sLogText, -1, 0, 0, ".ss1") // вставить текст включая подсветку alias
AkelPad.SetEditWnd(0); // возвращает окно редактирования
AkelPad.Call("Coder::Settings", 2); // перерисовать  подсветку

function escaper(str) {
   return '\\' + str;
}

function GetOutputWindow() {
   var lpWnd;
   var hWnd = 0;

   if(lpWnd = AkelPad.MemAlloc(_X64 ? 8 : 4 /*sizeof(HWND)*/ )) {
      AkelPad.Call("Log::Output", 2, lpWnd);
      hWnd = AkelPad.MemRead(lpWnd, 2 /*DT_QWORD*/ );
      AkelPad.MemFree(lpWnd);
   }
   return hWnd;
}

// если объект разово используется, то можно внутри функции его создать
function FileExists(pPathCoder) {
   var fso = new ActiveXObject("Scripting.FileSystemObject");
   return (fso.FileExists(pPathCoder)?1:0);
}
