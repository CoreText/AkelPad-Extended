// http://akelpad.sourceforge.net/en/plugins.php#Scripts
// Version: 4.0
// Author: Shengalts Aleksander aka Instructor / texter
//
////////////////////////////////////////////////////////////////////////////
// Description(1033): Search and replace using regular expressions.
//
// Arguments:
// -ShowCountOfChanges=false  -Show count of changes (default is true).
// -SearchStrings=10          -Maximum count of search strings (default is 10).
// -DefButtonID=1016          -Default button ID. See IDC_* defines below (default is 1016).
// -Template="Name"           -Template used on dialog open (default is "").
//
// -bDialogHiddenActions=0    -Run script without the dialog (0 by deafault - shows, 1 - hide dialog)
// -sDirection="DOWN"         -BEGIN, SELECTED, DOWN, UP, TABS
// -LogArgs=18                -See Log::Output FLAGS in the AkelPad docs. Recomended to use 18, 26
//                             8388608 log results in new tab.
// -Highlight=0               -Highlight the searched word (Ctrl+M) and Log output using LogHighlight.js
// -sLogThemeExt=".ss1"       -coder extension theme that generates LogHighlight.js
//
// -Find=""                   -string argument of what to find
// -Replace=""                -replace with
// -MatchCase=0
// -Word=0
// -RegExp=0
// -RegExpMulti=0
// -EscSequences=0
// -Sensitive=0
// -ReplaceFunction=0
//
// Usage:
// Call("Scripts::Main", 1, "SearchReplace_extended.js", `-DefButtonID=1019 /*IDC_REPLACEALL_BUTTON*/`)
//
// Example for "Replace with function" option:
//   What: \d+
//   With: parseInt($0) + 1;
// Or
//   What: \d+
//   With: var n = parseInt($0); return n >= 20 ? 20 : ++n;
//
//
// Description(1049): Поиск/замена с использованием регулярных выражений.
//
// Аргументы:
// -ShowCountOfChanges=false  -Выдавать количество замен (по умолчанию true).
// -SearchStrings=10          -Максимальное число строк поиска (по умолчанию 10).
// -DefButtonID=1016          -Идентификатор кнопки по умолчанию. См. описание IDC_* ниже (по умолчанию 1016).
// -Template="Имя"            -Шаблон, использующийся при открытии диалога (по умолчанию "").
//
// -bDialogHiddenActions=0    -Вызов скрипта без диалога (0 - по умолчанию показывает, 1 - без диалога)
// -sDirection="DOWN"         -BEGIN, SELECTED, DOWN, UP, TABS
// -LogArgs=18                -См в документации Log::Output FLAGS. Предпочтительно использовать 18, 26 Append
//                             8388608 результаты в новой вкладке.
// -Highlight=0               -Подсвечивать искомые слова (Ctrl+M) а так же подсвечивать в результатах Log::Output.
//                             Используется LogHighlight.js, который генерирует coder синтаксис "ss1.coder"
// -sLogThemeExt=".ss1"       -Расширение coder синтаксис от LogHighlight.js
//
// -Find=""                   -Аргумент того, что нужно искать
// -Replace=""                -Чем заменять
// -MatchCase=0
// -Word=0
// -RegExp=0
// -RegExpMulti=0
// -EscSequences=0
// -Sensitive=0
// -ReplaceFunction=0
//
// Применение:
// Call("Scripts::Main", 1, "SearchReplace_extended.js", `-DefButtonID=1019 /*IDC_REPLACEALL_BUTTON*/`)
//
// Пример опции "Заменять на функцию":
//   Что: \d+
//   Чем: parseInt($0) + 1;
// или
//   Что: \d+
//   Чем: var n = parseInt($0); return n >= 20 ? 20 : ++n;
//
//
// HotKeys:
// F3               - Go to next occurrence, Shift+F3 - previous
// F4               - Show history list
//
// Enter,
// Ctrl+Enter       - Search down (Ctrl will use log to navigate)
//
// Ctrl+Shift+Enter,
// Shift+Enter      - Search up (Ctrl will use log to navigate)
//
// Alt+Enter        - Search in the document
// Shift+Alt+Enter  - Search in the opened documents
//
// Ctrl+Shift+A     - Find all occurrences
//
// Ctrl+R           - Replace next occurrence
// Ctrl+Shift+R     - Replace All in the document
//
// Ctrl+U           - Undo replace
// Ctrl+Shift+U     - Redo
//
// Ctrl+P           - Undo caret position
// Ctrl+Shift+P     - Redo caret position
//
// Ctrl+M           - Toggle Mark HighLight
//
// Ctrl+N           - New template name
//
// Ctrl+Shift+N     - Log results in new tab
//
// Ctrl+Tab,
// Ctrl+Shift+Tab   - Non-blocking MRT navigation when dialog is active

/**
 * Script dependencies:
 * - CommonFunctions.js
 * - LogHighlight.js
 * - TabSwitch.js
 */

var oError;
var bDialogHiddenActions=AkelPad.GetArgValue("bDialogHiddenActions", 0);

//Arguments
try
{
  var bEscSequences=AkelPad.GetArgValue("EscSequences", 0);
  var bHighlight=AkelPad.GetArgValue("Highlight", 0);
  var bMultiline=AkelPad.GetArgValue("Multiline", 0);
  var bRegExp=AkelPad.GetArgValue("RegExp", 0);
  var bReplaceFunction=AkelPad.GetArgValue("ReplaceFunction", 0);
  var bSensitive=AkelPad.GetArgValue("Sensitive", 0);
  var bShowCountOfChanges=AkelPad.GetArgValue("ShowCountOfChanges", true);
  var bWord=AkelPad.GetArgValue("Word", 0);
  var nButton=AkelPad.GetArgValue("nButton", 1);
  var nDefButtonID=AkelPad.GetArgValue("DefButtonID", 1016 /*IDC_FIND_BUTTON*/);
  //var bDialogHiddenActions=0;
  var sDirection=decodeURIComponent(AkelPad.GetArgValue("sDirection", "DOWN"));
  var nDirection=GetDirection(sDirection);

  /**
   * 2+16=18
   *   2  =Hide input line
   *   16 =No scroll to the end
   *
   * Use 26 to Append.
   * +8388608 to show the log output in new tab.
   */
  var nLogArgs=+AkelPad.GetArgValue("LogArgs", 18);
  var nSearchStrings=AkelPad.GetArgValue("SearchStrings", 10);
  var pFindIt=AkelPad.GetArgValue("Find", "");
  pFindIt = decodeURIComponent(pFindIt.replace(/^["]/, "").replace(/["]$/, ""));
  var pReplaceWith=AkelPad.GetArgValue("Replace", "");
  pReplaceWith = decodeURIComponent(pReplaceWith.replace(/^["]/, "").replace(/["]$/, ""));
  var sReplaceWithIt=pReplaceWith;
  var pTemplate=AkelPad.GetArgValue("Template", "");
  pTemplate = decodeURIComponent(pTemplate.replace(/^["]/, "").replace(/["]$/, ""));
  var sLogThemeExt=AkelPad.GetArgValue("LogThemeExt", ".ss1");

  //AkelPad.MessageBox(0, pFindIt +"\n\n"+ pReplaceWith +"\n\n"+ bWord +"\n\n"+ nDirection, WScript.ScriptName, 0 /*MB_OK*/);
}
catch (oError)
{
  AkelPad.MessageBox(0, "Error:\n\n"+ oError.name +"\n\n"+ oError.description +"\n\n"+ nDirection, pScriptName, 16 /*MB_ICONERROR*/);
  WScript.Quit();
}

//Buttons
var BT_FIND       =1;
var BT_FINDALL    =2;
var BT_REPLACE    =3;
var BT_REPLACEALL =4;

//Direction
var DN_DOWN      =0x00000001;
var DN_UP        =0x00000002;
var DN_BEGINNING =0x00000004;
var DN_SELECTION =0x00000008;
var DN_ALLFILES  =0x00000010;

//Control IDs
var IDC_FIND              =1001;
var IDC_REPLACE           =1002;
var IDC_TEMPLATE          =1003;
var IDC_REGEXP            =1004;
var IDC_MATCHWORD         =1005;
var IDC_MATCHCASE         =1006;
var IDC_MULTILINE         =1007;
var IDC_ESCAPESEQ         =1008;
var IDC_FUNCTION          =1009;
var IDC_GROUP1            =1010;
var IDC_FORWARD           =1011;
var IDC_BACKWARD          =1012;
var IDC_BEGINNING         =1013;
var IDC_INSEL             =1014;
var IDC_ALLFILES          =1015;
var IDC_GROUP2            =1016;
var IDC_FIND_BUTTON       =1017;
var IDC_FINDALL_BUTTON    =1018;
var IDC_REPLACE_BUTTON    =1019;
var IDC_REPLACEALL_BUTTON =1020;
var IDC_CANCEL            =1021;
var IDC_STATIC            =-1;

//String IDs
var STRID_LOWJSCRIPT   =0;
var STRID_WHAT         =1;
var STRID_WITH         =2;
var STRID_ADD          =3;
var STRID_RENAME       =4;
var STRID_DELETE       =5;
var STRID_NAME         =6;
var STRID_MATCHWORD    =7;
var STRID_MATCHCASE    =8;
var STRID_REGEXP       =9;
var STRID_MULTILINE    =10;
var STRID_ESCAPESEQ    =11;
var STRID_FUNCTION     =12;
var STRID_DIRECTION    =13;
var STRID_FORWARD      =14;
var STRID_BACKWARD     =15;
var STRID_BEGINNING    =16;
var STRID_INSEL        =17;
var STRID_ALLFILES     =18;
var STRID_FINDNEXT     =19;
var STRID_FINDALL      =20;
var STRID_REPLACE      =21;
var STRID_REPLACEALL   =22;
var STRID_CANCEL       =23;
var STRID_STOP         =24;
var STRID_SYNTAXERROR  =25;
var STRID_FINISHED     =26;
var STRID_COUNTFILES   =27;
var STRID_COUNTCHANGES =28;
var STRID_TEMPLATE1    =29;
var STRID_TEMPLATE2    =30;
var STRID_TEMPLATE3    =31;

//Limits
var PUTFIND_MAXSEL  =16384;
var FINDALL_MAXLINE =200;

//Dialog messages
var AKDLG_PUTFIND   =1124;  //WM_USER + 100

//RESIZEDIALOG type
var RDS_SIZE =0x1;  //Resize control
var RDS_MOVE =0x2;  //Move control
var RDS_X    =0x4;  //X value
var RDS_Y    =0x8;  //Y value

//Variables
var hMainWnd=AkelPad.GetMainWnd();
var hWndEdit=AkelPad.GetEditWnd();
var oSys=AkelPad.SystemFunction();
var oSet=AkelPad.ScriptSettings();
var pScriptName=WScript.ScriptName;
var hInstanceDLL=AkelPad.GetInstanceDll();
var nAkelEdit=AkelPad.IsAkelEdit();
var pClassName="AkelPad::Scripts::" + pScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");
var bClearLog=false;
var bCloseDialog=false;
var bHighlighted=false;
var bLogPluginExists;
var bMessageBox=false;
var hGuiFont;
var hWndAllFiles;
var hWndBeginning;
var hWndCancel;
var hWndCase;
var hWndDialog;
var hWndDown;
var hWndEscSequences;
var hWndFindAllButton;
var hWndFindButton;
var hWndFocus;
var hWndGlobal;
var hWndGroup1;
var hWndGroup2;
var hWndMultiline;
var hWndOutput=0;
var hWndPluginEdit=0;
var hWndProgress=0;
var hWndRegExp;
var hWndReplaceAllButton;
var hWndReplaceButton;
var hWndReplaceFunction;
var hWndSelection;
var hWndTemplate;
var hWndUp;
var hWndWhat;
var hWndWhatLabel;
var hWndWith;
var hWndWithLabel;
var hWndWord;
var i;
var lpBuffer;
var lpFindStrings=[];
var lpRds=0;
var lpRdsCurrent=0;
var lpRdsm=0;
var lpRdsMinMax=0;
var lpReplaceStrings=[];
var lpSearchBuffer;
var lpTemplates=[];
var nFindItLength;
var nLogOutputTextLength = 0;
var nReplaceCount = 0;
var nReplaceWithLength;
var nSearchResult;
var nSelEnd;
var nSelStart;
var nSetTemplate=0;
var pReplaceWithEsc;
var rcControl=[];
var rcRdsCurrent=[];
var rcRdsMinMax=[];
var rds=[];
var sFindBGColor = "#A6D8B3";
var sFindFGColor = "#000000";
var sOriginalFindText = "";
var sReplaceBGColor = "#FF0080";
var sReplaceFGColor = "#000000";
var wCommand;

