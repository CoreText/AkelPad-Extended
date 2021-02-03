// http://tc-image.3dn.ru/forum/9-779-4176-16-1353248260
// Author: KDJ & texter
// ver. 2013-09-14
// Поиск файлов по названию и содержанию.
// Extended from FindFiles.js - ver. 2013-09-14 (x86/x64)
//
// Search files by name and content.
//
// Usage:
// Call("Scripts::Main", 1, "FindFiles_extended.js")
// Required to include: BrowseForFolder_function.js, FileAndStream_functions.js
//
////////////////////// Keys and mouse:
// Shift+Alt+;,
// Alt+;             - Focus the editor

// Alt+F,
// Ctrl+Down         - Focus the Files list
// Ctrl+Up           - Focus the Search input

// Alt+O             - Focus the file name input
// Alt+D             - Focus the search path
// Alt+T,
// Ctrl+F            - Focus the search input

// Alt+Up            - Opened file navigation scroll up
// Alt+Down          - Opened file navigation scroll down

// Left Mouse Click  - Open the selected file for editing and select the found text and finds next result
// Right Mouse Click - Open the selected file for editing and select the found text and finds previous result
// Double Click      - Close the selected file, or shows the results in the log depending on the settings of the dialog

// Ctrl+A           - Select all items on files list
// Ctrl+C           - Copy selected items from files list
// Del              - Remove selected items from files list (don't delete the files)
// Alt+Del          - Remove item from history list (Directory, Name of file, Text in file)
// F4               - Open all selected files for editing
// F1               - Help for regular expressions or wildcards

// Alt+L            - Show results in the log
// Shift+Alt+L      - Show results in the log keeping previous results
// Shift+Alt+P      - Show results in the new document
// Shift+Enter      - Open focused file for editing and select the found text (or close file if is currently edited)

// Ctrl+Enter       - Go to next occurrence
// Ctrl+Shift+Enter - Go to previous occurrence
// Alt+Enter        - Go to next occur Match Word
// Shift+Alt+Enter  - Go to previous occurrence Match Word
// Alt+G            - Go to next occur Match Word, in opened documents
// Sfhit+Alt+G      - Go to previous occur Match Word, in opened documents

// Alt+B            - Bookmark the results
// Shift+Alt+B      - Unmark the results
// Ctrl+B           - Go to next bookmark
// Ctrl+Shift+B     - Go to previous bookmark

// Ctrl+W           - Close current document
// Ctrl+Shift+W     - Close tabs by extension
// Alt+W            - Close tabs by extension

// Ctrl+L           - Result in the log (FINDSTR)
// Ctrl+Shift+L     - Results in the log (FINDSTR), preserving the log output
// Ctrl+N           - Results in the new tab (FINDSTR)
// Ctrl+S           - Results of current document (FIND)
// Ctrl+Shift+S     - Results of current document (FIND), preserving the log output
// Ctrl+Shift+A     - Results in log (qSearch), preserving the log output
// Alt+Shift+A      - Results from opened documents in log (qSearch), preserving the log output

// Ctrl+I           - File statistics
// Ctrl+Shift+I     - File statistics in new tab

// Ctrl+R,
// Ctrl+Shift+F     - Open FindReplaceFiles_extended.js
// Ctrl+H           - Open TextReplacer.js
// Alt+H            - Highlight the text in the log results

// Ctrl+M           - Mark current text
// Ctrl+Shift+M     - Mark current text in all tabs
// Alt+M            - Remove marks from the document
// Shift+Alt+M      - Remove marks from all documents

// Ctrl+Shift+O     - Paths of the opened documents in new tab
// Ctrl+O,
// Ctrl+E           - Open directory path in editor's Explorer
// Ctrl+Shift+E     - Open directory path in OS Explorer

// Alt+Z,
// Ctrl+P           - Previous caret position
// Alt+Shift+Z,
// Ctrl+Shift+P     - Redo previous caret position
// Alt+Left         - Open previous tab
// Alt+Right        - Open next tab
// Ctrl+Tab         - Recent edited file

/**
 * Some script dependencies:
 * - CloseTabByExt.js
 * - CreateTab&Arhive.vbs
 * - FileInfo.js
 * - FindReplaceFiles_extended.js
 * - LogHighLight.js
 * - MarkIt_extended.js
 * - TabCloseExts.vbs
 * - TabSwitch.js
 * - TextReplacer.js
 */

var oSys         = AkelPad.SystemFunction();
var hInstanceDLL = AkelPad.GetInstanceDll();
var sScriptName  = WScript.ScriptName;
var sClassName   = "AkelPad::Scripts::" + sScriptName + "::" + hInstanceDLL;
var hWndDlg;
// var bCoderHighLightIsRunning = AkelPad.IsPluginRunning("Coder::HighLight");
// var bQSearchIsRunning = AkelPad.IsPluginRunning("QSearch::QSearch");

