// http://akelpad.sourceforge.net/forum/viewtopic.php?p=30804#30804
// Version: 2016-07-26
// Author: KDJ
//
// *** Replace text in edit window  ***
// *** GUI for TextReplace function ***
//
// Usage:
//   Call("Scripts::Main", 1, "TextReplace.js")
//
// Remarks:
//   Script should be saved in Unicode format.
//   Required to include:
//     InputBox_function.js:    http://akelpad.sourceforge.net/forum/viewtopic.php?p=17609#17609
//     TextReplace_function.js: http://akelpad.sourceforge.net/forum/viewtopic.php?p=30653#30653
//   For view AkelPad help file, is needed HtmlView.js: http://akelpad.sourceforge.net/forum/viewtopic.php?p=29221#29221
//   Templates are saved in file: TextReplace_templ.tsv.
//   F1 key - show context menu if available (for edit controls and "Find" button).
//   'Disable "Undo"' option:
//     - causes less memory usage, but is not possible to undo changes from undo buffer,
//     - to restore previous content of the document, reopen it.
//   "Find" button action:
//     left click  - if is set default action - do it, else show menu,
//     right click - show context menu.
//
// Batch files:
//   Should be named TextReplace_batch*.tsv, where * is any text.
//   Should be saved in UTF-16LE format with Windows new line "\r\n".
//   Each line of the batch file should contain tab-separated fields:
//     FindIt<TAB>ReplaceWith<TAB>Flags<TAB>Description
//     - FindIt, ReplaceWith, Flags - see description in TextReplace_function.js,
//     - if line is empty or FindIt is empty, this line will be ommited,
//     - flag "g" can be ommited - will be added automatically.
//   Example 1 (replace all "abc" with "xyz", next delete all "gwx"):
//     abc   xyz
//     gwx
//   Example 2:
//     \b(\d{4})-(\d{2})-(\d{2})\b   \3-\2-\1   r   (replace date in format "yyyy-mm-dd" with date in format "dd-mm-yyyy", used regular expressions)
//     \b0x[\dA-F]{1,8}\b   return parseInt(_s0).toString();   fir   (replace hex values (0x0 - 0xFFFFFFFF) with decimals, used regular expressions, function and ignore case)
//     abc   return _s0 + _n1;   f   (add counter to "abc", used function)

/**
 * If `Range for Replace` is set by default to 3 - Selection some handy features comes in.
 *
 * Ctrl+;           - change focus when focused (Ctrl+H - focus back to the box)
   Alt+;            - focus between inputs

 * Ctrl+H           - find first (when focused)

 * Ctrl+J,
   Ctrl+Enter       - find next

 * Ctrl+K,
   Ctrl+Shift+Enter - find previous

 * Ctrl+L           - find last

 * Ctrl+P           - move caret next location
   Ctrl+Shift+P     - move caret prev location

 * Ctrl+I           - insert tab
 * Ctrl+F           - toggle font
 * Ctrl+Shift+F     - open FindReplaceFiles_extended.js

 * Ctrl+B           - bookmark lines
   Ctrl+Shift+B     - remove bookmarks

 * Ctrl+U           - undo replace
   Ctrl+Shift+U     - redo all

 * Ctrl+R           - replace
   Ctrl+Shift+R     - replace All

 * Ctrl+W           - replace backwards
 * Ctrl+E           - replace backwards
 * Ctrl+O           - find and show all occurs in the log (FIND)
 * Ctrl+Shift+O     - find and show all occurs in the log, keeping results (FIND)
 * Ctrl+Shift+A     - find in files and show all occurs in the log, in current dir (FINDSTR)

 * Ctrl+Alt         - highlight text from What field
   Ctrl+Alt+Shift   - remove all highlights from the doc
   Ctrl+Q           - highlight with one color
   Ctrl+Shift+Q     - remove the highlight
 *
 */

/**
 * Dependencies:
 * - LogHighLight.js
 * - MarkIt_extended.js
 * - FindReplaceFiles_extended.js
 */

var oSys = AkelPad.SystemFunction();
var scriptName = WScript.ScriptName;
var sClass = "AkelPad::Scripts::" + scriptName + "::" + AkelPad.GetInstanceDll();
var hDlg;
var dialogShown  = false;
var hWndEdit = AkelPad.GetEditWnd();
var fileFullPath = AkelPad.GetEditFile(0);

var bCoderHighLightIsRunning = AkelPad.IsPluginRunning("Coder::HighLight"),
    bQSearchIsRunning = AkelPad.IsPluginRunning("QSearch::QSearch"),
    bLineBoardIsRunning = AkelPad.IsPluginRunning("LineBoard::Main");

function getFileDir(filePathName) // file directory w/o trailing '\'
{
  var n = filePathName.lastIndexOf("\\");
  var nn = filePathName.lastIndexOf("/");
  if (nn > n)  n = nn;
  var s = "";
  if (n >= 0)
    s = filePathName.substr(0, n);
  else if (isFullPath(filePathName))
    s = filePathName;
  return s;
}
function isFullPath(filePathName)
{
  return /^([A-Za-z]\:)|(\\\\)/.test(filePathName);
}

if (hDlg = oSys.Call("User32::FindWindowExW", 0, 0, sClass, 0))
{
  if (! oSys.Call("User32::IsWindowVisible", hDlg))
    oSys.Call("User32::ShowWindow", hDlg, 8 /*SW_SHOWNA*/);
  if (oSys.Call("User32::IsIconic", hDlg))
    oSys.Call("User32::ShowWindow", hDlg, 9 /*SW_RESTORE*/);

  oSys.Call("User32::SetForegroundWindow", hDlg);
  WScript.Quit();
}

if (! (AkelPad.Include("InputBox_function.js") && AkelPad.Include("TextReplace_function.js")))
  WScript.Quit();

var hMainWnd = AkelPad.GetMainWnd();
var hGuiFont = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
var oFSO     = new ActiveXObject("Scripting.FileSystemObject");
var aHotKey  = [[0x5 /*MOD_SHIFT|MOD_ALT*/, 0x2D /*VK_INSERT*/, BookmarkLines, true],
                [0x5 /*MOD_SHIFT|MOD_ALT*/, 0x2E /*VK_DELETE*/, BookmarkLines, false]];

var bSizingEdit = false;
var nDlgMinW    = 405;
var nDlgMinH    = 263;
var nEditMinW   = 350;
var nEditMinH   = 30;
var nScaleX;
var nScaleY;
var nDlgX;
var nDlgY;
var nDlgW;
var nDlgH;
var nWhatH;
var bTranspNA;
var nOpacity;
var bMatch;
var bWord;
var bRegExp;
var bDotNL;
var bFunc;
var bBatch;
var bLockUndo;
var nRange;
var bFont1;
var bFont2;
var bWrap1;
var bWrap2;
var sDir = getFileDir(fileFullPath);
var sWhat;
var sWith;
var sBFile;
var nFindDef;
var nHistLen;
var aHist;

ReadIni();
GetLangStrings();

var IDCANCEL    = 2;
var IDWHATS     = 1000;
var IDWHATE     = 1001;
var IDWITHS     = 1002;
var IDWITHE     = 1003;
var IDMATCH     = 1004;
var IDWORD      = 1005;
var IDREGEXP    = 1006;
var IDDOTNL     = 1007;
var IDFUNC      = 1008;
var IDBATCH     = 1009;
var IDLOCKUNDO  = 1010;
var IDRANGE     = 1011;
var IDFBTC      = 1012;
var IDFCTE      = 1013;
var IDSEL       = 1014;
var IDBOOK      = 1015;
var IDDOC       = 1016;
var IDALLDOC    = 1017;
var IDTRACKBAR  = 1018;
var IDTRANSPNAB = 1019;
var IDREPL1B    = 1020;
var IDREPL2B    = 1021;
var IDHISTB     = 1022;
var IDTEMPLB    = 1023;
var IDFINDB     = 1024;
var IDCLOSEB    = 1025;

AkelPad.WindowRegisterClass(sClass);

//0x50000000=WS_VISIBLE|WS_CHILD
//0x50000007=WS_VISIBLE|WS_CHILD|BS_GROUPBOX
//0x50010000=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_PUSHBUTTON
//0x50010003=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
//0x50010005=WS_VISIBLE|WS_CHILD|WS_TABSTOP|TBS_TOP|TBS_AUTOTICKS
//0x50010009=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTORADIOBUTTON
//0x50851004=WS_VISIBLE|WS_CHILD|WS_BORDER|WS_SIZEBOX|WS_TABSTOP|ES_WANTRETURN|ES_MULTILINE
//0x90CE0040=WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_SIZEBOX|WS_MINIMIZEBOX|DS_SETFONT
AkelPad.CreateDialog(0, sClass, sTxtDlgTitle, 0X90CE0040, nDlgX, nDlgY, nDlgW, nDlgH, hMainWnd, CallbackDlg, 0x2 /*CDF_PIXELS*/, 0, 0, "", 0, 0, "|",
  // Class,               Title,                             Style,       X,  Y,   W,   H, ID,          lParam
  0, "STATIC",            "",                                0x50000000, 10, 14,  34,  13, IDWHATS,     0, "|",
  0, "AkelEditW",         "",                                0x50851004, 45, 10,   0,   0, IDWHATE,     0, "|",
  0, "STATIC",            sTxtWith,                          0x50000000,  0,  0,  34,  13, IDWITHS,     0, "|",
  0, "AkelEditW",         "",                                0x50851004,  0,  0,   0,   0, IDWITHE,     0, "|",
  0, "BUTTON",            sTxtMatchCase,                     0x50010003,  0,  0, 140,  16, IDMATCH,     0, "|",
  0, "BUTTON",            sTxtWholeWord,                     0x50010003,  0,  0, 140,  16, IDWORD,      0, "|",
  0, "BUTTON",            sTxtRegExp,                        0x50010003,  0,  0, 140,  16, IDREGEXP,    0, "|",
  0, "BUTTON",            sTxtDotMatchesNL,                  0x50010003,  0,  0, 123,  16, IDDOTNL,     0, "|",
  0, "BUTTON",            sTxtWithFunc,                      0x50010003,  0,  0, 140,  16, IDFUNC,      0, "|",
  0, "BUTTON",            sTxtBatchRepl,                     0x50010003,  0,  0, 140,  16, IDBATCH,     0, "|",
  0, "BUTTON",            sTxtLockUndo,                      0x50010003,  0,  0, 123,  16, IDLOCKUNDO,  0, "|",
  0, "BUTTON",            sTxtRange,                         0x50000307,  0,  0, 135, 142, IDRANGE,     0, "|",
  0, "BUTTON",            "&1 - " + sTxtBegToCaret,          0x50010009,  0,  0, 115,  16, IDFBTC,      0, "|",
  0, "BUTTON",            "&2 - " + sTxtCaretToEnd,          0x50010009,  0,  0, 115,  16, IDFCTE,      0, "|",
  0, "BUTTON",            "&3 - " + sTxtSelection,           0x50010009,  0,  0, 115,  16, IDSEL,       0, "|",
  0, "BUTTON",            "&4 - " + sTxtBookmarks,           0x50010009,  0,  0, 115,  16, IDBOOK,      0, "|",
  0, "BUTTON",            "&5 - " + sTxtEntireDoc,           0x50010009,  0,  0, 115,  16, IDDOC,       0, "|",
  0, "BUTTON",            "&6 - " + sTxtAllDocs,             0x50010009,  0,  0, 115,  16, IDALLDOC,    0, "|",
  0, "msctls_trackbar32", "",                                0x50010005,  0,  0,  70,  20, IDTRACKBAR,  0, "|",
  0, "BUTTON",            sTxtTransparentNA,                 0x50010003,  0,  0, 185,  16, IDTRANSPNAB, 0, "|",
  0, "BUTTON",            sTxtReplace1,                      0x50010000,  0,  0,  90,  23, IDREPL1B,    0, "|",
  0, "BUTTON",            sTxtReplaceAll,                    0x50010000,  0,  0,  90,  23, IDREPL2B,    0, "|",
  0, "BUTTON",            sTxtHistory + "...",               0x50010000,  0,  0,  90,  23, IDHISTB,     0, "|",
  0, "BUTTON",            sTxtTemplates + "...",             0x50010000,  0,  0,  90,  23, IDTEMPLB,    0, "|",
  0, "BUTTON",            sTxtFind + (nFindDef ? "" : " >"), 0x50010000,  0,  0,  90,  23, IDFINDB,     0, "|",
  0, "BUTTON",            sTxtClose,                         0x50010000,  0,  0,  90,  23, IDCLOSEB,    0);

if (hDlg)
{
  AkelPad.ScriptNoMutex();
  AkelPad.WindowGetMessage(0x4 /*WGM_KEYDOWNUP*/);
}

AkelPad.WindowUnregisterClass(sClass);