if (hWndEdit && !bDialogHiddenActions)
{
  if (AkelPad.WindowRegisterClass(pClassName))
  {
    if (lpBuffer=AkelPad.MemAlloc(256 * _TSIZE))
    {
      //Create dialog
      AkelPad.CreateDialog(0, pClassName, pScriptName, 0x90ce0040 /*DS_SETFONT|WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX|WS_THICKFRAME*/, 0, 0, 392, 200, hMainWnd, DialogCallback, 0x2 /*CDF_PIXELS*/, "|",
                           0, "STATIC", GetLangString(STRID_WHAT), 0x50000000 /*WS_VISIBLE|WS_CHILD*/, 6, 18, 33, 20, IDC_STATIC, "|",
                           0, "COMBOBOX", "", 0x50210042 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWN|CBS_AUTOHSCROLL*/, 41, 15, 227, 160, IDC_FIND, "|",
                           0, "STATIC", GetLangString(STRID_WITH), 0x50000000 /*WS_VISIBLE|WS_CHILD*/, 6, 41, 33, 20, IDC_STATIC, "|",
                           0, "COMBOBOX", "", 0x50210042 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWN|CBS_AUTOHSCROLL*/, 41, 37, 227, 160, IDC_REPLACE, "|",
                           0x20000 /*WS_EX_STATICEDGE*/, "BUTTON", "&>", 0x50010000 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP*/, 270, 15, 12, 43, IDC_TEMPLATE, "|",
                           0, "BUTTON", GetLangString(STRID_MATCHWORD), 0x50010003 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX*/, 16, 66,  158, 20, IDC_MATCHWORD, "|",
                           0, "BUTTON", GetLangString(STRID_MATCHCASE), 0x50010003 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX*/, 16, 86,  158, 20, IDC_MATCHCASE, "|",
                           0, "BUTTON", GetLangString(STRID_REGEXP), 0x50010003 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX*/,    16, 106,  158, 20, IDC_REGEXP, "|",
                           0, "BUTTON", GetLangString(STRID_MULTILINE), 0x50010003 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX*/, 16, 126, 158, 20, IDC_MULTILINE, "|",
                           0, "BUTTON", GetLangString(STRID_ESCAPESEQ), 0x50010003 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX*/, 16, 146, 158, 20, IDC_ESCAPESEQ, "|",
                           0, "BUTTON", GetLangString(STRID_FUNCTION), 0x50010003 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX*/,  16, 166, 158, 20, IDC_FUNCTION, "|",
                           0, "BUTTON", GetLangString(STRID_DIRECTION), 0x50000007 /*WS_VISIBLE|WS_CHILD|BS_GROUPBOX*/, 182, 67, 99, 94, IDC_GROUP1, "|",
                           0, "BUTTON", GetLangString(STRID_FORWARD), 0x50000009 /*WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON*/, 189, 83, 90, 16, IDC_FORWARD, "|",
                           0, "BUTTON", GetLangString(STRID_BACKWARD), 0x50000009 /*WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON*/, 189, 101, 90, 16, IDC_BACKWARD, "|",
                           0, "BUTTON", GetLangString(STRID_BEGINNING), 0x50000009 /*WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON*/, 189, 119, 90, 16, IDC_BEGINNING, "|",
                           0, "BUTTON", GetLangString(STRID_INSEL), 0x50000009 /*WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON*/, 189, 137, 90, 16, IDC_INSEL, "|",
                           0, "BUTTON", GetLangString(STRID_ALLFILES), 0x40000009 /*WS_CHILD|BS_AUTORADIOBUTTON*/, 189, 164, 90, 16, IDC_ALLFILES, "|",
                           0, "BUTTON", "", 0x40000007 /*WS_CHILD|BS_GROUPBOX*/, 182, 153, 99, 31, IDC_GROUP2, "|",
                           0, "BUTTON", GetLangString(STRID_FINDNEXT), 0x50010000 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP*/, 294, 10, 81, 23, IDC_FIND_BUTTON, "|",
                           0, "BUTTON", GetLangString(STRID_REPLACE), 0x50010000 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP*/, 294, 37, 81, 23, IDC_REPLACE_BUTTON, "|",
                           0, "BUTTON", GetLangString(STRID_REPLACEALL), 0x50010000 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP*/, 294, 63, 81, 23, IDC_REPLACEALL_BUTTON, "|",
                           0, "BUTTON", GetLangString(STRID_FINDALL), 0x50010000 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP*/, 294, 89, 81, 23, IDC_FINDALL_BUTTON, "|",
                           0, "BUTTON", GetLangString(STRID_CANCEL), 0x50010000 /*WS_VISIBLE|WS_CHILD|WS_TABSTOP*/, 294, 115, 81, 23, IDC_CANCEL);

      if (hWndDialog)
      {
        //Allow other scripts running
        AkelPad.ScriptNoMutex();

        //Message loop
        //AkelPad.WindowGetMessage(0x4 /*WGM_KEYDOWNUP*/);
        AkelPad.WindowGetMessage();
      }
      AkelPad.MemFree(lpBuffer);
    }
    AkelPad.WindowUnregisterClass(pClassName);
  }
  else if (hWndDialog=oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, pClassName, 0))
  {
    if (oSys.Call("user32::IsIconic", hWndDialog))
      oSys.Call("user32::ShowWindow", hWndDialog, 9 /*SW_RESTORE*/);
    AkelPad.SendMessage(hWndDialog, 7 /*WM_SETFOCUS*/, oSys.Call("user32::GetFocus"), 0);
    oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, AKDLG_PUTFIND, false, 0);
  }
}
else if (hWndEdit && bDialogHiddenActions === 1)
{
  try
  {
    nSearchResult = SearchReplace();
    if (bHighlight && nButton === 2)
      MakeHighlight((sOriginalFindText || pFindIt), (!bRegExp));
  }
  catch(oError)
  {
    AkelPad.MessageBox(0, "Error:\n\n"+ oError.name +"\n\n"+ oError.description +"\n\n"+ nSearchResult +"\n\n"+ pFindIt +"\n\n"+ pReplaceWith +"\n\n"+ bWord +"\n\n"+ nDirection, pScriptName, 16 /*MB_ICONERROR*/);
  }
}