if (hWndDlg = oSys.Call("User32::FindWindowExW", 0, 0, sClassName, 0))
{
  if (! oSys.Call("User32::IsWindowVisible", hWndDlg))
    oSys.Call("User32::ShowWindow", hWndDlg, 8 /*SW_SHOWNA*/);
  if (oSys.Call("User32::IsIconic", hWndDlg))
    oSys.Call("User32::ShowWindow", hWndDlg, 9 /*SW_RESTORE*/);

  oSys.Call("User32::SetForegroundWindow", hWndDlg);
}
else
{
  if (! (AkelPad.Include("BrowseForFolder_function.js") && AkelPad.Include("FileAndStream_functions.js")))
    WScript.Quit();

  var DT_UNICODE = 1;
  var DT_QWORD   = 2;
  var DT_DWORD   = 3;
  var DT_WORD    = 4;
  var hMainWnd   = AkelPad.GetMainWnd();
  var nBkColorT  = 0xFFFFFF;
  var nBkColorMC = 0xA0FFFF;
  var nBkColorRE = 0xA7E2B7;
  var nBkColorREC= 0xFFAA82;
  var hBrush     = oSys.Call("Gdi32::CreateSolidBrush", nBkColorRE);
  var hBrushC    = oSys.Call("Gdi32::CreateSolidBrush", nBkColorMC);
  var hBrushREC  = oSys.Call("Gdi32::CreateSolidBrush", nBkColorREC);
  var hBrushT    = oSys.Call("Gdi32::CreateSolidBrush", nBkColorT);
  var nBufSize   = 2048 /* 1024 */;
  var lpBuffer   = AkelPad.MemAlloc(nBufSize);
  var lpLVITEM   = AkelPad.MemAlloc(_X64 ? 72 : 60); //sizeof(LVITEM)

  AkelPad.MemCopy(lpLVITEM, 0x0001 /*LVIF_TEXT*/, DT_DWORD); //mask
  AkelPad.MemCopy(lpLVITEM + (_X64 ? 24 : 20), lpBuffer, DT_QWORD); //pszText
  AkelPad.MemCopy(lpLVITEM + (_X64 ? 32 : 24), nBufSize, DT_DWORD); //cchTextMax

  var hWndParent   = hMainWnd;
  var nMaxLenCBE   = 15;
  var nMaxLenCBL   = 27;
  var nNameSel1    = 0;
  var nNameSel2    = -1;
  var nContentSel1 = 0;
  var nContentSel2 = -1;
  var bCloseCBL;
  var bLogShowS        = 0;
  var bLogShowKeep     = 0;
  var bLogShowNewT     = 0;
  var bTxtLogResLog    = 0;
  var bTxtLogResLogP   = 0;
  var bTxtLogResLogQS  = 0;
  var bTxtLogResLogQSA = 0;
  var hWndNameEdit;
  var hWndNameList;
  var hWndContentEdit;
  var hWndContentList;
  var hWndFocus;

  var oWndMin = {"W": 445,
                 "H": 442};
  var oWndPos = {"X": 240,
                 "Y": 140,
                 "W": oWndMin.W,
                 "H": oWndMin.H,
                 "Max": 0};
  var bSeparateWnd    = 0;
  var bKeepFiles      = 1;
  var bPathShow       = 1;
  var bLogShow        = 0;
  var bBookmarkResults= 0;
  var bMarkResults    = 0;
  var nPathLen        = 0;
  var bSortDesc       = 0;
  var nDirLevel       = -1;
  var bNameRE         = 0;
  var bNotName        = 0;
  var bMatchWord      = AkelPad.GetArgValue("bWord", 0);
  var bMatchCase      = AkelPad.GetArgValue("bCase", 0);
  var bContentRE      = AkelPad.GetArgValue("bRegEx", 0);
  var bMultiline      = AkelPad.GetArgValue("bRegExMulti", 0);
  var bNotContain     = 0;
  var bInStreams      = 0;
  var bSkipBinary     = 1;
  var nMaxFileSize    = 0;
  var sDir            = AkelPad.GetArgValue("sDir", "");
  var sName           = AkelPad.GetArgValue("sName", "");
  var sContent        = AkelPad.GetArgValue("sWhat", "");
  var sReplace        = AkelPad.GetArgValue("sWith", ""); // for other apps to pass
  var sLastContent    = "";
  var bLastContentRE  = 0;
  var bLastMatchWord  = 0;
  var bLastMatchCase  = 0;
  var bLastMultiline  = 0;
  var bLastNotContain = 0;
  var aDirs           = [];
  var aNames          = [];
  var aContents       = [];
  var aFiles          = [];
  var aFilesSel       = [0];
  var nFilesFoc       = 0;

  ReadIni();

  if (bSeparateWnd)
    hWndParent = 0;
  if (oWndPos.H < oWndMin.H)
    oWndPos.H = oWndMin.H;
  if (oWndPos.W < oWndMin.W)
    oWndPos.W = oWndMin.W;
  if (aDirs.length > nMaxLenCBE)
    aDirs.length = nMaxLenCBE;
  if (aNames.length > nMaxLenCBE)
    aNames.length = nMaxLenCBE;
  if (aContents.length > nMaxLenCBE)
    aContents.length = nMaxLenCBE;

  var CLASS = 0;
  var HWND  = 1;
  var STYLE = 2;
  var TXT   = 3;

  var aWnd         = [];
  var IDDIRG       = 2000;
  var IDDIRCB      = 2001;
  var IDCURRENTB   = 2002;
  var IDBROWSEB    = 2003;
  var IDSUBDIRS    = 2004;
  var IDLEVELCB    = 2005;
  var IDNAMEG      = 2006;
  var IDNAMECB     = 2007;
  var IDHELP1B     = 2008;
  var IDNAMERE     = 2009;
  var IDNOTNAME    = 2010;
  var IDCONTENTG   = 2011;
  var IDCONTENTCB  = 2012;
  var IDHELP2B     = 2013;
  var IDMATCHCASE  = 2014;
  var IDCONTENTRE  = 2015;
  var IDMULTILINE  = 2016;
  var IDNOTCONTAIN = 2017;
  var IDINSTREAMS  = 2018;
  var IDSKIPBINARY = 2019;
  var IDSKIPLARGER = 2020;
  var IDMAXSIZE    = 2021;
  var IDBYTESYMBOL = 2022;
  var IDFILELV     = 2023;
  var IDSEARCHB    = 2024;
  var IDEDITB      = 2025;
  var IDCOPYB      = 2026;
  var IDCLEARB     = 2027;
  var IDSETTINGSB  = 2028;
  var IDCLOSEB     = 2029;
  var IDSTATUS     = 2030;
  var IDMATCHWORD  = 2031;

  //0x50000000 - WS_VISIBLE|WS_CHILD
  //0x50000002 - WS_VISIBLE|WS_CHILD|SS_RIGHT
  //0x50000007 - WS_VISIBLE|WS_CHILD|BS_GROUPBOX
  //0x50000100 - WS_VISIBLE|WS_CHILD|SBARS_SIZEGRIP
  //0x50010000 - WS_VISIBLE|WS_CHILD|WS_TABSTOP
  //0x50010042 - WS_VISIBLE|WS_CHILD|WS_TABSTOP|CBS_AUTOHSCROLL|CBS_DROPDOWN
  //0x50010003 - WS_VISIBLE|WS_CHILD|WS_TABSTOP|CBS_DROPDOWNLIST
  //0x50010003 - WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
  //0x50810009 - WS_VISIBLE|WS_CHILD|WS_BORDER|WS_TABSTOP|LVS_SHOWSELALWAYS|LVS_REPORT
  //0x50812002 - WS_VISIBLE|WS_CHILD|WS_BORDER|WS_TABSTOP|ES_NUMBER|ES_RIGHT
  //Windows           CLASS,             HWND,      STYLE, TXT
  aWnd[IDDIRG      ]=["BUTTON",             0, 0x50000007, sTxtDir];
  aWnd[IDDIRCB     ]=["COMBOBOX",           0, 0x50210042, ""];
  aWnd[IDCURRENTB  ]=["BUTTON",             0, 0x50010000, sTxtCurrent];
  aWnd[IDBROWSEB   ]=["BUTTON",             0, 0x50010000, sTxtBrowse];
  aWnd[IDSUBDIRS   ]=["STATIC",             0, 0x50000002, sTxtSubDirs];
  aWnd[IDLEVELCB   ]=["COMBOBOX",           0, 0x50010003, ""];
  aWnd[IDNAMEG     ]=["BUTTON",             0, 0x50000007, sTxtFileName + (bNameRE ? "" : " " + sTxtWildcards)];
  aWnd[IDNAMECB    ]=["COMBOBOX",           0, 0x50210042, ""];
  aWnd[IDHELP1B    ]=["BUTTON",             0, 0x50010000, "?"];
  aWnd[IDNAMERE    ]=["BUTTON",             0, 0x50010003, sTxtRegExp];
  aWnd[IDNOTNAME   ]=["BUTTON",             0, 0x50010003, sTxtNotName];
  aWnd[IDCONTENTG  ]=["BUTTON",             0, 0x50000007, sTxtTextInFile];
  aWnd[IDCONTENTCB ]=["COMBOBOX",           0, 0x50210042, ""];
  aWnd[IDHELP2B    ]=["BUTTON",             0, 0x50010000, "?"];
  aWnd[IDMATCHWORD ]=["BUTTON",             0, 0x50010003, sTxtMatchWord];
  aWnd[IDMATCHCASE ]=["BUTTON",             0, 0x50010003, sTxtMatchCase];
  aWnd[IDCONTENTRE ]=["BUTTON",             0, 0x50010003, sTxtRegExp];
  aWnd[IDMULTILINE ]=["BUTTON",             0, 0x50010003, sTxtMultiline];
  aWnd[IDNOTCONTAIN]=["BUTTON",             0, 0x50010003, sTxtNotContain];
  aWnd[IDINSTREAMS ]=["BUTTON",             0, 0x50010003, sTxtInStreams];
  aWnd[IDSKIPBINARY]=["BUTTON",             0, 0x50010003, sTxtSkipBinary];
  aWnd[IDSKIPLARGER]=["STATIC",             0, 0x50000000, sTxtSkipLarger];
  aWnd[IDMAXSIZE   ]=["EDIT",               0, 0x50812002, (nMaxFileSize > 0) ? nMaxFileSize.toString() : ""];
  aWnd[IDBYTESYMBOL]=["STATIC",             0, 0x50000000, sTxtByteSymbol];
  aWnd[IDFILELV    ]=["SysListView32",      0, 0x50810009, ""];
  aWnd[IDSEARCHB   ]=["BUTTON",             0, 0x50010000, sTxtSearch];
  aWnd[IDEDITB     ]=["BUTTON",             0, 0x50010000, sTxtEdit];
  aWnd[IDCOPYB     ]=["BUTTON",             0, 0x50010000, sTxtCopyList];
  aWnd[IDCLEARB    ]=["BUTTON",             0, 0x50010000, sTxtClearList];
  aWnd[IDSETTINGSB ]=["BUTTON",             0, 0x50010000, sTxtSettings];
  aWnd[IDCLOSEB    ]=["BUTTON",             0, 0x50010000, sTxtClose];
  aWnd[IDSTATUS    ]=["msctls_statusbar32", 0, 0x50000100, ""];

  AkelPad.WindowRegisterClass(sClassName);

  hWndDlg = oSys.Call("User32::CreateWindowExW",
                      0,               //dwExStyle
                      sClassName,      //lpClassName
                      sTxtScriptName,  //lpWindowName
                      0x80CF0000,      //dwStyle=WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MAXIMIZEBOX|WS_MINIMIZEBOX|WS_SIZEBOX
                      oWndPos.X,       //x
                      oWndPos.Y,       //y
                      oWndPos.W,       //nWidth
                      oWndPos.H,       //nHeight
                      hWndParent,      //hWndParent
                      0,               //ID
                      hInstanceDLL,    //hInstance
                      DialogCallback); //Script function callback. To use it class must be registered by WindowRegisterClass.

  oSys.Call("User32::ShowWindow", hWndDlg, oWndPos.Max ? 3 /*SW_MAXIMIZE*/ : 1 /*SW_SHOWNORMAL*/);

  //Allow other scripts running
  AkelPad.ScriptNoMutex();

  //Message loop
  AkelPad.WindowGetMessage();

  AkelPad.WindowUnregisterClass(sClassName);

  AkelPad.MemFree(lpBuffer);
  AkelPad.MemFree(lpLVITEM);
  oSys.Call("Gdi32::DeleteObject", hBrush);
  oSys.Call("Gdi32::DeleteObject", hBrushT);
  oSys.Call("Gdi32::DeleteObject", hBrushC);
  oSys.Call("Gdi32::DeleteObject", hBrushREC);
}

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  var sWhat, dataTxt;

  if (uMsg === 1) //WM_CREATE
  {
    var hGuiFont = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
    var i;

    for (i = 2000; i < aWnd.length; ++i)
    {
      aWnd[i][HWND] =
        oSys.Call("User32::CreateWindowExW",
                  0,              //dwExStyle
                  aWnd[i][CLASS], //lpClassName
                  0,              //lpWindowName
                  aWnd[i][STYLE], //dwStyle
                  0,              //x
                  0,              //y
                  0,              //nWidth
                  0,              //nHeight
                  hWnd,           //hWndParent
                  i,              //ID
                  hInstanceDLL,   //hInstance
                  0);             //lpParam

      AkelPad.SendMessage(aWnd[i][HWND], 48 /*WM_SETFONT*/, hGuiFont, true);
      SetWindowText(aWnd[i][HWND], aWnd[i][TXT]);
    }

    AkelPad.SendMessage(aWnd[IDNAMERE    ][HWND], 0x00F1 /*BM_SETCHECK*/, bNameRE, 0);
    AkelPad.SendMessage(aWnd[IDNOTNAME   ][HWND], 0x00F1 /*BM_SETCHECK*/, bNotName, 0);
    AkelPad.SendMessage(aWnd[IDMATCHWORD ][HWND], 0x00F1 /*BM_SETCHECK*/, bMatchWord, 0);
    AkelPad.SendMessage(aWnd[IDMATCHCASE ][HWND], 0x00F1 /*BM_SETCHECK*/, bMatchCase, 0);
    AkelPad.SendMessage(aWnd[IDCONTENTRE ][HWND], 0x00F1 /*BM_SETCHECK*/, bContentRE, 0);
    AkelPad.SendMessage(aWnd[IDMULTILINE ][HWND], 0x00F1 /*BM_SETCHECK*/, bMultiline, 0);
    AkelPad.SendMessage(aWnd[IDNOTCONTAIN][HWND], 0x00F1 /*BM_SETCHECK*/, bNotContain, 0);
    AkelPad.SendMessage(aWnd[IDINSTREAMS ][HWND], 0x00F1 /*BM_SETCHECK*/, bInStreams, 0);
    AkelPad.SendMessage(aWnd[IDSKIPBINARY][HWND], 0x00F1 /*BM_SETCHECK*/, bSkipBinary, 0);
    EnableButtons();

    //Get handles to edit/list in ComboBoxes IDNAMECB and IDCONTENTCB
    AkelPad.MemCopy(lpBuffer, _X64 ? 64 : 52 /*sizeof(COMBOBOXINFO)*/, DT_DWORD);
    oSys.Call("User32::GetComboBoxInfo", aWnd[IDNAMECB][HWND], lpBuffer);
    hWndNameEdit = AkelPad.MemRead(lpBuffer + (_X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
    hWndNameList = AkelPad.MemRead(lpBuffer + (_X64 ? 56 : 48) /*hwndList*/, DT_QWORD);
    oSys.Call("User32::GetComboBoxInfo", aWnd[IDCONTENTCB][HWND], lpBuffer);
    hWndContentEdit = AkelPad.MemRead(lpBuffer + (_X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
    hWndContentList = AkelPad.MemRead(lpBuffer + (_X64 ? 56 : 48) /*hwndList*/, DT_QWORD);

    AkelPad.SendMessage(aWnd[IDDIRCB    ][HWND], 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    AkelPad.SendMessage(aWnd[IDNAMECB   ][HWND], 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    AkelPad.SendMessage(aWnd[IDCONTENTCB][HWND], 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    AkelPad.SendMessage(aWnd[IDDIRCB    ][HWND], 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);
    AkelPad.SendMessage(aWnd[IDNAMECB   ][HWND], 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);
    AkelPad.SendMessage(aWnd[IDCONTENTCB][HWND], 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);

    SetWindowText(aWnd[IDDIRCB][HWND], sDir);
    oSys.Call("User32::PostMessageW", hWnd, 0x8000 /*WM_APP*/, 0, 0);
    FillCB();

    SetPartsSB();

    AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1036 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0x0020 /*LVS_EX_FULLROWSELECT*/, 0x0020);
    SetColumnLV();
    SetHeaderLV();
    FillLV();

    hWndFocus = aWnd[IDDIRCB][HWND];
  }

  else if (uMsg === 0x8000 /*WM_APP*/)
  {
    sDir = AkelPad.GetArgValue("sDir", sDir);
    dataDir = sDir || AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1);
    SetWindowText(aWnd[IDDIRCB][HWND], dataDir);

    sWhat = AkelPad.GetArgValue("sWhat", AkelPad.GetSelText());
    sName = AkelPad.GetArgValue("sName", "*");
    sName = (! sName || sName === "." || sName === "..")? "*" : sName;
    dataTxt = sWhat || sLastContent;
    if (dataTxt)
    {
      SetWindowText(aWnd[IDNAMECB][HWND], sName);
      SetWindowText(aWnd[IDCONTENTCB][HWND], dataTxt);
      oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);
    }
    else
    {
      SetWindowText(aWnd[IDNAMECB][HWND], sName);
      SetWindowText(aWnd[IDCONTENTCB][HWND], (sWhat || sLastContent));
    }
  }

  else if (uMsg === 0x8001 /*WM_APP+1*/)
    oSys.Call("User32::SetFocus", wParam);

  else if ((uMsg === 6 /*WM_ACTIVATE*/) && (! wParam))
    hWndFocus = oSys.Call("User32::GetFocus");

  else if (uMsg === 7) //WM_SETFOCUS
  {
    oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);
  }

  else if (uMsg === 36) //WM_GETMINMAXINFO
  {
    AkelPad.MemCopy(lParam + 24, oWndMin.W, DT_DWORD); //ptMinTrackSize_x
    AkelPad.MemCopy(lParam + 28, oWndMin.H, DT_DWORD); //ptMinTrackSize_y
  }

  else if (uMsg === 3) //WM_MOVE
  {
    if (! oSys.Call("User32::IsZoomed", hWnd))
      GetWindowPos(hWnd, oWndPos);
  }

  else if (uMsg === 5) //WM_SIZE
  {
    if (wParam !== 2) //SIZE_MAXIMIZED
      GetWindowPos(hWnd, oWndPos);

    ResizeWindow(hWnd);
  }

  ////////////////////////////////////////////////////////////////////////// inputs status highlight
  else if (uMsg === 0x0133) //WM_CTLCOLOREDIT
  {
    if (lParam === hWndContentEdit)
    {
      if (bMatchCase && bContentRE)
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorREC);
        return hBrushREC;
      }
      else if (bContentRE)
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorRE);
        return hBrush;
      }
      else if (bMatchCase)
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorMC);
        return hBrushC;
      }
      else
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorT);
        return hBrushT;
      }
    }
  }
  else if (uMsg === 0x0134) //WM_CTLCOLORLISTBOX
  {
    if (lParam === hWndContentList)
    {
      if (bMatchCase && bContentRE)
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorREC);
        return hBrushREC;
      }
      else if (bContentRE)
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorRE);
        return hBrush;
      }
      else if (bMatchCase)
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorMC);
        return hBrushC;
      }
      else
      {
        oSys.Call("Gdi32::SetBkColor", wParam, nBkColorT);
        return hBrushT;
      }
    }
  }
  ////////////////////////////////////////////////////////////////////////// end inputs status highlight

  else if (uMsg === 256) //WM_KEYDOWN
  {
    if (wParam === 0x0D /*VK_RETURN*/)
    {
      hWndFocus = oSys.Call("User32::GetFocus");
      if ((! Ctrl()) && Shift())
      {
        if (hWndFocus !== aWnd[IDFILELV][HWND])
          oSys.Call("User32::SetFocus", aWnd[IDFILELV][HWND]);
        else if (hWndFocus === aWnd[IDFILELV][HWND])
          OpenOrCloseFile(1);
      }
      else if (Ctrl() && (! Shift()))
        TextSearchOptions();
      else if (Ctrl() && Shift())
        TextSearchOptions('up');
      else
      {
        if (hWndFocus === aWnd[IDFILELV][HWND])
          oSys.Call("User32::PostMessageW", hWnd, 273 /*WM_COMMAND*/, IDEDITB, 0);
        else if (IsCloseCB() &&
                (hWndFocus !== aWnd[IDCURRENTB][HWND]) && (hWndFocus !== aWnd[IDBROWSEB][HWND]) && (hWndFocus !== aWnd[IDHELP1B   ][HWND]) &&
                (hWndFocus !== aWnd[IDHELP2B  ][HWND]) && (hWndFocus !== aWnd[IDSEARCHB][HWND]) && (hWndFocus !== aWnd[IDEDITB    ][HWND]) &&
                (hWndFocus !== aWnd[IDCOPYB   ][HWND]) && (hWndFocus !== aWnd[IDCLEARB ][HWND]) && (hWndFocus !== aWnd[IDSETTINGSB][HWND]))
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDSEARCHB, 0);
      }
    }
    else if (wParam === 0x70 /*VK_F1*/)
    {
      if ((! Ctrl()) && (! Shift()))
      {
        hWndFocus = oSys.Call("User32::GetFocus");
        if (hWndFocus === hWndNameEdit)
        {
          oSys.Call("User32::SetFocus", aWnd[IDHELP1B][HWND]);
          Help(IDHELP1B, 1);
        }
        else if (bContentRE && (hWndFocus === hWndContentEdit))
        {
          oSys.Call("User32::SetFocus", aWnd[IDHELP2B][HWND]);
          Help(IDHELP2B, 1);
        }
      }
    }
    else if (wParam === 0x73 /*VK_F4*/)
    {
      if ((! Ctrl()) && (! Shift()))
        oSys.Call("User32::PostMessageW", hWnd, 273 /*WM_COMMAND*/, IDEDITB, 0);
    }
    else if (wParam === 0x1B /*VK_ESCAPE*/)
    {
      if (/* ! bSeparateWnd */ IsCloseCB())
        PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
    }
    else if (wParam === 0x26 /*UP ARROW key VK_UP*/)
    {
      if (Ctrl() && (! Shift()))
        oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);
    }
    else if (wParam === 0x28 /*DOWN ARROW key VK_DOWN*/)
    {
      if (Ctrl() && (! Shift()))
        oSys.Call("User32::SetFocus", aWnd[IDFILELV][HWND]);
    }
    else if (wParam === 0x49 /*I key VK_KEY_I*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Scripts::Main", 1, "FileInfo.js", "1 CWL 2 -1");
      if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "FileInfo.js", '1 CWL -1 -1');
    }
    else if (wParam === 0x50 /*P key VK_KEY_P*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Command(4199);
      else if (Ctrl() && Shift())
        AkelPad.Command(4200);
    }
    else if (wParam === 0x53 /*S key VK_KEY_S*/)
    {
      if (Ctrl() && (! Shift()))
        FindToLog();
      else if (Ctrl() && Shift())
        FindToLog(26);
    }
    else if (wParam === 0x41 /*A key VK_KEY_A*/)
    {
      if (Ctrl() && Shift())
        qSearchLog();
    }
    else if (wParam === 0x42 /*B key VK_KEY_B*/)
    {
      if (Ctrl() && (! Shift()))
      {
        if (IsLineBoard())
          AkelPad.Call("LineBoard::Main::NextBookmark");
      }
      else if (Ctrl() && Shift())
      {
        if (IsLineBoard())
          AkelPad.Call("LineBoard::Main::PrevBookmark");
      }
    }
    else if (wParam === 0x45 /*E key VK_KEY_E*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Explorer::Main", 1, sDir);
      if (Ctrl() && Shift())
        AkelPad.Exec('explorer "'+ sDir +'"');
    }
    else if (wParam === 0x46 /*F key VK_KEY_F*/)
    {
      if (Ctrl() && (! Shift()))
        oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);
      else if (Ctrl() && Shift())
      {
        if (! bSeparateWnd)
          PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
        AkelPad.Call("Scripts::Main", 1, "FindReplaceFiles_extended.js", "-sWhat='"+ sContent +"' -sDir='"+ sDir +"' -sWith='"+ ((sReplace)? sReplace : sContent) +"'");
      }
    }
    else if (wParam === 0x54 /*T key VK_KEY_T*/)
    {
      if (Ctrl() && Shift())
        AkelPad.Command(5002);
    }
    else if (wParam === 0x57 /*W key VK_KEY_W*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Command(4318);
      else if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "TabCloseExts.vbs")
    }
    else if (wParam === 0x48 /*H key VK_KEY_H*/)
    {
      if (Ctrl() && (! Shift()))
      {
        sContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
        if (! bSeparateWnd)
          PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
        AkelPad.Call("Scripts::Main", 1, "TextReplacer.js", "-sWhat='"+ sContent +"' -sWith='"+ ((sReplace)? sReplace : sContent) +"'");
      }
    }
    else if (wParam === 0x52 /*R key VK_KEY_R*/)
    {
      if (Ctrl() && (! Shift()))
      {
        if (! bSeparateWnd)
          PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
        AkelPad.Call("Scripts::Main", 1, "FindReplaceFiles_extended.js", "-sWhat='"+ sContent +"' -sDir='"+ sDir +"' -sWith='"+ ((sReplace)? sReplace : sContent) +"'");
      }
    }
    else if (wParam === 0x4C /*L key VK_KEY_L*/)
    {
      if (Ctrl() && (! Shift()))
        FindstrLog();
      else if (Ctrl() && Shift())
        FindstrLog(24);
    }
    else if (wParam === 0x4E /*N key VK_KEY_N*/)
    {
      if (Ctrl() && (! Shift()))
        FindstrLog(8388608);
    }
    else if (wParam === 0x4D /*M key VK_KEY_M*/)
    {
      sContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ sContent +"'");
      else if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ sContent +"' -tabs=4");
    }
    else if (wParam === 0x4F /*O key VK_KEY_O*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Explorer::Main", 1, sDir);
      else if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", '"1"');
    }
    else if (wParam === 0x51 /*Q key VK_KEY_Q*/)
    {
      sContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
      if (Ctrl() && (! Shift()))
        highlight(sContent);
      else if (Ctrl() && Shift())
        highlight(sContent, 3);
    }
    else if (wParam === 0x09 /*TAB key VK_TAB*/) {
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Scripts::Main", 1, "TabSwitch.js", '-Next=false -OnlyNames=true -FontSize=11 -LineGap=4');
      else if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "TabSwitch.js", '-Next=-1 -CtrlTab=false -MinTabs=1 -WindowLeft=-1 -WindowTop=-1 -OnlyNames=true -FontSize=12');
    }
    else if ((wParam === 186/*VK_OEM_1*/)) {
      if (Ctrl() && (! Shift()))
        AkelPad.Command(4333);
    }
  }

  else if (uMsg === 260) //WM_SYSKEYDOWN
  {
    if ((! Ctrl()) && (! Shift()))
    {
      if (wParam === 0x46 /*F key*/)
          oSys.Call("User32::SetFocus", aWnd[IDFILELV][HWND]);
      else if (wParam === 0x2E /*VK_DELETE*/)
      {
        if (AkelPad.SendMessage(aWnd[IDDIRCB][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aWnd[IDDIRCB][HWND], aDirs);
        else if (AkelPad.SendMessage(aWnd[IDNAMECB][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aWnd[IDNAMECB][HWND], aNames);
        else if (AkelPad.SendMessage(aWnd[IDCONTENTCB][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aWnd[IDCONTENTCB][HWND], aContents);
      }
      else if (wParam === 0x42 /*B key VK_KEY_B*/)
        BookmarkLines('', true);
      else if (wParam === 0x57 /*W key VK_KEY_W*/)
        AkelPad.Call("Scripts::Main", 1, "CloseTabByExt.js");
      else if (wParam === 0x4C /*L key VK_KEY_L*/)
        FindstrLog();
      else if (wParam === 0x47 /*G key VK_KEY_G*/)
        TextSearchOptions('word tabs');
      else if (wParam === 0x4D /*M key VK_KEY_M*/)
      {
        sContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ sContent +"' -clear=1");
      }
      else if (wParam === 0x48 /*H key VK_KEY_H*/)
      {
        sContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", ('-sSelText="'+ sContent +'" -bNotRegExp='+ ((bContentRE)?"0":"1")) );
      }
      else if (wParam === 0x5A /*Z key VK_KEY_Z*/)
        AkelPad.Command(4199);
      else if (wParam === 0x0D /*VK_RETURN*/)
        TextSearchOptions('word');
      else if (wParam === 0x26 /*UP ARROW key VK_UP*/)
      {
        oSys.Call("User32::SetFocus", aWnd[IDFILELV][HWND]);
        AkelPad.Call("Scroll::Settings", 4, -20);
      }
      else if (wParam === 0x28 /*DOWN ARROW key VK_DOWN*/)
      {
        oSys.Call("User32::SetFocus", aWnd[IDFILELV][HWND]);
        AkelPad.Call("Scroll::Settings", 4, 20);
      }
      else if (wParam === 0x25 /*LEFT ARROW key VK_LEFT*/)
        AkelPad.Command(4317);
      else if (wParam === 0x27 /*RIGHT ARROW key VK_RIGHT*/)
        AkelPad.Command(4316);
    }
    else if ((! Ctrl()) && Shift() && Alt()) {
      if (wParam === 0x4C /*L key VK_KEY_L*/)
        FindstrLog(24);
      else if (wParam === 0x4E /*N key VK_KEY_N*/)
        FindstrLog(8388608);
      else if (wParam === 0x41 /*A key VK_KEY_A*/)
        qSearchLog(3);
      else if (wParam === 0x42 /*B key VK_KEY_B*/)
        BookmarkLines('', false);
      else if (wParam === 0x47 /*G key VK_KEY_G*/)
        TextSearchOptions('word up tabs');
      else if (wParam === 0x4D /*M key VK_KEY_M*/)
        AkelPad.Call("Scripts::Main", 1, "MarkerPlus.vbs", '11');
      else if (wParam === 0x5A /*Z key VK_KEY_Z*/)
        AkelPad.Command(4200);
      else if (wParam === 0x0D /*VK_RETURN*/)
        TextSearchOptions('word up');
      else if (wParam === 0x25 /*LEFT ARROW key VK_LEFT*/)
        TextSearchOptions('word up');
      else if (wParam === 0x27 /*RIGHT ARROW key VK_RIGHT*/)
        TextSearchOptions('word');
      else if ((wParam === 186 /*VK_OEM_1*/))
        AkelPad.Command(4333);
    }
  }

  else if ((uMsg === 0x004E /*WM_NOTIFY*/) && (wParam === IDFILELV))
  {
    var inputCode = AkelPad.MemRead(lParam + (_X64 ? 16 : 8) /*code*/, DT_DWORD);
    switch (inputCode)
    {
      case -101 : //LVN_ITEMCHANGED
        if (AkelPad.MemRead(lParam + (_X64 ? 32 : 20) /*uNewState*/, DT_DWORD) & 0x1 /*LVIS_FOCUSED*/)
          SetTextSB(AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD));
        break;

      case -6 : //NM_RDBLCLK
        if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
        break;

      case -155 : //LVN_KEYDOWN
        if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*wVKey*/, DT_WORD) === 0x2E /*VK_DELETE*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            RemoveFromList();
        }
        else if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12), DT_WORD) === 0x41 /*A key*/)
        {
          if (Ctrl() && (! Shift()) && (! Alt()))
            SetSelAllLV();
        }
        else if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12), DT_WORD) === 0x43 /*C key*/)
        {
          if (Ctrl() && (! Shift()) && (! Alt()))
            CopySelected();
        }
        break;

      case -108 : //LVN_COLUMNCLICK
        bSortDesc = ! bSortDesc;
        nFilesFoc = aFiles.length - GetCurFocLV() - 1;

        GetSelArrayLV();
        aFiles.reverse();
        aFilesSel.reverse();

        for (var i = 0; i < aFilesSel.length; ++i)
          aFilesSel[i] = aFiles.length - aFilesSel[i] - 1;

        SetHeaderLV();
        FillLV();
    }

    if (inputCode === -3 /*NM_DBLCLK*/)
    {
      if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
        SetSelLV(GetCurFocLV());
      else
      {
        if (bLogShow)
          qSearching(searchSelect());
        else
          OpenOrCloseFile();
      }
    }
    else if (inputCode === -2 /*NM_CLICK*/)
    {
      if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
        SetSelLV(GetCurFocLV());
      else
        OpenFileAndFindBeginOrFindNext();
    }
    else if (inputCode === -5 /*NM_RCLICK*/) {
      if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
        SetSelLV(GetCurFocLV());
      else
        OpenFileAndFindBeginOrFindNext(true);
    }
  }

  else if (uMsg === 273) //WM_COMMAND
  {
    var nLowParam = LoWord(wParam);
    var nHiwParam = HiWord(wParam);
    bCloseCBL = 1;

    if (nLowParam === IDNAMECB)
    {
      if (nHiwParam === 3 /*CBN_SETFOCUS*/)
        AkelPad.SendMessage(lParam, 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(nNameSel1, nNameSel2));
      else if (nHiwParam === 10 /*CBN_SELENDCANCEL*/)
      {
        nNameSel1 = LoWord(AkelPad.SendMessage(lParam, 0x0140 /*CB_GETEDITSEL*/, 0, 0));
        nNameSel2 = HiWord(AkelPad.SendMessage(lParam, 0x0140 /*CB_GETEDITSEL*/, 0, 0));
      }
    }
    else if (nLowParam === IDCONTENTCB)
    {
      if (nHiwParam === 3 /*CBN_SETFOCUS*/)
        AkelPad.SendMessage(lParam, 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(nContentSel1, nContentSel2));
      else if (nHiwParam === 10 /*CBN_SELENDCANCEL*/)
      {
        nContentSel1 = LoWord(AkelPad.SendMessage(lParam, 0x0140 /*CB_GETEDITSEL*/, 0, 0));
        nContentSel2 = HiWord(AkelPad.SendMessage(lParam, 0x0140 /*CB_GETEDITSEL*/, 0, 0));
      }
    }
    else if (nLowParam === IDLEVELCB)
    {
      if (nHiwParam === 1 /*CBN_SELCHANGE*/)
      {
        nDirLevel = AkelPad.SendMessage(aWnd[IDLEVELCB][HWND], 0x0147 /*CB_GETCURSEL*/, 0, 0);
        if (nDirLevel === (AkelPad.SendMessage(aWnd[IDLEVELCB][HWND], 0x0146 /*CB_GETCOUNT*/, 0, 0) - 1))
          nDirLevel = -1;
      }
      else if (nHiwParam === 8 /*CBN_CLOSEUP*/)
        bCloseCBL = 0;
    }
    else if (nLowParam === IDCURRENTB)
      CurrentDir();
    else if (nLowParam === IDBROWSEB)
      BrowseDirs();
    else if ((nLowParam === IDHELP1B) || (nLowParam === IDHELP2B))
      Help(nLowParam);
    else if (nLowParam === IDNAMERE)
      {
        bNameRE = ! bNameRE;
        SetWindowText(aWnd[IDNAMEG][HWND], sTxtFileName + (bNameRE ? "" : " " + sTxtWildcards));
        oSys.Call("User32::InvalidateRect", hWndNameEdit, 0, true);
      }
    else if (nLowParam === IDNOTNAME)
      bNotName = ! bNotName;
    else if (nLowParam === IDMATCHWORD)
      bMatchWord = ! bMatchWord;
    else if (nLowParam === IDMATCHCASE)
      bMatchCase = ! bMatchCase;
    else if (nLowParam === IDCONTENTRE)
    {
      bContentRE = ! bContentRE;
      EnableButtons();
      oSys.Call("User32::InvalidateRect", hWndContentEdit, 0, true);
    }
    else if (nLowParam === IDMULTILINE)
      bMultiline = ! bMultiline;
    else if (nLowParam === IDNOTCONTAIN)
      bNotContain = ! bNotContain;
    else if (nLowParam === IDINSTREAMS)
      bInStreams = ! bInStreams;
    else if (nLowParam === IDSKIPBINARY)
      bSkipBinary = ! bSkipBinary;
    else if (nLowParam === IDMAXSIZE)
    {
      if (nHiwParam === 0x0300 /*EN_CHANGE*/)
      {
        nMaxFileSize = parseInt(GetWindowText(lParam), 10);
        if ((! isFinite(nMaxFileSize)) || (nMaxFileSize <= 0))
        {
          nMaxFileSize = 0;
          SetWindowText(lParam, "");
        }
      }
    }
    else if (nLowParam === IDSEARCHB)
      SearchFiles();
    else if (nLowParam === IDEDITB)
      OpenFiles();
    else if (nLowParam === IDCOPYB)
      CopyList();
    else if (nLowParam === IDCLEARB)
      ClearList();
    else if (nLowParam === IDSETTINGSB)
      Settings();
    else if (nLowParam === IDCLOSEB)
      oSys.Call("User32::PostMessageW", hWnd, 16 /*WM_CLOSE*/, 0, 0);
  }

  else if (uMsg === 16) //WM_CLOSE
  {
    WriteIni();
    oSys.Call("User32::DestroyWindow", hWnd); //Destroy dialog
  }

  else if (uMsg === 2) //WM_DESTROY
    oSys.Call("User32::PostQuitMessage", 0); //Exit message loop

  else
  {
    var nID = oSys.Call("User32::GetDlgCtrlID", oSys.Call("User32::GetFocus"));
    if (nID === IDFILELV)
      nID = IDEDITB;
    else if ((nID !== IDCURRENTB) && (nID !== IDBROWSEB) && (nID !== IDHELP1B) && (nID !== IDHELP2B) && (nID < IDSEARCHB))
      nID = IDSEARCHB;
    oSys.Call("User32::DefDlgProcW", hWnd, 1025 /*DM_SETDEFID*/, nID, 0);
  }

  return 0;
}

