// http://akelpad.sourceforge.net/forum/viewtopic.php?p=20235#20235
// https://raw.githubusercontent.com/CoreText/AkelPad-Extended/main/AkelFiles/Plugs/Scripts/FindReplaceFiles_extended.js
// https://github.com/CoreText/AkelPad-Extended
//
// Author: KDJ / texter
// Version: 2021-02-08
// Extended from original FindReplaceFiles.js
//
// *** Поиск и замена файлов по названию и содержанию. ***
// *** Search files by name/content and replace content. ***
//
// Usage:
//    Call("Scripts::Main", 1, "FindReplaceFiles_extended.js")
//
// Required to include: BrowseForFolder_function.js, FileAndStream_functions.js
//
////////////////////// Keys and mouse:
// Left Mouse Click  - Open the selected file for editing and select the found text and finds next result
// Right Mouse Click - Open the selected file for editing and select the found text and finds previous result
// Double Click      - Close the selected file, or shows the results in the log depending on the settings of the dialog
// Shift+Alt+Enter   - Toggle setting "show results in the log instead of DblClick, closing the file"

// Shift+Alt+;,
// Alt+;            - Focus the editor

// Alt+F,
// Ctrl+Down        - Focus the Files list
// Ctrl+Up          - Focus the Search input

// Alt+O            - Focus the file name input
// Alt+D            - Focus the search path
// Alt+T,
// Ctrl+F           - Focus the search input

// Alt+Up           - Opened file navigation scroll up
// Alt+Down         - Opened file navigation scroll down

// Ctrl+A           - Select all items in file list
// Ctrl+C           - Copy selected items from file list
// Ctrl+Shift+C     - Copy contents of the log
// Del              - Remove selected items from file list (don't delete the files)
// Alt+Del          - remove item from history list ("Directory", "File:Stream names", "Text in file\stream", "Replace with", "History")

// F1               - Help for regular expressions or wildcards
// F2               - Open all selected files for editing
// F3               - Go to next occurrence
// Shift+F3         - Go to previous occurrence
// F4               - Go to next occurrence in the Log, if not found tries to find selected
// Shift+F4         - Go to previous occurrence in the Log

// Ctrl+Enter       - Opened file search next occurrence
// Ctrl+Shift+Enter - Opened file search previous occurrence
// Shift+Enter      - Open focused file for editing and select the found text (or close file if is currently edited)
// Alt+Enter        - Resize (maximize/restore) the dialog window
// Shift+Alt+Right  - Go to next occurrence Match Word
// Shift+Alt+Left   - Go to previous occurrence Match Word

// Ctrl+W           - Close current document
// Ctrl+Shift+W     - Close tabs of opened results
// Shift+Alt+W      - Close tabs by extension
// Ctrl+T           - Create New empty tab

// Ctrl+B           - Go to next bookmark
// Ctrl+Shift+B     - Go to previous bookmark
// Alt+B            - Bookmark the result
// Shift+Alt+B      - Remove bookmarks
// Shift+Alt+L      - Show the list of bookmarks

// Ctrl+Shift+A     - Find in current document (append, SearchReplace_extended.js)
// Shift+Alt+A      - Find in opened documents (SearchReplace_extended.js)

// Ctrl+R           - Replace occurrence down (SearchReplace_extended.js)
// Ctrl+Shift+R     - Replace occurrence in the document (SearchReplace_extended.js)
// Shift+Alt+R      - Replace occurrence in the opened documents (SearchReplace_extended.js)

// Ctrl+U           - Undo
// Ctrl+Shift+U     - Redo

// Ctrl+L           - Show results in the log (FINDSTR)
// Ctrl+Shift+L     - Show results in the log (FINDSTR) keeping previous results
// Alt+N            - Show results in the new tab (FINDSTR)

// Ctrl+N           - Copy log results into new tab
// Ctrl+Shift+N     - Force new instance PMDI where you can open your results (ForceNewInstance_extended.js)

// Ctrl+S           - Results of current document (FIND)
// Ctrl+Shift+S     - Results of current document (FIND), preserving the log output

// Ctrl+Shift+Q     - Results in log (qSearch), preserving the log output
// Alt+Shift+Q      - Results from opened documents in log (qSearch), preserving the log output
// Shift+Alt+Q      - qSearch find occurrence in opened tabs

// Ctrl+I           - File statistics
// Ctrl+Shift+I     - File statistics in new tab

// Ctrl+Shift+F     - Selected text paste to search input
// Shift+Alt+F      - Open FindFiles_extended.js
// Ctrl+H           - Open TextReplacer.js

// Ctrl+M           - Mark the text in the document
// Ctrl+Shift+M     - Clear all marks from document
// Alt+M            - Mark results in all opened tabs
// Shift+Alt+M      - Remove marks from all documents

// Alt+H            - Highlight the text in the log results
// Shift+Ctrl+H     - Toggle HighLight / Mark results setting

// Ctrl+Shift+O     - Paths of the opened documents in new tab
// Ctrl+O           - Open current path in file manager
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
 * - FileAndStream_extended.js
 * - FindFiles_extended.js
 * - ForceNewInstance_extended.js
 * - LogHighLight.js
 * - MarkIt_extended.js
 * - SearchReplace_extended.js
 * - TabCloseExts.vbs
 * - TabSwitch.js
 * - TextReplacer.js
 */

var bSilentActions = true;

var oSys     = AkelPad.SystemFunction();
var hInstDLL = AkelPad.GetInstanceDll();
var sScriptName = WScript.ScriptName;
var sClass   = "AkelPad::Scripts::" + sScriptName + "::" + hInstDLL;
var hDlg;
var pSlash = "\\";
var fso = new ActiveXObject("Scripting.FileSystemObject");
var WshShell = new ActiveXObject("WScript.Shell");
var nLogCurrent = 0;
var hEditWnd = AkelPad.GetEditWnd();
//AkelPad.SendMessage(hEditWnd, 3228 /*AEM_SETOPTIONS*/, 2 /*AECOOP_OR*/, 0x01000000 /*AECO_DISABLEBEEP*/);

// var bCoderHighLightIsRunning = AkelPad.IsPluginRunning("Coder::HighLight");
// var bQSearchIsRunning = AkelPad.IsPluginRunning("QSearch::QSearch");

if (hDlg = oSys.Call("User32::FindWindowExW", 0, 0, sClass, 0))
{
  SetForegroundWindow(hDlg);
  WScript.Quit();
}

if (! (AkelPad.Include("BrowseForFolder_function.js") && AkelPad.Include("FileAndStream_functions.js")))
  WScript.Quit();

var Scale =
{
  Init: function()
  {
    var hDC = oSys.Call("User32::GetDC", hMainWnd);
    this.ScaleX = oSys.Call("Gdi32::GetDeviceCaps", hDC, 88 /*LOGPIXELSX*/);
    this.ScaleY = oSys.Call("Gdi32::GetDeviceCaps", hDC, 90 /*LOGPIXELSY*/);
    oSys.Call("User32::ReleaseDC", hMainWnd, hDC);
    //Align to 16 pixel
    this.ScaleX += (16 - this.ScaleX % 16) % 16;
    this.ScaleY += (16 - this.ScaleY % 16) % 16;
  },
  X:  function(n) {return oSys.Call("Kernel32::MulDiv", n, this.ScaleX, 96);},
  Y:  function(n) {return oSys.Call("Kernel32::MulDiv", n, this.ScaleY, 96);},
  UX: function(n) {return oSys.Call("Kernel32::MulDiv", n, 96, this.ScaleX);},
  UY: function(n) {return oSys.Call("Kernel32::MulDiv", n, 96, this.ScaleY);}
};

Scale.Init();

var DT_UNICODE = 1;
var DT_QWORD   = 2;
var DT_DWORD   = 3;
var DT_WORD    = 4;

var hMainWnd   = AkelPad.GetMainWnd();
var hGuiFont   = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
var nBkColorT  = 0xFFFFFF;
var nBkColorMC = 0xA0FFFF;
var nBkColorRE = 0xA7E2B7;
var nBkColorREC= 0xFFAA82;
var hBrush     = oSys.Call("Gdi32::CreateSolidBrush", nBkColorRE);
var hBrushC    = oSys.Call("Gdi32::CreateSolidBrush", nBkColorMC);
var hBrushREC  = oSys.Call("Gdi32::CreateSolidBrush", nBkColorREC);
var hBrushT    = oSys.Call("Gdi32::CreateSolidBrush", nBkColorT);
var nHistTime  = 0;
var nHistMax   = 50;
var nLevelMax  = 27;
var nBufSize   = 8192 /* 1024 */;
var lpBuffer   = AkelPad.MemAlloc(nBufSize);
var lpLVITEM   = AkelPad.MemAlloc(_X64 ? 72 : 60); //sizeof(LVITEM)
var hParent;
var hFocus;
var bCloseCBL;
var bCloseDlg;
var oError;

AkelPad.MemCopy(lpLVITEM, 0x0001 /*LVIF_TEXT*/, DT_DWORD); //mask
AkelPad.MemCopy(_PtrAdd(lpLVITEM, _X64 ? 24 : 20), lpBuffer, DT_QWORD); //pszText
AkelPad.MemCopy(_PtrAdd(lpLVITEM, _X64 ? 32 : 24), nBufSize, DT_DWORD); //cchTextMax

var nWndMinW = Scale.X(475);
var nWndMinH = Scale.Y(488);
var oWndPos  = {"X": 240, "Y": 140, "W": nWndMinW, "H": nWndMinH, "Max": 0};

var sLogExt         = AkelPad.GetArgValue("LogExt", ".ss1");
var bPathShow       = 0;
var bSeparateWnd    = 0;
var bLogShow        = 0;
var bBehaviour      = 1;
var bBookmarkResults= 0;
var bCloseToggler   = 0;
var bMarkResults    = 0;
var bKeepHist       = 1;
var bKeepFiles      = 1;
var nPathLen        = 0;
var bSortDesc       = 0;
var nDirLevel       = -1;
var bNameRE         = 0;
var bNotName        = 0;
var bInFiles        = 1;
var bInStreams      = 0;
var bSkipReadOnly   = 0;
var bSkipHidden     = 0;
var bSkipSystem     = 0;
var bSkipVCSignore  = 0;
var bSkipVCSignoreN = 0;
var bSkipVCSignoreF = 0;
var bShowLogResuls  = 0;
var bInResults      = 0;
var bContentRE      = 0;
var bMatchCase      = 0;
var bMultiline      = 0;
var bMatchWord      = 0;
var bNotContain     = 0;
var bSkipBinary     = 1;
var bSkipLarger     = 1;
var nMaxFileSize    = 0;
var bLogShowS        = 0;
var bLogShowKeep     = 0;
var bLogShowNewT     = 0;
var bTxtLogResLog    = 0;
var bTxtLogResLogAll = 0;
var bTxtLogResLogAllOpened = 0;
var bTxtLogResLogP   = 0;
var bTxtLogResLogQS  = 0;
var bTxtLogResLogQSA = 0;
var sDir            = AkelPad.GetArgValue("sDir", "");
var sName           = AkelPad.GetArgValue("sName", "*");
var sContent        = AkelPad.GetArgValue("sWhat", "");
var sReplace        = AkelPad.GetArgValue("sWith", "");
var sLastContent    = "";
var bLastContentRE  = 0;
var bLastMatchCase  = 0;
var bLastMultiline  = 0;
var bLastNotContain = 0;
var bAfterReplace   = 0;
var aDirs           = [];
var aNames          = [];
var aContents       = [];
var aReplace        = [];
var aFiles          = [];
var aFilesSel       = [0];
var nFilesFoc       = 0;
var aHist           = [];
var sFoundResultsColorFG = "#000000", sFoundResultsColorBG = "#00FF00";
var aVCSIgnoreFileConfs = [".gitignore", ".svnignore"];
var aVCSExcludedPaths = [".git\\", ".vscode\\", ".idea\\", ".history\\", "node_modules\\", "vendor\\", "Thumbs.db", ".DS_Store*"];
var aVCSUnexcludedPaths = [".gitattributes"];
var aExcludedDirsCollection = [];
var aUnexcludedDirsCollection = [];
var aDirsToSkip = [];
var aUnexcludedPathUp = [];
var sCurrentRelativeDir = "";
var aResultsOpenedFiles = [];

ReadIni();

var aDlg         = [];
var IDDIRG       = 2000;
var IDDIRCB      = 2001;
var IDCURRENTB   = 2002;
var IDBROWSEB    = 2003;
var IDDIRLEVELS  = 2004;
var IDDIRLEVELCB = 2005;
var IDNAMEG      = 2006;
var IDNAMECB     = 2007;
var IDHELP1B     = 2008;
var IDNAMERE     = 2009;
var IDNOTNAME    = 2010;
var IDINFILES    = 2011;
var IDINSTREAMS  = 2012;
var IDCONTENTG   = 2013;
var IDCONTENTCB  = 2014;
var IDHELP2B     = 2015;
var IDMATCHCASE  = 2016;
var IDCONTENTRE  = 2017;
var IDMULTILINE  = 2018;
var IDMATCHWORD  = 2019;
var IDNOTCONTAIN = 2020;
var IDSKIPBINARY = 2021;
var IDSKIPLARGER = 2022;
var IDMAXSIZEE   = 2023;
var IDREPLACES   = 2024;
var IDREPLACECB  = 2025;
var IDHELP3B     = 2026;
var IDSKIPG      = 2027;
var IDREADONLY   = 2028;
var IDHIDDEN     = 2029;
var IDSYSTEM     = 2030;
var IDVCSIGNORE  = 2031;
var IDVCSIGNOREF = 2032;
var IDVCSIGNOREN = 2033;
var IDINRESULTS  = 2034;
var IDSEARCHB    = 2035;
var IDREPLACEB   = 2036;
var IDHISTORYB   = 2037;
var IDEDITB      = 2038;
var IDCOPYB      = 2039;
var IDCLEARB     = 2040;
var IDSETTINGSB  = 2041;
var IDCLOSEB     = 2042;
var IDFILELV     = 2043;
var IDSTATUS     = 2044;

//0x50000000=WS_VISIBLE|WS_CHILD
//0x50000002=WS_VISIBLE|WS_CHILD|SS_RIGHT
//0x50000007=WS_VISIBLE|WS_CHILD|BS_GROUPBOX
//0x50000100=WS_VISIBLE|WS_CHILD|SBARS_SIZEGRIP
//0x50010000=WS_VISIBLE|WS_CHILD|WS_TABSTOP
//0x50010042=WS_VISIBLE|WS_CHILD|WS_TABSTOP|CBS_AUTOHSCROLL|CBS_DROPDOWN
//0x50010003=WS_VISIBLE|WS_CHILD|WS_TABSTOP|CBS_DROPDOWNLIST
//0x50010003=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
//0x50012002=WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_NUMBER|ES_RIGHT
//0x50810009=WS_VISIBLE|WS_CHILD|WS_BORDER|WS_TABSTOP|LVS_SHOWSELALWAYS|LVS_REPORT
aDlg[IDDIRG      ]={S:0x50000007, C:"BUTTON", T:sTxtDir};
aDlg[IDDIRCB     ]={S:0x50210042, C:"COMBOBOX"};
aDlg[IDCURRENTB  ]={S:0x50010000, C:"BUTTON", T:sTxtCurrent};
aDlg[IDBROWSEB   ]={S:0x50010000, C:"BUTTON", T:sTxtBrowse};
aDlg[IDDIRLEVELS ]={S:0x50000002, C:"STATIC", T:sTxtSubDirs};
aDlg[IDDIRLEVELCB]={S:0x50010003, C:"COMBOBOX"};
aDlg[IDNAMEG     ]={S:0x50000007, C:"BUTTON", T:sTxtFileName};
aDlg[IDNAMECB    ]={S:0x50210042, C:"COMBOBOX", Sel1:0, Sel2:-1};
aDlg[IDHELP1B    ]={S:0x50010000, C:"BUTTON", T:"?"};
aDlg[IDNAMERE    ]={S:0x50010003, C:"BUTTON", T:sTxtRegExp};
aDlg[IDNOTNAME   ]={S:0x50010003, C:"BUTTON", T:sTxtNotName};
aDlg[IDINFILES   ]={S:0x50010003, C:"BUTTON", T:sTxtFiles};
aDlg[IDINSTREAMS ]={S:0x50010003, C:"BUTTON", T:sTxtStreams};
aDlg[IDCONTENTG  ]={S:0x50000007, C:"BUTTON", T:sTxtTextInFile};
aDlg[IDCONTENTCB ]={S:0x50210042, C:"COMBOBOX", Sel1:0, Sel2:-1};
aDlg[IDHELP2B    ]={S:0x50010000, C:"BUTTON", T:"&?"};
aDlg[IDMATCHCASE ]={S:0x50010003, C:"BUTTON", T:sTxtMatchCase};
aDlg[IDCONTENTRE ]={S:0x50010003, C:"BUTTON", T:sTxtRegExp};
aDlg[IDMULTILINE ]={S:0x50010003, C:"BUTTON", T:sTxtMultiline};
aDlg[IDMATCHWORD ]={S:0x50010003, C:"BUTTON", T:sTxtMatchWord};
aDlg[IDNOTCONTAIN]={S:0x50010003, C:"BUTTON", T:sTxtNotContain};
aDlg[IDSKIPBINARY]={S:0x50010003, C:"BUTTON", T:sTxtSkipBinary};
aDlg[IDSKIPLARGER]={S:0x50010003, C:"BUTTON", T:sTxtSkipLarger};
aDlg[IDMAXSIZEE  ]={S:0x50012002, C:"EDIT", ES:0x200};
aDlg[IDREPLACES  ]={S:0x50000000, C:"STATIC", T:sTxtReplaceWith};
aDlg[IDREPLACECB ]={S:0x50210042, C:"COMBOBOX", Sel1:0, Sel2:-1};
aDlg[IDHELP3B    ]={S:0x50010000, C:"BUTTON", T:"?"};
aDlg[IDSKIPG     ]={S:0x50000007, C:"BUTTON", T:sTxtSkipFiles};
aDlg[IDREADONLY  ]={S:0x50010003, C:"BUTTON", T:sTxtReadOnly};
aDlg[IDHIDDEN    ]={S:0x50010003, C:"BUTTON", T:sTxtHidden};
aDlg[IDSYSTEM    ]={S:0x50010003, C:"BUTTON", T:sTxtSystem};
aDlg[IDVCSIGNORE ]={S:0x50010003, C:"BUTTON", T:sTxtVCSigore};
aDlg[IDVCSIGNOREF]={S:0x50010003, C:"BUTTON", T:sTxtVCSigoreFiles};
aDlg[IDVCSIGNOREN]={S:0x50010003, C:"BUTTON", T:sTxtVCSigoreNest};
aDlg[IDINRESULTS ]={S:0x50010003, C:"BUTTON", T:sTxtInResults};
aDlg[IDSEARCHB   ]={S:0x50010000, C:"BUTTON", T:sTxtSearch};
aDlg[IDREPLACEB  ]={S:0x50010000, C:"BUTTON", T:sTxtReplace};
aDlg[IDHISTORYB  ]={S:0x50010000, C:"BUTTON", T:sTxtHistory};
aDlg[IDEDITB     ]={S:0x50010000, C:"BUTTON", T:sTxtEdit};
aDlg[IDCOPYB     ]={S:0x50010000, C:"BUTTON", T:sTxtCopyList};
aDlg[IDCLEARB    ]={S:0x50010000, C:"BUTTON", T:sTxtClearList};
aDlg[IDSETTINGSB ]={S:0x50010000, C:"BUTTON", T:sTxtSettings};
aDlg[IDCLOSEB    ]={S:0x50010000, C:"BUTTON", T:sTxtClose};
aDlg[IDFILELV    ]={S:0x50810009, C:"SysListView32"};
aDlg[IDSTATUS    ]={S:0x50000100, C:"msctls_statusbar32"};

AkelPad.ScriptNoMutex();
AkelPad.WindowRegisterClass(sClass);

try
{
  while (! bCloseDlg)
  {
    bCloseDlg = true;
    hParent   = bSeparateWnd ? 0 : hMainWnd;
    oWndPos.W = Math.max(Scale.X(oWndPos.W), nWndMinW);
    oWndPos.H = Math.max(Scale.Y(oWndPos.H), nWndMinH);

    SetForegroundWindow(hMainWnd);


    hDlg = oSys.Call("User32::CreateWindowExW",
           0,               //dwExStyle
           sClass,          //lpClassName
           sTxtDlgTitle,    //lpWindowName
           0x80CF0000,      //dwStyle=WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MAXIMIZEBOX|WS_MINIMIZEBOX|WS_SIZEBOX
           oWndPos.X,       //x
           oWndPos.Y,       //y
           oWndPos.W,       //nWidth
           oWndPos.H,       //nHeight
           hParent,         //hWndParent
           0,               //hMenu
           hInstDLL,        //hInstance
           DialogCallback); //Script function callback. To use it class must be registered by WindowRegisterClass.

    oSys.Call("User32::ShowWindow", hDlg, oWndPos.Max ? 3 /*SW_MAXIMIZE*/ : 1 /*SW_SHOWNORMAL*/);
    AkelPad.WindowGetMessage();
  }
}
catch (oError)
{
  AkelPad.MessageBox(0, "Dialog Error:\n\n"+ oError.name +"\n\n"+ oError.description, WScript.ScriptName, 0 /*MB_OK*/);
}