function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  var hMenu=0;
  var nCmd=0;
  var lpCurTemplate=[0, 0, 0, 0];
  var pNewTemplateName;
  var bEnable;
  var nCurIndex=-1;
  var sResultLines="";


  if (uMsg === 0x110 /*WM_INITDIALOG*/)
  {
    hWndDialog=hWnd;

    hWndWhat=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_FIND);
    hWndWith=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_REPLACE);
    hWndTemplate=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_TEMPLATE);
    hWndWord=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_MATCHWORD);
    hWndCase=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_MATCHCASE);
    hWndRegExp=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_REGEXP);
    hWndMultiline=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_MULTILINE);
    hWndEscSequences=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_ESCAPESEQ);
    hWndReplaceFunction=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_FUNCTION);
    hWndGroup1=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_GROUP1);
    hWndDown=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_FORWARD);
    hWndUp=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_BACKWARD);
    hWndBeginning=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_BEGINNING);
    hWndSelection=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_INSEL);
    hWndAllFiles=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_ALLFILES);
    hWndGroup2=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_GROUP2);
    hWndFindButton=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_FIND_BUTTON);
    hWndReplaceButton=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_REPLACE_BUTTON);
    hWndReplaceAllButton=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_REPLACEALL_BUTTON);
    hWndFindAllButton=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_FINDALL_BUTTON);
    hWndCancel=oSys.Call("user32::GetDlgItem", hWndDialog, IDC_CANCEL);

    if (nDefButtonID)
    {
      var hWndDef=oSys.Call("user32::GetDlgItem", hWndDialog, nDefButtonID);
      var dwStyle=oSys.Call("user32::GetWindowLong" + _TCHAR, hWndDef, -16 /*GWL_STYLE*/);

      AkelPad.SendMessage(hWndDialog, 1025 /*DM_SETDEFID*/, nDefButtonID, 0);
      AkelPad.SendMessage(hWndDef, 0xF4 /*BM_SETSTYLE*/, dwStyle|0x1 /*BS_DEFPUSHBUTTON*/, true);
    }

    lpTemplates=[[GetLangString(STRID_TEMPLATE1), "^[ \\t]*$\\n*", "", "rm"],
                 [GetLangString(STRID_TEMPLATE2), "(^[ \\t]+)|([ \\t]+$)", "", "rm"],
                 [GetLangString(STRID_TEMPLATE3), "[^\\n]", " ", "r"]];

    if (oSet.Begin("", 0x1 /*POB_READ*/) && !bDialogHiddenActions)
    {
      //Read settings
      bHighlight=oSet.Read("Highlight", 1 /*PO_DWORD*/);
      bWord=oSet.Read("Word", 1 /*PO_DWORD*/);
      bSensitive=oSet.Read("Sensitive", 1 /*PO_DWORD*/);
      bRegExp=oSet.Read("RegExp", 1 /*PO_DWORD*/);
      bMultiline=oSet.Read("Multiline", 1 /*PO_DWORD*/);
      bEscSequences=oSet.Read("EscSequences", 1 /*PO_DWORD*/);
      bReplaceFunction=oSet.Read("ReplaceFunction", 1 /*PO_DWORD*/);
      nDirection=oSet.Read("Direction", 1 /*PO_DWORD*/);
      rcRdsCurrent.right=oSet.Read("DialogWidth", 1 /*PO_DWORD*/);
      rcRdsCurrent.bottom=oSet.Read("DialogHeight", 1 /*PO_DWORD*/);

      //Find
      for (i=0; i < nSearchStrings; ++i)
      {
        lpFindStrings[i]=oSet.Read("Find" + i, 3 /*PO_STRING*/);
        if (typeof lpFindStrings[i] === "undefined")
          break;
      }
      if (typeof lpFindStrings[0] !== "undefined")
        pFindIt=lpFindStrings[0];

      //Replace
      for (i=0; i < nSearchStrings; ++i)
      {
        lpReplaceStrings[i]=oSet.Read("Replace" + i, 3 /*PO_STRING*/);
        if (typeof lpReplaceStrings[i] === "undefined")
          break;
      }
      if (typeof lpReplaceStrings[0] !== "undefined")
        pReplaceWith=lpReplaceStrings[0];

      //Templates
      {
        var nIndexOfWhat;
        var nIndexOfWith;
        var nLastIndexOf;
        var pTemplateCount;

        for (i=0; ; ++i)
        {
          if (pTemplateCount=oSet.Read("Template" + i, 3 /*PO_STRING*/))
          {
            nIndexOfWhat=pTemplateCount.indexOf("=what:/");
            nIndexOfWith=pTemplateCount.indexOf("/ with:/");
            nLastIndexOf=pTemplateCount.lastIndexOf("/");
            lpTemplates[i]=[0, 0, 0, 0];
            lpTemplates[i][0]=pTemplateCount.substr(0, nIndexOfWhat);
            lpTemplates[i][1]=pTemplateCount.substr(nIndexOfWhat + 7, nIndexOfWith - (nIndexOfWhat + 7));
            lpTemplates[i][2]=pTemplateCount.substr(nIndexOfWith + 8, nLastIndexOf - (nIndexOfWith + 8));
            lpTemplates[i][3]=pTemplateCount.substr(nLastIndexOf + 1);
          }
          else break;
        }
      }
      oSet.End();
    }

    //Fill "What" combobox
    for (i=0; i < nSearchStrings && typeof lpFindStrings[i] !== "undefined"; ++i)
    {
      AkelPad.SendMessage(hWndWhat, 0x143 /*CB_ADDSTRING*/, 0, lpFindStrings[i]);
    }
    AkelPad.SendMessage(hWnd, AKDLG_PUTFIND, true, 0);

    //Fill "With" combobox
    for (i=0; i < nSearchStrings && typeof lpReplaceStrings[i] !== "undefined"; ++i)
    {
      AkelPad.SendMessage(hWndWith, 0x143 /*CB_ADDSTRING*/, 0, lpReplaceStrings[i]);
    }
    AkelPad.SendMessage(hWndWith, 0x14E /*CB_SETCURSEL*/, 0, 0);

    if (AkelPad.IsMDI())
    {
      oSys.Call("user32::ShowWindow", hWndAllFiles, 5 /*SW_SHOW*/);
      oSys.Call("user32::ShowWindow", hWndGroup2, 5 /*SW_SHOW*/);
    }

    //Check that Log.dll exists
    bLogPluginExists=IsFileExist(AkelPad.GetAkelDir(4 /*ADTYPE_PLUGS*/) + "\\Log.dll");

    //Checks
    if (ScriptEngineMajorVersion() <= 5 && ScriptEngineMinorVersion() < 5)
    {
      bMultiline=false;
      oSys.Call("user32::EnableWindow", hWndMultiline, false);
      bReplaceFunction=false;
      oSys.Call("user32::EnableWindow", hWndReplaceFunction, false);
    }
    if (bRegExp) AkelPad.SendMessage(hWndRegExp, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    if (bWord) AkelPad.SendMessage(hWndWord, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    if (bSensitive) AkelPad.SendMessage(hWndCase, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    if (bMultiline) AkelPad.SendMessage(hWndMultiline, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    if (bEscSequences) AkelPad.SendMessage(hWndEscSequences, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    if (bReplaceFunction) AkelPad.SendMessage(hWndReplaceFunction, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);

    oSys.Call("user32::EnableWindow", hWndMultiline, bRegExp);
    oSys.Call("user32::EnableWindow", hWndReplaceFunction, bRegExp);
    oSys.Call("user32::EnableWindow", hWndEscSequences, !bRegExp || !bReplaceFunction);

    if (nDirection === DN_ALLFILES)
    {
      if (AkelPad.IsMDI())
        AkelPad.SendMessage(hWndAllFiles, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
      else
        nDirection=DN_DOWN;
    }
    else if (nDirection === DN_BEGINNING)
      AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    else if (nDirection === DN_SELECTION)
      AkelPad.SendMessage(hWndSelection, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);

    if (nDirection === DN_DOWN)
      AkelPad.SendMessage(hWndDown, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
    else if (nDirection === DN_UP)
      AkelPad.SendMessage(hWndUp, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);

    //Min/max dialog sizes: left, top - minimum; right, bottom - maximum. Each member is valid if not equal to zero.
    GetWindowSize(hWnd, 0, rcControl);
    rcRdsMinMax.left=rcControl.right;
    rcRdsMinMax.top=rcControl.bottom;
    rcRdsMinMax.right=0;
    rcRdsMinMax.bottom=rcControl.bottom;

    //Set RESIZEDIALOG
    rds=[[hWndWhat,             RDS_SIZE|RDS_X],
         [hWndWith,             RDS_SIZE|RDS_X],
         [hWndTemplate,         RDS_MOVE|RDS_X],
         [hWndGroup1,           RDS_MOVE|RDS_X],
         [hWndGroup2,           RDS_MOVE|RDS_X],
         [hWndDown,             RDS_MOVE|RDS_X],
         [hWndUp,               RDS_MOVE|RDS_X],
         [hWndBeginning,        RDS_MOVE|RDS_X],
         [hWndSelection,        RDS_MOVE|RDS_X],
         [hWndAllFiles,         RDS_MOVE|RDS_X],
         [hWndFindButton,       RDS_MOVE|RDS_X],
         [hWndFindAllButton,    RDS_MOVE|RDS_X],
         [hWndReplaceButton,    RDS_MOVE|RDS_X],
         [hWndReplaceAllButton, RDS_MOVE|RDS_X],
         [hWndCancel,           RDS_MOVE|RDS_X]];

    lpRds=RdsArrayToStruct(rds);
    lpRdsm=AkelPad.MemAlloc(_X64?64:32 /*sizeof(RESIZEDIALOGMSG)*/);
    lpRdsMinMax=ArrayToRect(rcRdsMinMax, 0);
    lpRdsCurrent=ArrayToRect(rcRdsCurrent, 0);

    //Center dialog
    CenterWindow(hMainWnd, hWnd);

    //Template on start
    if (pTemplate)
    {
      for (i=0; i < lpTemplates.length; ++i)
      {
        if (pTemplate === lpTemplates[i][0])
        {
          nSetTemplate=i + 1;
          AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_TEMPLATE, 0);
          nSetTemplate=0;
          break;
        }
      }
    }

    //Update buttons
    AkelPad.SendMessage(hWnd, 273 /*WM_COMMAND*/, IDC_FIND, 0);
  }
  else if (uMsg === AKDLG_PUTFIND)
  {
    var hWndEditCur=AkelPad.GetEditWnd();
    var selTxt=AkelPad.GetSelText();

    if (hWndEditCur)
    {
      nSelStart=AkelPad.GetSelStart();
      nSelEnd=AkelPad.GetSelEnd();

      if (selTxt)
      {
        oSys.Call("user32::SetWindowText" + _TCHAR, hWndWhat, selTxt);
        AkelPad.SendMessage(hWndWhat, 0x142 /*CB_SETEDITSEL*/, 0, MAKELONG(0, -1));

        if (bHighlight)
          highlight(selTxt, sFindBGColor, sFindFGColor, -666999);
        else
          highlight(selTxt, sFindBGColor, sFindFGColor, -666999, 3);

        return true;
      }
      else if (nSelStart !== nSelEnd && nSelEnd - nSelStart < PUTFIND_MAXSEL && !(nDirection === DN_SELECTION) && !AkelPad.SendMessage(hWndEditCur, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0))
      {
        oSys.Call("user32::SetWindowText" + _TCHAR, hWndWhat, AkelPad.GetSelText());
        AkelPad.SendMessage(hWndWhat, 0x142 /*CB_SETEDITSEL*/, 0, MAKELONG(0, -1));
        return true;
      }
    }

    //Arguments
    try
    {
      bEscSequences=AkelPad.GetArgValue("EscSequences", bEscSequences);
      bHighlight=AkelPad.GetArgValue("Highlight", bHighlight);
      bMultiline=AkelPad.GetArgValue("Multiline", bMultiline);
      bRegExp=AkelPad.GetArgValue("RegExp", bRegExp);
      bReplaceFunction=AkelPad.GetArgValue("ReplaceFunction", bReplaceFunction);
      bSensitive=AkelPad.GetArgValue("Sensitive", bSensitive);
      bShowCountOfChanges=AkelPad.GetArgValue("ShowCountOfChanges", bShowCountOfChanges);
      bWord=AkelPad.GetArgValue("Word", bWord);
      nDefButtonID=AkelPad.GetArgValue("DefButtonID", nDefButtonID);
      nLogArgs=+AkelPad.GetArgValue("LogArgs", nLogArgs);
      nSearchStrings=AkelPad.GetArgValue("SearchStrings", nSearchStrings);
      pFindIt=AkelPad.GetArgValue("Find", (sOriginalFindText || pFindIt));
      pReplaceWith=AkelPad.GetArgValue("Replace", pReplaceWith);
      pTemplate=AkelPad.GetArgValue("Template", pTemplate);
      sLogThemeExt=AkelPad.GetArgValue("LogThemeExt", sLogThemeExt);

      oSys.Call("user32::SetWindowText" + _TCHAR, hWndWhat, pFindIt);
      oSys.Call("user32::SetWindowText" + _TCHAR, hWndWith, pReplaceWith);
      AkelPad.SendMessage(hWndWhat, 0x142 /*CB_SETEDITSEL*/, 0, MAKELONG(0, -1));

      return true;
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, "Error:\n\n"+ oError.name +"\n\n"+ oError.description +"\n\n"+ pFindIt +"\n\n"+ pReplaceWith +"\n\n"+ bWord +"\n\n"+ nDirection, pScriptName, 16 /*MB_ICONERROR*/);
      WScript.Quit();
      return 0;
    }

    //If called from WM_INITDIALOG
    if (wParam)
      AkelPad.SendMessage(hWndWhat, 0x14E /*CB_SETCURSEL*/, 0, 0);
    return false;
  }
  else if (uMsg === 6 /*WM_ACTIVATE*/)
  {
    if (LOWORD(wParam) !== 0 /*WA_INACTIVE*/)
    {
      hWndFocus=oSys.Call("user32::GetFocus");

      //Remember plugin edit window
      if (!bMessageBox)
      {
        if (AkelPad.IsAkelEdit(hWndFocus) === 2 /*ISAEW_PLUGIN*/)
          hWndPluginEdit=AkelPad.SetEditWnd(hWndFocus);
        else
          hWndPluginEdit=AkelPad.SetEditWnd(0);
      }
      if (hWndOutput)
        oSys.Call("user32::SetFocus", hWndCancel);
    }
  }
  else if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    if (wParam === 114 /*VK_F3*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (oSys.Call("user32::GetKeyState", 0x10 /*VK_SHIFT*/) & 0x8000)
          nDirection=DN_UP;
        else
          nDirection=DN_DOWN;

        if (oSys.Call("user32::IsWindowEnabled", hWndFindButton))
          oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FIND_BUTTON, 0);
      }
    }
    else if (wParam === 0x0D /*VK_RETURN*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        oSys.Call("user32::GetWindowText" + _TCHAR, hWndWhat, lpBuffer, 256);
        pFindIt=AkelPad.MemRead(lpBuffer, _TSTR);

        nID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));

        if (bHighlight)
          highlight((pFindIt? pFindIt: selTxt), sFindBGColor, sFindFGColor, -666999);
        else
          highlight((pFindIt? pFindIt: selTxt), sFindBGColor, sFindFGColor, -666999, 3);

        ResetInputsDirection();

        if ((!Ctrl()) && (!Shift()) && (!Alt()))
        {
          if (nID === IDC_FIND)
          {
            nDirection = DN_DOWN;
            if (oSys.Call("user32::IsWindowEnabled", hWndFindButton))
            {
              oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FIND_BUTTON, 0);
              AkelPad.SendMessage(hWndDown, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
            }
          }
        }
        else if ((!Ctrl()) && Shift() && (!Alt()))
        {
          if (nID === IDC_FIND)
          {
            nDirection = DN_UP;
            if (oSys.Call("user32::IsWindowEnabled", hWndFindButton))
            {
              oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FIND_BUTTON, 0);
              AkelPad.SendMessage(hWndUp, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
            }
          } else oSys.Call("User32::SetFocus", hWndWhat);
        }
        else if (Ctrl() && (!Shift()) && (!Alt()))
        {
          if (nID === IDC_FIND)
          {
            if (AkelPad.IsPluginRunning("Log::Output"))
            {
              AkelPad.Call("Log::Output::NextMatch");
              oSys.Call("User32::SetFocus", hWndWhat);
            }
            else
            {
              nDirection=DN_DOWN;
              if (oSys.Call("user32::IsWindowEnabled", hWndFindButton))
              {
                oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FIND_BUTTON, 0);
                AkelPad.SendMessage(hWndDown, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
              }
            }
          } else oSys.Call("User32::SetFocus", hWndWhat);
        }
        else if (Ctrl() && Shift() && (!Alt()))
        {
          if (nID === IDC_FIND)
          {
            if (AkelPad.IsPluginRunning("Log::Output"))
            {
              AkelPad.Call("Log::Output::PrevMatch");
              oSys.Call("User32::SetFocus", hWndWhat);
            }
            else
            {
              nDirection=DN_UP;
              if (oSys.Call("user32::IsWindowEnabled", hWndFindButton))
              {
                oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FIND_BUTTON, 0);
                AkelPad.SendMessage(hWndUp, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
              }
            }
          } else oSys.Call("User32::SetFocus", hWndWhat);
        }
      }
    }
    else if (wParam === 0x52 /*R key VK_KEY_R*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        oSys.Call("user32::GetWindowText" + _TCHAR, hWndWith, lpBuffer, 256);
        sReplaceWithIt=AkelPad.MemRead(lpBuffer, _TSTR);

        if (bHighlight)
          highlight(sReplaceWithIt, sReplaceBGColor, sReplaceFGColor, -6660999);
        else
          highlight(sReplaceWithIt, sReplaceBGColor, sReplaceFGColor, -6660999, 3);

        ResetInputsDirection();

        if (Ctrl() && Shift() && (!Alt()))
        {
          nDirection=DN_BEGINNING;
          if (oSys.Call("user32::IsWindowEnabled", hWndReplaceAllButton))
          {
            oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_REPLACEALL_BUTTON, 0);
            AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
          }
        }
        else if (Ctrl() && (!Shift()) && (!Alt()))
        {
          nDirection=DN_DOWN;
          if (oSys.Call("user32::IsWindowEnabled", hWndReplaceButton))
          {
            oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_REPLACE_BUTTON, 0);
            AkelPad.SendMessage(hWndDown, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
          }
        }
      }
    }
    else if (wParam === 0x41 /*A key VK_KEY_A*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (Ctrl() && Shift() && (!Alt()))
        {
          ResetInputsDirection();
          nDirection=DN_BEGINNING;
          if (oSys.Call("user32::IsWindowEnabled", hWndFindAllButton))
          {
            oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FINDALL_BUTTON, 0);
            AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
          }
        }
      }
    }
    else if (wParam === 0x50 /*P key VK_KEY_P*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (Ctrl() && (!Shift()) && (!Alt()))
          AkelPad.Command(4199);
        else if (Ctrl() && Shift() && (!Alt()))
          AkelPad.Command(4200);
      }
    }
    else if (wParam === 0x55 /*U key VK_KEY_U*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (Ctrl() && (!Shift()) && (!Alt()))
          AkelPad.Command(4151);
        else if (Ctrl() && Shift() && (!Alt()))
          AkelPad.Command(4152);
      }
    }
    else if (wParam === 0x4D /*M key VK_KEY_M*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (Ctrl() && (!Shift()) && (!Alt()))
        {
          bHighlight = ! bHighlight;
          if (bHighlight)
          {
            highlight("", sFindBGColor, sFindFGColor, -666999);
            popupShow("The Highlight is turned ON!", 1);
          }
          else
          {
            highlight("", sFindBGColor, sFindFGColor, -666999, 3);
            popupShow("The Highlight is turned OFF!", 1);
          }
        }
      }
    }
    if (wParam === 0x4E /*M key VK_KEY_N*/)
    {
      if (!hWndOutput)
      {
        if (Ctrl() && (!Shift()) && (!Alt()))
        {
          bCloseDialog=false;
          oSys.Call("user32::GetWindowText" + _TCHAR, hWndWhat, lpBuffer, 256);
          lpCurTemplate[1]=AkelPad.MemRead(lpBuffer, _TSTR);
          oSys.Call("user32::GetWindowText" + _TCHAR, hWndWith, lpBuffer, 256);
          lpCurTemplate[2]=AkelPad.MemRead(lpBuffer, _TSTR);
          lpCurTemplate[3]="";
          if (bRegExp)
            lpCurTemplate[3]+="r"
          if (bWord)
            lpCurTemplate[3]+="w"
          if (bSensitive)
            lpCurTemplate[3]+="i"
          if (bMultiline)
            lpCurTemplate[3]+="m"
          if (bEscSequences)
            lpCurTemplate[3]+="e"
          if (bReplaceFunction)
            lpCurTemplate[3]+="f"
          if (pNewTemplateName=AkelPad.InputBox(hWndDialog, GetLangString(STRID_ADD), GetLangString(STRID_NAME), lpCurTemplate[1]))
          {
            lpCurTemplate[0]=pNewTemplateName;
            lpTemplates[lpTemplates.length]=lpCurTemplate;
          }
        }
        if (Ctrl() && Shift() && (!Alt()))
        {
          bCloseDialog=false;

          if (nLogArgs < 8388608)
            nLogArgs+=8388608;

          if (oSys.Call("user32::IsWindowEnabled", hWndFindAllButton))
          {
            oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FINDALL_BUTTON, 0);
            AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
          }
        }
      }
    }
    else if (wParam === 0x09 /*TAB key VK_TAB*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (Ctrl() && (!Shift()) && (!Alt()))
        {
          AkelPad.Command(4333);
          AkelPad.Call("Scripts::Main", 2, "TabSwitch.js", '-Next=false -OnlyNames=true -FontSize=11 -LineGap=4');
          oSys.Call("user32::SetFocus", hWndWhat);
        }
        else if (Ctrl() && Shift() && (!Alt()))
        {
          AkelPad.Command(4333);
          AkelPad.Call("Scripts::Main", 2, "TabSwitch.js", '-Next=-1 -CtrlTab=false -MinTabs=1 -WindowLeft=-1 -WindowTop=-1 -OnlyNames=true -FontSize=12');
          oSys.Call("user32::SetFocus", hWndWhat);
        }
      }
    }
    else if ((wParam === 186/*VK_OEM_1*/))
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if (Ctrl() && (!Shift()) && (!Alt()))
          AkelPad.Command(4333);
      }
    }
  }
  else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
  {
    if (wParam === 0x0D /*VK_RETURN*/)
    {
      if (!hWndOutput)
      {
        bCloseDialog=false;
        if ((!Ctrl()) && (!Shift()) && Alt())
        {
          ResetInputsDirection();
          nDirection=DN_BEGINNING;
          if (oSys.Call("user32::IsWindowEnabled", hWndFindAllButton))
          {
            oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FINDALL_BUTTON, 0);
            AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
          }
        }
        if ((!Ctrl()) && Shift() && Alt())
        {
          ResetInputsDirection();
          nDirection=DN_ALLFILES;
          if (oSys.Call("user32::IsWindowEnabled", hWndFindAllButton))
          {
            oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_FINDALL_BUTTON, 0);
            AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 1 /*BST_CHECKED*/, 0);
          }
        }
      }
    }
  }
  else if (uMsg === 273 /*WM_COMMAND*/)
  {
    wCommand=LOWORD(wParam);

    if (wCommand === IDC_TEMPLATE)
    {

      if (lpTemplates.length)
      {
        if (nSetTemplate)
          nCmd=nSetTemplate;
        else
        {
          //What
          oSys.Call("user32::GetWindowText" + _TCHAR, hWndWhat, lpBuffer, 256);
          lpCurTemplate[1]=AkelPad.MemRead(lpBuffer, _TSTR);

          //With
          oSys.Call("user32::GetWindowText" + _TCHAR, hWndWith, lpBuffer, 256);
          lpCurTemplate[2]=AkelPad.MemRead(lpBuffer, _TSTR);

          //Flags
          lpCurTemplate[3]="";
          if (bRegExp)
            lpCurTemplate[3]+="r"
          if (bWord)
            lpCurTemplate[3]+="w"
          if (bSensitive)
            lpCurTemplate[3]+="i"
          if (bMultiline)
            lpCurTemplate[3]+="m"
          if (bEscSequences)
            lpCurTemplate[3]+="e"
          if (bReplaceFunction)
            lpCurTemplate[3]+="f"

          if (hMenu=oSys.Call("user32::CreatePopupMenu"))
          {
            GetWindowSize(hWndTemplate, 0, rcControl);
            for (i=0; i < lpTemplates.length; ++i)
            {
              if (lpCurTemplate[1] === lpTemplates[i][1] &&
                  lpCurTemplate[2] === lpTemplates[i][2] &&
                  lpCurTemplate[3] === lpTemplates[i][3])
              {
                nCurIndex=i;
              }
              oSys.Call("user32::AppendMenu" + _TCHAR, hMenu, nCurIndex === i?0x8 /*MF_STRING|MF_CHECKED*/:0x0 /*MF_STRING*/, i + 1, lpTemplates[i][0]);
            }
            oSys.Call("user32::AppendMenu" + _TCHAR, hMenu, 0x800 /*MF_SEPARATOR*/, 0, 0);
            if (nCurIndex >= 0)
            {
              oSys.Call("user32::AppendMenu" + _TCHAR, hMenu, 0x0 /*MF_STRING*/, ++i, GetLangString(STRID_RENAME));
              oSys.Call("user32::AppendMenu" + _TCHAR, hMenu, 0x0 /*MF_STRING*/, ++i, GetLangString(STRID_DELETE));
            }
            else oSys.Call("user32::AppendMenu" + _TCHAR, hMenu, 0x0 /*MF_STRING*/, ++i, GetLangString(STRID_ADD));

            nCmd=oSys.Call("user32::TrackPopupMenu", hMenu, 0x182 /*TPM_RETURNCMD|TPM_NONOTIFY|TPM_LEFTBUTTON|TPM_RIGHTBUTTON*/, rcControl.left, rcControl.top, 0, hWndDialog, 0);
          }
        }
        if (nCmd)
        {
          if (nCmd <= lpTemplates.length)
          {
            oSys.Call("user32::SetWindowText" + _TCHAR, hWndWhat, lpTemplates[nCmd - 1][1]);
            oSys.Call("user32::SetWindowText" + _TCHAR, hWndWith, lpTemplates[nCmd - 1][2]);

            bEnable=lpTemplates[nCmd - 1][3].indexOf("w") >= 0;
            AkelPad.SendMessage(hWndWord, 241 /*BM_SETCHECK*/, bEnable, 0);
            AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_MATCHWORD, 0);

            bEnable=lpTemplates[nCmd - 1][3].indexOf("i") >= 0;
            AkelPad.SendMessage(hWndCase, 241 /*BM_SETCHECK*/, bEnable, 0);
            AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_MATCHCASE, 0);

            bEnable=lpTemplates[nCmd - 1][3].indexOf("r") >= 0;
            AkelPad.SendMessage(hWndRegExp, 241 /*BM_SETCHECK*/, bEnable, 0);
            AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_REGEXP, 0);

            bEnable=lpTemplates[nCmd - 1][3].indexOf("m") >= 0;
            AkelPad.SendMessage(hWndMultiline, 241 /*BM_SETCHECK*/, bEnable, 0);
            AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_MULTILINE, 0);

            bEnable=lpTemplates[nCmd - 1][3].indexOf("e") >= 0;
            AkelPad.SendMessage(hWndEscSequences, 241 /*BM_SETCHECK*/, bEnable, 0);
            AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_ESCAPESEQ, 0);

            bEnable=lpTemplates[nCmd - 1][3].indexOf("f") >= 0;
            AkelPad.SendMessage(hWndReplaceFunction, 241 /*BM_SETCHECK*/, bEnable, 0);
            AkelPad.SendMessage(hWndDialog, 273 /*WM_COMMAND*/, IDC_FUNCTION, 0);
          }
          else
          {
            if (nCurIndex >= 0)
            {
              if (nCmd === lpTemplates.length + 1)
              {
                //Rename
                if (pNewTemplateName=AkelPad.InputBox(hWndDialog, GetLangString(STRID_RENAME), GetLangString(STRID_NAME), lpTemplates[nCurIndex][0]))
                {
                  lpTemplates[nCurIndex][0]=pNewTemplateName;
                }
              }
              else if (nCmd === lpTemplates.length + 2)
              {
                //Delete
                DeleteFromArray(lpTemplates, nCurIndex, 1);
              }
            }
            else
            {
              //Add
              if (pNewTemplateName=AkelPad.InputBox(hWndDialog, GetLangString(STRID_ADD), GetLangString(STRID_NAME), ""))
              {
                lpCurTemplate[0]=pNewTemplateName;
                lpTemplates[lpTemplates.length]=lpCurTemplate;
              }
            }
          }
        }
        if (hMenu)
        {
          //Remove BS_DEFPUSHBUTTON
          AkelPad.SendMessage(hWndTemplate, 0xF4 /*BM_SETSTYLE*/, 0, true);
          oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 7 /*WM_SETFOCUS*/, 0, 0);

          oSys.Call("user32::DestroyMenu", hMenu);
        }
      }
    }
    else if (wCommand === IDC_FIND)
    {
      if (HIWORD(wParam) === 1 /*CBN_SELCHANGE*/)
      {
        i=AkelPad.SendMessage(hWndWhat, 0x147 /*CB_GETCURSEL*/, 0, 0);
        nFindItLength=AkelPad.SendMessage(hWndWhat, 0x149 /*CB_GETLBTEXTLEN*/, i, 0);
      }
      else nFindItLength=oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndWhat);

      oSys.Call("user32::EnableWindow", hWndFindButton, nFindItLength);
      oSys.Call("user32::EnableWindow", hWndReplaceButton, nFindItLength);
      oSys.Call("user32::EnableWindow", hWndReplaceAllButton, nFindItLength);
      oSys.Call("user32::EnableWindow", hWndFindAllButton, bLogPluginExists && nFindItLength);
    }
    else if (wCommand === IDC_REGEXP ||
             wCommand === IDC_MATCHWORD ||
             wCommand === IDC_MATCHCASE ||
             wCommand === IDC_MULTILINE ||
             wCommand === IDC_ESCAPESEQ ||
             wCommand === IDC_FUNCTION)
    {
      if (wCommand === IDC_REGEXP)
        bRegExp=AkelPad.SendMessage(hWndRegExp, 240 /*BM_GETCHECK*/, 0, 0);
      else if (wCommand === IDC_MATCHWORD)
        bWord=AkelPad.SendMessage(hWndWord, 240 /*BM_GETCHECK*/, 0, 0);
      else if (wCommand === IDC_MATCHCASE)
        bSensitive=AkelPad.SendMessage(hWndCase, 240 /*BM_GETCHECK*/, 0, 0);
      else if (wCommand === IDC_MULTILINE)
        bMultiline=AkelPad.SendMessage(hWndMultiline, 240 /*BM_GETCHECK*/, 0, 0);
      else if (wCommand === IDC_ESCAPESEQ)
        bEscSequences=AkelPad.SendMessage(hWndEscSequences, 240 /*BM_GETCHECK*/, 0, 0);
      else if (wCommand === IDC_FUNCTION)
        bReplaceFunction=AkelPad.SendMessage(hWndReplaceFunction, 240 /*BM_GETCHECK*/, 0, 0);

      if (wCommand === IDC_REGEXP ||
          wCommand === IDC_FUNCTION)
      {
        oSys.Call("user32::EnableWindow", hWndMultiline, bRegExp);
        oSys.Call("user32::EnableWindow", hWndReplaceFunction, bRegExp);
        oSys.Call("user32::EnableWindow", hWndEscSequences, !bRegExp || !bReplaceFunction);
      }
    }
    else if (wCommand === IDC_FORWARD ||
             wCommand === IDC_BACKWARD ||
             wCommand === IDC_BEGINNING ||
             wCommand === IDC_INSEL ||
             wCommand === IDC_ALLFILES)
    {
      if (nDirection & DN_ALLFILES)
        AkelPad.SendMessage(hWndAllFiles, 243 /*BM_SETSTATE*/, false, 0);
      else if (nDirection & DN_BEGINNING)
        AkelPad.SendMessage(hWndBeginning, 243 /*BM_SETSTATE*/, false, 0);

      if (wCommand === IDC_FORWARD)
        nDirection=DN_DOWN;
      else if (wCommand === IDC_BACKWARD)
        nDirection=DN_UP;
      else if (wCommand === IDC_BEGINNING)
        nDirection=DN_BEGINNING;
      else if (wCommand === IDC_INSEL)
        nDirection=DN_SELECTION;
      else if (wCommand === IDC_ALLFILES)
        nDirection=DN_ALLFILES;
    }
    else if (wCommand === IDC_FIND_BUTTON ||
             wCommand === IDC_REPLACE_BUTTON ||
             wCommand === IDC_REPLACEALL_BUTTON ||
             wCommand === IDC_FINDALL_BUTTON)
    {
      if (wCommand === IDC_FIND_BUTTON)
        nButton=BT_FIND;
      else if (wCommand === IDC_REPLACE_BUTTON)
        nButton=BT_REPLACE;
      else if (wCommand === IDC_REPLACEALL_BUTTON)
        nButton=BT_REPLACEALL;
      else if (wCommand === IDC_FINDALL_BUTTON)
        nButton=BT_FINDALL;

      //Find
      nFindItLength=oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndWhat);

      if (lpSearchBuffer=AkelPad.MemAlloc((nFindItLength + 1) * _TSIZE))
      {
        oSys.Call("user32::GetWindowText" + _TCHAR, hWndWhat, lpSearchBuffer, nFindItLength + 1);
        pFindIt=AkelPad.MemRead(lpSearchBuffer, _TSTR);

        if (nSearchStrings)
        {
          for (i=0; i < nSearchStrings && typeof lpFindStrings[i] !== "undefined"; ++i)
          {
            if (lpFindStrings[i] === pFindIt)
            {
              AkelPad.SendMessage(hWndWhat, 0x144 /*CB_DELETESTRING*/, i, 0);
              DeleteFromArray(lpFindStrings, i, 1);
            }
          }
          InsertInArray(lpFindStrings, pFindIt, 0);
          if (lpFindStrings.length > nSearchStrings)
            DeleteFromArray(lpFindStrings, -1, 1);

          //AkelPad.MemCopy(lpSearchBuffer, pFindIt, _TSTR);
          AkelPad.SendMessage(hWndWhat, 0x14A /*CB_INSERTSTRING*/, 0, lpSearchBuffer);
          AkelPad.SendMessage(hWndWhat, 0x14E /*CB_SETCURSEL*/, 0, 0);
        }
        AkelPad.MemFree(lpSearchBuffer);
      }

      //Replace
      nReplaceWithLength=oSys.Call("user32::GetWindowTextLength" + _TCHAR, hWndWith);

      if (lpSearchBuffer=AkelPad.MemAlloc((nReplaceWithLength + 1) * _TSIZE))
      {
        oSys.Call("user32::GetWindowText" + _TCHAR, hWndWith, lpSearchBuffer, nReplaceWithLength + 1);
        pReplaceWith=AkelPad.MemRead(lpSearchBuffer, _TSTR);

        if (nSearchStrings)
        {
          for (i=0; i < nSearchStrings && typeof lpReplaceStrings[i] !== "undefined"; ++i)
          {
            if (lpReplaceStrings[i] === pReplaceWith)
            {
              AkelPad.SendMessage(hWndWith, 0x144 /*CB_DELETESTRING*/, i, 0);
              DeleteFromArray(lpReplaceStrings, i, 1);
            }
          }
          InsertInArray(lpReplaceStrings, pReplaceWith, 0);
          if (lpReplaceStrings.length > nSearchStrings)
            DeleteFromArray(lpReplaceStrings, -1, 1);

          //AkelPad.MemCopy(lpSearchBuffer, pReplaceWith, _TSTR);
          AkelPad.SendMessage(hWndWith, 0x14A /*CB_INSERTSTRING*/, 0, lpSearchBuffer);
          AkelPad.SendMessage(hWndWith, 0x14E /*CB_SETCURSEL*/, 0, 0);
        }
        AkelPad.MemFree(lpSearchBuffer);
      }

      pReplaceWithEsc=pReplaceWith;
      if (bRegExp && bReplaceFunction)
      {
        //Replace with function: Infocatcher's code.
        if (!/(^|[^\w.])return(\s+\S|\s*\()/.test(pReplaceWithEsc))
          pReplaceWithEsc="return " + pReplaceWithEsc;
          pReplaceWithEsc='var args={}, l=arguments.length;'
                        + 'for (var i=0; i < l; ++i)\n'
                        + '  args["$" + i]=arguments[i];\n'
                        + 'args.offset=arguments[l - 2];\n'
                        + 'args.s=arguments[l - 1];\n'
                        + 'with (args)\n'
                        + '{\n'
                        +    pReplaceWithEsc
                        + '\n}';
        try
        {
          pReplaceWithEsc=new Function(pReplaceWithEsc);
        }
        catch (oError)
        {
          MessageBox(hWndDialog, oError.description, pScriptName, 16 /*MB_ICONERROR*/);
          return 0;
        }
      }
      else if (bEscSequences)
      {
        if (!bRegExp)
        {
          if (!(pFindIt=TranslateEscapeString(pFindIt)))
          {
            MessageBox(hWndDialog, GetLangString(STRID_SYNTAXERROR), pScriptName, 16 /*MB_ICONERROR*/);
            oSys.Call("user32::SetFocus", hWndWhat);
            return 0;
          }
        }
        if (pReplaceWithEsc)
        {
          if (!(pReplaceWithEsc=TranslateEscapeString(pReplaceWithEsc)))
          {
            MessageBox(hWndDialog, GetLangString(STRID_SYNTAXERROR), pScriptName, 16 /*MB_ICONERROR*/);
            oSys.Call("user32::SetFocus", hWndWith);
            return 0;
          }
        }
      }

      hWndFocus=oSys.Call("user32::GetFocus");
      if (nButton === BT_REPLACEALL)
        oSys.Call("user32::EnableWindow", hWndReplaceAllButton, false);

      nSearchResult=SearchReplace();
      bClearLog=false;

      if (nButton === BT_REPLACEALL)
        oSys.Call("user32::EnableWindow", hWndReplaceAllButton, true);
      oSys.Call("user32::SetFocus", hWndFocus);

      if (nSearchResult === -1)
      {
        if (nDirection & DN_ALLFILES)
        {
          AkelPad.SendMessage(hWndAllFiles, 243 /*BM_SETSTATE*/, false, 0);
          nDirection&=~DN_DOWN;
        }
        else if (nDirection & DN_BEGINNING)
        {
          AkelPad.SendMessage(hWndBeginning, 243 /*BM_SETSTATE*/, false, 0);
          nDirection&=~DN_DOWN;
        }
      }
      else
      {
        if (nDirection === DN_ALLFILES)
        {
          AkelPad.SendMessage(hWndAllFiles, 243 /*BM_SETSTATE*/, true, 0);
          nDirection|=DN_DOWN;
        }
        else if (nDirection === DN_BEGINNING)
        {
          AkelPad.SendMessage(hWndBeginning, 243 /*BM_SETSTATE*/, true, 0);
          nDirection|=DN_DOWN;
        }
      }

      if (nLogArgs >= 8388608)  // log results in new tab (ctrl + shift + n)
      {
        nLogArgs-=8388608;
        if (LogOutputActions(nLogArgs, sLogThemeExt) && AkelPad.IsPluginRunning("Log::Output"))
        {
          AkelPad.Call("Log::Output", 6);
          oSys.Call("user32::SetFocus", hWndDialog);
        }
      }

      if (bCloseDialog)
      {
        bCloseDialog=false;
        oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 273 /*WM_COMMAND*/, IDC_CANCEL, 0);
      }
    }
    else if (wCommand === IDC_CANCEL || wCommand === 2 /*IDCANCEL*/)
    {
      oSys.Call("user32::PostMessage" + _TCHAR, hWndDialog, 16 /*WM_CLOSE*/, 0, 0);
    }
  }
  else if (uMsg === 16 /*WM_CLOSE*/)
  {
    //Stop find all operation
    if (nButton === BT_FINDALL)
    {
      if (hWndOutput)
      {
        hWndOutput=0;
        return 1;
      }
    }

    if (oSet.Begin("", 0x2 /*POB_SAVE*/) && !bDialogHiddenActions)
    {
      //Save settings
      if (nDirection != DN_DOWN) nDirection&=~DN_DOWN;
      oSet.Write("Word", 1 /*PO_DWORD*/, bWord);
      oSet.Write("Sensitive", 1 /*PO_DWORD*/, bSensitive);
      oSet.Write("RegExp", 1 /*PO_DWORD*/, bRegExp);
      oSet.Write("Multiline", 1 /*PO_DWORD*/, bMultiline);
      oSet.Write("EscSequences", 1 /*PO_DWORD*/, bEscSequences);
      oSet.Write("ReplaceFunction", 1 /*PO_DWORD*/, bReplaceFunction);
      oSet.Write("Direction", 1 /*PO_DWORD*/, nDirection);
      oSet.Write("Highlight", 1 /*PO_DWORD*/, bHighlight);
      oSet.Write("DialogWidth", 1 /*PO_DWORD*/, rcRdsCurrent.right);
      oSet.Write("DialogHeight", 1 /*PO_DWORD*/, rcRdsCurrent.bottom);

      //Save find history
      for (i=0; i < nSearchStrings && typeof lpFindStrings[i] !== "undefined"; ++i)
        oSet.Write("Find" + i, 3 /*PO_STRING*/, lpFindStrings[i]);

      //Save replace history
      for (i=0; i < nSearchStrings && typeof lpReplaceStrings[i] !== "undefined"; ++i)
        oSet.Write("Replace" + i, 3 /*PO_STRING*/, lpReplaceStrings[i]);

      //Save templates
      for (i=0; i < lpTemplates.length; ++i)
        oSet.Write("Template" + i, 3 /*PO_STRING*/, lpTemplates[i][0] + "=what:/" + lpTemplates[i][1] + "/ with:/" + lpTemplates[i][2] + "/" + lpTemplates[i][3]);
      while (oSet.Delete("Template" + i++));

      oSet.End();
    }

    //Free RESIZEDIALOG
    RdsFree(lpRds);
    AkelPad.MemFree(lpRdsMinMax);
    AkelPad.MemFree(lpRdsCurrent);
    if (lpRdsm)
    {
      AkelPad.MemFree(lpRdsm);
      lpRdsm=0;
    }

    highlight("", sFindBGColor, sFindFGColor, -666999, 3);
    highlight("", sReplaceBGColor, sReplaceFGColor, -6660999, 3);

    //Destroy dialog
    oSys.Call("user32::DestroyWindow", hWnd);
  }
  else if (uMsg === 2 /*WM_DESTROY*/)
  {
    //Exit message loop
    oSys.Call("user32::PostQuitMessage", 0);
  }

  if (lpRdsm)
  {
    //Call RESIZEDIALOG
    AkelPad.MemCopy(_PtrAdd(lpRdsm, 0) /*offsetof(RESIZEDIALOGMSG, rds)*/, lpRds, 2 /*DT_QWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?8:4) /*offsetof(RESIZEDIALOGMSG, rcMinMax)*/, lpRdsMinMax, 2 /*DT_QWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?16:8) /*offsetof(RESIZEDIALOGMSG, rcCurrent)*/, lpRdsCurrent, 2 /*DT_QWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?24:12) /*offsetof(RESIZEDIALOGMSG, dwFlags)*/, 0x6 /*RDM_PAINTSIZEGRIP|RDM_ALLCHILDREN*/, 3 /*DT_DWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?32:16) /*offsetof(RESIZEDIALOGMSG, hDlg)*/, hWnd, 2 /*DT_QWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?40:20) /*offsetof(RESIZEDIALOGMSG, uMsg)*/, uMsg, 3 /*DT_DWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?48:24) /*offsetof(RESIZEDIALOGMSG, wParam)*/, wParam, 2 /*DT_QWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRdsm, _X64?56:28) /*offsetof(RESIZEDIALOGMSG, lParam)*/, lParam, 2 /*DT_QWORD*/);
    if (AkelPad.SendMessage(hMainWnd, 1281 /*AKD_RESIZEDIALOG*/, 0, lpRdsm))
      RectToArray(lpRdsCurrent, rcRdsCurrent);
  }

  return 0;
}