function LoWord(nParam)
{
  return (nParam & 0xFFFF);
}

function HiWord(nParam)
{
  return ((nParam >> 16) & 0xFFFF);
}

function MkLong(nLoWord, nHiWord)
{
  return (nLoWord & 0xFFFF) | (nHiWord << 16);
}

function Ctrl()
{
  return Boolean(oSys.Call("User32::GetKeyState", 0x11 /*VK_CONTROL*/) & 0x8000);
}

function Shift()
{
  return Boolean(oSys.Call("User32::GetKeyState", 0x10 /*VK_SHIFT*/) & 0x8000);
}

function Alt()
{
  return Boolean(oSys.Call("User32::GetKeyState", 0x12 /*VK_MENU*/) & 0x8000);
}

function GetWindowPos(hWnd, oRect)
{
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("User32::GetWindowRect", hWnd, lpRect);

  oRect.X = AkelPad.MemRead(lpRect,      DT_DWORD);
  oRect.Y = AkelPad.MemRead(lpRect +  4, DT_DWORD);
  oRect.W = AkelPad.MemRead(lpRect +  8, DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(lpRect + 12, DT_DWORD) - oRect.Y;

  AkelPad.MemFree(lpRect);
}

function GetWindowText(hWnd)
{
  oSys.Call("User32::GetWindowTextW", hWnd, lpBuffer, nBufSize / 2);
  return AkelPad.MemRead(lpBuffer, DT_UNICODE);
}

function SetWindowText(hWnd, sText)
{
  oSys.Call("User32::SetWindowTextW", hWnd, sText);
}

function ResizeWindow(hWnd)
{
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
  var nW, nH, nBW;
  var i;

  oSys.Call("User32::GetClientRect", hWnd, lpRect);
  nW  = AkelPad.MemRead(lpRect +  8, DT_DWORD);
  nH  = AkelPad.MemRead(lpRect + 12, DT_DWORD);
  nBW = (nW - (IDCLOSEB - IDSEARCHB) * 5 - 2 * 5) / (IDCLOSEB - IDSEARCHB + 1);
  AkelPad.MemFree(lpRect);

  oSys.Call("User32::SetWindowPos",
            aWnd[IDDIRG][HWND], 0,
            5,
            5,
            nW - 10,
            70,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDDIRCB][HWND], 0,
            15,
            22,
            nW - 30,
            21,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  for (i = IDCURRENTB; i <= IDBROWSEB; ++i)
  {
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              15 + (i - IDCURRENTB) * (80 + 5),
              46,
              80,
              21,
              0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  }
  oSys.Call("User32::SetWindowPos",
            aWnd[IDSUBDIRS][HWND], 0,
            nW - 110 - 5 - 75 - 15,
            51,
            110,
            13,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDLEVELCB][HWND], 0,
            nW - 75 - 15,
            46,
            75,
            21,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDNAMEG][HWND], 0,
            5,
            80,
            nW - 10,
            65,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDNAMECB][HWND], 0,
            15,
            97,
            nW - 50,
            21,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDHELP1B][HWND], 0,
            nW - 35,
            97,
            20,
            21,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  for (i = IDNAMERE; i <= IDNOTNAME; ++i)
  {
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              15 + (i - IDNAMERE) * 160,
              122,
              150,
              16,
              0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  }
  oSys.Call("User32::SetWindowPos",
            aWnd[IDCONTENTG][HWND], 0,
            5,
            150,
            nW - 10,
            105,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDCONTENTCB][HWND], 0,
            15,
            167,
            nW - 50,
            21,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDHELP2B][HWND], 0,
            nW - 35,
            167,
            20,
            21,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  for (i = IDMATCHCASE; i <= IDMULTILINE; ++i)
  {
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              15,
              192 + (i - IDMATCHCASE) * 20,
              150,
              16,
              0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  }
  for (i = IDNOTCONTAIN; i <= IDSKIPBINARY; ++i)
  {
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              175,
              192 + (i - IDNOTCONTAIN) * 20,
              150,
              16,
              0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  }
  oSys.Call("User32::SetWindowPos",
            aWnd[IDSKIPLARGER][HWND], 0,
            335,
            192,
            85,
            26,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDMAXSIZE][HWND], 0,
            335,
            223,
            72,
            20,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDBYTESYMBOL][HWND], 0,
            410,
            225,
            10,
            13,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  oSys.Call("User32::SetWindowPos",
            aWnd[IDFILELV][HWND], 0,
            5,
            265,
            nW - 10,
            nH - 265 - 3 - 21 - 26,
            0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  for (i = IDSEARCHB; i <= IDCLOSEB; ++i)
  {
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              5 + (i - IDSEARCHB) * (nBW + 5),
              nH - 21 - 26,
              nBW,
              21,
              0x14 /*SWP_NOACTIVATE|SWP_NOZORDER*/);
  }

  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x101E /*LVM_SETCOLUMNWIDTH*/, 0, -2 /*LVSCW_AUTOSIZE_USEHEADER*/);
  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1013 /*LVM_ENSUREVISIBLE*/, GetCurFocLV(), false);
  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 5 /*WM_SIZE*/, 0, 0);
}