AkelPad.WindowUnregisterClass(sClass);
AkelPad.MemFree(lpBuffer);
AkelPad.MemFree(lpLVITEM);
oSys.Call("Gdi32::DeleteObject", hBrush);
oSys.Call("Gdi32::DeleteObject", hBrushT);
oSys.Call("Gdi32::DeleteObject", hBrushC);
oSys.Call("Gdi32::DeleteObject", hBrushREC);
SetForegroundWindow(hMainWnd);

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  var nID, nCode, i, dataTxt, strContent, strReplace;

  if (uMsg === 1 /*WM_CREATE*/)
  {
    for (i = 2000; i < aDlg.length; ++i)
    {
      aDlg[i].HWND = oSys.Call("User32::CreateWindowExW",
        aDlg[i].ES, //dwExStyle
        aDlg[i].C,  //lpClassName
        aDlg[i].T,  //lpWindowName
        aDlg[i].S,  //dwStyle
        0, 0, 0, 0, //x, y, nWidth, nHeight
        hWnd,       //hWndParent
        i,          //ID
        hInstDLL,   //hInstance
        0);         //lpParam

      SendMessage(aDlg[i].HWND, 48 /*WM_SETFONT*/, hGuiFont, true);
    }

    for (i = IDNAMERE; i <= IDINSTREAMS; ++i)
      aDlg[i].W = GetTextWidth(aDlg[i].T.replace("&", ""), hWnd, hGuiFont) + Scale.X(18);
    for (i = IDMATCHCASE; i <= IDSKIPLARGER; ++i)
      aDlg[i].W = GetTextWidth(aDlg[i].T.replace("&", ""), hWnd, hGuiFont) + Scale.X(18);

    //Get handles to edit/list in ComboBoxes IDNAMECB, IDCONTENTCB and IDREPLACECB
    AkelPad.MemCopy(lpBuffer, _X64 ? 64 : 52 /*sizeof(COMBOBOXINFO)*/, DT_DWORD);
    oSys.Call("User32::GetComboBoxInfo", aDlg[IDNAMECB].HWND, lpBuffer);
    aDlg[IDNAMECB].HWNDEdit = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
    aDlg[IDNAMECB].HWNDList = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 56 : 48) /*hwndList*/, DT_QWORD);
    oSys.Call("User32::GetComboBoxInfo", aDlg[IDCONTENTCB].HWND, lpBuffer);
    aDlg[IDCONTENTCB].HWNDEdit = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
    aDlg[IDCONTENTCB].HWNDList = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 56 : 48) /*hwndList*/, DT_QWORD);
    oSys.Call("User32::GetComboBoxInfo", aDlg[IDREPLACECB].HWND, lpBuffer);
    aDlg[IDREPLACECB].HWNDEdit = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
    aDlg[IDREPLACECB].HWNDList = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 56 : 48) /*hwndList*/, DT_QWORD);

    SendMessage(aDlg[IDDIRCB    ].HWND, 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    SendMessage(aDlg[IDNAMECB   ].HWND, 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    SendMessage(aDlg[IDCONTENTCB].HWND, 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    SendMessage(aDlg[IDREPLACECB].HWND, 0x0141 /*CB_LIMITTEXT*/, 256, 0);
    SendMessage(aDlg[IDDIRCB    ].HWND, 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);
    SendMessage(aDlg[IDNAMECB   ].HWND, 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);
    SendMessage(aDlg[IDCONTENTCB].HWND, 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);
    SendMessage(aDlg[IDREPLACECB].HWND, 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);

    SetCheckButtons();
    SetWindowText(aDlg[IDMAXSIZEE].HWND, (nMaxFileSize > 0) ? nMaxFileSize.toString() : "");
    FillCB();
    SetPartsSB();

    SendMessage(aDlg[IDFILELV].HWND, 0x1036 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0x0020 /*LVS_EX_FULLROWSELECT*/, 0x0020);
    SetColumnLV();
    SetHeaderLV();
    PostMessage(hWnd, 0x8000 /*WM_APP*/, 0, 0);

    hFocus = aDlg[IDCONTENTCB].HWND;
  }

  else if (uMsg === 0x8000 /*WM_APP*/)
  {
    sDir = AkelPad.GetArgValue("sDir", sDir);
    dataDir = sDir || AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1);
    SetWindowText(aDlg[IDDIRCB].HWND, dataDir);

    sWhat = AkelPad.GetArgValue("sWhat", AkelPad.GetSelText());
    dataTxt = sWhat || sLastContent;
    if (dataTxt)
    {
      SetWindowText(aDlg[IDCONTENTCB].HWND, dataTxt);
      oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
    }
    else
      SetWindowText(aDlg[IDCONTENTCB].HWND, sLastContent);

    SetWindowText(aDlg[IDNAMECB].HWND, sName);
    SendMessage(hFocus, 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(0, -1));

    sReplace = AkelPad.GetArgValue("sWith", sReplace);
    SetWindowText(aDlg[IDREPLACECB].HWND, sReplace);

    EnableButtons();
    oSys.Call("User32::UpdateWindow", hWnd);
    SetTextSB(-2);
    FillLV();
    SendMessage(aDlg[IDFILELV].HWND, 0x1013 /*LVM_ENSUREVISIBLE*/, nFilesFoc, false);
  }

  else if (uMsg === 0x8001 /*WM_APP+1*/)
    oSys.Call("User32::SetFocus", wParam);

  else if ((uMsg === 6 /*WM_ACTIVATE*/) && (! wParam))
    hFocus = oSys.Call("User32::GetFocus");

  else if (uMsg === 7 /*WM_SETFOCUS*/)
    oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);

  else if (uMsg === 36) //WM_GETMINMAXINFO
  {
    AkelPad.MemCopy(_PtrAdd(lParam, 24), nWndMinW, DT_DWORD); //ptMinTrackSize_x
    AkelPad.MemCopy(_PtrAdd(lParam, 28), nWndMinH, DT_DWORD); //ptMinTrackSize_y
  }

  else if (uMsg === 3 /*WM_MOVE*/)
  {
    if (! (oSys.Call("User32::IsZoomed", hWnd) || oSys.Call("User32::IsIconic", hWnd)))
      GetWindowPos(hWnd, oWndPos);
  }

  else if (uMsg === 5 /*WM_SIZE*/)
  {
    if (wParam === 0 /*SIZE_RESTORED*/)
      GetWindowPos(hWnd, oWndPos);

    ResizeDlg(LoWord(lParam), HiWord(lParam));
  }

  ////////////////////////////////////////////////////////////////////////// inputs status highlight
  else if (uMsg === 307 /*WM_CTLCOLOREDIT*/)
  {
    if ((lParam === aDlg[IDCONTENTCB].HWNDEdit) || (lParam === aDlg[IDREPLACECB].HWNDEdit))
    {
      if (((lParam === aDlg[IDCONTENTCB].HWNDEdit) || (lParam === aDlg[IDREPLACECB].HWNDEdit)))
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
          return nBkColorT;
        }
      }
    }
  }
  else if (uMsg === 308 /*WM_CTLCOLORLISTBOX*/)
  {
    if ((lParam === aDlg[IDCONTENTCB].HWNDList) || (lParam === aDlg[IDREPLACECB].HWNDList))
    {
      if ((lParam === aDlg[IDCONTENTCB].HWNDList) || (lParam === aDlg[IDREPLACECB].HWNDList))
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
  }
  ////////////////////////////////////////////////////////////////////////// end inputs status highlight

  else if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    if (bSilentActions && (Ctrl() || Shift()))
      oSys.Call("User32::SystemParametersInfoW", 2 /*SPI_SETBEEP*/, 0, null, 2 /*SPIF_SENDWININICHANGE*/);

    if (wParam === 0x0D /*VK_RETURN*/)
    {
      strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent;
      if (bMarkResults)
        highlight(strContent);
      else
        highlight(strContent, 3);

      nID = oSys.Call("User32::GetDlgCtrlID", oSys.Call("User32::GetFocus"));
      if ((! Ctrl()) && Shift())
      {
        if (nID !== IDFILELV)
          oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
        else if (nID === IDFILELV)
        {
          if (bMarkResults)
            highlight();

          if (bBookmarkResults)
            BookmarkLines('', true);

          if (bLogShow)
          {
            if (OpenOrCloseFile(false))
            {
              // if (TextSearchOptions("BEGIN"))
              // {
              //   SearchReplace_extended();
              //   oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
              // }
            }
          }
          else if (! bLogShow)
          {
            OpenOrCloseFile(true);
          }
          else
          {
            if (bCloseToggler)
              OpenOrCloseFile(true);
            else
            {
              OpenFileAndFindBeginOrFindNext();
            }
          }
        }
      }
      else if (Ctrl() && (! Shift()))
      {
        TextSearchOptions();
      }
      else if (Ctrl() && Shift())
      {
        TextSearchOptions("UP");
      }
      else
      {
        if (new Date().getTime() - nHistTime > 100)
        {
          if (nID === IDFILELV)
            PostMessage(hWnd, 273 /*WM_COMMAND*/, IDEDITB, 0);
          else if (IsCloseCB() &&
                  (nID !== IDCURRENTB) && (nID !== IDBROWSEB) && (nID !== IDHELP1B)   && (nID !== IDHELP2B) &&
                  (nID !== IDHELP3B)   && (nID !== IDSEARCHB) && (nID !== IDREPLACEB) && (nID !== IDHISTORYB) &&
                  (nID !== IDEDITB)    && (nID !== IDCOPYB)   && (nID !== IDCLEARB)   && (nID !== IDSETTINGSB))
            PostMessage(hWnd, 273 /*WM_COMMAND*/, IDSEARCHB, 0);
        }
      }
    }
    else if (wParam === 0x70 /*VK_F1*/)
    {
      if ((! Ctrl()) && (! Shift()))
      {
        hFocus = oSys.Call("User32::GetFocus");
        if (hFocus === aDlg[IDNAMECB].HWNDEdit)
        {
          oSys.Call("User32::SetFocus", aDlg[IDHELP1B].HWND);
          Help(IDHELP1B, 1);
        }
        else if ((hFocus === aDlg[IDCONTENTCB].HWNDEdit) && bContentRE)
        {
          oSys.Call("User32::SetFocus", aDlg[IDHELP2B].HWND);
          Help(IDHELP2B, 1);
        }
        else if ((hFocus === aDlg[IDREPLACECB].HWNDEdit) && bContentRE)
        {
          oSys.Call("User32::SetFocus", aDlg[IDHELP3B].HWND);
          Help(IDHELP3B, 1);
        }
      }
    }
    else if (wParam === 0x72 /*VK_F3*/)
    {
      if ((! Ctrl()) && (! Shift()) && (! Alt()))
      {
        if (bMarkResults)
          highlight();
        TextSearchOptions();
      }
      else if ((! Ctrl()) && Shift())
      {
        if (bMarkResults)
          highlight();
        TextSearchOptions("UP");
      }
    }
    else if (wParam === 0x73 /*VK_F4*/)
    {
      if ((! Ctrl()) && (! Shift()))
      {
        if (AkelPad.IsPluginRunning("Log::Output"))
        {
          AkelPad.Call("Log::Output::NextMatch");
          if (bMarkResults)
            highlight();
          oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
        }
        else
        {
          if (bMarkResults)
            highlight();
          if (! qSearchLog())
            qSearching(AkelPad.GetSelText());
        }
      }
      else if ((! Ctrl()) && Shift())
      {
        if (AkelPad.IsPluginRunning("Log::Output"))
        {
          AkelPad.Call("Log::Output::PrevMatch");
          if (bMarkResults)
            highlight();
          oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
        }
        else
        {
          if (bMarkResults)
            highlight();
          qSearchLog();
        }
      }
    }
    else if (wParam === 0x71 /*VK_F2*/)
    {
      if ((! Ctrl()) && (! Shift()))
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDEDITB, 0);
    }
    else if (wParam === 0x1B /*VK_ESCAPE*/)
    {
      if (IsCloseCB())
        PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
    }
    else if (wParam === 0x26 /*UP ARROW key VK_UP*/)
    {
      if (Ctrl() && (! Shift()))
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
    }
    else if (wParam === 0x28 /*DOWN ARROW key VK_DOWN*/)
    {
      if (Ctrl() && (! Shift()))
        oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
    }
    else if (wParam === 0x48 /*H key VK_KEY_H*/)
    {
      if (Ctrl() && (! Shift()))
      {
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        strReplace = GetWindowText(aDlg[IDREPLACECB].HWND) || sContent || sLastContent;

        if (! bSeparateWnd)
          PostMessage(hDlg, 16 /*WM_CLOSE*/, 0, 0);

        AkelPad.Call("Scripts::Main", 1, "TextReplacer.js", "-sWhat='"+ strContent +"' -sWith='"+ ((sReplace)? sReplace : strContent) +"'");
      }
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
      {
        if (SearchReplace_extended())
          oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
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
    else if (wParam === 0x43 /*C key VK_KEY_C*/)
    {
        if (Ctrl() && Shift())
            LogOutputActions(".txt", CopyLogContentsToClipboardCB);
    }
    else if (wParam === 0x45 /*E key VK_KEY_E*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Explorer::Main", 1, sDir);
      if (Ctrl() && Shift())
        AkelPad.Exec('explorer "'+ sDir +'"');
    }
    else if (wParam === 0x57 /*W key VK_KEY_W*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Command(4318);
      else if (Ctrl() && Shift())
      {
        CloseOpenedFilesFromResult();
      }
    }
    else if (wParam === 0x54 /*T key VK_KEY_T*/)
    {
      if (Ctrl() && (! Shift()))
      {
        CopyLogContentsToNewTabCB("", ".txt");
        WScript.Sleep(100);
        oSys.Call("User32::SetFocus", AkelPad.GetEditWnd());
      }
      else if (Ctrl() && Shift())
        AkelPad.Command(5002);
    }
    else if (wParam === 0x46 /*F key VK_KEY_F*/)
    {
      if (Ctrl() && (! Shift()))
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      else if (Ctrl() && Shift())
      {
        strContent = AkelPad.GetSelText() || sContent || sLastContent;
        oSys.Call("User32::SetWindowText" + _TCHAR, aDlg[IDCONTENTCB].HWND, strContent);
        SendMessage(aDlg[IDCONTENTCB].HWND, 0x142 /*CB_SETEDITSEL*/, 0, MAKELONG(0, -1));
      }
    }
    else if (wParam === 0x52 /*R key VK_KEY_R*/)
    {
      if (Ctrl() && (! Shift()))
      {
        SearchReplace_extended("DOWN", 3);
        oSys.Call("User32::SetFocus", aDlg[IDREPLACECB].HWND);
      }
      if (Ctrl() && Shift())
      {
        SearchReplace_extended("BEGIN", 4);
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
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
        LogOutputActions(sLogExt, CopyLogContentsToNewTabCB);
        // if (LogOutputActions(sLogExt, CopyLogContentsToNewTabCB))
        //   AkelPad.Call("Log::Output", 6);
      else if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "ForceNewInstance_extended.js", '-MDI=2 -CmdLine="/Show(3)"');
    }
    else if (wParam === 0x4D /*M key VK_KEY_M*/)
    {
      if (Ctrl() && (! Shift()))
      {
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ strContent +"'");
      }
      else if (Ctrl() && Shift())
      {
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ strContent +"' -clear=1");
      }
    }
    else if (wParam === 0x4F /*O key VK_KEY_O*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Call("Scripts::Main", 1, "FileAndStream_extended.js", '-sDir="'+ sDir.replace(/\\$/, "") +'"');
      else if (Ctrl() && Shift())
        AkelPad.Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", '"1"');
    }
    else if (wParam === 0x51 /*Q key VK_KEY_Q*/)
    {
      if (Ctrl() && (! Shift()))
        qSearchLog();
      else if (Ctrl() && Shift())
        qSearchLog();
    }
    else if (wParam === 0x55 /*U key VK_KEY_U*/)
    {
      if (Ctrl() && (! Shift()))
        AkelPad.Command(4151);
      else if (Ctrl() && Shift())
        AkelPad.Command(4152);
    }
    else if (wParam === 0x09 /*TAB key VK_TAB*/) {
      if (Ctrl() && (! Shift()))
      {
        AkelPad.Command(4333);
        AkelPad.Call("Scripts::Main", 2, "TabSwitch.js", '-Next=false -OnlyNames=true -FontSize=11 -LineGap=4');
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
      else if (Ctrl() && Shift())
      {
        AkelPad.Command(4333);
        AkelPad.Call("Scripts::Main", 2, "TabSwitch.js", '-Next=-1 -CtrlTab=false -MinTabs=1 -WindowLeft=-1 -WindowTop=-1 -OnlyNames=true -FontSize=12');
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
    }
    else if ((wParam === 186/*VK_OEM_1*/)) {
      if (Ctrl() && (! Shift()))
        AkelPad.Command(4333);
    }
  }

  else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
  {
    if (bSilentActions && (Ctrl() || Shift() || Alt()))
      oSys.Call("User32::SystemParametersInfoW", 2 /*SPI_SETBEEP*/, 0, null, 2 /*SPIF_SENDWININICHANGE*/);

    if (! Shift())
    {
      if (wParam === 0x46 /*F key VK_KEY_F*/)
        oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
      else if (wParam === 0x0D /*VK_RETURN*/)
        oSys.Call("User32::ShowWindow", hDlg, oSys.Call("User32::IsZoomed", hDlg) ? 9 /*SW_RESTORE*/ : 3 /*SW_MAXIMIZE*/);
      else if (wParam === 0x2E /*VK_DELETE*/)
      {
        if (SendMessage(aDlg[IDDIRCB].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aDlg[IDDIRCB].HWND, aDirs);
        else if (SendMessage(aDlg[IDNAMECB].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aDlg[IDNAMECB].HWND, aNames);
        else if (SendMessage(aDlg[IDCONTENTCB].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aDlg[IDCONTENTCB].HWND, aContents);
        else if (SendMessage(aDlg[IDREPLACECB].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
          DeleteItemCB(aDlg[IDREPLACECB].HWND, aReplace);
      }
      else if (wParam === 0x42 /*B key VK_KEY_B*/)
        BookmarkLines('', true);
      else if (wParam === 0x47 /*G key VK_KEY_G*/)
      {
        TextSearchOptions("WORD CASE TABS");
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
      else if (wParam === 0x4C /*L key VK_KEY_L*/)
      {
        AkelPad.Command(4333);
        AkelPad.Call("LineBoard::Main::BookmarkList");
        oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
      }
      else if (wParam === 0x4D /*M key VK_KEY_M*/)
      {
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ strContent +"' -tabs=4");
      }
      else if (wParam === 0x4E /*N key VK_KEY_N*/)
        FindstrLog();
      else if (wParam === 0x48 /*H key VK_KEY_H*/)
      {
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        MakeHighlight(strContent, (! bContentRE));
      }
      else if (wParam === 0x5A /*Z key VK_KEY_Z*/)
        AkelPad.Command(4199);
      else if (wParam === 0x26 /*UP ARROW key VK_UP*/)
      {
        oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
        AkelPad.Call("Scroll::Settings", 4, -20);
      }
      else if (wParam === 0x28 /*DOWN ARROW key VK_DOWN*/)
      {
        oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
        AkelPad.Call("Scroll::Settings", 4, 20);
      }
      else if (wParam === 0x25 /*LEFT ARROW key VK_LEFT*/)
        AkelPad.Call("Scripts::Main", 1, "TabSwitch.js", "-Next=0 -CtrlTab=true -RightLeft=true -MinTabs=999 -ShowModify=0");
      else if (wParam === 0x27 /*RIGHT ARROW key VK_RIGHT*/)
        AkelPad.Call("Scripts::Main", 1, "TabSwitch.js", "-Next=1 -CtrlTab=true -RightLeft=true -MinTabs=999 -ShowModify=0");
    }
    else if ((! Ctrl()) && Shift())
    {
      if (wParam === 0x46 /*F key VK_KEY_F*/)
      {
        if (! bSeparateWnd)
          PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "FindFiles_extended.js", "-sDir='"+ sDir +"' -sWhat='"+ strContent +"' -sWith='"+ sReplace +"' ");
      }
      else if (wParam === 0x4E /*N key VK_KEY_N*/)
        FindstrLog(8388608);
      else if (wParam === 0x41 /*A key VK_KEY_A*/)
      {
        if (SearchReplace_extended('TABS', 2));
           oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
      else if (wParam === 0x42 /*B key VK_KEY_B*/)
        BookmarkLines('', false);
      else if (wParam === 0x47 /*G key VK_KEY_G*/)
      {
        TextSearchOptions("WORD CASE UP TABS");
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
      else if (wParam === 0x48 /*H key VK_KEY_H*/)
      {
        bMarkResults = ! bMarkResults;
        if (bMarkResults)
          popupShow("The highlight is turned on!", 1);
        else
          popupShow("The highlight is turned off!", 1);
      }
      else if (wParam === 0x4D /*M key VK_KEY_M*/)
      {
        //AkelPad.Call("Scripts::Main", 1, "MarkerPlus.vbs", '11');
        strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
        AkelPad.Call("Scripts::Main", 1, "MarkIt_extended.js", "-text='"+ strContent +"' -tabs=4 -clear=1");
      }
      else if (wParam === 0x51 /*Q key VK_KEY_Q*/)
      {
        //AkelPad.Command(4333);
        //AkelPad.Call("Scripts::Main", 2, "TabCloseExts.vbs");
        //popupShow("Tab close by extensions");
        //AkelPad.Call("Scripts::Main", 2, WScript.ScriptName);
        qSearchLog(3);
      }
      else if (wParam === 0x52 /*R key VK_KEY_R*/)
      {
        if (SearchReplace_extended("TABS", 4))
        {
          //oSys.Call("User32::SetFocus", aDlg[IDREPLACECB].HWND);
          //AkelPad.Command(4333);
        }
      }
      else if (wParam === 0x57 /*W key VK_KEY_W*/)
      {
        AkelPad.Command(4333);
        AkelPad.Call("Scripts::Main", 2, "CloseTabByExt.js");
        //AkelPad.Call("Scripts::Main", 2, WScript.ScriptName);
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
      else if (wParam === 0x5A /*Z key VK_KEY_Z*/)
        AkelPad.Command(4200);
      else if (wParam === 0x0D /*VK_RETURN*/)
      {
        bLogShow = ! bLogShow;
        //popupShow(
        //  (bLogShow
        //    ? "Double click will show the results in the Log.\n\nUse Ctrl+W to close the file."
        //    : ((bCloseToggler)
        //      ? "Double click will close the result file."
        //      : "Double click has default behaviour.")),
        //  1, sScriptName
        //);
        if (bLogShow)
        {
          sContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent;
          if (AkelPad.IsPluginRunning("Log::Output"))
          {
            AkelPad.Call("Log::Output::PrevMatch");
            if (bMarkResults)
              highlight();
            oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
          }
          else
          {
            if (bMarkResults)
              highlight();
            SearchReplace_extended();
            oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
          }
        }
        else
        {
          if (AkelPad.IsPluginRunning("Log::Output"))
            AkelPad.Call("Log::Output", 6);
          oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
        }
      }
      else if (wParam === 0x25 /*LEFT ARROW key VK_LEFT*/)
      {
        TextSearchOptions("WORD UP CASE TABS");
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);

      }
      else if (wParam === 0x27 /*RIGHT ARROW key VK_RIGHT*/)
      {
        TextSearchOptions("WORD CASE TABS");
        oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      }
      else if ((wParam === 186 /*VK_OEM_1*/)){}
    }
  }

  else if ((uMsg === 78 /*WM_NOTIFY*/) && (wParam === IDFILELV))
  {
    var inputCode = AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8) /*code*/, DT_DWORD);
    switch (inputCode)
    {
      case -101 : //LVN_ITEMCHANGED
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 32 : 20) /*uNewState*/, DT_DWORD) & 0x1 /*LVIS_FOCUSED*/)
          SetTextSB(AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD));
        break;

      case -155 : //LVN_KEYDOWN
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*wVKey*/, DT_WORD) === 0x2E /*VK_DELETE*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            RemoveFromList();
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x41 /*A key*/)
        {
          if (Ctrl() && (! Shift()) && (! Alt()))
            SetSelAllLV();
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x43 /*C key*/)
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

        for (i = 0; i < aFilesSel.length; ++i)
          aFilesSel[i] = aFiles.length - aFilesSel[i] - 1;

        SetHeaderLV();
        FillLV();
    }

    if (bBehaviour)
    { // SOME OLD BEHAVIOURS + EXPERIMENTS
      if (inputCode === -6 /*NM_RDBLCLK*/)
      {
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
        else
          SearchReplace_extended();
      }
      else if (inputCode === -5 /*NM_RCLICK*/)
      {
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
      }
      else if (inputCode === -3 /*NM_DBLCLK*/)
      {
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) > -1)
          OpenOrCloseFile(true);
      }
      else if (inputCode === -2 /*NM_CLICK*/)
      {
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
      }
    }
    else
    { // SOME NEW EXPERIMENTS
      if (inputCode === -6 /*NM_RDBLCLK*/)
      {
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
        else
          OpenFileAndFindBeginOrFindNext(true);
      }
      else if (inputCode === -5 /*NM_RCLICK*/)
      {
        if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
        else
        {
          OpenFileAndFindBeginOrFindNext(true);
          if (bMarkResults)
            highlight();

          if (bBookmarkResults)
            BookmarkLines('', true);
        }
      }
      else if (inputCode === -3 /*NM_DBLCLK*/)
      {
        if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
        else
        {
          if (bLogShow)
            SearchReplace_extended();
          else
          {
            if (bCloseToggler)
              OpenOrCloseFile(false);
            else
            {
              OpenFileAndFindBeginOrFindNext();
            }
          }
        }
      }
      else if (inputCode === -2 /*NM_CLICK*/)
      {
        if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
          SetSelLV(GetCurFocLV());
        else
        {
          OpenFileAndFindBeginOrFindNext();
          if (bMarkResults)
            highlight();

          if (bBookmarkResults)
            BookmarkLines('', true);
        }
      }
    }

  }

  else if (uMsg === 273 /*WM_COMMAND*/)
  {
    nID       = LoWord(wParam);
    nCode     = HiWord(wParam);
    bCloseCBL = 1;

    if (nID === IDDIRLEVELCB)
    {
      if (nCode === 1 /*CBN_SELCHANGE*/)
      {
        nDirLevel = SendMessage(aDlg[IDDIRLEVELCB].HWND, 0x0147 /*CB_GETCURSEL*/, 0, 0);
        if (nDirLevel === (SendMessage(aDlg[IDDIRLEVELCB].HWND, 0x0146 /*CB_GETCOUNT*/, 0, 0) - 1))
          nDirLevel = -1;
      }
      else if (nCode === 8 /*CBN_CLOSEUP*/)
        bCloseCBL = 0;
    }
    else if ((nID === IDNAMECB) || (nID === IDCONTENTCB) || (nID === IDREPLACECB))
    {
      if (nCode === 3 /*CBN_SETFOCUS*/)
        SendMessage(aDlg[nID].HWNDEdit, 177 /*EM_SETSEL*/, aDlg[nID].Sel1, aDlg[nID].Sel2);
      else if (nCode === 10 /*CBN_SELENDCANCEL*/)
      {
        aDlg[nID].Sel1 = LoWord(SendMessage(lParam, 0x0140 /*CB_GETEDITSEL*/, 0, 0));
        aDlg[nID].Sel2 = HiWord(SendMessage(lParam, 0x0140 /*CB_GETEDITSEL*/, 0, 0));
      }
      EnableButtons();
    }
    else if (nID === IDCURRENTB)
      CurrentDir();
    else if (nID === IDBROWSEB)
      BrowseDirs();
    else if ((nID === IDHELP1B) || (nID === IDHELP2B) || (nID === IDHELP3B))
      Help(nID);
    else if (nID === IDNAMERE)
    {
      bNameRE = ! bNameRE;
      oSys.Call("User32::InvalidateRect", aDlg[IDNAMECB].HWNDEdit, 0, true);
    }
    else if (nID === IDNOTNAME)
      bNotName = ! bNotName;
    else if (nID === IDINFILES)
    {
      bInFiles = ! bInFiles;
      if (! bInFiles)
      {
        bInStreams = true;
        SendMessage(aDlg[IDINSTREAMS].HWND, 0x00F1 /*BM_SETCHECK*/, bInStreams, 0);
      }
    }
    else if (nID === IDINSTREAMS)
    {
      bInStreams = ! bInStreams;
      if (! bInStreams)
      {
        bInFiles = true;
        SendMessage(aDlg[IDINFILES].HWND, 0x00F1 /*BM_SETCHECK*/, bInFiles, 0);
      }
    }
    else if (nID === IDMATCHWORD)
      bMatchWord = ! bMatchWord;
    else if (nID === IDMATCHCASE)
      bMatchCase = ! bMatchCase;
    else if (nID === IDCONTENTRE)
    {
      bContentRE = ! bContentRE;
      EnableButtons();
      oSys.Call("User32::InvalidateRect", aDlg[IDCONTENTCB].HWNDEdit, 0, true);
      oSys.Call("User32::InvalidateRect", aDlg[IDREPLACECB].HWNDEdit, 0, true);
    }
    else if (nID === IDMULTILINE)
      bMultiline = ! bMultiline;
    else if (nID === IDNOTCONTAIN)
    {
      bNotContain = ! bNotContain;
      EnableButtons();
    }
    else if (nID === IDSKIPBINARY)
      bSkipBinary = ! bSkipBinary;
    else if (nID === IDSKIPLARGER)
    {
      bSkipLarger = ! bSkipLarger;
      EnableButtons();
    }
    else if (nID === IDMAXSIZEE)
    {
      if (nCode === 0x0300 /*EN_CHANGE*/)
      {
        nMaxFileSize = parseInt(GetWindowText(lParam), 10);
        if ((! isFinite(nMaxFileSize)) || (nMaxFileSize <= 0))
        {
          nMaxFileSize = 0;
          SetWindowText(lParam, "");
        }
      }
    }
    else if (nID === IDREADONLY)
      bSkipReadOnly = ! bSkipReadOnly;
    else if (nID === IDHIDDEN)
      bSkipHidden = ! bSkipHidden;
    else if (nID === IDSYSTEM)
      bSkipSystem = ! bSkipSystem;
    else if (nID === IDVCSIGNORE)
    {
      bSkipVCSignore = ! bSkipVCSignore;
      EnableButtons();
    }
    else if (nID === IDVCSIGNOREN)
      bSkipVCSignoreN = ! bSkipVCSignoreN;
    else if (nID === IDVCSIGNOREF)
      bSkipVCSignoreF = ! bSkipVCSignoreF;
    else if (nID === IDINRESULTS)
    {
      bInResults = ! bInResults;
      EnableButtons();
    }
    else if ((nID === IDSEARCHB) || (nID === IDREPLACEB))
    {
      if (SearchFiles(nID === IDREPLACEB) && bMarkResults)
        MakeHighlight(sContent, (! bContentRE));
    }
    else if (nID === IDHISTORYB)
      History();
    else if (nID === IDEDITB)
      OpenFiles();
    else if (nID === IDCOPYB)
      CopyList();
    else if (nID === IDCLEARB)
      ClearList();
    else if (nID === IDSETTINGSB)
      Settings();
    else if ((nID === IDCLOSEB) || (nID === 2 /*IDCANCEL*/))
      PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
  }

  else if (uMsg === 78 /*WM_NOTIFY*/)
  {
    if (bSilentActions)
      oSys.Call("User32::SystemParametersInfoW", 2 /*SPI_SETBEEP*/, 1, null, 2 /*SPIF_SENDWININICHANGE*/);
  }

  else if (uMsg === 16 /*WM_CLOSE*/)
  {
    WriteIni();
    highlight(sContent, 3);
    oSys.Call("User32::DestroyWindow", hWnd);
  }

  else if (uMsg === 2 /*WM_DESTROY*/)
  {
    if (bSilentActions)
      oSys.Call("User32::SystemParametersInfoW", 2 /*SPI_SETBEEP*/, 1, null, 2 /*SPIF_SENDWININICHANGE*/);
    if (nLogCurrent === 18 && AkelPad.IsPluginRunning("Log::Output"))
      AkelPad.Call("Log::Output", 6);
    oSys.Call("User32::PostQuitMessage", 0);
  }

  else
  {
    nID = oSys.Call("User32::GetDlgCtrlID", oSys.Call("User32::GetFocus"));
    if (nID === IDFILELV)
      nID = IDEDITB;
    else if ((nID != IDCURRENTB) && (nID !== IDBROWSEB) && (nID !== IDHELP1B) && (nID !== IDHELP2B) && (nID !== IDHELP3B) && (nID < IDSEARCHB))
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

function GetWindowPos(hWnd, oRect)
{
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("User32::GetWindowRect", hWnd, lpRect);
  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;
  AkelPad.MemFree(lpRect);
}

function SetForegroundWindow(hWnd)
{
  if (! oSys.Call("User32::IsWindowVisible", hWnd))
    oSys.Call("User32::ShowWindow", hWnd, 8 /*SW_SHOWNA*/);
  if (oSys.Call("User32::IsIconic", hWnd))
    oSys.Call("User32::ShowWindow", hWnd, 9 /*SW_RESTORE*/);

  oSys.Call("User32::SetForegroundWindow", hWnd);
}

function GetWindowText(hWnd)
{
  oSys.Call("User32::GetWindowTextW", hWnd, lpBuffer, nBufSize / 2);
  return AkelPad.MemRead(lpBuffer, DT_UNICODE);
}

function SetWindowText(hWnd, sText)
{
  oSys.Call("User32::SetWindowText" + _TCHAR, hWnd, sText);
}

function GetTextWidth(sText, hWnd, hFont)
{
  var hDC    = oSys.Call("User32::GetDC", hWnd);
  var lpSize = AkelPad.MemAlloc(8);
  var nWidth;

  oSys.Call("Gdi32::SelectObject", hDC, hFont);
  oSys.Call("Gdi32::SetMapMode", hDC, 1 /*MM_TEXT*/);
  oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, sText, sText.length, lpSize);

  nWidth = AkelPad.MemRead(lpSize, DT_DWORD);

  oSys.Call("User32::ReleaseDC", hWnd, hDC);
  AkelPad.MemFree(lpSize);
  return nWidth;
}

