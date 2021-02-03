/// FileAndStream.js
// http://tc-image.3dn.ru/forum/9-908-8142-16-1388649481
// Version: 2015-01-07
// Author: KDJ
// Менеджер файлов и потоков NTFS.
// FileAndStream.js - ver. 2014-04-12 (x86/x64)
//
// Manager of files and NTFS streams.
//
// Call("Scripts::Main", 1, "FileAndStream_extended.js")
// Call("Scripts::Main", 1, "FileAndStream_extended.js" `-sDir="%d"`)
//
// Required to include: FileAndStream_functions.js and InputBox_function.js
// Required in Scripts directory: FileAndStream_nnnn.lng (nnnn = language identifier)
//
// Some keyboard shortcuts that are not visible in menu:
//   TAB - change panel
//   Shift+TAB - change widow Files <-> NTFS streams
//   Alt+Del - delete filter from filter list
//
// Arguments:
// -sDir="%d"   to open current directory
// -nPane="0"    left (0), or right (1) pane
// Call("Scripts::Main", 1, "FileAndStream_extended.js" `-sDir="%d"`)
//
// Hotkeys:
// Ctrl+N         - create new file
// Ctrl+Shift+N   - create new folder
//
// Alt+D, Ctrl+P  - Edit the path
//
// Ctrl+Shift+F   - Open FindReplaceFiles_extended.js in current path
// Shift+Alt+F    - Open selected file/folder in finder
//

/**
 * Script dependencies:
 * - FindFiles_extended.js
 * - FindReplaceFiles_extended.js
 */

var oSys       = AkelPad.SystemFunction();
var sClassName = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("Kernel32::GetCurrentProcessId");
var hWndDlg    = oSys.Call("User32::FindWindowExW", 0, 0, sClassName, 0);
var fso        = new ActiveXObject("Scripting.FileSystemObject");

// Arguments
var sCurrentDir = AkelPad.GetArgValue("sDir", "");
var nPan = AkelPad.GetArgValue("nPane", 0);

// Icons
//var ICONFOLDER = "\uD83D\uDCC1 ";
//var ICONFOLDER = "\uD83D\uDDC1 ";
var ICONFOLDER = "\uD83D\uDDBF ";
var ICONFILE = "\uD83D\uDDCB ";

if (hWndDlg)
{
  if (! oSys.Call("User32::IsWindowVisible", hWndDlg))
    oSys.Call("User32::ShowWindow", hWndDlg, 8 /*SW_SHOWNA*/);
  if (oSys.Call("User32::IsIconic", hWndDlg))
    oSys.Call("User32::ShowWindow", hWndDlg, 9 /*SW_RESTORE*/);

  oSys.Call("User32::SetForegroundWindow", hWndDlg);
}
else
{
  if (! (AkelPad.Include("FileAndStream_functions.js") && AkelPad.Include("InputBox_function.js") && GetLangStrings()))
    WScript.Quit();

  var DT_QWORD = 2;
  var DT_DWORD = 3;
  var DT_WORD  = 4;
  var DT_BYTE  = 5;

  var hInstDLL    = AkelPad.GetInstanceDll();
  var sScriptName = "File and Stream";
  var hGuiFont    = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
  var nBufSize    = 2048;
  var lpBuffer    = AkelPad.MemAlloc(nBufSize);
  var lpLVITEM    = AkelPad.MemAlloc(_X64 ? 72 : 60); //sizeof(LVITEM)

  AkelPad.MemCopy(lpLVITEM, 0x0001 /*LVIF_TEXT*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, _X64 ? 24 : 20), lpBuffer, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, _X64 ? 32 : 24), nBufSize, DT_DWORD);

  var oWndMin = {"W": 560,
                 "H": 366};
  var oWndPos = {"X": 240,
                 "Y": 160,
                 "W": oWndMin.W,
                 "H": oWndMin.H,
                 "Max": false};
  var bDualPan        = true;
  var bColSize        = true;
  var bColTime        = true;
  var bColAttr        = true;
  var bQuickView      = true;
  var bSaveHist       = true;
  var sViewerName     = "";
  var sViewer         = "";
  var sViewerPar      = "";
  var sViewerName2    = "";
  var sViewer2        = "";
  var sViewerPar2     = "";
  var sEditorName     = "AkelPad";
  var sEditor         = "%a\\AkelPad.exe";
  var sEditorPar      = "";
  var sEditorName2    = "";
  var sEditor2        = "";
  var sEditorPar2     = "";
  var sComparerName   = "";
  var sComparer       = "";
  var sComparerPar    = "";
  var sComparerName2  = "";
  var sComparer2      = "";
  var sComparerPar2   = "";
  var nCurPan         = 0;
  var aFilter         = [];
  var aCurFilter      = ["*.*", "*.*"];
  var aCurWnd         = [0, 0];
  var aCurDrive       = ["", ""];
  var aCurDir         = [{}, {}];
  var aSort           = [[0, 0], [0, 0], [0, 0], [0, 0]];
  var aFavorite       = [];
  var aFavoriteFolder = [];
  var aIntAssoc       = [];
  var aCurHist        = [0, 0];
  var aHistory        = [[], []];
  var nHistMax        = 25;
  var oScrArg         = {};
  var hWndDlg;
  var hWndSort;
  var hWndFilterEdit0;
  var hWndFilterEdit1;

  ReadWriteIni(false);

  if (! bDualPan)
    oWndMin.W = Math.round((oWndMin.W - 2 * oSys.Call("User32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/)) / 2) + 2 * oSys.Call("User32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/);

  if (oWndPos.H < oWndMin.H)
    oWndPos.H = oWndMin.H;
  if (oWndPos.W < oWndMin.W)
    oWndPos.W = oWndMin.W;

  var CLASS = 0;
  var HWND  = 1;
  var STYLE = 2;
  var TXT   = 3;

  var aSubClassHand = [];
  var aWnd          = [];
  var IDFILTERS0    = 2000;
  var IDFILTERS1    = 2001;
  var IDDRIVECB0    = 2002;
  var IDDRIVECB1    = 2003;
  var IDFILTERCB0   = 2004;
  var IDFILTERCB1   = 2005;
  var IDDIRS0       = 2006;
  var IDDIRS1       = 2007;
  var IDFILELV0     = 2008;
  var IDFILELV1     = 2009;
  var IDSTREAMLV0   = 2010;
  var IDSTREAMLV1   = 2011;
  var IDQUICKVIEWS0 = 2012;
  var IDQUICKVIEWS1 = 2013;
  var IDMAINDIRB0   = 2014;
  var IDMAINDIRB1   = 2015;
  var IDUPDIRB0     = 2016;
  var IDUPDIRB1     = 2017;
  var IDFAVFOLDB0   = 2018;
  var IDFAVFOLDB1   = 2019;
  var IDSPECFOLDB0  = 2020;
  var IDSPECFOLDB1  = 2021;
  var IDHISTORYB0   = 2022;
  var IDHISTORYB1   = 2023;
  var IDLEFTB       = 2024;
  var IDRIGHTB      = 2025;
  var IDMENUB       = 2026;
  var IDRENAMEB     = 2027;
  var IDVIEWB       = 2028;
  var IDEDITB       = 2029;
  var IDCOPYB       = 2030;
  var IDMOVEB       = 2031;
  var IDCREATEB     = 2032;
  var IDDELETEB     = 2033;
  var IDREFRESHB    = 2034;
  var IDCOMPAREB    = 2035;
  var IDWAIT        = 2036;

  //0x50000000 - WS_VISIBLE|WS_CHILD
  //0x50000002 - WS_VISIBLE|WS_CHILD|SS_RIGHT
  //0x50000003 - WS_VISIBLE|WS_CHILD|CBS_DROPDOWNLIST
  //0x50204042 - WS_VISIBLE|WS_CHILD|WS_VSCROLL|CBS_LOWERCASE|CBS_AUTOHSCROLL|CBS_DROPDOWN
  //0x50800001 - WS_VISIBLE|WS_CHILD|WS_BORDER|SS_CENTER
  //0x5080000D - WS_VISIBLE|WS_CHILD|WS_BORDER|LVS_SHOWSELALWAYS|LVS_SINGLESEL|LVS_REPORT
  //0x5080008C - WS_VISIBLE|WS_CHILD|WS_BORDER|SS_NOPREFIX|SS_LEFTNOWORDWRAP
  //0x50802080 - WS_VISIBLE|WS_CHILD|WS_BORDER|SS_EDITCONTROL|SS_NOPREFIX
  //Windows              CLASS,        HWND,      STYLE, TXT
  aWnd[IDFILTERS0   ] = ["STATIC",        0, 0x50000002, sTxtFilter + ":"];
  aWnd[IDFILTERS1   ] = ["STATIC",        0, 0x50000002, sTxtFilter + ":"];
  aWnd[IDDRIVECB0   ] = ["COMBOBOX",      0, 0x50000003, ""];
  aWnd[IDDRIVECB1   ] = ["COMBOBOX",      0, 0x50000003, ""];
  aWnd[IDFILTERCB0  ] = ["COMBOBOX",      0, 0x50204042, ""];
  aWnd[IDFILTERCB1  ] = ["COMBOBOX",      0, 0x50204042, ""];
  aWnd[IDDIRS0      ] = ["STATIC",        0, 0x5080008C, ""];
  aWnd[IDDIRS1      ] = ["STATIC",        0, 0x5080008C, ""];
  aWnd[IDFILELV0    ] = ["SysListView32", 0, 0x5080000D, ""];
  aWnd[IDFILELV1    ] = ["SysListView32", 0, 0x5080000D, ""];
  aWnd[IDSTREAMLV0  ] = ["SysListView32", 0, 0x5080000D, ""];
  aWnd[IDSTREAMLV1  ] = ["SysListView32", 0, 0x5080000D, ""];
  aWnd[IDQUICKVIEWS0] = ["STATIC",        0, 0x50802080, ""];
  aWnd[IDQUICKVIEWS1] = ["STATIC",        0, 0x50802080, ""];
  aWnd[IDMAINDIRB0  ] = ["BUTTON",        0, 0x50000000, "\\"];
  aWnd[IDMAINDIRB1  ] = ["BUTTON",        0, 0x50000000, "\\"];
  aWnd[IDUPDIRB0    ] = ["BUTTON",        0, 0x50000000, ".."];
  aWnd[IDUPDIRB1    ] = ["BUTTON",        0, 0x50000000, ".."];
  aWnd[IDFAVFOLDB0  ] = ["BUTTON",        0, 0x50000000, "FF"];
  aWnd[IDFAVFOLDB1  ] = ["BUTTON",        0, 0x50000000, "FF"];
  aWnd[IDSPECFOLDB0 ] = ["BUTTON",        0, 0x50000000, "SF"];
  aWnd[IDSPECFOLDB1 ] = ["BUTTON",        0, 0x50000000, "SF"];
  aWnd[IDHISTORYB0  ] = ["BUTTON",        0, 0x50000000, "H"];
  aWnd[IDHISTORYB1  ] = ["BUTTON",        0, 0x50000000, "H"];
  aWnd[IDLEFTB      ] = ["BUTTON",        0, 0x50000000, "<-"];
  aWnd[IDRIGHTB     ] = ["BUTTON",        0, 0x50000000, "->"];
  aWnd[IDMENUB      ] = ["BUTTON",        0, 0x50000000, sTxtMenu + " F1"];
  aWnd[IDRENAMEB    ] = ["BUTTON",        0, 0x50000000, sTxtRename + " F2"];
  aWnd[IDVIEWB      ] = ["BUTTON",        0, 0x50000000, sTxtView + " F3"];
  aWnd[IDEDITB      ] = ["BUTTON",        0, 0x50000000, sTxtEdit + " F4"];
  aWnd[IDCOPYB      ] = ["BUTTON",        0, 0x50000000, sTxtCopy + " F5"];
  aWnd[IDMOVEB      ] = ["BUTTON",        0, 0x50000000, sTxtMove + " F6"];
  aWnd[IDCREATEB    ] = ["BUTTON",        0, 0x50000000, sTxtCreate + " F7"];
  aWnd[IDDELETEB    ] = ["BUTTON",        0, 0x50000000, sTxtDelete + " F8"];
  aWnd[IDREFRESHB   ] = ["BUTTON",        0, 0x50000000, sTxtRefresh + " F9"];
  aWnd[IDCOMPAREB   ] = ["BUTTON",        0, 0x50000000, sTxtCompare + " F12"];
  aWnd[IDWAIT       ] = ["STATIC",        0, 0x50800001, ""];

  AkelPad.WindowRegisterClass(sClassName);

  //0x90CF0000 - WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MAXIMIZEBOX|WS_MINIMIZEBOX|WS_SIZEBOX
  //0x91CF0000 - WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MAXIMIZEBOX|WS_MINIMIZEBOX|WS_SIZEBOX|WS_MAXIMIZE
  hWndDlg = oSys.Call("User32::CreateWindowExW",
                      0,               //dwExStyle
                      sClassName,      //lpClassName
                      sScriptName,     //lpWindowName
                      oWndPos.Max ? 0x91CF0000 : 0x90CF0000, //dwStyle
                      oWndPos.X,       //x
                      oWndPos.Y,       //y
                      oWndPos.W,       //nWidth
                      oWndPos.H,       //nHeight
                      0,               //hWndParent
                      0,               //ID
                      hInstDLL,        //hInstance
                      DialogCallback); //Script function callback. To use it class must be registered by WindowRegisterClass.

  //Allow other scripts running
  AkelPad.ScriptNoMutex();

  //Message loop
  AkelPad.WindowGetMessage();

  AkelPad.WindowUnregisterClass(sClassName);
  AkelPad.MemFree(lpBuffer);
  AkelPad.MemFree(lpLVITEM);
}

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg === 1) //WM_CREATE
  {
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
                  100,            //nWidth (for IDFILTERCB0)
                  1200,           //nHeight (for IDFILELV0)
                  hWnd,           //hWndParent
                  i,              //ID
                  hInstDLL,       //hInstance
                  0);             //lpParam
      //Set font and text
      SetWndFont(aWnd[i][HWND], hGuiFont);
      SetWndText(aWnd[i][HWND], aWnd[i][TXT]);
    }

    //Hide Wait window
    ShowWaitWindow(0);

    //Set limit text of filters
    AkelPad.SendMessage(aWnd[IDFILTERCB0][HWND], 0x0141 /*CB_LIMITTEXT*/, 32, 0);
    AkelPad.SendMessage(aWnd[IDFILTERCB1][HWND], 0x0141 /*CB_LIMITTEXT*/, 32, 0);

    //Set extended UI in ComboBox Filter
    AkelPad.SendMessage(aWnd[IDFILTERCB0][HWND], 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);
    AkelPad.SendMessage(aWnd[IDFILTERCB1][HWND], 0x0155 /*CB_SETEXTENDEDUI*/, 1, 0);

    //Get handle to edit box in ComboBox Filter
    AkelPad.MemCopy(lpBuffer, _X64 ? 64 : 52 /*sizeof(COMBOBOXINFO)*/, DT_DWORD);
    oSys.Call("User32::GetComboBoxInfo", aWnd[IDFILTERCB0][HWND], lpBuffer);
    hWndFilterEdit0 = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
    oSys.Call("User32::GetComboBoxInfo", aWnd[IDFILTERCB1][HWND], lpBuffer);
    hWndFilterEdit1 = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);

    //To capture NM_RETURN and LVN_KEYDOWN in ListView
    for (i = IDFILELV0; i <= IDSTREAMLV1; ++i)
      aSubClassHand[i] = AkelPad.WindowSubClass(aWnd[i][HWND], ListCallback, 0x87 /*WM_GETDLGCODE*/, 257 /*WM_KEYUP*/);

    //Set extended style and insert columns to ListView
    InsertColumnsLV();
    SetSortInHeader(-1);

    ShowControlsInPanel();
    FillFilterList();
    FillDriveList(0);
    FillDriveList(1);
    if (! FillFileList(0, aCurDir[0][aCurDrive[0]].File))
    {
      AddCurDir(0, aCurDrive[0] + "\\");
      FillFileList(0);
    }
    if (! FillFileList(1, aCurDir[1][aCurDrive[1]].File))
    {
      AddCurDir(1, aCurDrive[1] + "\\");
      FillFileList(1);
    }
    CheckHistory();

    if (sCurrentDir)
    {
      AddCurDir(nPan, sCurrentDir + "\\");
      FillFileList(nPan);
    }
  }

  else if (uMsg === 7 /*WM_SETFOCUS*/)
  {
    oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
    QuickView(0);
    QuickView(1);
  }

  else if (uMsg === 36) //WM_GETMINMAXINFO
  {
    AkelPad.MemCopy(_PtrAdd(lParam, 24), oWndMin.W, DT_DWORD); //ptMinTrackSize_x
    AkelPad.MemCopy(_PtrAdd(lParam, 28), oWndMin.H, DT_DWORD); //ptMinTrackSize_y
  }

  else if (uMsg === 3) //WM_MOVE
  {
    if (oSys.Call("User32::IsZoomed", hWnd))
      oWndPos.Max = true;
    else
    {
      oWndPos.Max = false;
      GetWindowPos(hWnd, oWndPos);
    }
  }

  else if (uMsg === 5) //WM_SIZE
  {
    if (wParam === 2) //SIZE_MAXIMIZED
      oWndPos.Max = true;
    else
    {
      oWndPos.Max = false;
      GetWindowPos(hWnd, oWndPos);
    }
    ResizeWindow(hWnd);
  }

  else if (uMsg === 15) //WM_PAINT
  {
    PaintPanelFrame(hWnd);
  }

  else if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    if ((oSys.Call("User32::GetFocus") === hWndFilterEdit0) ||
        (oSys.Call("User32::GetFocus") === hWndFilterEdit1))
    {
      if (wParam === 27 /*VK_ESCAPE*/)
      {
        SetWndText(aWnd[IDFILTERCB0 + Number(oSys.Call("User32::GetFocus") !== hWndFilterEdit0)][HWND], aCurFilter[Number(oSys.Call("User32::GetFocus") !== hWndFilterEdit0)]);
        oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
      }
      else if (wParam === 13 /*VK_RETURN*/)
      {
        SetCurFilter(Number(oSys.Call("User32::GetFocus") !== hWndFilterEdit0));
        oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
      }
    }
  }

  else if (uMsg === 258 /*WM_CHAR*/)
  {
    if ((oSys.Call("User32::GetFocus") === aWnd[IDDRIVECB0][HWND]) ||
        (oSys.Call("User32::GetFocus") === aWnd[IDDRIVECB1][HWND]))
    {
      if (String.fromCharCode(wParam).toUpperCase() === GetDriveName(Number(oSys.Call("User32::GetFocus") === aWnd[IDDRIVECB1][HWND])).charAt(0))
        AkelPad.SendMessage(oSys.Call("User32::GetFocus"), 256 /*WM_KEYDOWN*/, 13 /*VK_RETURN*/, 0);
    }
  }

  else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
  {
    if (wParam === 0x2E /*VK_DELETE*/)
    {
      if (AkelPad.SendMessage(aWnd[IDFILTERCB0][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
        DeleteFilterCB(aWnd[IDFILTERCB0][HWND]);
      else if (AkelPad.SendMessage(aWnd[IDFILTERCB1][HWND], 0x0157 /*CB_GETDROPPEDSTATE*/, 0, 0))
        DeleteFilterCB(aWnd[IDFILTERCB1][HWND]);
    }
  }

  else if (uMsg === 0x0138) //WM_CTLCOLORSTATIC
  {
    if (lParam === aWnd[IDDIRS0 + nCurPan][HWND])
    {
      oSys.Call("Gdi32::SetTextColor", wParam, oSys.Call("User32::GetSysColor", 14 /*COLOR_HIGHLIGHTTEXT*/));
      oSys.Call("Gdi32::SetBkColor", wParam, oSys.Call("User32::GetSysColor", 13 /*COLOR_HIGHLIGHT*/));
      return oSys.Call("User32::GetSysColorBrush", 13 /*COLOR_HIGHLIGHT*/);
    }
  }

  else if ((uMsg === 0x004E /*WM_NOTIFY*/) && (wParam >= IDFILELV0) && (wParam <= IDSTREAMLV1))
  {
    switch (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8) /*code*/, DT_DWORD))
    {
      case -101 : //LVN_ITEMCHANGED
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 32 : 20), DT_DWORD) === 0x3 /*LVIS_SELECTED|LVIS_FOCUSED*/) //uNewState
        {
          if (wParam <= IDFILELV1)
            FillStreamList(wParam - IDFILELV0, aCurDir[wParam - IDFILELV0][aCurDrive[wParam - IDFILELV0]].Stream);

          QuickView((wParam - IDFILELV0) % 2);
        }
        break;

      case -3 : //NM_DBLCLK
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_DWORD) === -1) //iItem
        {
          SetCurSelLV(aWnd[wParam][HWND], GetCurFocLV(aWnd[wParam][HWND]));
          break;
        }
      case -4 : //NM_RETURN
        if ((! Ctrl()) && (! Shift()) && (! Alt()))
          Open(nCurPan, 0);
        if ((! Ctrl()) && Shift() && (! Alt()))
          OpenIn(4);
        else if (Ctrl() && (! Shift()) && (! Alt()))
          RunAkelScript(0);
        else if (Ctrl() && Shift() && (! Alt()))
          RunAkelScript(1);
        else if ((! Ctrl()) && (! Shift()) && Alt())
          Properties();
        break;

      case -2 : //NM_CLICK
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_DWORD) === -1) //iItem
          SetCurSelLV(aWnd[wParam][HWND], GetCurFocLV(aWnd[wParam][HWND]));
        break;

      case -5 : //NM_RCLICK
      case -6 : //NM_RDBLCLK
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_DWORD) === -1) //iItem
          SetCurSelLV(aWnd[wParam][HWND], GetCurFocLV(aWnd[wParam][HWND]));
        else
          ContextMenu(AkelPad.MemRead(lParam, DT_QWORD) /*hwndFrom*/, lParam + (_X64 ? 44 : 32) /*ptAction*/);
        break;

      case -155 : //LVN_KEYDOWN
        if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*wVKey*/, DT_WORD) === 9 /*VK_TAB*/) && (! Alt()))
        {
          if (Ctrl() || Shift())
            aCurWnd[nCurPan] = Number(! aCurWnd[nCurPan]);
          else if (bDualPan)
            nCurPan = Number(! nCurPan);
          oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x45 /*VK_KEY_E*/)
        {
          if ((Ctrl()) && (! Shift()) && (! Alt()))
            MainMenu();
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x70 /*VK_F1*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            MainMenu();
          else if ((! Ctrl()) && (! Shift()) && Alt())
          {
            if (bDualPan || (nCurPan === 0))
              oSys.Call("User32::SetFocus", aWnd[IDDRIVECB0][HWND]);
          }
          else if ((! Ctrl()) && Shift() && (! Alt()))
            ShowColumn(1);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            ShowPanel(0);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x71 /*VK_F2*/)
        {
          if ((! Ctrl()) && (! Shift()) && Alt())
          {
            if (bDualPan || (nCurPan === 1))
              oSys.Call("User32::SetFocus", aWnd[IDDRIVECB1][HWND]);
          }
          else if ((! Ctrl()) && (! Shift()) && (! Alt()))
            Rename();
          else if ((! Ctrl()) && Shift() && (! Alt()))
            ShowColumn(2);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            ShowPanel(1);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x72 /*VK_F3*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            OpenIn(0, 1);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            OpenIn(0, 2);
          else if (Ctrl() && Shift() && (! Alt()))
            SetExternalApp(0, 1);
          else if (Ctrl() && (! Shift()) && Alt())
            SetExternalApp(0, 2);
          else if ((! Ctrl()) && Shift() && (! Alt()))
            ShowColumn(3);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x20 /*SPACEBAR VK_SPACE*/)
        {
          if ((! Ctrl()) && Shift() && (! Alt()))
            OpenIn(0, 1);
          else if ((Ctrl()) && (! Shift()) && (! Alt()))
            OpenIn(1, 1);
          else if (Ctrl() && Shift() && (! Alt()))
            OpenIn(1, 2);
          else if (Ctrl() && Shift() && Alt())
            OpenIn(0, 2);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x73 /*VK_F4*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            OpenIn(1, 1);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            OpenIn(1, 2);
          else if (Ctrl() && Shift() && (! Alt()))
            SetExternalApp(1, 1);
          else if (Ctrl() && (! Shift()) && Alt())
            SetExternalApp(1, 2);
          else if ((! Ctrl()) && Shift() && (! Alt()))
            ShowColumn(4);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x58 /*VK_KEY_X*/)
        {
          if (Ctrl() && Shift() && (! Alt()))
            Copy(1, false);
          else if (Ctrl() && Shift() && Alt())
            AkelPad.Exec("cmd.exe", aCurDir[nCurPan][aCurDrive[nCurPan]].Path);
        }
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x74 /*VK_F5*/) &&
                 (! Ctrl()) && (! Alt()))
          Copy(0, Shift());

        //VK_F6 in ListCallback() -> Copy(1, 0)

        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x76 /*VK_F7*/) &&
                 (! Ctrl()) && (! Alt()))
          Create(! Shift());
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x4E /*VK_KEY_N*/) &&
                 (Ctrl()) && (! Alt()))
          Create(Shift());
        else if (((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x77 /*VK_F8*/) ||
                  (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x2E /*VK_DELETE*/)) &&
                 (! Ctrl()) && (! Alt()))
          Delete(! Shift());
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x78 /*VK_F9*/) &&
                 (! Ctrl()) && (! Shift()) && (! Alt()))
          RefreshPanel(2);
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x7B /*VK_F12*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            Compare(1);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            Compare(2);
          else if (Ctrl() && Shift() && (! Alt()))
            SetExternalApp(2, 1);
          else if (Ctrl() && (! Shift()) && Alt())
            SetExternalApp(2, 2);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x0D /*VK_RETURN*/)
        {
          if ((! Ctrl()) && Shift() && Alt())
            oSys.Call("User32::ShowWindow", hWndDlg, oSys.Call("User32::IsZoomed", hWndDlg) ? 9 /*SW_RESTORE*/ : 3 /*SW_MAXIMIZE*/);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x25 /*VK_LEFT*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            Open(nCurPan, -1);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            ClonePanel(0);
          else if ((! Ctrl()) && (! Shift()) && Alt())
            ChangeDirFromHistory(nCurPan, 0, -1);
          else if ((! Ctrl()) && Shift() && Alt())
            MoveDialog("L");
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x27 /*VK_RIGHT*/)
        {
          if ((! Ctrl()) && (! Shift()) && (! Alt()))
            Open(nCurPan, 1);
          else if (Ctrl() && (! Shift()) && (! Alt()))
            ClonePanel(1);
          else if ((! Ctrl()) && (! Shift()) && Alt())
            ChangeDirFromHistory(nCurPan, 0, 1);
          else if ((! Ctrl()) && Shift() && Alt())
            MoveDialog("R");
        }
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x26 /*VK_UP*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("U");
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x28 /*VK_DOWN*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("D");
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x23 /*VK_END*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("E");
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x24 /*VK_HOME*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("H");
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x21 /*VK_PRIOR*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("T");
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x22 /*VK_NEXT*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("B");
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x2D /*VK_INSERT*/)
          CopyNameToCB(Number(Ctrl()) + Number(Shift()) * 2 + Number(Alt()) * 4);
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x44 /*D key VK_KEY_D*/)
        {
          if ((! Ctrl()) && (! Shift()) && (Alt()))
          {
            EditCurrentPath();
          }
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x50 /*P key VK_KEY_P*/)
        {
          if (Ctrl() && (! Shift()) && (! Alt()))
          {
            EditCurrentPath();
          }
        }
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x31 /*1 key*/) &&
                 (! Ctrl()) && (! Shift()) && Alt())
        {
          if (bDualPan || (nCurPan === 0))
            oSys.Call("User32::SetFocus", aWnd[IDFILTERCB0][HWND]);
        }
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x32 /*2 key*/) &&
                 (! Ctrl()) && (! Shift()) && Alt())
        {
          if (bDualPan || (nCurPan === 1))
            oSys.Call("User32::SetFocus", aWnd[IDFILTERCB1][HWND]);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x43 /*C key*/)
        {
          if ((! Ctrl()) && Shift() && Alt())
            MoveDialog("C");
          else if (Ctrl() && (! Shift()) && (! Alt()))
            CopyListToCB(0);
          else if (Ctrl() && Shift() && (! Alt()))
            Copy(0, false);
          else if (Ctrl() && (! Shift()) && Alt())
            CopyListToCB(1);
          else if ((! Ctrl()) && (! Shift()) && Alt())
            CopyNameToCB(3);
        }
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x46 /*F key*/)
        {
          if ((! Ctrl()) && (! Shift()) && Alt())
            FavoriteFolders(nCurPan);
          else if (Ctrl() && (! Shift()) && (! Alt()))
          {
            if (bDualPan)
              oSys.Call("User32::SetFocus", aWnd[IDFILTERCB0 + nCurPan][HWND]);
          }
          else if (Ctrl() && Shift() && (! Alt()))
          {
            AkelPad.Call("Scripts::Main", 1, "FindReplaceFiles_extended.js", "-sDir='"+ aCurDir[nCurPan][aCurDrive[nCurPan]].Path +"'");
            AkelPad.Call("Scripts::Main", 1, "FindReplaceFiles_extended.js");
          }
          else if ((! Ctrl()) && Shift() && Alt())
          {
            if (! fso.FileExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File) && aCurDir[nCurPan][aCurDrive[nCurPan]].File !== "..")
            {
              var sNewPath = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File;
              AkelPad.Call("Scripts::Main", 1, "FindFiles_extended.js", "-sDir='"+ sNewPath +"' -sName='*'");
              AkelPad.Call("Scripts::Main", 1, "FindFiles_extended.js");
            }
            else
            {
              AkelPad.Call("Scripts::Main", 1, "FindFiles_extended.js", "-sDir='"+ aCurDir[nCurPan][aCurDrive[nCurPan]].Path +"' -sName='"+ aCurDir[nCurPan][aCurDrive[nCurPan]].File +"'");
              AkelPad.Call("Scripts::Main", 1, "FindFiles_extended.js");
            }
          }
        }
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x48 /*H key*/) &&
                 (! Ctrl()) && (! Shift()) && Alt())
          History(nCurPan);
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x4D /*M key*/) &&
                 (! Ctrl()) && Shift() && Alt())
          MoveDialog("M");
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x51 /*Q key*/) &&
                 Ctrl() && (! Shift()) && (! Alt()))
          ShowQuickView();
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x20 /*SPACEBAR key VK_SPACE*/) &&
                 Ctrl() && (! Shift()) && (! Alt()))
          ShowQuickView();
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x53 /*S key*/) &&
                 (! Ctrl()) && (! Shift()) && Alt())
          SpecialFolders(nCurPan);
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x55 /*U key*/) &&
                 Ctrl() && (! Shift()) && (! Alt()))
          SwapPanels();
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0xDC /*VK_OEM_4 === backslash*/) &&
                 Ctrl() && (! Shift()) && (! Alt()))
          Open(nCurPan, -2);
        else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 0x5D /*VK_APPS*/)
          ContextMenu(AkelPad.MemRead(lParam, DT_QWORD) /*hwndFrom*/);
        else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_WORD) === 27 /*VK_ESCAPE*/) &&
                 (! Ctrl()) && (! Shift()) && (! Alt()))
          oSys.Call("User32::PostMessageW", hWnd, 16 /*WM_CLOSE*/, 0, 0);
        break;

      case -12 : //NM_CUSTOMDRAW
        if ((wParam === IDFILELV0 + Number(! nCurPan) + aCurWnd[Number(! nCurPan)] * 2) ||
            ((wParam === IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2) &&
             (oSys.Call("User32::GetFocus") !== aWnd[IDFILELV0][HWND]) &&
             (oSys.Call("User32::GetFocus") !== aWnd[IDFILELV1][HWND]) &&
             (oSys.Call("User32::GetFocus") !== aWnd[IDSTREAMLV0][HWND]) &&
             (oSys.Call("User32::GetFocus") !== aWnd[IDSTREAMLV1][HWND])))
        {
          AkelPad.MemCopy(_PtrAdd(lParam, _X64 ? 64 : 40) /*uItemState*/, 0x20 /*CDIS_DEFAULT*/, DT_DWORD);

          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*dwDrawStage*/, DT_DWORD) === 0x1 /*CDDS_PREPAINT*/)
            return 0x20; //CDRF_NOTIFYITEMDRAW
          else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_DWORD) === 0x10001 /*CDDS_ITEMPREPAINT*/)
            return 0x20; //CDRF_NOTIFYSUBITEMDRAW
          else if ((AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12), DT_DWORD) === 0x30001 /*CDDS_ITEMPREPAINT|CDDS_SUBITEM*/) &&
                   (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 56 : 36) /*dwItemSpec*/, DT_DWORD) === GetCurSelLV(aWnd[wParam][HWND])))
          {
            if (wParam === IDFILELV0 + Number(! nCurPan) + aCurWnd[Number(! nCurPan)] * 2)
            {
              AkelPad.MemCopy(_PtrAdd(lParam, _X64 ? 80 : 48) /*clrText*/, oSys.Call("User32::GetSysColor", 3 /*COLOR_INACTIVECAPTION*/), DT_DWORD);
              AkelPad.MemCopy(_PtrAdd(lParam, _X64 ? 84 : 52) /*clrTextBk*/, oSys.Call("User32::GetSysColor", 19 /*COLOR_INACTIVECAPTIONTEXT*/), DT_DWORD);
            }
            else
            {
              AkelPad.MemCopy(_PtrAdd(lParam, _X64 ? 80 : 48) /*clrText*/, oSys.Call("User32::GetSysColor", 14 /*COLOR_HIGHLIGHTTEXT*/), DT_DWORD);
              AkelPad.MemCopy(_PtrAdd(lParam, _X64 ? 84 : 52) /*clrTextBk*/, oSys.Call("User32::GetSysColor", 13 /*COLOR_HIGHLIGHT*/), DT_DWORD);
            }
            return 0x10; //CDRF_NOTIFYPOSTPAINT
          }
        }
        break;

      case -7 : //NM_SETFOCUS
        nCurPan = (wParam - IDFILELV0) % 2;
        aCurWnd[nCurPan] = Number(wParam > IDFILELV1);

        SetWndText(aWnd[IDDIRS0 + Number(! nCurPan)][HWND], aCurDir[Number(! nCurPan)][aCurDrive[Number(! nCurPan)]].Path);
        SetWndText(aWnd[IDDIRS0 + nCurPan][HWND], aCurDir[nCurPan][aCurDrive[nCurPan]].Path);

        for (var i = IDFILELV0; i <= IDSTREAMLV1; ++i)
          AkelPad.SendMessage(aWnd[i][HWND], 0x1015 /*LVM_REDRAWITEMS*/, GetCurSelLV(aWnd[i][HWND]), GetCurSelLV(aWnd[i][HWND]));

        QuickView(nCurPan);
        break;

      case -108 : //LVN_COLUMNCLICK
        if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 28 : 16) /*iSubItem*/, DT_DWORD) < 4)
        {
          SetSortInHeader(AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 8 : 4) /*idFrom*/, DT_QWORD), AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 28 : 16) /*iSubItem*/, DT_DWORD));
          SortList(AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 8 : 4) /*idFrom*/, DT_QWORD));
        }
    }
  }

  else if (uMsg === 273) //WM_COMMAND
  {
    var nLowParam = LoWord(wParam);
    var nHiwParam = HiWord(wParam);

    if ((nLowParam === IDDRIVECB0) || (nLowParam === IDDRIVECB1))
    {
      if (nHiwParam === 3 /*CBN_SETFOCUS*/)
      {
        FillDriveList(nLowParam - IDDRIVECB0);
        oSys.Call("User32::PostMessageW", lParam, 0x014F /*CB_SHOWDROPDOWN*/, 1, 0);
      }
      else if (nHiwParam === 9 /*CBN_SELENDOK*/)
      {
        if (ChangeDrive(nLowParam - IDDRIVECB0))
          oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
      }
      else if (nHiwParam === 10 /*CBN_SELENDCANCEL*/)
      {
        oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
        SelCurDriveCB(nLowParam - IDDRIVECB0);
      }
    }
    else if ((nLowParam === IDFILTERCB0) || (nLowParam === IDFILTERCB1))
    {
      if (nHiwParam === 3 /*CBN_SETFOCUS*/)
      {
        AkelPad.SendMessage(lParam, 0x0142 /*CB_SETEDITSEL*/, 0, MkLong(0, -1));
        oSys.Call("User32::PostMessageW", lParam, 0x014F /*CB_SHOWDROPDOWN*/, 1, 0);
      }
      else if (nHiwParam === 4 /*CBN_KILLFOCUS*/)
      {
        SetCurFilter(nLowParam - IDFILTERCB0);
        oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
      }
    }
    else if ((nLowParam >= IDMAINDIRB0) && (nLowParam <= IDCOMPAREB))
    {
      AkelPad.SendMessage(lParam, 0x00F4 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 0);

      if ((nLowParam === IDMAINDIRB0) || (nLowParam === IDMAINDIRB1))
        Open(nLowParam - IDMAINDIRB0, -2);
      else if ((nLowParam === IDUPDIRB0) || (nLowParam === IDUPDIRB1))
        Open(nLowParam - IDUPDIRB0, -1);
      else if ((nLowParam === IDFAVFOLDB0) || (nLowParam === IDFAVFOLDB1))
        FavoriteFolders(nLowParam - IDFAVFOLDB0);
      else if ((nLowParam === IDSPECFOLDB0) || (nLowParam === IDSPECFOLDB1))
        SpecialFolders(nLowParam - IDSPECFOLDB0);
      else if ((nLowParam === IDHISTORYB0) || (nLowParam === IDHISTORYB1))
        History(nLowParam - IDHISTORYB0);
      else if ((nLowParam === IDLEFTB) || (nLowParam === IDRIGHTB))
        ClonePanel(nLowParam - IDLEFTB)
      else if (nLowParam === IDMENUB)
        MainMenu();
      else if (nLowParam === IDRENAMEB)
        Rename();
      else if (nLowParam === IDVIEWB)
        OpenIn(0, 1);
      else if (nLowParam === IDEDITB)
        OpenIn(1, 1);
      else if (nLowParam === IDCOPYB)
        Copy(0, 0);
      else if (nLowParam === IDMOVEB)
        Copy(1, 0);
      else if (nLowParam === IDCREATEB)
        Create(1);
      else if (nLowParam === IDDELETEB)
        Delete(1);
      else if (nLowParam === IDREFRESHB)
        RefreshPanel(2);
      else if (nLowParam === IDCOMPAREB)
        Compare(1);

      oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
    }
  }

  else if (uMsg === 123) //WM_CONTEXTMENU
  {
    switch (wParam)
    {
      case aWnd[IDVIEWB][HWND] : OpenIn(0, 2);
        break;
      case aWnd[IDEDITB][HWND] : OpenIn(1, 2);
        break;
      case aWnd[IDCOPYB][HWND] : Copy(0, 1);
        break;
      case aWnd[IDCREATEB][HWND] : Create(0);
        break;
      case aWnd[IDDELETEB][HWND] : Delete(0);
        break;
      case aWnd[IDCOMPAREB][HWND] : Compare(2);
    }
  }

  else if (uMsg === 16) //WM_CLOSE
  {
    for (var i = IDFILELV0; i <= IDSTREAMLV1; ++i)
      AkelPad.WindowUnsubClass(aWnd[i][HWND]);

    ReadWriteIni(true);
    oSys.Call("User32::DestroyWindow", hWnd); //Destroy dialog
  }

  else if (uMsg === 2) //WM_DESTROY
    oSys.Call("User32::PostQuitMessage", 0); //Exit message loop

  return 0;
}

function ListCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg === 0x87) //WM_GETDLGCODE
  {
    AkelPad.WindowNoNextProc(aSubClassHand[oSys.Call("User32::GetDlgCtrlID", hWnd)]);
    return 0x4; //DLGC_WANTALLKEYS
  }
  else if ((uMsg === 257 /*WM_KEYUP*/) && (wParam === 0x75 /*VK_F6*/) &&
           (! Ctrl()) && (! Shift()) && (! Alt()))
    Copy(1, 0);

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

function Shift()
{
  return Boolean(oSys.Call("User32::GetKeyState", 0x10 /*VK_SHIFT*/) & 0x8000);
}

function Ctrl()
{
  return Boolean(oSys.Call("User32::GetKeyState", 0x11 /*VK_CONTROL*/) & 0x8000);
}

function Alt()
{
  return Boolean(oSys.Call("User32::GetKeyState", 0x12 /*VK_MENU*/) & 0x8000);
}

function PaintPanelFrame(hWnd)
{
  var lpPaint = AkelPad.MemAlloc(_X64 ? 72 : 64); //sizeof(PAINTSTRUCT)
  var lpRect  = AkelPad.MemAlloc(16); //sizeof(RECT)
  var hDC     = oSys.Call("User32::BeginPaint", hWnd, lpPaint);
  var nW;
  var nH;

  oSys.Call("User32::GetClientRect", hWnd, lpRect);
  nW = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD);
  nH = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD);

  AkelPad.MemCopy(_PtrAdd(lpRect,  0), 2, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpRect,  4), 5, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpRect,  8), (bDualPan ? Math.round(nW / 2) : nW) - 2, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpRect, 12), nH - 21 - 7, DT_DWORD);
  oSys.Call("User32::DrawEdge", hDC, lpRect, 0x9 /*EDGE_BUMP*/, 0x800F /*BF_MONO|BF_RECT*/);

  if (bDualPan)
  {
    AkelPad.MemCopy(lpRect, nW - Math.round(nW / 2) + 2, DT_DWORD);
    AkelPad.MemCopy(_PtrAdd(lpRect, 8), nW - 2, DT_DWORD);
    oSys.Call("User32::DrawEdge", hDC, lpRect, 0x9 /*EDGE_BUMP*/, 0x800F /*BF_MONO|BF_RECT*/);
  }

  oSys.Call("User32::EndPaint", hWnd, lpPaint);

  AkelPad.MemFree(lpPaint);
  AkelPad.MemFree(lpRect);
}

function ResizeWindow(hWnd)
{
  var lpRect    = AkelPad.MemAlloc(16); //sizeof(RECT)
  var aRect     = [{}, {}];
  var aColWidth = [0, 0, 0, 0];
  var nW, nH;
  var i, n;

  oSys.Call("User32::GetClientRect", hWnd, lpRect);
  nW = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD);
  nH = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD);
  AkelPad.MemFree(lpRect);

  aRect[0].X = 2;
  aRect[0].Y = 5;
  aRect[0].W = (bDualPan ? Math.round(nW / 2) : nW) - 2;
  aRect[0].H = nH - 21 - 7;
  aRect[1].X = bDualPan ? (nW - Math.round(nW / 2) + 2) : 2;
  aRect[1].Y = aRect[0].Y;
  aRect[1].W = nW - 2;
  aRect[1].H = aRect[0].H;

  for (i = IDDRIVECB0; i <= IDDRIVECB1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDDRIVECB0].X + 3,
              10,
              37,
              21,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDMAINDIRB0; i <= IDRIGHTB; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[(i - IDMAINDIRB0) % 2].X + 42 + 21 * (((i - IDMAINDIRB0) - (i - IDMAINDIRB0) % 2) / 2),
              10,
              21,
              21,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDFILTERS0; i <= IDFILTERS1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDFILTERS0].W - 55 - 100 - 5,
              13,
              55,
              13,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDFILTERCB0; i <= IDFILTERCB1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDFILTERCB0].W - 100 - 3,
              10,
              100,
              21,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDDIRS0; i <= IDDIRS1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDDIRS0].X,
              35,
              aRect[i - IDDIRS0].W - aRect[i - IDDIRS0].X,
              16,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDFILELV0; i <= IDFILELV1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDFILELV0].X,
              50,
              aRect[i - IDFILELV0].W - aRect[i - IDFILELV0].X,
              aRect[i - IDFILELV0].H - (bQuickView ? 224 : 224 - 68),
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDSTREAMLV0; i <= IDSTREAMLV1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDSTREAMLV0].X,
              aRect[i - IDSTREAMLV0].H - (bQuickView ? 175 : 175 - 68),
              aRect[i - IDSTREAMLV0].W - aRect[i - IDSTREAMLV0].X,
              108,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDQUICKVIEWS0; i <= IDQUICKVIEWS1; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              aRect[i - IDQUICKVIEWS0].X,
              aRect[i - IDQUICKVIEWS0].H - 68,
              aRect[i - IDQUICKVIEWS0].W - aRect[i - IDQUICKVIEWS0].X,
              68,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  for (i = IDMENUB; i <= IDCOMPAREB; ++i)
    oSys.Call("User32::SetWindowPos",
              aWnd[i][HWND], 0,
              2 + (i - IDMENUB) * ((nW - (IDCOMPAREB - IDMENUB + 2) * 2) / (IDCOMPAREB - IDMENUB + 1) + 2),
              nH - 21 - 2,
              (nW - (IDCOMPAREB - IDMENUB + 2) * 2) / (IDCOMPAREB - IDMENUB + 1),
              21,
              0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  oSys.Call("User32::SetWindowPos",
            aWnd[IDWAIT][HWND], 0,
            nW / 2 - 140,
            nH / 2 - 50,
            280,
            100,
            0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);

  if (bColSize)
    aColWidth[1] = 72;
  if (bColTime)
    aColWidth[2] = 96;
  if (bColAttr)
    aColWidth[3] = 52;

  for (i = IDFILELV0; i <= IDFILELV1; ++i)
  {
    aColWidth[0] = aRect[i - IDFILELV0].W - aRect[i - IDFILELV0].X - aColWidth[1] - aColWidth[2] - aColWidth[3] - 17;

    for (n = 0; n < 4; ++n)
      AkelPad.SendMessage(aWnd[i][HWND], 0x101E /*LVM_SETCOLUMNWIDTH*/, n, aColWidth[n]);
  }

  for (i = IDSTREAMLV0; i <= IDSTREAMLV1; ++i)
  {
    aColWidth[0] = aRect[i - IDSTREAMLV0].W - aRect[i - IDSTREAMLV0].X - aColWidth[1] - 17;

    for (n = 0; n < 2; ++n)
      AkelPad.SendMessage(aWnd[i][HWND], 0x101E /*LVM_SETCOLUMNWIDTH*/, n, aColWidth[n]);
  }

  for (i = IDFILELV0; i <= IDSTREAMLV1; ++i)
    AkelPad.SendMessage(aWnd[i][HWND], 0x1013 /*LVM_ENSUREVISIBLE*/, GetCurSelLV(aWnd[i][HWND]), false);

  oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}

function ShowControlsInPanel()
{
  var bVisible;

  if (bDualPan || (nCurPan === 0))
    bVisible = 1;
  else
    bVisible = 0;

  for (i = IDFILTERS0; i <= IDLEFTB; i += 2)
    oSys.Call("User32::ShowWindow", aWnd[i][HWND], (i === IDQUICKVIEWS0) ? (bVisible && bQuickView) : bVisible);

  if (bDualPan || (nCurPan === 1))
    bVisible = 1;
  else
    bVisible = 0;

  for (i = IDFILTERS1; i <= IDRIGHTB; i += 2)
    oSys.Call("User32::ShowWindow", aWnd[i][HWND], (i === IDQUICKVIEWS1) ? (bVisible && bQuickView) : bVisible);
}