function CallbackDlg(hWnd, uMsg, wParam, lParam)
{
  var nID, nCode;
  var selTextTemp;

  if (uMsg === 272 /*WM_INITDIALOG*/)
  {
    hDlg = hWnd;
    InitDlg();
  }
  else if (uMsg === 6 /*WM_ACTIVATE*/)
  {
    if (LoWord(wParam))
      EnableButtonsDlg();

    SetHotKeys(LoWord(wParam));
    SetTransparency(LoWord(wParam) || (lParam != hMainWnd));

    if ((! bRegExp) && (! bBatch))
    {
    	nID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));
    	selTextTemp = AkelPad.GetSelText();

    	if (selTextTemp !== '' && nRange === 2)
    	{
    	  ReplaceTextAE(IDWHATE, selTextTemp);

    	  if ((! bFunc) && nRange === 2)
    	  {
    	    ReplaceTextAE(IDWITHE, selTextTemp);
    	  }

    	  if (bCoderHighLightIsRunning)
    	  {
    	    AkelPad.Call("Coder::HighLight", 3, 69);
    	    AkelPad.Call("Coder::HighLight", 3, 96);
    	  }

    	  if (nID !== IDWITHE)
    	  {
    	    oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWITHE));
    	    SendDlgItemMessage(hWnd, IDWITHE, 3044 /*AEM_KEYDOWN*/, 0x23 /*VK_END*/);
    	    dialogShown = true;
    	  }
    	}
    	else if (!dialogShown && nID !== IDWHATE)
    	{
    	  oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWHATE));
    	  SendDlgItemMessage(hWnd, IDWHATE, 3044 /*AEM_KEYDOWN*/, 0x23 /*VK_END*/);
    	  dialogShown = true;
    	}
    }
  }
  else if (uMsg === 786 /*WM_HOTKEY*/)
  {
    aHotKey[wParam][2](aHotKey[wParam][3]);
  }
  else if (uMsg === 36 /*WM_GETMINMAXINFO*/)
  {
    AkelPad.MemCopy(_PtrAdd(lParam, 24), nDlgMinW, 3 /*DT_DWORD*/); //ptMinTrackSize_x
    AkelPad.MemCopy(_PtrAdd(lParam, 28), nDlgMinH, 3 /*DT_DWORD*/); //ptMinTrackSize_y
  }
  else if (uMsg === 5 /*WM_SIZE*/)
  {
    if ((wParam == 0 /*SIZE_RESTORED*/) && (! bSizingEdit))
    {
      nDlgW = LoWord(lParam);
      nDlgH = HiWord(lParam);
      ResizeDlg();
    }
  }
  else if (uMsg === 15 /*WM_PAINT*/)
  {
    PaintSizeGrip();
  }
  else if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    nID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));


    if ((wParam >= 0x31 /*1 key*/) && (wParam <= 0x36 /*6 key*/))
    {
      if (Ctrl() && (! Shift()) && (! Alt()))
        CountInRange(wParam - 0x30);
    }
    else if (wParam == 0x70 /*VK_F1*/)
    {
      if (! Alt())
      {
        if (Ctrl() || Shift())
          AkelHelp(GetAkelHelpFile());
        else if ((nID == IDWHATE) || (nID == IDWITHE))
          MenuAE(oSys.Call("User32::GetFocus"), nID);
        else if (nID == IDFINDB)
          MenuFind();
      }
    }
    else if ((wParam == 0x72 /*VK_F3*/) || (wParam == 0x76 /*VK_F7*/))
    {
      if (! Alt())
      {
        if (Ctrl())
        {
          if (Shift())
            Find((wParam == 0x72 /*VK_F3*/) ? 4 : 14);
          else
            Find((wParam == 0x72 /*VK_F3*/) ? 3 : 13);
        }
        else if (Shift())
          Find((wParam == 0x72 /*VK_F3*/) ? 2 : 12);
        else
          Find((wParam == 0x72 /*VK_F3*/) ? 1 : 11);
      }
    }
    else if (((nID == IDWHATE) || (nID == IDWITHE)) && Ctrl() && (! Shift()) && (! Alt()))
    {
      if (wParam == 0x46 /*F key*/)
      {
        if (nID == IDWHATE)
          bFont1 = ! bFont1;
        else
          bFont2 = ! bFont2;

        SetFontAE(nID);
      }
      else if (wParam == 0x55 /*U key*/)
      {
        if (nID == IDWHATE)
          bWrap1 = ! bWrap1;
        else
          bWrap2 = ! bWrap2;

        SetWrapAE(nID);
      }
    }

    if (wParam === 0x41/*VK_KEY_A*/)
    {
      if (Ctrl() && Shift())
        qSearchLog();
    }
    if (wParam === 0x51/*VK_KEY_Q*/)
    {
      var strWhat = GetTextAE(IDWHATE) || sWhat;
      if (Ctrl() && (! Shift()))
        highlight(strWhat);
      if (Ctrl() && Shift())
        highlight(strWhat, 3);
    }
    else if (wParam === 0x53 /*S key VK_KEY_S*/)
    {
      if (Ctrl() && (! Shift()))
        FindToLog();
      if (Ctrl() && Shift())
        FindToLog(26);
    }
    else if (wParam === 0x4F /*VK_KEY_O*/)
    {
      if (Ctrl() && (! Shift()))
        FindstrLog();
      if (Ctrl() && Shift())
        FindstrLog(24);
    }
    else if (
      (
        (wParam===72/*VK_KEY_H*/)||(wParam===73/*VK_KEY_I*/)||(wParam===74/*VK_KEY_J*/)||(wParam===75/*VK_KEY_K*/)||(wParam===76/*VK_KEY_L*/)
      ||(wParam===0x42/*VK_KEY_B*/)||(wParam===0x50/*VK_KEY_P*/)||(wParam===0x55/*VK_KEY_U*/)||(wParam===0x52/*VK_KEY_R*/)||(wParam===0x57/*VK_KEY_W*/)||(wParam===0x45/*VK_KEY_E*/)
      ||(wParam===0x46/*VK_KEY_F*/)
      ||(wParam===0xBA/*VK_OEM_1*/)||(wParam===0x0D/*VK_RETURN*/)
      )
    )
    {
      var wordStart = AkelPad.GetSelStart(),
          wordEnd = AkelPad.GetSelEnd(),
          nIDTemp
      ;


      if (! Alt() && Ctrl() && (! Shift()))
      {
        if (wParam === 72/*VK_KEY_H*/) { Find(4); /* first */ }
        if (wParam === 74/*VK_KEY_J*/) { Find(1); /* next */  }
        if (wParam === 75/*VK_KEY_K*/) { Find(2); /* previous */ }
        if (wParam === 76/*VK_KEY_L*/) { Find(3); /* last */ }
        if (wParam === 0x0D/*VK_RETURN*/)
        {
          if (nID !== IDWHATE)
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWHATE));

          Find(1); /* next */
        }
        if (wParam === 0x52/*VK_KEY_R*/)
        {
          if (nID !== IDWITHE)
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWITHE));

          Replace(nID);
          if (bCoderHighLightIsRunning && sWith)
            AkelPad.Call("Coder::HighLight", 2, "#FFFFFF", "#FF0080", 1, 0, 96, sWith);

          Find(1);
        }
        if (wParam === 0x42/*VK_KEY_L*/) { BookmarkLines(true); /* last */ }
        if (wParam === 0x55/*VK_KEY_U*/)
        {
          nIDTemp = nID;
          AkelPad.Call("Scripts::Main", 1, "UndoMax.js", "1 1")
          oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWITHE));
          AkelPad.SetSel(wordStart, wordEnd);
        }
        if ((wParam === 0x45/*VK_KEY_E*/) || (wParam === 0x57/*VK_KEY_W*/))
        {
          if (nID !== IDWITHE)
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWITHE));

          Replace(nID);
          if (bCoderHighLightIsRunning && sWith != '')
            AkelPad.Call("Coder::HighLight", 2, "#FFFFFF", "#FF0080", 1, 0, 96, sWith);

          Find(2);
        }
        if (wParam === 0x50/*VK_KEY_P*/)
        {
          AkelPad.Command(4200);
          Find(1);
        }
        if (wParam === 186/*VK_OEM_1*/)
        {
          AkelPad.SetSel(AkelPad.GetSelStart(), AkelPad.GetSelStart());
          if (AkelPad.GetSelText() === '')
          {
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWHATE));
            SendDlgItemMessage(hWnd, IDWHATE, 3044 /*AEM_KEYDOWN*/, 0x23 /*VK_END*/);
          }
          AkelPad.Command(4333);
        }
      }
      else if (! Alt() && Ctrl() && Shift())
      {
        if ((wParam === 72/*VK_KEY_H*/)) { Find(14); /* first */ }
        if ((wParam === 74/*VK_KEY_J*/)) { Find(11); /* next */  }
        if ((wParam === 75/*VK_KEY_K*/)) { Find(12); /* previous */ }
        if ((wParam === 76/*VK_KEY_L*/)) { Find(13); /* last */ }
        if ((wParam === 0x42/*VK_KEY_L*/)) { BookmarkLines(false); /* last */ }
        if ((wParam === 0x0D/*VK_RETURN*/))
        {
          if (nID !== IDWHATE)
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWHATE));

          Find(2); /* previous */
        }
        if (wParam === 0x52/*VK_KEY_R*/)
        {
      	  if (nID !== IDWITHE)
      	    oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWITHE));

      	  AkelPad.TextReplace(0, sWhat, sWith, 0x200001 /*FRF_DOWN|FRF_BEGINNING*/, 0x1);
      	  //AkelPad.TextReplace(0, "FindIt2", "ReplaceWith2", 0x280001 /*FRF_DOWN|FRF_BEGINNING|FRF_REGEXP*/, 0x1);
      	  //AkelPad.TextReplace(0, "FindIt1", "ReplaceWith1", 0x280001 /*FRF_DOWN|FRF_BEGINNING|FRF_REGEXP*/, true);

      	  if (bCoderHighLightIsRunning && sWith)
      	    AkelPad.Call("Coder::HighLight", 2, "#FFFFFF", "#FF0080", 1, 0, 96, sWith);

      	  Find(1);
      	  AkelPad.SetSel(AkelPad.GetSelStart(), AkelPad.GetSelStart());

          if (AkelPad.GetSelText() === '')
          {
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWHATE));
            SendDlgItemMessage(hWnd, IDWHATE, 3044 /*AEM_KEYDOWN*/, 0x23 /*VK_END*/);
          }

          AkelPad.Command(4333);
      	}
        if (wParam === 0x55/*VK_KEY_U*/)
        {
          nIDTemp = nID;
          AkelPad.Call("Scripts::Main", 1, "UndoMax.js", "2");
          oSys.Call("user32::SetFocus", GetDlgItem(hDlg, nIDTemp));
        }
        if (wParam === 0x50/*VK_KEY_P*/)
        {
          AkelPad.Command(4199);
          Find(2);
          Find(1);
        }
        if (wParam === 0x46/*VK_KEY_F*/)
        {
          PostMessage(hDlg, 16 /*WM_CLOSE*/, 0, 0);
          AkelPad.Call("Scripts::Main", 1, "FindReplaceFiles_extended.js", "-sWhat='"+ sWhat +"' -sWith='"+ sWith +"'");
        }
        if (wParam === 186/*VK_OEM_1*/)
        {
          AkelPad.SetSel(AkelPad.GetSelStart(), AkelPad.GetSelEnd());
          if (AkelPad.GetSelText() === '')
          {
            oSys.Call("user32::SetFocus", GetDlgItem(hDlg, IDWHATE));
            SendDlgItemMessage(hWnd, IDWITHE, 3044 /*AEM_KEYDOWN*/, 0x23 /*VK_END*/);
          }
          AkelPad.Command(4333);
        }
      }
    }
    else if (Alt()) // Ctrl+Alt
    {
      if (bCoderHighLightIsRunning)
      {
        var strWhat = GetTextAE(IDWHATE) || sWhat;
        if (! Shift())
          AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ strWhat +"'");
        else if (Shift())
          AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-clear=1");
      }
    }
  }
//   else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
//   {
//   }
  else if (uMsg === 123 /*WM_CONTEXTMENU*/)
  {
    nID = GetDlgCtrlID(wParam);

    if ((nID == IDWHATE) || (nID == IDWITHE))
      MenuAE(wParam, nID, LoWord(lParam), HiWord(lParam));
    else if (nID == IDFINDB)
      MenuFind();
  }
  else if (uMsg === 273 /*WM_COMMAND*/)
  {
    nID   = LoWord(wParam);
    nCode = HiWord(wParam);

    if ((nID == IDWHATE) || (nID == IDWITHE))
    {
      if (nCode == 0x0300 /*EN_CHANGE*/)
      {
        if (bBatch)
        {
          if (nID == IDWHATE)
            sBFile = GetTextAE(nID);
        }
        else
        {
          if (nID == IDWHATE)
            sWhat = GetTextAE(nID);
          else
            sWith = GetTextAE(nID);
        }

        EnableButtonsDlg();
      }
    }
    else if (nID == IDMATCH)
      bMatch = ! bMatch;
    else if (nID == IDWORD)
      bWord = ! bWord;
    else if (nID == IDREGEXP)
    {
      bRegExp = ! bRegExp;
      SetColorsAE();
      EnableButtonsDlg();
    }
    else if (nID == IDDOTNL)
      bDotNL = ! bDotNL;
    else if (nID == IDFUNC)
    {
      bFunc = ! bFunc;
      SetColorsAE();
    }
    else if (nID == IDBATCH)
    {
      bBatch = ! bBatch;
      SetColorsAE();

      if (bBatch)
      {
        ReplaceTextAE(IDWHATE, sBFile);
        ReplaceTextAE(IDWITHE, "");

        if (! sBFile)
        {
          MenuBatch();
          SetColorsAE();
        }
      }
      else
      {
        ReplaceTextAE(IDWHATE, sWhat);
        ReplaceTextAE(IDWITHE, sWith);
      }

      EnableButtonsDlg();
    }
    else if (nID == IDLOCKUNDO)
      bLockUndo = ! bLockUndo;
    else if ((nID >= IDFBTC) && (nID <= IDALLDOC))
    {
      nRange = nID - IDFBTC;
      EnableButtonsDlg();
    }
    else if (nID == IDTRANSPNAB)
    {
      bTranspNA = ! bTranspNA;
      SetTransparency(true);
    }
    else if ((nID == IDREPL1B) || (nID == IDREPL2B))
      Replace(nID);
    else if ((nID == IDHISTB) || (nID == IDTEMPLB))
      HistAndTempl(nID == IDHISTB);
    else if (nID == IDFINDB)
    {
      if (nFindDef)
        Find(nFindDef);
      else
        MenuFind();
    }
    else if ((nID == IDCANCEL) || (nID == IDCLOSEB))
      PostMessage(hDlg, 16 /*WM_CLOSE*/, 0, 0);
  }
  else if (uMsg === 276 /*WM_HSCROLL*/)
  {
    if (lParam == GetDlgItem(hDlg, IDTRACKBAR))
    {
      nOpacity = 255 - SendMessage(lParam, 1024 /*TBM_GETPOS*/, 0, 0);
      SetTransparency(true);
    }
  }
  else if (uMsg === 16 /*WM_CLOSE*/)
  {
    if (bCoderHighLightIsRunning)
    {
      AkelPad.Call("Coder::HighLight", 3, 69);
      AkelPad.Call("Coder::HighLight", 3, 96);
    }

    WriteIni();
    AkelPad.WindowUnsubClass(GetDlgItem(hDlg, IDWHATE));
    AkelPad.WindowUnsubClass(GetDlgItem(hDlg, IDWITHE));
    oSys.Call("User32::PostQuitMessage", 0);
    oSys.Call("User32::DestroyWindow", hDlg);
  }

  return 0;
}

function InitDlg()
{
  var lpRECT = AkelPad.MemAlloc(16);
  var i;

  for (i = IDWHATE; i <= IDWITHE; i += 2)
  {
    SendDlgItemMessage(hDlg, i, 3228 /*AEM_SETOPTIONS*/, 2 /*AECOOP_OR*/, 0x10000020 /*AECO_DISABLEBEEP|AECO_DETAILEDUNDO*/);
    SendDlgItemMessage(hDlg, i, 3230 /*AEM_SETNEWLINE*/, 0x3 /*AENL_OUTPUT|AENL_INPUT*/, MkLong(6, 6 /*AELB_N*/));
    SendDlgItemMessage(hDlg, i, 1093 /*EM_SETEVENTMASK*/, 0, 0x1 /*ENM_CHANGE*/);
    SetFontAE(i);
    SetWrapAE(i);
    AkelPad.WindowSubClass(GetDlgItem(hDlg, i), CallbackAE, 36 /*WM_GETMINMAXINFO*/, 532 /*WM_SIZING*/, 562 /*WM_EXITSIZEMOVE*/);
  }

  if (bBatch)
  {
    SetTextAE(IDWHATE, sBFile);
    SetTextAE(IDWITHE, "");
  }
  else
  {
    SetTextAE(IDWHATE, sWhat);
    SetTextAE(IDWITHE, sWith);

    if ((nRange != 2) && (AkelPad.GetSelStart() != AkelPad.GetSelEnd()))
    {
      ReplaceTextAE(IDWHATE, AkelPad.GetSelText());
    }
  }

  SendDlgItemMessage(hDlg, IDMATCH,    241 /*BM_SETCHECK*/, bMatch,    0);
  SendDlgItemMessage(hDlg, IDWORD,     241 /*BM_SETCHECK*/, bWord,     0);
  SendDlgItemMessage(hDlg, IDREGEXP,   241 /*BM_SETCHECK*/, bRegExp,   0);
  SendDlgItemMessage(hDlg, IDDOTNL,    241 /*BM_SETCHECK*/, bDotNL,    0);
  SendDlgItemMessage(hDlg, IDFUNC,     241 /*BM_SETCHECK*/, bFunc,     0);
  SendDlgItemMessage(hDlg, IDBATCH,    241 /*BM_SETCHECK*/, bBatch,    0);
  SendDlgItemMessage(hDlg, IDLOCKUNDO, 241 /*BM_SETCHECK*/, bLockUndo, 0);
  oSys.Call("User32::CheckRadioButton", hDlg, IDFBTC, IDALLDOC, IDFBTC + nRange);
  SetColorsAE();
  EnableButtonsDlg();

  SendDlgItemMessage(hDlg, IDTRANSPNAB, 241 /*BM_SETCHECK*/, bTranspNA, 0);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1030 /*TBM_SETRANGE*/, 0, MkLong(0, 240));
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1047 /*TBM_SETLINESIZEE*/, 0, 10);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1045 /*TBM_SETPAGESIZE*/, 0, 40);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1044 /*TBM_SETTICFREQ*/, 20, 0);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1029 /*TBM_SETPOS*/, 1, 255 - nOpacity);
  SetTransparency(true);

  oSys.Call("User32::GetClientRect", hDlg, lpRECT);
  nScaleX = AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/) / nDlgW;
  nScaleY = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) / nDlgH;
  nDlgW   = AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/);
  nDlgH   = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/);
  oSys.Call("User32::GetWindowRect", hDlg, lpRECT);
  nDlgMinW  = ScaleX(nDlgMinW) + AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 0), 3 /*DT_DWORD*/) - nDlgW;
  nDlgMinH  = ScaleY(nDlgMinH) + AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/) - nDlgH;
  nEditMinW = ScaleX(nEditMinW);
  nEditMinH = ScaleY(nEditMinH);
  nWhatH = ScaleY(nWhatH);
  ResizeDlg();
  AkelPad.MemFree(lpRECT);
}

function CallbackAE(hWnd, uMsg, wParam, lParam)
{
  var lpRECT;
  var nX1, nY1, nX2, nY2;
  var nNY1, nNY2;
  var bSizingWhat;

  if (uMsg == 36 /*WM_GETMINMAXINFO*/)
  {
    AkelPad.MemCopy(_PtrAdd(lParam, 24), nEditMinW, 3 /*DT_DWORD*/); //ptMinTrackSize_x
    AkelPad.MemCopy(_PtrAdd(lParam, 28), nEditMinH, 3 /*DT_DWORD*/); //ptMinTrackSize_y
  }
  else if (uMsg == 532 /*WM_SIZING*/)
  {
    lpRECT = AkelPad.MemAlloc(16);
    oSys.Call("User32::GetWindowRect", hWnd, lpRECT);
    nX1 = AkelPad.MemRead(_PtrAdd(lpRECT,  0), 3 /*DT_DWORD*/);
    nY1 = AkelPad.MemRead(_PtrAdd(lpRECT,  4), 3 /*DT_DWORD*/);
    nX2 = AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/);
    nY2 = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/);
    nNY1 = AkelPad.MemRead(_PtrAdd(lParam,  4), 3 /*DT_DWORD*/);
    nNY2 = AkelPad.MemRead(_PtrAdd(lParam, 12), 3 /*DT_DWORD*/);

    if ((wParam == 6 /*WMSZ_BOTTOM*/) && (nNY2 != nY2))
    {
      bSizingEdit = true;
      if (bSizingWhat = (GetDlgCtrlID(hWnd) == IDWHATE))
        nDlgMinH += nNY2 - nY2;
      oSys.Call("User32::GetWindowRect", hDlg, lpRECT);
      nDlgW = AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 0), 3 /*DT_DWORD*/);
      nDlgH = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/) + nNY2 - nY2;
      oSys.Call("User32::SetWindowPos", hDlg, 0, 0, 0, nDlgW, nDlgH, 0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);
      oSys.Call("User32::GetClientRect", hDlg, lpRECT);
      nDlgW = AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/);
      nDlgH = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/);
      ResizeDlg(bSizingWhat, nX2 - nX1, nNY2 - nNY1);
      bSizingEdit = false;
    }
    else
    {
      AkelPad.MemCopy(_PtrAdd(lParam,  0), nX1, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lParam,  4), nY1, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lParam,  8), nX2, 3 /*DT_DWORD*/);
      AkelPad.MemCopy(_PtrAdd(lParam, 12), nY2, 3 /*DT_DWORD*/);
    }

    AkelPad.MemFree(lpRECT);
  }
  else if (uMsg == 562 /*WM_EXITSIZEMOVE*/)
    //bug in WinXP - set z-order
    oSys.Call("User32::SetWindowPos", hWnd, GetDlgItem(hDlg, GetDlgCtrlID(hWnd) - 1), 0, 0, 0, 0, 0x13 /*SWP_NOACTIVATE|SWP_NOMOVE|SWP_NOSIZE*/);

  return 0;
}

function LoWord(nDwNum)
{
  return nDwNum & 0xFFFF;
}

function HiWord(nDwNum)
{
  return (nDwNum >> 16) & 0xFFFF;
}

function MkLong(nLoWord, nHiWord)
{
  return (nLoWord & 0xFFFF) | (nHiWord << 16);
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

function SendMessage(hWnd, uMsg, wParam, lParam)
{
  return AkelPad.SendMessage(hWnd, uMsg, wParam, lParam);
}

function PostMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::PostMessageW", hWnd, uMsg, wParam, lParam);
}

function SendDlgItemMessage(hWnd, nID, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendDlgItemMessageW", hWnd, nID, uMsg, wParam, lParam);
}

function GetDlgItem(hWnd, nID)
{
  return oSys.Call("User32::GetDlgItem", hWnd, nID);
}

function GetDlgCtrlID(hWnd)
{
  return oSys.Call("User32::GetDlgCtrlID", hWnd);
}

function GetTextAE(nID)
{
  var sText;
  AkelPad.SetEditWnd(GetDlgItem(hDlg, nID));
  sText = AkelPad.GetTextRange(0, -1, 2 /*\n*/);
  AkelPad.SetEditWnd(0);
  return sText;
}

function SetTextAE(nID, sText)
{
  var lpText = AkelPad.MemAlloc((sText.length + 1) * 2);
  AkelPad.MemCopy(lpText, sText, 1 /*DT_UNICODE*/, sText.length);
  SendDlgItemMessage(hDlg, nID, 3026 /*AEM_SETTEXTW*/, sText.length, lpText);
  AkelPad.MemFree(lpText);
}