function ResizeDlg(nW, nH)
{
  var nFlags = 0x0114; //SWP_NOCOPYBITS|SWP_NOACTIVATE|SWP_NOZORDER
  var nW5    = Scale.X(5);
  var nW10   = Scale.X(10);
  var nW20   = Scale.X(20);
  var nW75   = Scale.X(75);
  var nW90   = Scale.X(90);
  var nW132  = Scale.X(132);
  var nH5    = Scale.Y(5);
  var nH13   = Scale.Y(13);
  var nH16   = Scale.Y(16);
  var nH21   = Scale.Y(21);
  var i;

  oSys.Call("User32::SetWindowPos",
    aDlg[IDDIRG].HWND, 0,
    nW5,
    nH5,
    nW - nW90 - nW10 - 2 * nW5,
    Scale.Y(72),
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDDIRCB].HWND, 0,
    2 * nW5,
    Scale.Y(24),
    nW - nW90 - nW10 - 4 * nW5,
    1,
    nFlags);
  for (i = IDCURRENTB; i <= IDBROWSEB; ++i)
    oSys.Call("User32::SetWindowPos",
      aDlg[i].HWND, 0,
      2 * nW5 + (i - IDCURRENTB) * (nW75 + nW5) ,
      Scale.Y(49),
      nW75 - 2,
      nH21 + 2,
      nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDDIRLEVELS].HWND, 0,
    nW - Scale.X(110) - 2 - nW75 - nW90 - nW10 - 2 * nW5,
    Scale.Y(54),
    Scale.X(110),
    nH13,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDDIRLEVELCB].HWND, 0,
    nW - nW75 - nW90 - nW10 - 2 * nW5,
    Scale.Y(50),
    nW75,
    1,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDNAMEG].HWND, 0,
    nW5,
    Scale.Y(80),
    nW - nW90 - nW10 - 2 * nW5,
    Scale.Y(86),
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDNAMECB].HWND, 0,
    2 * nW5,
    Scale.Y(99),
    nW - nW90 - nW20 - nW10 - 4 * nW5,
    1,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDHELP1B].HWND, 0,
    nW - nW90 - nW20 - nW10 - 2 * nW5,
    Scale.Y(99),
    nW20,
    nH21,
    nFlags);
  for (i = IDNAMERE; i <= IDINSTREAMS; ++i)
    oSys.Call("User32::SetWindowPos",
      aDlg[i].HWND, 0,
      2 * nW5 + Math.floor((i - IDNAMERE) / 2) * nW132,
      Scale.Y(124 + ((i - IDNAMERE) % 2) * 20),
      aDlg[i].W,
      nH16,
      nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDCONTENTG].HWND, 0,
    nW5,
    Scale.Y(169),
    nW - nW90 - nW10 - 2 * nW5,
    Scale.Y(157),
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDCONTENTCB].HWND, 0,
    2 * nW5,
    Scale.Y(189),
    nW - nW90 - nW20 - nW10 - 4 * nW5,
    1,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDHELP2B].HWND, 0,
    nW - nW90 - nW20 - nW10 - 2 * nW5,
    Scale.Y(189),
    nW20,
    nH21,
    nFlags);
  for (i = IDMATCHCASE; i <= IDSKIPLARGER; ++i)
    oSys.Call("User32::SetWindowPos",
      aDlg[i].HWND, 0,
      2 * nW5 + Math.floor((i - IDMATCHCASE) / 3) * nW132,
      Scale.Y(214 + ((i - IDMATCHCASE) % 3) * 20),
      aDlg[i].W,
      nH16,
      nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDMAXSIZEE].HWND, 0,
    2 * nW5 + nW132 + aDlg[IDSKIPLARGER].W + 61,
    Scale.Y(233),
    Scale.X(75),
    Scale.Y(20),
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDREPLACES].HWND, 0,
    2 * nW5,
    Scale.Y(275),
    nW132,
    nH13,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDREPLACECB].HWND, 0,
    2 * nW5,
    Scale.Y(294),
    nW - nW90 - nW20 - nW10 - 4 * nW5,
    1,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDHELP3B].HWND, 0,
    nW - nW90 - nW20 - nW10 - 2 * nW5,
    Scale.Y(294),
    nW20,
    nH21,
    nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDSKIPG].HWND, 0,
    nW - nW90 - nW5,
    nH5,
    nW90 -1,
    Scale.Y(114),
    nFlags);
  for (i = IDREADONLY; i <= IDVCSIGNOREN; ++i) // Skip files
    oSys.Call("User32::SetWindowPos",
      aDlg[i].HWND, 0,
      nW - nW90,
      Scale.Y(19 + (i - IDREADONLY) * 16),
      nW75,
      nH16,
      nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDINRESULTS].HWND, 0,
    nW - nW90 - nW5 + 5,
    Scale.Y(123),
    nW90,
    nH16,
    nFlags);
  for (i = IDSEARCHB; i <= IDCLOSEB; ++i)
    oSys.Call("User32::SetWindowPos",
      aDlg[i].HWND, 0,
      nW - nW90 - nW5,
      Scale.Y(141 + (i - IDSEARCHB) * 22),
      nW90,
      nH21,
      nFlags);
  oSys.Call("User32::SetWindowPos",
    aDlg[IDFILELV].HWND, 0,
    -1,
    Scale.Y(325),
    nW + 2,
    nH - Scale.Y(325 + 22),
    nFlags);

  SendMessage(aDlg[IDFILELV].HWND, 0x101E /*LVM_SETCOLUMNWIDTH*/, 0, -2 /*LVSCW_AUTOSIZE_USEHEADER*/);
  SendMessage(aDlg[IDFILELV].HWND, 0x1013 /*LVM_ENSUREVISIBLE*/, GetCurFocLV(), false);
  SendMessage(aDlg[IDSTATUS].HWND, 5 /*WM_SIZE*/, 0, 0);
}

function SetCheckButtons()
{
  SendMessage(aDlg[IDNAMERE    ].HWND, 0x00F1 /*BM_SETCHECK*/, bNameRE, 0);
  SendMessage(aDlg[IDNOTNAME   ].HWND, 0x00F1 /*BM_SETCHECK*/, bNotName, 0);
  SendMessage(aDlg[IDINFILES   ].HWND, 0x00F1 /*BM_SETCHECK*/, bInFiles, 0);
  SendMessage(aDlg[IDINSTREAMS ].HWND, 0x00F1 /*BM_SETCHECK*/, bInStreams, 0);
  SendMessage(aDlg[IDMATCHCASE ].HWND, 0x00F1 /*BM_SETCHECK*/, bMatchCase, 0);
  SendMessage(aDlg[IDCONTENTRE ].HWND, 0x00F1 /*BM_SETCHECK*/, bContentRE, 0);
  SendMessage(aDlg[IDMULTILINE ].HWND, 0x00F1 /*BM_SETCHECK*/, bMultiline, 0);
  SendMessage(aDlg[IDMATCHWORD ].HWND, 0x00F1 /*BM_SETCHECK*/, bMatchWord, 0);
  SendMessage(aDlg[IDNOTCONTAIN].HWND, 0x00F1 /*BM_SETCHECK*/, bNotContain, 0);
  SendMessage(aDlg[IDSKIPBINARY].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipBinary, 0);
  SendMessage(aDlg[IDSKIPLARGER].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipLarger, 0);
  SendMessage(aDlg[IDREADONLY  ].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipReadOnly, 0);
  SendMessage(aDlg[IDHIDDEN    ].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipHidden, 0);
  SendMessage(aDlg[IDSYSTEM    ].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipSystem, 0);
  SendMessage(aDlg[IDVCSIGNORE ].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipVCSignore, 0);
  SendMessage(aDlg[IDVCSIGNOREN].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipVCSignoreN, 0);
  SendMessage(aDlg[IDVCSIGNOREF].HWND, 0x00F1 /*BM_SETCHECK*/, bSkipVCSignoreF, 0);
  SendMessage(aDlg[IDINRESULTS ].HWND, 0x00F1 /*BM_SETCHECK*/, bInResults, 0);
}

function EnableButtons()
{
  var bNotInRes = ! (bInResults && aFiles.length);
  var bContent  = oSys.Call("User32::GetWindowTextLengthW", aDlg[IDCONTENTCB].HWND);
  var i;

  oSys.Call("User32::EnableWindow", aDlg[IDDIRCB].HWND,      bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDCURRENTB].HWND,   bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDBROWSEB].HWND,    bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDDIRLEVELS].HWND,  bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDDIRLEVELCB].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDNAMECB    ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDHELP1B    ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDNAMERE    ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDNOTNAME   ].HWND, bNotInRes && oSys.Call("User32::GetWindowTextLengthW", aDlg[IDNAMECB].HWND));
  oSys.Call("User32::EnableWindow", aDlg[IDINFILES   ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDINSTREAMS ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDREADONLY  ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDHIDDEN    ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDSYSTEM    ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDVCSIGNORE ].HWND, bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDVCSIGNOREN].HWND, bSkipVCSignore);
  oSys.Call("User32::EnableWindow", aDlg[IDVCSIGNOREF].HWND, bSkipVCSignore);
  oSys.Call("User32::EnableWindow", aDlg[IDHELP2B    ].HWND, bContentRE);
  oSys.Call("User32::EnableWindow", aDlg[IDMULTILINE ].HWND, bContentRE);
  oSys.Call("User32::EnableWindow", aDlg[IDNOTCONTAIN].HWND, bContent);
  oSys.Call("User32::EnableWindow", aDlg[IDSKIPBINARY].HWND, bContent && bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDSKIPLARGER].HWND, bContent && bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDMAXSIZEE  ].HWND, bContent && bSkipLarger && bNotInRes);
  oSys.Call("User32::EnableWindow", aDlg[IDREPLACES  ].HWND, bContent && (! bNotContain));
  oSys.Call("User32::EnableWindow", aDlg[IDREPLACECB ].HWND, bContent && (! bNotContain));
  oSys.Call("User32::EnableWindow", aDlg[IDHELP3B    ].HWND, bContent && (! bNotContain) && bContentRE);
  oSys.Call("User32::EnableWindow", aDlg[IDINRESULTS ].HWND, aFiles.length);
  oSys.Call("User32::EnableWindow", aDlg[IDREPLACEB  ].HWND, bContent && (! bNotContain));
  oSys.Call("User32::EnableWindow", aDlg[IDHISTORYB  ].HWND, aHist.length);
  oSys.Call("User32::EnableWindow", aDlg[IDEDITB     ].HWND, aFiles.length);
  oSys.Call("User32::EnableWindow", aDlg[IDCOPYB     ].HWND, aFiles.length);
  oSys.Call("User32::EnableWindow", aDlg[IDCLEARB    ].HWND, aFiles.length);
}

function IsCloseCB()
{
  return (! SendMessage(aDlg[IDDIRCB    ].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         (! SendMessage(aDlg[IDNAMECB   ].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         (! SendMessage(aDlg[IDCONTENTCB].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         (! SendMessage(aDlg[IDREPLACECB].HWND, 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0)) &&
         bCloseCBL;
}

function FillCB()
{
  var i;

  for (i = 0; i < aDirs.length; ++i)
    SendMessage(aDlg[IDDIRCB].HWND, 0x0143 /*CB_ADDSTRING*/, 0, aDirs[i]);

  for (i = 0; i < aNames.length; ++i)
    SendMessage(aDlg[IDNAMECB].HWND, 0x0143 /*CB_ADDSTRING*/, 0, aNames[i]);

  for (i = 0; i < aContents.length; ++i)
    SendMessage(aDlg[IDCONTENTCB].HWND, 0x0143 /*CB_ADDSTRING*/, 0, aContents[i]);

  for (i = 0; i < aReplace.length; ++i)
    SendMessage(aDlg[IDREPLACECB].HWND, 0x0143 /*CB_ADDSTRING*/, 0, aReplace[i]);

  for (i = 0; i < nLevelMax - 1; ++i)
    SendMessage(aDlg[IDDIRLEVELCB].HWND, 0x0143 /*CB_ADDSTRING*/, 0, i.toString());

  i = SendMessage(aDlg[IDDIRLEVELCB].HWND, 0x0143 /*CB_ADDSTRING*/, 0, sTxtAll);
  if ((nDirLevel >= 0) && (nDirLevel < nLevelMax))
    i = nDirLevel;
  else
    nDirLevel = -1;

  SendMessage(aDlg[IDDIRLEVELCB].HWND, 0x014E /*CB_SETCURSEL*/, i, 0);
}

function DeleteItemCB(hWndCB, aItems)
{
  var i = SendMessage(hWndCB, 0x0147 /*CB_GETCURSEL*/, 0, 0);

  aItems.splice(i, 1);
  SendMessage(hWndCB, 0x0144 /*CB_DELETESTRING*/, i, 0);

  if (i > aItems.length - 1)
    i = aItems.length - 1;

  SendMessage(hWndCB, 0x014E /*CB_SETCURSEL*/, i, 0);
}

function GetCurFocLV()
{
  return SendMessage(aDlg[IDFILELV].HWND, 0x100C /*LVM_GETNEXTITEM*/, -1, 0x0001 /*LVNI_FOCUSED*/);
}

function GetNextSelLV(nItem)
{
  return SendMessage(aDlg[IDFILELV].HWND, 0x100C /*LVM_GETNEXTITEM*/, nItem, 0x0002 /*LVNI_SELECTED*/);
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
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), 0x0003 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16), 0x0003 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD);
  SendMessage(aDlg[IDFILELV].HWND, 0x102B /*LVM_SETITEMSTATE*/, nItem, lpLVITEM);
  SendMessage(aDlg[IDFILELV].HWND, 0x1013 /*LVM_ENSUREVISIBLE*/, nItem, true);
}

function SetSelArrayLV()
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), 0x0002 /*LVIS_SELECTED*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16), 0x0002 /*LVIS_SELECTED*/, DT_DWORD);

  for (var i = 0; i < aFilesSel.length; ++i)
    SendMessage(aDlg[IDFILELV].HWND, 0x102B /*LVM_SETITEMSTATE*/, aFilesSel[i], lpLVITEM);

  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), 0x0001 /*LVIS_FOCUSED*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16), 0x0001 /*LVIS_FOCUSED*/, DT_DWORD);
  SendMessage(aDlg[IDFILELV].HWND, 0x102B /*LVM_SETITEMSTATE*/, nFilesFoc, lpLVITEM);
  SendMessage(aDlg[IDFILELV].HWND, 0x1013 /*LVM_ENSUREVISIBLE*/, nFilesFoc, true);
}