function ShowPanel(nPan)
{
  if (bDualPan || (nPan !== nCurPan))
  {
    var nFrameX = oSys.Call("User32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/);
    var oRect   = {};

    GetWindowPos(hWndDlg, oRect);

    bDualPan = ! bDualPan;

    if (nPan === nCurPan)
    {
      nCurPan = Number(! nCurPan);
      oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
    }

    if (bDualPan)
    {
      if (nCurPan === 1)
        oRect.X = (oRect.X + oRect.W) - 2 * (oRect.W - nFrameX);

      oRect.W   = 2 * (oRect.W - nFrameX);
      oWndMin.W = 2 * (oWndMin.W - nFrameX);
    }
    else
    {
      if (nCurPan === 1)
        oRect.X = (oRect.X + oRect.W) - (Math.round((oRect.W - 2 * nFrameX) / 2) + 2 * nFrameX);

      oRect.W   = Math.round((oRect.W - 2 * nFrameX) / 2) + 2 * nFrameX;
      oWndMin.W = Math.round((oWndMin.W - 2 * nFrameX) / 2) + 2 * nFrameX;
    }

    oSys.Call("User32::MoveWindow", hWndDlg, oRect.X, oRect.Y, oRect.W, oRect.H, 1);
    ShowControlsInPanel();
    oSys.Call("User32::InvalidateRect", hWndDlg, 0, true);
    ResizeWindow(hWndDlg);
  }
}

function ShowQuickView()
{
  bQuickView = ! bQuickView;

  QuickView(0);
  QuickView(1);

  ShowControlsInPanel();
  ResizeWindow(hWndDlg);
}

function ShowColumn(nCol)
{
  if (nCol === 1)
  {
    if (bColSize || bColTime || bColAttr)
    {
      bColSize = false;
      bColTime = false;
      bColAttr = false;
    }
    else
    {
      bColSize = true;
      bColTime = true;
      bColAttr = true;
    }
  }
  else if (nCol === 2)
    bColSize = ! bColSize;
  else if (nCol === 3)
    bColTime = ! bColTime;
  else if (nCol === 4)
    bColAttr = ! bColAttr;

  ResizeWindow(hWndDlg);
}

function MoveDialog(sAction)
{
  if (sAction === "M")
  {
    if (oSys.Call("User32::IsZoomed", hWndDlg))
      oSys.Call("User32::ShowWindow", hWndDlg, 9 /*SW_RESTORE*/);
    else
      oSys.Call("User32::ShowWindow", hWndDlg, 3 /*SW_MAXIMIZE*/);
  }

  else if (! oSys.Call("User32::IsZoomed", hWndDlg))
  {
    var oRectDesk = {};
    var oRect     = {};

    GetWindowPos(oSys.Call("User32::GetDesktopWindow"), oRectDesk);
    GetWindowPos(hWndDlg, oRect);

    if (sAction === "R") //Right
      oRect.X = oRect.X + ((oRect.X < oRectDesk.X + oRectDesk.W - 50) ? 20 : 0);
    else if (sAction === "L") //Left
      oRect.X = oRect.X - ((oRect.X + oRect.W > oRectDesk.X + 50) ? 20 : 0);
    else if (sAction === "D") //Down
      oRect.Y = oRect.Y + ((oRect.Y < oRectDesk.Y + oRectDesk.H - 50) ? 20 : 0);
    else if (sAction === "U") //Up
      oRect.Y = oRect.Y - ((oRect.Y + oRect.H > oRectDesk.Y + 50) ? 20 : 0);
    else if (sAction === "E") //End (to right edge)
      oRect.X = oRectDesk.X + oRectDesk.W - oRect.W;
    else if (sAction === "H") //Home (to left edge)
      oRect.X = oRectDesk.X;
    else if (sAction === "B") //Bottom edge
      oRect.Y = oRectDesk.Y + oRectDesk.H - oRect.H;
    else if (sAction === "T") //Top edge
      oRect.Y = oRectDesk.Y;
    else if (sAction === "C") //Center
    {
      oRect.X = oRectDesk.X + (oRectDesk.W - oRect.W) / 2;
      oRect.Y = oRectDesk.Y + (oRectDesk.H - oRect.H) / 2;
    }

    oSys.Call("User32::SetWindowPos", hWndDlg, 0, oRect.X, oRect.Y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
  }
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

function GetControlPos(hWnd, hControl, oRect)
{
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("User32::GetWindowRect", hControl, lpRect);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpRect, 0), DT_DWORD);
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpRect, 4), DT_DWORD);

  oSys.Call("User32::ScreenToClient", hWnd, lpRect);
  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect, 0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect, 4), DT_DWORD);

  AkelPad.MemFree(lpRect);
}

function SetWndFont(hWnd, hFont)
{
  AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, hFont, true);
}

function SetWndText(hWnd, sText)
{
  oSys.Call("User32::SetWindowTextW", hWnd, sText);
}

function ShowWaitWindow(bShow)
{
  oSys.Call("User32::ShowWindow", aWnd[IDWAIT][HWND], bShow);

  if (bShow)
    SetWndText(aWnd[IDWAIT][HWND], "\n\n\n" + sTxtWait);
}

function InsertColumnsLV()
{
  var lpLVCOLUMN = AkelPad.MemAlloc(_X64 ? 56 : 44) //sizeof(LVCOLUMN)
  var nMask      = 7; //LVCF_FMT|LVCF_WIDTH|LVCF_TEXT
  var aFmt       = [0 /*LVCFMT_LEFT*/, 1 /*LVCFMT_RIGHT*/, 0, 0, 0]; //Alignment of the column header
  var aText      = [AkelPad.MemStrPtr(sTxtFileName), AkelPad.MemStrPtr(sTxtSize), AkelPad.MemStrPtr(sTxtTime), AkelPad.MemStrPtr(sTxtAttrib), AkelPad.MemStrPtr("")];
  var i, n;

  AkelPad.MemCopy(lpLVCOLUMN, nMask, DT_DWORD);

  for (i = IDFILELV0; i <= IDFILELV1; ++i)
  {
    AkelPad.SendMessage(aWnd[i][HWND], 0x1036 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0x0020 /*LVS_EX_FULLROWSELECT*/, 0x0020);

    for (n = 0; n < aFmt.length; ++n)
    {
      AkelPad.MemCopy(_PtrAdd(lpLVCOLUMN, 4), aFmt[n], DT_DWORD);
      AkelPad.MemCopy(_PtrAdd(lpLVCOLUMN, _X64 ? 16 : 12), aText[n], DT_QWORD);

      AkelPad.SendMessage(aWnd[i][HWND], 0x1061 /*LVM_INSERTCOLUMNW*/, n, lpLVCOLUMN);
    }
  }

  aFmt  = aFmt.slice(0,2);
  aText = [AkelPad.MemStrPtr(sTxtStrName), AkelPad.MemStrPtr(sTxtSize)];

  for (i = IDSTREAMLV0; i <= IDSTREAMLV1; ++i)
  {
    AkelPad.SendMessage(aWnd[i][HWND], 0x1036 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0x0020 /*LVS_EX_FULLROWSELECT*/, 0x0020);

    for (n = 0; n < aFmt.length; ++n)
    {
      AkelPad.MemCopy(_PtrAdd(lpLVCOLUMN, 4), aFmt[n], DT_DWORD);
      AkelPad.MemCopy(_PtrAdd(lpLVCOLUMN, _X64 ? 16 : 12), aText[n], DT_QWORD);

      AkelPad.SendMessage(aWnd[i][HWND], 0x1061 /*LVM_INSERTCOLUMNW*/, n, lpLVCOLUMN);
    }
  }

  AkelPad.MemFree(lpLVCOLUMN);
}

function SetSortInHeader(nID, nCol)
{
  var HDF_SORTDOWN = 0x0200;
  var HDF_SORTUP   = 0x0400;
  var lpHDITEM     = AkelPad.MemAlloc(_X64 ? 72 : 48); //sizeof(HDITEM)
  var hHeader;
  var nFmt;

  AkelPad.MemCopy(lpHDITEM, 0x04 | 0x02 /*HDI_FORMAT|HDI_TEXT*/, DT_DWORD); //mask
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, 8), lpBuffer, DT_QWORD); //pszText
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 24 : 16), nBufSize, DT_DWORD); //cchTextMax

  if (nID === -1)
  {
    for (nID = IDFILELV0; nID <= IDSTREAMLV1; ++nID)
    {
      hHeader = AkelPad.SendMessage(aWnd[nID][HWND], 0x101F /*LVM_GETHEADER*/, 0, 0);

      for (nCol = 0; nCol < AkelPad.SendMessage(hHeader, 0x1200 /*HDM_GETITEMCOUNT*/, 0, 0) - ((nID <= IDFILELV1) ? 1 : 0); ++nCol)
      {
        AkelPad.SendMessage(hHeader, 0x120B /*HDM_GETITEMW*/, nCol, lpHDITEM);

        nFmt = AkelPad.MemRead(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), DT_DWORD); //fmt
        if (nFmt & HDF_SORTDOWN)
          nFmt ^= HDF_SORTDOWN;
        if (nFmt & HDF_SORTUP)
          nFmt ^= HDF_SORTUP;

        if (aSort[nID - IDFILELV0][0] === nCol)
          nFmt |= aSort[nID - IDFILELV0][1] ? HDF_SORTDOWN : HDF_SORTUP;

        AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), nFmt, DT_DWORD);
        AkelPad.SendMessage(hHeader, 0x120C /*HDM_SETITEMW*/, nCol, lpHDITEM);
      }
    }
  }
  else
  {
    hHeader = AkelPad.SendMessage(aWnd[nID][HWND], 0x101F /*LVM_GETHEADER*/, 0, 0);

    AkelPad.SendMessage(hHeader, 0x120B /*HDM_GETITEMW*/, aSort[nID - IDFILELV0][0], lpHDITEM);

    nFmt = AkelPad.MemRead(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), DT_DWORD); //fmt
    if (nFmt & HDF_SORTDOWN)
      nFmt ^= HDF_SORTDOWN;
    if (nFmt & HDF_SORTUP)
      nFmt ^= HDF_SORTUP;

    AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), nFmt, DT_DWORD);
    AkelPad.SendMessage(hHeader, 0x120C /*HDM_SETITEMW*/, aSort[nID - IDFILELV0][0], lpHDITEM);

    if (aSort[nID - IDFILELV0][0] === nCol)
      aSort[nID - IDFILELV0][1] = Number(! aSort[nID - IDFILELV0][1]);
    else
    {
      aSort[nID - IDFILELV0][0] = nCol;
      aSort[nID - IDFILELV0][1] = 0;
    }

    AkelPad.SendMessage(hHeader, 0x120B /*HDM_GETITEMW*/, nCol, lpHDITEM);

    nFmt = AkelPad.MemRead(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), DT_DWORD); //fmt
    AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), nFmt | ((aSort[nID - IDFILELV0][1]) ? HDF_SORTDOWN : HDF_SORTUP), DT_DWORD);
    AkelPad.SendMessage(hHeader, 0x120C /*HDM_SETITEMW*/, nCol, lpHDITEM);
  }

  AkelPad.MemFree(lpHDITEM);
}

function SortList(nID)
{
  var lpCallback;

  if (aSort[nID - IDFILELV0][0] === 0)
    lpCallback = oSys.RegisterCallback(CompareNameCallback);
  else if (aSort[nID - IDFILELV0][0] === 1)
    lpCallback = oSys.RegisterCallback(CompareSizeCallback);
  else if (aSort[nID - IDFILELV0][0] === 2)
    lpCallback = oSys.RegisterCallback(CompareTimeCallback);
  else
    lpCallback = oSys.RegisterCallback(CompareAttrCallback);

  hWndSort = aWnd[nID][HWND];

  AkelPad.SendMessage(hWndSort, 0x1051 /*LVM_SORTITEMSEX*/, aSort[nID - IDFILELV0][1], lpCallback);

  AkelPad.SendMessage(hWndSort, 0x1013 /*LVM_ENSUREVISIBLE*/, GetCurSelLV(hWndSort), false);

  oSys.UnregisterCallback(lpCallback);
}

function CompareNameCallback(nItem1, nItem2, bDescending)
{
  var sName1  = GetTextLV(hWndSort, nItem1, 0);
  var sName2  = GetTextLV(hWndSort, nItem2, 0);
  var bIsDir1 = (GetTextLV(hWndSort, nItem1, 1).substr(0, 1) === "<");
  var bIsDir2 = (GetTextLV(hWndSort, nItem2, 1).substr(0, 1) === "<");

  if ((sName1 === "..") || ((bIsDir1) && (! bIsDir2)))
    return -1;
  else if ((sName2 === "..") || ((! bIsDir1) && (bIsDir2)))
    return 1;
  else
  {
    if (sName1 === sTxtMainStream)
      sName1 = "";
    if (sName2 === sTxtMainStream)
      sName2 = "";
    return (bDescending ? -1 : 1) * oSys.Call("Kernel32::lstrcmpiW", sName1, sName2);
  }
}

function CompareSizeCallback(nItem1, nItem2, bDescending)
{
  var sName1  = GetTextLV(hWndSort, nItem1, 0);
  var sName2  = GetTextLV(hWndSort, nItem2, 0);
  var sSize1  = GetTextLV(hWndSort, nItem1, 1);
  var sSize2  = GetTextLV(hWndSort, nItem2, 1);
  var bIsDir1 = (sSize1.substr(0, 1) === "<");
  var bIsDir2 = (sSize2.substr(0, 1) === "<");

  if ((sName1 === "..") || ((bIsDir1) && (! bIsDir2)))
    return -1;
  else if ((sName2 === "..") || ((! bIsDir1) && (bIsDir2)))
    return 1;
  else if (bIsDir1 && bIsDir2)
    return oSys.Call("Kernel32::lstrcmpiW", sName1, sName2);
  else
  {
    if (Number(sSize1) < Number(sSize2))
      return (bDescending ? 1 : -1);
    else if (Number(sSize1) > Number(sSize2))
      return (bDescending ? -1 : 1);
    else
    {
      if (sName1 === sTxtMainStream)
        sName1 = "";
      if (sName2 === sTxtMainStream)
        sName2 = "";
      return oSys.Call("Kernel32::lstrcmpiW", sName1, sName2);
    }
  }
}

function CompareTimeCallback(nItem1, nItem2, bDescending)
{
  var sName1  = GetTextLV(hWndSort, nItem1, 0);
  var sName2  = GetTextLV(hWndSort, nItem2, 0);
  var nTime1  = parseInt(GetTextLV(hWndSort, nItem1, 4), 16);
  var nTime2  = parseInt(GetTextLV(hWndSort, nItem2, 4), 16);
  var bIsDir1 = (GetTextLV(hWndSort, nItem1, 1).substr(0, 1) === "<");
  var bIsDir2 = (GetTextLV(hWndSort, nItem2, 1).substr(0, 1) === "<");

  if ((sName1 === "..") || ((bIsDir1) && (! bIsDir2)))
    return -1;
  else if ((sName2 === "..") || ((! bIsDir1) && (bIsDir2)))
    return 1;
  else
  {
    if (nTime1 < nTime2)
      return (bDescending ? 1 : -1);
    else if (nTime1 > nTime2)
      return (bDescending ? -1 : 1);
    else
      return oSys.Call("Kernel32::lstrcmpiW", sName1, sName2);
  }
}

function CompareAttrCallback(nItem1, nItem2, bDescending)
{
  var sName1  = GetTextLV(hWndSort, nItem1, 0);
  var sName2  = GetTextLV(hWndSort, nItem2, 0);
  var sAttr1  = GetTextLV(hWndSort, nItem1, 3);
  var sAttr2  = GetTextLV(hWndSort, nItem2, 3);
  var bIsDir1 = (GetTextLV(hWndSort, nItem1, 1).substr(0, 1) === "<");
  var bIsDir2 = (GetTextLV(hWndSort, nItem2, 1).substr(0, 1) === "<");

  if ((sName1 === "..") || ((bIsDir1) && (! bIsDir2)))
    return -1;
  else if ((sName2 === "..") || ((! bIsDir1) && (bIsDir2)))
    return 1;
  else
  {
    if (sAttr1 < sAttr2)
      return (bDescending ? 1 : -1);
    else if (sAttr1 > sAttr2)
      return (bDescending ? -1 : 1);
    else
      return oSys.Call("Kernel32::lstrcmpiW", sName1, sName2);
  }
}

function GetItemCountLV(hWndLV)
{
  return AkelPad.SendMessage(hWndLV, 0x1004 /*LVM_GETITEMCOUNT*/, 0, 0);
}

function GetCurFocLV(hWndLV)
{
  return AkelPad.SendMessage(hWndLV, 0x100C /*LVM_GETNEXTITEM*/, -1, 0x0001 /*LVNI_FOCUSED*/);
}

function GetCurSelLV(hWndLV)
{
  return AkelPad.SendMessage(hWndLV, 0x100C /*LVM_GETNEXTITEM*/, -1, 0x0002 /*LVNI_SELECTED*/);
}

function SetCurSelLV(hWndLV, nItem)
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12 /*state*/),     0x0003 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16 /*stateMask*/), 0x0003 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD);
  AkelPad.SendMessage(hWndLV, 0x102B /*LVM_SETITEMSTATE*/, nItem, lpLVITEM);
  AkelPad.SendMessage(hWndLV, 0x1013 /*LVM_ENSUREVISIBLE*/, nItem, false);
}

function GetTextLV(hWndLV, nItem, nSubItem)
{
  var result;
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8 /*iSubItem*/), nSubItem, DT_DWORD);
  AkelPad.SendMessage(hWndLV, 0x1073 /*LVM_GETITEMTEXTW*/, nItem, lpLVITEM);

  result = AkelPad.MemRead(lpBuffer, _TSTR);
  if (~result.indexOf(ICONFOLDER))
    result = result.replace(ICONFOLDER, "");

  return result;
}

function InsertItemLV(hWndLV, nItem, aItems)
{
  var i;

  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 4), nItem, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8),     0, DT_DWORD);
  AkelPad.MemCopy(lpBuffer, aItems[0], _TSTR);
  AkelPad.SendMessage(hWndLV, 0x104D /*LVM_INSERTITEMW*/, 0, lpLVITEM);

  aItems[0] = aItems[0].replace(ICONFOLDER, "");
  for (i = 1; i < aItems.length; ++i)
  {
    AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8), i, DT_DWORD);
    AkelPad.MemCopy(lpBuffer, aItems[i], _TSTR);
    AkelPad.SendMessage(hWndLV, 0x1074 /*LVM_SETITEMTEXTW*/, nItem, lpLVITEM);
  }
}

function RefreshPanel(nPan)
{
  var nStart = nPan;
  var nEnd   = nPan;
  var nSelPosFile;
  var nSelPosStr;
  var i;

  if (nPan === 2)
  {
    nStart = 0;
    nEnd   = 1;
  }

  for (i = nStart; i <= nEnd; ++i)
  {
    nSelPosFile = GetCurSelLV(aWnd[IDFILELV0 + i][HWND]);
    nSelPosStr  = GetCurSelLV(aWnd[IDSTREAMLV0 + i][HWND]);

    FillDriveList(i);
    GetCurFile(i);
    SetWndText(aWnd[IDDIRS0 + i][HWND], aCurDir[i][aCurDrive[i]].Path);
    FillFileList(i, aCurDir[i][aCurDrive[i]].File, nSelPosFile);
    FillStreamList(i, aCurDir[i][aCurDrive[i]].Stream, nSelPosStr);
    QuickView(i);
  }
}

function RefreshStreamList(nPan)
{
  GetCurFile(nPan);
  FillStreamList(nPan, aCurDir[nPan][aCurDrive[nPan]].Stream, GetCurSelLV(aWnd[IDSTREAMLV0 + nPan][HWND]));
  QuickView(nPan);
}

function ClonePanel(nPan1)
{
  var nPan0  = Number(! nPan1);
  var hWndF0 = aWnd[IDFILELV0 + nPan0][HWND];
  var hWndF1 = aWnd[IDFILELV0 + nPan1][HWND];
  var hWndS0 = aWnd[IDSTREAMLV0 + nPan0][HWND];
  var hWndS1 = aWnd[IDSTREAMLV0 + nPan1][HWND];
  var i;

  GetCurFile(nPan1);
  aHistory[nPan1][aCurHist[nPan1]][1] = aCurDir[nPan1][aCurDrive[nPan1]].File;
  aHistory[nPan1][aCurHist[nPan1]][2] = aCurDir[nPan1][aCurDrive[nPan1]].Stream;

  aCurFilter[nPan1] = aCurFilter[nPan0];
  aCurDrive[nPan1]  = aCurDrive[nPan0];
  aSort[nPan1]      = aSort[nPan0];
  aSort[nPan1 + 2]  = aSort[nPan0 + 2];

  SetSortInHeader(-1);

  if (! aCurDir[nPan1][aCurDrive[nPan1]])
    AddCurDir(nPan1, "");

  aCurDir[nPan1][aCurDrive[nPan1]].Path = aCurDir[nPan0][aCurDrive[nPan0]].Path;
  AddHistory(nPan1, aCurDir[nPan1][aCurDrive[nPan1]].Path);

  FillFilterList();
  FillDriveList(nPan1);
  SetWndText(aWnd[IDDIRS0 + nPan1][HWND], aCurDir[nPan1][aCurDrive[nPan1]].Path);

  AkelPad.SendMessage(hWndF1, 0x000B /*WM_SETREDRAW*/, false, 0);
  AkelPad.SendMessage(hWndS1, 0x000B /*WM_SETREDRAW*/, false, 0);
  AkelPad.SendMessage(hWndF1, 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);
  AkelPad.SendMessage(hWndS1, 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);

  for (i = 0; i < GetItemCountLV(hWndF0); ++i)
    InsertItemLV(hWndF1, i, [GetTextLV(hWndF0, i, 0), GetTextLV(hWndF0, i, 1), GetTextLV(hWndF0, i, 2), GetTextLV(hWndF0, i, 3), GetTextLV(hWndF0, i, 4)]);

  for (i = 0; i < GetItemCountLV(hWndS0); ++i)
    InsertItemLV(hWndS1, i, [GetTextLV(hWndS0, i, 0), GetTextLV(hWndS0, i, 1)]);

  SetCurSelLV(hWndF1, GetCurSelLV(hWndF0));
  SetCurSelLV(hWndS1, GetCurSelLV(hWndS0));
  AkelPad.SendMessage(hWndF1, 0x000B /*WM_SETREDRAW*/, true, 0);
  AkelPad.SendMessage(hWndS1, 0x000B /*WM_SETREDRAW*/, true, 0);
}

function SwapPanels()
{
  var oRect0 = {};
  var oRect1 = {};
  var sPath0;
  var sPath1;
  var vTmp;
  var i;

  nCurPan = Number(! nCurPan);

  if (bDualPan)
  {
    sPath0 = aCurDir[0][aCurDrive[0]].Path;
    sPath1 = aCurDir[1][aCurDrive[1]].Path;

    vTmp = aCurDrive[0];
    aCurDrive[0] = aCurDrive[1];
    aCurDrive[1] = vTmp;

    if (! aCurDir[0][aCurDrive[0]])
      AddCurDir(0, "");
    if (! aCurDir[1][aCurDrive[1]])
      AddCurDir(1, "");

    aCurDir[0][aCurDrive[0]].Path = sPath1;
    aCurDir[1][aCurDrive[1]].Path = sPath0;

    vTmp = aCurHist[0];
    aCurHist[0] = aCurHist[1];
    aCurHist[1] = vTmp;

    vTmp = aHistory[0];
    aHistory[0] = aHistory[1];
    aHistory[1] = vTmp;

    vTmp = aSort[0];
    aSort[0] = aSort[1];
    aSort[1] = vTmp;

    vTmp = aSort[2];
    aSort[2] = aSort[3];
    aSort[3] = vTmp;

    vTmp = aCurWnd[0];
    aCurWnd[0] = aCurWnd[1];
    aCurWnd[1] = vTmp;

    vTmp = aCurFilter[0];
    aCurFilter[0] = aCurFilter[1];
    aCurFilter[1] = vTmp;

    vTmp = hWndFilterEdit0;
    hWndFilterEdit0 = hWndFilterEdit1;
    hWndFilterEdit1 = vTmp;

    for (i = IDDRIVECB0; i <= IDQUICKVIEWS0; i += 2)
    {
      vTmp = aWnd[i][HWND];
      aWnd[i][HWND] = aWnd[i + 1][HWND];
      aWnd[i + 1][HWND] = vTmp;

      oSys.Call("User32::SetWindowLongW", aWnd[i    ][HWND], -12 /*GWL_ID*/, i);
      oSys.Call("User32::SetWindowLongW", aWnd[i + 1][HWND], -12 /*GWL_ID*/, i + 1);

      GetControlPos(hWndDlg, aWnd[i][HWND], oRect0);
      GetControlPos(hWndDlg, aWnd[i + 1][HWND], oRect1);

      oSys.Call("User32::MoveWindow", aWnd[i    ][HWND], oRect1.X, oRect1.Y, oRect1.W, oRect1.H, 1);
      oSys.Call("User32::MoveWindow", aWnd[i + 1][HWND], oRect0.X, oRect0.Y, oRect0.W, oRect0.H, 1);
    }
  }
  else
  {
    oSys.Call("User32::SetFocus", aWnd[IDFILELV0 + nCurPan + aCurWnd[nCurPan] * 2][HWND]);
    ShowControlsInPanel();
  }
}