function ReplaceTextAE(nID, sText)
{
  if (bBatch && (nID == IDWHATE))
    SendDlgItemMessage(hDlg, nID, 3228 /*AEM_SETOPTIONS*/, 4 /*AECOOP_XOR*/, 1 /*AECO_READONLY*/);

  SendDlgItemMessage(hDlg, nID, 177 /*EM_SETSEL*/, 0, -1);
  AkelPad.SetEditWnd(GetDlgItem(hDlg, nID));
  AkelPad.ReplaceSel(sText);
  AkelPad.SetEditWnd(0);
  SendDlgItemMessage(hDlg, nID, 177 /*EM_SETSEL*/, 0, 0);

  if (bBatch && (nID == IDWHATE))
    SendDlgItemMessage(hDlg, nID, 3228 /*AEM_SETOPTIONS*/, 2 /*AECOOP_OR*/, 1 /*AECO_READONLY*/);
}

function SetFontAE(nID)
{
  var bFont = (nID == IDWHATE) ? bFont1 : bFont2;
  var hFont = bFont ? SendMessage(hMainWnd, 1233 /*AKD_GETFONTW*/, 0, 0) : hGuiFont;
  SendDlgItemMessage(hDlg, nID, 48 /*WM_SETFONT*/, hFont, 0);
  oSys.Call("User32::InvalidateRect", GetDlgItem(hDlg, nID), 0, 1);
}

function SetWrapAE(nID)
{
  var bWrap = (nID == IDWHATE) ? bWrap1 : bWrap2;
  SendDlgItemMessage(hDlg, nID, 3242 /*AEM_SETWORDWRAP*/, bWrap ? 2 /*AEWW_SYMBOL*/ : 0 /*AEWW_NONE*/, 0);
}

function SetColorsAE()
{
  var nColorBk1;
  var nColorBk2;

  if (bBatch)
  {
    SendDlgItemMessage(hDlg, IDWHATS, 12 /*WM_SETTEXT*/, 0, sTxtBatch);
    SendDlgItemMessage(hDlg, IDWHATE, 3228 /*AEM_SETOPTIONS*/, 2 /*AECOOP_OR*/, 1 /*AECO_READONLY*/);
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDWITHS), 0);
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDWITHE), 0);

    nColorBk1 = 0x980098;
    nColorBk2 = oSys.Call("User32::GetSysColor", 15 /*COLOR_BTNFACE*/);
  }
  else
  {
    SendDlgItemMessage(hDlg, IDWHATS, 12 /*WM_SETTEXT*/, 0, sTxtWhat);
    SendDlgItemMessage(hDlg, IDWHATE, 3228 /*AEM_SETOPTIONS*/, 4 /*AECOOP_XOR*/, 1 /*AECO_READONLY*/);
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDWITHS), 1);
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDWITHE), 1);

    nColorBk1 = bRegExp ? 0x586bad : oSys.Call("User32::GetSysColor", 5 /*COLOR_WINDOW*/);
    nColorBk2 = bFunc   ? 0x888888 : nColorBk1;
  }

  SendDlgItemMessage(hDlg, IDWHATE, 1091 /*EM_SETBKGNDCOLOR*/, 0, nColorBk1);
  SendDlgItemMessage(hDlg, IDWITHE, 1091 /*EM_SETBKGNDCOLOR*/, 0, nColorBk2);
}

function IsLineBoard()
{
  return AkelPad.IsPluginRunning("LineBoard::Main");
}

function EnableButtonsDlg()
{
  var hEditWnd = AkelPad.GetEditWnd();

  if ((! IsLineBoard()) && (nRange == 3))
  {
    nRange = 4;
    oSys.Call("User32::CheckRadioButton", hDlg, IDFBTC, IDALLDOC, IDFBTC + nRange);
  }

  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDMATCH),    (! bBatch));
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDWORD),     (! bBatch));
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDREGEXP),   (! bBatch));
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDDOTNL),    (! bBatch) && bRegExp);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDFUNC),     (! bBatch));
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDLOCKUNDO), bBatch);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDBOOK),     IsLineBoard());
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDREPL1B),   hEditWnd && sWhat.length && (nRange < 5) && (! bBatch));
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDREPL2B),   hEditWnd && (sWhat.length && (! bBatch) || sBFile.length && bBatch));
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDFINDB),    hEditWnd && sWhat.length && (! bBatch));
}

function SetDefPushButton(nID)
{
  for (var i = IDREPL1B; i <= IDCLOSEB; ++i)
    SendDlgItemMessage(hDlg, i, 244 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 1);

  if (nID)
    SendDlgItemMessage(hDlg, nID, 244 /*BM_SETSTYLE*/, 1 /*BS_DEFPUSHBUTTON*/, 1);
}

function SetHotKeys(bSet)
{
  var i;

  if (bSet)
  {
    for (i = 0; i < aHotKey.length; ++i)
      oSys.Call("User32::RegisterHotKey", hDlg, i, aHotKey[i][0], aHotKey[i][1]);
  }
  else
  {
    for (i = 0; i < aHotKey.length; ++i)
      oSys.Call("User32::UnregisterHotKey", hDlg, i);
  }
}

function SetTransparency(bDlgActive)
{
  var nExStyle  = oSys.Call("User32::GetWindowLongW", hDlg, -20 /*GWL_EXSTYLE*/);
  var nAlphaCur = -1;
  var nAlphaNew = -1;
  var lpAlpha;

  if (nExStyle & 0x00080000 /*WS_EX_LAYERED*/)
  {
    lpAlpha = AkelPad.MemAlloc(1);
    oSys.Call("User32::GetLayeredWindowAttributes", hDlg, 0, lpAlpha, 0);
    nAlphaCur = AkelPad.MemRead(lpAlpha, 5 /*DT_BYTE*/);
    AkelPad.MemFree(lpAlpha);
  }

  if (bTranspNA && bDlgActive)
  {
    if (nAlphaCur >= 0)
      nAlphaNew = 255;
  }
  else if ((nAlphaCur < 0) && (nOpacity < 255) || (nAlphaCur >= 0) && (nAlphaCur != nOpacity))
    nAlphaNew = nOpacity;

  if (nAlphaNew >= 0)
  {
    oSys.Call("User32::SetWindowLongW", hDlg, -20 /*GWL_EXSTYLE*/, nExStyle | 0x00080000 /*WS_EX_LAYERED*/);
    oSys.Call("User32::SetLayeredWindowAttributes", hDlg, 0, nAlphaNew, 2 /*LWA_ALPHA*/);
    oSys.Call("User32::UpdateWindow", hDlg);
  }
}

function ScaleX(n)
{
  return Math.round(n * nScaleX);
}

function ScaleY(n)
{
  return Math.round(n * nScaleY);
}

function ScaleUX(n)
{
  return Math.round(n / nScaleX);
}

function ScaleUY(n)
{
  return Math.round(n / nScaleY);
}

function ResizeDlg(bSizingWhat, nW, nH)
{
  var lpRECT = AkelPad.MemAlloc(16);
  var nEditW, nWithH;
  var i;

  if (bSizingEdit)
  {
    nEditW = nW;

    if (bSizingWhat)
    {
      oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDWITHE), lpRECT);
      nWhatH = nH;
      nWithH = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/);
    }
    else
    {
      oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDWHATE), lpRECT);
      nWithH = nH;
      nWhatH = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/);
    }
  }
  else
  {
    nEditW = nDlgW - ScaleX(55);
    nWithH = nDlgH - nWhatH - ScaleY(203);
  }

  AkelPad.MemFree(lpRECT);

  oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDWHATE), 0,
    0,
    0,
    nEditW,
    nWhatH,
    0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);
  oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDWITHS), 0,
    ScaleX(10),
    nWhatH + ScaleY(19),
    0,
    0,
    0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);
  oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDWITHE), 0,
    ScaleX(45),
    nWhatH + ScaleY(15),
    nEditW,
    nWithH,
    0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  for (i = IDMATCH; i <= IDLOCKUNDO; ++i)
    oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, i), 0,
      ScaleX(((i == IDDOTNL) || (i == IDLOCKUNDO)) ? 27 : 10),
      nWhatH + nWithH + ScaleY(25) + ScaleY((i - IDMATCH) * 20),
      0,
      0,
      0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);
  oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDRANGE), 0,
    ScaleX(160),
    nWhatH + nWithH + ScaleY(23),
    0,
    0,
    0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);
  for (i = IDFBTC; i <= IDALLDOC; ++i)
    oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, i), 0,
      ScaleX(170),
      nWhatH + nWithH + ScaleY(40) + ScaleY((i - IDFBTC) * 20),
      0,
      0,
      0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);
  oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDTRACKBAR), 0,
    ScaleX(10),
    nDlgH - ScaleY(30),
    0,
    0,
    0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);
  oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDTRANSPNAB), 0,
    ScaleX(85),
    nDlgH - ScaleY(26),
    0,
    0,
    0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);
  for (i = IDREPL1B; i <= IDCLOSEB; ++i)
    oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, i), 0,
      nDlgW - ScaleX(100),
      nWhatH + nWithH + ScaleY(45) + ScaleY((i - IDREPL1B) * 25),
      0,
      0,
      0x15 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);

  oSys.Call("user32::InvalidateRect", hDlg, 0, 1);
}

function PaintSizeGrip()
{
  var lpPAINT = AkelPad.MemAlloc(_X64 ? 72 : 64 /*PAINTSTRUCT*/);
  var lpRECT  = AkelPad.MemAlloc(16);
  var hDC;

  if (hDC = oSys.Call("User32::BeginPaint", hDlg, lpPAINT))
  {
    oSys.Call("User32::GetClientRect", hDlg, lpRECT);
    AkelPad.MemCopy(_PtrAdd(lpRECT, 0), AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/) - oSys.Call("User32::GetSystemMetrics",  2 /*SM_CXVSCROLL*/), 3 /*DT_DWORD*/);
    AkelPad.MemCopy(_PtrAdd(lpRECT, 4), AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) - oSys.Call("User32::GetSystemMetrics", 20 /*SM_CYVSCROLL*/), 3 /*DT_DWORD*/);

    oSys.Call("User32::DrawFrameControl", hDC, lpRECT, 3 /*DFC_SCROLL*/, 0x8 /*DFCS_SCROLLSIZEGRIP*/);
    oSys.Call("User32::EndPaint", hDlg, lpPAINT);
  }

  AkelPad.MemFree(lpPAINT);
  AkelPad.MemFree(lpRECT);
}

function Replace(nID)
{
  var aBatch;
  var hFocus;
  var lpFrameStart;
  var lpFrameCurr;
  var lpFrameEnd;
  var aDoc;
  var sMsg;
  var sFlags;
  var nCount;
  var nCountAll;
  var nRange1;
  var nRange2;
  var nMsgType;
  var hEditWnd;
  var lpCaret;
  var lpSelect;
  var lpPoint64;
  var nSelStart;
  var nSelEnd;
  var nCaretPos;
  var bChanged;
  var nTextLen;
  var i, n;

  if (bBatch)
  {
    aBatch = GetBatch();

    if (! aBatch.length)
      return;

    if (bLockUndo)
    {
      lpFrameStart = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 1 /*FWF_CURRENT*/, 0);
      lpFrameCurr  = lpFrameStart;

      do
      {
        if (SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 15 /*FI_MODIFIED*/, lpFrameCurr) || (! SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 33 /*FI_FILELEN*/, lpFrameCurr)))
        {
          AkelPad.MessageBox(hDlg, sTxtSaveDocs, sTxtDlgTitle, 0x30 /*MB_ICONWARNING*/);
          return;
        }
      }
      while ((nRange == 5) && ((lpFrameCurr = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 2 /*FWF_NEXT*/, lpFrameCurr)) != lpFrameStart));
    }
  }
  else
  {
    sFlags = "";
    if (! bMatch)        sFlags += "i";
    if (bWord)           sFlags += "w";
    if (bRegExp)         sFlags += "r";
    if (! bDotNL)        sFlags += "n";
    if (bFunc)           sFlags += "f";
    if (nID == IDREPL2B) sFlags += "g";
  }

  if ((nRange == 5) && (SendMessage(hMainWnd, 1291 /*AKD_FRAMESTATS*/, 0 /*FWS_COUNTALL*/, 0) > 1) &&
      (AkelPad.MessageBox(hDlg, sTxtAreYouSure, sTxtDlgTitle, 0x21 /*MB_OKCANCEL|MB_ICONQUESTION*/) != 1 /*IDOK*/))
    return;

  hFocus       = oSys.Call("User32::GetFocus");
  lpFrameStart = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 1 /*FWF_CURRENT*/, 0);
  lpFrameCurr  = lpFrameStart;
  lpFrameEnd   = lpFrameStart;
  aDoc         = [];
  sMsg         = "";
  nCountAll    = 0;

  if (nRange < 4)
    nRange1 = -(nRange + 1);

  if (nID == IDREPL2B)
  {
    for (i = IDWHATS; i <= IDCLOSEB; ++i)
      oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, i), 0);
  }

  do
  {
    hEditWnd  = AkelPad.GetEditWnd();
    lpCaret   = AkelPad.MemAlloc(_X64 ? 24 : 12 /*AECHARINDEX)*/);
    lpSelect  = AkelPad.MemAlloc(_X64 ? 56 : 32 /*AESELECTION)*/);
    lpPoint64 = AkelPad.MemAlloc(_X64 ? 16 : 8);
    SendMessage(hEditWnd, 3125 /*AEM_GETSEL*/, lpCaret, lpSelect);
    SendMessage(hEditWnd, 3179 /*AEM_GETSCROLLPOS*/, 0, lpPoint64);

    if (bBatch)
    {
      nCount    = 0;
      bChanged  = false;
      nSelStart = AkelPad.GetSelStart();
      nSelEnd   = AkelPad.GetSelEnd();
      nCaretPos = SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpCaret);
      nTextLen  = SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 2 /*AEGI_LASTCHAR*/, 0);

      if (bLockUndo)
      {
        SendMessage(hEditWnd, 3079 /*AEM_EMPTYUNDOBUFFER*/, 0, 0);
        SendMessage(hEditWnd, 3083 /*AEM_LOCKCOLLECTUNDO*/, 1, 0);
      }
      else
      {
        SendMessage(hEditWnd, 3080 /*AEM_STOPGROUPTYPING*/, 0, 0);
        SendMessage(hEditWnd, 3081 /*AEM_BEGINUNDOACTION*/, 0, 0);
      }

      SendMessage(hEditWnd, 3185 /*AEM_LOCKSCROLL*/, 3 /*SB_BOTH*/, 1);
      SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 0, 0);
      SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 0, 0);

      for (i = 0; i < aBatch.length; ++i)
      {
        if (aBatch[i][0])
        {
          if (nRange == 0)
          {
            nCaretPos -= nTextLen - (nTextLen = SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 2 /*AEGI_LASTCHAR*/, 0));
            AkelPad.SetSel(nCaretPos, nCaretPos);
          }
          else if (nRange == 1)
            AkelPad.SetSel(nCaretPos, nCaretPos);
          else if (nRange == 2)
          {
            nSelEnd -= nTextLen - (nTextLen = SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 2 /*AEGI_LASTCHAR*/, 0));
            AkelPad.SetSel(nSelStart, nSelEnd);
          }

          n = TextReplace(aBatch[i][0], aBatch[i][1], aBatch[i][2], nRange1, nRange2);

          if ((n instanceof Error) || (n < 0))
          {
            nCount = n;
            sMsg  += sTxtBatchErr + (i + 1) + ".\n";
            break;
          }

          if (n > 0)
          {
            nCount  += n;
            bChanged = true;
          }
        }
      }

      if (bLockUndo)
        SendMessage(hEditWnd, 3083 /*AEM_LOCKCOLLECTUNDO*/, 0, 0);
      else
      {
        SendMessage(hEditWnd, 3082 /*AEM_ENDUNDOACTION*/, 0, 0);
        SendMessage(hEditWnd, 3080 /*AEM_STOPGROUPTYPING*/, 0, 0);
      }

      SendMessage(hEditWnd, 3185 /*AEM_LOCKSCROLL*/, 3 /*SB_BOTH*/, 0);
      SendMessage(hEditWnd, 3376 /*AEM_UPDATESCROLLBAR*/, 3 /*SB_BOTH*/, 0);

      if ((nCount instanceof Error) || (nCount <= 0))
      {
        if (bChanged)
        {
          if (bLockUndo)
          {
            SendMessage(hEditWnd, 3087 /*AEM_SETMODIFY*/, 0, 0);
            AkelPad.Command(4104 /*IDM_FILE_REOPEN*/);
          }
          else
            SendMessage(hEditWnd, 3077 /*AEM_UNDO*/, 0, 0);
        }

        SendMessage(hEditWnd, 3132 /*AEM_INDEXUPDATE*/, 0, lpCaret);
        SendMessage(hEditWnd, 3132 /*AEM_INDEXUPDATE*/, 0, lpSelect);
        SendMessage(hEditWnd, 3132 /*AEM_INDEXUPDATE*/, 0, _PtrAdd(lpSelect, _X64 ? 24 : 12));
        SendMessage(hEditWnd, 3126 /*AEM_SETSEL*/, lpCaret, lpSelect);
        SendMessage(hEditWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);
      }
      else
      {
        SendMessage(hEditWnd, 3087 /*AEM_SETMODIFY*/, 1, 0);
        SendMessage(hEditWnd, 3183 /*AEM_SCROLLTOPOINT*/, 0, 0 /*scroll to caret*/);
      }

      SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 1, 0);
      SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 1, 0);
      oSys.Call("User32::InvalidateRect", hMainWnd, 0, 1);
      oSys.Call("User32::InvalidateRect", hEditWnd, 0, 1);
    }
    else
      nCount = TextReplace(sWhat, sWith, sFlags, nRange1, nRange2);

    if ((nCount instanceof Error) || (nCount <= 0))
    {
      AkelPad.MemFree(lpCaret);
      AkelPad.MemFree(lpSelect);
      AkelPad.MemFree(lpPoint64);

      if (nCount != 0)
      {
        if (nCount instanceof Error)
        {
          sMsg += sTxtRunTimeErr + "\n" + nCount.description;
          if (! bBatch)
            hFocus = GetDlgItem(hDlg, IDWITHE);
        }
        else if (nCount == -13)
        {
          sMsg += sTxtNoFuncErr;
          if (! bBatch)
            hFocus = GetDlgItem(hDlg, IDWITHE);
        }
        else if (nCount == -14)
        {
          sMsg += sTxtNoTextErr;
          if (! bBatch)
            hFocus = GetDlgItem(hDlg, IDWITHE);
        }
        else if (nCount <= -100)
        {
          sMsg += sTxtRegExpErr;
          if (! bBatch)
          {
            hFocus = GetDlgItem(hDlg, IDWHATE);
            SendDlgItemMessage(hDlg, IDWHATE, 177 /*EM_SETSEL*/, -nCount - 100, -1);
          }
        }

        nMsgType = 0x10 /*MB_ICONERROR*/;
        break;
      }
    }
    else
    {
      nCountAll += nCount;
      lpFrameEnd = lpFrameCurr;
      aDoc.push([lpFrameCurr, lpCaret, lpSelect, lpPoint64]);
    }
  }
  while ((nRange == 5) && ((lpFrameCurr = SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0x10 /*FWA_NEXT*/, lpFrameCurr)) != lpFrameStart));

  if (nID == IDREPL2B)
  {
    for (i = IDWHATS; i <= IDCLOSEB; ++i)
      oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, i), 1);

    SetColorsAE();
    EnableButtonsDlg();
  }

  oSys.Call("User32::SetFocus", hFocus);

  if ((typeof nCount == "number") && (nCount >= 0))
  {
    SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameEnd);
    nMsgType = 0x40 /*MB_ICONINFORMATION*/;

    if ((nRange == 5) && (nCountAll > 0))
      sMsg += sTxtChangedDocs + aDoc.length + "\n";
    if ((nID == IDREPL1B) && (nCountAll == 0) || (nID == IDREPL2B))
      sMsg += sTxtCountChanges + nCountAll;

    //add to history
    if ((nCountAll > 0) && (nHistLen > 0))
    {
      if (bBatch)
      {
        for (i = 0; i < aHist.length; ++i)
        {
          if ((aHist[i][0].toLowerCase() == sBFile.toLowerCase()) && (aHist[i][2] == "b"))
          {
            aHist.splice(i, 1);
            break;
          }
        }

        aHist.unshift([sBFile, "", "b"]);
      }
      else
      {
        sFlags = sFlags.replace("g", "");

        for (i = 0; i < aHist.length; ++i)
        {
          if ((aHist[i][0] == sWhat) && (aHist[i][1] == sWith) && (aHist[i][2] == sFlags))
          {
            aHist.splice(i, 1);
            break;
          }
        }

        aHist.unshift([sWhat, sWith, sFlags]);
      }

      if (aHist.length > nHistLen)
        aHist.length = nHistLen;
    }
  }
  else
  {
    for (i = aDoc.length - 1; i >= 0; --i)
    {
      SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, aDoc[i][0]);

      hEditWnd = AkelPad.GetEditWnd();

      if (bBatch && bLockUndo)
      {
        SendMessage(hEditWnd, 3087 /*AEM_SETMODIFY*/, 0, 0);
        AkelPad.Command(4104 /*IDM_FILE_REOPEN*/);
      }
      else
        SendMessage(hEditWnd, 3077 /*AEM_UNDO*/, 0, 0);

      SendMessage(hEditWnd, 3132 /*AEM_INDEXUPDATE*/, 0, aDoc[i][1]);
      SendMessage(hEditWnd, 3132 /*AEM_INDEXUPDATE*/, 0, aDoc[i][2]);
      SendMessage(hEditWnd, 3132 /*AEM_INDEXUPDATE*/, 0, _PtrAdd(aDoc[i][2], _X64 ? 24 : 12));
      SendMessage(hEditWnd, 3126 /*AEM_SETSEL*/, aDoc[i][1], aDoc[i][2]);
      SendMessage(hEditWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, aDoc[i][3]);
    }

    SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameStart);
  }

  for (i = 0; i < aDoc.length; ++i)
  {
    for (n = 1; n < aDoc[i].length; ++n)
      AkelPad.MemFree(aDoc[i][n]);
  }

  if (sMsg.length)
    AkelPad.MessageBox(hDlg, sMsg, sTxtDlgTitle, nMsgType);
}