function EnableButtons()
{
  oSys.Call("User32::EnableWindow", aWnd[IDHELP2B   ][HWND], bContentRE);
  oSys.Call("User32::EnableWindow", aWnd[IDMULTILINE][HWND], bContentRE);
  oSys.Call("User32::EnableWindow", aWnd[IDEDITB    ][HWND], aFiles.length);
  oSys.Call("User32::EnableWindow", aWnd[IDCOPYB    ][HWND], aFiles.length);
  oSys.Call("User32::EnableWindow", aWnd[IDCLEARB   ][HWND], aFiles.length);
}

function IsCloseCB()
{
  return (! AkelPad.SendMessage(aWnd[IDDIRCB    ][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         (! AkelPad.SendMessage(aWnd[IDNAMECB   ][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         (! AkelPad.SendMessage(aWnd[IDCONTENTCB][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         bCloseCBL;
}

function FillCB()
{
  var nPos;
  var i;

  for (i = 0; i < aDirs.length; ++i)
    AkelPad.SendMessage(aWnd[IDDIRCB][HWND], 0x0143 /*CB_ADDSTRING*/, 0, aDirs[i]);

  for (i = 0; i < aNames.length; ++i)
    AkelPad.SendMessage(aWnd[IDNAMECB][HWND], 0x0143 /*CB_ADDSTRING*/, 0, aNames[i]);

  for (i = 0; i < aContents.length; ++i)
    AkelPad.SendMessage(aWnd[IDCONTENTCB][HWND], 0x0143 /*CB_ADDSTRING*/, 0, aContents[i]);

  for (i = 0; i < nMaxLenCBL - 1; ++i)
    AkelPad.SendMessage(aWnd[IDLEVELCB][HWND], 0x0143 /*CB_ADDSTRING*/, 0, i.toString());

  nPos = AkelPad.SendMessage(aWnd[IDLEVELCB][HWND], 0x0143 /*CB_ADDSTRING*/, 0, sTxtAll);
  if ((nDirLevel >= 0) && (nDirLevel < nMaxLenCBL))
    nPos = nDirLevel;
  else
    nDirLevel = -1;

  AkelPad.SendMessage(aWnd[IDLEVELCB][HWND], 0x014E /*CB_SETCURSEL*/, nPos, 0);
}

function InsertToCB()
{
  var aCB = [{Wnd: aWnd[IDDIRCB][HWND],     Array: aDirs,     Text: sDir},
             {Wnd: aWnd[IDNAMECB][HWND],    Array: aNames,    Text: sName},
             {Wnd: aWnd[IDCONTENTCB][HWND], Array: aContents, Text: sContent}];
  var nPos;
  var i;

  for (i = 0; i < aCB.length; ++i)
  {
    if (aCB[i].Text)
    {
      nPos = FindInArray(aCB[i].Array, aCB[i].Text);

      if (nPos === -1)
      {
        if (aCB[i].Array.length === nMaxLenCBE)
        {
          aCB[i].Array.length = nMaxLenCBE - 1;
          AkelPad.SendMessage(aCB[i].Wnd, 0x0144 /*CB_DELETESTRING*/, nMaxLenCBE - 1, 0);
        }

        aCB[i].Array.unshift(aCB[i].Text);
        AkelPad.SendMessage(aCB[i].Wnd, 0x014A /*CB_INSERTSTRING*/, 0, aCB[i].Text);
      }
      else if (nPos > 0)
      {
        aCB[i].Array.splice(nPos, 1);
        aCB[i].Array.unshift(aCB[i].Text);
        AkelPad.SendMessage(aCB[i].Wnd, 0x0144 /*CB_DELETESTRING*/, nPos, 0);
        AkelPad.SendMessage(aCB[i].Wnd, 0x014A /*CB_INSERTSTRING*/, 0, aCB[i].Text);
        AkelPad.SendMessage(aCB[i].Wnd, 0x014E /*CB_SETCURSEL*/, 0, 0);
      }
    }
  }
}

function FindInArray(aArray, sText)
{
  for (var i = 0; i < aArray.length; ++i)
  {
    if (aArray[i] === sText)
      return i;
  }
  return -1;
}

function DeleteItemCB(hWndCB, aItems)
{
  var nPos = AkelPad.SendMessage(hWndCB, 0x0147 /*CB_GETCURSEL*/, 0, 0);

  aItems.splice(nPos, 1);

  AkelPad.SendMessage(hWndCB, 0x0144 /*CB_DELETESTRING*/, nPos, 0);

  if (nPos > aItems.length - 1)
    nPos = aItems.length - 1;

  AkelPad.SendMessage(hWndCB, 0x014E /*CB_SETCURSEL*/, nPos, 0);
}

function GetCurFocLV()
{
  return AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x100C /*LVM_GETNEXTITEM*/, -1, 0x0001 /*LVNI_FOCUSED*/);
}

function GetNextSelLV(nItem)
{
  return AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x100C /*LVM_GETNEXTITEM*/, nItem, 0x0002 /*LVNI_SELECTED*/);
}

function GetSelArrayLV()
{
  var nItem = -1;
  aFilesSel = [];

  while ((nItem = GetNextSelLV(nItem)) >= 0)
    aFilesSel.push(nItem);

  if (! aFilesSel.length)
    aFilesSel = [GetCurFocLV()];
}

function SetSelLV(nItem)
{
  AkelPad.MemCopy(lpLVITEM + 12, 0x0003 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD);
  AkelPad.MemCopy(lpLVITEM + 16, 0x0003 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD);

  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x102B /*LVM_SETITEMSTATE*/, nItem, lpLVITEM);
  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1013 /*LVM_ENSUREVISIBLE*/, nItem, true);
}

function SetSelArrayLV()
{
  AkelPad.MemCopy(lpLVITEM + 12, 0x0002 /*LVIS_SELECTED*/, DT_DWORD);
  AkelPad.MemCopy(lpLVITEM + 16, 0x0002 /*LVIS_SELECTED*/, DT_DWORD);

  for (var i = 0; i < aFilesSel.length; ++i)
    AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x102B /*LVM_SETITEMSTATE*/, aFilesSel[i], lpLVITEM);

  AkelPad.MemCopy(lpLVITEM + 12, 0x0001 /*LVIS_FOCUSED*/, DT_DWORD);
  AkelPad.MemCopy(lpLVITEM + 16, 0x0001 /*LVIS_FOCUSED*/, DT_DWORD);

  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x102B /*LVM_SETITEMSTATE*/, nFilesFoc, lpLVITEM);
  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1013 /*LVM_ENSUREVISIBLE*/, nFilesFoc, true);
}

function SetSelAllLV()
{
  AkelPad.MemCopy(lpLVITEM + 12, 0x0002 /*LVIS_SELECTED*/, DT_DWORD);
  AkelPad.MemCopy(lpLVITEM + 16, 0x0002 /*LVIS_SELECTED*/, DT_DWORD);

  for (var i = 0; i < aFiles.length; ++i)
    AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x102B /*LVM_SETITEMSTATE*/, i, lpLVITEM);
}

function InsertItemLV(nItem, sText)
{
  AkelPad.MemCopy(lpLVITEM + 4, nItem, DT_DWORD); //iItem
  AkelPad.MemCopy(lpLVITEM + 8,     0, DT_DWORD); //iSubItem
  AkelPad.MemCopy(lpBuffer, sText, DT_UNICODE);
  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x104D /*LVM_INSERTITEMW*/, 0, lpLVITEM);
}