function FillFilterList(sFilter)
{
  var i;

  for (i = aFilter.length - 1; i >= 0; --i)
  {
    if ((aFilter[i] === sFilter) || (aFilter[i] === "*.*"))
      aFilter.splice(i, 1);
  }

  if ((sFilter) && (sFilter !== "*.*"))
    aFilter.push(sFilter);

  aFilter.sort();
  aFilter.unshift("*.*");

  if (aFilter.length > 25)
    aFilter.length = 25;

  AkelPad.SendMessage(aWnd[IDFILTERCB0][HWND], 0x014B /*CB_RESETCONTENT*/, 0, 0);
  AkelPad.SendMessage(aWnd[IDFILTERCB1][HWND], 0x014B /*CB_RESETCONTENT*/, 0, 0);

  for (i = 0; i < aFilter.length; ++i)
  {
    AkelPad.SendMessage(aWnd[IDFILTERCB0][HWND], 0x0143 /*CB_ADDSTRING*/, 0, aFilter[i]);
    AkelPad.SendMessage(aWnd[IDFILTERCB1][HWND], 0x0143 /*CB_ADDSTRING*/, 0, aFilter[i]);
  }

  SetWndText(aWnd[IDFILTERCB0][HWND], aCurFilter[0]);
  SetWndText(aWnd[IDFILTERCB1][HWND], aCurFilter[1]);
}

function DeleteFilterCB(hWndCB)
{
  var nPos = AkelPad.SendMessage(hWndCB, 0x0147 /*CB_GETCURSEL*/, 0, 0);

  if ((aFilter[nPos] !== aCurFilter[0]) && (aFilter[nPos] !== aCurFilter[1]))
  {
    aFilter.splice(nPos, 1);
    FillFilterList();

    if (nPos > aFilter.length - 1)
      nPos = aFilter.length - 1;

    AkelPad.SendMessage(hWndCB, 0x014E /*CB_SETCURSEL*/, nPos, 0);
    AkelPad.SendMessage(hWndCB, 0x014F /*CB_SHOWDROPDOWN*/, 1, 0);
  }
}

function SetCurFilter(nPan)
{
  oSys.Call("User32::GetWindowTextW", aWnd[IDFILTERCB0 + nPan][HWND], lpBuffer, nBufSize);

  if (aCurFilter[nPan] !== AkelPad.MemRead(lpBuffer, _TSTR))
  {
    if (AkelPad.MemRead(lpBuffer, _TSTR))
      aCurFilter[nPan] = AkelPad.MemRead(lpBuffer, _TSTR);
    else
      aCurFilter[nPan] = "*.*";

    FillFilterList(aCurFilter[nPan]);
    RefreshPanel(nPan);
  }
}

function FillDriveList(nPan)
{
  var sLogDrives = oSys.Call("Kernel32::GetLogicalDrives", 0).toString(2);
  var sDir;
  var sDrive;
  var nPos;
  var i;

  AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x014B /*CB_RESETCONTENT*/, 0, 0);

  if ((! aCurDrive[nPan]) || (! IsDriveExists(aCurDrive[nPan])))
  {
    oSys.Call("Kernel32::GetCurrentDirectoryW", nBufSize / _TSIZE, lpBuffer);
    sDir = AkelPad.MemRead(lpBuffer, _TSTR);
    aCurDrive[nPan] = sDir.substr(0, 2);

    if (! aCurDir[nPan][aCurDrive[nPan]])
    {
      if (sDir.slice(-1) !== "\\")
        sDir += "\\";

      AddCurDir(nPan, sDir);
    }
  }

  for (i = 0; i <= sLogDrives.length; ++i)
  {
    if (sLogDrives.charAt(sLogDrives.length - i - 1) === "1")
    {
      sDrive = String.fromCharCode("A".charCodeAt(0) + i) + ":";
      nPos   = AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x0143 /*CB_ADDSTRING*/, 0, sDrive);

      if (sDrive === aCurDrive[nPan])
      {
        AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x014E /*CB_SETCURSEL*/, nPos, 0);

        if ((! aCurDir[nPan][aCurDrive[nPan]]) || (! IsDirExists(aCurDir[nPan][aCurDrive[nPan]].Path)))
          AddCurDir(nPan, sDrive + "\\");
      }
    }
  }
}

function FillFileList(nPan, sSelFile, nSelPos, bCheckFilter)
{
  var bResult   = false;
  var hFindFile = oSys.Call("Kernel32::FindFirstFileW", aCurDir[nPan][aCurDrive[nPan]].Path + "*.*", lpBuffer);
  var aDirs     = [];
  var aFiles    = [];
  var lpLocalFileTime;
  var lpSysTime;
  var lpDateStr;
  var lpTimeStr;
  var sFile;
  var nSizeLo;
  var nSizeHi;
  var sSize;
  var aTime;
  var nAttr;
  var aTimeParentDir;
  var sAttrParentDir;
  var nPos;
  var sPattern;
  var rFilter;
  var i;

  AkelPad.SendMessage(aWnd[IDFILELV0 + nPan][HWND], 0x000B /*WM_SETREDRAW*/, false, 0);

  if (hFindFile !== -1) //INVALID_HANDLE_VALUE
  {
    lpLocalFileTime = AkelPad.MemAlloc(8);  //FILETIME
    lpSysTime       = AkelPad.MemAlloc(16); //SYSTEMTIME
    lpDateStr       = AkelPad.MemAlloc(64 * _TSIZE);
    lpTimeStr       = AkelPad.MemAlloc(64 * _TSIZE);

    AkelPad.SendMessage(aWnd[IDFILELV0 + nPan][HWND], 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);

    do
    {
      nAttr = AkelPad.MemRead(lpBuffer, DT_DWORD);

      if (nAttr & 16 /*FILE_ATTRIBUTE_DIRECTORY*/)
      {
        sFile = AkelPad.MemRead(_PtrAdd(lpBuffer, 44 /*offsetof(WIN32_FIND_DATAW, cFileName)*/), _TSTR);
        sFile = sFile.substr(sFile.lastIndexOf("\\") + 1);

        if (sFile !== ".")
        {
          if (sFile === "..")
          {
            aTimeParentDir = FileTimeToString(_PtrAdd(lpBuffer, 20), lpLocalFileTime, lpSysTime, lpDateStr, lpTimeStr);
            sAttrParentDir = AttrToString(nAttr);
          }
          else
          {
            if (nAttr & 1024 /*FILE_ATTRIBUTE_REPARSE_POINT*/)
              sSize = "<LNK>";
            else
              sSize = "<DIR>";

            aTime = FileTimeToString(_PtrAdd(lpBuffer, 20), lpLocalFileTime, lpSysTime, lpDateStr, lpTimeStr);
            aDirs.push([ICONFOLDER + sFile, sSize, aTime[0], AttrToString(nAttr), aTime[1]]);
          }
        }
      }
    }
    while (oSys.Call("Kernel32::FindNextFileW", hFindFile, lpBuffer));

    oSys.Call("Kernel32::FindClose", hFindFile);

    if (aDirs.length)
      SortFiles(aDirs, nPan);

    if (aCurDir[nPan][aCurDrive[nPan]].Path.length > 3)
      aDirs.unshift(["..", "<DIR>", aTimeParentDir[0], sAttrParentDir, aTimeParentDir[1]]);

    //Check filter
    if (bCheckFilter && sSelFile && IsFileExists(aCurDir[nPan][aCurDrive[nPan]].Path + sSelFile))
    {
      sPattern = aCurFilter[nPan].replace(/[\\\/.^$+|()\[\]{}]/g, "\\$&").replace(/[?*]/g, ".$&");
      rFilter  = new RegExp(sPattern);
      if (! rFilter.test(sSelFile))
      {
        AkelPad.SendMessage(aWnd[IDFILTERCB0 + nPan][HWND], 0x014E /*CB_SETCURSEL*/, 0, 0);
        aCurFilter[nPan] = "*.*"
      }
    }

    hFindFile = oSys.Call("Kernel32::FindFirstFileW", aCurDir[nPan][aCurDrive[nPan]].Path + aCurFilter[nPan], lpBuffer);

    if (hFindFile !== -1) //INVALID_HANDLE_VALUE
    {
      do
      {
        nAttr = AkelPad.MemRead(lpBuffer, DT_DWORD);

        if (! (nAttr & 16 /*FILE_ATTRIBUTE_DIRECTORY*/))
        {
          sFile = AkelPad.MemRead(_PtrAdd(lpBuffer, 44 /*offsetof(WIN32_FIND_DATAW, cFileName)*/), _TSTR);
          sFile = sFile.substr(sFile.lastIndexOf("\\") + 1);

          // http://mcdrummerman.wordpress.com/2010/07/13/win32_find_data-and-negative-file-sizes/
          nSizeHi = AkelPad.MemRead(_PtrAdd(lpBuffer, 28 /*offsetof(WIN32_FIND_DATAW, nFileSizeHigh)*/), DT_DWORD);
          nSizeLo = AkelPad.MemRead(_PtrAdd(lpBuffer, 32 /*offsetof(WIN32_FIND_DATAW, nFileSizeLow)*/), DT_DWORD);

          if (nSizeLo < 0)
            nSizeLo = nSizeLo + (0xFFFFFFFF + 1);

          aTime = FileTimeToString(_PtrAdd(lpBuffer, 20), lpLocalFileTime, lpSysTime, lpDateStr, lpTimeStr);
          aFiles.push([sFile, String(nSizeHi * (0xFFFFFFFF + 1) + nSizeLo), aTime[0], AttrToString(nAttr), aTime[1]]);
        }
      }
      while (oSys.Call("Kernel32::FindNextFileW", hFindFile, lpBuffer));

      oSys.Call("Kernel32::FindClose", hFindFile);
    }

    if (aFiles.length)
      SortFiles(aFiles, nPan);

    aFiles = aDirs.concat(aFiles);

    if (aFiles.length)
    {
      if (sSelFile)
        sSelFile = sSelFile.toUpperCase();

      for (i = 0; i < aFiles.length; ++i)
      {
        InsertItemLV(aWnd[IDFILELV0 + nPan][HWND], i, aFiles[i]);
        if (aFiles[i][0].toUpperCase() === sSelFile)
          SetCurSelLV(aWnd[IDFILELV0 + nPan][HWND], i);
      }
    }
    else
      InsertItemLV(aWnd[IDFILELV0 + nPan][HWND], 0, [sTxtNoFiles, "", "", "", ""]);

    if (GetCurSelLV(aWnd[IDFILELV0 + nPan][HWND]) < 0)
    {
      if (! nSelPos)
        nSelPos = 0;
      else if (nSelPos > aFiles.length - 1)
        nSelPos = aFiles.length - 1;

      SetCurSelLV(aWnd[IDFILELV0 + nPan][HWND], nSelPos);
    }

    AkelPad.MemFree(lpLocalFileTime);
    AkelPad.MemFree(lpSysTime);
    AkelPad.MemFree(lpDateStr);
    AkelPad.MemFree(lpTimeStr);
    bResult = true;
  }

  else if (aCurDir[nPan][aCurDrive[nPan]].Path.length === 3)
  {
    AkelPad.SendMessage(aWnd[IDFILELV0 + nPan][HWND], 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);
    InsertItemLV(aWnd[IDFILELV0 + nPan][HWND], 0, [sTxtNoFiles, "", "", "", ""]);
    SetCurSelLV(aWnd[IDFILELV0 + nPan][HWND], 0);
    bResult = true;
  }

  AkelPad.SendMessage(aWnd[IDFILELV0 + nPan][HWND], 0x000B /*WM_SETREDRAW*/, true, 0);
  return bResult;
}

function FileTimeToString(lpFileTime, lpLocalFileTime, lpSysTime, lpDateStr, lpTimeStr)
{
  oSys.Call("Kernel32::FileTimeToLocalFileTime", lpFileTime, lpLocalFileTime);
  oSys.Call("Kernel32::FileTimeToSystemTime", lpLocalFileTime, lpSysTime);

  oSys.Call("Kernel32::GetDateFormatW",
            0x400, //LOCALE_USER_DEFAULT
            0x1,   //DATE_SHORTDATE
            lpSysTime,
            0,
            lpDateStr,
            64);
  oSys.Call("Kernel32::GetTimeFormatW",
            0x400, //LOCALE_USER_DEFAULT
            0xA,   //TIME_FORCE24HOURFORMAT|TIME_NOSECONDS
            lpSysTime,
            0,
            lpTimeStr,
            64);

  return [AkelPad.MemRead(lpDateStr, _TSTR) + " " + AkelPad.MemRead(lpTimeStr, _TSTR),
          (AkelPad.MemRead(lpLocalFileTime, DT_DWORD) +
          AkelPad.MemRead(_PtrAdd(lpLocalFileTime, 4), DT_DWORD) * (0xFFFFFFFF + 1)).toString(16)];
}

function AttrToString(nAttr)
{
  var  sAttr = "";

  if (nAttr & 32 /*FILE_ATTRIBUTE_ARCHIVE*/)
    sAttr += "A";
  if (nAttr & 2 /*FILE_ATTRIBUTE_HIDDEN*/)
    sAttr += "H";
  if (nAttr & 1 /*FILE_ATTRIBUTE_READONLY*/)
    sAttr += "R";
  if (nAttr & 4 /*FILE_ATTRIBUTE_SYSTEM*/)
    sAttr += "S";

  return sAttr;
}

function SortFiles(aFiles, nPan)
{
  var bDescending = aSort[nPan][1];
  var bIsDir      = (aFiles[0][1].substr(0, 1) === "<");

  if ((aSort[nPan][0] === 0) || ((aSort[nPan][0] === 1) && bIsDir))
    aFiles.sort(
      function(aA, aB)
      {
        return (bDescending ? -1 : 1) * oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });
  else if (aSort[nPan][0] === 1)
    aFiles.sort(
      function(aA, aB)
      {
        if (Number(aA[1]) < Number(aB[1]))
          return (bDescending ? 1 : -1);
        else if (Number(aA[1]) > Number(aB[1]))
          return (bDescending ? -1 : 1);
        else
          return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });
  else if (aSort[nPan][0] === 2)
    aFiles.sort(
      function(aA, aB)
      {
        if (parseInt(aA[4], 16) < parseInt(aB[4], 16))
          return (bDescending ? 1 : -1);
        else if (parseInt(aA[4], 16) > parseInt(aB[4], 16))
          return (bDescending ? -1 : 1);
        else
          return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });
  else
    aFiles.sort(
      function(aA, aB)
      {
        if (aA[3] < aB[3])
          return (bDescending ? 1 : -1);
        else if (aA[3] > aB[3])
          return (bDescending ? -1 : 1);
        else
          return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });
}

function FillStreamList(nPan, sSelStream, nSelPos)
{
  var aStreams = [];
  var nPos;
  var i;

  GetCurFile(nPan);
  AkelPad.SendMessage(aWnd[IDSTREAMLV0 + nPan][HWND], 0x000B /*WM_SETREDRAW*/, false, 0);
  AkelPad.SendMessage(aWnd[IDSTREAMLV0 + nPan][HWND], 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);

  if (IsSupportStreams(aCurDrive[nPan]))
  {
    if (aCurDir[nPan][aCurDrive[nPan]].File && (aCurDir[nPan][aCurDrive[nPan]].File !== ".."))
    {
      aStreams = EnumStreams(aCurDir[nPan][aCurDrive[nPan]].Path + aCurDir[nPan][aCurDrive[nPan]].File);

      if (aStreams.length)
      {
        if (! aStreams[0][0])
          aStreams[0][0] = sTxtMainStream;

        SortStreams(aStreams, nPan);
      }
    }
  }
  else
    aStreams[0] = [sTxtNoSupport, ""];

  if (! aStreams.length)
    aStreams[0] = [sTxtNoStreams, ""];

  if (sSelStream)
    sSelStream = sSelStream.toUpperCase();
  else
    sSelStream = sTxtMainStream.toUpperCase();

  for (i = 0; i < aStreams.length; ++i)
  {
    InsertItemLV(aWnd[IDSTREAMLV0 + nPan][HWND], i, [aStreams[i][0], aStreams[i][1].toString(), 0]);

    if (aStreams[i][0].toUpperCase() === sSelStream)
      SetCurSelLV(aWnd[IDSTREAMLV0 + nPan][HWND], i);
  }

  if (GetCurSelLV(aWnd[IDSTREAMLV0 + nPan][HWND]) < 0)
  {
    if (! nSelPos)
      nSelPos = 0;
    else if (nSelPos > aStreams.length - 1)
      nSelPos = aStreams.length - 1;

    SetCurSelLV(aWnd[IDSTREAMLV0 + nPan][HWND], nSelPos);
  }

  AkelPad.SendMessage(aWnd[IDSTREAMLV0 + nPan][HWND], 0x000B /*WM_SETREDRAW*/, true, 0);
}

function SortStreams(aStreams, nPan)
{
  var bDescending = aSort[nPan + 2][1];

  if (aSort[nPan + 2][0] === 0)
    aStreams.sort(
      function(aA, aB)
      {
        if (aA[0] === sTxtMainStream)
          return (bDescending ? 1 : -1);
        else if (aB[0] === sTxtMainStream)
          return (bDescending ? -1 : 1);
        else
          return (bDescending ? -1 : 1) * oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });
  else
    aStreams.sort(
      function(aA, aB)
      {
        if (aA[1] < aB[1])
          return (bDescending ? 1 : -1);
        else if (aA[1] > aB[1])
          return (bDescending ? -1 : 1);
        else
        {
          if (aA[0] === sTxtMainStream)
            return -1;
          else if (aB[0] === sTxtMainStream)
            return 1;
          return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
        }
      });
}

function QuickView(nPan)
{
  if (bQuickView)
  {
    var sText = "";

    GetCurFile(nPan);

    if (aCurDir[nPan][aCurDrive[nPan]].File)
    {
      var sFile        = aCurDir[nPan][aCurDrive[nPan]].Path + aCurDir[nPan][aCurDrive[nPan]].File;
      var lpDetectFile = AkelPad.MemAlloc(_X64 ? 24 : 20); //sizeof(DETECTFILEW)
      var nDetectFile;

      if ((aCurWnd[nPan] === 1) && aCurDir[nPan][aCurDrive[nPan]].Stream)
        sFile += ":" + aCurDir[nPan][aCurDrive[nPan]].Stream;

      AkelPad.MemCopy(lpBuffer, sFile, 1 /*DT_UNICODE*/);
      AkelPad.MemCopy(lpDetectFile, lpBuffer, DT_QWORD); //*pFile
      AkelPad.MemCopy(_PtrAdd(lpDetectFile, _X64 ?  8 : 4), 1024, DT_DWORD); //dwBytesToCheck
      AkelPad.MemCopy(_PtrAdd(lpDetectFile, _X64 ? 12 : 8), 0x1D, DT_DWORD); //dwFlags=ADT_NOMESSAGES|ADT_DETECT_BOM|ADT_DETECT_CODEPAGE|ADT_BINARY_ERROR

      nDetectFile = AkelPad.SendMessage(AkelPad.GetMainWnd(), 1177 /*AKD_DETECTFILEW*/, 0, lpDetectFile);

      if (nDetectFile === 0 /*EDT_SUCCESS*/)
        sText = AkelPad.ReadFile(sFile, 0, AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 16 : 12), DT_DWORD) /*nCodePage*/, AkelPad.MemRead(_PtrAdd(lpDetectFile, _X64 ? 20 : 16), DT_DWORD) /*bBOM*/, 2048);
      else if (nDetectFile === -4 /*EDT_BINARY*/)
        sText = AkelPad.ReadFile(sFile, 0, 0, 0, 2048).replace(/\0/g, "\x01");

      AkelPad.MemFree(lpDetectFile);
    }

    SetWndText(aWnd[IDQUICKVIEWS0 + nPan][HWND], sText);
  }
}

function ChangeDrive(nPan)
{
  var sDrive = GetDriveName(nPan);

  GetCurFile(nPan);

  if (IsDriveExists(sDrive))
  {
    aHistory[nPan][aCurHist[nPan]][1] = aCurDir[nPan][aCurDrive[nPan]].File;
    aHistory[nPan][aCurHist[nPan]][2] = aCurDir[nPan][aCurDrive[nPan]].Stream;

    aCurDrive[nPan] = sDrive;

    if ((! aCurDir[nPan][aCurDrive[nPan]]) || (! IsDirExists(aCurDir[nPan][aCurDrive[nPan]].Path)))
      AddCurDir(nPan, sDrive + "\\");

    SetWndText(aWnd[IDDIRS0 + nPan][HWND], aCurDir[nPan][aCurDrive[nPan]].Path);
    if (! FillFileList(nPan, aCurDir[nPan][aCurDrive[nPan]].File))
    {
      AddCurDir(nPan, sDrive + "\\");
      SetWndText(aWnd[IDDIRS0 + nPan][HWND], aCurDir[nPan][aCurDrive[nPan]].Path);
      FillFileList(nPan);
    }

    AddHistory(nPan, aCurDir[nPan][aCurDrive[nPan]].Path);
    return true;
  }
  else
  {
    MessageNoDrive(nPan, sDrive);
    return false;
  }
}

function GetDriveName(nPan)
{
  AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x0148 /*CB_GETLBTEXT*/, AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x0147 /*CB_GETCURSEL*/, 0, 0), lpBuffer);

  return AkelPad.MemRead(lpBuffer, _TSTR);
}

function SelCurDriveCB(nPan)
{
  var i;

  for (i = 0; i < AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x0146 /*CB_GETCOUNT*/, 0, 0); ++i)
  {
    AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x0148 /*CB_GETLBTEXT*/, i, lpBuffer);

    if (AkelPad.MemRead(lpBuffer, _TSTR) === aCurDrive[nPan])
    {
      AkelPad.SendMessage(aWnd[IDDRIVECB0 + nPan][HWND], 0x014E /*CB_SETCURSEL*/, i, 0);
      break;
    }
  }
}

function AddCurDir(nPan, sDir)
{
  aCurDir[nPan][aCurDrive[nPan]] = {Path : sDir, File : "", Stream : ""};
}

function GetCurFile(nPan)
{
  var nPos = GetCurSelLV(aWnd[IDFILELV0 + nPan][HWND]);

  if ((nPos > -1) && GetTextLV(aWnd[IDFILELV0 + nPan][HWND], nPos, 1))
    aCurDir[nPan][aCurDrive[nPan]].File = GetTextLV(aWnd[IDFILELV0 + nPan][HWND], nPos, 0);
  else
    aCurDir[nPan][aCurDrive[nPan]].File = "";

  nPos = GetCurSelLV(aWnd[IDSTREAMLV0 + nPan][HWND]);
  if ((nPos > -1) && GetTextLV(aWnd[IDSTREAMLV0 + nPan][HWND], nPos, 1) &&
      (GetTextLV(aWnd[IDSTREAMLV0 + nPan][HWND], nPos, 0) !== sTxtMainStream))
    aCurDir[nPan][aCurDrive[nPan]].Stream = GetTextLV(aWnd[IDSTREAMLV0 + nPan][HWND], nPos, 0);
  else
    aCurDir[nPan][aCurDrive[nPan]].Stream = "";
}

function CurFileIsDir(nPan)
{
  var sType = GetTextLV(aWnd[IDFILELV0 + nPan][HWND], GetCurSelLV(aWnd[IDFILELV0 + nPan][HWND]), 1);

  return ((sType === "<DIR>") || (sType === "<LNK>"));
}