function GetBatch()
{
  var sBFileFull = AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/) + "\\" + sBFile;
  var aBatch;
  var bEmpty;
  var i;

  if (! oFSO.FileExists(sBFileFull))
  {
    AkelPad.MessageBox(hDlg, sBFileFull + "\n\n" + sTxtFileNotExist, sTxtBatchRepl.replace("&", ""), 0x40 /*MB_ICONINFORMATION*/);
    MenuBatch();
    return [];
  }

  aBatch = AkelPad.ReadFile(sBFileFull, 0x10 /*ADT_NOMESSAGES*/, 1200 /*UTF-16LE*/, 1).split("\r\n");
  bEmpty = true;

  for (i = 0; i < aBatch.length; ++i)
  {
    aBatch[i] = aBatch[i].split("\t", 3);

    if (aBatch[i][0])
    {
      bEmpty = false;

      if (aBatch[i].length < 2)
        aBatch[i][1] = "";
      if (aBatch[i].length < 3)
        aBatch[i][2] = "";

      aBatch[i][2] += "bg";
    }
  }

  if (bEmpty)
  {
    AkelPad.MessageBox(hDlg, sBFileFull + "\n\n" + sTxtFileNoData, sTxtBatchRepl.replace("&", ""), 0x40 /*MB_ICONINFORMATION*/);
    aBatch.length = 0;
  }

  return aBatch;
}

function HistAndTempl(bHist)
{
  var aSel = [[IDWHATE, AkelPad.MemAlloc(_X64 ? 24 : 12 /*AECHARINDEX*/), AkelPad.MemAlloc(_X64 ? 56 : 32 /*AESELECTION*/), AkelPad.MemAlloc(_X64 ? 16 : 8 /*POINT64*/)],
              [IDWITHE, AkelPad.MemAlloc(_X64 ? 24 : 12 /*AECHARINDEX*/), AkelPad.MemAlloc(_X64 ? 56 : 32 /*AESELECTION*/), AkelPad.MemAlloc(_X64 ? 16 : 8 /*POINT64*/)]];

  var lpRECT     = AkelPad.MemAlloc(16);
  var sWhatHT    = sWhat;
  var sWithHT    = sWith;
  var sBFileHT   = sBFile;
  var bSaveTempl = false;
  var IDLIST     = 2000;
  var IDMENUB    = 2001;
  var IDOKB      = 2002;
  var IDCANCELB  = 2003;
  var sTitleHT;
  var aHotKeyHT;
  var aTempl;
  var sTempl;
  var hWndHT;
  var nX, nY, nW, nBX;
  var i, n;

  oSys.Call("User32::SetFocus", GetDlgItem(hDlg, bHist ? IDHISTB : IDTEMPLB));
  SetDefPushButton(bHist ? IDHISTB : IDTEMPLB);

  oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDMATCH), lpRECT);
  oSys.Call("User32::ScreenToClient", hDlg, _PtrAdd(lpRECT, 8));
  nX = ScaleUX(AkelPad.MemRead(_PtrAdd(lpRECT, 8), 3 /*DT_DWORD*/));
  oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDWITHE), lpRECT);
  oSys.Call("User32::ScreenToClient", hDlg, _PtrAdd(lpRECT, 0));
  oSys.Call("User32::ScreenToClient", hDlg, _PtrAdd(lpRECT, 8));
  nY  = ScaleUY(AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) + 5);
  nW  = ScaleUX(AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/)) - nX;
  nBX = Math.round((nW - 70 * 3 - 10) / 2);
  AkelPad.MemFree(lpRECT);

  for (i = 0; i < 2; ++i)
  {
    SendDlgItemMessage(hDlg, aSel[i][0], 3125 /*AEM_GETSEL*/, aSel[i][1], aSel[i][2]);
    SendDlgItemMessage(hDlg, aSel[i][0], 3179 /*AEM_GETSCROLLPOS*/, 0, aSel[i][3]);
    SendDlgItemMessage(hDlg, aSel[i][0], 3081 /*AEM_BEGINUNDOACTION*/, 0, 0);
  }

  if (bHist)
  {
    sTitleHT  = sTxtHistory.replace("&", "");
    aHotKeyHT = [[0x0,                       0x70 /*VK_F1*/,     MenuHT],
                 [0x1 /*MOD_ALT*/,           0x2E /*VK_DELETE*/, RemoveHist],
                 [0x5 /*MOD_SHIFT|MOD_ALT*/, 0x2E /*VK_DELETE*/, ClearHist]];
  }
  else
  {
    sTitleHT  = sTxtTemplates.replace("&", "");
    aTempl    = AkelPad.ReadFile(WScript.ScriptFullName.replace(/\.js$/i, "_templ.tsv"), 0x10 /*ADT_NOMESSAGES*/, 1200 /*UTF-16LE*/, 1).split("\r\n");
    aHotKeyHT = [[0x0,             0x70 /*VK_F1*/,     MenuHT],
                 [0x0,             0x2D /*VK_INSERT*/, AddTempl],
                 [0x0,             0x71 /*VK_F2*/,     RenameTempl],
                 [0x1 /*MOD_ALT*/, 0x26 /*VK_UP*/,     UpTempl],
                 [0x1 /*MOD_ALT*/, 0x28 /*VK_DOWN*/,   DownTempl],
                 [0x1 /*MOD_ALT*/, 0x2E /*VK_DELETE*/, RemoveTempl]];
  }

  oSys.Call("User32::EnableWindow", hMainWnd, 0);

  //0x50000000=WS_VISIBLE|WS_CHILD
  //0x50000001=WS_VISIBLE|WS_CHILD|BS_DEFPUSHBUTTON
  //0x50A10181=WS_VISIBLE|WS_CHILD|WS_BORDER|WS_VSCROLL|WS_TABSTOP|LBS_NOINTEGRALHEIGHT|LBS_USETABSTOPS|LBS_NOTIFY
  //0x90C80040=WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|DS_SETFONT
  AkelPad.CreateDialog(0, sClass, sTitleHT, 0x90C80040, nX, nY, nW, 208, hDlg, CallbackHT, 0x3 /*CDF_PIXELS|CDF_MODAL*/, 0, 0, "", 0, 0, "|",
    // Class,     Title,              Style,              X,   Y,       W,   H, ID,        lParam
    0, "LISTBOX", "",                 0x50A10181,         5,   5, nW - 10, 170, IDLIST,    0, "|",
    0, "BUTTON",  sTxtMenu + " (F1)", 0x50000000,       nBX, 180,      70,  23, IDMENUB,   0, "|",
    0, "BUTTON",  sTxtOK,             0x50000001, nBX +  75, 180,      70,  23, IDOKB,     0, "|",
    0, "BUTTON",  sTxtCancel,         0x50000000, nBX + 150, 180,      70,  23, IDCANCELB, 0);

  oSys.Call("User32::EnableWindow", hMainWnd, 1);

  for (i = 0; i < 2; ++i)
  {
    SendDlgItemMessage(hDlg, aSel[i][0], 3082 /*AEM_ENDUNDOACTION*/, 0, 0);

    for (n = 1; n < 4; ++n)
      AkelPad.MemFree(aSel[i][n]);
  }

  if (bHist)
    aHist.shift();
  else if (bSaveTempl)
  {
    sTempl = "";

    if (aTempl.length > 1)
    {
      for (i = 1; i < aTempl.length; ++i)
        sTempl += aTempl[i].join("\t") + "\r\n";

      sTempl = sTempl.substr(0, sTempl.length - 2);
    }

    AkelPad.WriteFile(WScript.ScriptFullName.replace(/\.js$/i, "_templ.tsv"), sTempl, sTempl.length, 1200 /*UTF-16LE*/, 1, 0x1 /*WFF_WRITEREADONLY*/);
  }

  function CallbackHT(hWnd, uMsg, wParam, lParam)
  {
    var nID, nCode;

    if (uMsg == 272 /*WM_INITDIALOG*/)
    {
      hWndHT = hWnd;
      InitHT();
    }
    else if (uMsg == 6 /*WM_ACTIVATE*/)
      SetHotKeysHT(LoWord(wParam));
    else if (uMsg == 786 /*WM_HOTKEY*/)
    {
      if (oSys.Call("User32::GetFocus") == GetDlgItem(hWndHT, IDLIST))
        aHotKeyHT[wParam][2]();
    }
    else if (uMsg == 123 /*WM_CONTEXTMENU*/)
    {
      if (wParam == GetDlgItem(hWndHT, IDLIST))
        MenuHT(LoWord(lParam), HiWord(lParam));
      else if (wParam == GetDlgItem(hWndHT, IDMENUB))
        MenuHT();
    }
    else if (uMsg == 273 /*WM_COMMAND*/)
    {
      nID   = LoWord(wParam);
      nCode = HiWord(wParam);

      if (nID == IDLIST)
      {
        if (nCode == 1 /*LBN_SELCHANGE*/)
          SetHTToDlg();
        else if (nCode == 2 /*LBN_DBLCLK*/)
          PostMessage(hWndHT, 16 /*WM_CLOSE*/, 0, 0);
      }
      else if (nID == IDMENUB)
        MenuHT();
      else if (nID == IDOKB)
        PostMessage(hWndHT, 16 /*WM_CLOSE*/, 0, 0);
      else if ((nID == IDCANCEL) || (nID == IDCANCELB))
      {
        SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, 0, 0);
        SetHTToDlg();
        PostMessage(hWndHT, 16 /*WM_CLOSE*/, 0, 0);
      }
    }
    else if (uMsg == 16 /*WM_CLOSE*/)
    {
      if (bBatch)
      {
        sWhat = sWhatHT;
        sWith = sWithHT;
      }
      else
        sBFile = sBFileHT;

      oSys.Call("User32::EndDialog", hWndHT, 0);
    }

    return 0;
  }

  function InitHT()
  {
    var lpTabStops;
    var i;

    if (bHist)
    {
      lpTabStops = AkelPad.MemAlloc(4);
      AkelPad.MemCopy(lpTabStops, 16, 3 /*DT_DWORD*/);
      SendDlgItemMessage(hWndHT, IDLIST, 402 /*LB_SETTABSTOPS*/, 1, lpTabStops);
      AkelPad.MemFree(lpTabStops);

      aHist.unshift([bBatch ? sBFile : sWhat, bBatch ? "" : sWith, (bFunc ? "f" : "") + (bMatch ? "" : "i") + (bDotNL ? "" : "n") + (bRegExp ? "r" : "") + (bWord ? "w" : "") + (bBatch ? "b" : "")]);
      SendDlgItemMessage(hWndHT, IDLIST, 384 /*LB_ADDSTRING*/, 0, "");

      for (i = 1; i < aHist.length; ++i)
        SendDlgItemMessage(hWndHT, IDLIST, 384 /*LB_ADDSTRING*/, 0, i.toString() + "\t" + aHist[i][0].substr(0, 128).replace(/[\0\s]+/g, " "));
    }
    else
    {
      for (i = aTempl.length - 1; i >= 0; --i)
      {
        aTempl[i] = aTempl[i].split("\t", 4);

        if ((aTempl[i].length == 4) && aTempl[i][0].length && aTempl[i][3].replace(/ +$/, "").length)
          SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, 0, aTempl[i][3]);
        else
        {
          bSaveTempl = true;
          aTempl.splice(i, 1);
        }
      }

      aTempl.unshift([EscapeStr(bBatch ? sBFile : sWhat), EscapeStr(bBatch ? "" : sWith), (bFunc ? "f" : "") + (bMatch ? "" : "i") + (bDotNL ? "" : "n") + (bRegExp ? "r" : "") + (bWord ? "w" : "") + (bBatch ? "b" : ""), ""]);
      SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, 0, "");
    }

    SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, 0, 0);
  }

  function SetHTToDlg()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var i;

    if (bHist)
    {
      bMatch  = (aHist[nPos][2].indexOf("i") == -1);
      bWord   = (aHist[nPos][2].indexOf("w") > -1);
      bRegExp = (aHist[nPos][2].indexOf("r") > -1);
      bDotNL  = (aHist[nPos][2].indexOf("n") == -1);
      bFunc   = (aHist[nPos][2].indexOf("f") > -1);
      bBatch  = (aHist[nPos][2].indexOf("b") > -1);

      SetColorsAE();
      ReplaceTextAE(IDWHATE, aHist[nPos][0]);
      ReplaceTextAE(IDWITHE, aHist[nPos][1]);
    }
    else
    {
      bMatch  = (aTempl[nPos][2].indexOf("i") == -1);
      bWord   = (aTempl[nPos][2].indexOf("w") > -1);
      bRegExp = (aTempl[nPos][2].indexOf("r") > -1);
      bDotNL  = (aTempl[nPos][2].indexOf("n") == -1);
      bFunc   = (aTempl[nPos][2].indexOf("f") > -1);
      bBatch  = (aTempl[nPos][2].indexOf("b") > -1);

      SetColorsAE();
      ReplaceTextAE(IDWHATE, UnEscapeStr(aTempl[nPos][0]));
      ReplaceTextAE(IDWITHE, UnEscapeStr(aTempl[nPos][1]));
    }

    SendDlgItemMessage(hDlg, IDMATCH,  241 /*BM_SETCHECK*/, bMatch,  0);
    SendDlgItemMessage(hDlg, IDWORD,   241 /*BM_SETCHECK*/, bWord,   0);
    SendDlgItemMessage(hDlg, IDREGEXP, 241 /*BM_SETCHECK*/, bRegExp, 0);
    SendDlgItemMessage(hDlg, IDDOTNL,  241 /*BM_SETCHECK*/, bDotNL,  0);
    SendDlgItemMessage(hDlg, IDFUNC,   241 /*BM_SETCHECK*/, bFunc,   0);
    SendDlgItemMessage(hDlg, IDBATCH,  241 /*BM_SETCHECK*/, bBatch,  0);
    EnableButtonsDlg();

    if (nPos == 0)
    {
      for (i = 0; i < 2; ++i)
      {
        SendDlgItemMessage(hDlg, aSel[i][0], 3132 /*AEM_INDEXUPDATE*/, 0, aSel[i][1]);
        SendDlgItemMessage(hDlg, aSel[i][0], 3132 /*AEM_INDEXUPDATE*/, 0, aSel[i][2]);
        SendDlgItemMessage(hDlg, aSel[i][0], 3132 /*AEM_INDEXUPDATE*/, 0, _PtrAdd(aSel[i][2], _X64 ? 24 : 12));
        SendDlgItemMessage(hDlg, aSel[i][0], 3126 /*AEM_SETSEL*/, aSel[i][1], aSel[i][2]);
        SendDlgItemMessage(hDlg, aSel[i][0], 3180 /*AEM_SETSCROLLPOS*/, 0, aSel[i][3]);
      }
    }
  }

  function SetHotKeysHT(bSet)
  {
    var i;

    if (bSet)
    {
      for (i = 0; i < aHotKeyHT.length; ++i)
        oSys.Call("User32::RegisterHotKey", hWndHT, i, aHotKeyHT[i][0], aHotKeyHT[i][1]);
    }
    else
    {
      for (i = 0; i < aHotKeyHT.length; ++i)
        oSys.Call("User32::UnregisterHotKey", hWndHT, i);
    }
  }

  function RemoveHist()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var i;

    if (nPos > 0)
    {
      aHist.splice(nPos, 1);

      if (aHist.length == 1)
        PostMessage(hWndHT, 273 /*WM_COMMAND*/, IDCANCELB, 0);
      else
      {
        SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, nPos, 0);

        if (nPos == aHist.length)
          --nPos;
        else
        {
          for (i = nPos; i < aHist.length; ++i)
          {
            SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, i, 0);
            SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, i, i.toString() + "\t" + aHist[i][0].substr(0, 128).replace(/[\0\s]+/g, " "));
          }
        }

        SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos, 0);
        SetHTToDlg();
      }
    }
  }

  function ClearHist()
  {
    aHist.length = 1;
    PostMessage(hWndHT, 273 /*WM_COMMAND*/, IDCANCELB, 0);
  }

  function SetHistLen()
  {
    var sLen = nHistLen.toString(10);
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var i;

    if (sLen = InputBox(hWndHT, sTitleHT, sTxtHistLen + " (0 - 99):", sLen, 0, CheckLen))
    {
      if (sLen = sLen.replace(/\s+/g, ""))
      {
        nHistLen = parseInt(sLen, 10);

        if (aHist.length > nHistLen + 1)
        {
          aHist.length = nHistLen + 1;

          if (aHist.length == 1)
            PostMessage(hWndHT, 273 /*WM_COMMAND*/, IDCANCELB, 0);
          else
          {
            while (SendDlgItemMessage(hWndHT, IDLIST, 395 /*LB_GETCOUNT*/, 0, 0) > aHist.length)
              SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, aHist.length, 0);

            if (nPos >= aHist.length)
            {
              SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, aHist.length - 1, 0);
              SetHTToDlg();
            }
          }
        }
      }
    }

    function CheckLen(hWnd, aStr)
    {
      var sLen = aStr[0].replace(/\s+/g, "");

      if (/\D/.test(sLen))
        return 0;
      else
      {
        sLen = parseInt(sLen, 10);

        if ((sLen < 0) || (sLen > 99))
          return 0;
      }

      return -1;
    }
  }

  function AddTempl()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var sName;
    var bAdded;
    var i;

    if (! aTempl[0][0].length)
      return;

    for (i = 1; i < aTempl.length; ++i)
    {
      if ((aTempl[i][0] == aTempl[0][0]) && (aTempl[i][1] == aTempl[0][1]) && (aTempl[i][2] == aTempl[0][2]))
      {
        SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, i, 0);
        SetHTToDlg();
        AkelPad.MessageBox(hWndHT, sTxtTemplExists, sTxtAdd, 0x40 /*MB_ICONINFORMATION*/);
        return;
      }
    }

    if (nPos > 0)
    {
      SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, 0, 0);
      SetHTToDlg();
    }

    if (sName = InputBox(hWndHT, sTxtAdd, sTxtName, aTempl[nPos][3], 0, CheckTemplName, 0))
    {
      if (sName = sName.replace(/ +$/, ""))
      {
        bSaveTempl = true;
        bAdded     = true;
        aTempl.splice(++nPos, 0, [aTempl[0][0], aTempl[0][1], aTempl[0][2], sName]);
        SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, nPos, sName);
        SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos, 0);
      }
    }

    if (! bAdded)
    {
      SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos, 0);
      SetHTToDlg();
    }
  }

  function CheckTemplName(hWnd, aStr, nPos)
  {
    var sName = aStr[0].replace(/ +$/, "");
    var i;

    if (sName)
    {
      for (i = 1; i < aTempl.length; ++i)
      {
        if ((aTempl[i][3] == sName) && ((nPos == 0) || (nPos != i)))
        {
          SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, i, 0);
          SetHTToDlg();
          AkelPad.MessageBox(hWndHT, sTxtNameExists, nPos ? sTxtRename : sTxtAdd, 0x40 /*MB_ICONINFORMATION*/);
          SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos, 0);
          SetHTToDlg();
          return 0;
        }
      }
    }

    return -1;
  }

  function RenameTempl()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var sName;

    if (nPos < 1)
      return;

    if (sName = InputBox(hWndHT, sTxtRename, sTxtName, aTempl[nPos][3], 0, CheckTemplName, nPos))
    {
      if (sName = sName.replace(/ +$/, ""))
      {
        bSaveTempl = true;
        aTempl[nPos][3] = sName;
        SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, nPos, 0);
        SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, nPos, sName);
        SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos, 0);
      }
    }
  }

  function UpTempl()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);

    if (nPos > 1)
    {
      bSaveTempl = true;
      aTempl.splice(nPos - 1, 0, [aTempl[nPos][0], aTempl[nPos][1], aTempl[nPos][2], aTempl[nPos][3]]);
      aTempl.splice(nPos + 1, 1);
      SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, nPos - 1, aTempl[nPos - 1][3]);
      SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, nPos + 1, 0);
      SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos - 1, 0);
    }
  }

  function DownTempl()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);

    if ((nPos > 0) && (nPos < aTempl.length - 1))
    {
      bSaveTempl = true;
      aTempl.splice(nPos + 2, 0, [aTempl[nPos][0], aTempl[nPos][1], aTempl[nPos][2], aTempl[nPos][3]]);
      aTempl.splice(nPos, 1);
      SendDlgItemMessage(hWndHT, IDLIST, 385 /*LB_INSERTSTRING*/, nPos + 2, aTempl[nPos + 1][3]);
      SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, nPos, 0);
      SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos + 1, 0);
    }
  }

  function RemoveTempl()
  {
    var nPos = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);

    if (nPos > 0)
    {
      bSaveTempl = true;
      aTempl.splice(nPos, 1);
      SendDlgItemMessage(hWndHT, IDLIST, 386 /*LB_DELETESTRING*/, nPos, 0);
      SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos - ((nPos == aTempl.length) ? 1 : 0), 0);
      SetHTToDlg();
    }
  }

  function SortTempl()
  {
    var nPos  = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var sName = aTempl[nPos][3];
    var i;

    bSaveTempl = true;

    aTempl.sort(
      function(a1, a2)
      {
        return oSys.Call("Kernel32::lstrcmpW", a1[3], a2[3]);
      });

    SendDlgItemMessage(hWndHT, IDLIST, 388 /*LB_RESETCONTENT*/, 0, 0);

    for (i = 0; i < aTempl.length; ++i)
    {
      SendDlgItemMessage(hWndHT, IDLIST, 384 /*LB_ADDSTRING*/, 0, aTempl[i][3]);

      if (aTempl[i][3] == sName)
        nPos = i;
    }

    SendDlgItemMessage(hWndHT, IDLIST, 390 /*LB_SETCURSEL*/, nPos, 0);
    SetHTToDlg();
  }

  function MenuHT(nX, nY)
  {
    var MF_STRING    = 0x0000;
    var MF_GRAYED    = 0x0001;
    var MF_SEPARATOR = 0x0800;
    var nPos  = SendDlgItemMessage(hWndHT, IDLIST, 392 /*LB_GETCURSEL*/, 0, 0);
    var hMenu = oSys.Call("User32::CreatePopupMenu");
    var lpRECT;
    var nIH;
    var nCmd;

    oSys.Call("User32::SetFocus", GetDlgItem(hWndHT, IDLIST));
    SendDlgItemMessage(hWndHT, IDMENUB, 244 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 1);
    SendDlgItemMessage(hWndHT, IDOKB,   244 /*BM_SETSTYLE*/, 1 /*BS_DEFPUSHBUTTON*/, 1);

    //menu from keyboard or "Menu" button
    if ((typeof nX != "number") || (nX == 0xFFFF))
    {
      lpRECT = AkelPad.MemAlloc(16);
      SendDlgItemMessage(hWndHT, IDLIST, 408 /*LB_GETITEMRECT*/, nPos, lpRECT);
      nIH = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/) - AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/);
      oSys.Call("User32::ClientToScreen", GetDlgItem(hWndHT, IDLIST), lpRECT);
      nX = AkelPad.MemRead(_PtrAdd(lpRECT, 0), 3 /*DT_DWORD*/);
      nY = AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/) + nIH;
      AkelPad.MemFree(lpRECT);
    }

    if (bHist)
    {
      oSys.Call("User32::AppendMenuW", hMenu, (nPos > 0) ? MF_STRING : MF_GRAYED, 1, sTxtRemove + "\tAlt+Del");
      oSys.Call("User32::AppendMenuW", hMenu, (aHist.length > 1) ? MF_STRING : MF_GRAYED, 2, sTxtClear + "\tShift+Alt+Del");
      oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
      oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 3, sTxtHistLen + ": " + nHistLen);
    }
    else
    {
      oSys.Call("User32::AppendMenuW", hMenu, (aTempl[0][0].length && (aTempl[0][2].indexOf("b") == -1)) ? MF_STRING : MF_GRAYED, 11, sTxtAdd + "\tInsert");
      oSys.Call("User32::AppendMenuW", hMenu, (nPos > 0) ? MF_STRING : MF_GRAYED, 12, sTxtRename + "\tF2");
      oSys.Call("User32::AppendMenuW", hMenu, (nPos > 1) ? MF_STRING : MF_GRAYED, 13, sTxtMoveUp + "\tAlt+Up");
      oSys.Call("User32::AppendMenuW", hMenu, ((nPos > 0) && (nPos < aTempl.length - 1)) ? MF_STRING : MF_GRAYED, 14, sTxtMoveDown + "\tAlt+Down");
      oSys.Call("User32::AppendMenuW", hMenu, (nPos > 0) ? MF_STRING : MF_GRAYED, 15, sTxtRemove + "\tAlt+Del");
      oSys.Call("User32::AppendMenuW", hMenu, (aTempl.length > 2) ? MF_STRING : MF_GRAYED, 16, sTxtSort);
    }

    SetHotKeysHT(0);
    nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, hWndHT, 0);
    oSys.Call("User32::DestroyMenu", hMenu);
    SetHotKeysHT(1);

    if (nCmd == 1)
      RemoveHist();
    else if (nCmd == 2)
      ClearHist();
    else if (nCmd == 3)
      SetHistLen();
    else if (nCmd == 11)
      AddTempl();
    else if (nCmd == 12)
      RenameTempl();
    else if (nCmd == 13)
      UpTempl();
    else if (nCmd == 14)
      DownTempl();
    else if (nCmd == 15)
      RemoveTempl();
    else if (nCmd == 16)
      SortTempl();
  }
}