function SetColumnLV()
{
  var lpLVCOLUMN = AkelPad.MemAlloc(_X64 ? 56 : 44); //sizeof(LVCOLUMN)

  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1061 /*LVM_INSERTCOLUMNW*/, 0, lpLVCOLUMN);

  AkelPad.MemFree(lpLVCOLUMN);
}

function SetHeaderLV()
{
  var lpHDITEM = AkelPad.MemAlloc(_X64 ? 72 : 48); //sizeof(HDITEM)
  var nFmt     = 0x4000 /*HDF_STRING*/ | (bSortDesc ? 0x0200 /*HDF_SORTDOWN*/ : 0x0400 /*HDF_SORTUP*/);
  var hHeader  = AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x101F /*LVM_GETHEADER*/, 0, 0);

  AkelPad.MemCopy(lpBuffer, sTxtFiles, DT_UNICODE);

  AkelPad.MemCopy(lpHDITEM, 0x06, DT_DWORD); //mask=HDI_FORMAT|HDI_TEXT
  AkelPad.MemCopy(lpHDITEM + 8, lpBuffer, DT_QWORD); //pszText
  AkelPad.MemCopy(lpHDITEM + (_X64 ? 24 : 16), nBufSize, DT_DWORD); //cchTextMax
  AkelPad.MemCopy(lpHDITEM + (_X64 ? 28 : 20), nFmt, DT_DWORD); //fmt

  AkelPad.SendMessage(hHeader, 0x120C /*HDM_SETITEMW*/, 0, lpHDITEM);

  AkelPad.MemFree(lpHDITEM);
}

function SetPartsSB()
{
  var lpParts = AkelPad.MemAlloc(5 * 4);

  AkelPad.MemCopy(lpParts,       90, DT_DWORD);
  AkelPad.MemCopy(lpParts +  4, 190, DT_DWORD);
  AkelPad.MemCopy(lpParts +  8, 310, DT_DWORD);
  AkelPad.MemCopy(lpParts + 12, 350, DT_DWORD);
  AkelPad.MemCopy(lpParts + 16,  -1, DT_DWORD);

  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 0x0404 /*SB_SETPARTS*/, 5, lpParts);

  AkelPad.MemFree(lpParts);
}

function SetTextSB(nItem)
{
  var sText0 = "";
  var sText1 = "";
  var sText2 = "";
  var sText3 = "";
  var sText4 = "";
  var hFile;
  var lpFileInfo;
  var lpDecimalSep;
  var lpThousandSep;
  var lpNUMBERFMT;
  var lpLocalFileTime;
  var lpSysTime;
  var nSizeHi;
  var nSizeLo;

  if ((nItem > -1) && aFiles.length)
  {
    sText0 = "\t\t" + (nItem + 1) + "/" + aFiles.length + " ";
    hFile  = oSys.Call("Kernel32::CreateFileW",
                       aFiles[nItem], //lpFileName
                       0,  //dwDesiredAccess
                       3,  //dwShareMode = FILE_SHARE_READ|FILE_SHARE_WRITE
                       0,  //lpSecurityAttributes
                       3,  //dwCreationDisposition = OPEN_EXISTING
                       0,  //dwFlagsAndAttributes
                       0); //hTemplateFile
    lpFileInfo = AkelPad.MemAlloc(52); //sizeof(BY_HANDLE_FILE_INFORMATION)

    if (hFile && oSys.Call("Kernel32::GetFileInformationByHandle", hFile, lpFileInfo))
    {
      //file size
      nSizeHi = AkelPad.MemRead(lpFileInfo + 32, DT_DWORD);
      nSizeLo = AkelPad.MemRead(lpFileInfo + 36, DT_DWORD);
      if (nSizeLo < 0)
        nSizeLo += 0xFFFFFFFF + 1;

      lpDecimalSep  = AkelPad.MemAlloc(4 * 2);
      lpThousandSep = AkelPad.MemAlloc(4 * 2);
      lpNUMBERFMT   = AkelPad.MemAlloc(_X64 ? 40 : 24); //sizeof(NUMBERFMT)
      AkelPad.MemCopy(lpNUMBERFMT + 8, 3, DT_DWORD); //Grouping
      AkelPad.MemCopy(lpNUMBERFMT + (_X64 ? 16 : 12), lpDecimalSep,  DT_QWORD);
      AkelPad.MemCopy(lpNUMBERFMT + (_X64 ? 24 : 16), lpThousandSep, DT_QWORD);

      oSys.Call("Kernel32::GetLocaleInfoW", 0x400 /*LOCALE_USER_DEFAULT*/,  0xE /*LOCALE_SDECIMAL*/,  lpDecimalSep,  4);
      oSys.Call("Kernel32::GetLocaleInfoW", 0x400 /*LOCALE_USER_DEFAULT*/,  0xF /*LOCALE_STHOUSAND*/, lpThousandSep, 4);
      oSys.Call("Kernel32::GetNumberFormatW",
                0x400, //LOCALE_USER_DEFAULT
                0,
                (nSizeHi * (0xFFFFFFFF + 1) + nSizeLo).toString(),
                lpNUMBERFMT,
                lpBuffer,
                nBufSize / 2);

      AkelPad.MemFree(lpDecimalSep);
      AkelPad.MemFree(lpThousandSep);
      AkelPad.MemFree(lpNUMBERFMT);

      sText1 = "\t\t" + AkelPad.MemRead(lpBuffer, DT_UNICODE) + " " + sTxtByteSymbol + " ";

      //file date and time
      lpLocalFileTime = AkelPad.MemAlloc(8);  //FILETIME
      lpSysTime       = AkelPad.MemAlloc(16); //SYSTEMTIME

      oSys.Call("Kernel32::FileTimeToLocalFileTime", lpFileInfo + 20, lpLocalFileTime);
      oSys.Call("Kernel32::FileTimeToSystemTime", lpLocalFileTime, lpSysTime);
      oSys.Call("Kernel32::GetDateFormatW",
                0x400, //LOCALE_USER_DEFAULT
                0x1,   //DATE_SHORTDATE
                lpSysTime,
                0,
                lpBuffer,
                64);
      oSys.Call("Kernel32::GetTimeFormatW",
                0x400, //LOCALE_USER_DEFAULT
                0x8,   //TIME_FORCE24HOURFORMAT
                lpSysTime,
                0,
                lpBuffer + 128,
                64);

      AkelPad.MemFree(lpLocalFileTime);
      AkelPad.MemFree(lpSysTime);

      sText2 = "\t" + AkelPad.MemRead(lpBuffer, DT_UNICODE) + "  " + AkelPad.MemRead(lpBuffer + 128, DT_UNICODE);

      //file attributes
      if (AkelPad.MemRead(lpFileInfo, DT_DWORD) & 32 /*FILE_ATTRIBUTE_ARCHIVE*/)
        sText3 += "A";
      if (AkelPad.MemRead(lpFileInfo, DT_DWORD) & 2 /*FILE_ATTRIBUTE_HIDDEN*/)
        sText3 += "H";
      if (AkelPad.MemRead(lpFileInfo, DT_DWORD) & 1 /*FILE_ATTRIBUTE_READONLY*/)
        sText3 += "R";
      if (AkelPad.MemRead(lpFileInfo, DT_DWORD) & 4 /*FILE_ATTRIBUTE_SYSTEM*/)
        sText3 += "S";

      if (aFiles[nItem].lastIndexOf(":") > 2)
        sText4 = sTxtNTFSStream;
    }

    oSys.Call("Kernel32::CloseHandle", hFile);
    AkelPad.MemFree(lpFileInfo);
  }
  else if (nItem === -2)
    sText0 = "\t" + sTxtWait;

  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 0x040B /*SB_SETTEXTW*/, 0, sText0);
  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 0x040B /*SB_SETTEXTW*/, 1, sText1);
  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 0x040B /*SB_SETTEXTW*/, 2, sText2);
  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 0x040B /*SB_SETTEXTW*/, 3, sText3);
  AkelPad.SendMessage(aWnd[IDSTATUS][HWND], 0x040B /*SB_SETTEXTW*/, 4, sText4);
}

function FillLV()
{
  var nNameBegin = 0;
  var i;

  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x000B /*WM_SETREDRAW*/, 0, 0);
  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);

  if (aFiles.length)
  {
    if (! bPathShow)
      nNameBegin = nPathLen;

    for (i = 0; i < aFiles.length; ++i)
      InsertItemLV(i, aFiles[i].substr(nNameBegin));

    SetSelArrayLV();
  }
  else
    InsertItemLV(0, sTxtNoFiles);

  if (GetNextSelLV(-1) < 0)
    SetSelLV(0);

  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x101E /*LVM_SETCOLUMNWIDTH*/, 0, -2 /*LVSCW_AUTOSIZE_USEHEADER*/);
  AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x000B /*WM_SETREDRAW*/, 1, 0);
}

function CurrentDir()
{
  sDir = AkelPad.GetEditFile(0);

  if (sDir)
    sDir = sDir.replace(/\\[^\\]+$/, "");
  else
    sDir = AkelPad.GetAkelDir();

  SetWindowText(aWnd[IDDIRCB][HWND], sDir);
  AkelPad.SendMessage(aWnd[IDDIRCB][HWND], 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(0, -1));
}

function BrowseDirs()
{
  var oRect = {};
  var sCurrentDir = GetWindowText(aWnd[IDDIRCB][HWND]).replace(/(^ +)|( +$)/g, "");
  GetWindowPos(aWnd[IDBROWSEB][HWND], oRect);
  var sSelDir = BrowseForFolder(hWndDlg, sTxtChooseDir + sCurrentDir, sCurrentDir, 0, 0, oRect.X, oRect.Y + oRect.H);

  if (sSelDir)
  {
    SetWindowText(aWnd[IDDIRCB][HWND], sSelDir);
    AkelPad.SendMessage(aWnd[IDDIRCB][HWND], 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(0, -1));
  }
}

function Help(nID, bKeyF1)
{
  var nString = 0x0000; //MF_STRING
  var nBreak  = 0x0060; //MF_MENUBREAK|MF_MENUBARBREAK
  var nSepar  = 0x0800; //MF_SEPARATOR
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var oRect   = {};
  var aMenu;
  var nCmd;

  GetWindowPos(aWnd[nID][HWND], oRect);

  if (nID === IDHELP1B && (! bNameRE))
    aMenu = [
      [nString, "?",   sHlpAnyChar],
      [nString, "*",   sHlpAnyString],
      [nString, '";"', sHlpSemicolQuot],
      [nSepar,  0, 0],
      [nString, ";",   sHlpListSepar]];
  else
    aMenu = [
      [nString, ".",       sHlpAnyChar_NL],
      [nString, "\\d",     sHlpDigit],
      [nString, "\\D",     sHlpNonDigit],
      [nString, "\\s",     sHlpWhiteSp],
      [nString, "\\S",     sHlpNonWhiteSp],
      [nString, "\\w",     sHlpWordChar],
      [nString, "\\W",     sHlpNonWordChar],
      [nString, "\\0",     sHlpNULL],
      [nString, "\\f",     sHlpFF],
      [nString, "\\n",     sHlpNL],
      [nString, "\\r",     sHlpCR],
      [nString, "\\t",     sHlpTab],
      [nString, "\\v",     sHlpVTab],
      [nString, "\\xFF",   sHlpCharHex],
      [nString, "\\u00FF", sHlpUniCharHex],
      [nSepar,  0, 0],
      [nString, "^",       sHlpBegin],
      [nString, "$",       sHlpEnd],
      [nString, "\\b",     sHlpWordBoun],
      [nString, "\\B",     sHlpNonWordBoun],
      [nBreak,  "ab|xy",   sHlpAlternative],
      [nString, "[abc]",   sHlpCharSet],
      [nString, "[^abc]",  sHlpNegCharSet],
      [nString, "[a-z]",   sHlpRange],
      [nString, "[^a-z]",  sHlpNegRange],
      [nSepar,  0, 0],
      [nString, "(ab)",    sHlpCapture],
      [nString, "(?:ab)",  sHlpNotCapture],
      [nString, "(?=ab)",  sHlpFollow],
      [nString, "(?!ab)",  sHlpNotFollow],
      [nString, "\\9",     sHlpBackrefer],
      [nString, "\\99",    sHlpBackrefer],
      [nSepar,  0, 0],
      [nString, "?",       sHlpZeroOrOne],
      [nString, "*",       sHlpZeroOrMore],
      [nString, "+",       sHlpOneOrMore],
      [nString, "{3}",     sHlpexactly],
      [nString, "{3,}",    sHlpAtLeast],
      [nString, "{3,7}",   sHlpFromTo],
      [nSepar,  0, 0],
      [nString, "\\(",     sHlpSpecChars]];

  for (i = 0; i < aMenu.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu, aMenu[i][0], i + 1, aMenu[i][1] + "\t" + aMenu[i][2]);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0188 /*TPM_NONOTIFY|TPM_RETURNCMD|TPM_TOPALIGN|TPM_RIGHTALIGN*/, oRect.X + oRect.W, oRect.Y + oRect.H, 0, hWndDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  --nID;

  if (nCmd)
  {
    if (nID === IDNAMECB)
    {
      AkelPad.SendMessage(aWnd[nID][HWND], 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(nNameSel1, nNameSel2));
      AkelPad.SendMessage(hWndNameEdit, 0x00C2 /*EM_REPLACESEL*/, 1, aMenu[nCmd - 1][1]);
      nNameSel1 += aMenu[nCmd - 1][1].length;
      nNameSel2  = nNameSel1;
    }
    else if (nID === IDCONTENTCB)
    {
      AkelPad.SendMessage(aWnd[nID][HWND], 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(nContentSel1, nContentSel2));
      AkelPad.SendMessage(hWndContentEdit, 0x00C2 /*EM_REPLACESEL*/, 1, aMenu[nCmd - 1][1]);
      nContentSel1 += aMenu[nCmd - 1][1].length;
      nContentSel2  = nContentSel1;
    }
  }

  if (nCmd || bKeyF1)
    oSys.Call("User32::PostMessageW", hWndDlg, 0x8001 /*WM_APP+1*/, aWnd[nID][HWND], 0);
}