function ChangeDir(nPan, sPath)
{
  var sOldDrive = aCurDrive[nPan];
  var sOldPath  = aCurDir[nPan][aCurDrive[nPan]].Path;

  GetCurFile(nPan);

  aHistory[nPan][aCurHist[nPan]][1] = aCurDir[nPan][aCurDrive[nPan]].File;
  aHistory[nPan][aCurHist[nPan]][2] = aCurDir[nPan][aCurDrive[nPan]].Stream;

  sPath = ExpandFileName(sPath);
  aCurDrive[nPan] = sPath.substr(0, 2);
  SelCurDriveCB(nPan);

  if (aCurDir[nPan][aCurDrive[nPan]])
    aCurDir[nPan][aCurDrive[nPan]].Path = sPath;
  else
    AddCurDir(nPan, sPath);

  SetWndText(aWnd[IDDIRS0 + nPan][HWND], sPath);

  if (FillFileList(nPan, aCurDir[nPan][aCurDrive[nPan]].File))
    AddHistory(nPan, sPath);
  else
  {
    aCurDrive[nPan] = sOldDrive;
    SelCurDriveCB(nPan);
    aCurDir[nPan][aCurDrive[nPan]].Path = sOldPath;
    SetWndText(aWnd[IDDIRS0 + nPan][HWND], sOldPath);
    WarningBox(hWndDlg, sPath + "\n\n" + sTxtNoDirAcc, sScriptName);
  }
}

function ExpandFileName(sFile)
{
  sFile = sFile.replace(/%a\\/g, AkelPad.GetAkelDir() + "\\");
  sFile = sFile.replace(/%.+?%/g, ExpandEnvironmentString);

  if (oSys.Call("Kernel32::GetFullPathNameW", sFile, nBufSize / 2, lpBuffer, 0))
    sFile = AkelPad.MemRead(lpBuffer, _TSTR);

  return sFile;
}

function ExpandEnvironmentString(sEnvironmentStr)
{
  if (oSys.Call("Kernel32::ExpandEnvironmentStringsW", sEnvironmentStr, lpBuffer, nBufSize / 2))
    sEnvironmentStr = AkelPad.MemRead(lpBuffer, _TSTR);

  return sEnvironmentStr;
}

function ChangeDirFromHistory(nPan, nInd, nShift)
{
  var sOldDrive = aCurDrive[nPan];
  var sOldPath  = aCurDir[nPan][aCurDrive[nPan]].Path;
  var sPath;

  //undo/redo
  if (nShift)
    nInd = aCurHist[nPan] + nShift;

  GetCurFile(nPan);

  aHistory[nPan][aCurHist[nPan]][1] = aCurDir[nPan][aCurDrive[nPan]].File;
  aHistory[nPan][aCurHist[nPan]][2] = aCurDir[nPan][aCurDrive[nPan]].Stream;

  while (true)
  {
    if (nShift)
    {
      if ((nInd < 0) || (nInd >= aHistory[nPan].length))
        return;

      while (! IsDirExists(aHistory[nPan][nInd][0]))
      {
        nInd += nShift;
        if ((nInd < 0) || (nInd >= aHistory[nPan].length))
          return;
      }
    }

    sPath = aHistory[nPan][nInd][0];
    aCurDrive[nPan] = sPath.substr(0, 2);
    SelCurDriveCB(nPan);

    if (aCurDir[nPan][aCurDrive[nPan]])
      aCurDir[nPan][aCurDrive[nPan]].Path = sPath;
    else
      AddCurDir(nPan, sPath);

    aCurDir[nPan][aCurDrive[nPan]].File   = aHistory[nPan][nInd][1];
    aCurDir[nPan][aCurDrive[nPan]].Stream = aHistory[nPan][nInd][2];

    SetWndText(aWnd[IDDIRS0 + nPan][HWND], sPath);

    if (FillFileList(nPan, aCurDir[nPan][aCurDrive[nPan]].File))
    {
      aCurHist[nPan] = nInd;
      break;
    }
    else
    {
      aCurDrive[nPan] = sOldDrive;
      SelCurDriveCB(nPan);
      aCurDir[nPan][aCurDrive[nPan]].Path = sOldPath;
      SetWndText(aWnd[IDDIRS0 + nPan][HWND], sOldPath);

      if (nShift)
        nInd += nShift;
      else
      {
        WarningBox(hWndDlg, sPath + "\n\n" + sTxtNoDirAcc, sScriptName);
        break;
      }
    }
  }
}

function Open(nPan, nAction)
{
  var sOldPath = aCurDir[nPan][aCurDrive[nPan]].Path;
  var sSelFile;

  if (! OpenAvailable(nPan, nAction))
    return;

  if (! IsDriveExists(aCurDrive[nPan]))
  {
    MessageNoDrive(nPan, aCurDrive[nPan]);
    return;
  }

  if ((nAction === 0) && (! CurFileIsDir(nPan)))
  {
    if (IsFileExists(aCurDir[nPan][aCurDrive[nPan]].Path + aCurDir[nPan][aCurDrive[nPan]].File))
      AkelPad.Exec("rundll32.exe shell32, ShellExec_RunDLL " + aCurDir[nPan][aCurDrive[nPan]].Path + aCurDir[nPan][aCurDrive[nPan]].File);
    else
      MessageNoFile(nPan);
  }

  else
  {
    aHistory[nPan][aCurHist[nPan]][1] = aCurDir[nPan][aCurDrive[nPan]].File;
    aHistory[nPan][aCurHist[nPan]][2] = aCurDir[nPan][aCurDrive[nPan]].Stream;

    //parent dir
    if (((nAction === 0) && (aCurDir[nPan][aCurDrive[nPan]].File === "..")) ||
        ((nAction === -1)))
    {
      aCurDir[nPan][aCurDrive[nPan]].Path = aCurDir[nPan][aCurDrive[nPan]].Path.slice(0, -1);
      sSelFile = aCurDir[nPan][aCurDrive[nPan]].Path.substr(aCurDir[nPan][aCurDrive[nPan]].Path.lastIndexOf("\\") + 1);
      aCurDir[nPan][aCurDrive[nPan]].Path = aCurDir[nPan][aCurDrive[nPan]].Path.substr(0, aCurDir[nPan][aCurDrive[nPan]].Path.lastIndexOf("\\") + 1);
    }
    //sub dir
    else if (nAction >= 0)
    {
      aCurDir[nPan][aCurDrive[nPan]].Path = aCurDir[nPan][aCurDrive[nPan]].Path + aCurDir[nPan][aCurDrive[nPan]].File + "\\";
      sSelFile = "..";
    }
    //main dir
    else
    {
      sSelFile = aCurDir[nPan][aCurDrive[nPan]].Path.substr(3);
      sSelFile = sSelFile.substr(0, sSelFile.indexOf("\\"));
      aCurDir[nPan][aCurDrive[nPan]].Path = aCurDrive[nPan] + "\\";
    }

    if (! IsDirExists(aCurDir[nPan][aCurDrive[nPan]].Path))
    {
      MessageNoFile(nPan, 1, 1);
      return;
    }

    SetWndText(aWnd[IDDIRS0 + nPan][HWND], aCurDir[nPan][aCurDrive[nPan]].Path);

    if (FillFileList(nPan, sSelFile))
      AddHistory(nPan, aCurDir[nPan][aCurDrive[nPan]].Path);
    else
    {
      aCurDir[nPan][aCurDrive[nPan]].Path = sOldPath;
      SetWndText(aWnd[IDDIRS0 + nPan][HWND], sOldPath);
      WarningBox(hWndDlg, aCurDir[nPan][aCurDrive[nPan]].Path + "\n\n" + sTxtNoDirAcc, sScriptName);
    }
  }
}

function OpenAvailable(nPan, nAction)
{
  GetCurFile(nPan);

  return aCurDir[nPan][aCurDrive[nPan]].File &&
         (((nAction === 0) && (aCurWnd[nPan] === 0)) ||
          ((nAction < 0) && (aCurDir[nPan][aCurDrive[nPan]].Path.length > 3)) ||
          ((nAction === 1) &&  CurFileIsDir(nPan) && (aCurDir[nPan][aCurDrive[nPan]].File !== "..")));
}

function Rename()
{
  var nPan2 = Number(! nCurPan);
  var sOldName;
  var sNewName;
  var sCaption;

  if (! RenameAvailable())
    return;

  GetCurFile(nPan2);

  if (aCurWnd[nCurPan] === 0)
  {
    sOldName = aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    if (CurFileIsDir(nCurPan))
      sCaption = sTxtRenDir;
    else
      sCaption = sTxtRenFile;
  }
  else
  {
    sOldName = aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
    sCaption = sTxtRenStr;
  }

  sNewName = GetFileName(sCaption, sOldName + "\n\n" + sTxtNewName, sOldName);

  if ((sNewName) && (sNewName !== sOldName))
  {
    if (! IsDriveExists(aCurDrive[nCurPan]))
    {
      MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
      return;
    }

    if (! GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File))
    {
      MessageNoFile(nCurPan, CurFileIsDir(nCurPan));
      return;
    }

    //Rename file or directory
    if (aCurWnd[nCurPan] === 0)
    {
      //File or directory already exists
      if (GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sNewName))
      {
        if (IsDirExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sNewName))
          WarningBox(hWndDlg, sNewName + "\n\n" + sTxtDirExists, sCaption);
        else
          WarningBox(hWndDlg, sNewName + "\n\n" + sTxtFileExists, sCaption);

        FillFileList(nCurPan, sNewName, 0, 1);
      }
      else
      {
        if (RenameFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sOldName, 0, sNewName))
        {
          FillFileList(nCurPan, sNewName, 0, 1);
          if (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path)
            RefreshPanel(nPan2);
        }
        else
          WarningBox(hWndDlg, sTxtRenFail, sCaption);
      }
    }

    //Rename stream
    else
    {
      if (IsStreamExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, sOldName))
      {
        ShowWaitWindow(1);

        if (RenameFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, sOldName, sNewName))
        {
          ShowWaitWindow(0);

          FillStreamList(nCurPan, sNewName);
          if ((aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path) &&
              (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nPan2][aCurDrive[nPan2]].File))
            RefreshStreamList(nPan2);
        }
        else
        {
          ShowWaitWindow(0);
          WarningBox(hWndDlg, sTxtRenFail, sCaption);
        }
      }
      else
        MessageNoStream(sOldName);
    }
  }
}

function RenameAvailable()
{
  GetCurFile(nCurPan);

  return aCurDir[nCurPan][aCurDrive[nCurPan]].File &&
         (((aCurWnd[nCurPan] === 0) && (aCurDir[nCurPan][aCurDrive[nCurPan]].File !== "..")) ||
          ((aCurWnd[nCurPan] === 1) && aCurDir[nCurPan][aCurDrive[nCurPan]].Stream));
}

function OpenIn(nAppType, nAppIndex)
{
  var sAppName;
  var sAppPar;

  if (! OpenInAvailable(nAppType))
    return;

  if (nAppType === 0)
    sAppName = (nAppIndex === 1) ? sViewer : sViewer2;
  else if (nAppType === 1)
    sAppName = (nAppIndex === 1) ? sEditor : sEditor2;
  else if (nAppType === 3)
    sAppName = aFavorite[nAppIndex][1];
  else
  {
    nAppIndex = GetInternalAssocIndex();
    if (nAppIndex < 0)
      return;
    sAppName = aIntAssoc[nAppIndex][1];
  }

  sAppName = ExpandFileName(sAppName);

  if (! IsFileExists(sAppName))
  {
    if (nAppType === 4)
    {
      if (SetInternalAssoc(nAppIndex, 1))
      {
        nAppIndex = GetInternalAssocIndex();
        if (nAppIndex < 0)
          return;
        sAppName = aIntAssoc[nAppIndex][1];
      }
      else
        return;
    }
    else
    {
      if (SetExternalApp(nAppType, nAppIndex, 1))
      {
        if (nAppType === 0)
          sAppName = (nAppIndex === 1) ? sViewer : sViewer2;
        else if (nAppType === 1)
          sAppName = (nAppIndex === 1) ? sEditor : sEditor2;
        else
          sAppName = aFavorite[nAppIndex][1];
      }
      else
        return;
    }
    sAppName = ExpandFileName(sAppName);
  }

  if (! IsDriveExists(aCurDrive[nCurPan]))
  {
    MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
    return;
  }

  if (! GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File))
  {
    MessageNoFile(nCurPan, CurFileIsDir(nCurPan));
    return;
  }

  if (nAppType === 0)
    sAppPar = (nAppIndex === 1) ? sViewerPar : sViewerPar2;
  else if (nAppType === 1)
    sAppPar = (nAppIndex === 1) ? sEditorPar : sEditorPar2;
  else if (nAppType === 3)
    sAppPar = aFavorite[nAppIndex][2];
  else
    sAppPar = aIntAssoc[nAppIndex][2];

  if ((aCurWnd[nCurPan] === 0) || (! aCurDir[nCurPan][aCurDrive[nCurPan]].Stream))
    AkelPad.Exec(sAppName + ' ' + sAppPar + ' "' + aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File + '"');
  else
  {
    if (IsStreamExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, aCurDir[nCurPan][aCurDrive[nCurPan]].Stream))
      AkelPad.Exec(sAppName + ' ' + sAppPar + ' "' + aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File + ':'  + aCurDir[nCurPan][aCurDrive[nCurPan]].Stream +'"');
    else
      MessageNoStream(aCurDir[nCurPan][aCurDrive[nCurPan]].Stream);
  }
}

function OpenInAvailable(nAppType)
{
  GetCurFile(nCurPan);

  if (nAppType === 4) //open in internally associated
    return (aCurWnd[nCurPan] === 0) &&
           aCurDir[nCurPan][aCurDrive[nCurPan]].File &&
           (! CurFileIsDir(nCurPan)) &&
           (aCurDir[nCurPan][aCurDrive[nCurPan]].File.indexOf(".") >= 0);
  else
    return aCurDir[nCurPan][aCurDrive[nCurPan]].File &&
           (((aCurWnd[nCurPan] === 0) && (! CurFileIsDir(nCurPan))) ||
            ((aCurWnd[nCurPan] === 1) && GetTextLV(aWnd[IDSTREAMLV0 + nCurPan][HWND], GetCurSelLV(aWnd[IDSTREAMLV0 + nCurPan][HWND]), 1)));
}

function GetInternalAssocIndex()
{
  var sExt = aCurDir[nCurPan][aCurDrive[nCurPan]].File.substr(aCurDir[nCurPan][aCurDrive[nCurPan]].File.lastIndexOf(".") + 1);
  var i;

  while (true)
  {
    for (i = 0; i < aIntAssoc.length; ++i)
    {
      if (aIntAssoc[i][0].toUpperCase().indexOf(sExt.toUpperCase()) >= 0)
        return i;
    }

    if (! SetInternalAssoc(-1, 0, sExt))
      break;
  }

  return -1;
}

function Copy(bMove, bOnePan)
{
  var nToPan = (bOnePan) ? nCurPan : Number(! nCurPan);
  var sTo;
  var sPath;
  var sName;
  var sCaption;
  var sFail;

  if (! CopyAvailable(bOnePan))
    return;

  if (aCurWnd[nCurPan] === 0)
  {
    sName = aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    if (CurFileIsDir(nCurPan))
    {
      sCaption = bMove ? sTxtMovDir : sTxtCopDir;
      sTo      = sTxtTo;
      sPath    = aCurDir[nToPan][aCurDrive[nToPan]].Path;
    }
    else
    {
      sCaption = bMove ? sTxtMovFile : sTxtCopFile;
      if (aCurWnd[nToPan] === 0)
      {
        sTo   = sTxtToFile;
        sPath = aCurDir[nToPan][aCurDrive[nToPan]].Path;
      }
      else
      {
        sTo   = sTxtToStream;
        sPath = aCurDir[nToPan][aCurDrive[nToPan]].Path + aCurDir[nToPan][aCurDrive[nToPan]].File + ":";
      }
    }
  }
  else
  {
    sName    = aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
    sCaption = bMove ? sTxtMovStr : sTxtCopStr;
    if (aCurWnd[nToPan] === 0)
    {
      sTo   = sTxtToFile;
      sPath = aCurDir[nToPan][aCurDrive[nToPan]].Path;
    }
    else
    {
      sTo   = sTxtToStream;
      sPath = aCurDir[nToPan][aCurDrive[nToPan]].Path + aCurDir[nToPan][aCurDrive[nToPan]].File + ":";
    }
  }

  //Move file to its own stream
  if (bMove &&
      (aCurWnd[nCurPan] === 0) &&
      (aCurWnd[nToPan] === 1) &&
      (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nToPan][aCurDrive[nToPan]].Path) &&
      (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nToPan][aCurDrive[nToPan]].File))
  {
    WarningBox(hWndDlg, sTxtFileToStr, sCaption);
    return;
  }

  sFail = bMove ? sTxtMovFail : sTxtCopFail;
  sName = GetFileName(sCaption, sName + "\n\n" + sTo + "\n\n" + sPath, sName);

  if (sName)
  {
    if (! IsDriveExists(aCurDrive[nCurPan]))
    {
      MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
      return;
    }

    //No source file/dir
    if (! GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File))
    {
      MessageNoFile(nCurPan, CurFileIsDir(nCurPan));
      return;
    }

    //No source stream
    if ((aCurWnd[nCurPan] === 1) &&
        (! IsStreamExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, aCurDir[nCurPan][aCurDrive[nCurPan]].Stream)))
    {
      MessageNoStream(sName);
      return;
    }

    if (! IsDriveExists(aCurDrive[nToPan]))
    {
      MessageNoDrive(nToPan, aCurDrive[nToPan]);
      return;
    }

    //No parent of target dir
    if (! IsDirExists(aCurDir[nToPan][aCurDrive[nToPan]].Path))
    {
      MessageNoFile(nToPan, 1, 1);
      return;
    }

    //Copy/move to dir/file
    if (aCurWnd[nToPan] === 0)
    {
      //The same dir/file
      if ((aCurWnd[nCurPan] === 0) &&
          (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === sPath) &&
          (aCurDir[nCurPan][aCurDrive[nCurPan]].File === sName))
      {
        if (! bOnePan)
          FillFileList(nToPan, sName, 0, 1);
        return;
      }

      //Directory to its own subdirectory
      if ((aCurWnd[nCurPan] === 0) && CurFileIsDir(nCurPan) &&
          ((aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName) === sPath.substr(0, (aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName).length)))
      {
        WarningBox(hWndDlg, sPath + sName + "\n\n" + sTxtDirToSubdir, sCaption);
        return;
      }

      //Target dir/file already exists
      if (GetFileAttr(sPath + sName))
      {
        if (IsDirExists(sPath + sName))
        {
          WarningBox(hWndDlg, sPath + sName + "\n\n" + sTxtDirExists, sCaption);
          FillFileList(nToPan, sName);
          return;
        }

        if ((aCurWnd[nCurPan] === 0) && CurFileIsDir(nCurPan))
        {
          WarningBox(hWndDlg, sPath + sName + "\n\n" + sTxtFileExists, sCaption);
          FillFileList(nToPan, sName, 0, 1);
          return;
        }

        if (! QuestionBox(hWndDlg, sPath + sName + "\n\n" + sTxtWantReplace, sCaption))
        {
          FillFileList(nToPan, sName, 0, 1);
          return;
        }
      }

      ShowWaitWindow(1);

      if (! CopyFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File,
                     (aCurWnd[nCurPan] === 0) ? 0 : aCurDir[nCurPan][aCurDrive[nCurPan]].Stream,
                     sPath + sName,
                     0,
                     bMove))
      {
        ShowWaitWindow(0);
        WarningBox(hWndDlg, sName + "\n\n" + sFail, sCaption);
      }

      ShowWaitWindow(0);

      if (GetFileAttr(sPath + sName))
      {
        FillFileList(nToPan, sName, 0, 1);
        if ((! bOnePan) && (bMove || (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === sPath)))
          RefreshPanel(nCurPan);
      }
    }

    //Copy/move to stream
    else if (aCurWnd[nToPan] === 1)
    {
      //The same stream
      if ((aCurWnd[nCurPan] === 1) &&
          (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nToPan][aCurDrive[nToPan]].Path) &&
          (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nToPan][aCurDrive[nToPan]].File) &&
          (aCurDir[nCurPan][aCurDrive[nCurPan]].Stream === sName))
      {
        if (! bOnePan)
          FillStreamList(nToPan, sName);
        return;
      }

      //No target dir/file
      if (! GetFileAttr(aCurDir[nToPan][aCurDrive[nToPan]].Path + aCurDir[nToPan][aCurDrive[nToPan]].File))
      {
        MessageNoFile(nToPan, CurFileIsDir(nToPan));
        return;
      }

      //Target stream already exists
      if (IsStreamExists(aCurDir[nToPan][aCurDrive[nToPan]].Path + aCurDir[nToPan][aCurDrive[nToPan]].File, sName))
      {
        if (! QuestionBox(hWndDlg, sPath + sName + "\n\n" + sTxtWantReplace, sCaption))
        {
          FillStreamList(nToPan, sName);
          return;
        }
      }

      ShowWaitWindow(1);

      if (CopyFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File,
          (aCurWnd[nCurPan] === 0) ? 0 : aCurDir[nCurPan][aCurDrive[nCurPan]].Stream,
          aCurDir[nToPan][aCurDrive[nToPan]].Path + aCurDir[nToPan][aCurDrive[nToPan]].File,
          sName,
          bMove))
      {
        ShowWaitWindow(0);
        FillStreamList(nToPan, sName);

        if (! bOnePan)
        {
          if (bMove && (aCurWnd[nCurPan] === 0))
          {
            RefreshPanel(nCurPan);
            if (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nToPan][aCurDrive[nToPan]].Path)
              RefreshPanel(nToPan);
          }
          else if (bMove ||
                   ((aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nToPan][aCurDrive[nToPan]].Path) &&
                    (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nToPan][aCurDrive[nToPan]].File)))
            RefreshStreamList(nCurPan);
        }
      }
      else
      {
        ShowWaitWindow(0);
        WarningBox(hWndDlg, sName + "\n\n" + sFail, sCaption);
      }
    }
  }
}

function CopyAvailable(bOnePan)
{
  var nToPan = (bOnePan) ? nCurPan : Number(! nCurPan);

  GetCurFile(nCurPan);
  GetCurFile(nToPan);

  if (bOnePan)
    return aCurDir[nCurPan][aCurDrive[nCurPan]].File &&
           (((aCurWnd[nCurPan] === 0) && (aCurDir[nCurPan][aCurDrive[nCurPan]].File !== "..")) ||
            ((aCurWnd[nCurPan] === 1) && aCurDir[nCurPan][aCurDrive[nCurPan]].Stream));

  return ! ((! aCurDir[nCurPan][aCurDrive[nCurPan]].File) ||
            (aCurDir[nCurPan][aCurDrive[nCurPan]].File === "..") ||
            ((aCurWnd[nCurPan] === 0) && (aCurWnd[nToPan] === 1) && CurFileIsDir(nCurPan)) ||
            ((aCurWnd[nCurPan] === 1) && (! aCurDir[nCurPan][aCurDrive[nCurPan]].Stream)) ||
            ((aCurWnd[nToPan]  === 1) && (! IsSupportStreams(aCurDrive[nToPan]))) ||
            ((aCurWnd[nToPan]  === 1) && (! aCurDir[nToPan][aCurDrive[nToPan]].File)) ||
            ((aCurWnd[nToPan]  === 1) && (aCurDir[nToPan][aCurDrive[nToPan]].File === "..")));
}