function SetSelAllLV()
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), 0x0002 /*LVIS_SELECTED*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16), 0x0002 /*LVIS_SELECTED*/, DT_DWORD);

  for (var i = 0; i < aFiles.length; ++i)
    SendMessage(aDlg[IDFILELV].HWND, 0x102B /*LVM_SETITEMSTATE*/, i, lpLVITEM);
}

function InsertItemLV(nItem, sText)
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 4), nItem, DT_DWORD); //iItem
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8),     0, DT_DWORD); //iSubItem
  AkelPad.MemCopy(lpBuffer, sText, DT_UNICODE);
  SendMessage(aDlg[IDFILELV].HWND, 0x104D /*LVM_INSERTITEMW*/, 0, lpLVITEM);
}

function SetColumnLV()
{
  var lpLVCOLUMN = AkelPad.MemAlloc(_X64 ? 56 : 44); //sizeof(LVCOLUMN)

  SendMessage(aDlg[IDFILELV].HWND, 0x1061 /*LVM_INSERTCOLUMNW*/, 0, lpLVCOLUMN);
  AkelPad.MemFree(lpLVCOLUMN);
}

function SetHeaderLV()
{
  var lpHDITEM = AkelPad.MemAlloc(_X64 ? 72 : 48); //sizeof(HDITEM)
  var nFmt     = 0x4000 /*HDF_STRING*/ | (bSortDesc ? 0x0200 /*HDF_SORTDOWN*/ : 0x0400 /*HDF_SORTUP*/);
  var hHeader  = SendMessage(aDlg[IDFILELV].HWND, 0x101F /*LVM_GETHEADER*/, 0, 0);

  AkelPad.MemCopy(lpBuffer, bAfterReplace ? sTxtFilesRepl.toUpperCase() +":" : sTxtFilesFound.toUpperCase() +":" , DT_UNICODE);
  AkelPad.MemCopy(lpHDITEM, 0x06, DT_DWORD); //mask=HDI_FORMAT|HDI_TEXT
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, 8), lpBuffer, DT_QWORD); //pszText
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 24 : 16), nBufSize, DT_DWORD); //cchTextMax
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), nFmt, DT_DWORD); //fmt
  SendMessage(hHeader, 0x120C /*HDM_SETITEMW*/, 0, lpHDITEM);
  AkelPad.MemFree(lpHDITEM);
}

function FillLV()
{
  var nNameBegin = 0;
  var i;

  SendMessage(aDlg[IDFILELV].HWND, 0x000B /*WM_SETREDRAW*/, 0, 0);
  SendMessage(aDlg[IDFILELV].HWND, 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);

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

  SendMessage(aDlg[IDFILELV].HWND, 0x101E /*LVM_SETCOLUMNWIDTH*/, 0, -2 /*LVSCW_AUTOSIZE_USEHEADER*/);
  SendMessage(aDlg[IDFILELV].HWND, 0x000B /*WM_SETREDRAW*/, 1, 0);
}

function SetPartsSB()
{
  var lpParts = AkelPad.MemAlloc(5 * 4);

  AkelPad.MemCopy(_PtrAdd(lpParts,  0), Scale.X( 90), DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpParts,  4), Scale.X(190), DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpParts,  8), Scale.X(310), DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpParts, 12), Scale.X(350), DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpParts, 16),           -1, DT_DWORD);

  SendMessage(aDlg[IDSTATUS].HWND, 0x0404 /*SB_SETPARTS*/, 5, lpParts);

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
  var nAttr;

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
      nSizeHi = AkelPad.MemRead(_PtrAdd(lpFileInfo, 32), DT_DWORD);
      nSizeLo = AkelPad.MemRead(_PtrAdd(lpFileInfo, 36), DT_DWORD);
      if (nSizeLo < 0)
        nSizeLo += 0xFFFFFFFF + 1;

      lpDecimalSep  = AkelPad.MemAlloc(4 * 2);
      lpThousandSep = AkelPad.MemAlloc(4 * 2);
      lpNUMBERFMT   = AkelPad.MemAlloc(_X64 ? 40 : 24); //sizeof(NUMBERFMT)
      AkelPad.MemCopy(_PtrAdd(lpNUMBERFMT, 8), 3, DT_DWORD); //Grouping
      AkelPad.MemCopy(_PtrAdd(lpNUMBERFMT, _X64 ? 16 : 12), lpDecimalSep,  DT_QWORD);
      AkelPad.MemCopy(_PtrAdd(lpNUMBERFMT, _X64 ? 24 : 16), lpThousandSep, DT_QWORD);

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

      oSys.Call("Kernel32::FileTimeToLocalFileTime", _PtrAdd(lpFileInfo, 20), lpLocalFileTime);
      oSys.Call("Kernel32::FileTimeToSystemTime", lpLocalFileTime, lpSysTime);
      oSys.Call("Kernel32::GetDateFormatW",
        0x400, //LOCALE_USER_DEFAULT
        0x1,   //DATE_SHORTDATE
        lpSysTime,
        0,
        lpBuffer,
        64);
      oSys.Call("Kernel32::GetTimeFormatW",
        0x1F /* 0x400 */, //LOCALE_USER_DEFAULT
        0x8,   //TIME_FORCE24HOURFORMAT
        lpSysTime,
        0,
        _PtrAdd(lpBuffer, 128),
        64);

      AkelPad.MemFree(lpLocalFileTime);
      AkelPad.MemFree(lpSysTime);

      sText2 = "\t" + AkelPad.MemRead(lpBuffer, DT_UNICODE) + "  " + AkelPad.MemRead(_PtrAdd(lpBuffer, 128), DT_UNICODE);
      nAttr  = AkelPad.MemRead(lpFileInfo, DT_DWORD);

      if (nAttr & 32 /*FILE_ATTRIBUTE_ARCHIVE*/)  sText3 += "A";
      if (nAttr &  2 /*FILE_ATTRIBUTE_HIDDEN*/)   sText3 += "H";
      if (nAttr &  1 /*FILE_ATTRIBUTE_READONLY*/) sText3 += "R";
      if (nAttr &  4 /*FILE_ATTRIBUTE_SYSTEM*/)   sText3 += "S";

      if (aFiles[nItem].lastIndexOf(":") > 2)
        sText4 = sTxtNTFSStream;
    }

    oSys.Call("Kernel32::CloseHandle", hFile);
    AkelPad.MemFree(lpFileInfo);
  }
  else if (nItem === -2)
    sText0 = "\t" + sTxtWait;

  SendMessage(aDlg[IDSTATUS].HWND, 0x040B /*SB_SETTEXTW*/, 0, sText0);
  SendMessage(aDlg[IDSTATUS].HWND, 0x040B /*SB_SETTEXTW*/, 1, sText1);
  SendMessage(aDlg[IDSTATUS].HWND, 0x040B /*SB_SETTEXTW*/, 2, sText2);
  SendMessage(aDlg[IDSTATUS].HWND, 0x040B /*SB_SETTEXTW*/, 3, sText3);
  SendMessage(aDlg[IDSTATUS].HWND, 0x040B /*SB_SETTEXTW*/, 4, sText4);
}

function CurrentDir()
{
  sDir = AkelPad.GetEditFile(0);

  if (sDir)
    sDir = sDir.replace(/\\[^\\]+$/, "");
  else
    sDir = AkelPad.GetAkelDir();

  SetWindowText(aDlg[IDDIRCB].HWND, sDir);
  SendMessage(aDlg[IDDIRCB].HWND, 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(0, -1));
}

function BrowseDirs()
{
  var oRect = {};
  var sSelDir;
  var sCurrentDir = GetWindowText(aDlg[IDDIRCB].HWND).replace(/(^ +)|( +$)/g, "");
  GetWindowPos(aDlg[IDBROWSEB].HWND, oRect);
  sSelDir = BrowseForFolder(hDlg, sTxtChooseDir + sCurrentDir, sCurrentDir, 0, 0, oRect.X, oRect.Y + oRect.H);

  if (sSelDir)
  {
    SetWindowText(aDlg[IDDIRCB].HWND, sSelDir);
    SendMessage(aDlg[IDDIRCB].HWND, 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(0, -1));
  }
}

function Help(nID, bPressF1)
{
  var nString = 0x0000; //MF_STRING
  var nBreak  = 0x0060; //MF_MENUBREAK|MF_MENUBARBREAK
  var nSepar  = 0x0800; //MF_SEPARATOR
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var oRect   = {};
  var aMenu;
  var nCmd;

  GetWindowPos(aDlg[nID].HWND, oRect);

  if ((nID === IDHELP1B) && (! bNameRE))
    aMenu = [
      [nString, "?",   sHlpAnyChar],
      [nString, "*",   sHlpAnyString],
      [nString, '";"', sHlpSemicolQuot],
      [nSepar],
      [nString, ";",   sHlpListSepar],
      [nSepar],
      [nString, ":",   sHlpStreamSepar]];
  else if (nID === IDHELP3B)
    aMenu = [
      [nString, "$$",      sHlpDollar],
      [nString, "$&&",     sHlpEntireStr],
      [nString, "$`",      sHlpPrecedeStr],
      [nString, "$'",      sHlpFollowStr],
      [nString, "$9",      sHlpSubmatch9],
      [nString, "$99",     sHlpSubmatch99],
      [nSepar],
      [nString, "\\\\",    sHlpBackslash],
      [nString, "\\0",     sHlpNULL],
      [nString, "\\f",     sHlpFF],
      [nString, "\\n",     sHlpNL],
      [nString, "\\r",     sHlpCR],
      [nString, "\\t",     sHlpTab],
      [nString, "\\v",     sHlpVTab],
      [nString, "\\xFF",   sHlpCharHex],
      [nString, "\\u00FF", sHlpUniCharHex]];
  else
  {
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
      [nSepar],
      [nString, "^",       sHlpBegin],
      [nString, "$",       sHlpEnd],
      [nString, "\\b",     sHlpWordBoun],
      [nString, "\\B",     sHlpNonWordBoun],
      [nBreak,  "ab|xy",   sHlpAlternative],
      [nString, "[abc]",   sHlpCharSet],
      [nString, "[^abc]",  sHlpNegCharSet],
      [nString, "[a-z]",   sHlpRange],
      [nString, "[^a-z]",  sHlpNegRange],
      [nSepar],
      [nString, "(ab)",    sHlpCapture],
      //if ((nID === IDHELP1B) && bNameRE) this element should be removed
      [nString, "(?:ab)",  sHlpNotCapture],
      [nString, "(?=ab)",  sHlpFollow],
      [nString, "(?!ab)",  sHlpNotFollow],
      [nString, "\\9",     sHlpBackrefer9],
      [nString, "\\99",    sHlpBackrefer99],
      [nSepar],
      [nString, "?",       sHlpZeroOrOne],
      [nString, "*",       sHlpZeroOrMore],
      [nString, "+",       sHlpOneOrMore],
      [nString, "{3}",     sHlpexactly],
      [nString, "{3,}",    sHlpAtLeast],
      [nString, "{3,7}",   sHlpFromTo],
      [nSepar],
      [nString, "\\(",     sHlpSpecChars]];

    if ((nID === IDHELP1B) && bNameRE)
    {
      aMenu.splice(27, 1);
      aMenu.push([nSepar]);
      aMenu.push([nString, ":", sHlpStreamSepar]);
    }
  }

  for (i = 0; i < aMenu.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu, aMenu[i][0], i + 1, aMenu[i][1] + "\t" + aMenu[i][2]);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0188 /*TPM_NONOTIFY|TPM_RETURNCMD|TPM_TOPALIGN|TPM_RIGHTALIGN*/, oRect.X + oRect.W, oRect.Y + oRect.H, 0, hDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  --nID;

  if (nCmd)
  {
    aMenu[nCmd - 1][1] = aMenu[nCmd - 1][1].replace(/&&/g, "&");
    SendMessage(aDlg[nID].HWNDEdit, 177 /*EM_SETSEL*/, aDlg[nID].Sel1, aDlg[nID].Sel2);
    SendMessage(aDlg[nID].HWNDEdit, 194 /*EM_REPLACESEL*/, 1, aMenu[nCmd - 1][1]);
    aDlg[nID].Sel1 += aMenu[nCmd - 1][1].length;
    aDlg[nID].Sel2  = aDlg[nID].Sel1;
  }

  if (nCmd || bPressF1)
    PostMessage(hDlg, 0x8001 /*WM_APP+1*/, aDlg[nID].HWND, 0);
}

function SearchFiles(bReplace)
{
  var aPath;
  var sFile;
  var sStream;
  var rFile;
  var rStream;
  var rContent;
  var sReplaceWith;
  var nMaxLevel;
  var bLevelOK;
  var hFindFile;
  var sFileName;
  var sFullName;
  var nAttr;
  var sFileContent;
  var nCodePage;
  var bBOM;
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
  var nDelta;
  var nTotalFoundResults = 0;
  var nTotalFoundResultsFiles = 0;
  var nCurrentLevel;
  var strContent = "";
  var oIgnoreFile;

  if (! (bInResults && aFiles.length))
  {
    sDir  = GetWindowText(aDlg[IDDIRCB].HWND).replace(/(^ +)|( +$)/g, "");
    sName = GetWindowText(aDlg[IDNAMECB].HWND);

    if (sDir)
      SetWindowText(aDlg[IDDIRCB].HWND, sDir);
    else
      CurrentDir();

    if (! IsDirExists(sDir))
    {
      MessageBox(sDir + "\n\n" + sTxtDirNoExist);
      PostMessage(aDlg[IDDIRCB].HWND, 7 /*WM_SETFOCUS*/, 0, 0);
      return;
    }

    if (sName)
    {
      i = 0;
      n = sName.indexOf(":");

      if (n > -1)
      {
        sFile   = sName.substr(0, n);
        sStream = sName.substr(n + 1);
      }
      else
        sFile = sName;

      if (bNameRE)
      {
        try
        {
          if (sFile)
            rFile = new RegExp(sFile, "i");

          if (sStream)
          {
            i = n + 1;
            n = -1;
            rStream = new RegExp(sStream, "i");
          }
        }
        catch (oError)
        {
          MessageBox(sName + "\n\n" + sTxtErrorRE);
          PostMessage(aDlg[IDNAMECB].HWND, 7 /*WM_SETFOCUS*/, 0, 0);
          PostMessage(aDlg[IDNAMECB].HWNDEdit, 177 /*EM_SETSEL*/, i, n);
          return;
        }
      }
      else
      {
        if (sFile)
          rFile = GetNameRegExp(sFile);

        if (sStream)
          rStream = GetNameRegExp(sStream);
      }
    }
  }

  sContent = GetWindowText(aDlg[IDCONTENTCB].HWND);
  sReplace = GetWindowText(aDlg[IDREPLACECB].HWND);
  strContent = sContent;

  if (bSkipVCSignore)
  {
    oIgnoreFile = GetVCSIgnoreFileFilter();
    if ("excludedPaths" in oIgnoreFile)
    {
      aDirsToSkip = oIgnoreFile.excludedPaths;
      aUnexcludedPathUp = oIgnoreFile.unexcludePaths;
    }
    else
    {
      popupShow("Can't run the search!\n\n" + oIgnoreFile.toString());
      return false;
    }
  }

  if (sContent)
  {
    if (bContentRE)
    {
      try
      {
        if (bMatchWord)
          strContent = "(?=\\b|\\W)"+ sContent +"(?=\\W|\\b)";
        else
          strContent = sContent;

        rContent = new RegExp(strContent, "g" + (bMatchCase ? "" : "i") + (bMultiline ? "m" : ""));
      }
      catch (oError)
      {
        MessageBox(strContent + "\n\n" + sTxtErrorRE + "\n\n" + oError.description);
        PostMessage(aDlg[IDCONTENTCB].HWND, 7 /*WM_SETFOCUS*/, 0, 0);
        PostMessage(aDlg[IDCONTENTCB].HWNDEdit, 177 /*EM_SETSEL*/, 0, -1);
        return;
      }
    }
    else
    {
      try
      {
        if (bMatchWord)
          strContent = "(?=\\b|\\W)"+ sContent.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&") +"(?=\\W|\\b)";
        else
          strContent = sContent.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&");

        rContent = new RegExp(strContent, "g" + (bMatchCase ? "" : "i"));
      }
      catch (oError)
      {
        MessageBox(strContent + "\n\n" + sTxtErrorRE + "\n\n" + oError.description);
        PostMessage(aDlg[IDCONTENTCB].HWND, 7 /*WM_SETFOCUS*/, 0, 0);
        PostMessage(aDlg[IDCONTENTCB].HWNDEdit, 177 /*EM_SETSEL*/, 0, -1);
        return;
      }
    }
  }

  if (bReplace)
  {
    if ((! bContentRE) && (sContent === sReplace))
    {
      popupShow('THE TEXT IS THE SAME', 4, 'NOTHING TO REPLACE!');
      return;
    }

    if (MessageBox(sTxtWantReplace, true))
    {
      if (bContentRE)
        sReplaceWith = sReplace.replace(/(\\+)([^\\]*)/g, ReplaceFunc);
      else
        sReplaceWith = sReplace.replace(/\$/g, "$$$$");
    }
    else
      return;
  }

  bAfterReplace   = bReplace;
  aFilesSel       = [0];
  nFilesFoc       = 0;
  sLastContent    = sContent;
  bLastContentRE  = bContentRE;
  bLastMatchCase  = bMatchCase;
  bLastMultiline  = bMultiline;
  bLastNotContain = bNotContain;
  lpFile          = AkelPad.MemAlloc((260 + 260 + 36) * 2);
  lpDetectFile    = AkelPad.MemAlloc(_X64 ? 24 : 20); //sizeof(DETECTFILEW)

  AkelPad.MemCopy(lpDetectFile, lpFile, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpDetectFile, _X64 ?  8 : 4), 1024, DT_DWORD); //dwBytesToCheck
  AkelPad.MemCopy(_PtrAdd(lpDetectFile, _X64 ? 12 : 8), 0x1D, DT_DWORD); //dwFlags=ADT_NOMESSAGES|ADT_DETECT_BOM|ADT_DETECT_CODEPAGE|ADT_BINARY_ERROR

  SetHeaderLV();
  SendMessage(aDlg[IDFILELV].HWND, 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);
  SendMessage(aDlg[IDFILELV].HWND, 0x101E /*LVM_SETCOLUMNWIDTH*/, 0, -2 /*LVSCW_AUTOSIZE_USEHEADER*/);
  oSys.Call("User32::UpdateWindow", aDlg[IDFILELV].HWND);
  SetTextSB(-2);

  if (bShowLogResuls)
  {
    //AkelPad.Call("Log::Output", 1, "", sDir, "^(.+?)\\((\\d+):(\\d+),(\\d+)\\)", "/FILE=\\1 /GOTOLINE=\\2:\\3:\\4", -2, -2, 24, sLogExt);
    AkelPad.Call("Log::Output", 1, "", sDir, "^(.+?)\\((\\d+):(\\d+)\\)", "/FILE=\\1 /GOTOLINE=\\2:\\3", -2, -2, 24, sLogExt);
    nLogCurrent = 24;
  }

  if (bInResults && aFiles.length)
  {
    aStreams = aFiles.slice(0);
    aFiles   = [];
    bNTFS    = IsSupportStreams(aStreams[0].substr(0, 3));

    for (n = 0; n < aStreams.length; ++n)
    {
      if (IsFileExists(aStreams[n]))
      {
        if (rContent)
        {
          AkelPad.MemCopy(lpFile, aStreams[n], DT_UNICODE);
          nDetectFile = SendMessage(hMainWnd, 1177 /*AKD_DETECTFILEW*/, 0, lpDetectFile);

           if ((nDetectFile === 0 /*EDT_SUCCESS*/) || (nDetectFile === -4 /*EDT_BINARY*/))
           {
             rContent.lastIndex = 0;
             nCodePage    = AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 16 : 12), DT_DWORD);
             bBOM         = AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 20 : 16), DT_DWORD);
             sFileContent = AkelPad.ReadFile(aStreams[n], 0, nCodePage, bBOM);

            if (rContent.test(sFileContent))
            {
              if (! bNotContain)
              {
                if (bReplace)
                {
                  sFileContent = sFileContent.replace(rContent, sReplaceWith);

                  if (AkelPad.WriteFile(aStreams[n], sFileContent, sFileContent.length, nCodePage, bBOM, 0x1 /*WFF_WRITEREADONLY*/) === 0 /*ESD_SUCCESS*/)
                    aFiles.push(aStreams[n]);
                }
                else
                  aFiles.push(aStreams[n]);
              }
            }
            else if (bNotContain)
              aFiles.push(aStreams[n]);
          }
        }
        else
          aFiles.push(aStreams[n]);
      }
    }
  }
  else
  {
    aFiles    = [];
    aPath     = [sDir + ((sDir.slice(-1) !== "\\") ? "\\" : "")];
    nPathLen  = aPath[0].length;
    bNTFS     = IsSupportStreams(/^[a-z]:/i.test(sDir) ? sDir.substr(0, 2) : "");
    nMaxLevel = (nDirLevel < 0) ? Infinity : nDirLevel;
    nMaxSize  = (nMaxFileSize <= 0) ? Infinity : nMaxFileSize;

    for (i = nDelta = 0; i < aPath.length; ++i)
    {
      nCurrentLevel = (aPath[i].match(/\\/g).length - aPath[0].match(/\\/g).length);
      bLevelOK = (nCurrentLevel < nMaxLevel);
      sCurrentRelativeDir = aPath[i].replace(aPath[0], "").slice(0, -1);

      if (bSkipVCSignore)
      {
        if (bSkipVCSignoreN)
        {
          if (FindInArrayExcludeNested(aDirsToSkip, aUnexcludedPathUp, sCurrentRelativeDir, nCurrentLevel) !== -1)
          {
            //AkelPad.MessageBox(0, "NESTED\n\nDir Relative:\n"+ sCurrentRelativeDir +"\n\n"+ 'CONTINUE' +"\n\n"+ aDirsToSkip.join("\n"), WScript.ScriptName, 0);
            continue;
          }

          oIgnoreFile = GetVCSIgnoreFileFilter(sCurrentRelativeDir);
          aDirsToSkip = oIgnoreFile.excludedPaths;
          aUnexcludedPathUp = oIgnoreFile.unexcludePaths;

          //AkelPad.MessageBox(0, "Exclude:\n"+ aDirsToSkip.join("\n") +"\n\nUnexclude:\n"+ aUnexcludedPathUp.join("\n"), WScript.ScriptName, 0);
          //AkelPad.MessageBox(0, sCurrentRelativeDir +"\n\n"+ (FindInArrayDirs(aDirsToSkip, aUnexcludedPathUp, sCurrentRelativeDir + "\\", nCurrentLevel) !== -1) +"\n\n"+ aDirsToSkip.join("\n") + "\n\n" + aUnexcludedPathUp.join("\n"), WScript.ScriptName, 0);
        }
        if (FindInArrayDirs(aDirsToSkip, aUnexcludedPathUp, sCurrentRelativeDir, nCurrentLevel) !== -1)
        {
          //AkelPad.MessageBox(0, "Dir Relative:\n"+ sCurrentRelativeDir +"\n\n"+ 'CONTINUE' +"\n\n"+ aDirsToSkip.join("\n"), WScript.ScriptName, 0);
          continue;
        }
      }

      hFindFile = oSys.Call("Kernel32::FindFirstFile" + _TCHAR, aPath[i] + "*.*", lpBuffer);
      if (hFindFile !== -1) //INVALID_HANDLE_VALUE
      {

        do
        {
          sFileName = AkelPad.MemRead(_PtrAdd(lpBuffer, 44 /*offsetof(WIN32_FIND_DATAW, cFileName)*/), DT_UNICODE);

          if (bSkipVCSignoreF)
          {
            //AkelPad.MessageBox(0, sCurrentRelativeDir +"\n\n"+ (FindInArrayOfFiles(aDirsToSkip, sFileName, sCurrentRelativeDir, nCurrentLevel) !== -1) +"\n\n"+ aDirsToSkip.join("\n"), WScript.ScriptName, 0);
            if (FindInArrayOfFiles(aDirsToSkip, aUnexcludedPathUp, sFileName, sCurrentRelativeDir, nCurrentLevel) !== -1)
            {
              //AkelPad.MessageBox(0, "File Name:\n"+ sFileName +"\n\nDir Relative:\n"+ sCurrentRelativeDir +"\n\n"+ 'CONTINUE' +"\n\n"+ aDirsToSkip.join("\n"), WScript.ScriptName, 0);
              continue;
            }
          }

          sFullName = aPath[i] + sFileName;
          nAttr     = AkelPad.MemRead(lpBuffer, DT_DWORD);

          //files
          if (! (nAttr & 16 /*FILE_ATTRIBUTE_DIRECTORY*/))
          {
            if (((! bSkipReadOnly) || (bSkipReadOnly && (! (nAttr & 1 /*FILE_ATTRIBUTE_READONLY*/)))) &&
                ((! bSkipHidden)   || (bSkipHidden   && (! (nAttr & 2 /*FILE_ATTRIBUTE_HIDDEN*/  )))) &&
                ((! bSkipSystem)   || (bSkipSystem   && (! (nAttr & 4 /*FILE_ATTRIBUTE_SYSTEM*/  )))) &&
                ((! rFile) || ((! bNotName) && rFile.test(sFileName)) || (bNotName && (! rFile.test(sFileName)))))
            {
              if (bInStreams && bNTFS)
              {
                aStreams = EnumStreams(sFullName);

                for (n = 0; n < aStreams.length; ++n)
                {
                  if ((bInFiles && (! aStreams[n][0])) ||
                      (aStreams[n][0] && ((! rStream) || ((! bNotName) && rStream.test(aStreams[n][0])) || (bNotName && (! rStream.test(aStreams[n][0]))))))
                  {
                    sFullName = aPath[i] + sFileName + (aStreams[n][0] ? (":" + aStreams[n][0]) : "");

                    if (rContent)
                    {
                      AkelPad.MemCopy(lpFile, sFullName, DT_UNICODE);
                      nDetectFile = SendMessage(hMainWnd, 1177 /*AKD_DETECTFILEW*/, 0, lpDetectFile);

                      if (((nDetectFile === 0 /*EDT_SUCCESS*/) || ((nDetectFile === -4 /*EDT_BINARY*/) && (! bSkipBinary))) && (aStreams[n][1] <= nMaxSize))
                      {
                        rContent.lastIndex = 0;
                        nCodePage    = AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 16 : 12), DT_DWORD);
                        bBOM         = AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 20 : 16), DT_DWORD);
                        sFileContent = AkelPad.ReadFile(sFullName, 0, nCodePage, bBOM);

                        if (rContent.test(sFileContent))
                        {
                          if (! bNotContain)
                          {
                            if (bReplace)
                            {
                              sFileContent = sFileContent.replace(rContent, sReplaceWith);

                              if (AkelPad.WriteFile(sFullName, sFileContent, sFileContent.length, nCodePage, bBOM, 0x1 /*WFF_WRITEREADONLY*/) === 0 /*ESD_SUCCESS*/)
                                aFiles.push(sFullName);
                            }
                            else
                              aFiles.push(sFullName);
                          }
                        }
                        else if (bNotContain)
                          aFiles.push(sFullName);
                      }
                    }
                    else
                      aFiles.push(sFullName);
                  }
                }
              }
              else if (bInFiles)
              {
                if (rContent)
                {
                  nSizeHi = AkelPad.MemRead(_PtrAdd(lpBuffer, 28 /*offsetof(WIN32_FIND_DATAW, nFileSizeHigh)*/), DT_DWORD);
                  nSizeLo = AkelPad.MemRead(_PtrAdd(lpBuffer, 32 /*offsetof(WIN32_FIND_DATAW, nFileSizeLow)*/),  DT_DWORD);
                  if (nSizeLo < 0)
                    nSizeLo += 0xFFFFFFFF + 1;
                  nSize = nSizeHi * (0xFFFFFFFF + 1) + nSizeLo;

                  AkelPad.MemCopy(lpFile, sFullName, DT_UNICODE);
                  nDetectFile = SendMessage(hMainWnd, 1177 /*AKD_DETECTFILEW*/, 0, lpDetectFile);

                  if (((nDetectFile === 0 /*EDT_SUCCESS*/) || ((nDetectFile === -4 /*EDT_BINARY*/) && (! bSkipBinary))) && (nSize <= nMaxSize))
                  {
                    rContent.lastIndex = 0;
                    nCodePage    = AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 16 : 12), DT_DWORD);
                    bBOM         = AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 20 : 16), DT_DWORD);
                    sFileContent = AkelPad.ReadFile(sFullName, 0, nCodePage, bBOM);

                    if (rContent.test(sFileContent))
                    {
                      if (! bNotContain)
                      {
                        if (bReplace)
                        {
                          sFileContent = sFileContent.replace(rContent, sReplaceWith);
                          if (AkelPad.WriteFile(sFullName, sFileContent, sFileContent.length, nCodePage, bBOM, 0x1 /*WFF_WRITEREADONLY*/) === 0 /*ESD_SUCCESS*/)
                            aFiles.push(sFullName);
                        }
                        else
                        {
                          aFiles.push(sFullName);

                          if (bShowLogResuls)
                          {
                            var nLogResultLen = 300;
                            var nLogResultLenHalf = nLogResultLen / 2;
                            var sRelativeFileName = ((sCurrentRelativeDir)? sCurrentRelativeDir + "\\" : "") + sFileName;
                            var aLines = sFileContent.split("\n");
                            var pLine = "";
                            var aMatches = sFileContent.match(rContent);
                            nTotalFoundResults += aMatches.length;
                            pLine = '\nSearched "'+ sContent +'" - ('+ aMatches.length +') in file '+ sFullName +'';
                            rContent.lastIndex = 0;

                            for (var nLine = 0, nLinesLen = aLines.length; nLine < nLinesLen; ++nLine)
                            {
                              var sCurrentLine = aLines[nLine];
                              var aMatchCurrentLine;
                              var aMatch = rContent.exec(sCurrentLine);
                              if (aMatch !== null)
                              {
                                pLine += "\n" + sRelativeFileName + "(" + (nLine+1) + ":" + (aMatch.index+1) + ") " + sCurrentLine.slice( ((aMatch.index > nLogResultLen)? (aMatch.index - nLogResultLenHalf) : 0), ((aMatch.index > nLogResultLen)? (aMatch.index + nLogResultLenHalf) : nLogResultLen + (rContent.lastIndex - aMatch.index)) ) /* aMatch.input */;
                                while (aMatchCurrentLine = rContent.exec(sCurrentLine))
                                {
                                  pLine += "\n" + sRelativeFileName + "(" + (nLine+1) + ":" + (aMatchCurrentLine.index+1) + ") " + sCurrentLine.slice( ((aMatchCurrentLine.index > nLogResultLen)? (aMatchCurrentLine.index - nLogResultLenHalf) : 0), ((aMatchCurrentLine.index > nLogResultLen)? (aMatchCurrentLine.index + nLogResultLenHalf) : nLogResultLen + (rContent.lastIndex - aMatchCurrentLine.index)) ) /* aMatchCurrentLine.input */;
                                }
                                rContent.lastIndex = 0;
                              }
                            }
                            AkelPad.Call("Log::Output", 4 + _TSTR, pLine + "\n", -1, ((nDelta === 0)? 0 : 1) /*APPEND*/);
                            nDelta++;
                          }
                        }
                      }
                    }
                    else if (bNotContain)
                      aFiles.push(sFullName);
                  }
                }
                else
                  aFiles.push(sFullName);
              }
            }
          }
          //directories
          else if (bLevelOK && (sFileName !== ".") && (sFileName !== ".."))
            aPath.push(sFullName + "\\");
        }
        while (oSys.Call("Kernel32::FindNextFileW", hFindFile, lpBuffer));

        oSys.Call("Kernel32::FindClose", hFindFile);
      }
    }

    SortFiles();

    if (bShowLogResuls)
      AkelPad.Call("Log::Output", 4 + _TSTR, "\nSearch ^ Total Found: "+ nTotalFoundResults +" in "+ aFiles.length +" files\n\n", -1, 1 /*APPEND*/);
  }

  aDirsToSkip = [];
  aUnexcludedPathUp = [];
  aExcludedDirsCollection = [];
  aUnexcludedDirsCollection = [];

  AkelPad.MemFree(lpFile);
  AkelPad.MemFree(lpDetectFile);

  FillLV();
  AddToHistory();
  EnableButtons();
  PostMessage(hDlg, 0x8001 /*WM_APP+1*/, aDlg[IDFILELV].HWND, 0);

  return true;
}