function SearchFiles()
{
  var aPath = [];
  var sPattern;
  var rName;
  var rContent;
  var oError;
  var nMaxLevel;
  var bLevelOK;
  var hFindFile;
  var sFileName;
  var sFullName;
  var nReadFlag;
  var lpFile;
  var lpDetectFile;
  var nDetectFile;
  var nSizeHi;
  var nSizeLo;
  var nSize;
  var nMaxSize;
  var bNTFS;
  var aStreams;
  var i, n;

  sDir     = GetWindowText(aWnd[IDDIRCB][HWND]).replace(/(^ +)|( +$)/g, "");
  sName    = GetWindowText(aWnd[IDNAMECB][HWND]).replace(/(^[ ;]+)|([ ;]+$)/g, "");
  sContent = GetWindowText(aWnd[IDCONTENTCB][HWND]);

  SetWindowText(aWnd[IDDIRCB][HWND], sDir);
  SetWindowText(aWnd[IDNAMECB][HWND], sName);
  if (! sDir)
    CurrentDir();

  if (! IsDirExists(sDir))
  {
    WarningBox(sDir + "\n\n" + sTxtDirNoExist);
    oSys.Call("User32::PostMessageW", aWnd[IDDIRCB][HWND], 0x0007 /*WM_SETFOCUS*/, 0, 0);
    return;
  }

  if (sName && bNameRE)
  {
    try
    {
      rName = new RegExp(sName, "i");
    }
    catch (oError)
    {
      WarningBox(sName + "\n\n" + sTxtErrorRE);
      oSys.Call("User32::PostMessageW", aWnd[IDNAMECB][HWND], 0x0007 /*WM_SETFOCUS*/, 0, 0);
      return;
    }
  }

  if (sContent && bContentRE)
  {
    try
    {
      rContent = new RegExp(sContent, (bMatchCase ? "" : "i") + (bMultiline ? "m" : ""));
    }
    catch (oError)
    {
      WarningBox(sContent + "\n\n" + sTxtErrorRE);
      oSys.Call("User32::PostMessageW", aWnd[IDCONTENTCB][HWND], 0x0007 /*WM_SETFOCUS*/, 0, 0);
      return;
    }
  }

  SetTextSB(-2);
  InsertToCB();

  aFiles          = [];
  aFilesSel       = [0];
  nFilesFoc       = 0;
  aPath[0]        = sDir + ((sDir.slice(-1) != "\\") ? "\\" : "");
  nPathLen        = aPath[0].length;
  nMaxLevel       = (nDirLevel < 0) ? Infinity : nDirLevel;
  nMaxSize        = (nMaxFileSize <= 0) ? Infinity : nMaxFileSize;
  nReadFlag       = 0xC /*OD_ADT_DETECT_CODEPAGE|OD_ADT_DETECT_BOM*/;
  bNTFS           = IsSupportStreams(sDir.substr(0, 3));
  sLastContent    = sContent;
  bLastContentRE  = bContentRE;
  bLastMatchCase  = bMatchCase;
  bLastMultiline  = bMultiline;
  bLastNotContain = bNotContain;
  lpFile          = AkelPad.MemAlloc((260 + 260 + 36) * 2);
  lpDetectFile    = AkelPad.MemAlloc(_X64 ? 24 : 20); //sizeof(DETECTFILEW)

  AkelPad.MemCopy(lpDetectFile, lpFile, DT_QWORD);
  AkelPad.MemCopy(lpDetectFile + (_X64 ?  8 : 4), 1024, DT_DWORD); //dwBytesToCheck
  AkelPad.MemCopy(lpDetectFile + (_X64 ? 12 : 8), 0x1D, DT_DWORD); //dwFlags=ADT_NOMESSAGES|ADT_DETECT_BOM|ADT_DETECT_CODEPAGE|ADT_BINARY_ERROR

  if (sName && (! bNameRE))
  {
    if (! ~sName.indexOf("*"))
    {
      // TODO: sort results by extensions
      var sNameExt = AkelPad.GetFilePath(AkelPad.GetEditFile(0), 4);
      sName += "*"+ sNameExt +";"+ sName +".*;"+ sName +"*";
    }

    sPattern = sName.replace(/"(([^;"]*;+[^;"]*)+)"/g, function(){return arguments[1].replace(/;/g, "\0");});
    sPattern = sPattern.replace(/[\\\/.^$+|()\[\]{}]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".").replace(/ *; */g, "|").replace(/\0/g, ";");
    rName    = new RegExp("^(" + sPattern + ")$", "i");
  }

  if (sContent && (! bContentRE))
    rContent = new RegExp(sContent.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&"), (bMatchCase ? "" : "i"));

  for (i = 0; i < aPath.length; ++i)
  {
    hFindFile = oSys.Call("Kernel32::FindFirstFileW", aPath[i] + "*.*", lpBuffer);

    if (hFindFile !== -1) //INVALID_HANDLE_VALUE
    {
      bLevelOK = ((aPath[i].match(/\\/g).length - aPath[0].match(/\\/g).length) < nMaxLevel);

      do
      {
        sFileName = AkelPad.MemRead(lpBuffer + 44 /*offsetof(WIN32_FIND_DATAW, cFileName)*/, DT_UNICODE);
        sFullName = aPath[i] + sFileName;

        //files
        if (! (AkelPad.MemRead(lpBuffer, DT_DWORD) & 16 /*FILE_ATTRIBUTE_DIRECTORY*/))
        {
          if ((! sName) || ((! bNotName) && rName.test(sFileName)) || (bNotName && (! rName.test(sFileName))))
          {
            if (bInStreams && bNTFS)
            {
              aStreams = EnumStreams(sFullName);

              for (n = 0; n < aStreams.length; ++n)
              {
                sFullName = aPath[i] + sFileName + (aStreams[n][0] ? ":" + aStreams[n][0] : "");

                if (sContent)
                {
                  AkelPad.MemCopy(lpFile, sFullName, DT_UNICODE);
                  nDetectFile = AkelPad.SendMessage(hMainWnd, 1177 /*AKD_DETECTFILEW*/, 0, lpDetectFile);

                  if (((nDetectFile === 0 /*EDT_SUCCESS*/) || ((nDetectFile === -4 /*EDT_BINARY*/) && (! bSkipBinary))) && (aStreams[n][1] <= nMaxSize))
                  {
                    if (rContent.test(AkelPad.ReadFile(sFullName, nReadFlag)))
                    {
                      if (! bNotContain)
                        aFiles.push(sFullName);
                    }
                    else
                    {
                      if (bNotContain)
                        aFiles.push(sFullName);
                    }
                  }
                }
                else
                  aFiles.push(sFullName);
              }
            }
            else
            {
              if (sContent)
              {
                AkelPad.MemCopy(lpFile, sFullName, DT_UNICODE);
                nDetectFile = AkelPad.SendMessage(hMainWnd, 1177 /*AKD_DETECTFILEW*/, 0, lpDetectFile);

                nSizeHi = AkelPad.MemRead(lpBuffer + 28 /*offsetof(WIN32_FIND_DATAW, nFileSizeHigh)*/, DT_DWORD);
                nSizeLo = AkelPad.MemRead(lpBuffer + 32 /*offsetof(WIN32_FIND_DATAW, nFileSizeLow)*/,  DT_DWORD);
                if (nSizeLo < 0)
                  nSizeLo += 0xFFFFFFFF + 1;
                nSize = nSizeHi * (0xFFFFFFFF + 1) + nSizeLo;

                if (((nDetectFile === 0 /*EDT_SUCCESS*/) || ((nDetectFile === -4 /*EDT_BINARY*/) && (! bSkipBinary))) && (nSize <= nMaxSize))
                {
                  if (rContent.test(AkelPad.ReadFile(sFullName, nReadFlag)))
                  {
                    if (! bNotContain)
                      aFiles.push(sFullName);
                  }
                  else
                  {
                    if (bNotContain)
                      aFiles.push(sFullName);
                  }
                }
              }
              else
                aFiles.push(sFullName);
            }
          }
        }
        //directories
        else if (bLevelOK && (sFileName !== ".") && (sFileName !== ".."))
        {
          aPath.push(sFullName + "\\");
        }
      }
      while (oSys.Call("Kernel32::FindNextFileW", hFindFile, lpBuffer));

      oSys.Call("Kernel32::FindClose", hFindFile);
    }
  }

  AkelPad.MemFree(lpFile);
  AkelPad.MemFree(lpDetectFile);

  SortFiles();
  FillLV();
  EnableButtons();

  oSys.Call("User32::PostMessageW", hWndDlg, 0x8001 /*WM_APP+1*/, aWnd[IDFILELV][HWND], 0);
}

/**
 * Read VCS File to exclude directories from the search result.
 *
 * @return array of directories that should be ignored
 */
function GetVCSIgnoreFileToSkip()
{
  var strDir = sDir || GetWindowText(aDlg[IDDIRCB].HWND) || AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1);
  var sVCSFile = strDir + "\\.gitignore";
  var oError = {},
      sFileContent = "";
      aExcludedDirs = aExcludedDirsRaw = ['.git', '.vscode', '.idea', '.history', 'node_modules', 'vendor'];

  if (IsFileExists(sVCSFile))
  {
    try
    {
      sFileContent = AkelPad.ReadFile(sVCSFile);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'Error: ' + oError.description, sScriptName, 0);
    }
  }

  sVCSFile = strDir + "\\.svnignore";

  if (IsFileExists(sVCSFile))
  {
    try
    {
      sFileContent += "\n"+ AkelPad.ReadFile(sVCSFile);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'Error: '+ oError.description, sScriptName, 0);
    }
  }

  aExcludedDirsRaw = sFileContent.split("\n");

  for (var i = 0, nLen = aExcludedDirsRaw.length; i < nLen; i++)
  {
    var sExcDir = aExcludedDirsRaw[i];
    if (sExcDir.substr(0, 1) === "/")
      aExcludedDirs.push(sExcDir.slice(1).replace(/\//g, "\\"));
  }

  return aExcludedDirs;
}

/**
 * @return sorted array of files
 */
function SortFiles()
{
  var nSort = bSortDesc ? -1 : 1;
  var nCompare;

  function sorting(sName1, sName2)
  {
    nCompare = nSort * oSys.Call("Kernel32::lstrcmpiW", sName1.substr(0, sName1.lastIndexOf("\\")), sName2.substr(0, sName2.lastIndexOf("\\")));
    if (nCompare === 0)
      return nSort * oSys.Call("Kernel32::lstrcmpiW", sName1, sName2);
    else
      return nCompare;
  }

  return aFiles.sort(sorting);
}

function OpenFiles()
{
  if (aFiles.length)
  {
    var sFiles = "";
    var i;

    GetSelArrayLV();

    if (! aFilesSel.length)
      aFilesSel = [GetCurFocLV()];

    for (i = 0; i < aFilesSel.length; ++i)
    {
      if (IsFileExists(aFiles[aFilesSel[i]]))
      {
        AkelPad.OpenFile(aFiles[aFilesSel[i]]);

        if (! AkelPad.IsMDI())
          break;
      }
      else
        sFiles += aFiles[aFilesSel[i]] + "\n";
    }

    if (sFiles)
      WarningBox(sFiles + "\n" + sTxtFileNoExist);
  }
}

/**
 * Open the file, or close the file if it's already opened.
 *
 * @return bool - false if already opened
 */
function OpenOrCloseFile(bSelect, bCloseOr)
{
  var bClose = bCloseOr || true;
  if (aFiles.length)
  {
    var nItem = GetCurFocLV();

    if (nItem >= 0)
    {
      if (aFiles[nItem].toUpperCase() === AkelPad.GetEditFile(0).toUpperCase() && bClose)
      {
        if (bBookmarkResults)
          BookmarkLines('', false); // remove bookmarks on close to have some clean results

        if (AkelPad.IsMDI())
          AkelPad.Command(4318 /*IDM_WINDOW_FRAMECLOSE*/);
        else
          AkelPad.Command(4324 /*IDM_WINDOW_FILECLOSE*/);

        return false;
      }
      else
      {
        if (IsFileExists(aFiles[nItem]))
        {
          if (AkelPad.OpenFile(aFiles[nItem]) === 0 /*EOD_SUCCESS*/)
          {
            WScript.Sleep(111); // to avoid some crashes

            if (bSelect)
              searchSelect();

            if (bBookmarkResults)
              BookmarkLines('', true);

            if (bMarkResults)
              highlight();

            return true;
          }
          else
            return false;
        }
        else
        {
          WarningBox(aFiles[nItem] + "\n\n" + sTxtFileNoExist);
          return false;
        }
      }
    }
  }
}

/**
 * Open the file and find results from begin, or find next occurrence.
 *
 * @return bool - false if already opened
 */
function OpenFileAndFindBeginOrFindNext(bPrev)
{
  var sTextSearchOptionsParams = "";

  if (bPrev)
    sTextSearchOptionsParams += "up";

  if (aFiles.length)
  {
    var nItem = GetCurFocLV();
    if (nItem >= 0)
    {
      if (aFiles[nItem].toUpperCase() === AkelPad.GetEditFile(0).toUpperCase())
      {
        TextSearchOptions(sTextSearchOptionsParams);
        return false;
      }
      else
      {
        if (IsFileExists(aFiles[nItem]))
        {
          if (AkelPad.OpenFile(aFiles[nItem]) === 0 /*EOD_SUCCESS*/)
          {
            WScript.Sleep(111); // to avoid some crashes
            searchSelect();

            if (bBookmarkResults)
              BookmarkLines('', true);

            if (bMarkResults)
              return highlight();

            return true;
          }

          return true;
        }
        else
        {
          WarningBox(aFiles[nItem] + "\n\n" + sTxtFileNoExist);
          return false;
        }
      }
    }
  }
}

function ByteOffsetToRichOffset(nByteOffset)
{
  var hEditWnd      = AkelPad.GetEditWnd();
  var lpCharIndex1  = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var lpCharIndex2  = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var lpIndexOffset = AkelPad.MemAlloc(_X64 ? 32 : 16 /*sizeof(AEINDEXOFFSET)*/);
  var nRichOffset;

  AkelPad.MemCopy(lpIndexOffset, lpCharIndex1, DT_QWORD);
  AkelPad.MemCopy(lpIndexOffset + (_X64 ? 8 : 4), lpCharIndex2, DT_QWORD);
  AkelPad.MemCopy(lpIndexOffset + (_X64 ? 16 : 8), nByteOffset, DT_QWORD);
  AkelPad.MemCopy(lpIndexOffset + (_X64 ? 24 : 12), 3 /*AELB_ASIS*/, DT_DWORD);

  AkelPad.SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, 1 /*AEGI_FIRSTCHAR*/, lpCharIndex1);
  AkelPad.SendMessage(hEditWnd, 3135 /*AEM_INDEXOFFSET*/, 0, lpIndexOffset);

  nRichOffset = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpCharIndex2);

  AkelPad.MemFree(lpIndexOffset);
  AkelPad.MemFree(lpCharIndex1);
  AkelPad.MemFree(lpCharIndex2);

  return nRichOffset;
}