function Create(bDir)
{
  var nPan2 = Number(! nCurPan);
  var sName;
  var sCaption;

  GetCurFile(nCurPan);
  GetCurFile(nPan2);

  //Create file or directory
  if (aCurWnd[nCurPan] === 0)
  {
    if (bDir)
      sCaption = sTxtCreDir;
    else
      sCaption = sTxtCreFile;

    sName = aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    if (sName === "..")
      sName = "";

    sName = GetFileName(sCaption, sTxtInpName, sName);
    if (sName)
    {
      if (! IsDriveExists(aCurDrive[nCurPan]))
      {
        MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
        return;
      }

      //No parent dir
      if (! IsDirExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path))
      {
        MessageNoFile(nCurPan, 1, 1);
        return;
      }

      //File or directory already exists
      if (GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName))
      {
        if (IsDirExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName))
          WarningBox(hWndDlg, sName + "\n\n" + sTxtDirExists, sCaption);
        else
          WarningBox(hWndDlg, sName + "\n\n" + sTxtFileExists, sCaption);

        FillFileList(nCurPan, sName, 0, 1);
      }
      else
      {
        if ((bDir && oSys.Call("Kernel32::CreateDirectoryW", aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName, 0)) ||
            ((! bDir) && CreateFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName)))
        {
          FillFileList(nCurPan, sName, 0, 1);
          if (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path)
            RefreshPanel(nPan2);
        }
        else
          WarningBox(hWndDlg, sName + "\n\n" + sTxtCreFail, sCaption);
      }
    }
  }

  //Create stream
  else
  {
    if (! CreateStreamAvailable())
      return;

    sName = GetFileName(sTxtCreStr, sTxtInpName, aCurDir[nCurPan][aCurDrive[nCurPan]].Stream);
    if (sName)
    {
      if (! IsDriveExists(aCurDrive[nCurPan]))
      {
        MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
        return;
      }

      if (! GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File))
      {
        MessageNoFile(nCurPan, CurFileIsDir(nCurPan));
        return;
      }

      if (IsStreamExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, sName))
      {
        WarningBox(hWndDlg, sName + "\n\n" + sTxtStrExists, sTxtCreStr);
        FillStreamList(nCurPan, sName);
      }
      else
      {
        if (CreateFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, sName))
        {
          FillStreamList(nCurPan, sName);
          if ((aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path) &&
              (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nPan2][aCurDrive[nPan2]].File))
            RefreshStreamList(nPan2);
        }
        else
          WarningBox(hWndDlg, sName + "\n\n" + sTxtCreFail, sTxtCreStr);
      }
    }
  }
}

function CreateStreamAvailable()
{
  GetCurFile(nCurPan);

  return (aCurWnd[nCurPan] === 1) &&
         IsSupportStreams(aCurDrive[nCurPan]) &&
         aCurDir[nCurPan][aCurDrive[nCurPan]].File &&
         (aCurDir[nCurPan][aCurDrive[nCurPan]].File !== "..");
}

function Delete(bRecBin)
{
  var nPan2 = Number(! nCurPan);
  var sName;
  var sCaption;

  if (! DeleteAvailable())
    return;

  GetCurFile(nPan2);

  if (aCurWnd[nCurPan] === 0)
  {
    sName = aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    if (CurFileIsDir(nCurPan))
      sCaption = bRecBin ? sTxtDelDirToBin : sTxtDelDir;
    else
      sCaption = bRecBin ? sTxtDelFileToBin : sTxtDelFile;
  }
  else
  {
    sName    = aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
    sCaption = sTxtDelStr;
  }

  if (QuestionBox(hWndDlg, sName + "\n\n" + sTxtWantDelete, sCaption))
  {
    if (! IsDriveExists(aCurDrive[nCurPan]))
    {
      MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
      return;
    }

    if (! GetFileAttr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File))
    {
      MessageNoFile(nCurPan, CurFileIsDir(nCurPan));
      return;
    }

    //Delete file or directory
    if (aCurWnd[nCurPan] === 0)
    {
      if (DeleteFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + sName, null, bRecBin))
      {
        RefreshPanel(nCurPan);
        if (aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path)
          RefreshPanel(nPan2);
      }
      else
        WarningBox(hWndDlg, sName + "\n\n" + sTxtDelFail, sCaption);
    }

    //Delete stream
    else
    {
      if (IsStreamExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, sName))
      {
        if (DeleteFile(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, sName))
        {
          RefreshStreamList(nCurPan);
          if ((aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path) &&
              (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nPan2][aCurDrive[nPan2]].File))
            RefreshStreamList(nPan2);
        }
        else
          WarningBox(hWndDlg, sName + "\n\n" + sTxtDelFail, sCaption);
      }
      else
        MessageNoStream(sName);
    }
  }
}

function DeleteAvailable()
{
  GetCurFile(nCurPan);

  return aCurDir[nCurPan][aCurDrive[nCurPan]].File &&
         (((aCurWnd[nCurPan] === 0) && (aCurDir[nCurPan][aCurDrive[nCurPan]].File !== "..")) ||
          ((aCurWnd[nCurPan] === 1) && aCurDir[nCurPan][aCurDrive[nCurPan]].Stream));
}

function Compare(nAppIndex)
{
  var nPan2    = Number(! nCurPan);
  var sAppName = ExpandFileName((nAppIndex === 1) ? sComparer : sComparer2);
  var sAppPar;
  var sFile1;
  var sFile2;

  if (! CompareAvailable())
    return;

  if (! IsFileExists(sAppName))
  {
    if (SetExternalApp(2, nAppIndex, 1))
      sAppName = ExpandFileName((nAppIndex === 1) ? sComparer : sComparer2);
    else
      return;
  }

  if (! IsDriveExists(aCurDrive[nCurPan]))
  {
    MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
    return;
  }
  if (! IsDriveExists(aCurDrive[nPan2]))
  {
    MessageNoDrive(nPan2, aCurDrive[nPan2]);
    return;
  }

  if (aCurDir[nCurPan][aCurDrive[nCurPan]].File === "..")
    sFile1 = aCurDir[nCurPan][aCurDrive[nCurPan]].Path.slice(0, -1);
  else
    sFile1 = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File;

  if (! GetFileAttr(sFile1))
  {
    MessageNoFile(nCurPan, CurFileIsDir(nCurPan), (aCurDir[nCurPan][aCurDrive[nCurPan]].File === ".."));
    return;
  }

  if (aCurWnd[nCurPan] === 1)
  {
    if (aCurDir[nCurPan][aCurDrive[nCurPan]].Stream)
    {
      if (IsStreamExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, aCurDir[nCurPan][aCurDrive[nCurPan]].Stream))
        sFile1 = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File + ":" + aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
      else
      {
        MessageNoStream(aCurDir[nCurPan][aCurDrive[nCurPan]].Stream);
        return;
      }
    }
  }

  if (aCurDir[nPan2][aCurDrive[nPan2]].File === "..")
    sFile2 = aCurDir[nPan2][aCurDrive[nPan2]].Path.slice(0, -1);
  else
    sFile2 = aCurDir[nPan2][aCurDrive[nPan2]].Path + aCurDir[nPan2][aCurDrive[nPan2]].File;

  if (! GetFileAttr(sFile2))
  {
    MessageNoFile(nPan2, CurFileIsDir(nPan2), (aCurDir[nPan2][aCurDrive[nPan2n]].File === ".."));
    return;
  }

  if (aCurWnd[nPan2] === 1)
  {
    if (aCurDir[nPan2][aCurDrive[nPan2]].Stream)
    {
      if (IsStreamExists(aCurDir[nPan2][aCurDrive[nPan2]].Path + aCurDir[nPan2][aCurDrive[nPan2]].File, aCurDir[nPan2][aCurDrive[nPan2]].Stream))
        sFile2 = aCurDir[nPan2][aCurDrive[nPan2]].Path + aCurDir[nPan2][aCurDrive[nPan2]].File + ":" + aCurDir[nPan2][aCurDrive[nPan2]].Stream;
      else
      {
        MessageNoStream(aCurDir[nPan2][aCurDrive[nPan2]].Stream);
        return;
      }
    }
  }

  sAppPar = (nAppIndex === 1) ? sComparerPar : sComparerPar2;

  AkelPad.Exec(sAppName + ' ' + sAppPar + ' "' + sFile1 + '" "' + sFile2 + '"');
}

function CompareAvailable()
{
  var nPan2 = Number(! nCurPan);

  GetCurFile(nCurPan);
  GetCurFile(nPan2);

  return ! ((! aCurDir[nCurPan][aCurDrive[nCurPan]].File) || (! aCurDir[nPan2][aCurDrive[nPan2]].File) ||
            ((aCurWnd[nCurPan] + aCurWnd[nPan2] === 0) && (CurFileIsDir(nCurPan) !== CurFileIsDir(nPan2))) ||
            ((aCurWnd[nCurPan] === 0) && (aCurWnd[nPan2] === 1) && CurFileIsDir(nCurPan)) ||
            ((aCurWnd[nCurPan] === 1) && (aCurWnd[nPan2] === 0) && CurFileIsDir(nPan2)) ||
            ((aCurWnd[nCurPan] === 1) && (! GetTextLV(aWnd[IDSTREAMLV0 + nCurPan][HWND], GetCurSelLV(aWnd[IDSTREAMLV0 + nCurPan][HWND]), 1))) ||
            ((aCurWnd[nPan2] === 1) && (! GetTextLV(aWnd[IDSTREAMLV0 + nPan2][HWND], GetCurSelLV(aWnd[IDSTREAMLV0 + nPan2][HWND]), 1))));
}

function CopyNameToCB(nAction)
{
  var sText;

  GetCurFile(nCurPan);

  if (aCurDir[nCurPan][aCurDrive[nCurPan]].File)
  {
    if (nAction === 1) //File
      sText = aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    else if (nAction === 3) //Path\File
      sText = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    else if (nAction === 5) //Path\
      sText = aCurDir[nCurPan][aCurDrive[nCurPan]].Path;
    else if (aCurDir[nCurPan][aCurDrive[nCurPan]].Stream)
    {
      if (nAction === 4) //Stream
        sText = aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
      else if (nAction === 6) //Path\File:Stream
        sText = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File + ":" + aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
      else if (nAction === 7) //File:Stream
        sText = aCurDir[nCurPan][aCurDrive[nCurPan]].File + ":" + aCurDir[nCurPan][aCurDrive[nCurPan]].Stream;
    }

    if (sText)
      AkelPad.SetClipboardText(sText);
  }
}

function CopyListToCB(nAction)
{
  var nNameLen = 0;
  var nTimeLen = 0;
  var nFirst   = 0;
  var sText;
  var i;

  GetCurFile(nCurPan);

  if (aCurDir[nCurPan][aCurDrive[nCurPan]].File)
  {
    //Files
    if (nAction === 0)
    {
      if (GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], 0, 0) === "..")
        nFirst = 1;

      if ((bColSize) || (bColTime) || (bColAttr))
      {
        for (i = nFirst; i < GetItemCountLV(aWnd[IDFILELV0 + nCurPan][HWND]); ++i)
        {
          if (nNameLen < GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 0).length)
            nNameLen = GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 0).length;
          if (nTimeLen < GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 2).length)
            nTimeLen = GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 2).length;
        }
      }

      if (nFirst < GetItemCountLV(aWnd[IDFILELV0 + nCurPan][HWND]))
        sText = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + "\n";

      for (i = nFirst; i < GetItemCountLV(aWnd[IDFILELV0 + nCurPan][HWND]); ++i)
      {
        sText += Pad(GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 0), nNameLen);
        if (bColSize)
          sText += Pad(GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 1), 15, "L");
        if (bColTime)
          sText += Pad(GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 2), nTimeLen + 3, "L");
        if (bColAttr)
          sText += Pad(GetTextLV(aWnd[IDFILELV0 + nCurPan][HWND], i, 3), 7, "L");
        sText += "\n";
      }
    }

    //Steams
    else if (IsSupportStreams(aCurDrive[nCurPan]) && (aCurDir[nCurPan][aCurDrive[nCurPan]].File !== "..") &&
             ((! CurFileIsDir(nCurPan)) || aCurDir[nCurPan][aCurDrive[nCurPan]].Stream))
    {
      if (bColSize)
      {
        for (i = 0; i < GetItemCountLV(aWnd[IDSTREAMLV0 + nCurPan][HWND]); ++i)
        {
          if (nNameLen < GetTextLV(aWnd[IDSTREAMLV0 + nCurPan][HWND], i, 0).length)
            nNameLen = GetTextLV(aWnd[IDSTREAMLV0 + nCurPan][HWND], i, 0).length;
        }
      }

      sText = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File + ":" + "\n";

      for (i = 0; i < GetItemCountLV(aWnd[IDSTREAMLV0 + nCurPan][HWND]); ++i)
      {
        sText += Pad(GetTextLV(aWnd[IDSTREAMLV0 + nCurPan][HWND], i, 0), nNameLen);
        if (bColSize)
          sText += Pad(GetTextLV(aWnd[IDSTREAMLV0 + nCurPan][HWND], i, 1), 15, "L");
        sText += "\n";
      }
    }

    if (sText)
      AkelPad.SetClipboardText(sText);
  }
}

function Pad(sString, nLen, sType, sChar)
{
  var i = 0;

  if (! sType) sType = "R";
  if (! sChar) sChar = " ";

  if (sType === "R")
  {
    while (sString.length < nLen)
      sString += sChar;
  }
  else if (sType === "L")
  {
    while (sString.length < nLen)
      sString = sChar + sString;
  }

  return sString;
}

function Properties()
{
  var sFile;

  if (! PropertiesAvailable())
    return;

  if (! IsDriveExists(aCurDrive[nCurPan]))
  {
    MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
    return;
  }

  if (aCurDir[nCurPan][aCurDrive[nCurPan]].File === "..")
    sFile = aCurDir[nCurPan][aCurDrive[nCurPan]].Path.slice(0, -1);
  else
    sFile = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File;

  if (! GetFileAttr(sFile))
  {
    MessageNoFile(nCurPan, CurFileIsDir(nCurPan), (aCurDir[nCurPan][aCurDrive[nCurPan]].File === ".."));
    return;
  }

  if (! FilePropertiesDialog(sFile, hWndDlg))
    WarningBox(hWndDlg, sTxtNoFileProp, sScriptName);
}

function PropertiesAvailable()
{
  GetCurFile(nCurPan);

  return Boolean(aCurDir[nCurPan][aCurDrive[nCurPan]].File);
}

function FavoriteFolders(nPan)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_POPUP     = 0x0010;
  var MF_SEPARATOR = 0x0800;
  var hMenu01 = oSys.Call("User32::CreatePopupMenu");
  var hMenu03 = oSys.Call("User32::CreatePopupMenu");
  var hMenu04 = oSys.Call("User32::CreatePopupMenu");
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var oRect   = {};
  var bSet    = true;
  var nSel    = -1;
  var nFlag;
  var i;

  for (i = 0; i < aFavoriteFolder.length; ++i)
  {
    if (ExpandFileName(aFavoriteFolder[i][1]).toUpperCase() === aCurDir[nPan][aCurDrive[nPan]].Path.toUpperCase())
    {
      nFlag = MF_CHECKED;
      nSel  = i;
    }
    else
      nFlag = MF_STRING;

    oSys.Call("User32::AppendMenuW", hMenu01, nFlag, 0x0101 + i, aFavoriteFolder[i][0]);
    oSys.Call("User32::AppendMenuW", hMenu03, nFlag, 0x0301 + i, aFavoriteFolder[i][0]);
    oSys.Call("User32::AppendMenuW", hMenu04, nFlag, 0x0401 + i, aFavoriteFolder[i][0]);
  }

  oSys.Call("User32::AppendMenuW", hMenu, aFavoriteFolder.length ? MF_POPUP : MF_GRAYED, hMenu01, sTxtGoToFavFold);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu, (aFavoriteFolder.length < 0xFF) ? MF_STRING : MF_GRAYED, 0x0200, sTxtAddFavorite);
  oSys.Call("User32::AppendMenuW", hMenu, aFavoriteFolder.length ? MF_POPUP : MF_GRAYED, hMenu03, sTxtModFavorite);
  oSys.Call("User32::AppendMenuW", hMenu, aFavoriteFolder.length ? MF_POPUP : MF_GRAYED, hMenu04, sTxtDelFavorite);
  oSys.Call("User32::AppendMenuW", hMenu, aFavoriteFolder.length ? MF_STRING : MF_GRAYED, 0x0500, sTxtCleFavorite);

  GetWindowPos(aWnd[IDFAVFOLDB0 + nPan][HWND], oRect);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, oRect.X + oRect.W, oRect.Y, 0, hWndDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu01);
  oSys.Call("User32::DestroyMenu", hMenu03);
  oSys.Call("User32::DestroyMenu", hMenu04);
  oSys.Call("User32::DestroyMenu", hMenu);

  if ((nCmd >= 0x0101) && (nCmd <= 0x01FF))
  {
    if (nCmd - 0x0101 !== nSel)
    {
      if (! IsDirExists(ExpandFileName(aFavoriteFolder[nCmd - 0x0101][1])))
        bSet = SetFavoriteFolder(nPan, nCmd - 0x0101, 1);
      if (bSet)
        ChangeDir(nPan, aFavoriteFolder[nCmd - 0x0101][1]);
    }
  }
  else if (nCmd === 0x0200)
    SetFavoriteFolder(nPan, -1); //add favorite
  else if ((nCmd >= 0x0301) && (nCmd <= 0x03FF))
    SetFavoriteFolder(nPan, nCmd - 0x0301); //modify favorite
  else if ((nCmd >= 0x0401) && (nCmd <= 0x04FF))
    RemoveFavoriteFolder(nCmd - 0x0401);
  else if (nCmd === 0x0500)
  {
    if (QuestionBox(hWndDlg, sTxtWantCleFavFo, sTxtDirectory + ": " + sTxtCleFavorite, 1))
      aFavoriteFolder = [];
  }
}

function SetFavoriteFolder(nPan, nIndex, nFocus)
{
  var bSet     = false;
  var sCaption = sTxtDirectory + ": ";
  var aDir     = new Array(2);

  if (nIndex < 0) //add favorite
  {
    sCaption += sTxtAddFavorite;
    aDir[1]   = aCurDir[nPan][aCurDrive[nPan]].Path;
    aDir[0]   = aDir[1].slice(0, -1);
    aDir[0]   = ((aDir[0].length > 2) ? aDir[0].substr(0, 2) : "") + aDir[0].substr(aDir[0].lastIndexOf("\\") + 1);
  }
  else //modify favorite
  {
    sCaption += sTxtModFavorite;
    aDir      = aFavoriteFolder[nIndex];
  }

  aDir = InputBox(hWndDlg, sCaption, [sTxtDispName + ":", sTxtPath + " (%a - " + sTxtAkelDir + ", %WinDir% - " + sTxtEnvVar + "):"], aDir, nFocus, "CheckInputPath", nIndex);

  if (aDir)
  {
    if (aDir[1].slice(-1) !== "\\")
      aDir[1] += "\\";

    if (nIndex < 0)
      aFavoriteFolder.push([aDir[0], aDir[1]]);
    else
      aFavoriteFolder[nIndex] = [aDir[0], aDir[1]];

    aFavoriteFolder.sort(
      function(aA, aB)
      {
        return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });

    bSet = true;
  }

  return bSet;
}

function CheckInputPath(hWnd, aDir, nIndex)
{
  var sPath;

  if (! aDir[0])
  {
    WarningBox(hWnd, sTxtMustSpecify + ": " + sTxtDispName, sScriptName);
    return 0;
  }

  if (IsNameInArray(aFavoriteFolder, aDir[0], nIndex))
  {
    WarningBox(hWnd, aDir[0] + "\n\n" + sTxtNameExists, sScriptName);
    return 0;
  }

  if (! aDir[1])
  {
    WarningBox(hWnd, sTxtMustSpecify + ": " + sTxtPath, sScriptName);
    return 1;
  }

  sPath = ExpandFileName(aDir[1] + ((aDir[1].slice(-1) !== "\\") ? "\\" : ""));
  if (! IsDirExists(sPath))
  {
    WarningBox(hWnd, sPath + "\n\n" + sTxtDirNoExists, sScriptName);
    return 1;
  }

  return -1;
}

function IsNameInArray(aArray, sName, nIndex)
{
  for (var i = 0; i < aArray.length; ++i)
  {
    if ((aArray[i][0] === sName) && (i !== nIndex))
      return true;
  }

  return false;
}

function RemoveFavoriteFolder(nIndex)
{
  if (QuestionBox(hWndDlg, aFavoriteFolder[nIndex][0] + "\n" + aFavoriteFolder[nIndex][1] + "\n\n" + sTxtWantDelFav, sTxtDirectory + ": " + sTxtDelFavorite))
    aFavoriteFolder.splice(nIndex, 1);
}

function SpecialFolders(nPan)
{
  var aFolder = [];
  var oRect   = {};
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var nSel    = -1;
  var nFlag;
  var nCmd;
  var i;

  for (i = 0; i < 63; ++i)
  {
    if (oSys.Call("Shell32::SHGetSpecialFolderPathW", 0, lpBuffer, i, 0))
      aFolder.push(AkelPad.MemRead(lpBuffer, _TSTR) + "\\");
  }

  aFolder.sort(function(sA, sB)
               {
                 return oSys.Call("Kernel32::lstrcmpiW", sA, sB);
               } );

  for (i = 0; i < aFolder.length; ++i)
  {
    if ((i === 0) || (aFolder[i] !== aFolder[i - 1]))
    {
      if (aFolder[i].toUpperCase() === aCurDir[nPan][aCurDrive[nPan]].Path.toUpperCase())
      {
        nFlag = 0x0008; //MF_CHECKED
        nSel  = i;
      }
      else
        nFlag = 0x0000; //MF_STRING

      oSys.Call("User32::AppendMenuW", hMenu, nFlag, i + 1, aFolder[i]);
    }
  }

  GetWindowPos(aWnd[IDSPECFOLDB0 + nPan][HWND], oRect);
  nFlag = 0x0180; //TPM_RETURNCMD|TPM_NONOTIFY

  if (nPan === 0)
    oRect.X += oRect.W;
  else
    nFlag |= 0x0008; //TPM_RIGHTALIGN

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, nFlag, oRect.X, oRect.Y, 0, hWndDlg, 0);
  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd && (--nCmd !== nSel))
  {
    if (IsDirExists(aFolder[nCmd]))
      ChangeDir(nPan, aFolder[nCmd]);
    else
      WarningBox(hWndDlg, aFolder[nCmd] + "\n\n" + sTxtDirNoExists, sScriptName);
  }
}

function History(nPan)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_SEPARATOR = 0x0800;
  var hMenu = oSys.Call("User32::CreatePopupMenu");
  var nFlag = 0x0180; //TPM_RETURNCMD|TPM_NONOTIFY
  var oRect = {};
  var i;

  GetWindowPos(aWnd[IDHISTORYB0 + nPan][HWND], oRect);

  if (nPan === 0)
    oRect.X += oRect.W;
  else
    nFlag |= 0x0008; //TPM_RIGHTALIGN

  for (i = aHistory[nPan].length - 1; i >= 0; --i)
  {
    if ((i !== aCurHist[nPan]) && (! IsDirExists(aHistory[nPan][i][0])))
    {
      aHistory[nPan].splice(i, 1);
      if (i < aCurHist[nPan])
        --aCurHist[nPan];
    }
  }

  for (i = 0; i < aHistory[nPan].length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu, (i === aCurHist[nPan]) ? MF_CHECKED : MF_STRING, i + 1, aHistory[nPan][i][0]);

  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu, (aHistory.length > 1) ? MF_STRING : MF_GRAYED, nHistMax + 1, sTxtCleHistory);
  oSys.Call("User32::AppendMenuW", hMenu, bSaveHist ? MF_CHECKED : MF_STRING, nHistMax + 2, sTxtSaveHistory);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, nFlag, oRect.X, oRect.Y, 0, hWndDlg, 0);
  oSys.Call("User32::DestroyMenu", hMenu);

  if ((nCmd > 0) && (nCmd <= nHistMax))
  {
    if (--nCmd !== aCurHist[nPan])
    {
      if (IsDirExists(aHistory[nPan][nCmd][0]))
        ChangeDirFromHistory(nPan, nCmd);
      else
        WarningBox(hWndDlg, aHistory[nPan][nCmd][0] + "\n\n" + sTxtDirNoExists, sScriptName);
    }
  }
  else if (nCmd === nHistMax + 1)
  {
    aCurHist[nPan] = 0;
    aHistory[nPan] = [[aCurDir[nPan][aCurDrive[nPan]].Path, "", ""]];
  }
  else if (nCmd === nHistMax + 2)
    bSaveHist = ! bSaveHist;
}

function CheckHistory()
{
  for (var i = 0; i <= 1; ++i)
  {
    if (aHistory[i].length)
    {
      if (aCurHist[i] >= aHistory[i].length)
        aCurHist[i] = aHistory[i].length - 1;

      if (aHistory[i][aCurHist[i]][0] !== aCurDir[i][aCurDrive[i]].Path)
      {
        aHistory[i].push([aCurDir[i][aCurDrive[i]].Path, "", ""]);
        aCurHist[i] = aHistory[i].length - 1;
      }

      if (aHistory[i].length > nHistMax)
      {
        if (aCurHist[i] < nHistMax)
          aHistory[i].length = nHistMax;
        else
        {
          aHistory[i].length = aCurHist[i] + 1;
          aHistory[i].splice(0, aCurHist[i] + 1 - nHistMax);
          aCurHist[i] = nHistMax - 1;
        }
      }
    }
    else
    {
      aCurHist[i] = 0;
      aHistory[i] = [[aCurDir[i][aCurDrive[i]].Path, "", ""]];
    }
  }
}