function GetNameRegExp(sName)
{
  if (! sName)
    sName += "*";
  else if (! ~sName.indexOf("*"))
  {
    // TODO: sort results by the extensions list order
    var sNameExt = AkelPad.GetFilePath(AkelPad.GetEditFile(0), 4);
    sName += "*"+ sNameExt +";"+ sName +".*;"+ sName +"*";
  }

  var sPattern = sName
        .replace(/"([^"]*)"/g, function() {return arguments[1].replace(/;/g, "\0");})
        .replace(/[\\\/.^$+|()\[\]{}]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".")
        .replace(/;{2,}/g, ";")
        .replace(/(^;)|(;$)/g, "")
        .replace(/;/g, "|")
        .replace(/\0/g, ";");

  return new RegExp("^(" + sPattern + ")$", "i");
}

function ReplaceFunc(s0, s1, s2)
{
  if (s1.length % 2)
  {
    switch (s2.charAt(0))
    {
      case "0":
        s2 = "\0" + s2.substr(1);
        break;
      case "f":
        s2 = "\f" + s2.substr(1);
        break;
      case "n":
        s2 = "\n" + s2.substr(1);
        break;
      case "r":
        s2 = "\r" + s2.substr(1);
        break;
      case "t":
        s2 = "\t" + s2.substr(1);
        break;
      case "v":
        s2 = "\x0B" + s2.substr(1);
        break;
      default:
        if (/^x[\dA-Fa-f]{2}/.test(s2))
          s2 = String.fromCharCode(parseInt(s2.substr(1, 2), 16)) + s2.substr(3);
        else if (/^u[\dA-Fa-f]{4}/.test(s2))
          s2 = String.fromCharCode(parseInt(s2.substr(1, 4), 16)) + s2.substr(5);
    }
  }

  return s1.substr(0, s1.length / 2) + s2;
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

function AddToHistory()
{
  var aCB = [{HWND: aDlg[IDDIRCB].HWND,     Arr: aDirs,     Txt: sDir,     IgnoreCase: 1},
             {HWND: aDlg[IDNAMECB].HWND,    Arr: aNames,    Txt: sName,    IgnoreCase: 1},
             {HWND: aDlg[IDCONTENTCB].HWND, Arr: aContents, Txt: sContent, IgnoreCase: 0},
             {HWND: aDlg[IDREPLACECB].HWND, Arr: aReplace,  Txt: sReplace, IgnoreCase: 0}];
  var i, n;

  for (i = 0; i < aCB.length; ++i)
  {
    if (aCB[i].Txt)
    {
      n = FindInArray(aCB[i].Arr, aCB[i].Txt, aCB[i].IgnoreCase);

      if (n >= 0)
      {
        aCB[i].Arr.splice(n, 1);
        SendMessage(aCB[i].HWND, 0x0144 /*CB_DELETESTRING*/, n, 0);
      }

      aCB[i].Arr.unshift(aCB[i].Txt);
      SendMessage(aCB[i].HWND, 0x014A /*CB_INSERTSTRING*/, 0, aCB[i].Txt);

      if (aCB[i].Arr.length > nHistMax)
      {
        aCB[i].Arr.length = nHistMax;
        SendMessage(aCB[i].HWND, 0x0144 /*CB_DELETESTRING*/, nHistMax, 0);
      }

      SendMessage(aCB[i].HWND, 0x014E /*CB_SETCURSEL*/, 0, 0);
    }
  }

  for (n = 0; n < aHist.length; ++n)
  {
    if ((aHist[n].bSortDesc === bSortDesc) &&
        (aHist[n].nDirLevel === nDirLevel) &&
        (aHist[n].bNameRE === bNameRE) &&
        (aHist[n].bNotName === bNotName) &&
        (aHist[n].bInFiles === bInFiles) &&
        (aHist[n].bInStreams === bInStreams) &&
        (aHist[n].bSkipReadOnly === bSkipReadOnly) &&
        (aHist[n].bSkipHidden === bSkipHidden) &&
        (aHist[n].bSkipSystem === bSkipSystem) &&
        (aHist[n].bSkipVCSignore === bSkipVCSignore) &&
        (aHist[n].bSkipVCSignoreN === bSkipVCSignoreN) &&
        (aHist[n].bSkipVCSignoreF === bSkipVCSignoreF) &&
        (aHist[n].bInResults === bInResults) &&
        (aHist[n].bMatchCase === bMatchCase) &&
        (aHist[n].bContentRE === bContentRE) &&
        (aHist[n].bMultiline === bMultiline) &&
        (aHist[n].bNotContain === bNotContain) &&
        (aHist[n].bSkipBinary === bSkipBinary) &&
        (aHist[n].bSkipLarger === bSkipLarger) &&
        (aHist[n].nMaxFileSize === nMaxFileSize) &&
        (aHist[n].sDir.toUpperCase() === sDir.toUpperCase()) &&
        (aHist[n].sName.toUpperCase() === sName.toUpperCase()) &&
        (aHist[n].sContent === sContent) &&
        (aHist[n].sReplace === sReplace) &&
        (aHist[n].bAfterReplace === bAfterReplace))
    {
      aHist.splice(n, 1);
      break;
    }
  }

  aHist.unshift({
    nPathLen: nPathLen,
    bSortDesc: bSortDesc,
    nDirLevel: nDirLevel,
    bNameRE: bNameRE,
    bNotName: bNotName,
    bInFiles: bInFiles,
    bInStreams: bInStreams,
    bSkipReadOnly: bSkipReadOnly,
    bSkipHidden: bSkipHidden,
    bSkipSystem: bSkipSystem,
    bSkipVCSignore: bSkipVCSignore,
    bSkipVCSignoreN: bSkipVCSignoreN,
    bSkipVCSignoreF: bSkipVCSignoreF,
    bInResults: bInResults,
    bMatchCase: bMatchCase,
    bContentRE: bContentRE,
    bMultiline: bMultiline,
    bNotContain: bNotContain,
    bSkipBinary: bSkipBinary,
    bSkipLarger: bSkipLarger,
    nMaxFileSize: nMaxFileSize,
    sDir: sDir,
    sName: sName,
    sContent: sContent,
    sReplace: sReplace,
    bAfterReplace: bAfterReplace,
    aFiles: aFiles.slice(0)});

  if (aHist.length > nHistMax)
    aHist.length = nHistMax;
}


/**
 * Read VCS File to exclude directories from the search result.
 * @TODO implement configs for filenames of ignore files
 *
 * @param string - current directory
 * @return object that should have array of excluded paths and array to unexclude paths
 */
function GetVCSIgnoreFileFilter(sCurrentDir)
{
  var sBaseDir = sDir || GetWindowText(aDlg[IDDIRCB].HWND) || AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1),
      sCurrentDirLevel = (sCurrentDir ? sCurrentDir +"\\" : ""),
      aIgnoreFileConfs = aVCSIgnoreFileConfs.slice(0) || [],
      aExcludedDirs = aVCSExcludedPaths.slice(0) || [],
      aExcludedDirsRaw = [],
      aUnexcludedDirs = aVCSUnexcludedPaths.slice(0) || [],
      sFileContent = "",
      sTmp = ""
  ;

  oIgnoreFile = new Object();     // attempts to support the older ES standard
  oIgnoreFile.excludedPaths = [];
  oIgnoreFile.unexcludePaths = [];

  for (var i = 0; i < aIgnoreFileConfs.length; i++)
    if (aIgnoreFileConfs[i])
      sFileContent += getVCSIgnoreFileContents(sBaseDir + "\\" + sCurrentDirLevel + aIgnoreFileConfs[i]);

  aExcludedDirsRaw = sFileContent.replace(/^\s+|\s+$/g, "").split("\n");

  for (var i = 0, nLen = aExcludedDirsRaw.length; i < nLen; i++)
  {
    var sExcDir = aExcludedDirsRaw[i].replace(/^\s+|\s+$/g, "");
    if (sExcDir && sExcDir.substr(0, 1) !== "#")
    {
      if (sExcDir.substr(0, 1) === "\\")
      {
        function replaceEscapedSymbol(x)
        {
          if (/^\\\W/gi.test(x))
            return "\[\\\\"+ x +"\]";
          return x;
        }
        sExcDir = sExcDir.replace(/^\\\\(.)/, replaceEscapedSymbol).replace(/\//g, "\\");
        aExcludedDirsCollection.push((sDir +"#"+ sExcDir).toUpperCase());
      }
      else if (sExcDir.substr(0, 1) === "!")
      {
        var sUnexcludedPathSlashesUp = sExcDir.slice(1).replace(/\//g, "\\");
        aExcludedDirsCollection.push(sUnexcludedPathSlashesUp);

        if ((~sExcDir.indexOf("*.")) && (~sExcDir.indexOf("/")))
          aUnexcludedDirsCollection.push((sDir +"#"+ sUnexcludedPathSlashesUp).toUpperCase());
        else if ((! ~sExcDir.indexOf("*.")) && (~sExcDir.indexOf("/")))
        {
          aUnexcludedDirsCollection.push((sDir +"#"+ sUnexcludedPathSlashesUp + ((sExcDir.slice(-1) === "\\")? "" : "\\")).toUpperCase());
          aUnexcludedDirsCollection.push((sDir +"#"+ sUnexcludedPathSlashesUp + "\\*").toUpperCase());
        }
        else if (~sExcDir.indexOf("*."))
          aUnexcludedDirsCollection.push((sDir +"#"+ sCurrentDirLevel + sUnexcludedPathSlashesUp).toUpperCase());
        else
          aUnexcludedDirsCollection.push((sDir +"#"+ sCurrentDirLevel + sUnexcludedPathSlashesUp).toUpperCase());
      }

      else if (sExcDir.slice(-1) === "/" && (~sExcDir.indexOf("/", 2)))
        aExcludedDirsCollection.push(sDir +"#"+ sExcDir.replace(/\//g, "\\"));
      else if (sExcDir.substr(0, 1) === "/" && (~sExcDir.indexOf("*.")))
        aExcludedDirsCollection.push(sDir +"\\"+ sCurrentDirLevel + sExcDir.slice(1).replace(/\//g, "\\"));
      else if (sExcDir.substr(0, 1) === "/")
        aExcludedDirsCollection.push(sDir +"\\"+ sCurrentDirLevel + sExcDir.slice(1).replace(/\//g, "\\") + ((sExcDir.slice(-1) === "*")? "" : "\\"));
      else
      {
        aExcludedDirsCollection.push(sDir +"#"+ sExcDir.replace(/\//g, "\\"));
        aUnexcludedDirsCollection.push((sDir +"#"+ ".gitattributes").toUpperCase());
      }
    }
  }

  //AkelPad.MessageBox(0, "aExcludedDirsCollection:\n"+ aExcludedDirsCollection.join("\n") +"\n\naUnexcludedDirsCollection:\n"+ aUnexcludedDirsCollection.join("\n"), WScript.ScriptName, 0);
  oIgnoreFile.excludedPaths = ArrayUnique(aExcludedDirsCollection.concat(aExcludedDirs).sort());
  oIgnoreFile.unexcludePaths = ArrayUnique(aUnexcludedDirsCollection.concat(aUnexcludedDirs).sort());
  return oIgnoreFile;
}

/**
 * Checks if folder exists.
 *
 * @param string sFolder to check
 * @return bool if directory exists
 */
function isDirExists(sFolder)
{
  var result = false;

  if (! fso)
    fso = new ActiveXObject("Scripting.FileSystemObject");

  if (result = fso.FolderExists(sFolder))
    return result;
  return result;
}

/**
 * Make the passed array unique, to have unique values in it.
 *
 * @param array
 * @return array unique
 */
function ArrayUnique(array)
{
  var a = array.concat();
  for (var i = 0; i < a.length; ++i)
    for (var j = i + 1; j < a.length; ++j)
      if (a[i] === a[j])
        a.splice(j--, 1);

  return a;
}

/**
 * @return string of file content
 */
function getVCSIgnoreFileContents(sFileName)
{
  var sFileContent = "",
      oError = {};

  if (IsFileExists(sFileName))
  {
    try
    {
      sFileContent = "\n" + AkelPad.ReadFile(sFileName);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, sFileName + '\n\nError: ' + oError.description, sScriptName, 0);
    }
  }
  return sFileContent;
}

function FindInArray(aArray, sText, bIgnoreCase)
{
  for (var i = 0; i < aArray.length; ++i)
  {
    if (bIgnoreCase && (aArray[i].toUpperCase() === sText.toUpperCase()) || (aArray[i] === sText))
      return i;
  }
  return -1;
}

/**
 * Filter nested VCS.
 *
 * @param array aDirsToSkip
 * @param array aUnexcludedPathUp
 * @param sNeedle sCurrentRelativeDir
 * @return number index if found
 */
function FindInArrayExcludeNested(aDirsToSkip, aUnexcludedPathUp, sNeedle, nLevel)
{
  if (! sNeedle || (sNeedle === "." || sNeedle === ".."))
    return -1;

  var aDirs = aDirsToSkip || [],
      aUnDirs = aUnexcludedPathUp || [],
      nDirLevel = nLevel || 0,
      sNeedleUp = sNeedle.toUpperCase(),
      sDirUp = sDir.toUpperCase(),
      sNeedleUpDirUpFull = sDirUp +"\\"+ sNeedleUp +"\\",
      rDir, sPattern = ""

  try
  {
    for (var i = 0, a, aUp, aLen = aDirs.length; i < aLen; ++i)
    {
      a = aDirs[i];
      aUp = a.toUpperCase();

      if (bSkipVCSignoreN)
      {
        //AkelPad.MessageBox(0, aUp + "\n\n" + aUnDirs.join("\n"), WScript.ScriptName, 0);
        for (var j = 0, aUnLen = aUnDirs.length; j < aUnLen; ++j)
        {
          var sPatternUnex = aUnDirs[j]
            .replace(/\\\\/g, "\\")
            .replace(/\\/g, "\\\\")
            .replace(/\./g, "\\.")
            .replace(/\?/g, ".")
            .replace(/\[\!/g, "[^")
            .replace(/\*\*\\\\/g, "#")
            .replace(/\#/g, "(\\\\)?*")
            .replace(/\*/g, "(.*)?")
            .concat("(\\\\)?$")
          ;
          var rDirUnex = new RegExp(sPatternUnex, "gi");
          if (rDirUnex.test(sNeedleUpDirUpFull) && aUnDirs[j].slice(-2) !== "\\*" && isDirExists(sNeedleUpDirUpFull))
          {
            //AkelPad.MessageBox(0, "Nest Dir Match Unexclude:\n\n" + aUp +"\n\sPatternUnex\n"+ sPatternUnex +"\n\nsNeedleUp: "+ sNeedleUp +"\n\nMatch: "+ (rDirUnex.test(sNeedleUp) || rDirUnex.test(sNeedleUpDirUpFull)) +"\n\nsNeedleUpDirUpFull:\n"+ sNeedleUpDirUpFull, sScriptName, 48);
            return -1;
          }
        }
      }

      if (aUp === sNeedleUpDirUpFull || aUp === sNeedleUpDirUpFull +"\\")
      {
        //AkelPad.MessageBox(0, aUp +"\n\nEnding: "+ (aUp.slice(-2)) + "\n\n" + sNeedleUpDirUpFull, sScriptName, 0);
        return i;
      }

      sPattern = aUp
        .replace(/\\\\/g, "\\")
        .replace(/\\/g, "\\\\")
        .replace(/\./g, "\\.")
        .replace(/\?/g, ".")
        .replace(/\[\!/g, "[^")
        .replace(/\*\*\\\\/g, "#")
        .replace(/\#/g, "(\\\\)?*")
        .replace(/\*/g, "(.*)?")
        .concat("(\\\\)?$")
      ;
      rDir = new RegExp(sPattern, "gi");
      if ((rDir.test(sNeedleUp) || (rDir.test(sNeedleUpDirUpFull) && isDirExists(sNeedleUpDirUpFull))) && aUp.slice(-2) !== "\\*" )
      {
        //AkelPad.MessageBox(0, "Nested Match:" + "\n\n" + aUp +"\n\n"+ sPattern +"\n\nsNeedleUp: "+ sNeedleUp +"\n\nMatch: "+ (rDir.test(sNeedleUp) || rDir.test(sNeedleUpDirUpFull)) +"\n\n"+ sNeedleUpDirUpFull, sScriptName, 48);
        return i;
      }
    }
  }
  catch (oError)
  {
    //AkelPad.MessageBox(0, "Nested Match Error:\n\n" + oError.name +"\n\n"+ oError.description +"\n\n"+ aUp +"\n\n"+ sPattern +"\n\n"+ sNeedleUp +"\n\n"+ sNeedleUpDirUpFull, sScriptName, 48);
  }
  return -1;
}

/**
 * Exclude directories.
 *
 * @param array aDirsToSkip
 * @param array aUnexcludedPathUp
 * @param sNeedle
 * @param nLevel
 * @return number found index
 */
function FindInArrayDirs(aDirsToSkip, aUnexcludedPathUp, sNeedle, nLevel)
{
  if ((! sNeedle) || (sNeedle === "." || sNeedle === ".."))
    return -1;

  var aDirs = aDirsToSkip || [],
      aUnDirs = aUnexcludedPathUp || [],
      nDirLevel = nLevel || 0,
      sNeedleUp = (sNeedle +"\\").toUpperCase(),
      sDirUp = sDir.toUpperCase(),
      sNeedleUpDirUpFull = sDirUp +"\\"+ sNeedleUp,
      oError

  try
  {
    for (var i = 0, a, aUp, aLen = aDirs.length; i < aLen; ++i)
    {
      a = aDirs[i];
      aUp = a.toUpperCase();

      //AkelPad.MessageBox(0, aUp, WScript.ScriptName, 0);
      if (bSkipVCSignoreN)
      {
        //AkelPad.MessageBox(0, aUp + "\n\n" + aDirs.join("\n") + "\n\n" + aUnDirs.join("\n"), WScript.ScriptName, 0);
        for (var j = 0, aUnLen = aUnDirs.length; j < aUnLen; ++j)
        {
          var sPatternUnex = aUnDirs[j]
            .replace(/\\\\/g, "\\")
            .replace(/\\/g, "\\\\")
            .replace(/\./g, "\\.")
            .replace(/\?/g, ".")
            .replace(/\[\!/g, "[^")
            .replace(/\*\*\\\\/g, "#")
            .replace(/\#/g, "(\\\\)?*")
            .replace(/\*/g, "(.*)?")
            .concat("(\\\\)?$")
          ;
          var rDirUnex = new RegExp(sPatternUnex, "gi");
          if (rDirUnex.test(sNeedleUpDirUpFull) && aUnDirs[j].slice(-2) !== "\\*" && isDirExists(sNeedleUpDirUpFull))
          {
            //AkelPad.MessageBox(0, "Dir Match Unexclude:\n\n"+ aUp +"\n\n\sPatternUnex:\n"+ sPatternUnex +"\n\nMatch: "+ (rDirUnex.test(sNeedleUp)||rDirUnex.test(sNeedleUpDirUpFull)) +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nsNeedleUpDirUpFull:\n"+ sNeedleUpDirUpFull +"\n\nisDirExists:\n"+ isDirExists(sNeedleUpDirUpFull) +"\n\naUnexcludedPathUp:\n"+ aUnDirs.join("\n"), sScriptName, 48);
            return -1;
          }
        } // end for unexcluded loop
      }

      if ((aUp === sNeedleUp) || (aUp === sNeedleUpDirUpFull))
      {
        //AkelPad.MessageBox(0, aUp +"\n\nEnding: "+ (aUp.slice(-2)) +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nsNeedleUpDirUpFull:\n"+ sNeedleUpDirUpFull, sScriptName, 0);
        return i;
      }

      var sPattern = aUp
        .replace(/\\\\/g, "\\")
        .replace(/\\/g, "\\\\")
        .replace(/\./g, "\\.")
        .replace(/\?/g, ".")
        .replace(/\[\!/g, "[^")
        .replace(/\*\*\\\\/g, "#")
        .replace(/\#/g, "(\\\\)?*")
        .replace(/\*/g, "(.*)?")
        .concat("(\\\\)?$")
      ;
      if (sPattern)
      {
        var rDir = new RegExp(sPattern, "gi");
        if ((rDir.test(sNeedleUp) || (rDir.test(sNeedleUpDirUpFull) && isDirExists(sNeedleUpDirUpFull))) && aUp.slice(-2) !== "\\*")
        {
          //AkelPad.MessageBox(0, "Dir Match:\n\n" + aUp +"\n\nsPattern:\n"+ sPattern +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nMatch: "+ (rDir.test(sNeedleUp) || rDir.test(sNeedleUpDirUpFull)) +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nsNeedleUpDirUpFull:\n"+ sNeedleUpDirUpFull, sScriptName, 48);
          return i;
        }
      }
    } // end for loop
  }
  catch (oError)
  {
    //AkelPad.MessageBox(0, "Directory Match Error:\n\n"+ oError.name +"\n\n"+ oError.description +"\n\naDirsToSkip item:\n"+ aUp +"\n\nsPattern:\n"+ sPattern +"\n\nsNeedleUp"+ sNeedleUp +"\n\nsNeedleUpDirUpFull"+ sNeedleUpDirUpFull , sScriptName, 48);
  }
  return -1;
}

/**
 * @param array aDirsToSkip
 * @param array aUnexcludedPathUp
 * @param sNeedle sFileName
 * @param sCurrentDir
 * @param nLevel
 * @return number index
 */
function FindInArrayOfFiles(aDirsToSkip, aUnexcludedPathUp, sNeedle, sCurrentDir, nLevel)
{
  if ((! sNeedle) || (sNeedle === "." || sNeedle === ".."))
    return -1;

  var aDirs = aDirsToSkip || [],
      aUnDirs = aUnexcludedPathUp || [],
      nDirLevel = nLevel || 0,
      sNeedleUp = sNeedle.toUpperCase(),
      sCurrDirUp = sCurrentDir.toUpperCase(),
      sDirUp = sDir.toUpperCase(),
      sDirFullUp = sDir.toUpperCase() + "\\" + sCurrDirUp,
      sNeedleFullPathUp = sDirFullUp + "\\" + sNeedleUp,
      rFile, sPattern = "",
      oError

  var sNeedleFName     = getFileName(sNeedleFullPathUp);
  //var sNeedleFNameOnly = getFileNameOnly(sNeedleFullPathUp),
  //  sNeedleFNameExt  = AkelPad.GetFilePath(sNeedleFullPathUp, 4);
  //AkelPad.MessageBox(0, sNeedleFName + "\n" + sNeedleFNameOnly + "\n" + sNeedleFNameExt + "\n", WScript.ScriptName, 0);

  try
  {
    for (var i = 0, a, aUp, aLen = aDirs.length; i < aLen; ++i)
    {
      a = aDirs[i];
      aUp = a.toUpperCase();

      if (bSkipVCSignoreN)
      {
        unexcludeLoop: for (var j = 0, aUnLen = aUnDirs.length; j < aUnLen; ++j)
        {
          var sUnDirsItem = aUnDirs[j].toUpperCase();
          var sPatternUnex = sUnDirsItem
            .replace(/\\\\/g, "\\")
            .replace(/\\/g, "\\\\")
            .replace(/\./g, "\\.")
            .replace(/\?/g, ".")
            .replace(/\[\!/g, "[^")
            .replace(/\*\*\\\\/g, "#")
            .replace(/\#/g, "(\\\\)?*")
            .replace(/\*/g, "(.*)")
            .concat("(\\\\)?$")
          ;
          var rFileUnex = new RegExp(sPatternUnex, "gi");
          //AkelPad.MessageBox(0, (sDirUp +"#"+ aUp.slice(1)).toUpperCase() +"\n\n"+ aUnDirs[j] /* sUnDirsItem */ /* +"\n\n"+ (~((sDirUp + "#" + aUp.slice(1)).toUpperCase()).indexOf(sUnDirsItem)) +"\n\n"+ (~(sUnDirsItem).indexOf((sDirUp + "#" + aUp.slice(1)).toUpperCase())) */, sScriptName, 48);
          if (rFileUnex.test(sNeedleFullPathUp) && (! isDirExists(sNeedleFullPathUp)))
          {
            //AkelPad.MessageBox(0, "File Match UNEXCLUDE:\n\n"+ aUp +"\n\nsPatternUnex:\n"+ sPatternUnex +"\n\nMatch:"+ (rFileUnex.test(sNeedleFullPathUp)) +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nsNeedleFullPathUp:\n"+ sNeedleFullPathUp +"\n\n"+ aUnDirs.join("\n"), sScriptName, 48);

            /** @TODO: unexclude excluded precission */
            if (sUnDirsItem.slice(-2) === "\\*"
              //&& !~((sDirUp + "#" + aUp.slice(1)).toUpperCase()).indexOf(sUnDirsItem.slice(0, -2))
            )
            {
              for (var k = 0, nExcPathsLen = aDirs.length, aDirsItem; k < nExcPathsLen; k++)
              {
                aDirsItem = aDirs[k].replace(/\#/g, "\\").replace(/\\\\/g, "\\").toUpperCase();
                sUnDirsItemPath = sUnDirsItem.replace(/\#/g, "\\");

                if ( (~aDirsItem.indexOf(sUnDirsItemPath.slice(0, -2))
                  && !(sUnDirsItemPath.slice(0, -2) !== aDirsItem.slice(0, -2)) )
                  //&& (getParent(sUnDirsItemPath)).length < getParent(aDirsItem).length
                )
                {
                  //AkelPad.MessageBox(0, "aDirsItem:\n"+ aDirsItem + "\n\nsNeedleFullPathUp:\n" + sNeedleFullPathUp + "\n\nsUnDirsItemPath:\n" + sUnDirsItemPath +"\n\n"+ getParent(sUnDirsItemPath) +"\n\n"+ getParent(sNeedleFullPathUp), WScript.ScriptName, 0);
                  continue unexcludeLoop;
                }
              }
            }

            return -1;
          }
        }
      }

      if ((aUp === sNeedleUp) || (aUp === sNeedleFullPathUp))
      {
        //AkelPad.MessageBox(0, aUp +"\n\nEnding: "+ (aUp.slice(-2)) +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nsNeedleFullPathUp:\n"+ sNeedleFullPathUp, sScriptName, 0);
        return i;
      }

      // sNeedleFName = AkelPad.GetFilePath(aUp, 2);
      // sNeedleFNameOnly = AkelPad.GetFilePath(aUp, 3);
      // sNeedleFNameExt = AkelPad.GetFilePath(aUp, 4);
      //AkelPad.MessageBox(0, sNeedleFName +"\n\n"+ sNeedleFNameOnly +"\n\n"+ sNeedleFNameExt, WScript.ScriptName, 0);

      sPattern = aUp
        .replace(/\\\\/g, "\\")
        .replace(/\\/g, "\\\\")
        .replace(/\./g, "\\.")
        .replace(/\?/g, ".")
        .replace(/\[\!/g, "[^")
        .replace(/\*\*\\\\/g, "#")
        .replace(/\#/g, "(\\\\)?*")
        .replace(/\*/g, "(.*)?")
        .concat("(\\\\)?$")
      ;
      rFile = new RegExp(sPattern, "gi");
      if (rFile.test(sNeedleUp) || (rFile.test(sNeedleFullPathUp) && (! isDirExists(sNeedleFullPathUp))))
      {
        //AkelPad.MessageBox(0, "File Match:\n\n"+ aUp +"\n\n"+ sPattern +"\n\nMatch:\n"+ (rFile.test(sNeedleUp) || rFile.test(sNeedleFullPathUp)) +"\n\nsNeedleUp:\n"+ sNeedleUp +"\n\nsNeedleFullPathUp:\n"+ sNeedleFullPathUp, sScriptName, 48);
        return i;
      }
    }
  }
  catch (oError)
  {
    //AkelPad.MessageBox(0, "File Match Error:\n\n" + oError.name + "\n\n" + oError.description + "\n\n" + aUp + "\n\n" + sPattern + "\n\n" + sNeedleUp, sScriptName, 48);
  }
  return -1;
}

/**
 * Get the file name.
 *
 * @param string
 * @return string
 */
function getFileName(pFile)
{
  return pFile.slice(pFile.lastIndexOf(pSlash) + 1);
}

/**
 * Возвращает имя файла БЕЗ расширения.
 *
 * @param string pFile
 * @return string pFileName
 */
function getFileNameOnly(pFile)
{
  var pFileName = getFileName(pFile);
  var pos = pFileName.lastIndexOf(".");
  if (pos !== -1)
    pFileName = pFileName.slice(0, pos);
  return pFileName;
}

/**
 * Возвращает полное имя папки БЕЗ закрывающего \
 *
 * @param string pFile
 * @return string pDir
 */
function getParent(pFile)
{
  var pDir = "";
  var pozLastSep = pFile.lastIndexOf(pSlash);
  if (pozLastSep !== -1)
    pDir = pFile.slice(0, pozLastSep);
  return pDir;
}

/**
 * Remove inadmissible symbols (from wisgest).
 *
 * @param string pFileNameOnly
 * @return string pFileNameOnly sanitized
 */
function correctFileName(pFileNameOnly)
{
  pFileNameOnly = pFileNameOnly.replace(/\t/g, " ");        // валим табуляции, т.к. диалог с ними иногда просто не отображается
  pFileNameOnly = pFileNameOnly.replace(/  /g, " ");        // убираем повторяющиеся пробелы
  return (pFileNameOnly.replace(/[\\\/:\*\?"{}<>\|]/g, ""));
}

/**
 * Sanitize the given full path.
 *
 * @param string pFile
 * @return string
 */
function correctFileNameFull(pFile)
{
  pFileNameOnly = getFileName(pFile);
  pFileNameOnly = correctFileName(pFileNameOnly);
  return getParent(pFile) + pSlash + pFileNameOnly;
}

function MAKELONG(a, b)
{
  return (a & 0xffff) | ((b & 0xffff) << 16);
}

function History()
{
  var oRect = {};
  var hWndLB;
  var nX, nY, nW, nH;

  GetSelArrayLV();

  aHist.unshift({
    nPathLen: nPathLen,
    bSortDesc: bSortDesc,
    nDirLevel: nDirLevel,
    bNameRE: bNameRE,
    bNotName: bNotName,
    bInFiles: bInFiles,
    bInStreams: bInStreams,
    bSkipReadOnly: bSkipReadOnly,
    bSkipHidden: bSkipHidden,
    bSkipSystem: bSkipSystem,
    bSkipVCSignore: bSkipVCSignore,
    bSkipVCSignoreN: bSkipVCSignoreN,
    bSkipVCSignoreF: bSkipVCSignoreF,
    bInResults: bInResults,
    bMatchCase: bMatchCase,
    bContentRE: bContentRE,
    bMultiline: bMultiline,
    bNotContain: bNotContain,
    bSkipBinary: bSkipBinary,
    bSkipLarger: bSkipLarger,
    nMaxFileSize: nMaxFileSize,
    sDir: GetWindowText(aDlg[IDDIRCB].HWND),
    sName: GetWindowText(aDlg[IDNAMECB].HWND),
    sContent: GetWindowText(aDlg[IDCONTENTCB].HWND),
    sReplace: GetWindowText(aDlg[IDREPLACECB].HWND),
    bAfterReplace: bAfterReplace,
    aFiles: aFiles.slice(0),
    aFilesSel: aFilesSel.slice(0),
    nFilesFoc: GetCurFocLV(),
    sLastContent: sLastContent,
    bLastContentRE: bLastContentRE,
    bLastMatchCase: bLastMatchCase,
    bLastMultiline: bLastMultiline,
    bLastNotContain: bLastNotContain});

  GetWindowPos(aDlg[IDHISTORYB].HWND, oRect);
  nX = oRect.X - Scale.X(40);
  nY = oRect.Y + oRect.H;
  nW = oRect.X - nX + oRect.W;
  nH = SendMessage(aDlg[IDNAMECB].HWNDList, 0x1A1 /*LB_GETITEMHEIGHT*/, 0, 0) * aHist.length + oSys.Call("User32::GetSystemMetrics", 6 /*SM_CYBORDER*/) * 2;

  oSys.Call("User32::CreateWindowExW",
    0,             //dwExStyle
    sClass,        //lpClassName
    0,             //lpWindowName
    0x90000000,    //dwStyle=WS_POPUP|WS_VISIBLE
    nX,            //x
    nY,            //y
    nW,            //nWidth
    nH,            //nHeight
    hDlg,          //hWndParent
    0,             //hMenu
    hInstDLL,      //hInstance
    HistCallback); //Script function callback. To use it class must be registered by WindowRegisterClass.

  nHistTime  = new Date().getTime();

  function HistCallback(hWnd, uMsg, wParam, lParam)
  {
    var nID, nCode, i;

    if (uMsg === 1 /*WM_CREATE*/)
    {
      hWndLB = oSys.Call("User32::CreateWindowExW",
        0,          //dwExStyle
        "LISTBOX",  //lpClassName
        0,          //lpWindowName
        0x50800181, //dwStyle=WS_CHILD|WS_VISIBLE|WS_BORDER|LBS_NOINTEGRALHEIGHT|LBS_USETABSTOPS|LBS_NOTIFY
        0,          //x
        0,          //y
        nW,         //nWidth
        nH,         //nHeight
        hWnd,       //hWndParent
        3000,       //ID
        hInstDLL,   //hInstance
        0);         //lpParam
      SendMessage(hWndLB, 48 /*WM_SETFONT*/, hGuiFont, 1);

      AkelPad.MemCopy(lpBuffer, 15, DT_DWORD);
      SendMessage(hWndLB, 0x0192 /*LB_SETTABSTOPS*/, 1, lpBuffer);
      SendMessage(hWndLB, 0x0180 /*LB_ADDSTRING*/, 0, "0");

      for (i = 1; i < aHist.length; ++i)
        SendMessage(hWndLB, 0x0180 /*LB_ADDSTRING*/, 0, i.toString() + "\t" + (aHist[i].bAfterReplace ? sTxtReplace : sTxtSearch).replace("&", "").charAt(0) + ": " + aHist[i].sContent);
      SendMessage(hWndLB, 0x0186 /*LB_SETCURSEL*/, 0, 0);
    }

    else if (uMsg === 7 /*WM_SETFOCUS*/)
      oSys.Call("User32::SetFocus", hWndLB);

    else if (uMsg === 256 /*WM_KEYDOWN*/)
    {
      if (wParam === 13 /*VK_RETURN*/)
        PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
    }

    else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
    {
      if ((! Ctrl()) && (! Shift()) && (wParam === 0x2E /*VK_DELETE*/))
      {
        i = SendMessage(hWndLB, 0x0188 /*LB_GETCURSEL*/, 0, 0);
        if (i > 0)
        {
          aHist.splice(i, 1);
          SendMessage(hWndLB, 0x0182 /*LB_DELETESTRING*/, i, 0);
          SendMessage(hWndLB, 0x0186 /*LB_SETCURSEL*/, (i === aHist.length) ? --i : i, 0);
          PostMessage(hWnd, 273 /*WM_COMMAND*/, MkLong(3000, 1 /*LBN_SELCHANGE*/), hWndLB);
        }
      }
    }

    else if (uMsg === 273 /*WM_COMMAND*/)
    {
      nID   = LoWord(wParam);
      nCode = HiWord(wParam);

      if (nID === 3000)
      {
        if (nCode === 1 /*LBN_SELCHANGE*/)
        {
          i = SendMessage(hWndLB, 0x0188 /*LB_GETCURSEL*/, 0, 0);

          nPathLen = aHist[i].nPathLen;
          bSortDesc = aHist[i].bSortDesc;
          nDirLevel = aHist[i].nDirLevel;
          bNameRE = aHist[i].bNameRE;
          bNotName = aHist[i].bNotName;
          bInFiles = aHist[i].bInFiles;
          bInStreams = aHist[i].bInStreams;
          bSkipReadOnly = aHist[i].bSkipReadOnly;
          bSkipHidden = aHist[i].bSkipHidden;
          bSkipSystem = aHist[i].bSkipSystem;
          bSkipVCSignore = aHist[i].bSkipVCSignore;
          bSkipVCSignoreN = aHist[i].bSkipVCSignoreN;
          bSkipVCSignoreF = aHist[i].bSkipVCSignoreF;
          bInResults = aHist[i].bInResults;
          bMatchCase = aHist[i].bMatchCase;
          bContentRE = aHist[i].bContentRE;
          bMultiline = aHist[i].bMultiline;
          bNotContain = aHist[i].bNotContain;
          bSkipBinary = aHist[i].bSkipBinary;
          bSkipLarger = aHist[i].bSkipLarger;
          nMaxFileSize = aHist[i].nMaxFileSize;
          sDir = aHist[i].sDir;
          sName = aHist[i].sName;
          sContent = aHist[i].sContent;
          sReplace = aHist[i].sReplace;
          bAfterReplace = aHist[i].bAfterReplace;
          aFiles = aHist[i].aFiles.slice(0);

          if (i === 0)
          {
            aFilesSel = aHist[i].aFilesSel.slice(0);
            nFilesFoc = aHist[i].nFilesFoc;
            sLastContent = aHist[i].sLastContent;
            bLastContentRE = aHist[i].bLastContentRE;
            bLastMatchCase = aHist[i].bLastMatchCase;
            bLastMultiline = aHist[i].bLastMultiline;
            bLastNotContain = aHist[i].bLastNotContain;
          }
          else
          {
            aFilesSel = [0];
            nFilesFoc = 0;
            sLastContent = aHist[i].sContent;
            bLastContentRE = aHist[i].bContentRE;
            bLastMatchCase = aHist[i].bMatchCase;
            bLastMultiline = aHist[i].bMultiline;
            bLastNotContain = aHist[i].bNotContain;
          }

          SendMessage(aDlg[IDDIRLEVELCB].HWND, 0x014E /*CB_SETCURSEL*/, (nDirLevel >= 0) ? nDirLevel : nLevelMax - 1, 0);
          SetCheckButtons();
          SetWindowText(aDlg[IDMAXSIZEE].HWND, (nMaxFileSize > 0) ? nMaxFileSize.toString() : "");
          SetWindowText(aDlg[IDDIRCB].HWND, sDir);
          SetWindowText(aDlg[IDNAMECB].HWND, sName);
          SetWindowText(aDlg[IDCONTENTCB].HWND, sContent);
          SetWindowText(aDlg[IDREPLACECB].HWND, sReplace);
          SetHeaderLV();
          FillLV();
          EnableButtons();

          if (aHist.length === 1)
            PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
        }
        else if ((nCode === 2 /*LBN_DBLCLK*/) || (nCode === 5 /*LBN_KILLFOCUSE*/))
          PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
      }
      else if (nID === 2 /*IDCANCEL*/)
        PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
    }

    else if (uMsg === 16 /*WM_CLOSE*/)
      oSys.Call("User32::DestroyWindow", hWnd);

    else if (uMsg === 2 /*WM_DESTROY*/)
    {
      aHist.shift();
      EnableButtons();

      if (! oSys.Call("User32::IsWindowEnabled", hFocus))
        oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
    }

    return 0;
  }
}

function OpenFiles()
{
  var sFiles  = "";
  var lpFrame;
  var bSaved;
  var i;

  if (aFiles.length)
  {
    if ((! hParent) && (! oSys.Call("User32::IsZoomed", hDlg)))
    {
      SetForegroundWindow(hMainWnd);
      SetForegroundWindow(hDlg);
    }

    GetSelArrayLV();

    if (! aFilesSel.length)
      aFilesSel = [GetCurFocLV()];

    for (i = 0; i < aFilesSel.length; ++i)
    {
      if (IsFileExists(aFiles[aFilesSel[i]]))
      {
        lpFrame = 0;
        bSaved  = true;

        if (AkelPad.IsMDI() && SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 152 /*MI_SINGLEOPENFILE*/, 0) && (lpFrame = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 5 /*FWF_BYFILENAME*/, aFiles[aFilesSel[i]])))
          SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame);

        if ((lpFrame || (! AkelPad.IsMDI())) && AkelPad.GetEditModified(0) && (bSaved = SaveCurDoc()))
          AkelPad.Command(4324 /*IDM_WINDOW_FILECLOSE*/);

        if (bSaved)
          AkelPad.OpenFile(aFiles[aFilesSel[i]]);

        if (! AkelPad.IsMDI())
          break;
      }
      else
        sFiles += aFiles[aFilesSel[i]] + "\n";
    }

    if (sFiles)
      MessageBox(sFiles + "\n" + sTxtFileNoExist);
  }
}

/**
 * Open the file, or close the file if it's already opened.
 *
 * @return bool - false if already opened
 */
function OpenOrCloseFile(bSelect, bCloseOr)
{
  var nItem  = GetCurFocLV();
  var bSaved = true;
  var lpFrame;
  var rContent;
  var bClose = bCloseOr || 1;

  if (aFiles.length && (nItem >= 0))
  {
    if ((! hParent) && (! oSys.Call("User32::IsZoomed", hDlg)))
    {
      SetForegroundWindow(hMainWnd);
      SetForegroundWindow(hDlg);
    }

    if (aFiles[nItem].toUpperCase() === AkelPad.GetEditFile(0).toUpperCase() && bClose)
    {
      if (AkelPad.GetEditModified(0))
        bSaved = SaveCurDoc();

      if (bSaved)
      {
        if (bBookmarkResults)
          BookmarkLines('', false); // remove bookmarks on close to have some clean results

        if (AkelPad.IsMDI())
          AkelPad.Command(4318 /*IDM_WINDOW_FRAMECLOSE*/);
        else
          AkelPad.Command(4324 /*IDM_WINDOW_FILECLOSE*/);

        return false;
      }
    }
    else
    {
      if (IsFileExists(aFiles[nItem]))
      {
        if (AkelPad.IsMDI() && SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 152 /*MI_SINGLEOPENFILE*/, 0) && (lpFrame = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 5 /*FWF_BYFILENAME*/, aFiles[nItem])))
        {
          SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame);
          aResultsOpenedFiles.push(aFiles[nItem]);
          return true;
        }

        if ((lpFrame || (! AkelPad.IsMDI())) && AkelPad.GetEditModified(0) && (bSaved = SaveCurDoc()))
        {
          AkelPad.Command(4324 /*IDM_WINDOW_FILECLOSE*/);
          return false;
        }

        if (bSaved && AkelPad.OpenFile(aFiles[nItem]) === 0 /*EOD_SUCCESS*/)
        {
          WScript.Sleep(111); // to avoid some crashes
          aResultsOpenedFiles.push(aFiles[nItem]);

          if (bSelect)
            TextSearchOptions("BEGIN");

          if (bLogShow)
            SearchReplace_extended();

          if (bMarkResults)
            highlight();

          if (bBookmarkResults)
            BookmarkLines('', true);

          return true;
        }
        else
          return false;
      }
      else
      {
        MessageBox(aFiles[nItem] + "\n\n" + sTxtFileNoExist);
        return false;
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
    sTextSearchOptionsParams += "UP";

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
            aResultsOpenedFiles.push(aFiles[nItem]);

            if (bLogShow)
            {
              if (SearchReplace_extended('BEGIN'))
                oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
            }
            else TextSearchOptions("BEGIN");

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
          WarningBox(((typeof aFiles == "object" && typeof aFiles[nItem] !== "undefined")? aFiles[nItem] : '') + "\n\n" + sTxtFileNoExist);
          return false;
        }
      }
    }
  }
}

function WarningBox(sText, sCaption)
{
  AkelPad.MessageBox(hDlg, sText, sCaption, 0x00000030 /*MB_ICONWARNING*/);
}

/**
 * Close Opened Files From Result
 */
function CloseOpenedFilesFromResult(aFilesForceClose)
{
  var aOpenedFiles = aFiles.slice(0).sort() || [];
  var aOpenedFilesFromResults = aFilesForceClose || aResultsOpenedFiles.slice(0).sort() || [];
  var bClose = true,
      bSaved = true,
      tab = 0,
      lpInitFrame, lpFrame,
      bClosed = false;

  if (! aOpenedFiles.length)
    return false;

  try
  {
    lpInitFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/ , 1 /*FWF_BYTABINDEX*/ , 0);
    lpFrame = lpInitFrame;

    for (tab = 0; lpFrame; ++tab)
    {
      for (var i = 0, aOpenedFilesLen = aOpenedFiles.length, sOpenedFile; i < aOpenedFilesLen; i++)
      {
        sOpenedFile = aOpenedFiles[i];
        if (sOpenedFile.toUpperCase() === AkelPad.GetEditFile(0).toUpperCase() && bClose /* && (FindInArray(aOpenedFilesFromResults, sOpenedFile, true) !== -1) */)
        {
          if (AkelPad.GetEditModified(0))
            bSaved = SaveCurDoc();

          if (bSaved)
          {
            if (bBookmarkResults)
              BookmarkLines('', false);

            bClosed = true;

            if (AkelPad.IsMDI())
              AkelPad.Command(4318 /*IDM_WINDOW_FRAMECLOSE*/);
            else
              AkelPad.Command(4324 /*IDM_WINDOW_FILECLOSE*/);
          }
        }
      }
      lpFrame = AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/ , 8 /*FWF_BYTABINDEX*/ , tab + 1);
      if (lpFrame === lpInitFrame)
        break;
    }
  }
  catch (oError) {}

  if (! bClosed)
  {
    popupShow("Nothing to Close!", 1);
    return false;
  }

  popupShow("Closed!", 1);
  oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
}

function IsFileExist(pFile)
{
  if (oSys.Call("kernel32::GetFileAttributes" + _TCHAR, pFile) == -1)
    return false;
  return true;
}

function SaveCurDoc()
{
  var sFile = AkelPad.GetEditFile(0);
  var nAttr = GetFileAttr(sFile);
  var nChoice;
  var bSaveROMgs;

  nChoice = AkelPad.MessageBox(hDlg, AkelPad.GetEditFile(0) + (nAttr & 1 /*FILE_ATTRIBUTE_READONLY*/ ? "\n<" + sTxtReadOnly + ">" : "") + (nAttr & 2 /*FILE_ATTRIBUTE_HIDDEN*/ ? "\n<" + sTxtHidden + ">" : "") + (nAttr & 4 /*FILE_ATTRIBUTE_SYSTEM*/ ? "\n<" + sTxtSystem + ">" : "") + "\n\n" + sTxtDocModified, sTxtDlgTitle, 0x33 /*MB_ICONWARNING|MB_YESNOCANCEL*/);

  if (nChoice === 6 /*IDYES*/)
  {
    bSaveROMgs = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 221 /*MI_SAVEINREADONLYMSG*/, 0);
    SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 221 /*MIS_SAVEINREADONLYMSG*/, 0);

    if (! AkelPad.Command(4105 /*IDM_FILE_SAVE*/))
      nChoice = 2;

    SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 221 /*MIS_SAVEINREADONLYMSG*/, bSaveROMgs);
  }
  else if (nChoice === 7 /*IDNO*/)
    SendMessage(hMainWnd, 1229 /*AKD_SETMODIFY*/, 0, 0);

  return (nChoice !== 2);
}

function ByteOffsetToRichOffset(nByteOffset)
{
  var hEditWnd      = AkelPad.GetEditWnd();
  var lpCharIndex1  = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var lpCharIndex2  = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var lpIndexOffset = AkelPad.MemAlloc(_X64 ? 32 : 16 /*sizeof(AEINDEXOFFSET)*/);
  var nRichOffset;

  AkelPad.MemCopy(lpIndexOffset, lpCharIndex1, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpIndexOffset, _X64 ? 8 : 4), lpCharIndex2, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpIndexOffset, _X64 ? 16 : 8), nByteOffset, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpIndexOffset, _X64 ? 24 : 12), 3 /*AELB_ASIS*/, DT_DWORD);

  SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, 1 /*AEGI_FIRSTCHAR*/, lpCharIndex1);
  SendMessage(hEditWnd, 3135 /*AEM_INDEXOFFSET*/, 0, lpIndexOffset);

  nRichOffset = SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpCharIndex2);

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
    oSys.Call("User32::SetFocus", aDlg[IDFILELV].HWND);
  }
}

function RemoveFromList()
{
  if (aFiles.length)
  {
    SetTextSB(-2);
    SendMessage(aDlg[IDFILELV].HWND, 0x000B /*WM_SETREDRAW*/, 0, 0);
    SendMessage(aDlg[IDSTATUS].HWND, 0x000B /*WM_SETREDRAW*/, 0, 0);
    GetSelArrayLV();

    if (! aFilesSel.length)
      aFilesSel = [GetCurFocLV()];

    for (i = aFilesSel.length - 1; i >= 0; --i)
    {
      aFiles.splice(aFilesSel[i], 1);
      SendMessage(aDlg[IDFILELV].HWND, 0x1008 /*LVM_DELETEITEM*/, aFilesSel[i], 0);
    }

    SendMessage(aDlg[IDFILELV].HWND, 0x000B /*WM_SETREDRAW*/, 1, 0);
    SendMessage(aDlg[IDSTATUS].HWND, 0x000B /*WM_SETREDRAW*/, 1, 0);

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
  var MF_STRING    = 0x0000;
  var MF_CHECKED   = 0x0008;
  var MF_SEPARATOR = 0x0800;
  var hMenu = oSys.Call("User32::CreatePopupMenu");
  var oRect = {};
  var nCmd;

  GetWindowPos(aDlg[IDSETTINGSB].HWND, oRect);

  oSys.Call("User32::AppendMenuW", hMenu, (bSeparateWnd ? MF_CHECKED : MF_STRING), 2, sTxtSeparateWnd);
  oSys.Call("User32::AppendMenuW", hMenu, (bPathShow    ? MF_CHECKED : MF_STRING), 1, sTxtPathShow);
  oSys.Call("User32::AppendMenuW", hMenu, (bKeepHist    ? MF_CHECKED : MF_STRING), 3, sTxtKeepHist);
  oSys.Call("User32::AppendMenuW", hMenu, (bKeepFiles   ? MF_CHECKED : MF_STRING), 4, sTxtKeepFiles);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bMarkResults ? MF_CHECKED : MF_STRING), 13, sTxtMarkResults);
  oSys.Call("User32::AppendMenuW", hMenu, (bBookmarkResults ? MF_CHECKED : MF_STRING), 14, sTxtBookmarkResults);
  oSys.Call("User32::AppendMenuW", hMenu, (bCloseToggler ? MF_CHECKED : MF_STRING), 15, sTxtCloseToggle);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShow      ? MF_CHECKED : MF_STRING), 12, sTxtLogShow);
  oSys.Call("User32::AppendMenuW", hMenu, (bShowLogResuls? MF_CHECKED : MF_STRING), 17, sTxtLogShowResults);
  oSys.Call("User32::AppendMenuW", hMenu, (bBehaviour    ? MF_CHECKED : MF_STRING), 16, sTxtBehaviour);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShowNewT ? MF_CHECKED : MF_STRING), 5, sTxtLogResultsN);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShowKeep ? MF_CHECKED : MF_STRING), 6, sTxtLogResultsK);
  oSys.Call("User32::AppendMenuW", hMenu, (bLogShowS    ? MF_CHECKED : MF_STRING), 7, sTxtLogResults);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogQSA? MF_CHECKED : MF_STRING), 8 , sTxtLogResLogQSA);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogQS ? MF_CHECKED : MF_STRING), 9 , sTxtLogResLogQS);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogP  ? MF_CHECKED : MF_STRING), 10, sTxtLogResLogP);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLog   ? MF_CHECKED : MF_STRING), 11, sTxtLogResLog);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogAllOpened ? MF_CHECKED : MF_STRING), 19, sTxtLogResLogAllOpened);
  oSys.Call("User32::AppendMenuW", hMenu, (bTxtLogResLogAll       ? MF_CHECKED : MF_STRING), 18, sTxtLogResLogAll);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0188 /*TPM_NONOTIFY|TPM_RETURNCMD|TPM_RIGHTALIGN*/, oRect.X + oRect.W, oRect.Y + oRect.H, 0, hDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd === 1)
  {
    bPathShow = ! bPathShow;
    nFilesFoc = GetCurFocLV();
    GetSelArrayLV();
    FillLV();
  }
  else if (nCmd === 2)
  {
    bSeparateWnd = ! bSeparateWnd;
    bCloseDlg    = false;
    PostMessage(hDlg, 16 /*WM_CLOSE*/, 0, 0);
  }
  else if (nCmd === 3)
    bKeepHist = ! bKeepHist;
  else if (nCmd === 4)
    bKeepFiles = ! bKeepFiles;
  else if (nCmd === 5)
    FindstrLog(8388608); // 8388608 - Log in new tab
  else if (nCmd === 6)
    FindstrLog(24);      // 16+8 - don't scroll and keep all log results
  else if (nCmd === 7)
    FindstrLog();        // 16 - simple log
  else if (nCmd === 8)
    qSearchLog(3);
  else if (nCmd === 9)
    qSearchLog();
  else if (nCmd === 10)
    FindToLog(26);
  else if (nCmd === 11)
    FindToLog();
  else if (nCmd === 12)
    bLogShow = ! bLogShow;
  else if (nCmd === 13)
  {
    bMarkResults = ! bMarkResults;
    if (bMarkResults)
      highlight(GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent || sLastContent);
    else
      highlight(sContent, 3);
  }
  else if (nCmd === 14)
  {
    bBookmarkResults = ! bBookmarkResults;
    if (bBookmarkResults)
      BookmarkLines('', true);
    else
      BookmarkLines('', false);
  }
  else if (nCmd === 15)
  {
    bCloseToggler = ! bCloseToggler;
  }
  else if (nCmd === 16)
  {
    bBehaviour = ! bBehaviour;
  }
  else if (nCmd === 17)
  {
    bShowLogResuls = ! bShowLogResuls;
  }
  else if (nCmd === 18)
  {
    SearchReplace_extended("BEGIN", 2);
  }
  else if (nCmd === 19)
  {
    SearchReplace_extended("TABS", 2);
  }
}