function ResetInputsDirection()
{
  AkelPad.SendMessage(hWndDown, 241 /*BM_SETCHECK*/, 0 /*BST_CHECKED*/, 0);
  AkelPad.SendMessage(hWndUp, 241 /*BM_SETCHECK*/, 0 /*BST_CHECKED*/, 0);
  AkelPad.SendMessage(hWndBeginning, 241 /*BM_SETCHECK*/, 0 /*BST_CHECKED*/, 0);
  AkelPad.SendMessage(hWndSelection, 241 /*BM_SETCHECK*/, 0 /*BST_CHECKED*/, 0);
  AkelPad.SendMessage(hWndAllFiles, 241 /*BM_SETCHECK*/, 0 /*BST_CHECKED*/, 0);
}

function GetDlgCtrlID(hWnd)
{
  return oSys.Call("User32::GetDlgCtrlID", hWnd);
}

function RdsArrayToStruct(drs)
{
  var lpRds;
  var lpItem;
  var lpWnd;
  var i;

  if (lpRds=AkelPad.MemAlloc((drs.length + 1) * (_X64?16:12) /*sizeof(RESIZEDIALOG)*/))
  {
    for (i=0, lpItem=lpRds; i < drs.length; ++i)
    {
      lpWnd=AkelPad.MemAlloc(_X64?8:4);
      AkelPad.MemCopy(lpWnd, drs[i][0], 2 /*DT_QWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpItem, 0) /*offsetof(RESIZEDIALOG, lpWnd)*/, lpWnd, 2 /*DT_QWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpItem, _X64?8:4) /*offsetof(RESIZEDIALOG, dwType)*/, drs[i][1], 3 /*DT_DWORD*/);

      lpItem=_PtrAdd(lpItem, _X64?16:12) /*sizeof(RESIZEDIALOG)*/;
    }
  }
  return lpRds;
}