function AddHistory(nPan, sPath)
{
  aHistory[nPan].length = aCurHist[nPan] + 1;
  aHistory[nPan].push([sPath, "", ""]);

  if (aHistory[nPan].length > nHistMax)
    aHistory[nPan].shift();

  aCurHist[nPan] = aHistory[nPan].length - 1;
}

function SetInternalAssoc(nIndex, nFocus, sExt)
{
  var bSet     = false;
  var sCaption;
  var aAssoc;

  if (nIndex < 0) //add association
  {
    GetCurFile(nCurPan);
    sCaption = sTxtAddAssoc;
    aAssoc   = [sExt, aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File, ""];
  }
  else //modify association
  {
    sCaption = sTxtModAssoc;
    aAssoc   = aIntAssoc[nIndex];
  }

  aAssoc = InputBox(hWndDlg, sCaption, [sTxtFileExtSep + ":", sTxtFullName + " (%a - " + sTxtAkelDir + ", %WinDir% - " + sTxtEnvVar + "):", sTxtAddPar], aAssoc, nFocus, "CheckInputInternalAssoc", nIndex);

  if (aAssoc)
  {
    aAssoc[0] = DelRedundantChars(aAssoc[0]).split(",");

    aAssoc[0].sort(
      function(sA, sB)
      {
        return oSys.Call("Kernel32::lstrcmpiW", sA, sB);
      });

    aAssoc[0] = aAssoc[0].join();

    if (nIndex < 0)
      aIntAssoc.push([aAssoc[0], aAssoc[1], aAssoc[2]]);
    else
      aIntAssoc[nIndex] = [aAssoc[0], aAssoc[1], aAssoc[2]];

    aIntAssoc.sort(
      function(aA, aB)
      {
        return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
      });

    bSet = true;
  }

  return bSet;
}

function DelRedundantChars(sText)
{
  sText = sText.replace(/^[,\s]+|\s+|[,\s]+$/, "");
  return sText.replace(/,+/, ",");
}

function CheckInputInternalAssoc(hWnd, aAssoc, nIndex)
{
  var sAppName;

  aAssoc[0] = DelRedundantChars(aAssoc[0]);

  if (! aAssoc[0])
  {
    WarningBox(hWnd, sTxtMustSpecify + ": " + sTxtFileExtSep, sScriptName);
    return 0;
  }

  if ((typeof nIndex === "number") && (IsInternalAssocExists(hWnd, aAssoc[0], nIndex)))
    return 0;

  if (! aAssoc[1])
  {
    WarningBox(hWnd, sTxtMustSpecify + ": " + sTxtFullName, sScriptName);
    return 1;
  }

  sAppName = ExpandFileName(aAssoc[1]);
  if (! IsFileExists(sAppName))
  {
    WarningBox(hWnd, sAppName + "\n\n" + sTxtFileNoExists, sScriptName);
    return 1;
  }

  return -1;
}

function IsInternalAssocExists(hWnd, sText, nIndex)
{
  var aExt = sText.split(",");
  var i, n;

  for (i = 0; i < aExt.length; ++i)
  {
    for (n = 0; n < aIntAssoc.length; ++n)
    {
      if ((aIntAssoc[n][0].toUpperCase().indexOf(aExt[i].toUpperCase()) >= 0) && (n !== nIndex))
      {
        WarningBox(hWnd, aExt[i] + "\n\n" + sTxtAssocExists, sScriptName);
        return true;
      }
    }
  }

  return false;
}

function RemoveInternalAssoc(nIndex)
{
  if (QuestionBox(hWndDlg, aIntAssoc[nIndex][0] + "\n" + aIntAssoc[nIndex][1] + "\n\n" + sTxtWantDelAssoc, sTxtDelAssoc))
    aIntAssoc.splice(nIndex, 1);
}

function SetExternalApp(nAppType, nAppIndex, nFocus)
{
  var bSet = false;
  var sCaption;
  var aApp;

  if (nAppType === 0)
  {
    sCaption = sTxtSetViewer + " " + nAppIndex;
    aApp     = (nAppIndex === 1) ? [sViewerName, sViewer, sViewerPar] : [sViewerName2, sViewer2, sViewerPar2];
  }
  else if (nAppType === 1)
  {
    sCaption = sTxtSetEditor + " " + nAppIndex;
    aApp     = (nAppIndex === 1) ? [sEditorName, sEditor, sEditorPar] : [sEditorName2, sEditor2, sEditorPar2];
  }
  else if (nAppType === 2)
  {
    sCaption = sTxtSetComparer + " " + nAppIndex;
    aApp     = (nAppIndex === 1) ? [sComparerName, sComparer, sComparerPar] : [sComparerName2, sComparer2, sComparerPar2];
  }
  else
  {
    if (nAppIndex < 0) //add favorite
    {
      sCaption = sTxtApplications + ": " + sTxtAddFavorite;
      aApp     = ["", "", ""];
    }
    else //modify favorite
    {
      sCaption = sTxtApplications + ": " + sTxtModFavorite;
      aApp     = aFavorite[nAppIndex];
    }
  }

  if (! aApp[1])
    GetNewExternalApp(aApp);

  aApp = InputBox(hWndDlg, sCaption, [sTxtDispName + ":", sTxtFullName + " (%a - " + sTxtAkelDir + ", %WinDir% - " + sTxtEnvVar + "):", sTxtAddPar], aApp, nFocus, "CheckInputExternalApp", (nAppType === 3) ? nAppIndex : undefined);

  if (aApp)
  {
    if (nAppType === 0)
    {
      if (nAppIndex === 1)
      {
        sViewerName = aApp[0];
        sViewer     = aApp[1];
        sViewerPar  = aApp[2];
      }
      else
      {
        sViewerName2 = aApp[0];
        sViewer2     = aApp[1];
        sViewerPar2  = aApp[2];
      }
    }
    else if (nAppType === 1)
    {
      if (nAppIndex === 1)
      {
        sEditorName = aApp[0];
        sEditor     = aApp[1];
        sEditorPar  = aApp[2];
      }
      else
      {
        sEditorName2 = aApp[0];
        sEditor2     = aApp[1];
        sEditorPar2  = aApp[2];
      }
    }
    else if (nAppType === 2)
    {
      if (nAppIndex === 1)
      {
        sComparerName = aApp[0];
        sComparer     = aApp[1];
        sComparerPar  = aApp[2];
      }
      else
      {
        sComparerName2 = aApp[0];
        sComparer2     = aApp[1];
        sComparerPar2  = aApp[2];
      }
    }
    else
    {
      if (nAppIndex < 0)
        aFavorite.push([aApp[0], aApp[1], aApp[2]]);
      else
        aFavorite[nAppIndex] = [aApp[0], aApp[1], aApp[2]];

      aFavorite.sort(
        function(aA, aB)
        {
          return oSys.Call("Kernel32::lstrcmpiW", aA[0], aB[0]);
        });
    }

    bSet = true;
  }

  return bSet;
}

function GetNewExternalApp(aApp)
{
  GetCurFile(nCurPan);

  if (aCurDir[nCurPan][aCurDrive[nCurPan]].File && (! CurFileIsDir(nCurPan)))
  {
    if (aCurDir[nCurPan][aCurDrive[nCurPan]].File.indexOf(".") >= 0)
      aApp[0] = aCurDir[nCurPan][aCurDrive[nCurPan]].File.substr(0, aCurDir[nCurPan][aCurDrive[nCurPan]].File.lastIndexOf("."));
    else
      aApp[0] = aCurDir[nCurPan][aCurDrive[nCurPan]].File;

    aApp[1] = aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File;
  }
}

function CheckInputExternalApp(hWnd, aApp, nIndex)
{
  var sAppName;

  if (! aApp[0])
  {
    WarningBox(hWnd, sTxtMustSpecify + ": " + sTxtDispName, sScriptName);
    return 0;
  }

  if ((typeof nIndex === "number") && (IsNameInArray(aFavorite, aApp[0], nIndex)))
  {
    WarningBox(hWnd, aApp[0] + "\n\n" + sTxtNameExists, sScriptName);
    return 0;
  }

  if (! aApp[1])
  {
    WarningBox(hWnd, sTxtMustSpecify + ": " + sTxtFullName, sScriptName);
    return 1;
  }

  sAppName = ExpandFileName(aApp[1]);
  if (! IsFileExists(sAppName))
  {
    WarningBox(hWnd, sAppName + "\n\n" + sTxtFileNoExists, sScriptName);
    return 1;
  }

  return -1;
}

function RemoveFavoriteApp(nIndex)
{
  if (QuestionBox(hWndDlg, aFavorite[nIndex][0] + "\n" + aFavorite[nIndex][1] + "\n\n" + sTxtWantDelFav, sTxtApplications + ": " + sTxtDelFavorite))
    aFavorite.splice(nIndex, 1);
}

function RunFavoriteApp(nAppIndex)
{
  var sAppName = ExpandFileName(aFavorite[nAppIndex][1]);

  if (! IsFileExists(sAppName))
  {
    if (SetExternalApp(3, nAppIndex, 1))
      sAppName = ExpandFileName(aFavorite[nAppIndex][1]);
    else
      return;
  }

  AkelPad.Exec(sAppName + ' ' + aFavorite[nAppIndex][2]);
}

function RunAkelScript(bArg)
{
  var sScriptsDir = AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/);
  var sArgument   = "";
  var sExtension;
  var sScript;
  var nLevel;
  var i;

  GetCurFile(nCurPan);
  sExtension = aCurDir[nCurPan][aCurDrive[nCurPan]].File.substr(aCurDir[nCurPan][aCurDrive[nCurPan]].File.lastIndexOf(".") + 1).toUpperCase();

  if ((! aCurDir[nCurPan][aCurDrive[nCurPan]].File) ||
      (CurFileIsDir(nCurPan)) ||
      ((sExtension !== "JS") && (sExtension !== "VBS")))
  {
    WarningBox(hWndDlg, sTxtJsVbsOnly, sTxtRunScript);
    return;
  }

  if (aCurDrive[nCurPan] !== sScriptsDir.substr(0, 2))
  {
    WarningBox(hWndDlg, sTxtNoRunScript, sTxtRunScript);
    return;
  }

  if (bArg)
  {
    if (aCurDir[nCurPan][aCurDrive[nCurPan]].File in oScrArg)
      sArgument = oScrArg[aCurDir[nCurPan][aCurDrive[nCurPan]].File];

    sArgument = InputBox(hWndDlg, sTxtRunScript, aCurDir[nCurPan][aCurDrive[nCurPan]].File + "\n\n" + sTxtInpArgs, sArgument);

    if (sArgument === undefined)
      return;
    else if (sArgument)
      oScrArg[aCurDir[nCurPan][aCurDrive[nCurPan]].File] = sArgument;
  }

  if (! IsDriveExists(aCurDrive[nCurPan]))
  {
    MessageNoDrive(nCurPan, aCurDrive[nCurPan]);
    return;
  }

  //No parent dir
  if (! IsDirExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path))
  {
    MessageNoFile(nCurPan, 1, 1);
    return;
  }

  if (IsFileExists(aCurDir[nCurPan][aCurDrive[nCurPan]].Path + aCurDir[nCurPan][aCurDrive[nCurPan]].File))
  {
    if ((sScriptsDir + "\\").toUpperCase() === aCurDir[nCurPan][aCurDrive[nCurPan]].Path.toUpperCase())
     sScript = aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    else
    {
      nLevel      = sScriptsDir.match(/\\/g).length;
      sScriptsDir = "";

      for (i = 0; i < nLevel; ++i)
        sScriptsDir += "..\\";

      sScript = sScriptsDir + aCurDir[nCurPan][aCurDrive[nCurPan]].Path.substr(3) + aCurDir[nCurPan][aCurDrive[nCurPan]].File;
    }

    AkelPad.Call("Scripts::Main", 1, sScript, sArgument);
  }
  else
    MessageNoFile(nCurPan);
}

function GetFileName(sCaption, sLabel, sName)
{
  return InputBox(hWndDlg, sCaption, sLabel, sName, null, "CheckInputFileName");
}

function CheckInputFileName(hWnd, aFile)
{
  var nIndex;

  if (aFile[0])
  {
    if (/^(CON|PRN|AUX|NUL|COM1|COM2|COM3|COM4|COM5|COM6|COM7|COM8|COM9|LPT1|LPT2|LPT3|LPT4|LPT5|LPT6|LPT7|LPT8|LPT9)$/i.test(aFile[0]))
    {
      WarningBox(hWndDlg, aFile[0] + "\n\n" + sTxtBadName, sScriptName);
      return 0;
    }

    else
    {
      nIndex = aFile[0].search(/[<>:"/\\|?*]/);
      if (nIndex >= 0)
      {
        WarningBox(hWndDlg, aFile[0] + "\n\n" + sTxtBadChar + ": " + aFile[0].substr(nIndex, 1), sScriptName);
        return 0;
      }
    }
  }

  return -1;
}

function MessageNoDrive(nPan, sDrive)
{
  WarningBox(hWndDlg, sDrive + "\n\n" + sTxtNoDrive, sScriptName);
  oSys.Call("User32::SetFocus", aWnd[IDDRIVECB0 + nPan][HWND]);
}

function MessageNoFile(nPan, bDir, bParentDir)
{
  var nSelPos = GetCurSelLV(aWnd[IDFILELV0 + nPan][HWND]);
  var sMessage;
  var sFile;
  var sSelFile;

  if (bDir)
  {
    sMessage = sTxtNoDirRefr;
    if (bParentDir)
      sFile = "";
    else
      sFile = aCurDir[nPan][aCurDrive[nPan]].File + "\\";
  }
  else
  {
    sMessage = sTxtNoFileRefr;
    sFile    = aCurDir[nPan][aCurDrive[nPan]].File;
  }

  WarningBox(hWndDlg, aCurDir[nPan][aCurDrive[nPan]].Path + sFile + "\n\n" + sMessage, sScriptName);

  while ((aCurDir[nPan][aCurDrive[nPan]].Path.length > 3) &&
         (! IsDirExists(aCurDir[nPan][aCurDrive[nPan]].Path)))
  {
    aCurDir[nCurPan][aCurDrive[nCurPan]].Path = aCurDir[nCurPan][aCurDrive[nCurPan]].Path.slice(0, -1);
    sSelFile = aCurDir[nCurPan][aCurDrive[nCurPan]].Path.substr(aCurDir[nCurPan][aCurDrive[nCurPan]].Path.lastIndexOf("\\") + 1);
    aCurDir[nCurPan][aCurDrive[nCurPan]].Path = aCurDir[nCurPan][aCurDrive[nCurPan]].Path.substr(0, aCurDir[nCurPan][aCurDrive[nCurPan]].Path.lastIndexOf("\\") + 1);
  }

  SetWndText(aWnd[IDDIRS0 + nPan][HWND], aCurDir[nPan][aCurDrive[nPan]].Path);
  FillFileList(nPan, sSelFile, nSelPos);
  FillStreamList(nPan);
}

function MessageNoStream(sName)
{
  var nPan2 = Number(! nCurPan);

  WarningBox(hWndDlg, sName + "\n\n" + sTxtNoStreamRefr, sScriptName);
  RefreshStreamList(nCurPan);

  if ((aCurDir[nCurPan][aCurDrive[nCurPan]].Path === aCurDir[nPan2][aCurDrive[nPan2]].Path) &&
      (aCurDir[nCurPan][aCurDrive[nCurPan]].File === aCurDir[nPan2][aCurDrive[nPan2]].File))
    RefreshStreamList(nPan2);
}

function WarningBox(hWnd, sText, sCaption)
{
  AkelPad.MessageBox(hWnd, sText, sCaption, 0x00000030 /*MB_ICONWARNING*/);
}

function QuestionBox(hWnd, sText, sCaption, nDefButton)
{
  var nType = (nDefButton << 8) | 0x23 /*MB_ICONQUESTION|MB_YESNOCANCEL*/;

  return (AkelPad.MessageBox(hWnd, sText, sCaption, nType) === 6 /*IDYES*/);
}

function MainMenu()
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_POPUP     = 0x0010;
  var MF_SEPARATOR = 0x0800;
  var hMenu0102 = oSys.Call("User32::CreatePopupMenu");
  var hMenu0103 = oSys.Call("User32::CreatePopupMenu");
  var hMenu0105 = oSys.Call("User32::CreatePopupMenu");
  var hMenu01   = oSys.Call("User32::CreatePopupMenu");
  var hMenu02   = oSys.Call("User32::CreatePopupMenu");
  var hMenu03   = oSys.Call("User32::CreatePopupMenu");
  var hMenu04   = oSys.Call("User32::CreatePopupMenu");
  var hMenu0504 = oSys.Call("User32::CreatePopupMenu");
  var hMenu05   = oSys.Call("User32::CreatePopupMenu");
  var hMenu06   = oSys.Call("User32::CreatePopupMenu");
  var hMenu07   = oSys.Call("User32::CreatePopupMenu");
  var hMenu0708 = oSys.Call("User32::CreatePopupMenu");
  var hMenu0709 = oSys.Call("User32::CreatePopupMenu");
  var hMenu0801 = oSys.Call("User32::CreatePopupMenu");
  var hMenu0802 = oSys.Call("User32::CreatePopupMenu");
  var hMenu08   = oSys.Call("User32::CreatePopupMenu");
  var hMenu     = oSys.Call("User32::CreatePopupMenu");
  var oRect     = {};
  var nCmd;
  var i;

  //File
  for (i = 0; i < aIntAssoc.length; ++i)
  {
    oSys.Call("User32::AppendMenuW", hMenu0102, MF_STRING, 0x010201 + i, aIntAssoc[i][0]);
    oSys.Call("User32::AppendMenuW", hMenu0103, MF_STRING, 0x010301 + i, aIntAssoc[i][0]);
  }
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010501, sTxtFile + "\tCtrl+Ins");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010502, sTxtPath + "\\" + sTxtFile + "\tCtrl+Shift+Ins");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010503, sTxtPath + "\tCtrl+Atl+Ins");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010504, sTxtStream + "\tAlt+Ins");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010505, sTxtPath + "\\" + sTxtFile + ":" + sTxtStream + "\tShift+Alt+Ins");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010506, sTxtFile + ":" + sTxtStream + "\tCtrl+Shift+Atl+Ins");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010507, sTxtFilesList + "\tCtrl+C");
  oSys.Call("User32::AppendMenuW", hMenu0105, MF_STRING, 0x010508, sTxtStreamsList + "\tAlt+C");
  oSys.Call("User32::AppendMenuW", hMenu01, (aIntAssoc.length < 0xFF) ? MF_STRING : MF_GRAYED, 0x010100, sTxtAddAssoc);
  oSys.Call("User32::AppendMenuW", hMenu01, aIntAssoc.length ? MF_POPUP : MF_GRAYED, hMenu0102, sTxtModAssoc);
  oSys.Call("User32::AppendMenuW", hMenu01, aIntAssoc.length ? MF_POPUP : MF_GRAYED, hMenu0103, sTxtDelAssoc);
  oSys.Call("User32::AppendMenuW", hMenu01, aIntAssoc.length ? MF_STRING : MF_GRAYED, 0x010400, sTxtCleAssoc);
  oSys.Call("User32::AppendMenuW", hMenu01, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu01, MF_POPUP, hMenu0105, sTxtCopyNames);
  oSys.Call("User32::AppendMenuW", hMenu01, MF_STRING,  0x010600, sTxtProperties + "\tAlt+Enter");

  //Drive
  oSys.Call("User32::AppendMenuW", hMenu02, ((bDualPan || (nCurPan === 0)) ? MF_STRING : MF_GRAYED), 0x020100, sTxtLeftPanel + "\tAlt+F1");
  oSys.Call("User32::AppendMenuW", hMenu02, ((bDualPan || (nCurPan === 1)) ? MF_STRING : MF_GRAYED), 0x020200, sTxtRightPanel + "\tAlt+F2");

  //Directory
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030100, sTxtGoToParent + "\t<-");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030200, sTxtGoToSubDir + "\t->");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030300, sTxtGoToMain + "\tCtrl+\\");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030400, sTxtFavFolders + "\tAlt+F");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030500, sTxtSpecFolders + "\tAlt+S");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030600, sTxtHistory + "\tAlt+H");
  oSys.Call("User32::AppendMenuW", hMenu03, (aCurHist[nCurPan] > 0) ? MF_STRING : MF_GRAYED, 0x030700, sTxtUndo + "\tAlt+<-");
  oSys.Call("User32::AppendMenuW", hMenu03, (aCurHist[nCurPan] < aHistory[nCurPan].length - 1) ? MF_STRING : MF_GRAYED, 0x030800, sTxtRedo + "\tAlt+->");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030900, sTxtRightToLeft + "\tCtrl+<-");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030A00, sTxtLeftToRight + "\tCtrl+->");
  oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x030B00, sTxtSwapPanels + "\tCtrl+U");

  //Filter
  oSys.Call("User32::AppendMenuW", hMenu04, ((bDualPan || (nCurPan === 0)) ? MF_STRING : MF_GRAYED), 0x040100, sTxtLeftPanel + "\tAlt+1");
  oSys.Call("User32::AppendMenuW", hMenu04, ((bDualPan || (nCurPan === 1)) ? MF_STRING : MF_GRAYED), 0x040200, sTxtRightPanel + "\tAlt+2");

  //Show
  oSys.Call("User32::AppendMenuW", hMenu0504, (! (bColSize || bColTime || bColAttr) ? MF_CHECKED : MF_STRING), 0x050401, sTxtOnlyName + "\tShift+F1");
  oSys.Call("User32::AppendMenuW", hMenu0504, (bColSize ? MF_CHECKED : MF_STRING), 0x050402, sTxtSize + "\tShift+F2");
  oSys.Call("User32::AppendMenuW", hMenu0504, (bColTime ? MF_CHECKED : MF_STRING), 0x050403, sTxtTime + "\tShift+F3");
  oSys.Call("User32::AppendMenuW", hMenu0504, (bColAttr ? MF_CHECKED : MF_STRING), 0x050404, sTxtAttributes + "\tShift+F4");
  oSys.Call("User32::AppendMenuW", hMenu05, ((bDualPan || (nCurPan === 0)) ? MF_CHECKED : MF_STRING), 0x050100, sTxtLeftPanel + "\tCtrl+F1");
  oSys.Call("User32::AppendMenuW", hMenu05, ((bDualPan || (nCurPan === 1)) ? MF_CHECKED : MF_STRING), 0x050200, sTxtRightPanel + "\tCtrl+F2");
  oSys.Call("User32::AppendMenuW", hMenu05, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu05, (bQuickView ? MF_CHECKED : MF_STRING), 0x050300, sTxtQuickView + "\tCtrl+Q");
  oSys.Call("User32::AppendMenuW", hMenu05, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu05, MF_POPUP, hMenu0504, sTxtColumns);

  //Window
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060100, sTxtMoveLeft + "\tShift+Alt+<-");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060200, sTxtMoveRight + "\tShift+Alt+->");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060300, sTxtMoveUp + "\tShift+Alt+Up");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060400, sTxtMoveDown + "\tShift+Alt+Down");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060500, sTxtToLeftEdge + "\tShift+Alt+Home");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060600, sTxtToRightEdge + "\tShift+Alt+End");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060700, sTxtToTopEdge + "\tShift+Alt+PgUp");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060800, sTxtToBottomEdge + "\tShift+Alt+PgDn");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060900, sTxtCenter + "\tShift+Alt+C");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x060A00, sTxtMaximize + "\tShift+Alt+M");

  //Applications
  for (i = 0; i < aFavorite.length; ++i)
  {
    oSys.Call("User32::AppendMenuW", hMenu0708, MF_STRING, 0x070801 + i, aFavorite[i][0]);
    oSys.Call("User32::AppendMenuW", hMenu0709, MF_STRING, 0x070901 + i, aFavorite[i][0]);
  }
  oSys.Call("User32::AppendMenuW", hMenu07, MF_STRING, 0x070100, sTxtViewer + " 1: " + sViewerName + "\tCtrl+Shift+F3");
  oSys.Call("User32::AppendMenuW", hMenu07, MF_STRING, 0x070200, sTxtViewer + " 2: " + sViewerName2 + "\tCtrl+Alt+F3");
  oSys.Call("User32::AppendMenuW", hMenu07, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu07, MF_STRING, 0x070300, sTxtEditor + " 1: " + sEditorName + "\tCtrl+Shift+F4");
  oSys.Call("User32::AppendMenuW", hMenu07, MF_STRING, 0x070400, sTxtEditor + " 2: " + sEditorName2 + "\tCtrl+Alt+F4");
  oSys.Call("User32::AppendMenuW", hMenu07, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu07, MF_STRING, 0x070500, sTxtComparer + " 1: " + sComparerName + "\tCtrl+Shift+F12");
  oSys.Call("User32::AppendMenuW", hMenu07, MF_STRING, 0x070600, sTxtComparer + " 2: " + sComparerName2 + "\tCtrl+Alt+F12");
  oSys.Call("User32::AppendMenuW", hMenu07, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu07, (aFavorite.length < 0xFF) ? MF_STRING : MF_GRAYED, 0x070700, sTxtAddFavorite);
  oSys.Call("User32::AppendMenuW", hMenu07, aFavorite.length ? MF_POPUP : MF_GRAYED, hMenu0708, sTxtModFavorite);
  oSys.Call("User32::AppendMenuW", hMenu07, aFavorite.length ? MF_POPUP : MF_GRAYED, hMenu0709, sTxtDelFavorite);
  oSys.Call("User32::AppendMenuW", hMenu07, aFavorite.length ? MF_STRING : MF_GRAYED, 0x070A00, sTxtCleFavorite);

  //Run
  oSys.Call("User32::AppendMenuW", hMenu0801, MF_STRING, 0x080101, sTxtWithoutArgs + "\tCtrl+Enter");
  oSys.Call("User32::AppendMenuW", hMenu0801, MF_STRING, 0x080102, sTxtWithArgs + "\tCtrl+Shift+Enter");
  for (i = 0; i < aFavorite.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu0802, MF_STRING, 0x080201 + i, aFavorite[i][0]);
  oSys.Call("User32::AppendMenuW", hMenu08, MF_POPUP, hMenu0801, sTxtAkelScript);
  oSys.Call("User32::AppendMenuW", hMenu08, aFavorite.length ? MF_POPUP : MF_GRAYED, hMenu0802, sTxtFavorites);
  oSys.Call("User32::AppendMenuW", hMenu08, MF_STRING, 0x080300, sTxtCommandLine);

  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu01, sTxtFile);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu02, sTxtDrive);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu03, sTxtDirectory);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu04, sTxtFilter);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu05, sTxtShow);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu06, sTxtWindow);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu07, sTxtApplications);
  oSys.Call("User32::AppendMenuW", hMenu, MF_POPUP, hMenu08, sTxtRun);
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, 0x090000, sTxtExit);

  GetWindowPos(aWnd[IDMENUB][HWND], oRect);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x01A0 /*TPM_NONOTIFY|TPM_RETURNCMD|TPM_BOTTOMALIGN*/, oRect.X, oRect.Y, 0, hWndDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu0102);
  oSys.Call("User32::DestroyMenu", hMenu0103);
  oSys.Call("User32::DestroyMenu", hMenu0105);
  oSys.Call("User32::DestroyMenu", hMenu01);
  oSys.Call("User32::DestroyMenu", hMenu02);
  oSys.Call("User32::DestroyMenu", hMenu03);
  oSys.Call("User32::DestroyMenu", hMenu04);
  oSys.Call("User32::DestroyMenu", hMenu0504);
  oSys.Call("User32::DestroyMenu", hMenu05);
  oSys.Call("User32::DestroyMenu", hMenu06);
  oSys.Call("User32::DestroyMenu", hMenu07);
  oSys.Call("User32::DestroyMenu", hMenu0708);
  oSys.Call("User32::DestroyMenu", hMenu0709);
  oSys.Call("User32::DestroyMenu", hMenu0801);
  oSys.Call("User32::DestroyMenu", hMenu0802);
  oSys.Call("User32::DestroyMenu", hMenu08);
  oSys.Call("User32::DestroyMenu", hMenu);

  switch (nCmd)
  {
    case 0x010100 : SetInternalAssoc(-1); //add internal association
      break;
    case 0x010400 :
      if (QuestionBox(hWndDlg, sTxtWantCleAssoc, sTxtCleAssoc, 1))
        aIntAssoc = [];
      break;
    case 0x010501 : CopyNameToCB(1);
      break;
    case 0x010502 : CopyNameToCB(3);
      break;
    case 0x010503 : CopyNameToCB(5);
      break;
    case 0x010504 : CopyNameToCB(4);
      break;
    case 0x010505 : CopyNameToCB(6);
      break;
    case 0x010506 : CopyNameToCB(7);
      break;
    case 0x010507 : CopyListToCB(0);
      break;
    case 0x010508 : CopyListToCB(1);
      break;
    case 0x010600 : Properties();
      break;
    case 0x020100 : oSys.Call("User32::SetFocus", aWnd[IDDRIVECB0][HWND]);
      break;
    case 0x020200 : oSys.Call("User32::SetFocus", aWnd[IDDRIVECB1][HWND]);
      break;
    case 0x030100 : Open(nCurPan, -1);
      break;
    case 0x030200 : Open(nCurPan, 1);
      break;
    case 0x030300 : Open(nCurPan, -2);
      break;
    case 0x030400 : FavoriteFolders(nCurPan);
      break;
    case 0x030500 : SpecialFolders(nCurPan);
      break;
    case 0x030600 : History(nCurPan);
      break;
    case 0x030700 : ChangeDirFromHistory(nCurPan, 0, -1);
      break;
    case 0x030800 : ChangeDirFromHistory(nCurPan, 0, 1);
      break;
    case 0x030900 : ClonePanel(0);
      break;
    case 0x030A00 : ClonePanel(1);
      break;
    case 0x030B00 : SwapPanels();
      break;
    case 0x040100 : oSys.Call("User32::SetFocus", aWnd[IDFILTERCB0][HWND]);
      break;
    case 0x040200 : oSys.Call("User32::SetFocus", aWnd[IDFILTERCB1][HWND]);
      break;
    case 0x050100 : ShowPanel(0);
      break;
    case 0x050200 : ShowPanel(1);
      break;
    case 0x050300 : ShowQuickView();
      break;
    case 0x050401 : ShowColumn(1);
      break;
    case 0x050402 : ShowColumn(2);
      break;
    case 0x050403 : ShowColumn(3);
      break;
    case 0x050404 : ShowColumn(4);
      break;
    case 0x060100 : MoveDialog("L");
      break;
    case 0x060200 : MoveDialog("R");
      break;
    case 0x060300 : MoveDialog("U");
      break;
    case 0x060400 : MoveDialog("D");
      break;
    case 0x060500 : MoveDialog("H");
      break;
    case 0x060600 : MoveDialog("E");
      break;
    case 0x060700 : MoveDialog("T");
      break;
    case 0x060800 : MoveDialog("B");
      break;
    case 0x060900 : MoveDialog("C");
      break;
    case 0x060A00 : MoveDialog("M");
      break;
    case 0x070100 : SetExternalApp(0, 1);
      break;
    case 0x070200 : SetExternalApp(0, 2);
      break;
    case 0x070300 : SetExternalApp(1, 1);
      break;
    case 0x070400 : SetExternalApp(1, 2);
      break;
    case 0x070500 : SetExternalApp(2, 1);
      break;
    case 0x070600 : SetExternalApp(2, 2);
      break;
    case 0x070700 : SetExternalApp(3, -1); //add favorite app
      break;
    case 0x070A00 :
      if (QuestionBox(hWndDlg, sTxtWantCleFavAp, sTxtApplications + ": " + sTxtCleFavorite, 1))
        aFavorite = [];
      break;
    case 0x080101 : RunAkelScript(0);
      break;
    case 0x080102 : RunAkelScript(1);
      break;
    case 0x080300 : AkelPad.Exec("cmd.exe", aCurDir[nCurPan][aCurDrive[nCurPan]].Path);
      break;
    case 0x090000 : oSys.Call("User32::PostMessageW", hWndDlg, 16 /*WM_CLOSE*/, 0, 0);
      break;
    default :
      if ((nCmd >= 0x010201) && (nCmd <= 0x0102FF))
        SetInternalAssoc(nCmd - 0x010201); //modify internal association
      else if ((nCmd >= 0x010301) && (nCmd <= 0x0103FF))
        RemoveInternalAssoc(nCmd - 0x010301);
      else if ((nCmd >= 0x070801) && (nCmd <= 0x0708FF))
        SetExternalApp(3, nCmd - 0x070801); //modify favorite app
      else if ((nCmd >= 0x070901) && (nCmd <= 0x0709FF))
        RemoveFavoriteApp(nCmd - 0x070901);
      else if ((nCmd >= 0x080201) && (nCmd <= 0x0802FF))
        RunFavoriteApp(nCmd - 0x080201);
  }
}