function Find(nCmd)
{
  var hEditWnd = AkelPad.GetEditWnd();
  var nFRF;
  var sFindIt;
  var lpCaret;
  var lpSelect;
  var lpPoint64;
  var nPos;
  var nSel;
  var aBRange;
  var nBRange;
  var sTitle;
  var i;

  if (bCoderHighLightIsRunning)
  {
    AkelPad.Call("Coder::HighLight", 2, "#FFFFFF", "#800080", 1, 0, 69, sWhat);
  }

  if ((! hEditWnd) || (! sWhat) || bBatch || ((nCmd > 10) && (! IsLineBoard())))
    return;

  nFRF = 0;
  if (bMatch)
    nFRF |= 0x00000004 /*FRF_MATCHCASE*/;
  if (bWord)
    nFRF |= 0x00000002 /*FRF_WHOLEWORD*/;
  if (bRegExp)
    nFRF |= 0x00080000 /*FRF_REGEXP*/;
  if (! bDotNL)
    nFRF |= 0x00040000 /*FRF_REGEXPNONEWLINEDOT*/;

  sFindIt   = sWhat.replace(/\n/g, bRegExp ? "\\n" : "\r");
  lpCaret   = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  lpSelect  = AkelPad.MemAlloc(_X64 ? 56 : 32 /*sizeof(AESELECTION)*/);
  lpPoint64 = AkelPad.MemAlloc(_X64 ? 16 :  8 /*sizeof(POINT64)*/);
  SendMessage(hEditWnd, 3125 /*AEM_GETSEL*/, lpCaret, lpSelect);
  SendMessage(hEditWnd, 3179 /*AEM_GETSCROLLPOS*/, 0, lpPoint64);
  SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 0, 0);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 0, 0);

  if (nCmd < 11)
  {
    if (nCmd == 1)
      nFRF |= 0x00000001 /*FRF_DOWN*/;
    else if ((nCmd == 2) || (nCmd == 3))
    {
      nFRF |= 0x00100000 /*FRF_UP*/;
      if (nCmd == 3)
        AkelPad.SetSel(-1, -1);
    }
    else
      nFRF |= 0x00200001 /*FRF_BEGINNING|FRF_DOWN*/;

    nPos = AkelPad.TextFind(0, sFindIt, nFRF);
  }
  else //in bookmarks
  {
    aBRange = GetBRangeArr(hEditWnd);

    if (aBRange.length)
    {
      nPos = -1;

      if ((nCmd == 11) || (nCmd == 14))
      {
        nFRF |= 0x00000001 /*FRF_DOWN*/;

        if (nCmd == 11)
        {
          nSel    = AkelPad.GetSelEnd();
          nBRange = GetCurrBRange(aBRange, nSel);

          if ((nBRange >= 0) && (nSel < aBRange[nBRange][1]))
          {
            AkelPad.SetSel(nSel, nSel);
            nPos = AkelPad.TextFind(0, sFindIt, nFRF);

            if ((nPos >= 0) && (AkelPad.GetSelEnd() > aBRange[nBRange][1]))
              nPos = -1;
          }
        }

        if (nPos == -1)
        {
          if (nCmd == 11)
            nBRange = GetNextBRange(aBRange, nBRange, true);
          else
            nBRange = 0;

          if (nBRange >= 0)
          {
            for (; nBRange < aBRange.length; ++nBRange)
            {
              AkelPad.SetSel(aBRange[nBRange][0], aBRange[nBRange][0]);
              nPos = AkelPad.TextFind(0, sFindIt, nFRF);

              if ((nPos >= 0) && (AkelPad.GetSelEnd() > aBRange[nBRange][1]))
                nPos = -1;
              else
                break;
            }
          }
        }
      }
      else
      {
        nFRF |= 0x00100000 /*FRF_UP*/;

        if (nCmd == 12)
        {
          nSel    = AkelPad.GetSelStart();
          nBRange = GetCurrBRange(aBRange, nSel);

          if ((nBRange >= 0) && (nSel > aBRange[nBRange][0]))
          {
            AkelPad.SetSel(nSel, nSel);
            nPos = AkelPad.TextFind(0, sFindIt, nFRF);

            if ((nPos >= 0) && (AkelPad.GetSelStart() < aBRange[nBRange][0]))
              nPos = -1;
          }
        }

        if (nPos == -1)
        {
          if (nCmd == 12)
            nBRange = GetNextBRange(aBRange, nBRange, false);
          else
            nBRange = aBRange.length - 1;

          if (nBRange >= 0)
          {
            for (; nBRange >= 0; --nBRange)
            {
              AkelPad.SetSel(aBRange[nBRange][1], aBRange[nBRange][1]);
              nPos = AkelPad.TextFind(0, sFindIt, nFRF);

              if ((nPos >= 0) && (AkelPad.GetSelStart() < aBRange[nBRange][0]))
                nPos = -1;
              else
                break;
            }
          }
        }
      }
    }
    else
    {
      if (bRegExp)
      {
        AkelPad.SetSel(0, 0);
        nPos = AkelPad.TextFind(0, sFindIt, nFRF | 0x80100000 /*FRF_TEST|FRF_UP*/);

        if (nPos > 0)
          nPos = -1;
      }
    }
  }

  if (nPos < 0)
  {
    SendMessage(hEditWnd, 3126 /*AEM_SETSEL*/, lpCaret, lpSelect);
    SendMessage(hEditWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);
  }

  AkelPad.MemFree(lpCaret);
  AkelPad.MemFree(lpSelect);
  AkelPad.MemFree(lpPoint64);

  SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 1, 0);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 1, 0);
  oSys.Call("User32::InvalidateRect", hMainWnd, 0, 1);
  oSys.Call("User32::InvalidateRect", hEditWnd, 0, 1);

  if (nPos < 0)
  {
    if ((nCmd % 10) == 1)
      sTitle = sTxtNext;
    else if ((nCmd % 10) == 2)
      sTitle = sTxtPrev;
    else if ((nCmd % 10) == 3)
      sTitle = sTxtLast;
    else
      sTitle = sTxtFirst;

    sTitle = (((nCmd < 11) ? sTxtFind : sTxtFindInBooks) + ": " + sTitle).replace(/&/g, "");

    //if (nPos == -1)
    //  AkelPad.MessageBox(hDlg, sTxtNotFound, sTitle, 0x40 /*MB_ICONINFORMATION*/);
    //else
    if (nPos <= -100)
    {
      AkelPad.MessageBox(hDlg, sTxtRegExpErr, sTitle, 0x10 /*MB_ICONERROR*/);
      SendDlgItemMessage(hDlg, IDWHATE, 177 /*EM_SETSEL*/, -nPos - 100, -1);
      oSys.Call("User32::SetFocus", GetDlgItem(hDlg, IDWHATE));
      SetDefPushButton(0);
    }
  }
}

function GetCurrBRange(aBRange, nPos)
{
  var nBRange;
  var i;

  if (nPos < aBRange[0][0])
    nBRange = -1;
  else if ((nPos >= aBRange[0][0]) && (nPos <= aBRange[0][1]))
    nBRange = 0;
  else if (nPos > aBRange[aBRange.length - 1][1])
    nBRange = -aBRange.length - 1;
  else
  {
    for (i = 1; i < aBRange.length; ++i)
    {
      if ((nPos >= aBRange[i][0]) && (nPos <= aBRange[i][1]))
      {
        nBRange = i;
        break;
      }
      else if ((nPos > aBRange[i - 1][1]) && (nPos < aBRange[i][0]))
      {
        nBRange = -i - 1;
        break;
      }
    }
  }

  return nBRange;
}

function GetNextBRange(aBRange, nBRange, bNext)
{
  if (nBRange >= 0)
    nBRange += bNext ? 1 : -1;
  else
    nBRange = -nBRange - (bNext ? 1 : 2);

  if (nBRange >= aBRange.length)
    nBRange = -1;

  return nBRange;
}