function RdsFree(lpRds)
{
  var lpItem;
  var lpWnd;

  if (lpRds)
  {
    for (lpItem=lpRds; lpWnd=AkelPad.MemRead(lpItem, _PtrAdd(lpItem, 0) /*offsetof(RESIZEDIALOG, lpWnd)*/); lpItem=_PtrAdd(lpItem, _X64?16:12) /*sizeof(RESIZEDIALOG)*/)
    {
      AkelPad.MemFree(lpWnd);
    }
    AkelPad.MemFree(lpRds);
  }
}

function SearchReplace()
{
  var lpFrameInit=AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
  var lpFrameCur=lpFrameInit;
  var hWndEditCur=AkelPad.GetEditWnd();
  var oPattern;
  var lpArray;
  var pSelText;
  var pResult;
  var dwOptions;
  var nInitialSelStart;
  var nInitialSelEnd;
  var nSelStart;
  var nSelEnd;
  var nMatches=-1;
  var nChanges=0;
  var nChangedFiles=0;
  var nFoundFiles=0;
  var nFoundMatches=0;
  var nError;
  var nResult=-1;
  var i;

  if (!hWndDialog)
    hWndDialog=AkelPad.GetMainWnd();

  try
  {
    sOriginalFindText = pFindIt;
    if (bWord)
      pFindIt = "(?=\\b|\\W)"+ pFindIt +"(?=\\W|\\b)";

    oPattern=new RegExp(((bRegExp || bWord)?pFindIt:EscRegExp(pFindIt)), (bSensitive?"":"i") + ((nButton===BT_FINDALL || nButton===BT_REPLACEALL || nDirection & DN_UP)?"g":"") + (bMultiline?"m":""));
  }
  catch (oError)
  {
    MessageBox(hWndDialog, oError.description, pScriptName, 16 /*MB_ICONERROR*/);
    return nResult;
  }

  if (bDialogHiddenActions)
    pReplaceWithEsc=pReplaceWith;

  for (;;)
  {
    nInitialSelStart=AkelPad.GetSelStart();
    nInitialSelEnd=AkelPad.GetSelEnd();

    //Check current selection for replace
    if (nButton === BT_REPLACE)
    {
      if (nInitialSelStart !== nInitialSelEnd)
      {
        pSelText=AkelPad.GetSelText(2 /*\n*/);
        if (!nAkelEdit)
          pSelText=pSelText.replace(/\r/g, "\n");

        //AkelPad.MessageBox(0, pSelText + "\n\nAkelEdit:\n"+ nAkelEdit +"\n\pFindIt:\n"+ pFindIt +"\n\pTest FindIt:\n"+ /\(\?[=!].*\)/.test(pFindIt), WScript.ScriptName, 0 /*MB_OK*/);
        if (/\(\?[=!].*\)/.test(pFindIt)) // Lookahead assertions: x(?=y) or x(?!y)
        {
          var pEndText=AkelPad.GetTextRange(nInitialSelStart, -1, 2 /*\n*/);
          if (!nAkelEdit)
            pEndText=pEndText.replace(/\r/g, "\n");

          if (oPattern.test(pEndText) && RegExp.lastMatch === pSelText)
          {
            pResult=pEndText.replace(oPattern, pReplaceWithEsc);
            pResult=pResult.substr(0, pResult.length - (pEndText.length - pSelText.length));
            AkelPad.ReplaceSel(pResult);

            nInitialSelStart=AkelPad.GetSelStart();
            nInitialSelEnd=AkelPad.GetSelEnd();
          }
        }
        else
        {
          if (lpArray=pSelText.match(oPattern))
          {
            //AkelPad.MessageBox(0, pSelText + "\n\nAkelEdit:\n"+ nAkelEdit +"\n\pFindIt:\n"+ pFindIt +"\n\ppSelText:\n"+ pSelText +"\n\pReplaceWithEsc:\n"+ pReplaceWithEsc, WScript.ScriptName, 0 /*MB_OK*/);
            if (lpArray.index === 0 && lpArray[0].length === (nInitialSelEnd - nInitialSelStart))
            {
              pResult=pSelText.replace(oPattern, pReplaceWithEsc);
              AkelPad.ReplaceSel(pResult);

              nInitialSelStart=AkelPad.GetSelStart();
              nInitialSelEnd=AkelPad.GetSelEnd();
            }
          }
        }
      }
      nButton=BT_FIND;
    }

    //Get ranges
    if (nDirection & DN_DOWN)
    {
      if (nButton === BT_FIND)
      {
        nSelStart=nInitialSelEnd;
        nSelEnd=-1;
      }
      else
      {
        nSelStart=nInitialSelStart;
        nSelEnd=-1;
      }
    }
    else if (nDirection & DN_UP)
    {
      if (nButton === BT_FIND)
      {
        nSelStart=0;
        nSelEnd=nInitialSelStart;
      }
      else
      {
        nSelStart=0;
        nSelEnd=nInitialSelEnd;
      }
    }
    else if (nDirection & DN_BEGINNING)
    {
      nSelStart=0;
      nSelEnd=-1;
    }
    else if (nDirection & DN_SELECTION)
    {
      nSelStart=nInitialSelStart;
      nSelEnd=nInitialSelEnd;
    }
    else if (nDirection & DN_ALLFILES)
    {
      nSelStart=0;
      nSelEnd=-1;
    }

    //Find or replace
    try
    {
      pSelText=AkelPad.GetTextRange(nSelStart, nSelEnd, 2 /*\n*/);

      if (nButton === BT_FIND)
      {
        if (lpArray=pSelText.match(oPattern))
        {
          if (nDirection & DN_UP)
          {
            for (i=0; lpArray[i]; ++i);
            AkelPad.SetSel(nSelStart + (lpArray.lastIndex - lpArray[i - 1].length), nSelStart + lpArray.lastIndex, 0x8 /*AESELT_LOCKSCROLL*/);
          }
          else
          {
            AkelPad.SetSel(nSelStart + lpArray.index, nSelStart + lpArray.index + lpArray[0].length, 0x8 /*AESELT_LOCKSCROLL*/);
          }

          ScrollCaret(hWndEditCur);
          nResult=AkelPad.GetSelStart();
        }
        else
        {
          if (nDirection & DN_ALLFILES)
          {
            nDirection&=~DN_DOWN;

            //Next MDI frame
            lpFrameCur=AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/);
            hWndEditCur=AkelPad.GetEditWnd();
            if (lpFrameCur != lpFrameInit)
              continue;
          }
          if (!bCloseDialog)
            MessageBox(hWndDialog, GetLangString(STRID_FINISHED), pScriptName, 64 /*MB_ICONINFORMATION*/);
        }
      }
      else if (nButton === BT_REPLACEALL)
      {
        if (bShowCountOfChanges)
        {
          nMatches=pSelText.match(oPattern);
          nMatches=nMatches?nMatches.length:0;
          nChanges+=nMatches;
          if (nMatches) ++nChangedFiles;
        }

        if (nMatches)
        {
          var nFirstLine;
          var nInitialLine;
          var nInitialCharInLine;

          pResult=pSelText.replace(oPattern, pReplaceWithEsc);

          //Save selection
          nFirstLine=SaveLineScroll(hWndEditCur);
          nInitialLine=AkelPad.SendMessage(hWndEditCur, 1078 /*EM_EXLINEFROMCHAR*/, 0, nInitialSelStart);
          nInitialCharInLine=nInitialSelStart - AkelPad.SendMessage(hWndEditCur, 187 /*EM_LINEINDEX*/, nInitialLine, 0);

          //Replace selection
          if (nAkelEdit)
          {
            if (nDirection & DN_SELECTION)
            {
              dwOptions=AkelPad.SendMessage(hWndEditCur, 3227 /*AEM_GETOPTIONS*/, 0, 0);
              if (!(dwOptions & 0x40 /*AECO_PASTESELECTCOLUMN*/))
                AkelPad.SendMessage(hWndEditCur, 3228 /*AEM_SETOPTIONS*/, 2 /*AECOOP_OR*/, 0x40 /*AECO_PASTESELECTCOLUMN*/);
            }
          }

          AkelPad.SetSel(nSelStart, nSelEnd, 0x8 /*AESELT_LOCKSCROLL*/);
          AkelPad.ReplaceSel(pResult);

          if (nAkelEdit)
          {
            if (nDirection & DN_SELECTION)
            {
              if (!(dwOptions & 0x40 /*AECO_PASTESELECTCOLUMN*/))
                AkelPad.SendMessage(hWndEditCur, 3228 /*AEM_SETOPTIONS*/, 4 /*AECOOP_XOR*/, 0x40 /*AECO_PASTESELECTCOLUMN*/);
            }
          }

          //Restore selection
          if (nDirection & DN_SELECTION)
          {
            if (!AkelPad.SendMessage(hWndEditCur, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0))
              AkelPad.SetSel(nSelStart, nSelStart + pResult.length, 0x8 /*AESELT_LOCKSCROLL*/);
          }
          else
          {
            i=AkelPad.SendMessage(hWndEditCur, 187 /*EM_LINEINDEX*/, nInitialLine, 0) + nInitialCharInLine;
            AkelPad.SetSel(i, i + (nInitialSelEnd - nInitialSelStart), 0x8 /*AESELT_LOCKSCROLL*/);
          }

          RestoreLineScroll(hWndEditCur, nFirstLine);
        }

        if (nDirection & DN_ALLFILES)
        {
          nDirection&=~DN_DOWN;

          //Next MDI frame
          lpFrameCur=AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/);
          hWndEditCur=AkelPad.GetEditWnd();
          if (lpFrameCur != lpFrameInit)
            continue;
        }

        if (bShowCountOfChanges)
        {
          if (nDirection & DN_ALLFILES)
            MessageBox(hWndDialog, GetLangString(STRID_COUNTFILES) + nChangedFiles + "\n" + GetLangString(STRID_COUNTCHANGES) + nChanges, pScriptName, 64 /*MB_ICONINFORMATION*/);
          else
            MessageBox(hWndDialog, GetLangString(STRID_COUNTCHANGES) + nChanges, pScriptName, 64 /*MB_ICONINFORMATION*/);
        }
      }
      else if (nButton === BT_FINDALL)
      {
        var lpIndex=AkelPad.MemAlloc(_X64?24:12 /*sizeof(AECHARINDEX)*/);
        var lpMatches=[];
        var pLine;
        var nTextLen=0;
        var nTextCount=0;
        var lpMemText;
        var bMainDisable;
        var bClearEdit=false;

        //Open output window
        if (!hWndOutput)
        {
          if (nDirection & DN_ALLFILES)
            AkelPad.Call("Log::Output", 1, "", "",  "^ \\((\\d+) (\\d+):(\\d+)\\)", "/FRAME=\\1 /GOTOLINE=\\2:\\3", -2, -2, nLogArgs);
          else
            AkelPad.Call("Log::Output", 1, "", "", "^(Searched .+ in file (.*)?$)?(\\((\\d+):(\\d+)\\))?", "/FILE=\\2 /GOTOLINE=\\4:\\5", -2, -2, nLogArgs);
          hWndOutput=GetOutputWindow();
        }

        //Get output window
        if (hWndOutput)
        {
          //Show progress bar and lock main window
          if (!hWndProgress)
            hWndProgress=AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 10 /*MI_WNDPROGRESS*/, 0);

          if (hWndProgress)
          {
            //First progress
            var nLineStart;
            var nLineEnd;

            nLineStart=AkelPad.SendMessage(hWndEditCur, 1078 /*EM_EXLINEFROMCHAR*/, 0, nSelStart);
            if (nSelEnd === -1)
              nLineEnd=AkelPad.SendMessage(hWndEditCur, 0xBA /*EM_GETLINECOUNT*/, 0, 0) - 1;
            else
              nLineEnd=AkelPad.SendMessage(hWndEditCur, 1078 /*EM_EXLINEFROMCHAR*/, 0, nSelEnd);

            //Set double range to end in the middle
            AkelPad.SendMessage(hWndProgress, 1030 /*PBM_SETRANGE32*/, 0, (nLineEnd - nLineStart) * 2);
            AkelPad.SendMessage(hWndProgress, 1026 /*PBM_SETPOS*/, 0, 0);
            oSys.Call("user32::ShowWindow", hWndProgress, 5 /*SW_SHOW*/);
          }
          bMainDisable=oSys.Call("user32::EnableWindow", hMainWnd, false);

          if (!bDialogHiddenActions)
          {
            //Change buttons
            oSys.Call("user32::SetFocus", hWndCancel);
            oSys.Call("user32::EnableWindow", hWndWhat, false);
            oSys.Call("user32::EnableWindow", hWndWith, false);
            oSys.Call("user32::EnableWindow", hWndTemplate, false);
            oSys.Call("user32::EnableWindow", hWndFindButton, false);
            oSys.Call("user32::EnableWindow", hWndReplaceButton, false);
            oSys.Call("user32::EnableWindow", hWndReplaceAllButton, false);
            oSys.Call("user32::EnableWindow", hWndFindAllButton, false);
            oSys.Call("user32::SetWindowText" + _TCHAR, hWndCancel, GetLangString(STRID_STOP));
          }

          //Count text length
          while (lpArray=oPattern.exec(pSelText))
          {
            i=lpMatches.length;
            lpMatches[i]=[];
            lpMatches[i].nIndex=nSelStart + lpArray.index;
            AkelPad.SendMessage(hWndEditCur, 3137 /*AEM_RICHOFFSETTOINDEX*/, lpMatches[i].nIndex, lpIndex);
            lpMatches[i].nLine=AkelPad.MemRead(_PtrAdd(lpIndex, 0) /*offsetof(AECHARINDEX, nLine)*/, 3 /*DT_DWORD*/);
            lpMatches[i].nLineUnwrap=AkelPad.SendMessage(hWndEditCur, 3143 /*AEM_GETUNWRAPLINE*/, lpMatches[i].nLine, 0);
            AkelPad.SendMessage(hWndEditCur, 3130 /*AEM_GETINDEX*/, 18 /*AEGI_WRAPLINEBEGIN*/, lpIndex);
            lpMatches[i].nLineBeginIndex=AkelPad.SendMessage(hWndEditCur, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
            AkelPad.SendMessage(hWndEditCur, 3130 /*AEM_GETINDEX*/, 19 /*AEGI_WRAPLINEEND*/, lpIndex);
            lpMatches[i].nLineEndIndex=AkelPad.SendMessage(hWndEditCur, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);

            if (!hWndPluginEdit)
              pLine=(nDirection & DN_ALLFILES?" (" + lpFrameCur + " ":"(") + (lpMatches[i].nLineUnwrap + 1) + "," + (lpMatches[i].nIndex - lpMatches[i].nLineBeginIndex + 1) + ") ";
            else
              pLine="";
            nTextLen+=pLine.length + min(lpMatches[i].nLineEndIndex - lpMatches[i].nLineBeginIndex, FINDALL_MAXLINE) + 1;

            if (i % 50 === 0)
            {
              if (hWndProgress)
                AkelPad.SendMessage(hWndProgress, 1026 /*PBM_SETPOS*/, lpMatches[i].nLine, 0);
              PeekMessages(hWndDialog, true);
              //Stop button is pressed
              if (!hWndOutput) break;
            }
          }
          if (hWndOutput)
          {
            if (!hWndPluginEdit && (nDirection & DN_ALLFILES))
            {
              if (lpMatches.length)
                pLine='Searched "'+ sOriginalFindText +'" - ('+ lpMatches.length +') in file ' + AkelPad.GetEditFile(0) +'\n';
              else
                pLine="";
              nFoundMatches+=lpMatches.length;
            }
            else pLine='Searched "'+ sOriginalFindText +'" - ('+ lpMatches.length +') in file '+ AkelPad.GetEditFile(0) +'\n';
            nTextLen+=pLine.length;

            //Get text
            if (lpMemText=AkelPad.MemAlloc((nTextLen + 1) * 2 /*sizeof(wchar_t)*/))
            {
              if (hWndProgress)
              {
                //Second progress. Set double range to start from the middle.
                AkelPad.SendMessage(hWndProgress, 1030 /*PBM_SETRANGE32*/, 0, lpMatches.length * 2);
                AkelPad.SendMessage(hWndProgress, 1026 /*PBM_SETPOS*/, lpMatches.length, 0);
              }
              AkelPad.MemCopy(lpMemText, pLine, 1 /*DT_UNICODE*/);
              nTextCount+=pLine.length;

              for (i=0; i < lpMatches.length; ++i)
              {
                if (i % 50 === 0)
                {
                  if (hWndProgress)
                    AkelPad.SendMessage(hWndProgress, 1026 /*PBM_SETPOS*/, lpMatches.length + i, 0);

                  PeekMessages(hWndDialog, true);

                  //Stop button is pressed
                  if (!hWndOutput) break;
                }
                if (!hWndPluginEdit)
                  pLine=(nDirection & DN_ALLFILES?" (" + lpFrameCur + " ":"(") + (lpMatches[i].nLineUnwrap + 1) + ":" + (lpMatches[i].nIndex - lpMatches[i].nLineBeginIndex + 1) + ") ";
                else
                  pLine="";
                pLine+=AkelPad.GetTextRange(lpMatches[i].nLineBeginIndex, lpMatches[i].nLineBeginIndex + min(lpMatches[i].nLineEndIndex - lpMatches[i].nLineBeginIndex, FINDALL_MAXLINE)) + "\n";
                AkelPad.MemCopy(_PtrAdd(lpMemText, nTextCount * 2 /*sizeof(wchar_t)*/), pLine, 1 /*DT_UNICODE*/);
                nTextCount+=pLine.length;
              }

              if (hWndOutput)
              {
                AkelPad.MemCopy(_PtrAdd(lpMemText, nTextCount * 2 /*sizeof(wchar_t)*/), "", 1 /*DT_UNICODE*/);
                pLine=AkelPad.MemRead(lpMemText, 1 /*DT_UNICODE*/);

                //Set output window text
                if (hWndOutput && pLine)
                {
                  nFoundFiles++;
                  if (nDirection & DN_ALLFILES)
                  {
                    AkelPad.Call("Log::Output", 4 + _TSTR, "\n", -1, ((!bClearLog && !(nLogArgs > 18))? 0 : 1) /*APPEND*/, 0, sLogThemeExt);
                    bClearLog=true;
                  }

                  AkelPad.Call("Log::Output", 4 + _TSTR, pLine, (pLine.length), (((nDirection & DN_ALLFILES) || (nLogArgs > 18))? 1 : 0) /*APPEND*/, 0, sLogThemeExt);
                }
              }
              AkelPad.MemFree(lpMemText);
            }
          }

          //Hide progress bar and unlock main window
          if (hWndProgress)
            oSys.Call("user32::ShowWindow", hWndProgress, 0 /*SW_HIDE*/);
          if (!bMainDisable)
            oSys.Call("user32::EnableWindow", hMainWnd, true);

          if (!bDialogHiddenActions)
          {
            //Change buttons
            oSys.Call("user32::EnableWindow", hWndWhat, true);
            oSys.Call("user32::EnableWindow", hWndWith, true);
            oSys.Call("user32::EnableWindow", hWndTemplate, true);
            oSys.Call("user32::EnableWindow", hWndFindButton, true);
            oSys.Call("user32::EnableWindow", hWndReplaceButton, true);
            oSys.Call("user32::EnableWindow", hWndReplaceAllButton, true);
            oSys.Call("user32::EnableWindow", hWndFindAllButton, true);
            oSys.Call("user32::SetWindowText" + _TCHAR, hWndCancel, GetLangString(STRID_CANCEL));
            oSys.Call("user32::SetFocus", hWndFindAllButton);
          }

          if (!hWndOutput) break;

          if (nDirection & DN_ALLFILES)
          {
            nDirection&=~DN_DOWN;

            //Next MDI frame
            lpFrameCur=AkelPad.Command(4316 /*IDM_WINDOW_FRAMENEXT*/);
            hWndEditCur=AkelPad.GetEditWnd();
            if (lpFrameCur !== lpFrameInit)
              continue;
          }

          hWndOutput=0;
        }
        AkelPad.MemFree(lpIndex);

        if (bHighlight && nButton === 2)
          MakeHighlight((sOriginalFindText || pFindIt), (!bRegExp));
      }
    }
    catch (oError)
    {
      MessageBox(hWndDialog, "Error:\n\n"+ oError.name +"\n\n"+ oError.description, pScriptName, 16 /*MB_ICONERROR*/);
    }
    break;
  }

  if (nButton === BT_REPLACEALL || wCommand === IDC_REPLACEALL_BUTTON)
  {
    if (nDirection & DN_ALLFILES)
      StatusBarUpdate((" | "+ GetLangString(STRID_COUNTFILES) + nChangedFiles + " " + GetLangString(STRID_COUNTCHANGES) + nChanges).toUpperCase());
    else
      StatusBarUpdate((" | "+ GetLangString(STRID_COUNTCHANGES) + nChanges).toUpperCase());
  }
  else if (bDialogHiddenActions && (nButton === BT_FINDALL || wCommand === IDC_FINDALL_BUTTON))
  {
    if (nDirection & DN_ALLFILES)
    {
      var sMsg = "Total Found: "+ nFoundMatches + " matches in " + ((nFoundFiles === 1) ? nFoundFiles + " file" : nFoundFiles + " files");
      StatusBarUpdate((" | "+ sMsg).toUpperCase());
      AkelPad.Call("Log::Output", 4 + _TSTR, "\nSearch ^ "+ sMsg + "\n", -1, 1/*APPEND*/, 0, sLogThemeExt);
    }
    else
      StatusBarUpdate((" | "+ "TOTAL FOUND: "+ lpMatches.length + " matches").toUpperCase());
  }

  return nResult;
}