function ContextMenu(hWnd, lpPoint)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_POPUP     = 0x0010;
  var MF_SEPARATOR = 0x0800;
  var hMenu03 = oSys.Call("User32::CreatePopupMenu");
  var hMenu05 = oSys.Call("User32::CreatePopupMenu");
  var hMenu06 = oSys.Call("User32::CreatePopupMenu");
  var hMenu07 = oSys.Call("User32::CreatePopupMenu");
  var hMenu09 = oSys.Call("User32::CreatePopupMenu");
  var hMenu0A = oSys.Call("User32::CreatePopupMenu");
  var hMenu0B = oSys.Call("User32::CreatePopupMenu");
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var lpRect;
  var nCmd;
  var nX, nY;
  var i;

  for (i = 0; i < aFavorite.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu03, MF_STRING, 0x0301 + i, aFavorite[i][0]);

  oSys.Call("User32::AppendMenuW", hMenu05, MF_STRING, 0x0501, (sViewerName ? sViewerName : sTxtViewer + " 1") + "\tF3");
  oSys.Call("User32::AppendMenuW", hMenu05, MF_STRING, 0x0502, (sViewerName2 ? sViewerName2 : sTxtViewer + " 2") + "\tCtrl+F3");

  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x0601, (sEditorName ? sEditorName : sTxtEditor + " 1") + "\tF4");
  oSys.Call("User32::AppendMenuW", hMenu06, MF_STRING, 0x0602, (sEditorName2 ? sEditorName2 : sTxtEditor + " 2") + "\tCtrl+F4");

  oSys.Call("User32::AppendMenuW", hMenu07, CopyAvailable(0) ? MF_STRING : MF_GRAYED, 0x0701, sTxtToSecPanel + "\tF5");
  oSys.Call("User32::AppendMenuW", hMenu07, CopyAvailable(1) ? MF_STRING : MF_GRAYED, 0x0702, sTxtToOwnPanel + "\tShift+F5");

  oSys.Call("User32::AppendMenuW", hMenu09, (aCurWnd[nCurPan] === 0) ? MF_STRING : MF_GRAYED, 0x0901, sTxtDirectory + "\tF7");
  oSys.Call("User32::AppendMenuW", hMenu09, (aCurWnd[nCurPan] === 0) ? MF_STRING : MF_GRAYED, 0x0902, sTxtFile + "\tShift+F7");
  oSys.Call("User32::AppendMenuW", hMenu09, CreateStreamAvailable() ? MF_STRING : MF_GRAYED, 0x0903, sTxtStream + "\tF7");

  oSys.Call("User32::AppendMenuW", hMenu0A, (aCurWnd[nCurPan] === 0) ? MF_STRING : MF_GRAYED, 0x0A01, sTxtToRecBin + "\tF8");
  oSys.Call("User32::AppendMenuW", hMenu0A, (aCurWnd[nCurPan] === 0) ? MF_STRING : MF_GRAYED, 0x0A02, sTxtFromDisk + "\tShift+F8");
  oSys.Call("User32::AppendMenuW", hMenu0A, (aCurWnd[nCurPan] === 1) ? MF_STRING : MF_GRAYED, 0x0A03, sTxtDelStr + "\tF8");

  oSys.Call("User32::AppendMenuW", hMenu0B, MF_STRING, 0x0B01, (sComparerName ? sComparerName : sTxtComparer + " 1") + "\tF12");
  oSys.Call("User32::AppendMenuW", hMenu0B, MF_STRING, 0x0B02, (sComparerName2 ? sComparerName2 : sTxtComparer + " 2") + "\tCtrl+F12");

  if (aCurWnd[nCurPan] === 0)
  {
    oSys.Call("User32::AppendMenuW", hMenu, OpenAvailable(nCurPan, 0) ? MF_STRING : MF_GRAYED, 0x0100, sTxtOpenWin + "\tEnter");
    oSys.Call("User32::AppendMenuW", hMenu, OpenInAvailable(4) ? MF_STRING : MF_GRAYED, 0x0200, sTxtOpenInAssoc + "\tShift+Enter");
  }

  oSys.Call("User32::AppendMenuW", hMenu, (OpenInAvailable(3) && aFavorite.length) ? MF_POPUP : MF_GRAYED, hMenu03, sTxtOpenInFavor);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu, RenameAvailable() ? MF_STRING : MF_GRAYED, 0x0400, sTxtRename + "\tF2");
  oSys.Call("User32::AppendMenuW", hMenu, OpenInAvailable(0) ? MF_POPUP : MF_GRAYED, hMenu05, sTxtView);
  oSys.Call("User32::AppendMenuW", hMenu, OpenInAvailable(1) ? MF_POPUP : MF_GRAYED, hMenu06, sTxtEdit);
  oSys.Call("User32::AppendMenuW", hMenu, CopyAvailable(0) || CopyAvailable(1) ? MF_POPUP : MF_GRAYED, hMenu07, sTxtCopy);
  oSys.Call("User32::AppendMenuW", hMenu, CopyAvailable(0) ? MF_STRING : MF_GRAYED, 0x0800, sTxtMove + "\tF6");
  oSys.Call("User32::AppendMenuW", hMenu, (aCurWnd[nCurPan] === 0) || CreateStreamAvailable() ? MF_POPUP : MF_GRAYED, hMenu09, sTxtCreate);
  oSys.Call("User32::AppendMenuW", hMenu, DeleteAvailable() ? MF_POPUP : MF_GRAYED, hMenu0A, sTxtDelete);
  oSys.Call("User32::AppendMenuW", hMenu, CompareAvailable() ? MF_POPUP : MF_GRAYED, hMenu0B, sTxtCompare);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu, PropertiesAvailable() ? MF_STRING : MF_GRAYED, 0x0C00, sTxtProperties + "\tAlt+Enter");

  //menu from mouse r-click
  if (lpPoint)
  {
    oSys.Call("User32::ClientToScreen", hWnd, lpPoint);
    nX = AkelPad.MemRead(_PtrAdd(lpPoint, 0), DT_DWORD);
    nY = AkelPad.MemRead(_PtrAdd(lpPoint, 4), DT_DWORD);
  }
  //menu from keyboard
  else
  {
    lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
    AkelPad.SendMessage(hWnd, 0x100E /*LVM_GETITEMRECT*/, GetCurSelLV(hWnd), lpRect);

    oSys.Call("User32::ClientToScreen", hWnd, lpRect);
    oSys.Call("User32::ClientToScreen", hWnd, _PtrAdd(lpRect, 8));
    nX = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD) + 40;
    nY = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD);

    AkelPad.MemFree(lpRect);
  }

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, hWndDlg, 0);

  oSys.Call("User32::DestroyMenu", hMenu03);
  oSys.Call("User32::DestroyMenu", hMenu05);
  oSys.Call("User32::DestroyMenu", hMenu06);
  oSys.Call("User32::DestroyMenu", hMenu07);
  oSys.Call("User32::DestroyMenu", hMenu09);
  oSys.Call("User32::DestroyMenu", hMenu0A);
  oSys.Call("User32::DestroyMenu", hMenu0B);
  oSys.Call("User32::DestroyMenu", hMenu);

  switch (nCmd)
  {
    case 0x0100 : Open(nCurPan, 0);
      break;
    case 0x0200 : OpenIn(4);
      break;
    case 0x0400 : Rename();
      break;
    case 0x0501 : OpenIn(0, 1);
      break;
    case 0x0502 : OpenIn(0, 2);
      break;
    case 0x0601 : OpenIn(1, 1);
      break;
    case 0x0602 : OpenIn(1, 2);
      break;
    case 0x0701 : Copy(0, 0);
      break;
    case 0x0702 : Copy(0, 1);
      break;
    case 0x0800 : Copy(1, 0);
      break;
    case 0x0901 : Create(1);
      break;
    case 0x0902 :
    case 0x0903 : Create(0);
      break;
    case 0x0A01 : Delete(1);
      break;
    case 0x0A02 :
    case 0x0A03 : Delete(0);
      break;
    case 0x0B01 : Compare(1);
      break;
    case 0x0B02 : Compare(2);
      break;
    case 0x0C00 : Properties();
      break;
    default :
      if ((nCmd >= 0x0301) && (nCmd <= 0x03FF))
        OpenIn(3, nCmd - 0x0301); //open in favorite
  }
}

function ReadWriteIni(bWrite)
{
  var sIniFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + ".ini";
  var sIniTxt;
  var oError;
  var i;

  if (bWrite)
  {
    GetCurFile(0);
    GetCurFile(1);

    if (! bSaveHist)
    {
      aCurHist = [0, 0];
      aHistory = [[], []];
    }

    sIniTxt =
      'bDualPan='       + bDualPan + ';\r\n' +
      'bColSize='       + bColSize + ';\r\n' +
      'bColTime='       + bColTime + ';\r\n' +
      'bColAttr='       + bColAttr + ';\r\n' +
      'bQuickView='     + bQuickView + ';\r\n' +
      'bSaveHist='      + bSaveHist + ';\r\n' +
      'sViewerName='    + '"' + sViewerName.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sViewer='        + '"' + sViewer.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sViewerPar='     + '"' + sViewerPar.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sViewerName2='   + '"' + sViewerName2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sViewer2='       + '"' + sViewer2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sViewerPar2='    + '"' + sViewerPar2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sEditorName='    + '"' + sEditorName.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sEditor='        + '"' + sEditor.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sEditorPar='     + '"' + sEditorPar.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sEditorName2='   + '"' + sEditorName2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sEditor2='       + '"' + sEditor2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sEditorPar2='    + '"' + sEditorPar2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sComparerName='  + '"' + sComparerName.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sComparer='      + '"' + sComparer.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sComparerPar='   + '"' + sComparerPar.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sComparerName2=' + '"' + sComparerName2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sComparer2='     + '"' + sComparer2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'sComparerPar2='  + '"' + sComparerPar2.replace(/[\\"]/g, "\\$&") + '";\r\n' +
      'nCurPan='        + nCurPan + ';\r\n' +
      'aCurFilter=["'   + aCurFilter[0].replace(/[\\"]/g, "\\$&") + '","' + aCurFilter[1].replace(/[\\"]/g, "\\$&") + '"];\r\n' +
      'aCurHist=['      + aCurHist[0] + ',' + aCurHist[1] + '];\r\n' +
      'aCurWnd=['       + aCurWnd[0] + ',' + aCurWnd[1] + '];\r\n' +
      'aCurDrive=["'    + aCurDrive[0] + '","' + aCurDrive[1] + '"];\r\n' +
      'aCurDir[0]={';

    for (i in aCurDir[0])
      sIniTxt += '"' + i +
                 '":{Path:"'  + aCurDir[0][i].Path.replace(/[\\"]/g, "\\$&") +
                 '",File:"'   + aCurDir[0][i].File.replace(/[\\"]/g, "\\$&") +
                 '",Stream:"' + aCurDir[0][i].Stream.replace(/[\\"]/g, "\\$&") + '"},';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '};\r\naCurDir[1]={';

    for (i in aCurDir[1])
      sIniTxt += '"' + i +
                 '":{Path:"'  + aCurDir[1][i].Path.replace(/[\\"]/g, "\\$&") +
                 '",File:"'   + aCurDir[1][i].File.replace(/[\\"]/g, "\\$&") +
                 '",Stream:"' + aCurDir[1][i].Stream.replace(/[\\"]/g, "\\$&") + '"},';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '};\r\naFilter=[';

    for (i = 0; i < aFilter.length; ++i)
      sIniTxt += '"' + aFilter[i].replace(/[\\"]/g, "\\$&") + '",';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\naSort=[';

    for (i = 0; i < aSort.length; ++i)
      sIniTxt += '[' + aSort[i][0] + ',' + aSort[i][1] + '],';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\naFavorite=[';

    for (i = 0; i < aFavorite.length; ++i)
      sIniTxt += '["' + aFavorite[i][0].replace(/[\\"]/g, "\\$&") + '","' + aFavorite[i][1].replace(/[\\"]/g, "\\$&") + '","' + aFavorite[i][2].replace(/[\\"]/g, "\\$&") + '"],';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\naFavoriteFolder=[';

    for (i = 0; i < aFavoriteFolder.length; ++i)
      sIniTxt += '["' + aFavoriteFolder[i][0].replace(/[\\"]/g, "\\$&") + '","' + aFavoriteFolder[i][1].replace(/[\\"]/g, "\\$&") + '"],';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\naIntAssoc=[';

    for (i = 0; i < aIntAssoc.length; ++i)
      sIniTxt += '["' + aIntAssoc[i][0].replace(/[\\"]/g, "\\$&") + '","' + aIntAssoc[i][1].replace(/[\\"]/g, "\\$&") + '","' + aIntAssoc[i][2].replace(/[\\"]/g, "\\$&") + '"],';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\naHistory[0]=[';

    for (i = 0; i < aHistory[0].length; ++i)
      sIniTxt += '["' + aHistory[0][i][0].replace(/[\\"]/g, "\\$&") + '","' + aHistory[0][i][1].replace(/[\\"]/g, "\\$&") + '","' + aHistory[0][i][2].replace(/[\\"]/g, "\\$&") + '"],';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\naHistory[1]=[';

    for (i = 0; i < aHistory[1].length; ++i)
      sIniTxt += '["' + aHistory[1][i][0].replace(/[\\"]/g, "\\$&") + '","' + aHistory[1][i][1].replace(/[\\"]/g, "\\$&") + '","' + aHistory[1][i][2].replace(/[\\"]/g, "\\$&") + '"],';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '];\r\noScrArg={';

    for (i in oScrArg)
      sIniTxt += '"' + i +'":"' + oScrArg[i].replace(/[\\"]/g, "\\$&") + '",';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '};\r\noWndPos={';

    for (i in oWndPos)
      sIniTxt += i + ':' + oWndPos[i] + ',';
    if (sIniTxt.slice(-1) === ",")
      sIniTxt = sIniTxt.slice(0, -1);
    sIniTxt += '};';

    WriteFile(sIniFile, null, sIniTxt, 1);
  }

  else if (IsFileExists(sIniFile))
  {
    try
    {
      eval(AkelPad.ReadFile(sIniFile));
    }
    catch (oError)
    {
    }
  }
}

function GetLangStrings()
{
  var sLangFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + "_" + AkelPad.GetLangId(0 /*LANGID_FULL*/).toString() + ".lng";

  if (! IsFileExists(sLangFile))
  {
    sLangFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + "_1033.lng";
    if (! IsFileExists(sLangFile))
    {
      WScript.Echo("File does not exists:\n" + sLangFile);
      return false;
    }
  }

  eval(AkelPad.ReadFile(sLangFile));
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
 * Edit current path.
 */
function EditCurrentPath()
{
  sCurrentDir = InputBox(hWndDlg, "Edit the path", "Go To:", aCurDir[nCurPan][aCurDrive[nCurPan]].Path, null);
  if (sCurrentDir)
  {
    sCurrentDir = sCurrentDir.replace(/^\s+|\s+$/g, "").replace(/\//g, "\\").replace(/\\\\/g, "\\");
    if (! IsDirExists(sCurrentDir))
      popupShow("The directory does not exist!", 1);
    else
    {
      AddCurDir(nCurPan, sCurrentDir + ((sCurrentDir.slice(-1) === "\\")? "" : "\\"));
      FillFileList(nCurPan);
      RefreshPanel(nCurPan);
    }
  }
}