function GetBRangeArr(hEditWnd)
{
  var aBook   = GetBookmarkStr(hEditWnd).split(",");
  var aBRange = [];
  var i, n;

  if (aBook[0])
  {
    for (i = 0; i < aBook.length; i = n + 1)
    {
      for (n = i; (n + 1 < aBook.length) && (aBook[n + 1] - aBook[n] <= 1); ++n);

      aBRange.push([SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 41 /*AEGI_RICHOFFSETFROMUNWRAPLINE*/, parseInt(aBook[i])), SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 19 /*AEGI_WRAPLINEEND*/, SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 41 /*AEGI_RICHOFFSETFROMUNWRAPLINE*/, parseInt(aBook[n])))]);
    }
  }

  return aBRange;
}

function GetBookmarkStr(hEditWnd)
{
  var lpLen  = AkelPad.MemAlloc(4 /*int*/);
  var sBooks = "";
  var nLen;
  var lpBooks;

  AkelPad.CallW("LineBoard::Main", 12, hEditWnd, 0, 0, lpLen);

  if ((nLen = AkelPad.MemRead(lpLen, 3 /*DT_DWORD*/)) > 1)
  {
    lpBooks = AkelPad.MemAlloc(nLen * 2);
    AkelPad.CallW("LineBoard::Main", 12, hEditWnd, 0, lpBooks, 0);
    sBooks = AkelPad.MemRead(lpBooks, 1 /*DT_UNICODE*/).replace(/(^|,)(\d+)(?:,\2)+/g, "$1$2");
    AkelPad.MemFree(lpBooks);
  }

  AkelPad.MemFree(lpLen);

  return sBooks;
}

function BookmarkLines(bBookmark)
{
  var hEditWnd = AkelPad.GetEditWnd();
  var nFRF;
  var sFindIt;
  var lpCaret;
  var lpSelect;
  var lpPoint64;
  var nPos;
  var sBooks;
  var aBook;
  var nLine1;
  var nLine2;
  var sTitle;
  var i;

  if ((! hEditWnd) || (! sWhat) || bBatch || (! IsLineBoard()))
    return;

  nFRF = 0x00000001 /*FRF_DOWN*/;
  if (bMatch)
    nFRF |= 0x00000004 /*FRF_MATCHCASE*/;
  if (bWord)
    nFRF |= 0x00000002 /*FRF_WHOLEWORD*/;
  if (bRegExp)
    nFRF |= 0x00080000 /*FRF_REGEXP*/;
  if (! bDotNL)
    nFRF |= 0x00040000 /*FRF_REGEXPNONEWLINEDOT*/;

  sFindIt   = sWhat.replace(/\n/g, bRegExp ? "\\n" : "\r");
  lpCaret   = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  lpSelect  = AkelPad.MemAlloc(_X64 ? 56 : 32 /*sizeof(AESELECTION)*/);
  lpPoint64 = AkelPad.MemAlloc(_X64 ? 16 :  8 /*sizeof(POINT64)*/);
  SendMessage(hEditWnd, 3125 /*AEM_GETSEL*/, lpCaret, lpSelect);
  SendMessage(hEditWnd, 3179 /*AEM_GETSCROLLPOS*/, 0, lpPoint64);
  SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 0, 0);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 0, 0);

  sBooks = "";
  AkelPad.SetSel(0, 0);

  while ((nPos = AkelPad.TextFind(0, sFindIt, nFRF)) >= 0)
  {
    nLine1 = SendMessage(hEditWnd, 3129 /*AEM_GETLINENUMBER*/, 21 /*AEGI_UNWRAPLINEFROMRICHOFFSET*/, nPos);
    nLine2 = SendMessage(hEditWnd, 3129 /*AEM_GETLINENUMBER*/, 21 /*AEGI_UNWRAPLINEFROMRICHOFFSET*/, AkelPad.GetSelEnd());

    for (i = nLine1; i <= nLine2; ++i)
      sBooks += i + ",";
  }

  SendMessage(hEditWnd, 3126 /*AEM_SETSEL*/, lpCaret, lpSelect);
  SendMessage(hEditWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);
  SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 1, 0);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 1, 0);
  oSys.Call("User32::InvalidateRect", hMainWnd, 0, 1);
  oSys.Call("User32::InvalidateRect", hEditWnd, 0, 1);

  AkelPad.MemFree(lpCaret);
  AkelPad.MemFree(lpSelect);
  AkelPad.MemFree(lpPoint64);

  if (sBooks)
  {
    if (bBookmark)
    {
      sBooks += GetBookmarkStr(hEditWnd);
      AkelPad.CallW("LineBoard::Main", 13 /*set bookmarks*/, hEditWnd, 0, sBooks);
    }
    else
    {
      aBook  = sBooks.slice(0, -1).split(",");
      sBooks = GetBookmarkStr(hEditWnd);

      if (sBooks)
      {
        for (i = 0; i < aBook.length; ++i)
          sBooks = sBooks.replace(new RegExp("(^|,)" + aBook[i] + "(?:,|$)"), "$1");

        AkelPad.CallW("LineBoard::Main", 14 /*del bookmarks*/, hEditWnd);
        AkelPad.CallW("LineBoard::Main", 13 /*set bookmarks*/, hEditWnd, 0, sBooks);
      }
    }
  }
  else
  {
    sTitle = (bBookmark ? sTxtBookmarkLines : sTxtUnmarkLines).replace("&", "");

    if (nPos <= -100)
    {
      AkelPad.MessageBox(hDlg, sTxtRegExpErr, sTitle, 0x10 /*MB_ICONERROR*/);
      SendDlgItemMessage(hDlg, IDWHATE, 177 /*EM_SETSEL*/, -nPos - 100, -1);
      oSys.Call("User32::SetFocus", GetDlgItem(hDlg, IDWHATE));
      SetDefPushButton(0);
    }
    else
      AkelPad.MessageBox(hDlg, sTxtNotFound, sTitle, 0x40 /*MB_ICONINFORMATION*/);
  }
}

function CountInRange(nCmd)
{
  var hEditWnd = AkelPad.GetEditWnd();
  var nFRF;
  var sFindIt;
  var lpCaret;
  var lpSelect;
  var lpPoint64;
  var aBRange;
  var nCount;
  var sTitle;
  var sText;
  var i, n;

  if ((! hEditWnd) || (! sWhat) || bBatch || ((nCmd == 24) && (! IsLineBoard())))
    return;

  nFRF = 0x80000001 /*FRF_TEST|FRF_DOWN*/;
  if (bMatch)
    nFRF |= 0x00000004 /*FRF_MATCHCASE*/;
  if (bWord)
    nFRF |= 0x00000002 /*FRF_WHOLEWORD*/;
  if (bRegExp)
    nFRF |= 0x00080000 /*FRF_REGEXP*/;
  if (! bDotNL)
    nFRF |= 0x00040000 /*FRF_REGEXPNONEWLINEDOT*/;

  if (nCmd < 5)
    nFRF |= 0x00400000 /*FRF_SELECTION*/;
  else
  {
    nFRF |= 0x00200000 /*FRF_BEGINNING*/;

    if (nCmd === 6)
      nFRF |= 0x01000000 /*FRF_ALLFILES*/;
  }

  sFindIt   = sWhat.replace(/\n/g, bRegExp ? "\\n" : "\r");
  lpCaret   = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  lpSelect  = AkelPad.MemAlloc(_X64 ? 56 : 32 /*sizeof(AESELECTION)*/);
  lpPoint64 = AkelPad.MemAlloc(_X64 ? 16 :  8 /*sizeof(POINT64)*/);
  SendMessage(hEditWnd, 3125 /*AEM_GETSEL*/, lpCaret, lpSelect);
  SendMessage(hEditWnd, 3179 /*AEM_GETSCROLLPOS*/, 0, lpPoint64);
  SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 0, 0);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 0, 0);

  if (nCmd === 4) //in bookmarks
  {
    nCount  = 0;
    aBRange = GetBRangeArr(hEditWnd);

    if (aBRange.length)
    {
      for (i = 0; i < aBRange.length; ++i)
      {
        AkelPad.SetSel(aBRange[i][0], aBRange[i][1]);
        n = AkelPad.TextReplace(0, sFindIt, "", nFRF, 0x1 /*RRF_ALL*/);

        if (n <= -100)
        {
          nCount = n;
          break;
        }

        nCount += n;
      }
    }
    else if (bRegExp)
    {
      AkelPad.SetSel(-1, -1);
      nCount = AkelPad.TextReplace(0, sFindIt, "", nFRF, 0x1 /*RRF_ALL*/);
    }
  }
  else
  {
    if (nCmd === 1)
      AkelPad.SetSel(0, SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 5 /*AEGI_CARETCHAR*/, 0));
    else if (nCmd === 2)
      AkelPad.SetSel(SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 5 /*AEGI_CARETCHAR*/, 0), -1);

    nCount = AkelPad.TextReplace(0, sFindIt, "", nFRF, 0x1 /*RRF_ALL*/);
  }

  SendMessage(hEditWnd, 3126 /*AEM_SETSEL*/, lpCaret, lpSelect);
  SendMessage(hEditWnd, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);
  SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, 1, 0);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 1, 0);
  oSys.Call("User32::InvalidateRect", hMainWnd, 0, 1);
  oSys.Call("User32::InvalidateRect", hEditWnd, 0, 1);

  AkelPad.MemFree(lpCaret);
  AkelPad.MemFree(lpSelect);
  AkelPad.MemFree(lpPoint64);

  sTitle = sTxtCountInRange.replace("&", "");

  if (nCount <= -100)
  {
    AkelPad.MessageBox(hDlg, sTxtRegExpErr, sTitle, 0x10 /*MB_ICONERROR*/);
    SendDlgItemMessage(hDlg, IDWHATE, 177 /*EM_SETSEL*/, -nCount - 100, -1);
    oSys.Call("User32::SetFocus", GetDlgItem(hDlg, IDWHATE));
    SetDefPushButton(0);
  }
  else
  {
    if (nCmd === 1)
      sText = sTxtBegToCaret;
    else if (nCmd === 2)
      sText = sTxtCaretToEnd;
    else if (nCmd === 3)
      sText = sTxtSelection;
    else if (nCmd === 4)
      sText = sTxtBookmarks;
    else if (nCmd === 5)
      sText = sTxtEntireDoc;
    else
      sText = sTxtAllDocs;

    AkelPad.MessageBox(hDlg, sText + ": " + nCount + ".", sTitle, 0x40 /*MB_ICONINFORMATION*/);
  }
}

function MenuAE(hWnd, nID, nX, nY)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_POPUP     = 0x0010;
  var MF_SEPARATOR = 0x0800;
  var bSel         = SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0);
  var sHelpFile    = GetAkelHelpFile();
  var hMenu        = oSys.Call("User32::CreatePopupMenu");
  var hMenu1;
  var aBFile;
  var bFont;
  var bWrap;
  var lpPOINT;
  var nCmd;
  var i;

  oSys.Call("User32::SetFocus", hWnd);
  SetDefPushButton(0);

  if (nID === IDWHATE)
  {
    bFont = bFont1;
    bWrap = bWrap1;
  }
  else
  {
    bFont = bFont2;
    bWrap = bWrap2;
  }

  //menu from keyboard
  if ((typeof nX != "number") || (nX == 0xFFFF))
  {
    lpPOINT = AkelPad.MemAlloc(8);
    oSys.Call("User32::GetCaretPos", lpPOINT);
    oSys.Call("User32::ClientToScreen", hWnd, lpPOINT);
    nX = AkelPad.MemRead(_PtrAdd(lpPOINT, 0), 3 /*DT_DWORD*/);
    nY = AkelPad.MemRead(_PtrAdd(lpPOINT, 4), 3 /*DT_DWORD*/) + SendMessage(hWnd, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
    AkelPad.MemFree(lpPOINT);
  }

  if (bBatch)
  {
    hMenu1 = oSys.Call("User32::CreatePopupMenu");
    aBFile = [];

    GetBatchFiles(aBFile);

    if (aBFile.length)
    {
      for (i = 0; i < aBFile.length; ++i)
        oSys.Call("User32::AppendMenuW", hMenu1, MF_STRING, i + 100, aBFile[i]);
    }
    else
      oSys.Call("User32::AppendMenuW", hMenu1, MF_GRAYED, 0, sTxtNoBatchFiles);

    oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu1, sTxtBatchFile);
    oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
    oSys.Call("User32::AppendMenuW", hMenu, bSel ? MF_STRING : MF_GRAYED, 4, sTxtCopy + "\tCtrl+C");
    oSys.Call("User32::AppendMenuW", hMenu, oSys.Call("User32::GetWindowTextLengthW", hWnd) ? MF_STRING : MF_GRAYED, 7, sTxtSelAll + "\tCtrl+A");
  }
  else
  {
    oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3075 /*AEM_CANUNDO*/, 0, 0) ? MF_STRING : MF_GRAYED, 1, sTxtUndo + "\tCtrl+Z");
    oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3076 /*AEM_CANREDO*/, 0, 0) ? MF_STRING : MF_GRAYED, 2, sTxtRedo + "\tCtrl+Shift+Z");
    oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
    oSys.Call("User32::AppendMenuW", hMenu, bSel ? MF_STRING : MF_GRAYED, 3, sTxtCut + "\tCtrl+X");
    oSys.Call("User32::AppendMenuW", hMenu, bSel ? MF_STRING : MF_GRAYED, 4, sTxtCopy + "\tCtrl+C");
    oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3035 /*AEM_CANPASTE*/, 0, 0) ? MF_STRING : MF_GRAYED, 5, sTxtPaste + "\tCtrl+V");
    oSys.Call("User32::AppendMenuW", hMenu, bSel ? MF_STRING : MF_GRAYED, 6, sTxtDelete + "\tDel");
    oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
    oSys.Call("User32::AppendMenuW", hMenu, oSys.Call("User32::GetWindowTextLengthW", hWnd) ? MF_STRING : MF_GRAYED, 7, sTxtSelAll + "\tCtrl+A");
  }

  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, bFont ? MF_CHECKED : MF_STRING, 8, sTxtAPFont + "\tCtrl+F");
  oSys.Call("User32::AppendMenuW", hMenu, bWrap ? MF_CHECKED : MF_STRING, 9, sTxtWrap + "\tCtrl+U");

  if (sHelpFile)
  {
    oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
    oSys.Call("User32::AppendMenuW", hMenu, oFSO.FileExists(AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/) + "\\HtmlView.js") ? MF_STRING : MF_GRAYED, 10, sHelpFile + "\tCtrl+F1");
  }

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, hWnd, 0);
  oSys.Call("User32::DestroyMenu", hMenu1);
  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd === 1)
    SendMessage(hWnd, 3077 /*AEM_UNDO*/, 0, 0);
  else if (nCmd === 2)
    SendMessage(hWnd, 3078 /*AEM_REDO*/, 0, 0);
  else if (nCmd === 3)
    SendMessage(hWnd, 3037 /*AEM_CUT*/, 0, 0);
  else if (nCmd === 4)
    SendMessage(hWnd, 3038 /*AEM_COPY*/, 0, 0);
  else if (nCmd === 5)
    SendMessage(hWnd, 3036 /*AEM_PASTE*/, 0, 0);
  else if (nCmd === 6)
    SendMessage(hWnd, 771 /*WM_CLEAR*/, 0, 0);
  else if (nCmd === 7)
    SendMessage(hWnd, 177 /*EM_SETSEL*/, 0, -1);
  else if (nCmd === 8)
  {
    if (nID === IDWHATE)
      bFont1 = ! bFont1;
    else
      bFont2 = ! bFont2;

    SetFontAE(nID);
  }
  else if (nCmd === 9)
  {
    if (nID === IDWHATE)
      bWrap1 = ! bWrap1;
    else
      bWrap2 = ! bWrap2;

    SetWrapAE(nID);
  }
  else if (nCmd === 10)
    AkelHelp(sHelpFile);
  else if (nCmd >= 100)
    ReplaceTextAE(IDWHATE, aBFile[nCmd - 100]);
}

function MenuBatch()
{
  var MF_STRING = 0x0000;
  var MF_GRAYED = 0x0001;
  var hWnd    = GetDlgItem(hDlg, IDWHATE);
  var lpPOINT = AkelPad.MemAlloc(8);
  var aBFile  = [];
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var nX, nY;
  var nCmd;
  var i;

  oSys.Call("User32::SetFocus", hWnd);
  SetDefPushButton(0);

  oSys.Call("User32::GetCaretPos", lpPOINT);
  oSys.Call("User32::ClientToScreen", hWnd, lpPOINT);
  nX = AkelPad.MemRead(_PtrAdd(lpPOINT, 0), 3 /*DT_DWORD*/);
  nY = AkelPad.MemRead(_PtrAdd(lpPOINT, 4), 3 /*DT_DWORD*/) + SendMessage(hWnd, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
  AkelPad.MemFree(lpPOINT);

  GetBatchFiles(aBFile);

  if (aBFile.length)
  {
    for (i = 0; i < aBFile.length; ++i)
      oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, i + 100, aBFile[i]);
  }
  else
    oSys.Call("User32::AppendMenuW", hMenu, MF_GRAYED, 0, sTxtNoBatchFiles);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, hWnd, 0);
  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd >= 100)
    ReplaceTextAE(IDWHATE, aBFile[nCmd - 100]);
}

function GetBatchFiles(aBFile)
{
  var lpFindData = AkelPad.MemAlloc(44 + (260 + 14) * 2); //WIN32_FIND_DATAW
  var hFindFile  = oSys.Call("Kernel32::FindFirstFileW", WScript.ScriptFullName.replace(/\.js$/i, "_batch") + "*.tsv", lpFindData);

  if (hFindFile != -1 /*INVALID_HANDLE_VALUE*/)
  {
    do
    {
      if (! (AkelPad.MemRead(lpFindData, 3 /*DT_DWORD*/) & 16 /*FILE_ATTRIBUTE_DIRECTORY*/))
        aBFile.push(AkelPad.MemRead(_PtrAdd(lpFindData, 44 /*WIN32_FIND_DATAW.cFileName*/), 1 /*DT_UNICODE*/));
    }
    while (oSys.Call("Kernel32::FindNextFileW", hFindFile, lpFindData));

    oSys.Call("Kernel32::FindClose", hFindFile);
  }

  AkelPad.MemFree(lpFindData);

  aBFile.sort(
    function(s1, s2)
    {
      return oSys.Call("Kernel32::lstrcmpiW", s1, s2);
    });
}