//Functions
function InsertInArray(lpArray, lpItem, nPos)
{
  //For MS JScript backward compatibility
  var i;

  if (nPos < 0) nPos=lpArray.length + nPos + 1;
  if (nPos < 0) nPos=0;
  if (nPos > lpArray.length) nPos=lpArray.length;

  for (i=lpArray.length; i >= 0; --i)
  {
    if (i === nPos)
    {
      lpArray[i]=lpItem;
      break;
    }
    lpArray[i]=lpArray[i - 1];
  }
}

function DeleteFromArray(lpArray, nPos, nCount)
{
  //For MS JScript backward compatibility
  var i;

  if (nPos < 0) nPos=lpArray.length + nPos;
  if (nPos < 0 || nPos >= lpArray.length) return;
  if (nPos + nCount >= lpArray.length) nCount=lpArray.length - nPos;

  for (i=nPos; i + nCount < lpArray.length; ++i)
  {
    lpArray[i]=lpArray[i + nCount];
  }
  lpArray.length-=nCount;
}

function SaveLineScroll(hWnd)
{
  AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, false, 0);
  return AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0);
}

function RestoreLineScroll(hWnd, nBeforeLine)
{
  if (AkelPad.SendMessage(hWnd, 3129 /*AEM_GETLINENUMBER*/, 4 /*AEGL_FIRSTVISIBLELINE*/, 0) != nBeforeLine)
  {
    var lpScrollPos;
    var nPosY=AkelPad.SendMessage(hWnd, 3198 /*AEM_VPOSFROMLINE*/, 0 /*AECT_GLOBAL*/, nBeforeLine);

    if (lpScrollPos=AkelPad.MemAlloc(_X64?16:8 /*sizeof(POINT64)*/))
    {
      AkelPad.MemCopy(_PtrAdd(lpScrollPos, 0) /*offsetof(POINT64, x)*/, -1, 2 /*DT_QWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpScrollPos, _X64?8:4) /*offsetof(POINT64, y)*/, nPosY, 2 /*DT_QWORD*/);
      AkelPad.SendMessage(hWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpScrollPos);
      AkelPad.MemFree(lpScrollPos);
    }
  }
  AkelPad.SendMessage(hWnd, 3377 /*AEM_UPDATECARET*/, 0, 0);
  AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/, true, 0);
  oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