function CopyList()
{
  if (aFiles.length)
    AkelPad.SetClipboardText(aFiles.join("\r\n"));
}

function CopySelected()
{
  if (aFiles.length)
  {
    var sText = "";

    GetSelArrayLV();

    if (! aFilesSel.length)
      aFilesSel = [GetCurFocLV()];

    for (i = 0; i < aFilesSel.length; ++i)
      sText += aFiles[aFilesSel[i]] + "\r\n";

    AkelPad.SetClipboardText(sText);
  }
}

function ClearList()
{
  if (aFiles.length)
  {
    aFiles    = [];
    aFilesSel = [0];

    FillLV();
    EnableButtons();
    oSys.Call("User32::SetFocus", aWnd[IDFILELV][HWND]);
  }
}

function RemoveFromList()
{
  if (aFiles.length)
  {
    AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x000B /*WM_SETREDRAW*/, 0, 0);
    GetSelArrayLV();

    if (! aFilesSel.length)
      aFilesSel = [GetCurFocLV()];

    for (i = aFilesSel.length - 1; i >= 0; --i)
    {
      aFiles.splice(aFilesSel[i], 1);
      AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x1008 /*LVM_DELETEITEM*/, aFilesSel[i], 0);
    }

    AkelPad.SendMessage(aWnd[IDFILELV][HWND], 0x000B /*WM_SETREDRAW*/, 1, 0);

    if (aFiles.length)
    {
      SetSelLV(aFilesSel[aFilesSel.length - 1] - aFilesSel.length + 1);
      if (GetNextSelLV(-1) < 0)
        SetSelLV(aFiles.length - 1);
    }
    else
    {
      FillLV();
      EnableButtons();
    }
  }
}

function Settings()
{
  var MF_STRING  = 0x0000;
  var MF_CHECKED = 0x0008;
  var MF_SEPARATOR = 0x0800;
  var hMenu = oSys.Call("User32::CreatePopupMenu");
  var oRect = {};
  var nCmd;

  GetWindowPos(aWnd[IDSETTINGSB][HWND], oRect);

  oSys.Call("User32::AppendMenuW", hMenu, (bSeparateWnd ? MF_CHECKED : MF_STRING), 1, sTxtSeparateWnd);
  oSys.Call("User32::AppendMenuW", hMenu, (bPathShow    ? MF_CHECKED : MF_STRING), 3, sTxtPathShow);
  oSys.Call("User32::AppendMenuW", hMenu, (bKeepFiles   ? MF_CHECKED : MF_STRING), 2, sTxtKeepFiles);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bMarkResults ? MF_CHECKED : MF_STRING), 12, sTxtMarkResults);
  oSys.Call("User32::AppendMenuW", hMenu, (bBookmarkResults ? MF_CHECKED : MF_STRING), 13, sTxtBookmarkResults);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShow     ? MF_CHECKED : MF_STRING), 11, sTxtLogShow);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShowNewT ? MF_CHECKED : MF_STRING), 4, sTxtLogResultsN);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShowKeep ? MF_CHECKED : MF_STRING), 5, sTxtLogResultsK);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShowS    ? MF_CHECKED : MF_STRING), 6, sTxtLogResults);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogQSA? MF_CHECKED : MF_STRING), 7, sTxtLogResLogQSA);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogQS ? MF_CHECKED : MF_STRING), 8, sTxtLogResLogQS);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogP  ? MF_CHECKED : MF_STRING), 9, sTxtLogResLogP);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLog   ? MF_CHECKED : MF_STRING), 10, sTxtLogResLog);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x01A4 /*TPM_NONOTIFY|TPM_RETURNCMD|TPM_BOTTOMALIGN|TPM_CENTERALIGN*/, oRect.X + oRect.W / 2, oRect.Y, 0, hWndDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd === 1)
    bSeparateWnd = ! bSeparateWnd;
  else if (nCmd === 2)
    bKeepFiles = ! bKeepFiles;
  else if (nCmd === 3)
  {
    bPathShow = ! bPathShow;
    nFilesFoc = GetCurFocLV();
    GetSelArrayLV();
    FillLV();
  }
  else if (nCmd === 4)
    FindstrLog(8388608); // 8388608 - Log in new tab
  else if (nCmd === 5)
    FindstrLog(24);      // 16+8 - don't scroll and keep all log results
  else if (nCmd === 6)
    FindstrLog();        // 16 - simple log
  else if (nCmd === 7)
    qSearchLog(3);
  else if (nCmd === 8)
    qSearchLog();
  else if (nCmd === 9)
    FindToLog(26);
  else if (nCmd === 10)
    FindToLog();
  else if (nCmd === 11)
    bLogShow = ! bLogShow;
  else if (nCmd === 12)
  {
    bMarkResults = ! bMarkResults;
    if (bMarkResults)
      highlight(sContent);
    else
      highlight(sContent, 3);
  }
  else if (nCmd === 13)
  {
    bBookmarkResults = ! bBookmarkResults;
    if (bBookmarkResults)
      BookmarkLines('', true);
    else
      BookmarkLines('', false);
  }
}

/**
 * Find in files using FINDSTR search util and show search results in log.
 * @TODO: Match exact word
 *
 * @param int pLogOutput - flags for Log::Output, default no scroll (16)
 * @return bool on success
 */
function FindstrLog(pLogOutput)
{
  // AkelPad.MessageBox(0, aFiles.join(', '), sScriptName, 0);
  var strContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
  var strDir     = GetWindowText(aWnd[IDDIRCB][HWND]).replace(/(^ +)|( +$)/g, "") || AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) || sDir;
  // var strName    = GetWindowText(aWnd[IDNAMECB][HWND]).replace(/(^[ ;]+)|([ ;]+$)/g, "") || '*';

  if ((! strContent) || (! strDir))
    return false;
  else
  {
    sContent = strContent;
    sDir = strDir;
  }

  var logOutput = pLogOutput || 16;
  var sDirEsc = strDir.replace(/\\/g, "\\\\");

  // findstr /O -was a problem that neither GOTOCHAR, nor GOTOBYTE did not move the caret appropriately
  // var sREPATTERN = "^(.+?):(\\d+):(\\d+):(.*?)$";
  var sREPATTERN = "^(.+?):(\\d+):(.*?)$";
  var sRETAGS    = "/FILE=\\1 /GOTOLINE=\\2:0";
  var sCOMMAND = "cmd.exe /K cd /d \"" + strDir + "\" & echo. & echo ---------- SEARCHED \""+ strContent +"\" IN DIRECTORY \""+ strDir +"\" "+ ((logOutput===16)?"":" & time /T & date /T ") +" & findstr /S /N "+ ((bContentRE)?"/R":"/L") + ((bSkipBinary)?" /P ":"")+ ((! bMatchCase)?" /I ":"") +" /C:\""+ strContent +"\" \* & exit";

  //AkelPad.MessageBox(0, sCOMMAND, sScriptName, 0);
  AkelPad.Call("Log::Output", 1, sCOMMAND, sDirEsc, sREPATTERN, sRETAGS, -2, -2, logOutput);
  AkelPad.Call("Scripts::Main", 2, "LogHighLight.js", ('-sSelText="'+ strContent +'" -bNotRegExp='+ ((bContentRE)?"0":"1")) );

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
  var strContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
  var strDir = GetWindowText(aWnd[IDDIRCB][HWND]).replace(/(^ +)|( +$)/g, "") || AkelPad.GetFilePath(fileFullPath, 1) || sDir;
  var sDirEsc = strDir.replace(/\\/g, "\\\\");
  // var sFilePathEsc = fileFullPath.replace(/\\/g, "\\\\");

  if ((! strContent) || (! strDir))
    return false;

  var logOutput = pLogOutput || 18;
  var fileFullPath = AkelPad.GetEditFile(0);
  var sCOMMAND = "cmd.exe /K cd /d \""+ strDir +"\" & find /N "+ ((bMatchCase)?"":"/I") +" \""+ strContent +"\" "+ fileFullPath +" & exit";

  AkelPad.Call("Log::Output", 1, sCOMMAND, sDirEsc,
    "^(---------- (.+)$)?(\\[(\\d+)\\])?",
    "/FILE=\\2 /GOTOLINE=\\4:0" , -2, -2, logOutput
  );

  AkelPad.Call("Scripts::Main", 2, "LogHighLight.js", ('-sSelText="'+ strContent +'" -bNotRegExp='+ ((bContentRE)?"0":"1") ));

  return true;
}

/**
 * QSearch results in the Log.
 *
 * @param number searchFlag
 * @return bool|number, see AkelPad.TextFind for more details
 */
function qSearchLog(searchFlag)
{
  var strContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
  if (! strContent)
    return false;

  var bCase = bMatchCase,
      bRegEx = bContentRE,
      bRegExMulti = bMultiline;

  var sTextSearchOptionsParams = "",
      oError;

  if (bCase)
    sTextSearchOptionsParams += " case";
  if (bRegEx)
  {
    sTextSearchOptionsParams += " regex";
    if (bRegExMulti)
      sTextSearchOptionsParams += " regex_multi";
  }

  var flag = searchFlag || 1,
      selText = "";

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
      AkelPad.MessageBox(0, 'qSearchLog() -> searching() Error: '+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
      return false;
    }

    if (searchResult >= 0)
      return searchResult;

    if (searchResult <= -100)
    {
      AkelPad.MessageBox(0, 'Error in your expression "'+ strContent +'" \n ('+ searchResult +') is the offset.', sScriptName, 0);
      return false;
    }
    else if (searchResult < 0)
    {
      AkelPad.MessageBox(0, '"'+ strContent +'" was not found. ('+ searchResult +')', sScriptName, 0);
      return false;
    }
  }

  if (found && qSearching(AkelPad.GetSelText(), flag))
  {
    AkelPad.Command(4199); // caret in editor history back
    oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);
    return found;
  }

  oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);

  return found;
}

/**
 * qSearch Find All.
 *
 * @param string selText    - text to search
 * @param number flag       - search flag
 * @return bool             - true on success
 */