function GetAkelHelpFile()
{
  var sDir  = AkelPad.GetAkelDir(2 /*ADTYPE_DOCS*/) + "\\";
  var sFile = "";

  if (AkelPad.GetLangId() == 1049 /*Russian*/)
  {
    if (oFSO.FileExists(sDir + "AkelHelp-Rus.htm"))
      sFile = "AkelHelp-Rus.htm";
    else if (oFSO.FileExists(sDir + "AkelHelp-Eng.htm"))
      sFile = "AkelHelp-Eng.htm";
  }
  else
  {
    if (oFSO.FileExists(sDir + "AkelHelp-Eng.htm"))
      sFile = "AkelHelp-Eng.htm";
    else if (oFSO.FileExists(sDir + "AkelHelp-Rus.htm"))
      sFile = "AkelHelp-Rus.htm";
  }

  return sFile;
}

function AkelHelp(sFile)
{
  if (sFile)
  {
    sFile = AkelPad.GetAkelDir(2 /*ADTYPE_DOCS*/) + "\\" + sFile;

    if (oFSO.FileExists(AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/) + "\\HtmlView.js"))
      AkelPad.Call("Scripts::Main", 1, "HtmlView.js", sFile + "#ch7");
  }
}

function MenuFind()
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_POPUP     = 0x0010;
  var MF_SEPARATOR = 0x0800;
  var lpRECT = AkelPad.MemAlloc(16);
  var hMenu1 = oSys.Call("User32::CreatePopupMenu");
  var hMenu2 = oSys.Call("User32::CreatePopupMenu");
  var hMenu3 = oSys.Call("User32::CreatePopupMenu");
  var hMenu  = oSys.Call("User32::CreatePopupMenu");
  var nX, nY;
  var nCmd;

  oSys.Call("User32::SetFocus", GetDlgItem(hDlg, IDFINDB));
  SetDefPushButton(IDFINDB);

  oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDFINDB), lpRECT);
  nX = AkelPad.MemRead(_PtrAdd(lpRECT, 8), 3 /*DT_DWORD*/);
  nY = AkelPad.MemRead(_PtrAdd(lpRECT, 4), 3 /*DT_DWORD*/);
  AkelPad.MemFree(lpRECT);

  oSys.Call("User32::AppendMenuW", hMenu1, MF_STRING, 11, sTxtNext  + "\tF7");
  oSys.Call("User32::AppendMenuW", hMenu1, MF_STRING, 12, sTxtPrev  + "\tShift+F7");
  oSys.Call("User32::AppendMenuW", hMenu1, MF_STRING, 13, sTxtLast  + "\tCtrl+F7");
  oSys.Call("User32::AppendMenuW", hMenu1, MF_STRING, 14, sTxtFirst + "\tCtrl+Shift+F7");

  oSys.Call("User32::AppendMenuW", hMenu2, MF_STRING, 21, "&1 - " + sTxtBegToCaret + "\tCtrl+1");
  oSys.Call("User32::AppendMenuW", hMenu2, MF_STRING, 22, "&2 - " + sTxtCaretToEnd + "\tCtrl+2");
  oSys.Call("User32::AppendMenuW", hMenu2, MF_STRING, 23, "&3 - " + sTxtSelection  + "\tCtrl+3");
  oSys.Call("User32::AppendMenuW", hMenu2, IsLineBoard() ? MF_STRING : MF_GRAYED, 24, "&4 - " + sTxtBookmarks + "\tCtrl+4");
  oSys.Call("User32::AppendMenuW", hMenu2, MF_STRING, 25, "&5 - " + sTxtEntireDoc  + "\tCtrl+5");
  oSys.Call("User32::AppendMenuW", hMenu2, MF_STRING, 26, "&6 - " + sTxtAllDocs    + "\tCtrl+6");

  oSys.Call("User32::AppendMenuW", hMenu3, (nFindDef == 1) ? MF_CHECKED : MF_STRING, 101, sTxtNext);
  oSys.Call("User32::AppendMenuW", hMenu3, (nFindDef == 2) ? MF_CHECKED : MF_STRING, 102, sTxtPrev);
  oSys.Call("User32::AppendMenuW", hMenu3, (nFindDef == 3) ? MF_CHECKED : MF_STRING, 103, sTxtLast);
  oSys.Call("User32::AppendMenuW", hMenu3, (nFindDef == 4) ? MF_CHECKED : MF_STRING, 104, sTxtFirst);
  oSys.Call("User32::AppendMenuW", hMenu3, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu3, (nFindDef == 0) ? MF_CHECKED : MF_STRING, 100, sTxtNone);

  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 1, sTxtNext  + "\tF3");
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 2, sTxtPrev  + "\tShift+F3");
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 3, sTxtLast  + "\tCtrl+F3");
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 4, sTxtFirst + "\tCtrl+Shift+F3");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, IsLineBoard() ? MF_POPUP : MF_GRAYED, hMenu1, sTxtFindInBooks);
  oSys.Call("User32::AppendMenuW", hMenu, IsLineBoard() ? MF_STRING : MF_GRAYED, 15, sTxtBookmarkLines + "\tShift+Alt+Ins");
  oSys.Call("User32::AppendMenuW", hMenu, IsLineBoard() ? MF_STRING : MF_GRAYED, 16, sTxtUnmarkLines + "\tShift+Alt+Del");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 666, sTxtSearchFindstr + "\tCtrl+O");
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 777, sTxtSearchFind + "\tCtrl+S");
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 888, sTxtSearchQS + "\tCtrl+Shift+A");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu2, sTxtCountInRange);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu3, sTxtFindDefault);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x1A8 /*TPM_RETURNCMD|TPM_NONOTIFY|TPM_BOTTOMALIGN|TPM_RIGHTALIGN*/, nX, nY, 0, hDlg, 0);
  oSys.Call("User32::DestroyMenu", hMenu1);
  oSys.Call("User32::DestroyMenu", hMenu2);
  oSys.Call("User32::DestroyMenu", hMenu3);
  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd > 0)
  {
    if (nCmd < 15)
      Find(nCmd);
    else if (nCmd == 15)
      BookmarkLines(true);
    else if (nCmd == 16)
      BookmarkLines(false);
    else if (nCmd == 666)
      FindstrLog();
    else if (nCmd == 777)
      FindToLog();
    else if (nCmd == 888)
      qSearchLog();
    else if (nCmd < 29)
      CountInRange(nCmd - 20);
    else if (nCmd > 99)
    {
      nFindDef = nCmd - 100;
      SendDlgItemMessage(hDlg, IDFINDB, 12 /*WM_SETTEXT*/, 0, sTxtFind + (nFindDef ? "" : " >"));
    }
  }
}

function ReadIni()
{
  try
  {
    eval(AkelPad.ReadFile(WScript.ScriptFullName.replace(/\.js$/i, ".ini"), 0x10 /*ADT_NOMESSAGES*/, 1200 /*UTF-16LE*/, 1));
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, 'No configurations were found! '+ oError.description, scriptName, 0);
  }

  if ((typeof nWhatH != "number") || (nWhatH < nEditMinH)) nWhatH = nEditMinH;
  nDlgMinH += nWhatH - nEditMinH;
  if (typeof nDlgX != "number") nDlgX = 200;
  if (typeof nDlgY != "number") nDlgY = 200;
  if ((typeof nDlgW != "number") || (nDlgW < nDlgMinW)) nDlgW = nDlgMinW;
  if ((typeof nDlgH != "number") || (nDlgH < nDlgMinH)) nDlgH = nDlgMinH;
  if (typeof bTranspNA != "boolean") bTranspNA = false;
  if ((typeof nOpacity != "number") || (nOpacity < 15) || (nOpacity > 255)) nOpacity = 255;
  if (typeof bMatch != "boolean") bMatch = false;
  if (typeof bWord != "boolean") bWord = false;
  if (typeof bRegExp != "boolean") bRegExp = false;
  if (typeof bDotNL != "boolean") bDotNL = true;
  if (typeof bFunc != "boolean") bFunc = false;
  if (typeof bBatch != "boolean") bBatch = false;
  if (typeof bLockUndo != "boolean") bLockUndo = false;
  if ((typeof nRange != "number") || (nRange < 0) || (nRange > 5)) nRange = 3;
  if (typeof bFont1 != "boolean") bFont1 = false;
  if (typeof bFont2 != "boolean") bFont2 = false;
  if (typeof bWrap1 != "boolean") bWrap1 = false;
  if (typeof bWrap2 != "boolean") bWrap2 = false;
  if (typeof sWhat != "string") sWhat = "";
  if (typeof sWith != "string") sWith = "";
  if ((typeof sBFile != "string") || (! oFSO.FileExists(AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/) + "\\" + sBFile))) sBFile = "";
  if ((typeof nFindDef != "number") || (nFindDef < 1) || (nFindDef > 4)) nFindDef = 0;
  if (typeof nHistLen != "number") nHistLen = 10;
  if (nHistLen < 0)
    nHistLen = 0;
  else if (nHistLen > 99)
    nHistLen = 99;
  if (! (aHist instanceof Array)) aHist = [];
}

function WriteIni()
{
  var lpRECT = AkelPad.MemAlloc(16);
  var sText;
  var i;

  oSys.Call("User32::GetWindowRect", hDlg, lpRECT);
  oSys.Call("User32::ScreenToClient", hMainWnd, lpRECT);
  nDlgX = AkelPad.MemRead(_PtrAdd(lpRECT,  0), 3 /*DT_DWORD*/);
  nDlgY = AkelPad.MemRead(_PtrAdd(lpRECT,  4), 3 /*DT_DWORD*/);
  oSys.Call("User32::GetClientRect", hDlg, lpRECT);
  nDlgW = AkelPad.MemRead(_PtrAdd(lpRECT,  8), 3 /*DT_DWORD*/);
  nDlgH = AkelPad.MemRead(_PtrAdd(lpRECT, 12), 3 /*DT_DWORD*/);
  AkelPad.MemFree(lpRECT);

  sText =
    'nDlgX='     + ScaleUX(nDlgX) + ';\r\n' +
    'nDlgY='     + ScaleUY(nDlgY) + ';\r\n' +
    'nDlgW='     + ScaleUX(nDlgW) + ';\r\n' +
    'nDlgH='     + ScaleUY(nDlgH) + ';\r\n' +
    'nWhatH='    + ScaleUY(nWhatH) + ';\r\n' +
    'bTranspNA=' + bTranspNA + ';\r\n' +
    'nOpacity='  + nOpacity + ';\r\n' +
    'bMatch='    + bMatch + ';\r\n' +
    'bWord='     + bWord + ';\r\n' +
    'bRegExp='   + bRegExp + ';\r\n' +
    'bDotNL='    + bDotNL + ';\r\n' +
    'bFunc='     + bFunc + ';\r\n' +
    'bBatch='    + bBatch + ';\r\n' +
    'bLockUndo=' + bLockUndo + ';\r\n' +
    'nRange='    + nRange + ';\r\n' +
    'bFont1='    + bFont1 + ';\r\n' +
    'bFont2='    + bFont2 + ';\r\n' +
    'bWrap1='    + bWrap1 + ';\r\n' +
    'bWrap2='    + bWrap2 + ';\r\n' +
    'sWhat="'    + EscapeStr(sWhat) + '";\r\n' +
    'sWith="'    + EscapeStr(sWith) + '";\r\n' +
    'sBFile="'   + EscapeStr(sBFile) + '";\r\n' +
    'nFindDef='  + nFindDef + ';\r\n' +
    'nHistLen='  + nHistLen + ';\r\n' +
    'aHist=[';

  for (i = 0; i < aHist.length; ++i)
    sText += '["' + EscapeStr(aHist[i][0]) + '","' + EscapeStr(aHist[i][1]) + '","' + aHist[i][2] + '"]' + ((i == aHist.length - 1) ? '' : ',');

  sText += '];\r\n';

  AkelPad.WriteFile(WScript.ScriptFullName.replace(/\.js$/i, ".ini"), sText, sText.length, 1200 /*UTF-16LE*/, 1, 0x1 /*WFF_WRITEREADONLY*/);
}