/**
 * Find in files using FINDSTR search util and show search results in the log.
 * @TODO: Match exact word
 *
 * @param int pLogOutput - flags for Log::Output, default no scroll (16)
 * @return bool on success
 */
function FindstrLog(pLogOutput)
{
  // AkelPad.MessageBox(0, aFiles.join(', '), sScriptName, 0);
  var strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent;
  var strDir     = GetWindowText(aDlg[IDDIRCB].HWND).replace(/(^ +)|( +$)/g, "") || AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) || sDir;
  // var strName    = GetWindowText(aDlg[IDNAMECB].HWND).replace(/(^[ ;]+)|([ ;]+$)/g, "") || '*';

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

  AkelPad.Call("Log::Output", 1, sCOMMAND, sDirEsc, sREPATTERN, sRETAGS, -2, -2, logOutput, sLogExt);
  if (bMarkResults)
    MakeHighlight(strContent, (! bContentRE));

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
  var strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent;
  var strDir = GetWindowText(aDlg[IDDIRCB].HWND).replace(/(^ +)|( +$)/g, "") || AkelPad.GetFilePath(fileFullPath, 1) || sDir;
  var sDirEsc = strDir.replace(/\\/g, "\\\\");
  // var sFilePathEsc = fileFullPath.replace(/\\/g, "\\\\");

  if ((! strContent) || (! strDir))
    return false;

  var logOutput = pLogOutput || 18;
  var fileFullPath = AkelPad.GetEditFile(0);
  var sCOMMAND = "cmd.exe /K cd /d \""+ strDir +"\" & find /N "+ ((bMatchCase)?"":"/I") +" \""+ strContent +"\" "+ fileFullPath +" & exit";

  AkelPad.Call("Log::Output", 1, sCOMMAND, sDirEsc,
    "^(---------- (.+)$)?(\\[(\\d+)\\])?",
    "/FILE=\\2 /GOTOLINE=\\4:0" , -2, -2, logOutput, sLogExt
  );

  if (bMarkResults)
    MakeHighlight(strContent, (! bContentRE));

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
  var strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent || AkelPad.GetSelText();
  if (! strContent)
    return false;

  var bCase = bMatchCase,
      bRegEx = bContentRE,
      bRegExMulti = bMultiline;

  var sTextSearchOptionsParams = "",
      oError;

  if (bCase)
    sTextSearchOptionsParams += " CASE";
  if (bRegEx)
  {
    sTextSearchOptionsParams += " REGEX";
    if (bRegExMulti)
      sTextSearchOptionsParams += " REGEX_MULTI";
  }

  var flag = searchFlag || 1,
      selText = "";

  var found = searching();

  function searching()
  {
    var searchResult = -1;

    if (flag === 3)
      sTextSearchOptionsParams = ("BEGIN TABS" + sTextSearchOptionsParams);  /* 0x00200000|0x01000000 FRF_BEGINNING|FRF_ALLFILES */
    else
      sTextSearchOptionsParams = ("BEGIN" + sTextSearchOptionsParams); /* 0x00200000|0x00000001 FRF_BEGINNING|FRF_DOWN */

    try
    {
      searchResult = TextSearchOptions(sTextSearchOptionsParams);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, 'qSearchLog() -> searching()\n\nError:\n'+ oError.name +"\n\n"+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
      return false;
    }

    if (searchResult >= 0)
      return searchResult;

    if (searchResult <= -100)
    {
      AkelPad.MessageBox(0, 'Error in your expression:\n\n"'+ strContent +'"\n\n'+ searchResult +' is the offset.', sTxtDlgTitle, 0);
      return false;
    }
    else if (searchResult < 0)
    {
      AkelPad.MessageBox(0, '"'+ strContent +'" was not found!\n\n'+ searchResult +'', sTxtDlgTitle, 0);
      return false;
    }
  }

  if (found && (found >= 0) && qSearching(AkelPad.GetSelText(), flag))
  {
    AkelPad.Command(4199); // caret in editor history back
    oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);

    if (flag === 1)
      nLogCurrent = 18;

    return found;
  }

  oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);

  return found;
}