function RectToArray(lpRect, rcRect)
{
  rcRect.left=AkelPad.MemRead(_PtrAdd(lpRect, 0) /*offsetof(RECT, left)*/, 3 /*DT_DWORD*/);
  rcRect.top=AkelPad.MemRead(_PtrAdd(lpRect, 4) /*offsetof(RECT, top)*/, 3 /*DT_DWORD*/);
  rcRect.right=AkelPad.MemRead(_PtrAdd(lpRect, 8) /*offsetof(RECT, right)*/, 3 /*DT_DWORD*/);
  rcRect.bottom=AkelPad.MemRead(_PtrAdd(lpRect, 12) /*offsetof(RECT, bottom)*/, 3 /*DT_DWORD*/);
  return rcRect;
}

function ArrayToRect(rcRect, lpRect)
{
  if (!lpRect)
    lpRect=AkelPad.MemAlloc(16 /*sizeof(RECT)*/);

  if (lpRect)
  {
    AkelPad.MemCopy(_PtrAdd(lpRect, 0) /*offsetof(RECT, left)*/, rcRect.left, 3 /*DT_DWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRect, 4) /*offsetof(RECT, top)*/, rcRect.top, 3 /*DT_DWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRect, 8) /*offsetof(RECT, right)*/, rcRect.right, 3 /*DT_DWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRect, 12) /*offsetof(RECT, bottom)*/, rcRect.bottom, 3 /*DT_DWORD*/);
  }
  return lpRect;
}

function GetWindowSize(hWnd, hWndOwner, rcRect)
{
  var lpRect;
  var bResult=false;

  if (lpRect=AkelPad.MemAlloc(16 /*sizeof(RECT)*/))
  {
    if (oSys.Call("user32::GetWindowRect", hWnd, lpRect))
    {
      RectToArray(lpRect, rcRect);
      rcRect.right-=rcRect.left;
      rcRect.bottom-=rcRect.top;

      if (hWndOwner)
        bResult=oSys.Call("user32::ScreenToClient", hWndOwner, lpRect);
      else
        bResult=true;
      rcRect.left=AkelPad.MemRead(_PtrAdd(lpRect, 0) /*offsetof(RECT, left)*/, 3 /*DT_DWORD*/);
      rcRect.top=AkelPad.MemRead(_PtrAdd(lpRect, 4) /*offsetof(RECT, top)*/, 3 /*DT_DWORD*/);
    }
    AkelPad.MemFree(lpRect);
  }
  return bResult;
}

function CenterWindow(hWndParent, hWnd)
{
  var lpRect;
  var rcWndParent=[];
  var rcWnd=[];
  var X;
  var Y;

  if (lpRect=AkelPad.MemAlloc(16 /*sizeof(RECT)*/))
  {
    if (!hWndParent)
      hWndParent=oSys.Call("user32::GetDesktopWindow");

    oSys.Call("user32::GetWindowRect", hWndParent, lpRect);
    RectToArray(lpRect, rcWndParent);

    oSys.Call("user32::GetWindowRect", hWnd, lpRect);
    RectToArray(lpRect, rcWnd);

    //Center window
    X=rcWndParent.left + ((rcWndParent.right - rcWndParent.left) / 2 - (rcWnd.right - rcWnd.left) / 2);
    Y=rcWndParent.top + ((rcWndParent.bottom - rcWndParent.top) / 2 - (rcWnd.bottom - rcWnd.top) / 2);

    oSys.Call("user32::SetWindowPos", hWnd, 0, X, Y, 0, 0, 0x15 /*SWP_NOSIZE|SWP_NOZORDER|SWP_NOACTIVATE*/);

    AkelPad.MemFree(lpRect);
  }
}

function IsFileExist(pFile)
{
  if (oSys.Call("kernel32::GetFileAttributes" + _TCHAR, pFile) === -1)
    return false;
  return true;
}

function GetOutputWindow()
{
  var lpWnd;
  var hWnd=0;

  if (lpWnd=AkelPad.MemAlloc(_X64?8:4 /*sizeof(HWND)*/))
  {
    AkelPad.Call("Log::Output", 2, lpWnd);
    hWnd=AkelPad.MemRead(lpWnd, 2 /*DT_QWORD*/);
    AkelPad.MemFree(lpWnd);
  }
  return hWnd;
}

function PeekMessages(hWnd, bSendChild)
{
  var lpMsg;
  var uMsg;
  var wParam;
  var lParam;

  if (lpMsg=AkelPad.MemAlloc(_X64?48:28 /*sizeof(MSG)*/))
  {
    while (oSys.Call("user32::PeekMessage" + _TCHAR, lpMsg, hWnd, 0, 0, 0x1 /*PM_REMOVE*/))
    {
      if (bSendChild)
      {
        //Send key press from child
        uMsg=AkelPad.MemRead(_PtrAdd(lpMsg, _X64?8:4) /*offsetof(MSG, message)*/, 3 /*DT_DWORD*/);

        if (uMsg >= 0x0100 /*WM_KEYFIRST*/ && uMsg <= 0x0109 /*WM_KEYLAST*/)
        {
          wParam=AkelPad.MemRead(_PtrAdd(lpMsg, _X64?16:8) /*offsetof(MSG, wParam)*/, 2 /*DT_QWORD*/);
          lParam=AkelPad.MemRead(_PtrAdd(lpMsg, _X64?24:12) /*offsetof(MSG, lParam)*/, 2 /*DT_QWORD*/);
          AkelPad.SendMessage(hWnd, uMsg, wParam, lParam);
        }
      }

      //Standard processing
      oSys.Call("user32::TranslateMessage", lpMsg);
      oSys.Call("user32::DispatchMessage" + _TCHAR, lpMsg);
    }
    AkelPad.MemFree(lpMsg);
  }
}

function MessageBox(hHandle, pText, pCaption, nType)
{
  var nResult;

  bMessageBox=true;
  nResult=AkelPad.MessageBox(hHandle, pText, pCaption, nType);
  bMessageBox=false;
  return nResult;
}

function ScrollCaret(hWnd)
{
  if (nAkelEdit)
  {
    var lpStp;
    var dwScrollFlags=0;
    var dwScrollResult;

    if (lpStp=AkelPad.MemAlloc(_X64?32:20 /*sizeof(AESCROLLTOPOINT)*/))
    {
      //Test scroll to caret
      dwScrollFlags=0x1|0x10|0x400|0x800 /*AESC_TEST|AESC_POINTCARET|AESC_OFFSETCHARX|AESC_OFFSETCHARY*/;
      AkelPad.MemCopy(_PtrAdd(lpStp, 0) /*offsetof(AESCROLLTOPOINT, dwFlags)*/, dwScrollFlags, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpStp, _X64?24:12) /*offsetof(AESCROLLTOPOINT, nOffsetX)*/, 1, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpStp, _X64?28:16) /*offsetof(AESCROLLTOPOINT, nOffsetY)*/, 0, 3 /*DT_DWORD*/);
      dwScrollResult=AkelPad.SendMessage(hWnd, 3183 /*AEM_SCROLLTOPOINT*/, 0, lpStp);

      dwScrollFlags=0x10 /*AESC_POINTCARET*/;
      if (dwScrollResult & 0x1 /*AECSE_SCROLLEDX*/)
        dwScrollFlags|=0x1000 /*AESC_OFFSETRECTDIVX*/;
      if (dwScrollResult & 0x2 /*AECSE_SCROLLEDY*/)
        dwScrollFlags|=0x2000 /*AESC_OFFSETRECTDIVY*/;

      //Scroll to caret
      AkelPad.MemCopy(_PtrAdd(lpStp, 0) /*offsetof(AESCROLLTOPOINT, dwFlags)*/, dwScrollFlags, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpStp, _X64?24:12) /*offsetof(AESCROLLTOPOINT, nOffsetX)*/, 3, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lpStp, _X64?28:16) /*offsetof(AESCROLLTOPOINT, nOffsetY)*/, 2, 3 /*DT_DWORD*/);
      AkelPad.SendMessage(hWnd, 3183 /*AEM_SCROLLTOPOINT*/, 0, lpStp);

      AkelPad.MemFree(lpStp);
    }
  }
}

function TranslateEscapeString(pString)
{
  pString=pString.replace(/\\\\/g, "\0");
  if (pString.search(/\\[^rnt]/g) !== -1)
    return "";
  pString=pString.replace(/\\r\\n|\\r|\\n/g, "\n");
  pString=pString.replace(/\\t/g, "\t");
  pString=pString.replace(/\0/g, "\\");
  return pString;
}

function EscRegExp(pString)
{
  return pString.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}

function LOWORD(dwNumber)
{
  return (dwNumber & 0xffff);
}

function HIWORD(dwNumber)
{
  return (dwNumber >> 16);
}

function MAKELONG(a, b)
{
  return (a & 0xffff) | ((b & 0xffff) << 16);
}

function max(a, b)
{
  return a >= b?a:b;
}

function min(a, b)
{
  return a <= b?a:b;
}

function Ctrl()
{
  return oSys.Call("User32::GetKeyState", 0x11 /*VK_CONTROL*/) & 0x8000;
}

function Shift()
{
  return oSys.Call("User32::GetKeyState", 0x10 /*VK_SHIFT*/) & 0x8000;
}

function Alt()
{
  return oSys.Call("user32::GetKeyState", 0x12 /*VK_MENU*/) & 0x8000;
}

/**
 * HighLight text from the What input.
 *
 * nAction
 * 2 - highlight
 * 3 - unhighlight
 *
 * nFlags
 1   case sensitive (default).
 2   regular expressions in "TEXT" parameter.
 4   whole word.
 *
 * @param string sText
 * @param string sFoundResultsColorBG
 * @param string sFoundResultsColorFG
 * @param string nMarkerId
 * @param number nAction
 * @param number nFlags
 * @return bool if highlighted
 */