function qSearching(selText, flag)
{
  var textSelected = selText || AkelPad.GetSelText() || sLastContent,
      args = flag || 1,
      oError;

  var bCase = bMatchCase,
      bRegEx = bContentRE,
      bRegExMulti = bMultiline;

  if (textSelected)
  {
    try
    {
      AkelPad.Call("QSearch::FindAll", flag);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'qSearching() Error: '+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
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
  var strContent = GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent;
  if (! strContent)
    return false;

  var pTextSearch = sParams || '';
  var calcBin = (typeof prompts !== 'undefined')? 0x10000000 /*FRF_CYCLESEARCHPROMPT*/ : 0x08000000 /*FRF_CYCLESEARCH*/;

  if (bMatchCase || ~pTextSearch.indexOf('case'))
    calcBin |= 0x00000004 /*FRF_MATCHCASE*/;

  if (bContentRE || ~pTextSearch.indexOf('regex'))
    calcBin |= 0x00080000 /*FRF_REGEXP*/;

  if (bMultiline || ~pTextSearch.indexOf('regex_multi'))
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
  var rContent,
      selText = "",
      oError;

  if (sLastContent && (! bLastNotContain))
  {
    try
    {
      if (bLastContentRE)
      {
        rContent = new RegExp(sLastContent, (bLastMatchCase ? "" : "i") + (bLastMultiline ? "m" : ""));
        if (rContent.test(AkelPad.GetTextRange(0, -1, 0 /*new line as is*/)))
          AkelPad.SetSel(ByteOffsetToRichOffset(RegExp.index), ByteOffsetToRichOffset(RegExp.lastIndex));
      }
      else
        AkelPad.TextFind(0, sLastContent, 0x00200001 /*FRF_BEGINNING|FRF_DOWN*/ | (bLastMatchCase ? 0x00000004 /*FRF_MATCHCASE*/ : 0));
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'searchSelect() Error: '+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
      return "";
    }

    selText = AkelPad.GetSelText();
  }
  return selText;
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
 * @param number nAction
 * @param number nFlags
 * @return bool if highlighted
 */
function highlight(sText, nAction, nFlags)
{
  var strWhat = sText || GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent,
      action = nAction || 2,
      args = nFlags || 0;

  var bCase = bMatchCase,
      bRegEx = bContentRE,
      bRegExMulti = bMultiline;

  if (bCase)
    args += 1;
  if (bRegEx)
    args += 2;
  else if (bMatchWord)
    args += 4;

  AkelPad.Call("Coder::HighLight", 3, -666999, "#FF8080", '#400080');

  if (action === 2)
    AkelPad.Call("Coder::HighLight", action, "#FF8080", '#400080', args, 0, -666999, strWhat);
  else if (action === 3)
    AkelPad.Call("Coder::HighLight", action, -666999, "#FF8080", '#400080');

  return true;
}

/**
 * Bookmark Lines.
 *
 * @return bool when executed
 */
function BookmarkLines(strContent, bBookmark)
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

  var sWhat = strContent || GetWindowText(aWnd[IDCONTENTCB][HWND]) || sLastContent || sContent,
      bMatch = bMatchCase,
      bWord = bMatchWord,
      bRegExp = bContentRE,
      bDotNL = bMultiline
  ;

  if ((! hEditWnd) || (! sWhat) || (! IsLineBoard()))
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
      AkelPad.MessageBox(hWndDlg, sTxtRegExpErr, sTitle, 0x10 /*MB_ICONERROR*/);
      SendDlgItemMessage(hWndDlg, IDCONTENTCB, 177 /*EM_SETSEL*/, -nPos - 100, -1);
      oSys.Call("User32::SetFocus", aWnd[IDCONTENTCB][HWND]);
      return false;
    }
    else
    {
      //AkelPad.MessageBox(hWndDlg, sTxtNotFound, sTitle, 0x40 /*MB_ICONINFORMATION*/);
      return false;
    }
  }

  return true;
}

/**
 * Get string of bookmarks.
 *
 * @return string of bookmarks
 */
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

function IsLineBoard()
{
  return AkelPad.IsPluginRunning("LineBoard::Main");
}

function SendDlgItemMessage(hWnd, nID, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendDlgItemMessageW", hWnd, nID, uMsg, wParam, lParam);
}

function WarningBox(sText)
{
  AkelPad.MessageBox(hWndDlg, sText, sTxtScriptName, 0x00000030 /*MB_ICONWARNING*/);
}

function ReadIni()
{
  var sIniFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + ".ini";
  var sLngFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + "_" + AkelPad.GetLangId(0 /*LANGID_FULL*/).toString() + ".lng";
  var oError;

  if (IsFileExists(sLngFile))
  {
    try
    {
      eval(AkelPad.ReadFile(sLngFile));
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'ReadIni() Error: '+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
      //return false;
    }
  }
  else
  {
    sTxtScriptName  = "Find Files";
    sTxtDir         = "&Directory";
    sTxtCurrent     = "&Current";
    sTxtBookmarkLines = 'Bookmark lines';
    sTxtUnmarkLines   = 'Unmark lines';
    sTxtRegExpErr     = 'Syntax error in regular expression!';
    sTxtNotFound      = 'Not found!';
    sTxtBrowse      = "Browse..&.";
    sTxtSubDirs     = "Subdirectories level&:";
    sTxtAll         = "All";
    sTxtFileName    = "Name &of file";
    sTxtWildcards   = "(wildcards can use: *?)";
    sTxtRegExp      = "Reg&ular expression";
    sTxtTextInFile  = "&Text in file";
    sTxtNotName     = "&Not matching names";
    sTxtMatchWord   = "Match &word";
    sTxtMatchCase   = "Match c&ase";
    sTxtMultiline   = "M&ultiline";
    sTxtNotContain  = "&Not contain text";
    sTxtInStreams   = "Include NTFS streams";
    sTxtSkipBinary  = "S&kip binary files";
    sTxtSkipLarger  = "Don't search\nin larger than [&B]:";
    sTxtFiles       = "Files";
    sTxtSearch      = "&SEARCH";
    sTxtEdit        = "&Edit";
    sTxtCopyList    = "Cop&y list";
    sTxtClearList   = "Clear list [&Q]";
    sTxtSettings    = "SETTINGS [&;]";
    sTxtClose       = "Close [&X]";
    sTxtChooseDir   = "The current path is:\n";
    sTxtNoFiles     = "<no files>";
    sTxtSeparateWnd = "Run in separate window";
    sTxtKeepFiles   = "Keep files list";
    sTxtPathShow    = "Show full path on files list";
    sTxtLogResLog   = "Show results of current document (&FIND) in the log output\tCtrl+S";
    sTxtLogResLogP  = "Show results of current document (FIND), &Preserving the log output\tCtrl+Shift+S";
    sTxtLogResLogQS = "Show results of current document (&qSearch), preserving the log output\tCtrl+Shift+A";
    sTxtLogResLogQSA= "Results from opened documents in log (qSearch), preserving the log output\tShift+Alt+&A";
    sTxtLogResults  = "Show results in the &Log (FINDSTR)\tCtrl+L";
    sTxtLogResultsK = "Show results in the log, but &Keep the previous results (FINDSTR)\tCtrl+Shift+L";
    sTxtLogResultsN = "Show results in the &New tab (FINDSTR)\tCtrl+N";
    sTxtLogShow     = "&Double click to show results in the Log instead closing the file";
    sTxtMarkResults = "&Highlight | Mark the results\tCtrl+Q/Ctrl+Shift+Q";
    sTxtBookmarkResults = "&Bookmark the results\tAlt+B/Shift+Alt+B";
    sTxtDirNoExist  = "Directory does not exists.";
    sTxtFileNoExist = "File(s) does not exists.";
    sTxtErrorRE     = "Error in regular expression.";
    sTxtByteSymbol  = "B";
    sTxtNTFSStream  = "NTFS stream";
    sTxtWait        = "Wait...";
    sHlpAnyChar     = "any single character";
    sHlpAnyString   = "any string of characters";
    sHlpSemicolQuot = "semicolon must be in double quotes";
    sHlpListSepar   = "list separator (semicolon)";
    sHlpAnyChar_NL  = "any character, except \\n";
    sHlpDigit       = "digit [0-9]";
    sHlpNonDigit    = "non-digit [^0-9]";
    sHlpWhiteSp     = "whitespace [ \\f\\n\\r\\t\\v]";
    sHlpNonWhiteSp  = "non-whitespace";
    sHlpWordChar    = "word character [A-Za-z0-9_]";
    sHlpNonWordChar = "non-word character";
    sHlpNULL        = "NULL character";
    sHlpFF          = "form feed \\x0C";
    sHlpNL          = "new line \\x0A";
    sHlpCR          = "carriage return \\x0D";
    sHlpTab         = "tab \\x09";
    sHlpVTab        = "vertical tab \\x0B";
    sHlpCharHex     = "character hex code FF";
    sHlpUniCharHex  = "Unicode char hex code 00FF";
    sHlpBegin       = "beginning of string/line";
    sHlpEnd         = "end of string/line";
    sHlpWordBoun    = "word boundary";
    sHlpNonWordBoun = "non-word boundary";
    sHlpAlternative = "alternative ab or xy";
    sHlpCharSet     = "character set, any specified";
    sHlpNegCharSet  = "negative character set";
    sHlpRange       = "range of chars from a to z";
    sHlpNegRange    = "negative range of chars";
    sHlpCapture     = "capture";
    sHlpNotCapture  = "not capture";
    sHlpFollow      = "followed by ab";
    sHlpNotFollow   = "not followed by ab";
    sHlpBackrefer   = "backreference";
    sHlpZeroOrOne   = "zero or one times";
    sHlpZeroOrMore  = "zero or more times";
    sHlpOneOrMore   = "one or more times";
    sHlpexactly     = "exactly 3 times";
    sHlpAtLeast     = "at least 3 times";
    sHlpFromTo      = "from 3 to 7 times";
    sHlpSpecChars   = "()[]{}^$.?+*|\\ special chars";
  }

  if (IsFileExists(sIniFile))
  {
    try
    {
      eval(AkelPad.ReadFile(sIniFile));
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'searchSelect() Error: '+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
      //return false;
    }
  }
}

function WriteIni()
{
  var sIniFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + ".ini";
  var sIniTxt  = "";
  var i;

  oWndPos.Max = oSys.Call("User32::IsZoomed", hWndDlg);
  sDir        = GetWindowText(aWnd[IDDIRCB][HWND]);
  sName       = GetWindowText(aWnd[IDNAMECB][HWND]);
  sContent    = GetWindowText(aWnd[IDCONTENTCB][HWND]);

  if (bKeepFiles)
  {
    GetSelArrayLV();
    nFilesFoc = GetCurFocLV();
  }
  else
  {
    aFiles    = [];
    aFilesSel = [0];
    nFilesFoc = 0;
  }

  for (i in oWndPos)
    sIniTxt += 'oWndPos.' + i + '=' + oWndPos[i] + ';\r\n';

  sIniTxt += 'bSeparateWnd='    + bSeparateWnd + ';\r\n' +
             'bKeepFiles='      + bKeepFiles + ';\r\n' +
             'bPathShow='       + bPathShow + ';\r\n' +
             'bLogShow='        + bLogShow + ';\r\n' +
             'bMarkResults='    + bMarkResults + ';\r\n' +
             'bBookmarkResults='+ bBookmarkResults + ';\r\n' +
             'nPathLen='        + nPathLen + ';\r\n' +
             'bSortDesc='       + bSortDesc + ';\r\n' +
             'nDirLevel='       + nDirLevel + ';\r\n' +
             'bNameRE='         + bNameRE + ';\r\n' +
             'bNotName='        + bNotName + ';\r\n' +
             'bContentRE='      + bContentRE + ';\r\n' +
             'bMatchWord='      + bMatchWord + ';\r\n' +
             'bMatchCase='      + bMatchCase + ';\r\n' +
             'bMultiline='      + bMultiline + ';\r\n' +
             'bNotContain='     + bNotContain + ';\r\n' +
             'bInStreams='      + bInStreams + ';\r\n' +
             'bSkipBinary='     + bSkipBinary + ';\r\n' +
             'nMaxFileSize='    + nMaxFileSize + ';\r\n' +
             'sDir="'           + sDir.replace(/[\\"]/g, '\\$&') + '";\r\n' +
             'sName="'          + sName.replace(/[\\"]/g, '\\$&') + '";\r\n' +
             'sContent="'       + sContent.replace(/[\\"]/g, '\\$&') + '";\r\n' +
             'sLastContent="'   + sLastContent.replace(/[\\"]/g, '\\$&') + '";\r\n' +
             'bLastContentRE='  + bLastContentRE + ';\r\n' +
             'bLastMatchWord='  + bLastMatchWord + ';\r\n' +
             'bLastMatchCase='  + bLastMatchCase + ';\r\n' +
             'bLastMultiline='  + bLastMultiline + ';\r\n' +
             'bLastNotContain=' + bLastNotContain + ';\r\n' +
             'aDirs=['          + aDirs.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
             'aNames=['         + aNames.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
             'aContents=['      + aContents.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
             'aFiles=['         + aFiles.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
             'aFilesSel=['      + aFilesSel +'];\r\n' +
             'nFilesFoc='       + nFilesFoc +';';
  WriteFile(sIniFile, null, sIniTxt, 1);
}

function IsFileExist(pFile)
{
  if (oSys.Call("kernel32::GetFileAttributes" + _TCHAR, pFile) === -1)
    return false;
  return true;
}

function PostMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::PostMessageW", hWnd, uMsg, wParam, lParam);
}

function SendMessage(hWnd, uMsg, wParam, lParam)
{
  return AkelPad.SendMessage(hWnd, uMsg, wParam, lParam);
}