/**
 * qSearch FindAll method.
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
      AkelPad.MessageBox(0, 'qSearching()\n\nError:\n'+ oError.name +"\n\n"+ oError.description, WScript.Name, 16 /*MB_ICONERROR*/);
      return false;
    }

    if (bMarkResults)
      MakeHighlight(textSelected, 1);
    else
      AkelPad.Call("Log::Output", 4 + _TSTR, "\n", -1, 1 /*APPEND*/, 0, sLogExt);

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
 * @param string sParams  = "WORD UP BEGIN TEST ESCAPE SELECTED TABS"
 * @param mixed prompts = "undefined"
 * @return bool|number, see AkelPad.TextFind for more details
 */
function TextSearchOptions(sParams, prompts)
{
  var strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent || AkelPad.GetSelText();
  if (! strContent)
    return false;

  var pTextSearch = sParams || "DOWN";
  pTextSearch = pTextSearch.toUpperCase();

  var calcBin = (typeof prompts !== "undefined")? 0x10000000 /*FRF_CYCLESEARCHPROMPT*/ : 0x08000000 /*FRF_CYCLESEARCH*/;

  if (bMatchCase || ~pTextSearch.indexOf("CASE"))
    calcBin |= 0x00000004 /*FRF_MATCHCASE*/;

  if (bContentRE || ~pTextSearch.indexOf("REGEX"))
    calcBin |= 0x00080000 /*FRF_REGEXP*/;

  if (bMultiline || ~pTextSearch.indexOf("REGEX_MULTI"))
    calcBin |= 0x00040000 /*FRF_REGEXPNONEWLINEDOT*/;

  if (bMatchWord || ~pTextSearch.indexOf("WORD"))
    calcBin |= 0x00000002 /*FRF_WHOLEWORD*/;

  if (~pTextSearch.indexOf("ESCAPE"))
    calcBin |= 0x00800000 /*FRF_ESCAPESEQ*/;

  if (~pTextSearch.indexOf("UP"))
    calcBin |= 0x00100000 /*FRF_UP*/;
  else
    calcBin |= 0x00000001 /*FRF_DOWN*/;

  if (~pTextSearch.indexOf("BEGIN"))
    calcBin |= 0x00200000 /*FRF_BEGINNING*/;

  if (~pTextSearch.indexOf("TABS"))
    calcBin |= 0x01000000 /*FRF_ALLFILES*/;

  if (~pTextSearch.indexOf("TEST"))
    calcBin |= 0x80000000 /*FRF_TEST*/;

  if (~pTextSearch.indexOf("SELECTED"))
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
      AkelPad.MessageBox(0, 'searchSelect()\n\nError:\n'+ oError.name +"\n\n"+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
      return "";
    }

    selText = AkelPad.GetSelText();
  }
  return selText;
}