function highlight(sText, sFoundResultsColorBG, sFoundResultsColorFG, nMarkerId, nAction, nFlags)
{
  var strWhat = sText || pFindIt,
      action = nAction || 2,
      args = nFlags || 0;

  var bMatchWord = bWord,
      bCase = bSensitive,
      bRegEx = bRegEx,
      bRegExMulti = bMultiline;

  if (bCase)
    args += 1;
  if (bRegEx)
    args += 2;
  else if (bMatchWord)
    args += 4;

  AkelPad.Call("Coder::HighLight", 3, nMarkerId, sFoundResultsColorFG, sFoundResultsColorBG);

  if (action === 2)
    AkelPad.Call("Coder::HighLight", action, sFoundResultsColorFG, sFoundResultsColorBG, args, 0, nMarkerId, strWhat);
  else if (action === 3)
    AkelPad.Call("Coder::HighLight", action, nMarkerId, sFoundResultsColorFG, sFoundResultsColorBG);

  return true;
}

/**
 * Show the popup.
 *
 * @param sContent of the popup
 * @param nSec seconds
 * @param sTitle of the popup
 * @return bool|obj WScript.Shell
 */
function popupShow(sContent, nSec, sTitle)
{
  var nSeconds = nSec || 4,
      strContent = sContent || WScript.ScriptFullName,
      strTitle = sTitle || WScript.ScriptName;

  if (sContent && strTitle)
    return (new ActiveXObject("WScript.Shell").Popup(
      strContent,
      nSeconds, // Autoclose after ~2 seconds
      strTitle,
      64 /*MB_ICONINFORMATION*/
    ));

  return false;
}

/**
 * Update info in status bar
 *
 * @param sInfo
 */
function StatusBarUpdate(sInfo)
{
  var hWndStatus;
  var nStatusParts;
  var lpStatusTextBuffer;
  var pStatusText;

  if (hWndStatus=oSys.Call("user32::GetDlgItem", hMainWnd, 10002 /*ID_STATUS*/))
  {
    if (oSys.Call("user32::IsWindowVisible", hWndStatus))
    {
      if ((nStatusParts=AkelPad.SendMessage(hWndStatus, 1030 /*SB_GETPARTS*/, 0, 0)) > 5)
      {
        if (lpStatusTextBuffer=AkelPad.MemAlloc(1024 * _TSIZE))
        {
          //Get user status string
          AkelPad.SendMessage(hWndStatus, _TSTR?1037 /*SB_GETTEXTW*/:1026 /*SB_GETTEXTA*/, nStatusParts - 1, lpStatusTextBuffer);
          pStatusText=AkelPad.MemRead(lpStatusTextBuffer, _TSTR);

          //Modify string
          pStatusText+=sInfo;

          //Set user status string
          AkelPad.MemCopy(lpStatusTextBuffer, pStatusText, _TSTR);
          AkelPad.SendMessage(hWndStatus, _TSTR?1035 /*SB_SETTEXTW*/:1025 /*SB_SETTEXTA*/, nStatusParts - 1, lpStatusTextBuffer);
          AkelPad.MemFree(lpStatusTextBuffer);
        }
      }
    }
  }
}

/**
 * Get Direction from given string

 DN_DOWN      = 0x00000001;
 DN_UP        = 0x00000002;
 DN_BEGINNING = 0x00000004;
 DN_SELECTION = 0x00000008;
 DN_ALLFILES  = 0x00000010;

 *
 * @param mixed pParam = 'word up begin selected tabs'
 * @return number nResult of direction
 */
function GetDirection(pParam)
{
  if (typeof pParam === "number")
    return pParam;

  if (typeof pParam === "string" && pParam === "")
    return null;

  var sDirection = pParam.toUpperCase(),
      nResult = null;

  if (~sDirection.indexOf('BEGIN'))
    nResult = 0x00000004 /*DN_BEGINNING*/;
  else if (~sDirection.indexOf("DOWN"))
    nResult = 0x00000001 /*DN_DOWN*/;
  else if (~sDirection.indexOf("UP"))
    nResult = 0x00000002 /*DN_UP*/;
  else if (~sDirection.indexOf('SELECTED'))
    nResult = 0x00000008 /*DN_SELECTION*/;
  else if (~sDirection.indexOf('TABS'))
    nResult = 0x00000010 /*DN_ALLFILES*/;

  return nResult;
}

/**
 * Gets output of the log and paste it in the new tab.
 *
 * //bad case:
 * //oSys.Call("user32::GetWindowText" + _TCHAR, hWndOutput, lpBuffer, 256);
 * //sText = AkelPad.MemRead(lpBuffer, _TSTR);
 *
 * @param number nLogArgs
 * @param string sLogThemeExt
 * @return bool if success
 */
function LogOutputActions(nLogArgs, sLogThemeExt)
{
  var oError, hWndOutput, nTextLen, lpText, sText

  if (! nLogArgs)
    return false;

  try
  {
    hWndOutput=GetOutputWindow();
    if (nTextLen=AkelPad.SendMessage(hWndOutput, 14 /*WM_GETTEXTLENGTH*/, 0, 0))
    {
      if (lpText=AkelPad.MemAlloc((nTextLen + 1) * 2))
      {
        AkelPad.SendMessage(hWndOutput, 13 /*WM_GETTEXT*/, nTextLen + 1, lpText);
        sText = AkelPad.MemRead(lpText, 1 /*DT_UNICODE*/);
        AkelPad.MemFree(lpText);

        if (AkelPad.Include("CommonFunctions.js"))
          createFile(getFileFormat(0), (sLogThemeExt || ".txt"));
        else
          AkelPad.SendMessage(AkelPad.GetMainWnd(), 273 /*WM_COMMAND*/, 4101 /*wParam=MAKEWAPARAM(0,IDM_FILE_NEW)*/, 1 /*lParam=TRUE*/);

        AkelPad.ReplaceSel(sText);
        AkelPad.SetSel(0, 0);
      }
    }
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, "Error:\n\n"+ oError.name +"\n\n"+ oError.description +"\n\n", pScriptName, 16 /*MB_ICONERROR*/);
    return false;
  }
  hWndOutput=0;
  return true;
}

/**
 * Highlight the results in the Log::Output
 * 
 * @param string -text to highlight
 * @param bool|number 0|1 -if regular expression to search
 * @return void
 */
function MakeHighlight(strContent, bNotRegEx)
{
  AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", ('-bNotRegExp='+ ((bNotRegEx)?1:0) +' -sText="'+ encodeURIComponent(strContent) +'"'));
}

function GetLangString(nStringID)
{
  var nLangID=AkelPad.GetLangId(1 /*LANGID_PRIMARY*/);

  if (nLangID === 0x19) //LANG_RUSSIAN
  {
    if (nStringID === STRID_LOWJSCRIPT)
      return "\u0412\u0435\u0440\u0441\u0438\u044F\u0020\u004A\u0053\u0063\u0072\u0069\u0070\u0074\u0020\u043D\u0438\u0436\u0435\u002C\u0020\u0447\u0435\u043C\u0020\u0035\u002E\u0035\u002E";
    if (nStringID === STRID_WHAT)
      return "\u0427\u0442\u043E\u003A";
    if (nStringID === STRID_WITH)
      return "\u0427\u0435\u043C\u003A";
    if (nStringID === STRID_ADD)
      return "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C...";
    if (nStringID === STRID_RENAME)
      return "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C...";
    if (nStringID === STRID_DELETE)
      return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C";
    if (nStringID === STRID_NAME)
      return "\u0418\u043C\u044F";
    if (nStringID === STRID_MATCHWORD)
      return "\u0426\u0435\u043B\u043E\u0435\u0020\u0441\u043B\u043E\u0432\u043E";
    if (nStringID === STRID_MATCHCASE)
      return "\u0423\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C\u0020\u0440\u0435\u0433\u0438\u0441\u0442\u0440";
    if (nStringID === STRID_REGEXP)
      return "\u0420\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u044B\u0435\u0020\u0432\u044B\u0440\u0430\u0436\u0435\u043D\u0438\u044F";
    if (nStringID === STRID_MULTILINE)
      return "\u041C\u043D\u043E\u0433\u043E\u0441\u0442\u0440\u043E\u0447\u043D\u043E";
    if (nStringID === STRID_ESCAPESEQ)
      return "\u0045\u0073\u0063\u002D\u043F\u043E\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438";
    if (nStringID === STRID_FUNCTION)
      return "\u0417\u0430\u043C\u0435\u043D\u044F\u0442\u044C\u0020\u043D\u0430\u0020\u0444\u0443\u043D\u043A\u0446\u0438\u044E";
    if (nStringID === STRID_DIRECTION)
      return "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435";
    if (nStringID === STRID_FORWARD)
      return "\u0412\u043D\u0438\u0437";
    if (nStringID === STRID_BACKWARD)
      return "\u0412\u0432\u0435\u0440\u0445";
    if (nStringID === STRID_BEGINNING)
      return "\u0421\u0020\u043D\u0430\u0447\u0430\u043B\u0430";
    if (nStringID === STRID_INSEL)
      return "\u0412\u0020\u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0438";
    if (nStringID === STRID_ALLFILES)
      return "\u0412\u0441\u0435\u0020\u0444\u0430\u0439\u043B\u044B";
    if (nStringID === STRID_FINDNEXT)
      return "&\u041D\u0430\u0439\u0442\u0438\u0020\u0434\u0430\u043B\u0435\u0435";
    if (nStringID === STRID_FINDALL)
      return "\u041D\u0430&\u0439\u0442\u0438 \u0432\u0441\u0435";
    if (nStringID === STRID_REPLACE)
      return "&\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C";
    if (nStringID === STRID_REPLACEALL)
      return "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C &\u0432\u0441\u0435";
    if (nStringID === STRID_CANCEL)
      return "\u041E\u0442\u043C\u0435\u043D\u0430";
    if (nStringID === STRID_STOP)
      return "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C";
    if (nStringID === STRID_SYNTAXERROR)
      return "\u0421\u0438\u043D\u0442\u0430\u043A\u0441\u0438\u0447\u0435\u0441\u043A\u0430\u044F\u0020\u043E\u0448\u0438\u0431\u043A\u0430\u003A\n \\\\ - \u043E\u0431\u0440\u0430\u0442\u043D\u044B\u0439\u0020\u0441\u043B\u044D\u0448\n \\r - \u043A\u043E\u043D\u0435\u0446\u0020\u0441\u0442\u0440\u043E\u043A\u0438\n \\t - \u0437\u043D\u0430\u043A\u0020\u0442\u0430\u0431\u0443\u043B\u044F\u0446\u0438\u0438";
    if (nStringID === STRID_FINISHED)
      return "\u041F\u043E\u0438\u0441\u043A\u0020\u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u002E";
    if (nStringID === STRID_COUNTFILES)
      return "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u043D\u044B\u0445\u0020\u0444\u0430\u0439\u043B\u043E\u0432\u003A\u0020";
    if (nStringID === STRID_COUNTCHANGES)
      return "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E\u0020\u0437\u0430\u043C\u0435\u043D\u003A\u0020";
    if (nStringID === STRID_TEMPLATE1)
      return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C\u0020\u043F\u0443\u0441\u0442\u044B\u0435\u0020\u0441\u0442\u0440\u043E\u043A\u0438";
    if (nStringID === STRID_TEMPLATE2)
      return "\u0423\u0434\u0430\u043B\u0438\u0442\u044C\u0020\u043F\u0440\u043E\u0431\u0435\u043B\u044B\u0020\u0432\u0020\u043D\u0430\u0447\u0430\u043B\u0435\u0020\u0438\u0020\u0432\u0020\u043A\u043E\u043D\u0446\u0435\u0020\u0441\u0442\u0440\u043E\u043A";
    if (nStringID === STRID_TEMPLATE3)
      return "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C\u0020\u0441\u0438\u043C\u0432\u043E\u043B\u044B\u0020\u043F\u0440\u043E\u0431\u0435\u043B\u0430\u043C\u0438";
  }
  else
  {
    if (nStringID === STRID_LOWJSCRIPT)
      return "JScript version is less than 5.5.";
    if (nStringID === STRID_WHAT)
      return "What&;";
    if (nStringID === STRID_WITH)
      return "With&;";
    if (nStringID === STRID_ADD)
      return "Add...";
    if (nStringID === STRID_RENAME)
      return "Rename..&.";
    if (nStringID === STRID_DELETE)
      return "Delete";
    if (nStringID === STRID_NAME)
      return "Name";
    if (nStringID === STRID_MATCHWORD)
      return "Match &Word";
    if (nStringID === STRID_MATCHCASE)
      return "&Case sensitive";
    if (nStringID === STRID_REGEXP)
      return "Regular e&xpressions";
    if (nStringID === STRID_MULTILINE)
      return "&Multiline";
    if (nStringID === STRID_ESCAPESEQ)
      return "&Esc-sequences";
    if (nStringID === STRID_FUNCTION)
      return "Replace with functio&n";
    if (nStringID === STRID_DIRECTION)
      return "Direction";
    if (nStringID === STRID_FORWARD)
      return "&Down";
    if (nStringID === STRID_BACKWARD)
      return "&Up";
    if (nStringID === STRID_BEGINNING)
      return "&Beginning";
    if (nStringID === STRID_INSEL)
      return "&In selection";
    if (nStringID === STRID_ALLFILES)
      return "All file&s";
    if (nStringID === STRID_FINDNEXT)
      return "&Find next";
    if (nStringID === STRID_FINDALL)
      return "Find a&ll";
    if (nStringID === STRID_REPLACE)
      return "&Replace";
    if (nStringID === STRID_REPLACEALL)
      return "Replace &all";
    if (nStringID === STRID_CANCEL)
      return "Cancel";
    if (nStringID === STRID_STOP)
      return "Sto&p";
    if (nStringID === STRID_SYNTAXERROR)
      return "Syntax error:\n \\\\ - backslash\n \\r - line feed\n \\t - tabulation";
    if (nStringID === STRID_FINISHED)
      return "Search finished.";
    if (nStringID === STRID_COUNTFILES)
      return "Changed files: ";
    //if (nStringID === STRID_COUNTFILESFOUND)
    //  return "Found in files: ";
    if (nStringID === STRID_COUNTCHANGES)
      return "Count of changes: ";
    if (nStringID === STRID_TEMPLATE1)
      return "Delete empty lines";
    if (nStringID === STRID_TEMPLATE2)
      return "Delete leading and trailing spaces";
    if (nStringID === STRID_TEMPLATE3)
      return "Zap symbols with spaces";
  }
  return "";
}
