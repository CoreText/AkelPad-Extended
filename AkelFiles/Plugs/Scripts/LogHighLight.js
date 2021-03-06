// AZJIO / texter
// 14.02.2021
//
// Description(1033): Highlight the text in the console (Log plugin)
// Description(1049): Подсветить текст в консоли (Log плагин)
//
// Нужно, чтобы были файлы "%a\AkelFiles\Plugs\Coder\sss1.tmp" и "%a\AkelFiles\Plugs\Coder\ss1.coder"
// sss1.tmp генерирует подсветку в ss1.coder при каждом вызове скрипта.
//
// Highlights:
// Green         - the precise match
// Red           - the exact word, but character case doesn't match
// Deep Pink     - the exact character case, but not the exact word
// Purple Indigo - is not the exact word and not the exact character case
//
// Usage:
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="Привет" -bNotRegExp=1');             // элементарный вызов
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="' + sWhatText + '" -bNotRegExp=1');  // sWhatText - переменная с текстом
//
// Пример захвата чекбокса рег.выр. в скрипте `FindReplaceEx.js`:
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", ('-sSelText="' + sWhatText + '" -bNotRegExp=' + ((nFRF & FRF_REGEXP)?"1":"0") ));
//
// highlight test RegExp (?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')

var hWndOutput = GetOutputWindow(); // получить дескриптор окна консоли
var hMainWnd;
var oError;

if (! hWndOutput)
{
  WScript.Echo("Консоль закрыта, нечего подсвечивать");
  WScript.Quit();
}

var pPath = AkelPad.GetAkelDir();
var pPathCoder = pPath + "\\AkelFiles\\Plugs\\Coder\\sss1.tmp";
if (! FileExists(pPathCoder))
{
  WScript.Echo('Нужен файл "\\AkelFiles\\Plugs\\Coder\\sss1.tmp"');
  WScript.Quit();
}

// Arguments
var bNotRegExp = AkelPad.GetArgValue("bNotRegExp", 1);
var sText = AkelPad.GetArgValue("sText", "");
var sSelText = "";
sSelText = (! sText)? AkelPad.GetSelText() : decodeURIComponent(sText.replace(/^["]/, "").replace(/["]$/, ""));

if (sSelText === "")
{
  hMainWnd = AkelPad.GetMainWnd();
  if (AkelPad.MessageBox(hMainWnd, "Нужно выделить текст!\nИспользовать регулярное выражения из буфера обмена?", WScript.ScriptName, (4 + 256 + 32)) === 6)
  {
    sSelText = AkelPad.GetClipboardText();
    bNotRegExp = 0;
  }
  else
    WScript.Quit();
}

try
{
	var sSelTextEscaped = sSelText
	 .replace(/[\\\/.,^\!@#\№$%&*+\-\_\=?|()\[\]{}\<\>\;\:]/g, "\\$&")
	 .replace(/\`/g, '\\W')                                           // escape ` in ss1.coder regexp string
	;

	AkelPad.SetEditWnd(hWndOutput);                                   // устанавливает консоль окном редактирования
	var sLogText = AkelPad.GetTextRange(0, -1);                       // получает текст консоли
	var pPathCoder1 = pPath + "\\AkelFiles\\Plugs\\Coder\\ss1.coder";
	var pTextCoder = AkelPad.ReadFile(pPathCoder, 0xD, 1200, true);   // 1200 = 16LE

	if (/[\r\n]/.test(sSelTextEscaped))                               // отменяем подсветку если выделен многострочный текст, Coder это не переварит
	{
	  AkelPad.SetEditWnd(0);
	  WScript.Echo("Не для многострочного текста");
	  WScript.Quit();
	}

  //AkelPad.MessageBox(0, "\n\nbNotRegExp:\n"+ bNotRegExp +"\n\nText:\n"+ sSelText +"\n\nText Escaped:\n"+ sSelTextEscaped, WScript.ScriptName, 0);
	sSelText = (bNotRegExp)? sSelTextEscaped : sSelText.replace(/\`/g, '\\W');

	if (validateRegex(sSelText))
	{
  	pTextCoder = pTextCoder.replace(/%#\$&@/g, sSelText);           // замена шаблона в рег.выр. секции
  	AkelPad.WriteFile(pPathCoder1, pTextCoder, -1, 1200, true);     // 1200 = 16LE
	}
}
catch (oError)
{
  AkelPad.MessageBox(0,
    'LogHighLight.js Error:\n'+ oError.name +"\n"+ oError.description  +"\n\n"+ sSelText +"\n\nPath to coder file:\n"+ pPathCoder1 +"\n\npTextCoder:\n"+ pTextCoder
    , WScript.ScriptName, 16 /*MB_ICONERROR*/);
  WScript.Quit();
}

AkelPad.Call("Log::Output", 4, sLogText, -1, 0, 0, ".ss1")          // вставить текст включая подсветку alias
AkelPad.SetEditWnd(0);                                              // возвращает окно редактирования
AkelPad.Call("Coder::Settings", 2);                                 // перерисовать  подсветку

//////////////////////////////////////////////////////////////////////

function GetOutputWindow()
{
  var lpWnd;
  var hWnd = 0;
  if (lpWnd = AkelPad.MemAlloc(_X64? 8 : 4 /*sizeof(HWND)*/))
  {
    AkelPad.Call("Log::Output", 2, lpWnd);
    hWnd = AkelPad.MemRead(lpWnd, 2 /*DT_QWORD*/);
    AkelPad.MemFree(lpWnd);
  }
  return hWnd;
}

// если объект разово используется, то можно внутри функции его создать
function FileExists(pPathCoder)
{
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  return (fso.FileExists(pPathCoder)? 1 : 0);
}

/**
 * Check RegEx if is valid before proceeding further.
 * @param string -pattern to test
 * @return bool -true if success
 */
function validateRegex(sPattern)
{
  try
  {
    new RegExp("`"+ sPattern +"`");
    return true;
  }
  catch (oError)
  {
    return false;
  }
}