/**
 * SearchReplace_extended.js dialog hidden actions.
 *
 * @param string sDirection
 *   "DOWN"
 *   "UP"
 *   "BEGIN"
 *   "SELECTED"
 *   "TABS"
 *
 * @param number nButton
 *   BT_FIND       = 1
 *   BT_FINDALL    = 2
 *   BT_REPLACE    = 3
 *   BT_REPLACEALL = 4
 *
 * @param number nLogArgs
 * @see Log::Output 4 in the docs
 *
 * @return bool true if success
 */
function SearchReplace_extended(sDir, nBtn, nLog)
{
  var strContent = GetWindowText(aDlg[IDCONTENTCB].HWND) || sContent,
      strReplace = GetWindowText(aDlg[IDREPLACECB].HWND) || sReplace,
      nButton = nBtn || 2,
      sDirection = sDir || "BEGIN",
      nLogArgs = nLog || 18,
      oError
  ;

  if (! strContent)
    return false;

  if (nButton === 2 || nButton === 4)
    nLogCurrent = nLogArgs;

  try
  {
    var strParams = '-bDialogHiddenActions=1 -LogArgs='+ nLogArgs +' -sDirection="'+ encodeURIComponent(sDirection) +'" -nButton='+ nButton +' -Sensitive='+ bMatchCase +'  -Word='+ bMatchWord +' -RegExp='+ bContentRE +' -Multiline='+ bMultiline +' -Highlight=0 -Find="'+ encodeURIComponent(strContent) +'" -Replace="'+ encodeURIComponent(strReplace) +'"';
    if (nButton === 2 && bMarkResults)
      MakeHighlight(strContent, (! bContentRE));
    AkelPad.Call("Scripts::Main", 1, "SearchReplace_extended.js", strParams);
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, 'SearchReplace_extended()\n\nError:\n'+ oError.name +"\n\n"+ oError.description  +"\n\n"+ strContent +"\n"+ strReplace +"\n\nLog::Output Arguments: "+ nLogArgs, sScriptName, 16 /*MB_ICONERROR*/);
    return false;
  }

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
  if (! AkelPad.IsPluginRunning("Log::Output"))
        AkelPad.Call("Log::Output");
  AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", ('-bNotRegExp=' + ((bNotRegEx)?1:0) + ' -sText="' + encodeURIComponent(strContent) + '"'));
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
  var strWhat = sText || GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent,
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

  AkelPad.Call("Coder::HighLight", 3, -666999, sFoundResultsColorFG, sFoundResultsColorBG); // clear highlight

  if (action === 2)
    AkelPad.Call("Coder::HighLight", action, sFoundResultsColorFG, sFoundResultsColorBG, args, 0, -666999, strWhat);
  else if (action === 3)
    AkelPad.Call("Coder::HighLight", action, -666999, sFoundResultsColorFG, sFoundResultsColorBG);

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

  var sWhat = strContent || GetWindowText(aDlg[IDCONTENTCB].HWND) || sLastContent || sContent,
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
      AkelPad.MessageBox(hDlg, sTxtRegExpErr, sTitle, 0x10 /*MB_ICONERROR*/);
      SendDlgItemMessage(hDlg, IDCONTENTCB, 177 /*EM_SETSEL*/, -nPos - 100, -1);
      oSys.Call("User32::SetFocus", aDlg[IDCONTENTCB].HWND);
      return false;
    }
    else
    {
      AkelPad.MessageBox(hDlg, sTxtFileNoExist, sTitle, 0x40 /*MB_ICONINFORMATION*/);
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

function MessageBox(sText, bQuestion)
{
  var nType = 0x0030 /*MB_ICONWARNING*/;

  if (bQuestion)
    nType |= 0x0001 /*MB_OKCANCEL*/ | 0x0100 /*MB_DEFBUTTON2*/;

  return (AkelPad.MessageBox(hDlg, sText, sTxtDlgTitle, nType) === 1 /*IDOK*/);
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
    return (WshShell.Popup(
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

  if (hWndStatus = oSys.Call("user32::GetDlgItem", hMainWnd, 10002 /*ID_STATUS*/ ))
  {
    if (oSys.Call("user32::IsWindowVisible", hWndStatus))
    {
      if ((nStatusParts = AkelPad.SendMessage(hWndStatus, 1030 /*SB_GETPARTS*/ , 0, 0)) > 5)
      {
        if (lpStatusTextBuffer = AkelPad.MemAlloc(1024 * _TSIZE))
        {
          // Get user status string
          AkelPad.SendMessage(hWndStatus, _TSTR ? 1037 /*SB_GETTEXTW*/ : 1026 /*SB_GETTEXTA*/, nStatusParts - 1, lpStatusTextBuffer);
          pStatusText = AkelPad.MemRead(lpStatusTextBuffer, _TSTR);

          // Modify string
          pStatusText += sInfo;

          // Set user status string
          AkelPad.MemCopy(lpStatusTextBuffer, pStatusText, _TSTR);
          AkelPad.SendMessage(hWndStatus, _TSTR ? 1035 /*SB_SETTEXTW*/ : 1025 /*SB_SETTEXTA*/, nStatusParts - 1, lpStatusTextBuffer);
          AkelPad.MemFree(lpStatusTextBuffer);
        }
      }
    }
  }
}

/**
 * Gets output of the log and paste it in the new tab.
 *
 * @param string sLogThemeExt
 * @return bool if success
 */
function LogOutputActions(sLogThemeExt, callback)
{
  var oError = {}, hWndOutput, nTextLen, lpText, sText;
  try
  {
    if (! AkelPad.IsPluginRunning("Log::Output"))
    {
      popupShow("THE LOG IS NOT OPENED!", 1);
      AkelPad.Call("Log::Output");
      return false;
    }

    hWndOutput = GetOutputWindow();
    if (nTextLen = AkelPad.SendMessage(hWndOutput, 14 /*WM_GETTEXTLENGTH*/, 0, 0))
    {
      if (lpText = AkelPad.MemAlloc((nTextLen + 1) * 2))
      {
        AkelPad.SendMessage(hWndOutput, 13 /*WM_GETTEXT*/, nTextLen + 1, lpText);
        sText = AkelPad.MemRead(lpText, 1 /*DT_UNICODE*/ );
        AkelPad.MemFree(lpText);

        callback(sText, sLogThemeExt);
      }
    }
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, "Error:\n\n"+ oError.name + "\n\n" + oError.description + "\n\n", WScript.ScriptName, 16 /*MB_ICONERROR*/);
    return false;
  }
  hWndOutput = 0;
  return true;
}

function GetOutputWindow()
{
  var lpWnd;
  var hWnd = 0;
  if (lpWnd = AkelPad.MemAlloc(_X64 ? 8 : 4 /*sizeof(HWND)*/))
  {
    AkelPad.Call("Log::Output", 2, lpWnd);
    hWnd = AkelPad.MemRead(lpWnd, 2 /*DT_QWORD*/);
    AkelPad.MemFree(lpWnd);
  }
  return hWnd;
}

/**
 * Copy the text from the log into the new tab, callback fn.
 *
 * @param string sText
 * @param string sLogThemeExt
 * @return void
 */
function CopyLogContentsToNewTabCB(sText, sLogThemeExt)
{
  var oError, sDirs;

  try
  {
    if (AkelPad.Include("CommonFunctions.js"))
      createFile(getFileFormat(0), (sLogThemeExt || ".txt"));
    else
      AkelPad.SendMessage(AkelPad.GetMainWnd(), 273 /*WM_COMMAND*/, 4101 /*wParam=MAKEWAPARAM(0,IDM_FILE_NEW)*/, 1 /*lParam=TRUE*/);
    AkelPad.ReplaceSel(sText);
    AkelPad.SetSel(0, 0);
  }
  catch (oError) {
    AkelPad.MessageBox(0, "Copy log contents into the new tab Error:\n\n"+ oError.name + "\n\n" + oError.description + "\n\n", WScript.ScriptName, 16 /*MB_ICONERROR*/);
  }

  WScript.Sleep(1000);

  // OpenRelativeFile_extended.ini
  try
  {
    sDirs = 'aDirs=['+ aDirs.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n';

    //AkelPad.MessageBox(0, sDirs, WScript.ScriptName, 0 /*MB_OK*/);
    AkelPad.WriteFile(AkelPad.GetAkelDir() + "\\AkelFiles\\Plugs\\Scripts\\OpenRelativeFile_extended.ini", sDirs, sDirs.length, 1200 /*UTF-16LE*/, true);
  }
  catch (oError) {
    AkelPad.MessageBox(0, "Save directories to OpenRelativeFile_extended Error:\n\n"+ oError.name + "\n\n" + oError.description + "\n\n", WScript.ScriptName, 16 /*MB_ICONERROR*/);
  }
}

/**
 * Copy the log contents into the clipboard.
 *
 * @param string sText
 * @param string sLogThemeExt
 * @return void
 */
function CopyLogContentsToClipboardCB(sText, sLogThemeExt)
{
  popupShow("The Log contents is copied!", 1);
  AkelPad.SetClipboardText(sText);
}

function ReadIni()
{
  var sLngFile = WScript.ScriptFullName.replace(/\.js$/i, "_" + AkelPad.GetLangId(0 /*LANGID_FULL*/).toString() + ".lng");

  if (IsFileExists(sLngFile))
  {
    try
    {
      eval(AkelPad.ReadFile(sLngFile));
    }
    catch (oError)
    {
      GetLangStrings();
    }
  }
  else
    GetLangStrings();

  try
  {
    eval(AkelPad.ReadFile(WScript.ScriptFullName.replace(/js$/i, "ini"), 0x10 /*OD_ADT_NOMESSAGES*/, 1200 /*UTF-16LE*/, true));
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, 'ReadIni() Error:\n\n'+ oError.name +"\n\n"+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
  }

  if (aDirs.length > nHistMax) aDirs.length = nHistMax;
  if (aNames.length > nHistMax) aNames.length = nHistMax;
  if (aContents.length > nHistMax) aContents.length = nHistMax;
  if (aReplace.length > nHistMax) aReplace.length = nHistMax;
  if (aHist.length > nHistMax) aHist.length = nHistMax;
}

function WriteIni()
{
  var sIniTxt = "";
  var i;
  var oError;

  oWndPos.W   = Scale.UX(oWndPos.W);
  oWndPos.H   = Scale.UY(oWndPos.H);
  oWndPos.Max = oSys.Call("User32::IsZoomed", hDlg);
  sDir        = GetWindowText(aDlg[IDDIRCB].HWND);
  sName       = GetWindowText(aDlg[IDNAMECB].HWND);
  sContent    = GetWindowText(aDlg[IDCONTENTCB].HWND);
  sReplace    = GetWindowText(aDlg[IDREPLACECB].HWND);

  if (! bKeepHist)
  {
    aDirs.length     = 0;
    aNames.length    = 0;
    aContents.length = 0;
    aReplace.length  = 0;
    aHist.length     = 0;
  }

  if (bKeepFiles)
  {
    GetSelArrayLV();
    nFilesFoc = GetCurFocLV();
  }
  else
  {
    aFiles.length = 0;
    aFilesSel     = [0];
    nFilesFoc     = 0;

    for (i = 0; i < aHist.length; ++i)
      aHist[i].aFiles.length = 0;
  }

  for (i in oWndPos)
    sIniTxt += 'oWndPos.' + i + '=' + oWndPos[i] + ';\r\n';

  sIniTxt +=
    'bPathShow='       + bPathShow + ';\r\n' +
    'bLogShow='        + bLogShow + ';\r\n' +
    'bShowLogResuls='  + bShowLogResuls + ';\r\n' +
    'bBehaviour='      + bBehaviour + ';\r\n' +
    'bMarkResults='    + bMarkResults + ';\r\n' +
    'bBookmarkResults='+ bBookmarkResults + ';\r\n' +
    'bCloseToggler='   + bCloseToggler + ';\r\n' +
    'bSeparateWnd='    + bSeparateWnd + ';\r\n' +
    'bKeepHist='       + bKeepHist + ';\r\n' +
    'bKeepFiles='      + bKeepFiles + ';\r\n' +
    'nPathLen='        + nPathLen + ';\r\n' +
    'bSortDesc='       + bSortDesc + ';\r\n' +
    'nDirLevel='       + nDirLevel + ';\r\n' +
    'bNameRE='         + bNameRE + ';\r\n' +
    'bNotName='        + bNotName + ';\r\n' +
    'bInFiles='        + bInFiles + ';\r\n' +
    'bInStreams='      + bInStreams + ';\r\n' +
    'bSkipReadOnly='   + bSkipReadOnly + ';\r\n' +
    'bSkipHidden='     + bSkipHidden + ';\r\n' +
    'bSkipSystem='     + bSkipSystem + ';\r\n' +
    'bSkipVCSignore='  + bSkipVCSignore + ';\r\n' +
    'bSkipVCSignoreN='  + bSkipVCSignoreN + ';\r\n' +
    'bSkipVCSignoreF='  + bSkipVCSignoreF + ';\r\n' +
    'bInResults='      + bInResults + ';\r\n' +
    'bMatchCase='      + bMatchCase + ';\r\n' +
    'bMatchWord='      + bMatchWord + ';\r\n' +
    'bContentRE='      + bContentRE + ';\r\n' +
    'bMultiline='      + bMultiline + ';\r\n' +
    'bNotContain='     + bNotContain + ';\r\n' +
    'bSkipBinary='     + bSkipBinary + ';\r\n' +
    'bSkipLarger='     + bSkipLarger + ';\r\n' +
    'nMaxFileSize='    + nMaxFileSize + ';\r\n' +
    'sDir="'           + sDir.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'sName="'          + sName.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'sContent="'       + sContent.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'sReplace="'       + sReplace.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'sLastContent="'   + sLastContent.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'sFoundResultsColorFG="' + sFoundResultsColorFG.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'sFoundResultsColorBG="' + sFoundResultsColorBG.replace(/[\\"]/g, '\\$&') + '";\r\n' +
    'bLastContentRE='  + bLastContentRE + ';\r\n' +
    'bLastMatchCase='  + bLastMatchCase + ';\r\n' +
    'bLastMultiline='  + bLastMultiline + ';\r\n' +
    'bLastNotContain=' + bLastNotContain + ';\r\n' +
    'bAfterReplace='   + bAfterReplace + ';\r\n' +
    'aVCSIgnoreFileConfs=[' + aVCSIgnoreFileConfs.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aVCSExcludedPaths=[' + aVCSExcludedPaths.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aVCSUnexcludedPaths=[' + aVCSUnexcludedPaths.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aDirs=['          + aDirs.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aNames=['         + aNames.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aContents=['      + aContents.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aReplace=['       + aReplace.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aFiles=['         + aFiles.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') +'];\r\n' +
    'aFilesSel=['      + aFilesSel +'];\r\n' +
    'nFilesFoc='       + nFilesFoc +';\r\naHist=[';

  for (i = 0; i < aHist.length; ++i)
  {
    sIniTxt +=
      '{' +
      'nPathLen:'      + aHist[i].nPathLen + ',' +
      'bSortDesc:'     + aHist[i].bSortDesc + ',' +
      'nDirLevel:'     + aHist[i].nDirLevel + ',' +
      'bNameRE:'       + aHist[i].bNameRE + ',' +
      'bNotName:'      + aHist[i].bNotName + ',' +
      'bInFiles:'      + aHist[i].bInFiles + ',' +
      'bInStreams:'    + aHist[i].bInStreams + ',' +
      'bSkipReadOnly:' + aHist[i].bSkipReadOnly + ',' +
      'bSkipHidden:'   + aHist[i].bSkipHidden + ',' +
      'bSkipSystem:'   + aHist[i].bSkipSystem + ',' +
      'bSkipVCSignore:'+ aHist[i].bSkipVCSignore + ',' +
      'bSkipVCSignoreN:'+ aHist[i].bSkipVCSignoreN + ',' +
      'bSkipVCSignoreF:'+ aHist[i].bSkipVCSignoreF + ',' +
      'bInResults:'    + aHist[i].bInResults + ',' +
      'bMatchCase:'    + aHist[i].bMatchCase + ',' +
      'bContentRE:'    + aHist[i].bContentRE + ',' +
      'bMultiline:'    + aHist[i].bMultiline + ',' +
      'bNotContain:'   + aHist[i].bNotContain + ',' +
      'bSkipBinary:'   + aHist[i].bSkipBinary + ',' +
      'bSkipLarger:'   + aHist[i].bSkipLarger + ',' +
      'nMaxFileSize:'  + aHist[i].nMaxFileSize + ',' +
      'sDir:"'         + aHist[i].sDir.replace(/[\\"]/g, '\\$&') + '",' +
      'sName:"'        + aHist[i].sName.replace(/[\\"]/g, '\\$&') + '",' +
      'sContent:"'     + aHist[i].sContent.replace(/[\\"]/g, '\\$&') + '",' +
      'sReplace:"'     + aHist[i].sReplace.replace(/[\\"]/g, '\\$&') + '",' +
      'bAfterReplace:' + aHist[i].bAfterReplace + ',' +
      'aFiles:['       + aHist[i].aFiles.join('\t').replace(/[\\"]/g, '\\$&').replace(/\t/g, '","').replace(/.+/, '"$&"') + ']}' +
      ((i === aHist.length - 1) ? '' : ',');
  }

  sIniTxt += '];';

  try
  {
    AkelPad.WriteFile(WScript.ScriptFullName.replace(/js$/i, "ini"), sIniTxt, sIniTxt.length, 1200 /*UTF-16LE*/, true);
  }
  catch(oError)
  {
    AkelPad.MessageBox(0, 'WriteIni() Error:\n\n'+ oError.name +"\n\n"+ oError.description, sScriptName, 16 /*MB_ICONERROR*/);
  }
}

function GetLangStrings()
{
  sTxtDlgTitle    = "Find/Replace files";
  sTxtDir         = "&Directory";
  sTxtCurrent     = "Current..&,";
  sTxtBookmarkLines = 'Bookmark lines';
  sTxtUnmarkLines   = 'Unmark lines';
  sTxtRegExpErr     = 'Syntax error in regular expression!';
  sTxtBrowse      = "Browse..&.";
  sTxtSubDirs     = "Subdirectories level&:";
  sTxtAll         = "All";
  sTxtFileName    = "File: Stream names &of file";
  sTxtRegExp      = "Regular e&xpressions";
  sTxtNotName     = "&Not matching names";
  sTxtFiles       = "Files (main streams)";
  sTxtStreams     = "Alternate NTFS streams";
  sTxtTextInFile  = "&Text in file/stream";
  sTxtMatchWord   = "Match &word";
  sTxtMatchCase   = "Match &case";
  sTxtMultiline   = "M&ultiline";
  sTxtNotContain  = "&Not contain text";
  sTxtSkipBinary  = "Skip &binary files";
  sTxtSkipLarger  = "Skip larger:";
  sTxtReplaceWith = "&Replace with:";
  sTxtSkipFiles   = "S&kip files";
  sTxtReadOnly    = "Read-only";
  sTxtHidden      = "Hidden";
  sTxtSystem      = "System";
  sTxtVCSigore    = "&VCS paths";
  sTxtVCSigoreNest= "VCS nested";
  sTxtVCSigoreFiles= "VCS files";
  sTxtInResults   = "&In results";
  sTxtSearch      = "&SEARCH";
  sTxtReplace     = "Replace";
  sTxtHistory     = "Histor&y";
  sTxtEdit        = "&Edit";
  sTxtCopyList    = "Co&py list";
  sTxtClearList   = "Clear list";
  sTxtSettings    = "SETTINGS [&;]";
  sTxtClose       = "Close";
  sTxtFilesFound  = "Files found";
  sTxtFilesRepl   = "Files replaced";
  sTxtNoFiles     = "<no files>";
  sTxtByteSymbol  = "B";
  sTxtNTFSStream  = "NTFS stream";
  sTxtWait        = "Wait...";
  sTxtChooseDir   = "The current path is:\n";
  sTxtPathShow    = "Show full &path in file list";
  sTxtLogResLog   = "Show results of current document (&FIND) in the log output\tCtrl+S";
  sTxtLogResLogAll= "Show results of current document (SearchReplace_extended) in the log output\tCtrl+Shift+&A";
  sTxtLogResLogAllOpened = "Show results of opened documents (SearchReplace_extended) in the log output\tShift+Alt+A";
  sTxtLogResLogP  = "Show results of current document (FIND), &Preserving the log output\tCtrl+Shift+S";
  sTxtLogResLogQS = "Show results of current document (&qSearch), preserving the log output\tCtrl+Shift+Q";
  sTxtLogResLogQSA= "Results from opened documents in log (qSearch), preserving the log output\tShift+Alt+&Q";
  sTxtLogResults  = "Show results in the &Log (FINDSTR)\tCtrl+L";
  sTxtLogResultsK = "Show results in the log, but &Keep the previous results (FINDSTR)\tCtrl+Shift+L";
  sTxtLogResultsN = "Show results in the &New tab (FINDSTR)\tCtrl+N";
  sTxtCloseToggle = "Double click to &Close opened result";
  sTxtLogShow     = "&Double click to show results in the Log\tShift+Alt+Enter";
  sTxtLogShowResults= "Show found search results in the log";
  sTxtBehaviour   = "&Normal behaviour";
  sTxtMarkResults = "&Highlight | Mark the results\tCtrl+M";
  sTxtBookmarkResults = "&Bookmark the results\tAlt+B/Shift+Alt+B";
  sTxtSeparateWnd = "Run in separate &window";
  sTxtKeepHist    = "Keep history on exit";
  sTxtKeepFiles   = "Keep file list";
  sTxtDirNoExist  = "Directory does not exists.";
  sTxtFileNoExist = "File(s) does not exists.";
  sTxtErrorRE     = "Error in regular expression.";
  sTxtWantReplace = "Do you want to replace contents of files?\n\nWarning: this operation can not be undone.";
  sTxtDocModified = "Document was modified. Do you want to save it?";
  sHlpAnyChar     = "any single character";
  sHlpAnyString   = "any string of characters";
  sHlpSemicolQuot = "semicolon must be in double quotes";
  sHlpListSepar   = "list separator (semicolon)";
  sHlpStreamSepar = "File:Stream separator (colon)";
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
  sHlpBackrefer9  = "backreference, range 1-9";
  sHlpBackrefer99 = "backreference, range 01-99";
  sHlpZeroOrOne   = "zero or one times";
  sHlpZeroOrMore  = "zero or more times";
  sHlpOneOrMore   = "one or more times";
  sHlpexactly     = "exactly 3 times";
  sHlpAtLeast     = "at least 3 times";
  sHlpFromTo      = "from 3 to 7 times";
  sHlpSpecChars   = "()[]{}^$.?+*|\\ special chars";
  sHlpDollar      = "dollar character";
  sHlpEntireStr   = "entire string matched";
  sHlpPrecedeStr  = "substring that precedes matched string";
  sHlpFollowStr   = "substring that follows after matched string";
  sHlpSubmatch9   = "9th captured submatch, range 1-9";
  sHlpSubmatch99  = "99th captured submatch, range 01-99";
  sHlpBackslash   = "backslash";
}