function EscapeStr(sStr)
{
  return sStr.replace(/[\\"]/g, '\\$&').replace(/\0/g, '\\0').replace(/\t/g, '\\t').replace(/\n/g, '\\n');
}

function UnEscapeStr(sStr)
{
  return sStr.replace(/(\\+)(.?)/g,
           function(s0, s1, s2)
           {
             if (s1.length % 2)
             {
               if (s2 == "0") s2 = "\0";
               else if (s2 == "t") s2 = "\t";
               else if (s2 == "n") s2 = "\n";
               return s1.substr(0, (s1.length - 1) / 2) + s2;
             }
             return s1.substr(0, s1.length / 2) + s2;
           });
}

function GetLangStrings()
{
  if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1045) //Polish
  {
    sTxtDlgTitle      = 'Zamień Tekst';
    sTxtWhat          = '&Co:';
    sTxtBatch         = 'Pakiet:';
    sTxtWith          = 'Czy&m:';
    sTxtMatchCase     = 'Uwzględnij wielkość &liter';
    sTxtWholeWord     = 'Całe &wyrazy';
    sTxtRegExp        = 'Wyrażenia &regularne';
    sTxtDotMatchesNL  = '&. dopasowuje \\n';
    sTxtWithFunc      = 'Zamień przez &funkcję';
    sTxtBatchRepl     = 'Zamień &pakietowo';
    sTxtLockUndo      = 'Wyłącz "Cofnij"';
    sTxtRange         = 'Zakres do zamiany';
    sTxtBegToCaret    = 'Początek - Kursor';
    sTxtCaretToEnd    = 'Kursor - Koniec';
    sTxtSelection     = 'Zaznaczenie';
    sTxtBookmarks     = 'Zakładki';
    sTxtEntireDoc     = 'Cały dokument';
    sTxtAllDocs       = 'Wszystkie dokum.';
    sTxtTransparentNA = 'Przezroczystość - gdy nieaktywne';
    sTxtReplace1      = '&Zamień jedno';
    sTxtReplaceAll    = 'Z&amień wszystko';
    sTxtHistory       = '&Historia';
    sTxtTemplates     = '&Szablony';
    sTxtFind          = 'Z&najdź';
    sTxtClose         = 'Zamknij';
    sTxtMenu          = '&Menu';
    sTxtOK            = 'OK';
    sTxtCancel        = 'Anuluj';
    sTxtBatchFile     = 'Plik pakietu';
    sTxtNoBatchFiles  = '<brak plików pakietów>';
    sTxtUndo          = '&Cofnij';
    sTxtRedo          = '&Powtórz';
    sTxtCut           = '&Wytnij';
    sTxtCopy          = '&Kopiuj';
    sTxtPaste         = 'Wkl&ej';
    sTxtDelete        = '&Usuń';
    sTxtSelAll        = 'Zaznacz w&szystko';
    sTxtAPFont        = 'Czcionka AkelPad';
    sTxtWrap          = 'Zawijaj wiersze';
    sTxtRemove        = 'Usuń';
    sTxtClear         = 'Wyczyść';
    sTxtHistLen       = 'Długość historii';
    sTxtAdd           = 'Dodaj';
    sTxtRename        = 'Zmień nazwę';
    sTxtMoveUp        = 'W górę';
    sTxtMoveDown      = 'W dół';
    sTxtSort          = 'Sortuj';
    sTxtName          = 'Nazwa:';
    sTxtNext          = 'Następny';
    sTxtPrev          = 'Poprzedni';
    sTxtLast          = 'Ostatni';
    sTxtFirst         = 'Pierwszy';
    sTxtNone          = 'Brak';
    sTxtFindInBooks   = 'Znajdź w zakładkach';
    sTxtBookmarkLines = 'Oznacz wiersze zakładkami';
    sTxtUnmarkLines   = 'Usuń zakładki z wierszy';
    sTxtSearchQS      = 'Search results in the Log (QSearch)';
    sTxtSearchFind    = 'Search results in the Log (FIND)';
    sTxtSearchFindstr = 'Search results in the Log (FINDSTR)';
    sTxtCountInRange  = 'Policz w zakresie';
    sTxtFindDefault   = 'Domyślne działanie "Znajdź"';
    sTxtFileNotExist  = 'Plik nie istnieje!';
    sTxtFileNoData    = 'Plik nie zawiera poprawnych danych!';
    sTxtAreYouSure    = 'Czy jesteś pewien ?';
    sTxtNotFound      = 'Nie znaleziono!';
    sTxtChangedDocs   = 'Zmienione dokumenty: ';
    sTxtCountChanges  = 'Łączna liczba zamian: ';
    sTxtRegExpErr     = 'Błąd składni w wyrażeniu regularnym!';
    sTxtNoFuncErr     = 'Nie można utworzyć funkcji Zamiany!';
    sTxtNoTextErr     = 'Funkcja Zamiany nie zwraca tekstu!';
    sTxtRunTimeErr    = 'Błąd w czasie wykonywania funkcji Zamiany:';
    sTxtBatchErr      = 'Błąd w pliku pakietu, wiersz: ';
    sTxtSaveDocs      = 'Wszystkie dokumenty podlegające zamianie powinny być zapisane!';
    sTxtNameExists    = 'Nazwa już istnieje!';
    sTxtTemplExists   = 'Szablon już istnieje!';
  }
  else if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1049) //Russian
  {
    //translated by YuS
    sTxtDlgTitle      = 'Замена текста';
    sTxtWhat          = 'Ч&то:';
    sTxtBatch         = 'Пакет:';
    sTxtWith          = 'Ч&ем:';
    sTxtMatchCase     = 'Учитывать &регистр';
    sTxtWholeWord     = 'Слово &целиком';
    sTxtRegExp        = 'Регулярные в&ыражения';
    sTxtDotMatchesNL  = '&. захватывает \\n';
    sTxtWithFunc      = 'Заменять на &функцию';
    sTxtBatchRepl     = '&Пакетная замена';
    sTxtLockUndo      = 'Выкл. "Отменить"';
    sTxtRange         = 'Диапазон для замены';
    sTxtBegToCaret    = 'До курсора';
    sTxtCaretToEnd    = 'От курсора';
    sTxtSelection     = 'В выделении';
    sTxtBookmarks     = 'Закладки';
    sTxtEntireDoc     = 'Весь файл';
    sTxtAllDocs       = 'Все файлы';
    sTxtTransparentNA = 'Прозрачный неактивный диалог';
    sTxtReplace1      = '&Заменить';
    sTxtReplaceAll    = 'Заменить &всё';
    sTxtHistory       = '&История';
    sTxtTemplates     = '&Шаблоны';
    sTxtFind          = '&Найти';
    sTxtClose         = 'Закрыть';
    sTxtMenu          = '&Меню';
    sTxtOK            = 'OK';
    sTxtCancel        = 'Отмена';
    sTxtBatchFile     = 'Пакетный файл';
    sTxtNoBatchFiles  = '<нет пакетных файлов>';
    sTxtUndo          = 'От&менить';
    sTxtRedo          = '&Повторить';
    sTxtCut           = '&Вырезать';
    sTxtCopy          = '&Копировать';
    sTxtPaste         = 'В&ставить';
    sTxtDelete        = '&Удалить';
    sTxtSelAll        = 'Вы&делить всё';
    sTxtAPFont        = 'Шрифт AkelPad';
    sTxtWrap          = 'Перенос строк';
    sTxtRemove        = 'Удалить';
    sTxtClear         = 'Удалить всё';
    sTxtHistLen       = 'Количество строк';
    sTxtAdd           = 'Добавить';
    sTxtRename        = 'Переименовать';
    sTxtMoveUp        = 'Вверх';
    sTxtMoveDown      = 'Вниз';
    sTxtSort          = 'Сортировать';
    sTxtName          = 'Имя:';
    sTxtNext          = 'Следующее';
    sTxtPrev          = 'Предыдущее';
    sTxtLast          = 'Последнее';
    sTxtFirst         = 'Первое';
    sTxtNone          = 'Нет';
    sTxtFindInBooks   = 'Найти в закладках';
    sTxtBookmarkLines = 'Пометить строки';
    sTxtUnmarkLines   = 'Снять пометки строк';
    sTxtSearchQS      = 'Search results in the Log (QSearch)';
    sTxtSearchFind    = 'Search results in the Log (FIND)';
    sTxtSearchFindstr = 'Search results in the Log (FINDSTR)';
    sTxtCountInRange  = 'Посчитать в диапазоне';
    sTxtFindDefault   = 'По умолчанию: "Найти ..."';
    sTxtFileNotExist  = 'Файл не существует!';
    sTxtFileNoData    = 'Файл не содержит правильных данных!';
    sTxtAreYouSure    = 'Вы уверены?';
    sTxtNotFound      = 'Не найдено!';
    sTxtChangedDocs   = 'Изменённые документы: ';
    sTxtCountChanges  = 'Количество замен: ';
    sTxtRegExpErr     = 'Синтаксическая ошибка в регулярном выражении!';
    sTxtNoFuncErr     = 'Невозможно создать функцию замены!';
    sTxtNoTextErr     = 'Функция замены текст не вернула!';
    sTxtRunTimeErr    = 'Ошибка выполнения функции замены:';
    sTxtBatchErr      = 'Ошибка в пакетном файле, строка: ';
    sTxtSaveDocs      = 'Все документы, подлежащие замене, необходимо сохранить!';
    sTxtNameExists    = 'Имя уже существует!';
    sTxtTemplExists   = 'Шаблон уже существует!';
  }
  else
  {
    sTxtDlgTitle      = 'Text Replace ('+ scriptName +')';
    sTxtWhat          = 'What&;';
    sTxtBatch         = 'Batch:';
    sTxtWith          = 'With&;';
    sTxtMatchCase     = 'Match &case';
    sTxtWholeWord     = '&Whole word';
    sTxtRegExp        = 'Regular e&xpressions';
    sTxtDotMatchesNL  = '&. matches \\n';
    sTxtWithFunc      = 'Replace with f&unction';
    sTxtBatchRepl     = '&Batch replace';
    sTxtLockUndo      = 'Disable "Undo"';
    sTxtRange         = 'Range for Replace';
    sTxtBegToCaret    = 'Up ↑';
    sTxtCaretToEnd    = 'Down ↓';
    sTxtSelection     = 'Selection !';
    sTxtBookmarks     = 'Bookmarks';
    sTxtEntireDoc     = 'Entire document';
    sTxtAllDocs       = 'All documents';
    sTxtTransparentNA = 'Transparency - only when inactive';
    sTxtReplace1      = '&Replace single';
    sTxtReplaceAll    = 'Replace &all';
    sTxtHistory       = '&History';
    sTxtTemplates     = '&Templates';
    sTxtFind          = '&Find';
    sTxtClose         = 'Close';
    sTxtMenu          = '&Menu';
    sTxtOK            = 'OK';
    sTxtCancel        = 'Cancel';
    sTxtBatchFile     = 'Batch file';
    sTxtNoBatchFiles  = '<no batch files>';
    sTxtUndo          = '&Undo';
    sTxtRedo          = '&Redo';
    sTxtCut           = 'C&ut';
    sTxtCopy          = '&Copy';
    sTxtPaste         = '&Paste';
    sTxtDelete        = '&Delete';
    sTxtSelAll        = 'Select &all';
    sTxtAPFont        = 'AkelPad font';
    sTxtWrap          = 'Wrap lines';
    sTxtRemove        = 'Remove';
    sTxtClear         = 'Clear';
    sTxtHistLen       = 'History length';
    sTxtAdd           = 'Add';
    sTxtRename        = 'Rename';
    sTxtMoveUp        = 'Move up';
    sTxtMoveDown      = 'Move down';
    sTxtSort          = 'Sort';
    sTxtName          = 'Name:';
    sTxtNext          = 'Next';
    sTxtPrev          = 'Previous';
    sTxtLast          = 'Last';
    sTxtFirst         = 'First';
    sTxtNone          = 'None';
    sTxtFindInBooks   = 'Find in bookmarks';
    sTxtBookmarkLines = 'Bookmark lines';
    sTxtUnmarkLines   = 'Unmark lines';
    sTxtSearchQS      = 'Search results in the Log (QSearch)';
    sTxtSearchFind    = 'Search results in the Log (FIND)';
    sTxtSearchFindstr = 'Search results in the Log (FINDSTR)';
    sTxtCountInRange  = 'Count in range';
    sTxtFindDefault   = '"Find" - default action';
    sTxtFileNotExist  = 'File does not exist!';
    sTxtFileNoData    = 'File does not contain valid data!';
    sTxtAreYouSure    = 'Are you sure ?';
    sTxtNotFound      = 'Not found!';
    sTxtChangedDocs   = 'Changed documents: ';
    sTxtCountChanges  = 'Count of changes: ';
    sTxtRegExpErr     = 'Syntax error in regular expression!';
    sTxtNoFuncErr     = 'Can not create Replace function!';
    sTxtNoTextErr     = 'Replace function does not return a text!';
    sTxtRunTimeErr    = 'Run time error Replace function:';
    sTxtBatchErr      = 'Error in batch file, line: ';
    sTxtSaveDocs      = 'All documents that are subject to the replacement should be saved!';
    sTxtNameExists    = 'Name already exists!';
    sTxtTemplExists   = 'Template already exists!';
  }
}

/**
 * Find in files using FINDSTR search util and show search results in log
 * @TODO: Match exact word
 *
 * @param int pLogOutput - flags for Log::Output, default no scroll (16)
 * @return bool on success
 */
function FindstrLog(pLogOutput)
{
  var strContent = GetTextAE(IDWHATE) || sWhat;
  var strDir     = AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) || sDir;

  if ((! strContent) || (! strDir))
    return false;
  else
  {
    sWhat = strContent;
    sDir = strDir;
  }

  var logOutput = pLogOutput || 16;
  var sDirEsc = strDir.replace(/\\/g, "\\\\");

  // findstr /O -was a problem that neither GOTOCHAR, nor GOTOBYTE did not move the caret appropriately
  // var sREPATTERN = "^(.+?):(\\d+):(\\d+):(.*?)$";
  var sREPATTERN = "^(.+?):(\\d+):(.*?)$";
  var sRETAGS    = "/FILE=\\1 /GOTOLINE=\\2:0";
  var sCOMMAND = "cmd.exe /K cd /d \"" + strDir + "\" & echo. & echo ---------- SEARCHED \""+ strContent +"\" IN DIRECTORY \""+ strDir +"\" "+ ((logOutput===16)?"":" & time /T & date /T ") +" & findstr /S /N "+ ((bRegExp)?"/R":"/L") + ((sBFile)?" /P ":"")+ ((! bMatch)?" /I ":"") +" /C:\""+ strContent +"\" \* & exit";

  //AkelPad.MessageBox(0, sCOMMAND, scriptName, 0);
  AkelPad.Call("Log::Output", 1, sCOMMAND, sDirEsc, sREPATTERN, sRETAGS, -2, -2, logOutput);
  AkelPad.Call("Scripts::Main", 2, "LogHighLight.js", ('-sSelText="'+ strContent +'" -bNotRegExp='+ ((bRegExp)?"0":"1")) );

  return true;
}

/**
 * Find text in files from specific directory,
 * using FIND util from the Windows OS.
 *
 * @param number pLogOutput - flags for Log::Output
 * @return bool on success
 */
function FindToLog(pLogOutput)
{
  var strContent = GetTextAE(IDWHATE) || sWhat;
  var strDir = AkelPad.GetFilePath(fileFullPath, 1) || sDir;
  var sDirEsc = strDir.replace(/\\/g, "\\\\");
  // var sFilePathEsc = fileFullPath.replace(/\\/g, "\\\\");

  if ((! strContent) || (! strDir))
    return false;

  var logOutput = pLogOutput || 18;
  var fileFullPath = AkelPad.GetEditFile(0);
  var sCOMMAND = "cmd.exe /K cd /d \""+ strDir +"\" & find /N "+ ((bMatch)?"":"/I") +" \""+ strContent +"\" "+ fileFullPath +" & exit";

  AkelPad.Call("Log::Output", 1, sCOMMAND, sDirEsc,
  	"^(---------- (.+)$)?(\\[(\\d+)\\])?",
  	"/FILE=\\2 /GOTOLINE=\\4:0" , -2, -2, logOutput
  );

  AkelPad.Call("Scripts::Main", 2, "LogHighLight.js", ('-sSelText="'+ strContent +'" -bNotRegExp='+ ((bRegExp)?"0":"1") ));

  return true;
}

/**
 * QSearch results in the Log.
 *
 * @param number searchFlag that should search in current the document, or in all tabs
 * @return bool|number, see AkelPad.TextFind for more details
 */
function qSearchLog(searchFlag)
{
  var strContent = GetTextAE(IDWHATE) || sWhat;
  if (! strContent)
    return false;

  var bCase = bMatch,
      bRegEx = bRegExp,
      bRegExMulti = bDotNL;

  var sTextSearchOptionsParams = "";

  if (bCase)
    sTextSearchOptionsParams += " case";
  if (bRegEx)
  {
    sTextSearchOptionsParams += " regex";
    if (bRegExMulti)
      sTextSearchOptionsParams += " regex_multi";
  }

  var flag = searchFlag || 1;
  var selText = "";
  var scriptName = scriptName;
  var found = searching();

  function searching()
  {
    var searchResult = -1;
    if (flag === 3)
      sTextSearchOptionsParams = ('begin tabs' + sTextSearchOptionsParams);  /* 0x00200000|0x01000000 FRF_BEGINNING|FRF_ALLFILES */
    else
      sTextSearchOptionsParams = ('begin' + sTextSearchOptionsParams); /* 0x00200000|0x00000001 FRF_BEGINNING|FRF_DOWN */

    try
    {
    	searchResult = TextSearchOptions(sTextSearchOptionsParams);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'qSearchLog() -> searching() Error: '+ oError.description, scriptName, 16 /*MB_ICONERROR*/);
      return false;
    }

    if (searchResult >= 0)
      return searchResult;

    if (searchResult <= -100)
    {
      AkelPad.MessageBox(0, 'Error in your expression "'+ strContent +'" \n ('+ searchResult +') is the offset.', scriptName, 0);
      return false;
    }
    else if (searchResult < 0)
    {
      AkelPad.MessageBox(0, '"'+ strContent +'" was not found. ('+ searchResult +')', scriptName, 0);
      return false;
    }
  }

  if (found && qSearching(AkelPad.GetSelText(), flag))
  {
  	AkelPad.Command(4199); // caret in editor history back
  	oSys.Call("User32::SetFocus", GetDlgItem(hDlg, IDWHATE));
  	return found;
  }

  oSys.Call("User32::SetFocus", GetDlgItem(hDlg, IDWHATE));

  return found;
}

/**
 * qSearch FindAll
 *
 * @throws oError
 * @param string selText    - text to search
 * @param number flag       - search flag
 * @return bool             - true on success
 */
function qSearching(selText, flag)
{
  var textSelected = selText || AkelPad.GetSelText() || GetTextAE(IDWHATE) || sWhat,
      args = flag || 1,
      oError;

  var bCase = bMatch,
      bRegEx = bRegExp,
      bRegExMulti = bDotNL;

  if (textSelected)
  {
    try
    {
      AkelPad.Call("QSearch::FindAll", flag);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'qSearching() Error: '+ oError.description, WScript.Name, 16 /*MB_ICONERROR*/);
      return false;
    }

    AkelPad.Call("Scripts::Main", 2, "LogHighLight.js", ('-sSelText="'+ textSelected +'" -bNotRegExp='+ ((bRegEx)?"0":"1")) );
    return true;
  }
  else
    return false;
}

/**
 * Text to Find.
 *
 0x00000001  //FRF_DOWN                find down.
 0x00000002  //FRF_WHOLEWORD           find whole word.
 0x00000004  //FRF_MATCHCASE           search is case-sensitive.
 0x00040000  //FRF_REGEXPNONEWLINEDOT  symbol . in regular expressions specifies any character except new line (usage: FRF_REGEXP|FRF_REGEXPNONEWLINEDOT).
 0x00080000  //FRF_REGEXP              search with regular expressions.
 0x00100000  //FRF_UP                  find up.
 0x00200000  //FRF_BEGINNING           search from beginning (usage: FRF_DOWN|FRF_BEGINNING).
 0x00400000  //FRF_SELECTION           search in selection (usage: FRF_DOWN|FRF_SELECTION).
 0x00800000  //FRF_ESCAPESEQ           search with escape sequences.
 0x01000000  //FRF_ALLFILES            search in all opened MDI documents (usage: FRF_DOWN|FRF_ALLFILES or FRF_DOWN|FRF_BEGINNING|FRF_ALLFILES).
 0x08000000  //FRF_CYCLESEARCH         cycle search.
 0x10000000  //FRF_CYCLESEARCHPROMPT   prompt during cycle search.
 0x80000000  //FRF_TEST                test only. Without text selection.
 *
 * @param string sParams  = 'word up begin test escape selected tabs'
 * @param mixed prompts = 'undefined'
 * @return bool|number, see AkelPad.TextFind for more details
 */
function TextSearchOptions(sParams, prompts)
{
  var strContent = GetTextAE(IDWHATE) || sWhat;
  if (! strContent)
    return false;

  var pTextSearch = sParams || '';
  var calcBin = (typeof prompts !== 'undefined')? 0x10000000 /*FRF_CYCLESEARCHPROMPT*/ : 0x08000000 /*FRF_CYCLESEARCH*/;

  if (bMatch || ~pTextSearch.indexOf('case'))
    calcBin |= 0x00000004 /*FRF_MATCHCASE*/;

  if (bRegExp || ~pTextSearch.indexOf('regex'))
    calcBin |= 0x00080000 /*FRF_REGEXP*/;

  if (bDotNL || ~pTextSearch.indexOf('regex_multi'))
    calcBin |= 0x00040000 /*FRF_REGEXPNONEWLINEDOT*/;

  if (~pTextSearch.indexOf('word'))
    calcBin |= 0x00000002 /*FRF_WHOLEWORD*/;

  if (~pTextSearch.indexOf('escape'))
    calcBin |= 0x00800000 /*FRF_ESCAPESEQ*/;

  if (~pTextSearch.indexOf('up'))
    calcBin |= 0x00100000 /*FRF_UP*/;
  else
    calcBin |= 0x00000001 /*FRF_DOWN*/;

  if (~pTextSearch.indexOf('begin'))
    calcBin |= 0x00200000 /*FRF_BEGINNING*/;

  if (~pTextSearch.indexOf('tabs'))
    calcBin |= 0x01000000 /*FRF_ALLFILES*/;

  if (~pTextSearch.indexOf('test'))
    calcBin |= 0x80000000 /*FRF_TEST*/;

  if (~pTextSearch.indexOf('selected'))
    calcBin |= 0x00400000 /*FRF_SELECTION*/;

  return AkelPad.TextFind(0, strContent, calcBin);
}

/**
 * Searches for the first occurrence in the opened file.
 *
 * @return string - found match
 */
function searchSelect()
{
  var rContent;
  var selText = "";
  if (sWhat)
  {
    try
    {
      if (bRegExp)
      {
        rContent = new RegExp(sWhat, (bMatch ? "" : "i") + (bDotNL ? "m" : ""));
        if (rContent.test(AkelPad.GetTextRange(0, -1, 0 /*new line as is*/)))
          AkelPad.SetSel(ByteOffsetToRichOffset(RegExp.index), ByteOffsetToRichOffset(RegExp.lastIndex));
      }
      else
        AkelPad.TextFind(0, sWhat, 0x00200001 /*FRF_BEGINNING|FRF_DOWN*/ | (bMatch ? 0x00000004 /*FRF_MATCHCASE*/ : 0));
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'searchSelect() Error: '+ oError.description, WScript.Name, 16 /*MB_ICONERROR*/);
      return "";
    }

    selText = AkelPad.GetSelText();
  }
  return selText;
}

/**
 * HighLight text from the What input.
 *
 * nFlags
 1   case sensitive (default).
 2   regular expressions in "TEXT" parameter.
 4   whole word.
 *
 * @param number nAction
 * @param number nFlags
 * @return bool if highlighted
 */
function highlight(sText, nAction, nFlags)
{
  var strWhat = sText || GetTextAE(IDWHATE) || sWhat,
      action = nAction || 2;
      args = nFlags || 0;
      
  var bCase = bMatch,
      bRegEx = bRegExp,
      bRegExMulti = bDotNL;

  if (bCase)
    args += 1;
  if (bRegEx)
    args += 2;
  else if (bWord)
    args += 4;

  if (action === 2)
    AkelPad.Call("Coder::HighLight", action, "#FF8080", '#400080', args, 0, -666, strWhat);
  else if (action === 3)
    AkelPad.Call("Coder::HighLight", action, -666, "#FF8080", '#400080');

  return true;
}
