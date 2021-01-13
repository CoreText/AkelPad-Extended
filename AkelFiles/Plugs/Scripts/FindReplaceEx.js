// http://akelpad.sourceforge.net/forum/viewtopic.php?p=20852#20852
// Version: 2018-11-06
// Author: KDJ
//
// *** Extended version of "Find/Replace" dialog ***
//
// Required to include: InputBox_function.js
//
// Usage:
//  Call("Scripts::Main", 1, "FindReplaceEx.js")             - "Find" dialog
//  Call("Scripts::Main", 1, "FindReplaceEx.js", '-dlg="R"') - "Replace" dialog
//  Call("Scripts::Main", 1, "FindReplaceEx.js", '-dlg="R" -FR="M+R+S" -RDB="A"') - "Replace" dialog, select "Match case" and "Regular expressions", direction "In selection", set default push button to "Replace all",
//  Call("Scripts::Main", 1, "FindReplaceEx.js", '-dlg="B" -FR="A" -FRE="D+M+" -BR=-2') - replace all files using batch #2 without confirmation and message, next close dialog
//
// Arguments:
//   -dlg - dialog that will be displayed when you run the script:
//     "F" - "Find" (default)
//     "R" - "Replace"
//     "G" - "Go to"
//     "B" - "Batch replace"
//   -GT - set "Go to" initial parameter:
//     "L" - "Line:Column"
//     "O" - "Offset"
//   -FR - set "Find/Replace" initial parameters:
//     "M+"  - "Match case" check
//     "M-"  - "Match case" uncheck
//     "W+"  - "Whole word" check
//     "W-"  - "Whole word" uncheck
//     "R+"  - "Regular expressions" check
//     "R-"  - "Regular expressions" uncheck
//     "RN+" - ". matches \n" check
//     "RN-" - ". matches \n" uncheck
//     "E+"  - "Esc-sequences" check
//     "E-"  - "Esc-sequences" uncheck
//     "D"   - "Down" (direction)
//     "U"   - "Up"
//     "B"   - "Begining"
//     "S"   - "In selection"
//     "A"   - "All files"
//   -FRE - set "Find/Replace" extended parameters:
//     "D+" - ""Replace all" closes dialog" check
//     "D-" - ""Replace all" closes dialog" uncheck
//     "M+" - ""Replace all" without message" check
//     "M-" - ""Replace all" without message" uncheck
//     "S+" - "Check "in selection" if selection not empty" check
//     "S-" - "Check "in selection" if selection not empty" uncheck
//     "C+" - "Cycle search" check
//     "C-" - "Cycle search" uncheck
//     "P+" - "Prompt" check
//     "P-" - "Prompt" uncheck
//   -RDB - change default push button in "Replace" dialog:
//     "R" - "Replace"
//     "A" - "Replace all"
//   -BR - batch replace all using batch with the specified number, eg:
//     -BR=5  - replace all using batch #5
//     -BR=-5 - same, but without confirmation
//
// Manual parameters (set in FindReplaceEx.ini file):
//   bGoToDlg=true; - allows to switch to "Go to" dialog
//   bFastCount=false; - if true, "Count" function is executed faster, but it can't be stopped
//
// In "Find/Replace" dialog:
//   F1       - help for regular expressions (if "Regular expressions" is checked)
//   Ctrl+F1  - AkelHelp-*.htm in default browser (if "Regular expressions" is checked)
//   Shift+F1 - AkelHelp-*.htm in HtmlView.js (if "Regular expressions" is checked and HtmlView.js is available)
//   F2       - Templates/Batches
//
// In "Templates/Batches" dialog:
//   F1         - help for regular expressions
//   Ctrl+F1    - AkelHelp-*.htm in default browser
//   Shift+F1   - AkelHelp-*.htm in HtmlView.js
//   F3         - next template (Shift+F3 - previous)
//   Ctrl+Tab   - next batch (Ctrl+Shift+Tab - previous batch)
//   Ctrl+(1-9) - select batch number
//   Alt+Right  - add template to batch
//   Enter      - OK, set current template into "Find/Replace" dialog (also double click in item list)
//   Esc        - close dialog
//   RightClick - context menu (edit boxes, list headers and batch tabs)
//   If focus is in templates list:
//     Ins       - New button, new template based on current one
//     Ctrl+Ins  - Add button, add template based on "Find/Replace" dialog (also with Shift)
//     F2        - rename template
//     Alt+Up    - move template up (move works only if sorting isn't set)
//     Alt+Down  - move template down
//     Ctrl+Del  - remove template (also with Shift or Alt)
//   If focus is in batches list:
//     F2       - rename batch
//     Alt+Up   - move item up
//     Alt+Down - move item down
//     Ctrl+Del - remove item from list (also with Shift or Alt)
//
// Remarks:
//   Find/Replace templates are saved in file FindReplaceEx_templates.tsv
//   HtmlView.js is here: http://akelpad.sourceforge.net/forum/viewtopic.php?p=29221#29221

var oSys     = AkelPad.SystemFunction();
var hInstDLL = AkelPad.GetInstanceDll();
var sClass   = "AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("Kernel32::GetCurrentProcessId");

if ((! AkelPad.GetEditWnd()) || (! AkelPad.Include("InputBox_function.js")) || oSys.Call("User32::FindWindowExW", 0, 0, sClass, 0))
  WScript.Quit();

var DT_UNICODE = 1;
var DT_QWORD   = 2;
var DT_DWORD   = 3;
var DT_WORD    = 4;

//AKD_GETMODELESS types
var MLT_FIND    = 3;
var MLT_REPLACE = 4;
var MLT_GOTO    = 5;

//Find/Replace flags
var FRF_DOWN               = 0x00000001;
var FRF_WHOLEWORD          = 0x00000002;
var FRF_MATCHCASE          = 0x00000004;
var FRF_REGEXPNONEWLINEDOT = 0x00040000;
var FRF_REGEXP             = 0x00080000;
var FRF_UP                 = 0x00100000;
var FRF_BEGINNING          = 0x00200000; //FRF_DOWN|FRF_BEGINNING
var FRF_SELECTION          = 0x00400000; //FRF_DOWN|FRF_SELECTION
var FRF_ESCAPESEQ          = 0x00800000;
var FRF_ALLFILES           = 0x01000000; //FRF_DOWN|FRF_BEGINNING|FRF_ALLFILES
var FRF_REPLACEALLANDCLOSE = 0x02000000;
var FRF_CHECKINSELIFSEL    = 0x04000000;
var FRF_CYCLESEARCH        = 0x08000000;
var FRF_CYCLESEARCHPROMPT  = 0x10000000;
var FRF_REPLACEALLNOMSG    = 0x20000000;

var IDCANCEL                  = 2;
var IDC_SEARCH_FIND           = 3052; //Combobox What
var IDC_SEARCH_REPLACE        = 3053; //Combobox With
var IDC_SEARCH_MATCHCASE      = 3054;
var IDC_SEARCH_WHOLEWORD      = 3055;
var IDC_SEARCH_ESCAPESEQ      = 3056;
var IDC_SEARCH_REGEXP         = 3057;
var IDC_SEARCH_BACKWARD       = 3059;
var IDC_SEARCH_FORWARD        = 3060;
var IDC_SEARCH_BEGINNING      = 3061;
var IDC_SEARCH_INSEL          = 3062;
var IDC_SEARCH_ALLFILES       = 3064;
var IDC_SEARCH_FIND_BUTTON    = 3065;
var IDC_SEARCH_REPLACE_BUTTON = 3066;
var IDC_SEARCH_ALL_BUTTON     = 3067;
var IDC_SEARCH_REGEXP_ARROW   = 3068;
var IDC_GOTO_LINE             = 3102;
var IDC_GOTO_OFFSET           = 3103;

var hMainWnd     = AkelPad.GetMainWnd();
var hGuiFont     = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
var oFSO         = new ActiveXObject("Scripting.FileSystemObject");
var bContinueDlg = true;
var bFirstTimeGT = true;
var nWhatSel1    = 0;
var nWhatSel2    = -1;
var nWithSel1    = 0;
var nWithSel2    = -1;
var hDlg;
var hDlgSubClass;
var aButSubClass;
var hWhatE;
var hWithE;
var hCancelB;
var hFocus;
var sWhatText;
var sWithText;
var nResizeW;
var nResizeH;
var bQSearchDialogSwitcher;
var i;

var nBufSize = 32768 * 2;
var lpBuffer = AkelPad.MemAlloc(nBufSize);
var lpLVITEM = AkelPad.MemAlloc(_X64 ? 72 : 60); //sizeof(LVITEM)

AkelPad.MemCopy(lpLVITEM, 0x0001 /*LVIF_TEXT*/, DT_DWORD);
AkelPad.MemCopy(_PtrAdd(lpLVITEM, _X64 ? 24 : 20), lpBuffer, DT_QWORD);
AkelPad.MemCopy(_PtrAdd(lpLVITEM, _X64 ? 32 : 24), nBufSize, DT_DWORD);

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
}
Scale.Init();

var aDlg         = [];
var aWnd         = [];
var aSubClassFRT = [];
var nFRTMinW     = Scale.X(778);
var nFRTMinH     = Scale.Y(312);
var hWndFRT;
var bCheckBRLV;

//ini settings
var bGoToDlg    = true;
var bFastCount  = false;
var bTranspNA   = false;
var nOpacity    = 255;
var bMore       = false;
var bAEFont     = false;
var nFRTSel     = 0;
var bFRTSort    = false;
var nFRTX       = 0;
var nFRTY       = 0;
var nBRX        = 200;
var nBRY        = 200;
var nFRTW;
var nFRTH;
var nDlgX;
var nDlgY;
var nBR;
var aBR;
var aBRCB;
var aBRName;
var aFRTCol;
var aBRCol;

//script arguments
var nFRF;
var nDlgType;
var nDefButID;
var nGoTo;
var nBatchNum;

GetDialogWnd();
if (hDlg)
  SendMessage(hDlg, 273 /*WM_COMMAND*/, IDCANCEL, hCancelB);

ReadIni();
GetArguments();

var IDFRTS      = 9000;
var IDFRTLV     = 9001;
var IDWHATS     = 9002;
var IDWITHS     = 9003;
var IDWHATE     = 9004;
var IDWITHE     = 9005;
var IDMATCHB    = 9006;
var IDWHOLEWB   = 9007;
var IDREGEXPB   = 9008;
var IDDOTNLB    = 9009;
var IDESCSEQB   = 9010;
var IDDIRG      = 9011;
var IDDIRDOWNB  = 9012;
var IDDIRUPB    = 9013;
var IDDIRBEGB   = 9014;
var IDDIRSELB   = 9015;
var IDDIRALLB   = 9016;
var IDBRS       = 9017;
var IDBRNAMES   = 9018;
var IDBRTC      = 9019;
var IDBRLV      = 9020;
var IDFRTNEWB   = 9021;
var IDFRTADDB   = 9022;
var IDFRTRENB   = 9023;
var IDFRTUPB    = 9024;
var IDFRTDOWNB  = 9025;
var IDFRTDELB   = 9026;
var IDCHECKEXPB = 9027;
var IDTOBATCH   = 9028;
var IDOKB       = 9029;
var IDBRUPB     = 9030;
var IDBRDOWNB   = 9031;
var IDBRDELB    = 9032;
var IDBRALLB    = 9033;
var IDBRENABLEB = 9034;
var IDBRACDB    = 9035;
var IDBRAWMB    = 9036;
var IDHELP1L    = 9037;
var IDHELP2L    = 9038;
var IDFINDL     = 9039;
var IDREPLACEL  = 9040;
var IDGOTOL     = 9041;
var IDMOREB     = 9042;
var IDRACDB     = 9043;
var IDRAWMB     = 9044;
var IDINSELB    = 9045;
var IDCYCLEB    = 9046;
var IDPROMPTB   = 9047;
var IDTRACKBAR  = 9048;
var IDTRANSPNAB = 9049;
var IDCOUNTB    = 9050;
var IDFINDALLB  = 9051;
var IDFRTB      = 9052;
var IDLINE      = 9053;

//0x50000000=WS_VISIBLE|WS_CHILD
//0x50000003=WS_VISIBLE|WS_CHILD|BS_AUTOCHECKBOX
//0x50000007=WS_VISIBLE|WS_CHILD|BS_GROUPBOX
//0x50000009=WS_VISIBLE|WS_CHILD|BS_AUTORADIOBUTTON
//0x50001201=WS_CHILD|WS_VISIBLE|SS_SUNKEN|SS_CENTERIMAGE|SS_CENTER
//0x50008400=WS_VISIBLE|WS_CHILD|TCS_FOCUSNEVER|TCS_FIXEDWIDTH
//0x50010000=WS_VISIBLE|WS_CHILD|WS_TABSTOP
//0x50010005=WS_VISIBLE|WS_CHILD|WS_TABSTOP|TBS_TOP|TBS_AUTOTICKS
//0x50010003=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
//0x50800000=WS_VISIBLE|WS_CHILD|WS_BORDER
//0x50804280=WS_VISIBLE|WS_CHILD|WS_BORDER|SS_ENDELLIPSIS|SS_CENTERIMAGE|SS_NOPREFIX
//0x50810000=WS_VISIBLE|WS_CHILD|WS_BORDER|WS_TABSTOP
//0x5081000D=WS_VISIBLE|WS_CHILD|WS_BORDER|WS_TABSTOP|LVS_SHOWSELALWAYS|LVS_SINGLESEL|LVS_REPORT
aDlg[IDHELP1L]   ={S:0x50000000, C:"SysLink", T:"?"};
aDlg[IDHELP2L]   ={S:0x50000000, C:"SysLink", T:"?"};
aDlg[IDFINDL]    ={S:0x50000000, C:"SysLink", T:"(Ctrl+F)", DlgID: 2004 /*IDD_FIND*/};
aDlg[IDREPLACEL] ={S:0x50000000, C:"SysLink", T:"(Ctrl+H/R)", DlgID: 2005 /*IDD_REPLACE*/};
aDlg[IDGOTOL]    ={S:0x50000000, C:"SysLink", T:"(Ctrl+G)", DlgID: 2006 /*IDD_GOTO*/};
aDlg[IDMOREB]    ={S:0x50010000, C:"BUTTON"};
aDlg[IDRACDB]    ={S:0x50010003, C:"BUTTON", T:sTxtReplAllCD};
aDlg[IDRAWMB]    ={S:0x50010003, C:"BUTTON", T:sTxtReplAllWM};
aDlg[IDINSELB]   ={S:0x50010003, C:"BUTTON", T:sTxtCheckInSel};
aDlg[IDCYCLEB]   ={S:0x50010003, C:"BUTTON", T:sTxtCycleSearch};
aDlg[IDPROMPTB]  ={S:0x50010003, C:"BUTTON", T:sTxtPrompt};
aDlg[IDTRACKBAR] ={S:0x50010005, C:"msctls_trackbar32"};
aDlg[IDTRANSPNAB]={S:0x50010003, C:"BUTTON", T:sTxtTransparentNA};
aDlg[IDCOUNTB]   ={S:0x50010000, C:"BUTTON", T:sTxtCount};
aDlg[IDFINDALLB] ={S:0x50010000, C:"BUTTON", T:sTxtFindAll + "..."};
aDlg[IDFRTB]     ={S:0x50010000, C:"BUTTON", T:sTxtTemplates + "&/" + sTxtBatches + "..."};
aDlg[IDLINE]     ={S:0x50800000, C:"STATIC"};
//Teplates/Batches
aWnd[IDFRTS]     ={S:0x50001201, C:"STATIC", T:sTxtTemplates};
aWnd[IDFRTLV]    ={S:0x5081000D, C:"SysListView32"};
aWnd[IDWHATS]    ={S:0x50000000, C:"STATIC", T:sTxtWhatFind + ":"};
aWnd[IDWITHS]    ={S:0x50000000, C:"STATIC", T:sTxtReplaceWith + ":"};
aWnd[IDWHATE]    ={S:0x50810000, C:"AkelEditW"};
aWnd[IDWITHE]    ={S:0x50810000, C:"AkelEditW"};
aWnd[IDMATCHB]   ={S:0x50010003, C:"BUTTON", T:sTxtMatchCase};
aWnd[IDWHOLEWB]  ={S:0x50010003, C:"BUTTON", T:sTxtWholeWord};
aWnd[IDREGEXPB]  ={S:0x50010003, C:"BUTTON", T:sTxtRegExp};
aWnd[IDDOTNLB]   ={S:0x50010003, C:"BUTTON", T:sTxtDotMatchesNL};
aWnd[IDESCSEQB]  ={S:0x50010003, C:"BUTTON", T:sTxtEscSeq};
aWnd[IDDIRG]     ={S:0x50000007, C:"BUTTON", T:sTxtDirection};
aWnd[IDDIRDOWNB] ={S:0x50000009, C:"BUTTON", T:sTxtDirDown};
aWnd[IDDIRUPB]   ={S:0x50000009, C:"BUTTON", T:sTxtDirUp};
aWnd[IDDIRBEGB]  ={S:0x50000009, C:"BUTTON", T:sTxtDirBeginning};
aWnd[IDDIRSELB]  ={S:0x50000009, C:"BUTTON", T:sTxtDirInSel};
aWnd[IDDIRALLB]  ={S:0x50000009, C:"BUTTON", T:sTxtDirAllFiles};
aWnd[IDBRS]      ={S:0x50001201, C:"STATIC", T:sTxtBatches};
aWnd[IDBRNAMES]  ={S:0x50804280, C:"STATIC"};
aWnd[IDBRTC]     ={S:0x50008400, C:"SysTabControl32"};
aWnd[IDBRLV]     ={S:0x5081000D, C:"SysListView32"};
aWnd[IDFRTNEWB]  ={S:0x50000000, C:"BUTTON",  T:sTxtNew};
aWnd[IDFRTADDB]  ={S:0x50000000, C:"BUTTON",  T:sTxtAdd};
aWnd[IDFRTRENB]  ={S:0x50000000, C:"BUTTON",  T:sTxtRename};
aWnd[IDFRTUPB]   ={S:0x50000000, C:"BUTTON",  T:sTxtMoveUp};
aWnd[IDFRTDOWNB] ={S:0x50000000, C:"BUTTON",  T:sTxtMoveDown};
aWnd[IDFRTDELB]  ={S:0x50000000, C:"BUTTON",  T:sTxtRemove};
aWnd[IDCHECKEXPB]={S:0x50000000, C:"BUTTON",  T:sTxtCheckExpr};
aWnd[IDTOBATCH]  ={S:0x50000000, C:"BUTTON",  T:sTxtAddToBatch};
aWnd[IDOKB]      ={S:0x50000000, C:"BUTTON",  T:sTxtOK};
aWnd[IDBRUPB]    ={S:0x50000000, C:"BUTTON",  T:sTxtMoveUp};
aWnd[IDBRDOWNB]  ={S:0x50000000, C:"BUTTON",  T:sTxtMoveDown};
aWnd[IDBRDELB]   ={S:0x50000000, C:"BUTTON",  T:sTxtRemove};
aWnd[IDBRALLB]   ={S:0x50000000, C:"BUTTON",  T:sTxtBatchReplAll};
aWnd[IDBRENABLEB]={S:0x50000003, C:"BUTTON",  T:sTxtEnableAll};
aWnd[IDBRACDB]   ={S:0x50000003, C:"BUTTON",  T:sTxtClosesDialog};
aWnd[IDBRAWMB]   ={S:0x50000003, C:"BUTTON",  T:sTxtWithoutMsg};
aWnd[IDHELP1L]   ={S:0x50000000, C:"SysLink", T:"<a>?</a>"};
aWnd[IDHELP2L]   ={S:0x50000000, C:"SysLink", T:"<a>?</a>"};

if (bQSearchDialogSwitcher = AkelPad.IsPluginRunning("QSearch::DialogSwitcher"))
  AkelPad.Call("QSearch::DialogSwitcher");

AkelPad.ScriptNoMutex();
AkelPad.WindowRegisterClass(sClass);

if (nDlgType === -1)
{
  hDlg = 0;
  FRTemplates();
}
else
{
  GetLinkText();
  AkelPad.WindowRegisterClass(sClass + "ThreadMenu");

  while (bContinueDlg)
  {
    bContinueDlg = false;
    nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);

    if (nDlgType === MLT_FIND)
      AkelPad.Command(4158 /*IDM_EDIT_FIND*/);
    else if (nDlgType === MLT_REPLACE)
      AkelPad.Command(4161 /*IDM_EDIT_REPLACE*/);
    else
      AkelPad.Command(4162 /*IDM_EDIT_GOTO*/);

    GetDialogWnd();

    if (! hDlg)
      break;

    if ((typeof nDlgX === "number") && (typeof nDlgY === "number"))
      oSys.Call("User32::SetWindowPos", hDlg, 0, nDlgX, nDlgY, 0, 0, 0x0415 /*SWP_NOSENDCHANGING|SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOSIZE*/);

    GetLinkPos();

    for (i = IDHELP1L; i < aDlg.length; ++i)
    {
      if (aDlg[i].Create)
        SendMessage(
          oSys.Call("User32::CreateWindowExW",
            0,         //dwExStyle
            aDlg[i].C, //lpClassName
            (i < IDMOREB ? "<a>" : "") + aDlg[i].T + (i < IDMOREB ? "</a>" : ""), //lpWindowName
            aDlg[i].S, //dwStyle
            aDlg[i].X, //x
            aDlg[i].Y, //y
            aDlg[i].W, //nWidth
            aDlg[i].H, //nHeight
            hDlg,      //hWndParent
            i,         //ID
            hInstDLL,  //hInstance
            0),        //lpParam
          48 /*WM_SETFONT*/, hGuiFont, true);
    }

    if (nDlgType === MLT_GOTO)
    {
      if (bFirstTimeGT)
      {
        bFirstTimeGT = false;

        if (nGoTo !== 2)
        {
          oSys.Call("User32::CheckRadioButton", hDlg, IDC_GOTO_LINE, IDC_GOTO_OFFSET, nGoTo);
          SendMessage(hDlg, 273 /*WM_COMMAND*/, nGoTo, GetDlgItem(hDlg, nGoTo));
        }
      }

      if (bGoToDlg)
        ResizeDialog(0, 30);
    }
    else
    {
      if (nFRF & FRF_SELECTION)
      {
        oSys.Call("User32::CheckRadioButton", hDlg, IDC_SEARCH_BACKWARD, IDC_SEARCH_ALLFILES, IDC_SEARCH_INSEL);
        SendMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_INSEL, GetDlgItem(hDlg, IDC_SEARCH_INSEL));
      }

      if (typeof sWhatText === "string")
      {
        oSys.Call("User32::SetWindowTextW", hWhatE, sWhatText);
        SendMessage(hWhatE, 177 /*EM_SETSEL*/, 0, -1);
      }

      if (nDlgType === MLT_REPLACE)
      {
        if (typeof sWithText === "string")
          oSys.Call("User32::SetWindowTextW", hWithE, sWithText);

        SendMessage(hDlg, 1025 /*DM_SETDEFID*/, nDefButID, 0);
      }

      SetTrackBar();
      ResizeDialog(nResizeW, bMore ? nResizeH : 0);
      ShowMore();
      ShowHelpLinksFR();
      SetTransparency(1);
    }

    oSys.Call("User32::UpdateWindow", hDlg);

    hDlgSubClass = AkelPad.WindowSubClass(hDlg, DialogCallback, 6 /*WM_ACTIVATE*/, 78 /*WM_NOTIFY*/, 256 /*WM_KEYDOWN*/, 273 /*WM_COMMAND*/, 276 /*WM_HSCROLL*/, 2 /*WM_DESTROY*/);

    if (nBatchNum)
      PostMessage(hDlg, 273 /*WM_COMMAND*/, IDFRTB, GetDlgItem(hDlg, IDFRTB));

    AkelPad.WindowRegisterDialog(hDlg);
    AkelPad.WindowGetMessage();

    AkelPad.WindowUnregisterDialog(hDlg);
    AkelPad.WindowUnsubClass(hDlg);
  }

  AkelPad.WindowUnregisterClass(sClass + "ThreadMenu");
}

WriteIni();
AkelPad.WindowUnregisterClass(sClass);
AkelPad.MemFree(lpBuffer);
AkelPad.MemFree(lpLVITEM);

if (bQSearchDialogSwitcher)
  AkelPad.Call("QSearch::DialogSwitcher");

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  var nID;
  var nCode;
  var nOption;

  if (uMsg === 6 /*WM_ACTIVATE*/)
  {
    if (aDlg[IDMOREB].Create)
    {
      if (LoWord(wParam))
        ShowMore();

      SetTransparency(LoWord(wParam));
    }
  }

  else if (uMsg === 78 /*WM_NOTIFY*/)
  {
    if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8), DT_DWORD) === -2 /*NM_CLICK*/)
    {
      if ((wParam === IDHELP1L) || (wParam === IDHELP2L))
        PostThreadMenu(wParam);
      else if (wParam === IDFINDL)
        SwitchDialog(MLT_FIND);
      else if (wParam === IDREPLACEL)
        SwitchDialog(MLT_REPLACE);
      else if (wParam === IDGOTOL)
        SwitchDialog(MLT_GOTO);
    }
  }

  else if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    if ((wParam === 0x46 /*F key*/) && aDlg[IDFINDL].Create)
    {
      if (aDlg[IDFINDL].Create && Ctrl() && (! Shift()) && (! Alt()))
        SwitchDialog(MLT_FIND);
    }
    else if ((wParam === 0x48 /*H key*/) || (wParam === 0x52 /*R key*/))
    {
      if (aDlg[IDREPLACEL].Create && Ctrl() && (! Shift()) && (! Alt()))
        SwitchDialog(MLT_REPLACE);
    }
    else if (wParam === 0x47 /*G key*/)
    {
      if (aDlg[IDGOTOL].Create && Ctrl() && (! Shift()) && (! Alt()))
        SwitchDialog(MLT_GOTO);
    }
    else if (wParam === 0x70 /*VK_F1*/)
    {
      if (aDlg[IDHELP1L].Show)
      {
        if (Ctrl() || Shift())
          AkelHelp(GetAkelHelpFile());
        else
        {
          if (aDlg[IDHELP2L].Show && (oSys.Call("User32::GetFocus") === hWithE))
            PostThreadMenu(IDHELP2L);
          else
          {
            oSys.Call("User32::SetFocus", hWhatE);
            PostThreadMenu(IDHELP1L);
          }
        }
      }
    }
    else if (wParam === 0x71 /*VK_F2*/)
    {
      if (aDlg[IDFRTB].Create && (! Ctrl()) && (! Shift()))
        PostMessage(hDlg, 273 /*WM_COMMAND*/, IDFRTB, GetDlgItem(hDlg, IDFRTB));
    }
  }

  else if (uMsg == 273 /*WM_COMMAND*/)
  {
    nID   = LoWord(wParam);
    nCode = HiWord(wParam);

    if (nID === IDC_SEARCH_FIND)
    {
      if ((nCode === 1 /*CBN_SELCHANGE*/) || (nCode === 5 /*CBN_EDITCHANGE*/))
        EnableCount();
      else if (nCode === 3 /*CBN_SETFOCUS*/)
        SendMessage(lParam, 322 /*CB_SETEDITSEL*/, 0, MkLong(nWhatSel1, nWhatSel2));
      else if (nCode === 10 /*CBN_SELENDCANCEL*/)
      {
        nWhatSel1 = LoWord(SendMessage(lParam, 320 /*CB_GETEDITSEL*/, 0, 0));
        nWhatSel2 = HiWord(SendMessage(lParam, 320 /*CB_GETEDITSEL*/, 0, 0));
      }
    }
    else if (nID === IDC_SEARCH_REPLACE)
    {
      if (nCode === 3 /*CBN_SETFOCUS*/)
        SendMessage(lParam, 322 /*CB_SETEDITSEL*/, 0, MkLong(nWithSel1, nWithSel2));
      else if (nCode === 10 /*CBN_SELENDCANCEL*/)
      {
        nWithSel1 = LoWord(SendMessage(lParam, 320 /*CB_GETEDITSEL*/, 0, 0));
        nWithSel2 = HiWord(SendMessage(lParam, 320 /*CB_GETEDITSEL*/, 0, 0));
      }
    }
    else if ((nID >= IDC_SEARCH_MATCHCASE) && (nID <= IDC_SEARCH_REGEXP_ARROW))
    {
      EnableCount();

      if ((nID === IDC_SEARCH_ESCAPESEQ) || (nID === IDC_SEARCH_REGEXP))
      {
        AkelPad.WindowNextProc(hDlgSubClass, hDlg, uMsg, wParam, lParam);
        ShowHelpLinksFR();
        oSys.Call("User32::UpdateWindow", hDlg);
      }
      else if ((nID >= IDC_SEARCH_FIND_BUTTON) && (nID <= IDC_SEARCH_ALL_BUTTON))
      {
        if ((SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0) & FRF_SELECTION) && (AkelPad.GetSelStart() === AkelPad.GetSelEnd()))
          AkelPad.WindowNoNextProc(hDlgSubClass);
        else if (GetDlgCtrlID(oSys.Call("User32::GetFocus")) >= IDFRTS)
          oSys.Call("User32::SetFocus", hWhatE);
      }
    }
    else if (nID == IDMOREB)
    {
      bMore = ! bMore;
      aDlg[IDMOREB].T = bMore ? "<< " + sTxtMore : sTxtMore + " >>";
      oSys.Call("User32::SetWindowTextW", lParam, aDlg[IDMOREB].T);
      ResizeDialog(0, (bMore ? 1 : -1) * nResizeH);
      ShowMore();
      oSys.Call("User32::UpdateWindow", hDlg);
    }
    else if ((nID >= IDRACDB) && (nID <= IDPROMPTB))
    {
      if (nID === IDRACDB)
        nOption = FRF_REPLACEALLANDCLOSE;
      else if (nID === IDRAWMB)
        nOption = FRF_REPLACEALLNOMSG;
      else if (nID === IDINSELB)
        nOption = FRF_CHECKINSELIFSEL;
      else if (nID === IDCYCLEB)
      {
        nOption = FRF_CYCLESEARCH;
        oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDPROMPTB), SendMessage(lParam, 240 /*BM_GETCHECK*/, 0, 0));
      }
      else
        nOption = FRF_CYCLESEARCHPROMPT;

      SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 228 /*MIS_SEARCHOPTIONS*/, SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0) ^ nOption);
    }
    else if (nID === IDTRANSPNAB)
    {
      bTranspNA = ! bTranspNA;
      SetTransparency(1);
    }
    else if (nID === IDCOUNTB)
    {
      if (GetWindowText(lParam) != sTxtCount)
        oSys.Call("User32::SetWindowTextW", lParam, sTxtCount);
      else
      {
        if (nCode)
          Count(lParam, nID);
        else
        {
          Count_AddToHistory();
          PostMessage(hDlg, 273 /*WM_COMMAND*/, MkLong(nID, 1), lParam);
        }
      }
    }
    else if (nID === IDFINDALLB)
    {
      if (nCode)
        PostThreadMenu(nID);
      else
      {
        Count_AddToHistory();
        PostMessage(hDlg, 273 /*WM_COMMAND*/, MkLong(nID, 1), lParam);
      }
    }
    else if (nID === IDFRTB)
    {
      oSys.Call("User32::SetWindowTextW", GetDlgItem(hDlg, IDCOUNTB), sTxtCount);
      FRTemplates();
    }
  }

  else if (uMsg === 276 /*WM_HSCROLL*/)
  {
    if (lParam === GetDlgItem(hDlg, IDTRACKBAR))
    {
      nOpacity = -(SendMessage(lParam, 1024 /*TBM_GETPOS*/, 0, 0) - 255);
      SetTransparency(1);
    }
  }

  else if (uMsg === 2 /*WM_DESTROY*/)
  {
    GetWhatWithFR();
    oSys.Call("User32::GetWindowRect", hDlg, lpBuffer);
    nDlgX = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    nDlgY = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);

    oSys.Call("User32::PostQuitMessage", 0);
  }

  return 0;
}

function PostThreadMenu(nID)
{
  //unlock main thread for context menu, based on Instructor's code: http://akelpad.sourceforge.net/forum/viewtopic.php?p=22725#22725

  var hWndThreadMenu = oSys.Call("User32::CreateWindowExW", 0, sClass + "ThreadMenu", "", 0x80000000 /*WS_POPUP*/, 0, 0, 0, 0, hMainWnd, 0, hInstDLL, CallbackThreadMenu);
  PostMessage(hWndThreadMenu, 3000, nID, 0);
}

function CallbackThreadMenu(hWnd, uMsg, wParam, lParam)
{
  if (uMsg === 3000)
  {
    if (wParam === IDFINDALLB)
      FindAllMenu(hWnd, wParam);
    else
      HelpMenu(hWnd, wParam, SendDlgItemMessage(hDlg, IDC_SEARCH_REGEXP, 240 /*BM_GETCHECK*/, 0, 0));

    oSys.Call("User32::DestroyWindow", hWnd);
  }
}

function GetDlgCtrlID(hWnd)
{
  return oSys.Call("User32::GetDlgCtrlID", hWnd);
}

function GetDlgItem(hWnd, nID)
{
  return oSys.Call("User32::GetDlgItem", hWnd, nID);
}

function GetWindowText(hWnd)
{
  oSys.Call("User32::GetWindowTextW", hWnd, lpBuffer, nBufSize / 2);
  return AkelPad.MemRead(lpBuffer, DT_UNICODE);
}

function SendDlgItemMessage(hWnd, nID, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendDlgItemMessageW", hWnd, nID, uMsg, wParam, lParam);
}

function SendMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendMessageW", hWnd, uMsg, wParam, lParam);
}

function PostMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::PostMessageW", hWnd, uMsg, wParam, lParam);
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

function GetArguments()
{
  var sArg;
  var nDirection;

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);

  sArg = AkelPad.GetArgValue("FR", "").toUpperCase();

  if (sArg.indexOf("M+") >= 0)
    nFRF |= FRF_MATCHCASE;
  else if (sArg.indexOf("M-") >= 0)
    nFRF &= ~FRF_MATCHCASE;

  if (sArg.indexOf("W+") >= 0)
    nFRF |= FRF_WHOLEWORD;
  else if (sArg.indexOf("W-") >= 0)
    nFRF &= ~FRF_WHOLEWORD;

  if (sArg.indexOf("R+") >= 0)
    nFRF = (nFRF | FRF_REGEXP) & ~FRF_ESCAPESEQ;
  else if (sArg.indexOf("R-") >= 0)
    nFRF &= ~FRF_REGEXP;

  if (sArg.indexOf("RN+") >= 0)
    nFRF &= ~FRF_REGEXPNONEWLINEDOT;
  else if (sArg.indexOf("RN-") >= 0)
    nFRF |= FRF_REGEXPNONEWLINEDOT;

  if (sArg.indexOf("E+") >= 0)
  {
    if (sArg.indexOf("R+") < 0)
      nFRF = (nFRF | FRF_ESCAPESEQ) & ~FRF_REGEXP;
  }
  else if (sArg.indexOf("E-") >= 0)
    nFRF &= ~FRF_ESCAPESEQ;

  if (sArg.indexOf("D") >= 0)
    nDirection = FRF_DOWN;
  else if (sArg.indexOf("U") >= 0)
    nDirection = FRF_UP;
  else if (sArg.indexOf("B") >= 0)
    nDirection = FRF_DOWN | FRF_BEGINNING;
  else if (sArg.indexOf("S") >= 0)
    nDirection = FRF_DOWN | FRF_SELECTION;
  else if (sArg.indexOf("A") >= 0)
    nDirection = FRF_DOWN | FRF_BEGINNING | FRF_ALLFILES;

  if (nDirection)
    nFRF = (nFRF & ~(FRF_DOWN | FRF_UP | FRF_BEGINNING | FRF_SELECTION | FRF_ALLFILES)) | nDirection;

  sArg = AkelPad.GetArgValue("FRE", "").toUpperCase();

  if (sArg.indexOf("D+") >= 0)
    nFRF |= FRF_REPLACEALLANDCLOSE;
  else if (sArg.indexOf("D-") >= 0)
    nFRF &= ~FRF_REPLACEALLANDCLOSE;

  if (sArg.indexOf("M+") >= 0)
    nFRF |= FRF_REPLACEALLNOMSG;
  else if (sArg.indexOf("M-") >= 0)
    nFRF &= ~FRF_REPLACEALLNOMSG;

  if (sArg.indexOf("S+") >= 0)
    nFRF |= FRF_CHECKINSELIFSEL;
  else if (sArg.indexOf("S-") >= 0)
    nFRF &= ~FRF_CHECKINSELIFSEL;

  if (sArg.indexOf("C+") >= 0)
    nFRF |= FRF_CYCLESEARCH;
  else if (sArg.indexOf("C-") >= 0)
    nFRF &= ~FRF_CYCLESEARCH;

  if (sArg.indexOf("P+") >= 0)
    nFRF |= FRF_CYCLESEARCHPROMPT;
  else if (sArg.indexOf("P-") >= 0)
    nFRF &= ~FRF_CYCLESEARCHPROMPT;

  SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 228 /*MIS_SEARCHOPTIONS*/, nFRF);

  sArg = AkelPad.GetArgValue("dlg", "F").toUpperCase();

  if (sArg === "R")
    nDlgType = MLT_REPLACE;
  else if (sArg === "G")
    nDlgType = MLT_GOTO;
  else if (sArg === "B")
    nDlgType = -1;
  else
    nDlgType = MLT_FIND;

  sArg = AkelPad.GetArgValue("RDB", "").toUpperCase();

  if (sArg === "R")
    nDefButID = IDC_SEARCH_REPLACE_BUTTON;
  else if (sArg === "A")
    nDefButID = IDC_SEARCH_ALL_BUTTON;
  else
    nDefButID = IDC_SEARCH_FIND_BUTTON;

  sArg = AkelPad.GetArgValue("GT", "").toUpperCase();

  if (sArg.indexOf("L") >= 0)
    nGoTo = IDC_GOTO_LINE;
  else if (sArg.indexOf("O") >= 0)
    nGoTo = IDC_GOTO_OFFSET;
  else
    nGoTo = 2;

  nBatchNum = AkelPad.GetArgValue("BR", 0);

  if ((Math.abs(nBatchNum) > aBR.length) || (nDlgType == MLT_GOTO) || AkelPad.GetEditReadOnly(0))
    nBatchNum = 0;

  if (nBatchNum)
    nBR = Math.abs(nBatchNum) - 1;
}

function GetLinkText()
{
  var hLangLib = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 50 /*MI_LANGHANDLE*/, 0);
  var hRes;
  var hResData;
  var lpPointer;
  var nSize;
  var i;

  for (i = IDFINDL; i <= IDGOTOL; ++i)
  {
    hRes      = oSys.Call("Kernel32::FindResourceExW", hLangLib, 5 /*RT_DIALOG*/, aDlg[i].DlgID, AkelPad.GetLangId());
    hResData  = oSys.Call("Kernel32::LoadResource", hLangLib, hRes);
    lpPointer = oSys.Call("Kernel32::LockResource", hResData);
    nSize     = oSys.Call("Kernel32::SizeofResource", hLangLib, hRes);

    if (nSize)
    {
      //pointer to menu
      if (AkelPad.MemRead(_PtrAdd(lpPointer, 2), DT_WORD) === 0xFFFF) //DLGTEMPLATEEX
        lpPointer = _PtrAdd(lpPointer, 26);
      else //DLGTEMPLATE
        lpPointer = _PtrAdd(lpPointer, 18);

      //pointer to windowClass
      if (AkelPad.MemRead(lpPointer, DT_WORD) === 0xFFFF)
        lpPointer = _PtrAdd(lpPointer, 4);
      else
        lpPointer = _PtrAdd(lpPointer, AkelPad.MemRead(lpPointer, DT_UNICODE).length + 2);

      //pointer to title
      if (AkelPad.MemRead(lpPointer, DT_WORD) === 0xFFFF)
        lpPointer = _PtrAdd(lpPointer, 4);
      else
        lpPointer = _PtrAdd(lpPointer, AkelPad.MemRead(lpPointer, DT_UNICODE).length + 2);

      aDlg[i].T = AkelPad.MemRead(lpPointer, DT_UNICODE) + " " + aDlg[i].T;
    }
  }
}

function GetLinkPos()
{
  var hDC = oSys.Call("User32::GetDC", hDlg);
  var nDlgW, nDlgH;
  var nButX, nButW, nButH;
  var nGapH;
  var i;

  oSys.Call("Gdi32::SelectObject", hDC, hGuiFont);
  oSys.Call("Gdi32::SetMapMode", hDC, 1 /*MM_TEXT*/);

  for (i = IDHELP1L; i <= IDGOTOL; ++i)
  {
    oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, aDlg[i].T, aDlg[i].T.length, lpBuffer);
    aDlg[i].W = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    aDlg[i].H = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);
  }

  oSys.Call("User32::GetClientRect", hDlg, lpBuffer);
  nDlgW = AkelPad.MemRead(_PtrAdd(lpBuffer,  8), DT_DWORD);
  nDlgH = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD);

  if (nDlgType == MLT_GOTO)
  {
    aDlg[IDFINDL].X    = 10;
    aDlg[IDFINDL].Y    = nDlgH + 7;
    aDlg[IDREPLACEL].X = nDlgW - aDlg[IDREPLACEL].W - 10;
    aDlg[IDREPLACEL].Y = aDlg[IDFINDL].Y;

    aDlg[IDHELP1L].Create   = false;
    aDlg[IDHELP1L].Show     = false;
    aDlg[IDHELP2L].Create   = false;
    aDlg[IDHELP2L].Show     = false;
    aDlg[IDFINDL].Create    = bGoToDlg;
    aDlg[IDREPLACEL].Create = bGoToDlg;
    aDlg[IDGOTOL].Create    = false;
    aDlg[IDMOREB].Create    = false;
    aDlg[IDRACDB].Create    = false;
    aDlg[IDRAWMB].Create    = false;
    aDlg[IDINSELB].Create   = false;
    aDlg[IDCYCLEB].Create   = false;
    aDlg[IDPROMPTB].Create  = false;
    aDlg[IDTRANSPNAB].Create= false;
    aDlg[IDTRACKBAR].Create = false;
    aDlg[IDCOUNTB].Create   = false;
    aDlg[IDFINDALLB].Create = false;
    aDlg[IDFRTB].Create     = false;
    aDlg[IDLINE].Create     = false;
  }
  else
  {
    aDlg[IDMOREB].T = bMore ? "<< " + sTxtMore : sTxtMore + " >>";

    oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, aDlg[IDMOREB].T, aDlg[IDMOREB].T.length, lpBuffer);
    aDlg[IDMOREB].W = AkelPad.MemRead(lpBuffer, DT_DWORD);

    for (i = IDCOUNTB; i <= IDFRTB; ++i)
    {
      oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, aDlg[i].T, aDlg[i].T.length, lpBuffer);
      aDlg[i].W = AkelPad.MemRead(lpBuffer, DT_DWORD) + Scale.X(10);
    }

    GetControlRect(hCancelB);
    nButX = AkelPad.MemRead(_PtrAdd(lpBuffer,  0), DT_DWORD);
    nButW = AkelPad.MemRead(_PtrAdd(lpBuffer,  8), DT_DWORD) - nButX;
    nButH = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);

    nResizeW = Math.max(0, Math.max(aDlg[IDFINDL].W, aDlg[IDREPLACEL].W, aDlg[IDGOTOL].W, aDlg[IDMOREB].W, aDlg[IDCOUNTB].W, aDlg[IDFINDALLB].W, aDlg[IDFRTB].W) - nButW);

    if (nResizeW)
    {
      nDlgW += nResizeW;
      nButW += nResizeW;

      oSys.Call("User32::SetWindowPos", hCancelB, 0, 0, 0, nButW, nButH, 0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);
      oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDC_SEARCH_FIND_BUTTON), 0, 0, 0, nButW, nButH, 0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);

      if (nDlgType == MLT_REPLACE)
      {
        oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDC_SEARCH_REPLACE_BUTTON), 0, 0, 0, nButW, nButH, 0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);
        oSys.Call("User32::SetWindowPos", GetDlgItem(hDlg, IDC_SEARCH_ALL_BUTTON), 0, 0, 0, nButW, nButH, 0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);
      }
    }

    GetControlRect(GetDlgItem(hDlg, IDC_SEARCH_FIND));
    aDlg[IDHELP1L].X = AkelPad.MemRead(_PtrAdd(lpBuffer, 8), DT_DWORD) + 1;
    aDlg[IDHELP1L].Y = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD) + (AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD) - aDlg[IDHELP1L].H) / 2;

    GetControlRect(GetDlgItem(hDlg, IDC_SEARCH_REPLACE));
    aDlg[IDHELP2L].X = AkelPad.MemRead(_PtrAdd(lpBuffer, 8), DT_DWORD) + 1;
    aDlg[IDHELP2L].Y = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD) + (AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD) - aDlg[IDHELP2L].H) / 2;

    GetControlRect(GetDlgItem(hDlg, IDC_SEARCH_WHOLEWORD));
    nGapH = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);
    GetControlRect(GetDlgItem(hDlg, IDC_SEARCH_MATCHCASE));
    nGapH = nGapH - AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);

    aDlg[IDLINE].X = 0;
    aDlg[IDLINE].Y = nDlgH;
    aDlg[IDLINE].W = nDlgW;
    aDlg[IDLINE].H = 1;

    aDlg[IDRACDB].X   = AkelPad.MemRead(lpBuffer, DT_DWORD);
    aDlg[IDRACDB].Y   = nDlgH + Math.round(nGapH / 2);
    aDlg[IDRACDB].W   = aDlg[IDHELP1L].X - aDlg[IDRACDB].X - 1;
    aDlg[IDRACDB].H   = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);
    aDlg[IDRAWMB].X   = aDlg[IDRACDB].X;
    aDlg[IDRAWMB].Y   = aDlg[IDRACDB].Y + nGapH;
    aDlg[IDRAWMB].W   = aDlg[IDRACDB].W;
    aDlg[IDRAWMB].H   = aDlg[IDRACDB].H;
    aDlg[IDINSELB].X  = aDlg[IDRACDB].X;
    aDlg[IDINSELB].Y  = aDlg[IDRAWMB].Y + nGapH;
    aDlg[IDINSELB].W  = aDlg[IDRACDB].W;
    aDlg[IDINSELB].H  = aDlg[IDRACDB].H;
    aDlg[IDCYCLEB].X  = aDlg[IDRACDB].X;
    aDlg[IDCYCLEB].Y  = aDlg[IDINSELB].Y + nGapH;
    aDlg[IDCYCLEB].W  = aDlg[IDRACDB].W / 2 - 5;
    aDlg[IDCYCLEB].H  = aDlg[IDRACDB].H;
    aDlg[IDPROMPTB].X = aDlg[IDRACDB].X + aDlg[IDRACDB].W / 2;
    aDlg[IDPROMPTB].Y = aDlg[IDCYCLEB].Y;
    aDlg[IDPROMPTB].W = aDlg[IDCYCLEB].W;
    aDlg[IDPROMPTB].H = aDlg[IDRACDB].H;

    aDlg[IDTRACKBAR].X = aDlg[IDRACDB].X;
    aDlg[IDTRACKBAR].Y = aDlg[IDCYCLEB].Y + nGapH * 2;
    aDlg[IDTRACKBAR].W = Scale.X(70);
    aDlg[IDTRACKBAR].H = nButH;
    aDlg[IDTRACKBAR].H = nGapH;

    aDlg[IDTRANSPNAB].X = aDlg[IDTRACKBAR].X + aDlg[IDTRACKBAR].W + 5;
    aDlg[IDTRANSPNAB].Y = aDlg[IDTRACKBAR].Y;
    aDlg[IDTRANSPNAB].W = aDlg[IDRACDB].X + aDlg[IDRACDB].W - aDlg[IDTRANSPNAB].X;
    aDlg[IDTRANSPNAB].H = aDlg[IDCYCLEB].H;

    aDlg[IDMOREB].X = nButX;
    aDlg[IDMOREB].Y = nDlgH - nButH - Math.round(nGapH / 2);
    aDlg[IDMOREB].W = nButW;
    aDlg[IDMOREB].H = nButH;

    aDlg[IDCOUNTB].X = nButX;
    aDlg[IDCOUNTB].Y = aDlg[IDRACDB].Y;
    aDlg[IDCOUNTB].W = nButW;
    aDlg[IDCOUNTB].H = nButH;

    aDlg[IDFINDALLB].X = nButX;
    aDlg[IDFINDALLB].Y = aDlg[IDCOUNTB].Y + nButH + Math.round(nGapH / 6);
    aDlg[IDFINDALLB].W = nButW;
    aDlg[IDFINDALLB].H = nButH;

    aDlg[IDFRTB].X = nButX;
    aDlg[IDFRTB].Y = aDlg[IDFINDALLB].Y + nButH + Math.round(nGapH / 6);
    aDlg[IDFRTB].W = nButW;
    aDlg[IDFRTB].H = nButH;

    aDlg[IDFINDL].X    = nButX + (nButW - aDlg[IDFINDL].W) / 2;
    aDlg[IDFINDL].Y    = aDlg[IDTRACKBAR].Y + aDlg[IDTRACKBAR].H - aDlg[IDFINDL].H;
    aDlg[IDREPLACEL].X = nButX + (nButW - aDlg[IDREPLACEL].W) / 2;
    aDlg[IDREPLACEL].Y = aDlg[IDFINDL].Y;
    aDlg[IDGOTOL].X    = nButX + (nButW - aDlg[IDGOTOL].W) / 2;
    aDlg[IDGOTOL].Y    = aDlg[IDFINDL].Y - nGapH;

    aDlg[IDHELP1L].Create   = true;
    aDlg[IDHELP2L].Create   = true;
    aDlg[IDFINDL].Create    = (nDlgType == MLT_REPLACE);
    aDlg[IDREPLACEL].Create = (nDlgType == MLT_FIND);
    aDlg[IDGOTOL].Create    = bGoToDlg;
    aDlg[IDMOREB].Create    = true;
    aDlg[IDRACDB].Create    = true;
    aDlg[IDRAWMB].Create    = true;
    aDlg[IDINSELB].Create   = true;
    aDlg[IDCYCLEB].Create   = true;
    aDlg[IDPROMPTB].Create  = true;
    aDlg[IDTRANSPNAB].Create= true;
    aDlg[IDTRACKBAR].Create = true;
    aDlg[IDCOUNTB].Create   = true;
    aDlg[IDFINDALLB].Create = true;
    aDlg[IDFRTB].Create     = true;
    aDlg[IDLINE].Create     = true;

    nResizeH = nGapH * 7;
  }

  oSys.Call("User32::ReleaseDC", hDlg, hDC);
}

function GetControlRect(hWnd)
{
  oSys.Call("User32::GetWindowRect", hWnd, lpBuffer);
  oSys.Call("User32::ScreenToClient", hDlg, lpBuffer);
  oSys.Call("User32::ScreenToClient", hDlg, _PtrAdd(lpBuffer, 8));
}

function ShowMore()
{
  var nID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));
  var i;

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);

  for (i = IDFINDL; i <= IDLINE; ++i)
  {
    if (aDlg[i].Create && (i !== IDMOREB))
    {
      oSys.Call("User32::ShowWindow", GetDlgItem(hDlg, i), bMore);
      oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, i), bMore);
    }
  }

  if (bMore)
  {
    SendDlgItemMessage(hDlg, IDRACDB,     241 /*BM_SETCHECK*/, nFRF & FRF_REPLACEALLANDCLOSE, 0);
    SendDlgItemMessage(hDlg, IDRAWMB,     241 /*BM_SETCHECK*/, nFRF & FRF_REPLACEALLNOMSG, 0);
    SendDlgItemMessage(hDlg, IDINSELB,    241 /*BM_SETCHECK*/, nFRF & FRF_CHECKINSELIFSEL, 0);
    SendDlgItemMessage(hDlg, IDCYCLEB,    241 /*BM_SETCHECK*/, nFRF & FRF_CYCLESEARCH, 0);
    SendDlgItemMessage(hDlg, IDPROMPTB,   241 /*BM_SETCHECK*/, nFRF & FRF_CYCLESEARCHPROMPT, 0);
    SendDlgItemMessage(hDlg, IDTRANSPNAB, 241 /*BM_SETCHECK*/, bTranspNA, 0);

    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDRACDB), nDlgType === MLT_REPLACE);
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDRAWMB), nDlgType === MLT_REPLACE);
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDPROMPTB), nFRF & FRF_CYCLESEARCH);
    EnableCount();
  }
  else if ((nID >= IDCOUNTB) && (nID <= IDFRTB))
  {
    SendDlgItemMessage(hDlg, nID, 244 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 1);
    SendDlgItemMessage(hDlg, nDefButID, 244 /*BM_SETSTYLE*/, 1 /*BS_DEFPUSHBUTTON*/, 1);
  }
}

function EnableCount()
{
  for (var i = IDCOUNTB; i <= IDFINDALLB; ++i)
    oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, i), oSys.Call("User32::IsWindowEnabled", GetDlgItem(hDlg, IDC_SEARCH_FIND_BUTTON)));

  oSys.Call("User32::SetWindowTextW", GetDlgItem(hDlg, IDCOUNTB), sTxtCount);
}

function ShowHelpLinksFR()
{
  if ((SendDlgItemMessage(hDlg, IDC_SEARCH_REGEXP, 240 /*BM_GETCHECK*/, 0, 0)) || (SendDlgItemMessage(hDlg, IDC_SEARCH_ESCAPESEQ, 240 /*BM_GETCHECK*/, 0, 0)))
  {
    aDlg[IDHELP1L].Show = true;
    aDlg[IDHELP2L].Show = (nDlgType === MLT_REPLACE);
  }
  else
  {
    aDlg[IDHELP1L].Show = false;
    aDlg[IDHELP2L].Show = false;
  }

  oSys.Call("User32::ShowWindow", GetDlgItem(hDlg, IDHELP1L), aDlg[IDHELP1L].Show);
  oSys.Call("User32::ShowWindow", GetDlgItem(hDlg, IDHELP2L), aDlg[IDHELP2L].Show);
}

function GetDialogWnd()
{
  var hWnd = SendMessage(hMainWnd, 1275 /*AKD_GETMODELESS*/, 0, lpBuffer);
  var nMLT = AkelPad.MemRead(lpBuffer, DT_DWORD);

  hWhatE = 0;
  hWithE = 0;

  if ((nMLT === MLT_FIND) || (nMLT === MLT_REPLACE) || (nMLT === MLT_GOTO))
  {
    nDlgType = nMLT;
    hDlg     = hWnd;
    hCancelB = GetDlgItem(hDlg, IDCANCEL);

    if (nMLT != MLT_GOTO)
    {
      AkelPad.MemCopy(lpBuffer, (_X64 ? 64 : 52) /*sizeof(COMBOBOXINFO)*/, DT_DWORD);
      oSys.Call("User32::GetComboBoxInfo", GetDlgItem(hDlg, IDC_SEARCH_FIND), lpBuffer);
      hWhatE = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);

      if (nMLT === MLT_REPLACE)
      {
        oSys.Call("User32::GetComboBoxInfo", GetDlgItem(hDlg, IDC_SEARCH_REPLACE), lpBuffer);
        hWithE = AkelPad.MemRead(_PtrAdd(lpBuffer, _X64 ? 48 : 44) /*hwndItem*/, DT_QWORD);
      }
    }
  }
  else
    hDlg = 0;
}

function SwitchDialog(nMLT)
{
  bContinueDlg = true;
  nDlgType     = nMLT;
  SendMessage(hDlg, 273 /*WM_COMMAND*/, IDCANCEL, hCancelB);
}

function ResizeDialog(nResizeW, nResizeH)
{
  var nW, nH;

  oSys.Call("User32::GetWindowRect", hDlg, lpBuffer);
  nW = AkelPad.MemRead(_PtrAdd(lpBuffer,  8), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD) + nResizeW;
  nH = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD) + nResizeH;

  oSys.Call("User32::SetWindowPos", hDlg, 0, 0, 0, nW, nH, 0x16 /*SWP_NOACTIVATE|SWP_NOZORDER|SWP_NOMOVE*/);
}

function SetTrackBar()
{
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1030 /*TBM_SETRANGE*/, 0, MkLong(0, 240));
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1047 /*TBM_SETLINESIZEE*/, 0, 10);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1045 /*TBM_SETPAGESIZE*/, 0, 40);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1044 /*TBM_SETTICFREQ*/, 20, 0);
  SendDlgItemMessage(hDlg, IDTRACKBAR, 1029 /*TBM_SETPOS*/, 1, -(nOpacity - 255));
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
  else if ((nAlphaCur < 0) && (nOpacity < 255) || (nAlphaCur >= 0) && (nAlphaCur !== nOpacity))
    nAlphaNew = nOpacity;

  if (nAlphaNew >= 0)
  {
    oSys.Call("User32::SetWindowLongW", hDlg, -20 /*GWL_EXSTYLE*/, nExStyle | 0x00080000 /*WS_EX_LAYERED*/);
    oSys.Call("User32::SetLayeredWindowAttributes", hDlg, 0, nAlphaNew, 2 /*LWA_ALPHA*/);
    oSys.Call("User32::UpdateWindow", hDlg);
  }
}

function GetWhatWithFR()
{
  if (hWhatE) sWhatText = GetWindowText(hWhatE);
  if (hWithE) sWithText = GetWindowText(hWithE);
}

function GetAkelHelpFile()
{
  var sDir  = AkelPad.GetAkelDir(2 /*ADTYPE_DOCS*/) + "\\";
  var sFile = "";

  if (AkelPad.GetLangId() === 1049 /*Russian*/)
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

    if (oFSO.FileExists(AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/) + "\\HtmlView.js") && (! Ctrl()))
      AkelPad.Call("Scripts::Main", 1, "HtmlView.js", sFile + "#ch7");
    else
      AkelPad.Exec('rundll32.exe shell32, ShellExec_RunDLL ' + sFile);
  }
}

function Count_AddToHistory()
{
  var hWndCB  = GetDlgItem(hDlg, IDC_SEARCH_FIND);
  var nCurLen = SendMessage(hWndCB, 326 /*CB_GETCOUNT*/, 0, 0);
  var nMaxLen = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 198 /*MI_SEARCHSTRINGS*/, 0);
  var sText;
  var i;

  GetWhatWithFR();

  if (nMaxLen > 0)
  {
    for (i = 0; i < nCurLen; ++i)
    {
      SendMessage(hWndCB, 328 /*CB_GETLBTEXT*/, i, lpBuffer);
      sText = AkelPad.MemRead(lpBuffer, DT_UNICODE);

      if (sText === sWhatText)
      {
        SendMessage(hWndCB, 324 /*CB_DELETESTRING*/, i, 0);
        --nCurLen;
        break;
      }
    }

    if (nCurLen === nMaxLen)
      SendMessage(hWndCB, 324 /*CB_DELETESTRING*/, nCurLen - 1, 0);

    SendMessage(hWndCB, 330 /*CB_INSERTSTRING*/, 0, sWhatText);
    SendMessage(hWndCB, 334 /*CB_SETCURSEL*/, 0, 0);
  }
}

function Count_EnableButtons(aButton, nID)
{
  var hWnd;
  var i;

  if (aButton.length)
  {
    for (i = 1; i < aButton.length; ++i)
      oSys.Call("User32::EnableWindow", aButton[i], 1);

    oSys.Call("User32::SetFocus", aButton[0]);
  }
  else
  {
    aButton[0] = oSys.Call("User32::GetFocus");

    oSys.Call("User32::EnableWindow", hWnd = GetDlgItem(hDlg, IDCANCEL), 0);
    aButton.push(hWnd);

    for (i = IDC_SEARCH_MATCHCASE; i <= IDC_SEARCH_REGEXP_ARROW; ++i)
    {
      if (oSys.Call("User32::IsWindowEnabled", hWnd = GetDlgItem(hDlg, i)))
      {
        oSys.Call("User32::EnableWindow", hWnd, 0);
        aButton.push(hWnd);
      }
    }

    for (i = IDHELP1L; i <= IDFRTB; ++i)
    {
      if ((i !== nID) && (oSys.Call("User32::IsWindowEnabled", hWnd = GetDlgItem(hDlg, i))))
      {
        oSys.Call("User32::EnableWindow", hWnd, 0);
        aButton.push(hWnd);
      }
    }
  }
}

function Count(hButton, nID)
{
  var nRESE        = 0x1002 /*RESE_GLOBAL|RESE_MULTILINE*/;
  var lpFrameStart = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 1 /*FWF_CURRENT*/, 0);
  var lpFrameCurr  = lpFrameStart;
  var lpCallback   = 0;
  var nCountAll    = 0;
  var bContinue    = true;
  var nErrOffset;
  var nAEGI1;
  var nAEGI2;
  var aButton;
  var lpMsg;
  var lpDelim;
  var lpPat;
  var lpPatExec;
  var hEditWnd;
  var nMaxDelim;

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);

  if (nFRF & FRF_REGEXP)
    nErrOffset = CheckRegExp(sWhatText);
  else if (nFRF & FRF_ESCAPESEQ)
    nErrOffset = CheckEscSeq(sWhatText);

  if (nErrOffset)
  {
    //to call "Syntax error ..." message
    PostMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_FIND_BUTTON, 0);
    return;
  }

  if (nFRF & FRF_ESCAPESEQ)
    sWhatText = EscSeqToRegExp(sWhatText);
  else if (! (nFRF & FRF_REGEXP))
    sWhatText = sWhatText.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&");

  if (nFRF & FRF_MATCHCASE)
    nRESE |= 0x0001 /*RESE_MATCHCASE*/;
  if (nFRF & FRF_WHOLEWORD)
    nRESE |= 0x0004 /*RESE_WHOLEWORD*/;
  if (nFRF & FRF_REGEXPNONEWLINEDOT)
    nRESE |= 0x0008 /*RESE_NONEWLINEDOT*/;

  if ((nFRF & FRF_BEGINNING) || (nFRF & FRF_ALLFILES))
  {
    nAEGI1 = 1 /*AEGI_FIRSTCHAR*/;
    nAEGI2 = 2 /*AEGI_LASTCHAR*/;
  }
  else if (nFRF & FRF_SELECTION)
  {
    nAEGI1 = 3 /*AEGI_FIRSTSELCHAR*/;
    nAEGI2 = 4 /*AEGI_LASTSELCHAR*/;
  }
  else if (nFRF & FRF_DOWN)
  {
    nAEGI1 = 4 /*AEGI_LASTSELCHAR*/;
    nAEGI2 = 2 /*AEGI_LASTCHAR*/;
  }
  else //nFRF & FRF_UP
  {
    nAEGI1 = 1 /*AEGI_FIRSTCHAR*/;
    nAEGI2 = 3 /*AEGI_FIRSTSELCHAR*/;
  }

  if (! bFastCount)
  {
    try
    {
      lpCallback = oSys.RegisterCallback(PatExecCallback);
    }
    catch (oError)
    {}
  }

  aButton   = [];
  lpMsg     = AkelPad.MemAlloc(_X64 ? 48 : 28 /*sizeof(MSG)*/);
  lpDelim   = AkelPad.MemAlloc(128 /*WORD_DELIMITERS_SIZE*/ * 2);
  lpPat     = AkelPad.MemAlloc((sWhatText.length + 1) * 2);
  lpPatExec = AkelPad.MemAlloc(_X64? 216 : 108 /*sizeof(PATEXEC)*/);

  AkelPad.MemCopy(lpPat, sWhatText, DT_UNICODE);
  AkelPad.MemCopy(lpPatExec /*PATEXEC.dwOptions*/, nRESE, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 112 :  56) /*PATEXEC.wpPat*/, lpPat, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 120 :  60) /*PATEXEC.wpMaxPat*/, _PtrAdd(lpPat, sWhatText.length * 2), DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 200 : 100) /*PATEXEC.lpCallback*/, lpCallback, DT_QWORD);

  oSys.Call("User32::SetWindowTextW", hButton, lpCallback ? sTxtStop : sTxtWait);
  Count_EnableButtons(aButton, lpCallback ? nID : 0);

  do
  {
    hEditWnd  = AkelPad.GetEditWnd();
    nMaxDelim = SendMessage(hEditWnd, 3243 /*AEM_GETWORDDELIMITERS*/, 128 /*WORD_DELIMITERS_SIZE*/, lpDelim) - 2;

    AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ?  8 : 4) /*PATEXEC.wpDelim*/, nMaxDelim ? lpDelim : 0, DT_QWORD);
    AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 16 : 8) /*PATEXEC.wpMaxDelim*/, _PtrAdd(lpDelim, nMaxDelim * 2), DT_QWORD);

    SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, nAEGI1, _PtrAdd(lpPatExec, _X64 ?  56 : 28) /*PATEXEC.ciRange*/);
    SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, nAEGI2, _PtrAdd(lpPatExec, _X64 ?  80 : 40) /*PATEXEC.ciMaxRange*/);
    SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, nAEGI1, _PtrAdd(lpPatExec, _X64 ? 144 : 72) /*PATEXEC.ciStr*/);
    SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, nAEGI2, _PtrAdd(lpPatExec, _X64 ? 168 : 84) /*PATEXEC.ciMaxStr*/);

    nCountAll += SendMessage(hMainWnd, 1415 /*AKD_PATEXEC*/, 0, lpPatExec);
  }
  while (bContinue && (nFRF & FRF_ALLFILES) && ((lpFrameCurr = SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0x10 /*FWA_NEXT*/, lpFrameCurr)) != lpFrameStart))

  if (lpCallback)
    oSys.UnregisterCallback(lpCallback);

  AkelPad.MemFree(lpMsg);
  AkelPad.MemFree(lpDelim);
  AkelPad.MemFree(lpPat);
  AkelPad.MemFree(lpPatExec);
  SendMessage(hMainWnd, 1423 /*AKD_PATFREE*/, 0, lpPatExec);
  SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameStart);
  oSys.Call("User32::SetWindowTextW", hButton, bContinue ? nCountAll.toString() : aDlg[nID].T);
  Count_EnableButtons(aButton);

  function PatExecCallback(lpPatExec, lpREGroupRoot, bMatched)
  {
    if (oSys.Call("User32::PeekMessageW", lpMsg, hButton, 513 /*WM_LBUTTONDOWN*/, 513 /*WM_LBUTTONDOWN*/, 0x1 /*PM_REMOVE*/))
    {
      bContinue = false;
      return -1 /*RESEC_STOP*/;
    }

    return 0 /*RESEC_CONTINUE*/;
  }
}

function FindAll(hButton, nID, nCmd)
{
  var nAEFR        = 0x00000001 /*AEFR_DOWN*/;
  var lpFrameStart = SendMessage(hMainWnd, 1290 /*AKD_FRAMEFINDW*/, 1 /*FWF_CURRENT*/, 0);
  var lpFrameCurr  = lpFrameStart;
  var sText        = "";
  var bContinue    = true;
  var nCountAll    = 0;
  var nCountInDoc;
  var nErrOffset;
  var nOffset3;
  var nOffset4;
  var nAEGI1;
  var nAEGI2;
  var aButton;
  var lpMsg;
  var lpWhat;
  var lpFind;
  var lpIndex1;
  var lpIndex2;
  var lpIndex3;
  var lpIndex4;
  var hEditWnd;
  var hEditDoc;
  var bWordWrap;
  var bWrapNotNum;
  var nLine;
  var oLine;
  var nColumn;
  var i;

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);

  if (nFRF & FRF_REGEXP)
    nErrOffset = CheckRegExp(sWhatText);
  else if (nFRF & FRF_ESCAPESEQ)
    nErrOffset = CheckEscSeq(sWhatText);

  if (nErrOffset)
  {
    //to call "Syntax error ..." message
    PostMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_FIND_BUTTON, 0);
    return;
  }

  if (nCmd <= 2)
  {
    if (! AkelPad.IsPluginRunning("Log::Output"))
    {
      if (AkelPad.Call("Log::Output") === 1 /*UD_NONUNLOAD_ACTIVE*/)
        oSys.Call("User32::UpdateWindow", hMainWnd);
      else
        return;
    }

    AkelPad.Call("Log::Output", 4, "", -1, 0);
    AkelPad.Call("Log::Output", 1, "", "", "^  \\[\\d+, (\\d+), (\\d+), \\d+:\\d+\\]", "/FRAME=\\1 /GOTOCHAR=\\2");
  }
  else if (nCmd >= 5)
  {
    if (! AkelPad.IsPluginRunning("LineBoard::Main"))
    {
      if (AkelPad.Call("LineBoard::Main") != 1 /*UD_NONUNLOAD_ACTIVE*/)
        return;
    }

    ShowLineBoardPanel();
    oSys.Call("User32::UpdateWindow", hMainWnd);
  }

  if (nFRF & FRF_WHOLEWORD)
    nAEFR |= 0x00000002 /*AEFR_WHOLEWORD*/;
  if (nFRF & FRF_MATCHCASE)
    nAEFR |= 0x00000004 /*AEFR_MATCHCASE*/;
  if ((nFRF & FRF_REGEXP) || (nFRF & FRF_ESCAPESEQ))
  {
    nAEFR |= 0x00080000 /*AEFR_REGEXP*/;
    if (nFRF & FRF_REGEXP)
    {
      if (nFRF & FRF_REGEXPNONEWLINEDOT)
        nAEFR |= 0x00100000 /*AEFR_REGEXPNONEWLINEDOT*/;
    }
    else
      sWhatText = EscSeqToRegExp(sWhatText);
  }

  if ((nFRF & FRF_BEGINNING) || (nFRF & FRF_ALLFILES))
  {
    nAEGI1 = 1 /*AEGI_FIRSTCHAR*/;
    nAEGI2 = 2 /*AEGI_LASTCHAR*/;
  }
  else if (nFRF & FRF_SELECTION)
  {
    nAEGI1 = 3 /*AEGI_FIRSTSELCHAR*/;
    nAEGI2 = 4 /*AEGI_LASTSELCHAR*/;
  }
  else if (nFRF & FRF_DOWN)
  {
    nAEGI1 = 4 /*AEGI_LASTSELCHAR*/;
    nAEGI2 = 2 /*AEGI_LASTCHAR*/;
  }
  else //nFRF & FRF_UP
  {
    nAEGI1 = 1 /*AEGI_FIRSTCHAR*/;
    nAEGI2 = 3 /*AEGI_FIRSTSELCHAR*/;
  }

  aButton = [];
  lpMsg   = AkelPad.MemAlloc(_X64 ? 48 : 28 /*sizeof(MSG)*/);
  lpWhat  = AkelPad.MemAlloc((sWhatText.length + 1) * 2);
  lpFind  = AkelPad.MemAlloc(_X64 ? 136 : 68 /*sizeof(AEFINDTEXTW)*/);

  AkelPad.MemCopy(lpWhat, sWhatText, DT_UNICODE);
  AkelPad.MemCopy(_PtrAdd(lpFind, _X64 ?  8 :  4) /**pText*/, lpWhat, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpFind, _X64 ? 16 :  8) /*dwTextLen*/, -1, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpFind, _X64 ? 24 : 12) /*nNewLine*/, 3 /*AELB_ASIS*/, DT_DWORD);
  lpIndex1 = _PtrAdd(lpFind, _X64 ?  32 : 16);
  lpIndex2 = _PtrAdd(lpFind, _X64 ?  56 : 28);
  lpIndex3 = _PtrAdd(lpFind, _X64 ?  80 : 40);
  lpIndex4 = _PtrAdd(lpFind, _X64 ? 104 : 52);

  oSys.Call("User32::SetWindowTextW", hButton, sTxtStop);
  Count_EnableButtons(aButton, nID);

  do
  {
    hEditWnd    = AkelPad.GetEditWnd();
    hEditDoc    = AkelPad.GetEditDoc();
    bWordWrap   = SendMessage(hEditWnd, 3241 /*AEM_GETWORDWRAP*/, 0, 0);
    bWrapNotNum = bWordWrap && (! (SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 111 /*MI_STATUSPOSTYPE*/, 0) & 2 /*SPT_LINEWRAP*/));
    nCountInDoc = 0;

    EnableMainWnd(0, hEditWnd);

    if (nCmd >= 5)
    {
      if (bWordWrap)
        AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);

      if (nCmd === 6)
      {
        sText = "," + GetBookmarks(hEditWnd, hEditDoc) + ",";
        oLine = {};
      }
    }

    SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, nAEGI1, lpIndex1);
    SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, nAEGI2, lpIndex2);

    AkelPad.MemCopy(lpFind /*dwFlags*/, nAEFR | 0x00200000 /*AEFR_REGEXPMINMATCH*/, DT_DWORD);

    while (SendMessage(hEditWnd, 3041 /*AEM_FINDTEXTW*/, 0, lpFind))
    {
      AkelPad.MemCopy(lpFind /*dwFlags*/, nAEFR & ~0x00200000 /*AEFR_REGEXPMINMATCH*/, DT_DWORD);

      if (nCmd <= 4)
      {
        nOffset3 = SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex3);
        nOffset4 = SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex4);

        if (nCmd <= 2)
        {
          ++nCountAll;
          ++nCountInDoc;

          if (bWrapNotNum)
          {
            nLine   = SendMessage(hEditWnd, 3143 /*AEM_GETUNWRAPLINE*/, AkelPad.MemRead(lpIndex3, DT_DWORD), 0);
            nColumn = nOffset3 - SendMessage(hEditWnd, 3138 /*AEM_GETRICHOFFSET*/, 18 /*AEGI_WRAPLINEBEGIN*/, nOffset3);
          }
          else
          {
            nLine   = AkelPad.MemRead(lpIndex3, DT_DWORD);
            nColumn = AkelPad.MemRead(_PtrAdd(lpIndex3, _X64 ? 16 : 8), DT_DWORD);
          }

          if (nCountInDoc === 1)
            sText += ((nCountAll > 1) ? "\n" : "") + (AkelPad.GetEditFile(0) ? AkelPad.GetEditFile(0) : sTxtNoName) + ":\n";

          sText += "  [" + nCountInDoc + ", " + lpFrameCurr + ", " + nOffset3 + ", " + (++nLine) + ":" + (++nColumn) + "] " +
                   ((nCmd == 1) ? AkelPad.GetTextRange(nOffset3, nOffset4, 2 /*\n*/)
                                : AkelPad.MemRead(AkelPad.MemRead(_PtrAdd(AkelPad.MemRead(_PtrAdd(lpIndex3, _X64 ? 8 : 4), DT_QWORD), _X64 ? 16 : 8), DT_QWORD), DT_UNICODE)) +
                   "\n";
        }
        else if (nOffset3 !== nOffset4)
          sText += AkelPad.GetTextRange(nOffset3, nOffset4, 2 /*\n*/) + "\n";
      }
      else
      {
        if (nCmd === 5)
          sText += AkelPad.MemRead(lpIndex3, DT_DWORD) + ",";
        else
          oLine[AkelPad.MemRead(lpIndex3, DT_DWORD)] = true;
      }

      if (SendMessage(hEditWnd, 3133 /*AEM_INDEXCOMPARE*/, lpIndex1, lpIndex4) === -1)
      {
        AkelPad.MemCopy(lpIndex1, AkelPad.MemRead(lpIndex4, DT_DWORD), DT_DWORD);
        AkelPad.MemCopy(_PtrAdd(lpIndex1, _X64 ?  8 : 4), AkelPad.MemRead(_PtrAdd(lpIndex4, _X64 ?  8 : 4), DT_QWORD), DT_QWORD);
        AkelPad.MemCopy(_PtrAdd(lpIndex1, _X64 ? 16 : 8), AkelPad.MemRead(_PtrAdd(lpIndex4, _X64 ? 16 : 8), DT_DWORD), DT_DWORD);
      }
      else if (! SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, 22 /*AEGI_NEXTCHAR*/, lpIndex1))
        break;

      if (oSys.Call("User32::PeekMessageW", lpMsg, hButton, 513 /*WM_LBUTTONDOWN*/, 513 /*WM_LBUTTONDOWN*/, 0x1 /*PM_REMOVE*/))
      {
        bContinue = false;
        break;
      }
    }

    if (nCmd <= 2)
    {
      AkelPad.Call("Log::Output", 4, sText, sText.length);
      sText = "";
    }
    else if (nCmd >= 5)
    {
      if (bContinue)
      {
        if (nCmd === 6)
        {
          AkelPad.CallW("LineBoard::Main", 14, hEditWnd, hEditDoc); //Delete all bookmarks

          for (i in oLine)
            sText = sText.replace("," + i + ",", ",");

          sText = sText.substr(1);
        }

        AkelPad.CallW("LineBoard::Main", 13, hEditWnd, hEditDoc, sText); //Set bookmarks
        sText = "";
      }

      if (bWordWrap)
        AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);
    }

    EnableMainWnd(1, hEditWnd);
  }
  while (bContinue && (nFRF & FRF_ALLFILES) && ((lpFrameCurr = SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0x10 /*FWA_NEXT*/, lpFrameCurr)) !== lpFrameStart))

  SendMessage(hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameStart);

  if (nCmd <= 2)
  {
    AkelPad.Call("Log::Output", 4, bContinue ? sTxtTotalFound + nCountAll : "...", -1);
    AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", ('-sSelText="' + sWhatText + '" -bNotRegExp=' + (SendDlgItemMessage(hDlg, IDC_SEARCH_REGEXP, 240 /*BM_GETCHECK*/, 0, 0)?0:1)));
  }
  else if (bContinue)
  {
    if (nCmd === 3)
      AkelPad.SetClipboardText(sText);
    else if (nCmd === 4)
    {
      AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*IDM_FILE_NEW*/, 1 /*lParam=TRUE*/);
      AkelPad.ReplaceSel(sText);
    }
  }

  AkelPad.MemFree(lpMsg);
  AkelPad.MemFree(lpWhat);
  AkelPad.MemFree(lpFind);
  oSys.Call("User32::SetWindowTextW", hButton, aDlg[nID].T);
  Count_EnableButtons(aButton);
}

function EnableMainWnd(bEnable, hEditWnd)
{
  oSys.Call("User32::EnableWindow", hMainWnd, bEnable);
  SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, bEnable, 0);
  SendMessage(hEditWnd, 3185 /*AEM_LOCKSCROLL*/, 3 /*SB_BOTH*/, ! bEnable);

  if (bEnable)
    oSys.Call("User32::InvalidateRect", hEditWnd, 0, 1);
}

function ShowLineBoardPanel()
{
  var lpVisible = AkelPad.MemAlloc(4);

  AkelPad.Call("LineBoard::Main", 4, lpVisible);

  if (! AkelPad.MemRead(lpVisible, DT_DWORD))
    AkelPad.Call("LineBoard::Main", 4);

  AkelPad.MemFree(lpVisible);
}

function GetBookmarks(hEditWnd, hEditDoc)
{
  var lpLength  = AkelPad.MemAlloc(4 /*sizeof(int)*/);
  var sBookmark = "";
  var lpBookmark;
  var nLength;

  AkelPad.CallW("LineBoard::Main", 12, hEditWnd, hEditDoc, 0, lpLength);

  if ((nLength = AkelPad.MemRead(lpLength, 3 /*DT_DWORD*/)) > 1)
  {
    lpBookmark = AkelPad.MemAlloc(nLength * 2 /*sizeof(wchar_t)*/);
    AkelPad.CallW("LineBoard::Main", 12, hEditWnd, hEditDoc, lpBookmark, 0);
    sBookmark = AkelPad.MemRead(lpBookmark, 1 /*DT_UNICODE*/);
    AkelPad.MemFree(lpBookmark);
  }

  AkelPad.MemFree(lpLength);

  return sBookmark;
}

function FRTemplates()
{
  var nX, nY;
  var sTitle;
  var hWndOwn;

  if (hDlg)
  {
    oSys.Call("User32::EnableWindow", hDlg, 0);
    oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDC_SEARCH_MATCHCASE), lpBuffer);
    nX = nFRTX + AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    nY = nFRTY + AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);
    sTitle  = sTxtTemplates + "/" + sTxtBatches;
    hWndOwn = hDlg;
  }
  else
  {
    nX = nBRX;
    nY = nBRY;
    sTitle  = sTxtBatchReplace;
    hWndOwn = hMainWnd;
    aWnd[IDOKB].T = sTxtClose;
  }

  oSys.Call("user32::CreateWindowExW",
    0,            //dwExStyle
    sClass,       //lpClassName
    sTitle,       //lpWindowName
    0x90CC0000,   //dwStyle=WS_POPUP|WS_VISIBLE|WS_CAPTION|WS_SYSMENU|WS_SIZEBOX
    nX,           //x
    nY,           //y
    nFRTW,        //nWidth
    nFRTH,        //nHeight
    hWndOwn,      //hWndParent
    0,            //hMenu
    hInstDLL,     //hInstance
    CallbackFRT); //Script function callback. To use it class must be registered by WindowRegisterClass.

  if (! hDlg)
    AkelPad.WindowGetMessage();
}

function CallbackFRT(hWnd, uMsg, wParam, lParam)
{
  var nID;
  var nCode;
  var sName;

  if (uMsg === 1 /*WM_CREATE*/)
  {
    hWndFRT = hWnd;
    InitDialogFRT();
  }

  else if (uMsg === 0x8001 /*WM_APP+1*/)
    oSys.Call("User32::SetFocus", aWnd[lParam].HWND);

  else if ((uMsg === 6 /*WM_ACTIVATE*/) && (! wParam))
    hFocus = oSys.Call("User32::GetFocus");

  else if (uMsg === 7 /*WM_SETFOCUS*/)
  {
    oSys.Call("User32::SetFocus", hFocus);
    EnableButtonsFRT();
    SetSearchOptionsFRT();
  }

  else if (uMsg === 36 /*WM_GETMINMAXINFO*/)
  {
    AkelPad.MemCopy(_PtrAdd(lParam, 24), nFRTMinW, DT_DWORD); //ptMinTrackSize_x
    AkelPad.MemCopy(_PtrAdd(lParam, 28), nFRTMinH, DT_DWORD); //ptMinTrackSize_y
  }

  else if (uMsg === 5 /*WM_SIZE*/)
    ResizeFRT(LoWord(lParam), HiWord(lParam));

  else if (uMsg === 15 /*WM_PAINT*/)
    PaintSizeGrip(hWnd);

  else if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    nID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));

    if (wParam === 0x09 /*VK_TAB*/)
    {
      if (Ctrl())
      {
        if (Shift())
          nBR = (nBR === 0) ? aBR.length - 1 : nBR - 1;
        else
          nBR = (nBR === aBR.length - 1) ? 0 : nBR + 1;

        SendMessage(aWnd[IDBRTC].HWND, 4912 /*TCM_SETCURFOCUS*/, nBR, 0);
        oSys.Call("User32::SetFocus", aWnd[IDBRLV].HWND);
      }
    }
    else if ((wParam >= 0x31 /*1 key*/) && (wParam <= 0x39 /*9 key*/) || (wParam >= 0x61 /*VK_NUMPAD1*/) && (wParam <= 0x69 /*VK_NUMPAD9*/))
    {
      if (Ctrl())
      {
        nBR = wParam - ((wParam <= 0x39) ? 0x31 : 0x61);
        SendMessage(aWnd[IDBRTC].HWND, 4912 /*TCM_SETCURFOCUS*/, nBR, 0);

        if ((nID >= IDFRTLV) && (nID <= IDDIRALLB))
          oSys.Call("User32::SetFocus", aWnd[nID].HWND);
      }
    }
    else if (wParam === 0x70 /*VK_F1*/)
    {
      if (oSys.Call("User32::IsWindowVisible", aWnd[IDHELP1L].HWND))
      {
        if (Ctrl() || Shift())
          AkelHelp(GetAkelHelpFile());
        else
        {
          if (nID === IDWITHE)
            HelpMenu(0, IDHELP2L, SendMessage(aWnd[IDREGEXPB].HWND, 240 /*BM_GETCHECK*/, 0, 0));
          else
          {
            oSys.Call("User32::SetFocus", aWnd[IDWHATE].HWND);
            HelpMenu(0, IDHELP1L, SendMessage(aWnd[IDREGEXPB].HWND, 240 /*BM_GETCHECK*/, 0, 0));
          }
        }
      }
    }
    else if (wParam === 0x71 /*VK_F2*/)
    {
      if (nID === IDFRTLV)
      {
        if ((! Ctrl()) && (! Shift()))
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTRENB, aWnd[IDFRTRENB].HWND);
      }
      else if ((nID === IDBRTC) || (nID === IDBRLV))
      {
        if ((! Ctrl()) && (! Shift()))
          RenameBR();
      }
    }
    else if (wParam === 0x72 /*VK_F3*/)
    {
      if (! Ctrl())
      {
        nFRTSel = GetCurSelLV(IDFRTLV);
        if (Shift())
        {
          if (nFRTSel > 0)
            --nFRTSel;
        }
        else
        {
          if (nFRTSel < GetItemCountLV(IDFRTLV) - 1)
            ++nFRTSel;
        }

        SetCurSelLV(IDFRTLV, nFRTSel);
      }
    }
    else if (wParam === 0x2D /*VK_INSERT*/)
    {
      if (nID === IDFRTLV)
      {
        if (Ctrl() || Shift())
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTADDB, aWnd[IDFRTADDB].HWND);
        else
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTNEWB, aWnd[IDFRTNEWB].HWND);
      }
    }
    else if (wParam === 0x2E /*VK_DELETE*/)
    {
      if (nID === IDFRTLV)
      {
        if (Ctrl() || Shift())
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTDELB, aWnd[IDFRTDELB].HWND);
      }
      else if (nID === IDBRLV)
      {
        if (Ctrl() || Shift())
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDBRDELB, aWnd[IDBRDELB].HWND);
      }
    }
    else if (wParam === 0x46 /*F key*/)
    {
      if ((nID === IDWHATE) || (nID === IDWITHE))
      {
        if (Ctrl() && (! Shift()) && (! Alt()))
        {
          bAEFont = ! bAEFont;
          SetEditFontFRT();
        }
      }
    }
    else if (wParam === 0x0D /*VK_RETURN*/)
    {
      if ((nID >= IDFRTLV) && (nID <= IDBRLV) || (nID >= IDBRENABLEB) && (nID <= IDBRAWMB))
      {
        if ((! Ctrl()) && (! Shift()))
          PostMessage(hWnd, 273 /*WM_COMMAND*/, IDOKB, aWnd[IDOKB].HWND);
      }
    }
  }

  else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
  {
    nID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));

    if (wParam === 0x2E /*VK_DELETE*/)
    {
      if (nID === IDFRTLV)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTDELB, aWnd[IDFRTDELB].HWND);
      else if (nID === IDBRLV)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDBRDELB, aWnd[IDBRDELB].HWND);
    }
    else if (wParam === 0x27 /*VK_RIGHT*/)
    {
      if (! Shift())
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDTOBATCH, aWnd[IDTOBATCH].HWND);
    }
    else if (wParam === 0x26 /*VK_UP*/)
    {
      if (nID === IDFRTLV)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTUPB, aWnd[IDFRTUPB].HWND);
      else if (nID === IDBRLV)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDBRUPB, aWnd[IDBRUPB].HWND);
    }
    else if (wParam === 0x28 /*VK_DOWN*/)
    {
      if (nID === IDFRTLV)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDFRTDOWNB, aWnd[IDFRTDOWNB].HWND);
      else if (nID === IDBRLV)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDBRDOWNB, aWnd[IDBRDOWNB].HWND);
    }
  }

  else if (uMsg === 78 /*WM_NOTIFY*/)
  {
    if (wParam === IDFRTLV)
    {
      switch (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8), DT_DWORD))
      {
        case -101 : //LVN_ITEMCHANGED
          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 32 : 20) /*NMLISTVIEW.uNewState*/, DT_DWORD) & 0x2 /*LVIS_SELECTED*/)
          {
            sName = GetTextLV(IDFRTLV, AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMLISTVIEW.iItem*/, DT_DWORD), 0);

            if (sName.toUpperCase() != GetTextLV(IDBRLV, GetCurSelLV(IDBRLV), 0).toUpperCase())
              SetCurSelLV(IDBRLV, FindItemLV(IDBRLV, sName, -1));

            RefreshViewFRT();
          }
          break;
        case -3 : //NM_DBLCLK
          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) !== -1)
          {
            if (hDlg)
            {
              PostMessage(hWnd, 273 /*WM_COMMAND*/, IDOKB, aWnd[IDOKB].HWND);
              break;
            }
          }
        case -2 : //NM_CLICK
        case -5 : //NM_RCLICK
        case -6 : //NM_RDBLCLK
          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
            SetCurSelLV(IDFRTLV, GetCurFocLV(IDFRTLV));
          break;
        case -7 : //NM_SETFOCUS
          EnableButtonsFRT();
          break;
        case -108 : //LVN_COLUMNCLICK
          HeaderLVMenu(aWnd[IDFRTLV].HWND, -1, -1);
          break;
      }
    }
    else if (wParam === IDBRLV)
    {
      switch (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8), DT_DWORD))
      {
        case -101 : //LVN_ITEMCHANGED
          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 32 : 20) /*NMLISTVIEW.uNewState*/, DT_DWORD) & 0x2 /*LVIS_SELECTED*/)
          {
            sName = GetTextLV(IDBRLV, AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMLISTVIEW.iItem*/, DT_DWORD), 0);

            if (sName.toUpperCase() !== GetTextLV(IDFRTLV, GetCurSelLV(IDFRTLV), 0).toUpperCase())
              SetCurSelLV(IDFRTLV, FindItemLV(IDFRTLV, sName, -1));

            EnableButtonsFRT();
          }
          else if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 32 : 20) /*NMLISTVIEW.uNewState*/, DT_DWORD) & 0xF000 /*LVIS_STATEIMAGEMASK*/)
          {
            if (bCheckBRLV)
            {
              GetCheckBRLV(AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMLISTVIEW.iItem*/, DT_DWORD));
              EnableButtonsFRT();
            }
          }
          break;
        case -3 : //NM_DBLCLK
          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) !== -1)
          {
            if (hDlg)
            {
              PostMessage(hWnd, 273 /*WM_COMMAND*/, IDOKB, aWnd[IDOKB].HWND);
              break;
            }
          }
        case -2 : //NM_CLICK
        case -5 : //NM_RCLICK
        case -6 : //NM_RDBLCLK
          if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, DT_DWORD) === -1)
            SetCurSelLV(IDBRLV, GetCurFocLV(IDBRLV));
          break;
        case -7 : //NM_SETFOCUS
          EnableButtonsFRT();
          break;
        case -108 : //LVN_COLUMNCLICK
          HeaderLVMenu(aWnd[IDBRLV].HWND, -1, -1);
          break;
      }
    }
    else if (wParam == IDBRTC)
    {
      switch (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8), DT_DWORD))
      {
        case -551 : //TCN_SELCHANGE
          nBR = SendMessage(aWnd[IDBRTC].HWND, 4875 /*TCM_GETCURSEL*/, 0, 0);
          SetNameBR();
          FillBRLV();
          EnableButtonsFRT();
          oSys.Call("User32::SetFocus", aWnd[IDBRLV].HWND);
          break;
        case -5 : //NM_RCLICK
          TabMenu();
          break;
      }
    }
    else if ((wParam === IDHELP1L) || (wParam === IDHELP2L))
    {
      if (AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8), DT_DWORD) === -2 /*NM_CLICK*/)
        HelpMenu(0, wParam, SendMessage(aWnd[IDREGEXPB].HWND, 240 /*BM_GETCHECK*/, 0, 0));
    }
  }

  else if (uMsg === 123 /*WM_CONTEXTMENU*/)
  {
    if ((wParam === aWnd[IDWHATE].HWND) || (wParam === aWnd[IDWITHE].HWND))
      EditMenu(wParam, LoWord(lParam), HiWord(lParam));
    else if ((wParam === aWnd[IDFRTLV].HWND) || (wParam === aWnd[IDBRLV].HWND))
      HeaderLVMenu(wParam, LoWord(lParam), HiWord(lParam));
  }

  else if (uMsg === 273 /*WM_COMMAND*/)
  {
    nID   = LoWord(wParam);
    nCode = HiWord(wParam);

    if ((nID === IDWHATE) || (nID === IDWITHE))
    {
      if (nCode === 256 /*EN_SETFOCUS*/)
        EnableButtonsFRT();
      else if ((nCode === 768 /*EN_CHANGE*/) && (oSys.Call("User32::GetFocus") === lParam))
      {
        oSys.Call("User32::GetWindowTextW", lParam, lpBuffer, nBufSize / 2);
        SetParametersFRTToLV(nID - IDWHATE + 1, AkelPad.MemRead(lpBuffer, DT_UNICODE).replace(/[\r\n\t]/g, ""))
        EnableButtonsFRT();
      }
    }
    else if ((nID >= IDMATCHB) && (nID <= IDESCSEQB))
    {
      CheckButtonsFRT(nID);
      EnableButtonsFRT();
    }
    else if ((nID >= IDDIRDOWNB) && (nID <= IDDIRALLB))
      SetSearchDirectionFRT(nID);
    else if ((nID >= IDFRTNEWB) && (nID <= IDFRTRENB))
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
      {
        NewAddRenameFRT(nID);
        PostMessage(hWnd, 0x8001 /*WM_APP+1*/, 0, IDFRTLV);
      }
    }
    else if ((nID === IDFRTUPB) || (nID === IDFRTDOWNB))
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
      {
        UpDownFRT(nID);
        PostMessage(hWnd, 0x8001 /*WM_APP+1*/, 0, IDFRTLV);
      }
    }
    else if (nID === IDFRTDELB)
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
      {
        RemoveFRT();
        PostMessage(hWnd, 0x8001 /*WM_APP+1*/, 0, IDFRTLV);
      }
    }
    else if (nID === IDCHECKEXPB)
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
        CheckExpressionFRT(GetCurSelLV(IDFRTLV), 1);
    }
    else if (nID === IDTOBATCH)
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
        AddToBatch();
    }
    else if (nID === IDOKB)
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
      {
        if (hDlg)
          SetFRTtoFR();

        PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
      }
    }
    else if ((nID === IDBRUPB) || (nID === IDBRDOWNB))
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
      {
        UpDownBR(nID);
        PostMessage(hWnd, 0x8001 /*WM_APP+1*/, 0, IDBRLV);
      }
    }
    else if (nID === IDBRDELB)
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
      {
        RemoveBR();
        PostMessage(hWnd, 0x8001 /*WM_APP+1*/, 0, IDBRLV);
      }
    }
    else if (nID === IDBRALLB)
    {
      if (oSys.Call("User32::IsWindowEnabled", lParam))
        BatchReplaceAll();

      nBatchNum = 0;
    }
    else if (nID === IDBRENABLEB)
      SetCheckBRLV(-1, SendMessage(lParam, 240 /*BM_GETCHECK*/, 0, 0));
    else if ((nID === IDBRACDB) || (nID === IDBRAWMB))
    {
      nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0) ^ ((nID === IDBRACDB) ? FRF_REPLACEALLANDCLOSE : FRF_REPLACEALLNOMSG);
      SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 228 /*MIS_SEARCHOPTIONS*/, nFRF);
    }
    else if (nID === IDCANCEL)
      PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
  }

  else if (uMsg === 16 /*WM_CLOSE*/)
  {
    SaveFRT();
    AkelPad.WindowUnsubClass(aWnd[IDWHATE].HWND);
    AkelPad.WindowUnsubClass(aWnd[IDWITHE].HWND);
    if (hDlg)
      oSys.Call("User32::EnableWindow", hDlg, 1);
    oSys.Call("User32::DestroyWindow", hWnd);
  }

  else if (uMsg === 2 /*WM_DESTROY*/)
  {
    if (! hDlg)
      oSys.Call("User32::PostQuitMessage", 0);
  }

  return 0;
}

function InitDialogFRT()
{
  var lpTCITEM;
  var hDC;
  var i;

  for (i = IDFRTS; i <= IDHELP2L; ++i)
  {
    aWnd[i].HWND =
      oSys.Call("User32::CreateWindowExW",
        0,          //dwExStyle
        aWnd[i].C,  //lpClassName
        aWnd[i].T,  //lpWindowName
        aWnd[i].S,  //dwStyle
        0, 0, 0, 0, //x, y, nWidth, nHeight
        hWndFRT,    //hWndParent
        i,          //ID
        hInstDLL,   //hInstance
        0);         //lpParam
    SendMessage(aWnd[i].HWND, 48 /*WM_SETFONT*/, hGuiFont, true);
  }

  if (! hDlg)
  {
    hDC = oSys.Call("User32::GetDC", hWndFRT);
    oSys.Call("Gdi32::SelectObject", hDC, hGuiFont);
    oSys.Call("Gdi32::SetMapMode", hDC, 1 /*MM_TEXT*/);
    oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, aDlg[IDHELP1L].T, aDlg[IDHELP1L].T.length, lpBuffer);
    aDlg[IDHELP1L].W = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    aDlg[IDHELP1L].H = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);
    oSys.Call("User32::ReleaseDC", hWndFRT, hDC);
  }

  for (i = IDWHATE; i <= IDWITHE; ++i)
  {
    SendMessage(aWnd[i].HWND, 3262 /*AEM_SETTEXTLIMIT*/, 1024, 0);
    SendMessage(aWnd[i].HWND, 1093 /*EM_SETEVENTMASK*/, 0, 0x1 /*ENM_CHANGE*/);
    aSubClassFRT[i] = AkelPad.WindowSubClass(aWnd[i].HWND, EditCallbackFRT, 256 /*WM_KEYDOWN*/, 260 /*WM_SYSKEYDOWN*/);
  }

  SetEditFontFRT();

  SendMessage(aWnd[IDFRTLV].HWND, 4150 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0, 0x0421 /*LVS_EX_INFOTIP|LVS_EX_FULLROWSELECT|LVS_EX_GRIDLINES*/);
  SendMessage(aWnd[IDBRLV].HWND,  4150 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0, 0x0425 /*LVS_EX_INFOTIP|LVS_EX_FULLROWSELECT|LVS_EX_CHECKBOXES|LVS_EX_GRIDLINES*/);
  InsertColumnsLV(IDFRTLV);
  InsertColumnsLV(IDBRLV);
  SetSortFRTLV();
  FillFRTLV();
  FillBRLV();

  //Tab
  lpTCITEM = AkelPad.MemAlloc(_X64 ? 40 : 28 /*sizeof(TCITEM)*/);
  AkelPad.MemCopy(_PtrAdd(lpTCITEM, 0),     1 /*TCIF_TEXT*/,   DT_DWORD); //mask
  AkelPad.MemCopy(_PtrAdd(lpTCITEM, _X64 ? 16 : 12), lpBuffer, DT_QWORD); //pszText

  for (i = 0; i < aBR.length; ++i)
  {
    AkelPad.MemCopy(lpBuffer, (i + 1).toString(), DT_UNICODE);
    SendMessage(aWnd[IDBRTC].HWND, 4926 /*TCM_INSERTITEMW*/, i, lpTCITEM);
  }

  SendMessage(aWnd[IDBRTC].HWND, 4905 /*TCM_SETITEMSIZE*/, 0, MkLong(Scale.X(25), Scale.Y(20)));
  SendMessage(aWnd[IDBRTC].HWND, 4912 /*TCM_SETCURFOCUS*/, nBR, 0);
  SetNameBR();
  AkelPad.MemFree(lpTCITEM);

  for (i = IDDIRDOWNB; i <= IDDIRALLB; ++i)
    oSys.Call("User32::SetWindowLongW", aWnd[i].HWND, -16 /*GWL_STYLE*/, aWnd[i].S);

  hFocus = aWnd[IDFRTLV].HWND;
  oSys.Call("User32::SetFocus", hFocus);

  if (nBatchNum)
    PostMessage(hWndFRT, 273 /*WM_COMMAND*/, IDBRALLB, aWnd[IDBRALLB].HWND);
}

function EditCallbackFRT(hWnd, uMsg, wParam, lParam)
{
  if (uMsg === 256 /*WM_KEYDOWN*/)
  {
    if (wParam === 0x09 /*VK_TAB*/)
      AkelPad.WindowNoNextProc(aSubClassFRT[GetDlgCtrlID(hWnd)]);
  }
  else if (uMsg === 260 /*WM_SYSKEYDOWN*/)
  {
    if (wParam === 0x27 /*VK_RIGHT*/)
    {
      if (! Shift())
        AkelPad.WindowNoNextProc(aSubClassFRT[GetDlgCtrlID(hWnd)]);
    }
  }

  return 0;
}

function PaintSizeGrip(hWnd)
{
  var lpPaint = AkelPad.MemAlloc(_X64 ? 72 : 64); //sizeof(PAINTSTRUCT)
  var hDC;

  if (hDC = oSys.Call("User32::BeginPaint", hWnd, lpPaint))
  {
    oSys.Call("User32::GetClientRect", hWnd, lpBuffer);

    AkelPad.MemCopy(_PtrAdd(lpBuffer, 0), AkelPad.MemRead(_PtrAdd(lpBuffer,  8), DT_DWORD) - oSys.Call("User32::GetSystemMetrics",  2 /*SM_CXVSCROLL*/), DT_DWORD);
    AkelPad.MemCopy(_PtrAdd(lpBuffer, 4), AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - oSys.Call("User32::GetSystemMetrics", 20 /*SM_CYVSCROLL*/), DT_DWORD);

    oSys.Call("User32::DrawFrameControl", hDC, lpBuffer, 3 /*DFC_SCROLL*/, 0x8 /*DFCS_SCROLLSIZEGRIP*/);
    oSys.Call("User32::EndPaint", hWnd, lpPaint);
  }

  AkelPad.MemFree(lpPaint);
}

function ResizeFRT(nW, nH)
{
  var nFlags = 0x14; //SWP_NOACTIVATE|SWP_NOZORDER
  var nW5    = Scale.X(5);
  var nW10   = Scale.X(10);
  var nW16   = Scale.X(16);
  var nW75   = Scale.X(75);
  var nW90   = Scale.X(90);
  var nW145  = Scale.X(145);
  var nH5    = Scale.Y(5);
  var nH10   = Scale.Y(10);
  var nH13   = Scale.Y(13);
  var nH16   = Scale.Y(16);
  var nH18   = Scale.Y(18);
  var nH20   = Scale.Y(20);
  var nH23   = Scale.Y(23);
  var nH25   = Scale.Y(25);
  var nLW    = Math.round((nW - nW10 * 4) / 3) - nW10;
  var nEW    = nW - nLW * 2 - nW10 * 4;
  var nEH    = Math.round((nH - nH25 * 2 - nH23 * 2 - nH10 * 14) / 2);
  var nX;
  var i;

  oSys.Call("User32::SetWindowPos", aWnd[IDFRTS].HWND, 0,
    nW10,
    nH10,
    nLW,
    nH20,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDFRTLV].HWND, 0,
    nW10,
    nH20 + nH10,
    nLW,
    nH - nH23 * 2 - nH20 - nH10 * 3,
    nFlags);
  for (i = IDWHATS; i <= IDWITHS; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nLW + nW10 * 2,
      nH10 + (nH25 + nEH) * (i - IDWHATS),
      nW145,
      nH13,
      nFlags);
  for (i = IDHELP1L; i <= IDHELP2L; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nLW + nW10 * 2 + nEW - aDlg[IDHELP1L].W,
      nH10 + (nH25 + nEH) * (i - IDHELP1L),
      aDlg[IDHELP1L].W,
      aDlg[IDHELP1L].H,
      nFlags);
  for (i = IDWHATE; i <= IDWITHE; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nLW + nW10 * 2,
      nH25 + (nH25 + nEH) * (i - IDWHATE),
      nEW,
      nEH,
      nFlags);
  for (i = IDMATCHB; i <= IDREGEXPB; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nLW + nW10 * 2,
      (nH25 + nEH) * 2 + nH10 + nH20 * (i - IDMATCHB),
      nW145,
      nH16,
      nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDDOTNLB].HWND, 0,
    nLW + nW10 * 2 + nW16,
    (nH25 + nEH) * 2 + nH10 + nH20 * 3,
    nW145 - nW16,
    nH16,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDESCSEQB].HWND, 0,
    nLW + nW10 * 2,
    (nH25 + nEH) * 2 + nH10 + nH20 * 4,
    nW145,
    nH16,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDDIRG].HWND, 0,
    nLW + nEW - nW90,
    (nH25 + nEH) * 2 + nH10,
    nW90 + nW10 * 2,
    nH18 * 6,
    nFlags);
  for (i = IDDIRDOWNB; i <= IDDIRALLB; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nLW + nEW - nW90 + nW10,
      (nH25 + nEH + nH10) * 2 + nH5 + nH18 * (i - IDDIRDOWNB),
      nW90,
      nH16,
      nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRS].HWND, 0,
    nW - nLW - nW10,
    nH10,
    nLW,
    nH20,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRTC].HWND, 0,
    nW - nLW - nW10,
    nH20 + nH10,
    nLW,
    nH20,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRNAMES].HWND, 0,
    nW - nLW - nW10,
    nH20 * 2  + nH10,
    nLW,
    Scale.Y(21),
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRLV].HWND, 0,
    nW - nLW - nW10,
    nH20 * 3 + nH10,
    nLW,
    nH - nH20 * 3 - (nH23 + nH16 + nH10) * 2 - nH5 * 4,
    nFlags);
  nX = nW10 + Math.round((nLW - (nW75 * 3 + nW5 * 2)) / 2);
  for (i = IDFRTNEWB; i <= IDFRTRENB; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nX + (nW75 + nW5) * (i - IDFRTNEWB),
      nH - nH23 * 2 - nH10 - nH5,
      nW75,
      nH23,
      nFlags);
  for (i = IDFRTUPB; i <= IDFRTDELB; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nX + (nW75 + nW5) * (i - IDFRTUPB),
      nH - nH23 - nH10,
      nW75,
      nH23,
      nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDCHECKEXPB].HWND, 0,
    Math.round((nW - (nW75 * 2 + nW5)) / 2),
    nH - nH23 * 2 - nH5 - nH10,
    nW75 * 2 + nW5,
    nH23,
    nFlags);
  for (i = IDTOBATCH; i <= IDOKB; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      Math.round((nW - (nW75 * 2 + nW5)) / 2) + (nW75 + nW5) * (i - IDTOBATCH),
      nH - nH23 - nH10,
      nW75,
      nH23,
      nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRENABLEB].HWND, 0,
    nW - nLW - nW10,
    nH - (nH23 + nH16) * 2 - nH10 - nH5 * 3,
    nW75 * 2,
    nH16,
    nFlags);
  nX = nW - nLW - nW10 + Math.round((nLW - (nW75 * 3 + nW5 * 2)) / 2);
  for (i = IDBRUPB; i <= IDBRDELB; ++i)
    oSys.Call("User32::SetWindowPos", aWnd[i].HWND, 0,
      nX + (nW75 + nW5) * (i - IDBRUPB),
      nH - nH23 * 2 - nH16 - nH10 - nH5 * 2,
      nW75,
      nH23,
      nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRALLB].HWND, 0,
    nX,
    nH - nH23 - nH16 - nH10 - nH5,
    nW75 * 3 + nW5 * 2,
    nH23,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRACDB].HWND, 0,
    nX,
    nH - nH16 - nH10,
    Scale.X(115),
    nH16,
    nFlags);
  oSys.Call("User32::SetWindowPos", aWnd[IDBRAWMB].HWND, 0,
    nX + Scale.X(130),
    nH - nH16 - nH10,
    Scale.X(105),
    nH16,
    nFlags);

  SendMessage(aWnd[IDFRTLV].HWND, 4115 /*LVM_ENSUREVISIBLE*/, GetCurSelLV(IDFRTLV), false);
  SendMessage(aWnd[IDBRLV].HWND,  4115 /*LVM_ENSUREVISIBLE*/, GetCurSelLV(IDBRLV),  false);
  SendMessage(aWnd[IDWHATE].HWND, 3242 /*AEM_SETWORDWRAP*/, 0x2 /*AEWW_SYMBOL*/, 0);
  SendMessage(aWnd[IDWITHE].HWND, 3242 /*AEM_SETWORDWRAP*/, 0x2 /*AEWW_SYMBOL*/, 0);
  oSys.Call("user32::InvalidateRect", hWndFRT, 0, true);
}

function RefreshViewFRT()
{
  var nItem  = GetCurSelLV(IDFRTLV);
  var sConds = (nItem > -1) ? GetTextLV(IDFRTLV, nItem, 3) : "";
  var i;

  for (i = IDWHATE; i <= IDWITHE; ++i)
  {
    oSys.Call("User32::SetWindowTextW", aWnd[i].HWND, (nItem > -1) ? GetTextLV(IDFRTLV, nItem, i - IDWHATE + 1) : "");
    oSys.Call("User32::EnableWindow", aWnd[i].HWND, (nItem > -1));
  }

  for (i = IDMATCHB; i <= IDESCSEQB; ++i)
  {
    SendMessage(aWnd[i].HWND, 241 /*BM_SETCHECK*/, parseInt(sConds.substr(i - IDMATCHB, 1)), 0);
    oSys.Call("User32::EnableWindow", aWnd[i].HWND, (nItem > -1));
  }

  EnableButtonsFRT();
  ShowHelpLinksFRT();
}

function EnableButtonsFRT()
{
  var nItemFRT = GetCurSelLV(IDFRTLV);
  var nItemBR  = GetCurSelLV(IDBRLV);
  var nCheckBR = 0;
  var i;

  for (i = 0; i < aBRCB[nBR].length; ++i)
    nCheckBR += aBRCB[nBR][i];

  oSys.Call("User32::EnableWindow", aWnd[IDDOTNLB].HWND,    SendMessage(aWnd[IDREGEXPB].HWND, 240 /*BM_GETCHECK*/, 0, 0));
  oSys.Call("User32::EnableWindow", aWnd[IDDIRALLB].HWND,   AkelPad.IsMDI());
  oSys.Call("User32::EnableWindow", aWnd[IDFRTADDB].HWND,   hDlg);
  oSys.Call("User32::EnableWindow", aWnd[IDFRTRENB].HWND,   (nItemFRT > -1));
  oSys.Call("User32::EnableWindow", aWnd[IDFRTUPB].HWND,    (nItemFRT > 0) && (! bFRTSort));
  oSys.Call("User32::EnableWindow", aWnd[IDFRTDOWNB].HWND,  (nItemFRT > -1) && (nItemFRT < GetItemCountLV(IDFRTLV) - 1) && (! bFRTSort));
  oSys.Call("User32::EnableWindow", aWnd[IDFRTDELB].HWND,   (nItemFRT > -1));
  oSys.Call("User32::EnableWindow", aWnd[IDCHECKEXPB].HWND, (nItemFRT > -1) && GetTextLV(IDFRTLV, nItemFRT, 1).length && ((GetTextLV(IDFRTLV, nItemFRT, 3).charAt(2) === "1") || (GetTextLV(IDFRTLV, nItemFRT, 3).charAt(4) === "1")));
  oSys.Call("User32::EnableWindow", aWnd[IDTOBATCH].HWND,   (nItemFRT > -1));
  oSys.Call("User32::EnableWindow", aWnd[IDOKB].HWND,       (nItemFRT > -1) || (! hDlg));
  oSys.Call("User32::EnableWindow", aWnd[IDBRUPB].HWND,     nItemBR > 0);
  oSys.Call("User32::EnableWindow", aWnd[IDBRDOWNB].HWND,   (nItemBR > -1) && (nItemBR < aBR[nBR].length - 1));
  oSys.Call("User32::EnableWindow", aWnd[IDBRDELB].HWND,    (nItemBR > -1) && aBR[nBR].length);
  oSys.Call("User32::EnableWindow", aWnd[IDBRALLB].HWND,    aBR[nBR].length && nCheckBR && (! AkelPad.GetEditReadOnly(0)));
  oSys.Call("User32::EnableWindow", aWnd[IDBRENABLEB].HWND, aBR[nBR].length);

  SendMessage(aWnd[IDBRENABLEB].HWND, 241 /*BM_SETCHECK*/, aBR[nBR].length && (nCheckBR == aBRCB[nBR].length), 0);

  for (i = IDFRTNEWB; i <= IDBRALLB; ++i)
    SendMessage(aWnd[i].HWND, 244 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 1);

  if ((nItemFRT > -1) || (! hDlg))
    SendMessage(aWnd[IDOKB].HWND, 244 /*BM_SETSTYLE*/, 1 /*BS_DRFPUSHBUTTON*/, 1);
}

function SetSearchOptionsFRT()
{
  var nID;

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);

  if (nFRF & FRF_ALLFILES)
    nID = IDDIRALLB;
  else if (nFRF & FRF_SELECTION)
    nID = IDDIRSELB;
  else if ((nFRF & FRF_BEGINNING) || hDlg && (SendDlgItemMessage(hDlg, IDC_SEARCH_BEGINNING, 242 /*BM_GETSTATE*/, 0, 0) & 4 /*BST_PUSHED*/))
    nID = IDDIRBEGB;
  else if (nFRF & FRF_UP)
    nID = IDDIRUPB;
  else
    nID = IDDIRDOWNB;

  oSys.Call("User32::CheckRadioButton", hWndFRT, IDDIRDOWNB, IDDIRALLB, nID);

  SendMessage(aWnd[IDBRACDB].HWND, 241 /*BM_SETCHECK*/, nFRF & FRF_REPLACEALLANDCLOSE, 0);
  SendMessage(aWnd[IDBRAWMB].HWND, 241 /*BM_SETCHECK*/, nFRF & FRF_REPLACEALLNOMSG, 0);
}

function SetSearchDirectionFRT(nID)
{
  var nDlgID;

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0) & ~(FRF_DOWN | FRF_UP | FRF_BEGINNING | FRF_SELECTION | FRF_ALLFILES);

  if (nID === IDDIRDOWNB)
  {
    nFRF |= FRF_DOWN
    nDlgID = IDC_SEARCH_FORWARD;
  }
  else if (nID === IDDIRUPB)
  {
    nFRF |= FRF_UP;
    nDlgID = IDC_SEARCH_BACKWARD;
  }
  else if (nID === IDDIRBEGB)
  {
    nFRF |= FRF_DOWN | FRF_BEGINNING;
    nDlgID = IDC_SEARCH_BEGINNING;
  }
  else if (nID === IDDIRSELB)
  {
    nFRF |= FRF_DOWN | FRF_SELECTION;
    nDlgID = IDC_SEARCH_INSEL;
  }
  else
  {
    nFRF |= FRF_DOWN | FRF_BEGINNING | FRF_ALLFILES;
    nDlgID = IDC_SEARCH_ALLFILES;
  }

  oSys.Call("User32::SetWindowLongW", aWnd[nID].HWND, -16 /*GWL_STYLE*/, aWnd[nID].S);

  if (hDlg)
  {
    oSys.Call("User32::CheckRadioButton", hDlg, IDC_SEARCH_BACKWARD, IDC_SEARCH_ALLFILES, nDlgID);
    SendMessage(hDlg, 273 /*WM_COMMAND*/, nDlgID, GetDlgItem(hDlg, nDlgID));
  }
  else
    SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 228 /*MIS_SEARCHOPTIONS*/, nFRF);
}

function SetParametersFRTToLV(nCol, sText)
{
  var nItem = GetCurSelLV(IDFRTLV);
  var sName = GetTextLV(IDFRTLV, nItem, 0).toUpperCase();
  var i;

  SetTextLV(IDFRTLV, nItem, nCol, sText);

  for (i = 0; i < aBR[nBR].length; ++i)
  {
    if (aBR[nBR][i].toUpperCase() === sName)
      SetTextLV(IDBRLV, i, nCol, sText);
  }
}

function CheckButtonsFRT(nID)
{
  var sConds = "";
  var i;

  if ((nID === IDREGEXPB) && SendMessage(aWnd[IDREGEXPB].HWND, 240 /*BM_GETCHECK*/, 0, 0))
    SendMessage(aWnd[IDESCSEQB].HWND, 241 /*BM_SETCHECK*/, 0, 0);
  else if ((nID === IDESCSEQB) && SendMessage(aWnd[IDESCSEQB].HWND, 240 /*BM_GETCHECK*/, 0, 0))
    SendMessage(aWnd[IDREGEXPB].HWND, 241 /*BM_SETCHECK*/, 0, 0);

  ShowHelpLinksFRT();

  for (i = IDMATCHB; i <= IDESCSEQB; ++i)
    sConds += SendMessage(aWnd[i].HWND, 240 /*BM_GETCHECK*/, 0, 0).toString();

  SetParametersFRTToLV(3, sConds);
}

function ShowHelpLinksFRT()
{
  var bShow = SendMessage(aWnd[IDREGEXPB].HWND, 240 /*BM_GETCHECK*/, 0, 0) || SendMessage(aWnd[IDESCSEQB].HWND, 240 /*BM_GETCHECK*/, 0, 0);

  oSys.Call("User32::ShowWindow", aWnd[IDHELP1L].HWND, bShow);
  oSys.Call("User32::ShowWindow", aWnd[IDHELP2L].HWND, bShow);
}

function SetEditFontFRT()
{
  var hFont = bAEFont ? SendMessage(hMainWnd, 1233 /*AKD_GETFONTW*/, 0, 0) : hGuiFont;

  SendMessage(aWnd[IDWHATE].HWND, 48 /*WM_SETFONT*/, hFont, 0);
  SendMessage(aWnd[IDWITHE].HWND, 48 /*WM_SETFONT*/, hFont, 0);
  oSys.Call("User32::InvalidateRect", aWnd[IDWHATE].HWND, 0, 1);
  oSys.Call("User32::InvalidateRect", aWnd[IDWITHE].HWND, 0, 1);
}

function GetItemCountLV(nID)
{
  return SendMessage(aWnd[nID].HWND, 4100 /*LVM_GETITEMCOUNT*/, 0, 0);
}

function GetCurFocLV(nID)
{
  return SendMessage(aWnd[nID].HWND, 4108 /*LVM_GETNEXTITEM*/, -1, 0x1 /*LVNI_FOCUSED*/);
}

function GetCurSelLV(nID)
{
  return SendMessage(aWnd[nID].HWND, 4108 /*LVM_GETNEXTITEM*/, -1, 0x2 /*LVNI_SELECTED*/);
}

function SetCurSelLV(nID, nItem)
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16), 0x3 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD); //stateMask

  if (nItem > -1)
  {
    AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), 0x3 /*LVIS_SELECTED|LVIS_FOCUSED*/, DT_DWORD); //state
    SendMessage(aWnd[nID].HWND, 4139 /*LVM_SETITEMSTATE*/, nItem, lpLVITEM);
    SendMessage(aWnd[nID].HWND, 4115 /*LVM_ENSUREVISIBLE*/, nItem, false);
  }
  else
  {
    AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), 0x0, DT_DWORD);
    SendMessage(aWnd[nID].HWND, 4139 /*LVM_SETITEMSTATE*/, GetCurSelLV(nID), lpLVITEM);
  }
}

function GetTextLV(nID, nItem, nSubItem)
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8), nSubItem, DT_DWORD);

  if (SendMessage(aWnd[nID].HWND, 4211 /*LVM_GETITEMTEXTW*/, nItem, lpLVITEM))
    return AkelPad.MemRead(lpBuffer, DT_UNICODE);

  return "";
}

function SetTextLV(nID, nItem, nSubItem, sText)
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8), nSubItem, DT_DWORD);
  AkelPad.MemCopy(lpBuffer, sText, DT_UNICODE);
  SendMessage(aWnd[nID].HWND, 4212 /*LVM_SETITEMTEXTW*/, nItem, lpLVITEM);
}

function FindItemLV(nID, sText, nItem)
{
  var lpLVFINDINFO = AkelPad.MemAlloc(_X64 ? 40 : 24); //sizeof(LVFINDINFO)

  AkelPad.MemCopy(lpLVFINDINFO, 0x02 /*LVFI_STRING*/, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVFINDINFO, _X64 ? 8 : 4), lpBuffer, DT_QWORD);
  AkelPad.MemCopy(lpBuffer, sText, DT_UNICODE);

  nItem = SendMessage(aWnd[nID].HWND, 4179 /*LVM_FINDITEMW*/, nItem, lpLVFINDINFO);
  AkelPad.MemFree(lpLVFINDINFO);

  return nItem;
}

function InsertItemLV(nID, aField, nItem)
{
  var i;

  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 4), nItem, DT_DWORD);
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8),     0, DT_DWORD);

  AkelPad.MemCopy(lpBuffer, aField[0], DT_UNICODE);
  nItem = SendMessage(aWnd[nID].HWND, 4173 /*LVM_INSERTITEMW*/, 0, lpLVITEM);

  for (i = 1; i < aField.length; ++i)
  {
    AkelPad.MemCopy(_PtrAdd(lpLVITEM, 8), i, DT_DWORD);
    AkelPad.MemCopy(lpBuffer, aField[i], DT_UNICODE);
    SendMessage(aWnd[nID].HWND, 4212 /*LVM_SETITEMTEXTW*/, nItem, lpLVITEM);
  }

  return nItem;
}

function DeleteItemLV(nID, nItem)
{
  SendMessage(aWnd[nID].HWND, 4104 /*LVM_DELETEITEM*/, nItem, 0);
}

function InsertColumnsLV(nID)
{
  var lpLVCOLUMN = AkelPad.MemAlloc(_X64 ? 56 : 44); //sizeof(LVCOLUMN)
  var aText      = [sTxtTemplateName, sTxtWhatFind, sTxtReplaceWith, sTxtConditions];
  var i;

  AkelPad.MemCopy(lpLVCOLUMN,                               0x4, DT_DWORD); //mask=LVCF_TEXT
  AkelPad.MemCopy(_PtrAdd(lpLVCOLUMN, _X64 ? 16 : 12), lpBuffer, DT_QWORD); //pszText

  for (i = 0; i < aText.length; ++i)
  {
    AkelPad.MemCopy(lpBuffer, aText[i], DT_UNICODE);
    SendMessage(aWnd[nID].HWND, 4193 /*LVM_INSERTCOLUMNW*/, i, lpLVCOLUMN);
  }

  SetColumnsWidthLV(nID);
  AkelPad.MemFree(lpLVCOLUMN);
}

function GetColumnsWidthLV(nID)
{
  var aCol = (nID === IDFRTLV) ? aFRTCol : aBRCol;
  var nColW;
  var i;

  for (i = 0; i < aCol.length; ++i)
  {
    if ((nColW = SendMessage(aWnd[nID].HWND, 4125 /*LVM_GETCOLUMNWIDTH*/, i, 0)) > 0)
    {
      aCol[i][0] = 1;
      aCol[i][1] = nColW;
    }
    else
      aCol[i][0] = 0;
  }
}

function SetColumnsWidthLV(nID)
{
  var aCol = (nID === IDFRTLV) ? aFRTCol : aBRCol;
  var i;

  for (i = 0; i < aCol.length; ++i)
    SendMessage(aWnd[nID].HWND, 4126 /*LVM_SETCOLUMNWIDTH*/, i, aCol[i][0] ? aCol[i][1] : 0);
}

function SetSortFRTLV()
{
  var lpHDITEM = AkelPad.MemAlloc(_X64 ? 72 : 48); //sizeof(HDITEM)
  var nFmt     = 0x4000 /*HDF_STRING*/ | (bFRTSort ? 0x0400 /*HDF_SORTUP*/ : 0);
  var hHeader  = SendMessage(aWnd[IDFRTLV].HWND, 4127 /*LVM_GETHEADER*/, 0, 0);

  AkelPad.MemCopy(lpBuffer, sTxtTemplateName, DT_UNICODE);
  AkelPad.MemCopy(lpHDITEM, 0x06, DT_DWORD); //mask=HDI_FORMAT|HDI_TEXT
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, 8),lpBuffer, DT_QWORD); //pszText
  AkelPad.MemCopy(_PtrAdd(lpHDITEM, _X64 ? 28 : 20), nFmt, DT_DWORD); //fmt

  SendMessage(hHeader, 4620 /*HDM_SETITEMW*/, 0, lpHDITEM);
  AkelPad.MemFree(lpHDITEM);

  if (bFRTSort)
    aWnd[IDFRTLV].S |= 0x10 /*LVS_SORTASCENDING*/;
  else
    aWnd[IDFRTLV].S &= ~0x10/*LVS_SORTASCENDING*/;

  oSys.Call("User32::SetWindowLongW", aWnd[IDFRTLV].HWND, -16 /*GWL_STYLE*/, aWnd[IDFRTLV].S);
}

function FillFRTLV()
{
  var aRecord = AkelPad.ReadFile(WScript.ScriptFullName.replace(/\.js$/i, "_templates.tsv"), 0x1D /*OD_ADT_BINARY_ERROR|OD_ADT_DETECT_CODEPAGE|OD_ADT_DETECT_BOM|OD_ADT_NOMESSAGES*/);
  var aField;
  var i, n;

  if (aRecord)
    aRecord = aRecord.split("\r\n");
  else
    aRecord = ["Empty lines\t^[ \\t]*$\\n*\t\t0010"];

  for (i = 0; i < aRecord.length; ++i)
  {
    aField = aRecord[i].split("\t");

    if (aField[0])
    {
      while (aField.length < 4)
        aField[aField.length] = "";

      if (aField[3].length === 4)
        aField[3] = aField[3].substr(0, 3) + "1" + aField[3].charAt(3);
      else if (aField[3].length > 4)
        aField[3] = aField[3].substr(0, 5);
      else
      {
        while (aField[3].length < 5)
          aField[3] += (aField[3].length == 3) ? "1" : "0";
      }

      aField[3] = aField[3].replace(/[^1]/g, "0");

      if ((aField[3].charAt(2) === "1") && (aField[3].charAt(4) === "1"))
        aField[3] = aField[3].substr(0, 4) + "0";

      InsertItemLV(IDFRTLV, aField, i);
    }
  }

  for (i = 0; i < aBR.length; ++i)
  {
    for (n = aBR[i].length - 1; n > -1; --n)
    {
      if (FindItemLV(IDFRTLV, aBR[i][n], -1) == -1)
      {
        aBR[i].splice(n, 1);
        aBRCB[i].splice(n, 1);
      }
    }
  }

  if (nFRTSel > GetItemCountLV(IDFRTLV) - 1)
    nFRTSel = GetItemCountLV(IDFRTLV) - 1;
  if (nFRTSel < 0)
    nFRTSel = 0;

  SetCurSelLV(IDFRTLV, nFRTSel);
}

function FillBRLV()
{
  var i, n;

  bCheckBRLV = 0;

  SendMessage(aWnd[IDBRLV].HWND, 4105 /*LVM_DELETEALLITEMS*/, 0, 0);

  if (aBR[nBR].length)
  {
    for (i = 0; i < aBR[nBR].length; ++i)
    {
      n = FindItemLV(IDFRTLV, aBR[nBR][i], -1);
      InsertItemLV(IDBRLV, [aBR[nBR][i], GetTextLV(IDFRTLV, n, 1), GetTextLV(IDFRTLV, n, 2), GetTextLV(IDFRTLV, n, 3)], i);
      SetCheckBRLV(i, aBRCB[nBR][i]);
    }

    SetCurSelLV(IDBRLV, FindItemLV(IDBRLV, GetTextLV(IDFRTLV, GetCurSelLV(IDFRTLV), 0), -1));
  }

  bCheckBRLV = 1;
}

function GetCheckBRLV(nItem)
{
  aBRCB[nBR][nItem] = (SendMessage(aWnd[IDBRLV].HWND, 4140 /*LVM_GETITEMSTATE*/, nItem, 0xF000 /*LVIS_STATEIMAGEMASK*/) >> 12) - 1;
}

function SetCheckBRLV(nItem, bCheck)
{
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 12), (bCheck + 1) << 12, DT_DWORD); //state
  AkelPad.MemCopy(_PtrAdd(lpLVITEM, 16), 0xF000 /*LVIS_STATEIMAGEMASK*/, DT_DWORD); //stateMask
  SendMessage(aWnd[IDBRLV].HWND, 4139 /*LVM_SETITEMSTATE*/, nItem, lpLVITEM);
}

function NewAddRenameFRT(nID)
{
  var nItem = GetCurSelLV(IDFRTLV);
  var aField;
  var sOldName;
  var i, n;

  if (nID === IDFRTADDB)
  {
    GetWhatWithFR();
    nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);
    aField = [
      (nItem > -1) ? GetTextLV(IDFRTLV, nItem, 0) : "",
      sWhatText.replace(/[\r\n\t]/g, ""),
      hWithE ? sWithText.replace(/[\r\n\t]/g, "") : "",
      ((nFRF & FRF_MATCHCASE) ? "1" : "0") +
      ((nFRF & FRF_WHOLEWORD) ? "1" : "0") +
      ((nFRF & FRF_REGEXP) ? "1" : "0") +
      ((nFRF & FRF_REGEXPNONEWLINEDOT) ? "0" : "1") +
      ((nFRF & FRF_ESCAPESEQ) ? "1" : "0")];
  }
  else
  {
    if (nItem > -1)
    {
      aField = [];
      for (i = 0; i < 4; ++i)
        aField[i] = GetTextLV(IDFRTLV, nItem, i);
    }
    else
      aField = ["", "", "", "00010"];

    sOldName = aField[0];
  }

  aField[0] = InputBox(aWnd[IDFRTLV].HWND, sTxtTemplates + " - " + aWnd[nID].T, sTxtTemplateName, aField[0], 0, CheckNameFRT, nID, 0, 0, 0, 0, 128 /*vEditLength*/);

  if (aField[0])
  {
    if (nID === IDFRTRENB)
    {
      DeleteItemLV(IDFRTLV, nItem)

      for (i = 0; i < aBR.length; ++i)
      {
        for (n = 0; n < aBR[i].length; ++n)
        {
          if (aBR[i][n].toUpperCase() == sOldName.toUpperCase())
            aBR[i][n] = aField[0];
        }
      }

      n = -1;
      while ((n = FindItemLV(IDBRLV, sOldName, n)) > -1)
        SetTextLV(IDBRLV, n, 0, aField[0]);
    }
    else
      ++nItem;

    SetCurSelLV(IDFRTLV, InsertItemLV(IDFRTLV, aField, nItem));
  }
}

function CheckNameFRT(hWnd, aField, nID)
{
  var nSelItem;
  var nFindItem;

  if (aField[0])
  {
    if (/[\r\n\t]/.test(aField[0]))
    {
      AkelPad.MessageBox(hWnd, sTxtNameInvalid, aWnd[nID].T, 0x30 /*MB_ICONWARNING*/);
      return 0;
    }
    else
    {
      nSelItem  = GetCurSelLV(IDFRTLV);
      nFindItem = FindItemLV(IDFRTLV, aField[0], -1);

      if (nFindItem > -1)
      {
        if ((nID !== IDFRTRENB) || (nFindItem !== nSelItem))
        {
          AkelPad.MessageBox(hWnd, '"' + aField[0] + '"\n\n' + sTxtNameExists, aWnd[nID].T, 0x30 /*MB_ICONWARNING*/);
          return 0;
        }
      }
    }
  }

  return -1;
}

function UpDownFRT(nID)
{
  var nItemCur = GetCurSelLV(IDFRTLV);
  var nItemNew = (nID === IDFRTUPB) ? nItemCur - 1 : nItemCur + 1;
  var aField   = [];
  var i;

  for (i = 0; i < aFRTCol.length; ++i)
    aField[i] = GetTextLV(IDFRTLV, nItemCur, i);
  for (i = 0; i < aFRTCol.length; ++i)
    SetTextLV(IDFRTLV, nItemCur, i, GetTextLV(IDFRTLV, nItemNew, i));
  for (i = 0; i < aFRTCol.length; ++i)
    SetTextLV(IDFRTLV, nItemNew, i, aField[i]);

  SetCurSelLV(IDFRTLV, nItemNew);
}

function RemoveFRT()
{
  var nItem = GetCurSelLV(IDFRTLV);
  var sName = GetTextLV(IDFRTLV, nItem, 0);
  var i, n;

  if (AkelPad.MessageBox(hWndFRT, '"' + sName + '"\n\n' + sTxtWantRemove, sTxtTemplates + ' - ' + sTxtRemove, 0x21 /*MB_ICONQUESTION|MB_OKCANCEL*/) === 1 /*IDOK*/)
  {
    DeleteItemLV(IDFRTLV, nItem);

    for (i = 0; i < aBR.length; ++i)
    {
      for (n = aBR[i].length - 1; n > -1; --n)
      {
        if (aBR[i][n].toUpperCase() === sName.toUpperCase())
        {
          aBR[i].splice(n, 1);
          aBRCB[i].splice(n, 1);
        }
      }
    }

    n = -1;
    while ((n = FindItemLV(IDBRLV, sName, n)) > -1)
      DeleteItemLV(IDBRLV, n--);

    if (nItem === GetItemCountLV(IDFRTLV))
      --nItem;

    SetCurSelLV(IDFRTLV, nItem);
    RefreshViewFRT();
  }
}

function CheckExpressionFRT(nItem, bMsgOK)
{
  var nEditID = IDWHATE;
  var nErrOffset;

  if (GetTextLV(IDFRTLV, nItem, 3).charAt(2) === "1")
    nErrOffset = CheckRegExp(GetTextLV(IDFRTLV, nItem, 1));
  else
  {
    nErrOffset = CheckEscSeq(GetTextLV(IDFRTLV, nItem, 1));

    if (! nErrOffset)
    {
      nErrOffset = CheckEscSeq(GetTextLV(IDFRTLV, nItem, 2));
      nEditID    = IDWITHE;
    }
  }

  if (nErrOffset)
  {
    SetCurSelLV(IDFRTLV, nItem);
    AkelPad.MessageBox(hWndFRT, sTxtExprError + ' "' + ((nEditID == IDWHATE) ? sTxtWhatFind : sTxtReplaceWith) + '" (' + nErrOffset + ').', sTxtTemplates, 0x10 /*MB_ICONERROR*/);
    SendMessage(aWnd[nEditID].HWND, 177 /*EM_SETSEL*/, nErrOffset - 1, -1);
    PostMessage(hWndFRT, 0x8001 /*WM_APP+1*/, 0, nEditID);
  }
  else if (bMsgOK)
  {
    AkelPad.MessageBox(hWndFRT, sTxtExprOK, sTxtTemplates, 0x40 /*MB_ICONINFORMATION*/);

    if (oSys.Call("User32::GetFocus") === aWnd[IDCHECKEXPB].HWND)
      PostMessage(hWndFRT, 0x8001 /*WM_APP+1*/, 0, IDFRTLV);
  }

  return nErrOffset;
}

function AddToBatch()
{
  var n     = GetCurSelLV(IDFRTLV);
  var sName = GetTextLV(IDFRTLV, n, 0);
  var nItem = InsertItemLV(IDBRLV, [sName, GetTextLV(IDFRTLV, n, 1), GetTextLV(IDFRTLV, n, 2), GetTextLV(IDFRTLV, n, 3)], GetItemCountLV(IDBRLV));

  aBR[nBR][nItem] = sName;
  SetCurSelLV(IDBRLV, nItem);
  SetCheckBRLV(nItem, 1);

  if (oSys.Call("User32::GetFocus") === aWnd[IDTOBATCH].HWND)
    PostMessage(hWndFRT, 0x8001 /*WM_APP+1*/, 0, IDFRTLV);
}

function SetFRTtoFR()
{
  var nItem  = GetCurSelLV(IDFRTLV);
  var sConds = GetTextLV(IDFRTLV, nItem, 3);

  nWhatSel1 = 0;
  nWhatSel2 = -1;
  SendMessage(hWhatE, 177 /*EM_SETSEL*/, nWhatSel1, nWhatSel2);
  SendMessage(hWhatE, 194 /*EM_REPLACESEL*/, 1, GetTextLV(IDFRTLV, nItem, 1));
  SendMessage(hWhatE, 177 /*EM_SETSEL*/, nWhatSel1, nWhatSel2);

  if (hWithE)
  {
    nWithSel1 = 0;
    nWithSel2 = -1;
    SendMessage(hWithE, 177 /*EM_SETSEL*/, nWithSel1, nWithSel2);
    SendMessage(hWithE, 194 /*EM_REPLACESEL*/, 1, GetTextLV(IDFRTLV, nItem, 2));
    SendMessage(hWithE, 177 /*EM_SETSEL*/, nWithSel1, nWithSel2);
  }

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0) & ~FRF_REGEXPNONEWLINEDOT;

  if (sConds.charAt(3) === "0")
    nFRF |= FRF_REGEXPNONEWLINEDOT;

  SendMessage(hMainWnd, 1219 /*AKD_SETMAININFO*/, 228 /*MIS_SEARCHOPTIONS*/, nFRF);

  SendDlgItemMessage(hDlg, IDC_SEARCH_MATCHCASE, 241 /*BM_SETCHECK*/, parseInt(sConds.charAt(0)), 0);
  SendMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_MATCHCASE, GetDlgItem(hDlg, IDC_SEARCH_MATCHCASE));

  SendDlgItemMessage(hDlg, IDC_SEARCH_WHOLEWORD, 241 /*BM_SETCHECK*/, parseInt(sConds.charAt(1)), 0);
  SendMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_WHOLEWORD, GetDlgItem(hDlg, IDC_SEARCH_WHOLEWORD));

  SendDlgItemMessage(hDlg, IDC_SEARCH_REGEXP, 241 /*BM_SETCHECK*/, parseInt(sConds.charAt(2)), 0);
  SendMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_REGEXP, GetDlgItem(hDlg, IDC_SEARCH_REGEXP));

  SendDlgItemMessage(hDlg, IDC_SEARCH_ESCAPESEQ, 241 /*BM_SETCHECK*/, parseInt(sConds.charAt(4)), 0);
  SendMessage(hDlg, 273 /*WM_COMMAND*/, IDC_SEARCH_ESCAPESEQ, GetDlgItem(hDlg, IDC_SEARCH_ESCAPESEQ));
}

function RenameBR()
{
  var sName = InputBox(aWnd[IDBRLV].HWND, sTxtBatches + " - " + sTxtRename, sTxtBatchNumber + (nBR + 1) + ":", aBRName[nBR], 0, 0, 0, 0, 0, 0, 0, 128 /*vEditLength*/);

  if (typeof sName === "string")
  {
    aBRName[nBR] = sName.replace(/[\r\n\t]/g, "");
    SetNameBR();
  }
}

function SetNameBR()
{
  oSys.Call("User32::SetWindowTextW", aWnd[IDBRNAMES].HWND, " " + (aBRName[nBR] ? aBRName[nBR] : sTxtBatchNumber + (nBR + 1)));
}

function UpDownBR(nID)
{
  var nItemCur  = GetCurSelLV(IDBRLV);
  var nItemNew  = (nID === IDBRUPB) ? nItemCur - 1 : nItemCur + 1;
  var bCheckCur = aBRCB[nBR][nItemCur];
  var bCheckNew = aBRCB[nBR][nItemNew];
  var i;

  aBR[nBR][nItemCur] = aBR[nBR][nItemNew];
  for (i = 0; i < aBRCol.length; ++i)
    SetTextLV(IDBRLV, nItemCur, i, GetTextLV(IDBRLV, nItemNew, i));

  nFRTSel = GetCurSelLV(IDFRTLV);
  aBR[nBR][nItemNew] = GetTextLV(IDFRTLV, nFRTSel, 0);
  for (i = 0; i < aBRCol.length; ++i)
    SetTextLV(IDBRLV, nItemNew, i, GetTextLV(IDFRTLV, nFRTSel, i));

  SetCheckBRLV(nItemCur, bCheckNew);
  SetCheckBRLV(nItemNew, bCheckCur);

  SetCurSelLV(IDBRLV, nItemNew);
}

function RemoveBR()
{
  var nItem = GetCurSelLV(IDBRLV);

  aBR[nBR].splice(nItem, 1);
  aBRCB[nBR].splice(nItem, 1);
  DeleteItemLV(IDBRLV, nItem);

  if (nItem === aBR[nBR].length)
    --nItem;

  SetCurSelLV(IDBRLV, nItem);
  EnableButtonsFRT();
}

function BatchReplaceAll()
{
  var nChanges = 0;
  var bCloseDlg;
  var bNoMsg;
  var sConds;
  var i;

  if ((nBatchNum >= 0) && (AkelPad.MessageBox(hWndFRT, sTxtBatchNumber + (nBR + 1) + ".\n" + aBRName[nBR] + "\n\n" + sTxtWantBatchRepl, sTxtBatchReplace, 0x21 /*MB_ICONQUESTION|MB_OKCANCEL*/) !== 1 /*IDOK*/))
  {
    if (oSys.Call("User32::GetFocus") == aWnd[IDBRALLB].HWND)
      PostMessage(hWndFRT, 0x8001 /*WM_APP+1*/, 0, IDBRLV);
    return;
  }

  for (i = 0; i < aBR[nBR].length; ++i)
  {
    if (aBRCB[nBR][i])
    {
      if (! GetTextLV(IDBRLV, i, 1))
      {
        SetCurSelLV(IDBRLV, i);
        AkelPad.MessageBox(hWndFRT, aBR[nBR][i] + "\n\n" + sTxtNoFindText, sTxtTemplates, 0x10 /*MB_ICONERROR*/);
        PostMessage(hWndFRT, 0x8001 /*WM_APP+1*/, 0, IDWHATE);
        return;
      }

      if (((GetTextLV(IDBRLV, i, 3).charAt(2) === "1") || (GetTextLV(IDBRLV, i, 3).charAt(4) === "1")) && CheckExpressionFRT(FindItemLV(IDFRTLV, aBR[nBR][i], -1), 0))
        return;
    }
  }

  nFRF = SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 228 /*MI_SEARCHOPTIONS*/, 0);
  bCloseDlg  = nFRF & FRF_REPLACEALLANDCLOSE;
  bNoMsg     = nFRF & FRF_REPLACEALLNOMSG;
  nFRF &= ~(FRF_REPLACEALLANDCLOSE | FRF_REPLACEALLNOMSG | FRF_CHECKINSELIFSEL | FRF_CYCLESEARCH | FRF_CYCLESEARCHPROMPT);

  for (i = 0; i < aBR[nBR].length; ++i)
  {
    if (aBRCB[nBR][i])
    {
      SetCurSelLV(IDBRLV, i);
      oSys.Call("User32::UpdateWindow", hWndFRT);

      sConds = GetTextLV(IDBRLV, i, 3);
      nFRF &= ~(FRF_MATCHCASE | FRF_WHOLEWORD | FRF_REGEXP | FRF_REGEXPNONEWLINEDOT | FRF_ESCAPESEQ);

      if (sConds.charAt(0) === "1")
        nFRF |= FRF_MATCHCASE;

      if (sConds.charAt(1) === "1")
        nFRF |= FRF_WHOLEWORD;

      if (sConds.charAt(2) === "1")
      {
        nFRF |= FRF_REGEXP;
        if (sConds.charAt(3) === "0")
          nFRF |= FRF_REGEXPNONEWLINEDOT;
      }
      else if (sConds.charAt(4) === "1")
        nFRF |= FRF_ESCAPESEQ;

      nChanges += AkelPad.TextReplace(0, GetTextLV(IDBRLV, i, 1), GetTextLV(IDBRLV, i, 2), nFRF, 1);
    }
  }

  if (! bNoMsg)
    AkelPad.MessageBox(hWndFRT, sTxtCountChanges + nChanges, sTxtBatchReplace, 0x40 /*MB_ICONINFORMATION*/);

  if (bCloseDlg)
  {
    PostMessage(hWndFRT, 16 /*WM_CLOSE*/, 0, 0);

    if (hDlg)
      PostMessage(hDlg, 16 /*WM_CLOSE*/, 0, 0);
  }
  else if (oSys.Call("User32::GetFocus") == aWnd[IDBRALLB].HWND)
    PostMessage(hWndFRT, 0x8001 /*WM_APP+1*/, 0, IDBRLV);
}

function FindAllMenu(hWnd, nID)
{
  var nFocusID = GetDlgCtrlID(oSys.Call("User32::GetFocus"));
  var hButton  = GetDlgItem(hDlg, nID);
  var hMenu    = oSys.Call("User32::CreatePopupMenu");
  var nX, nY;
  var nCmd;

  if (nID !== nFocusID)
  {
    if ((nFocusID === IDCANCEL) || (nFocusID >= IDC_SEARCH_FIND_BUTTON) && (nFocusID <= IDC_SEARCH_ALL_BUTTON) || (nFocusID === IDMOREB) || (nFocusID >= IDCOUNTB) && (nFocusID <= IDFRTB))
      SendDlgItemMessage(hDlg, nFocusID, 244 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 1);

    SendDlgItemMessage(hDlg, nDefButID, 244 /*BM_SETSTYLE*/, 0 /*BS_PUSHBUTTON*/, 1);
    SendDlgItemMessage(hDlg, nID, 244 /*BM_SETSTYLE*/, 1 /*BS_DEFPUSHBUTTON*/, 1);
    oSys.Call("User32::SetFocus", hButton);
  }

  oSys.Call("User32::GetWindowRect", hButton, lpBuffer);
  nX = AkelPad.MemRead(_PtrAdd(lpBuffer,  8), DT_DWORD);
  nY = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD);

  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 1, sTxtShowInLog + " - " + sTxtOnlyMatched);
  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 2, sTxtShowInLog + " - " + sTxtEntireLines);
  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 3, sTxtCopyToCB);

  if (AkelPad.IsMDI())
    oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 4, sTxtOpenInTab);

  oSys.Call("User32::AppendMenuW", hMenu, 0x0800 /*MF_SEPARATOR*/, 0);
  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 5, sTxtBookmarkLines);
  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 6, sTxtUnmarkLines);


  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x188 /*TPM_NONOTIFY|TPM_RETURNCMD|TPM_RIGHTALIGN*/, nX, nY, 0, hWnd, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd)
    FindAll(hButton, nID, nCmd);
}

function HeaderLVMenu(hWnd, nX, nY)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_SEPARATOR = 0x0800;
  var nID;
  var aCol;
  var hMenu;
  var nCmd;
  var nCount;
  var sName;
  var aField;
  var i;

  if (nX < 0)
  {
    //LVN_COLUMNCLICK
    oSys.Call("User32::GetCursorPos", lpBuffer);
    nX = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    nY = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);
  }
  else
  {
    //WM_CONTEXTMENU
    oSys.Call("User32::GetWindowRect", SendMessage(hWnd, 4127 /*LVM_GETHEADER*/, 0, 0), lpBuffer);
    if ((nX < AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD)) || (nX > AkelPad.MemRead(_PtrAdd(lpBuffer, 8), DT_DWORD)) || (nY < AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD)) || (nY > AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD)))
      return;
  }

  oSys.Call("User32::SetFocus", hWnd);

  nID  = GetDlgCtrlID(hWnd);
  aCol = (nID === IDFRTLV) ? aFRTCol : aBRCol;
  GetColumnsWidthLV(nID);

  hMenu = oSys.Call("User32::CreatePopupMenu");
  oSys.Call("User32::AppendMenuW", hMenu, aCol[0][0] ? MF_CHECKED|MF_GRAYED : MF_STRING, 1, sTxtTemplateName);
  oSys.Call("User32::AppendMenuW", hMenu, aCol[1][0] ? MF_CHECKED : MF_STRING, 2, sTxtWhatFind);
  oSys.Call("User32::AppendMenuW", hMenu, aCol[2][0] ? MF_CHECKED : MF_STRING, 3, sTxtReplaceWith);
  oSys.Call("User32::AppendMenuW", hMenu, aCol[3][0] ? MF_CHECKED : MF_STRING, 4, sTxtConditions);
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0);
  oSys.Call("User32::AppendMenuW", hMenu, (aCol[0][0] && aCol[1][0] && aCol[2][0] && aCol[3][0]) ? MF_GRAYED : MF_STRING, 5, sTxtAllColumns);
  oSys.Call("User32::AppendMenuW", hMenu, ((! aCol[0][0]) || aCol[1][0] || aCol[2][0] || aCol[3][0]) ? MF_STRING : MF_GRAYED, 6, sTxtNameOnly);

  if (nID == IDFRTLV)
  {
    oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0);
    oSys.Call("User32::AppendMenuW", hMenu, bFRTSort ? MF_CHECKED : MF_STRING, 7, sTxtSortByName);
  }

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, hWnd, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if ((nCmd >= 1) && (nCmd <= 6))
  {
    if (nCmd === 5)
    {
      for (i = 0; i < aCol.length; ++i)
        aCol[i][0] = 1;
    }
    else if (nCmd === 6)
    {
      aCol[0][0] = 1;
      for (i = 1; i < aCol.length; ++i)
        aCol[i][0] = 0;
    }
    else
      aCol[nCmd - 1][0] = aCol[nCmd - 1][0] ? 0 : 1;

    SetColumnsWidthLV(nID);
  }
  else if (nCmd === 7)
  {
    bFRTSort = ! bFRTSort;
    SetSortFRTLV();

    if (bFRTSort && (nCount = GetItemCountLV(IDFRTLV)))
    {
      sName  = GetTextLV(IDFRTLV, GetCurSelLV(IDFRTLV), 0);
      aField = [];

      for (i = 0; i < nCount; ++i)
        aField[i] = [GetTextLV(IDFRTLV, i, 0), GetTextLV(IDFRTLV, i, 1), GetTextLV(IDFRTLV, i, 2), GetTextLV(IDFRTLV, i, 3)];

      SendMessage(aWnd[IDFRTLV].HWND, 4105 /*LVM_DELETEALLITEMS*/, 0, 0);

      for (i = 0; i < nCount; ++i)
        InsertItemLV(IDFRTLV, aField[i], 0);

      SetCurSelLV(IDFRTLV, FindItemLV(IDFRTLV, sName, -1));
    }

    EnableButtonsFRT();
  }
}

function TabMenu()
{
  var MF_STRING          = 0x0000;
  var MF_CHECKED         = 0x0008;
  var MF_USECHECKBITMAPS = 0x0200;
  var MF_SEPARATOR       = 0x0800;
  var hMenu = oSys.Call("User32::CreatePopupMenu");
  var nX, nY, nX1, nX2;
  var nCmd;
  var i;

  oSys.Call("User32::SetFocus", aWnd[IDBRLV].HWND);
  oSys.Call("User32::GetCursorPos", lpBuffer);
  nX = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
  nY = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD);

  for (i = 0; i < aBR.length; ++i)
  {
    SendMessage(aWnd[IDBRTC].HWND, 4874 /*TCM_GETITEMRECT*/, i, lpBuffer);
    oSys.Call("User32::ClientToScreen", aWnd[IDBRTC].HWND, lpBuffer);
    oSys.Call("User32::ClientToScreen", aWnd[IDBRTC].HWND, _PtrAdd(lpBuffer, 8));
    nX1 = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    nX2 = AkelPad.MemRead(_PtrAdd(lpBuffer, 8), DT_DWORD);

    if ((nX >= nX1) && (nX < nX2))
    {
      SendMessage(aWnd[IDBRTC].HWND, 4912 /*TCM_SETCURFOCUS*/, i, 0);
      break;
    }
  }

  for (i = 0; i < aBR.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu, (nBR === i) ? MF_USECHECKBITMAPS | MF_CHECKED : MF_STRING, i + 1, (i + 1) + " - " + (aBRName[i] ? aBRName[i] : sTxtBatchNumber + (i + 1)));

  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, MF_STRING, aBR.length + 1, sTxtRename + "\tF2");

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, aWnd[IDBRTC].HWND, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd > 0)
  {
    if (--nCmd < aBR.length)
      SendMessage(aWnd[IDBRTC].HWND, 4912 /*TCM_SETCURFOCUS*/, nCmd, 0);
    else
      RenameBR();
  }
}

function EditMenu(hWnd, nX, nY)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_CHECKED   = 0x0008;
  var MF_SEPARATOR = 0x0800;
  var hMenu    = oSys.Call("User32::CreatePopupMenu");
  var nCmd;

  oSys.Call("User32::SetFocus", hWnd);
  nFRTSel = GetCurSelLV(IDFRTLV);

  if (nX === 0xFFFF) //menu from keyboard
  {
    oSys.Call("User32::GetCaretPos", lpBuffer);
    oSys.Call("User32::ClientToScreen", hWnd, lpBuffer);
    nX = AkelPad.MemRead(_PtrAdd(lpBuffer, 0), DT_DWORD);
    nY = AkelPad.MemRead(_PtrAdd(lpBuffer, 4), DT_DWORD) + SendMessage(hWnd, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
  }

  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd,  198 /*EM_CANUNDO*/, 0, 0) ? MF_STRING : MF_GRAYED, 1, sMnuUndo + "\tCtrl+Z");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 1109 /*EM_CANREDO*/, 0, 0) ? MF_STRING : MF_GRAYED, 2, sMnuRedo + "\tCtrl+Shift+Z");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0)  ? MF_STRING : MF_GRAYED, 3, sMnuCut + "\tCtrl+X");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0)  ? MF_STRING : MF_GRAYED, 4, sMnuCopy + "\tCtrl+C");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 1074 /*EM_CANPASTE*/, 0, 0) ? MF_STRING : MF_GRAYED, 5, sMnuPaste + "\tCtrl+V");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0)  ? MF_STRING : MF_GRAYED, 6, sMnuDelete + "\tDel");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, oSys.Call("User32::GetWindowTextLengthW", hWnd) ? MF_STRING : MF_GRAYED, 7, sMnuSelectAll + "\tCtrl+A");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, bAEFont ? MF_CHECKED : MF_STRING, 8, sMnuAPFont + "\tCtrl+F");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, (nFRTSel < GetItemCountLV(IDFRTLV) - 1) ? MF_STRING : MF_GRAYED,  9, sMnuNextTempl + "\tF3");
  oSys.Call("User32::AppendMenuW", hMenu, (nFRTSel > 0)                           ? MF_STRING : MF_GRAYED, 10, sMnuPrevTempl + "\tShift+F3");

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, hWnd, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd === 1)
    SendMessage(hWnd, 199 /*EM_UNDO*/, 0, 0);
  else if (nCmd === 2)
    SendMessage(hWnd, 1108 /*EM_REDO*/, 0, 0);
  else if (nCmd === 3)
    SendMessage(hWnd, 768 /*WM_CUT*/, 0, 0);
  else if (nCmd === 4)
    SendMessage(hWnd, 769 /*WM_COPY*/, 0, 0);
  else if (nCmd === 5)
    SendMessage(hWnd, 770 /*WM_PASTE*/, 0, 0);
  else if (nCmd === 6)
    SendMessage(hWnd, 771 /*WM_CLEAR*/, 0, 0);
  else if (nCmd === 7)
    SendMessage(hWnd, 177 /*EM_SETSEL*/, 0, -1);
  else if (nCmd === 8)
  {
    bAEFont = ! bAEFont;
    SetEditFontFRT();
  }
  else if (nCmd === 9)
    SetCurSelLV(IDFRTLV, nFRTSel + 1);
  else if (nCmd === 10)
    SetCurSelLV(IDFRTLV, nFRTSel - 1);
}

function HelpMenu(hWnd, nID, bRegExp)
{
  var sHelpFile = GetAkelHelpFile();
  var hMenu     = oSys.Call("User32::CreatePopupMenu");
  var nString   = 0x0000; //MF_STRING
  var nGrayed   = 0x0001; //MF_GRAYED
  var nBreak    = 0x0060; //MF_MENUBREAK|MF_MENUBARBREAK
  var nSepar    = 0x0800; //MF_SEPARATOR
  var hFromPos;
  var hEdit;
  var aMenu;
  var nX;
  var nY;
  var nCmd;
  var i;

  if (nID === IDHELP1L)
  {
    if (hWnd)
    {
      hFromPos = GetDlgItem(hDlg, IDC_SEARCH_FIND);
      hEdit    = hWhatE;
    }
    else
    {
      hFromPos = aWnd[IDWHATE].HWND;
      hEdit    = aWnd[IDWHATE].HWND;
    }

    if (bRegExp)
      aMenu = [
        [nString, ".",         sHlpAnyChar],
        [nString, "\\(",       sHlpSpecChars],
        [nString, "\\f",       sHlpFF + " \\x0C"],
        [nString, "\\n",       sHlpAnyNL],
        [nString, "\\r",       sHlpAnyNL],
        [nString, "\\t",       sHlpTab + " \\x09"],
        [nString, "\\v",       sHlpVTab + " \\x0B"],
        [nString, "\\d",       sHlpDigit + " [0-9]"],
        [nString, "\\D",       sHlpNonDigit + " [^0-9]"],
        [nString, "\\s",       sHlpWhiteSp + " [ \\f\\n\\t\\v]"],
        [nString, "\\S",       sHlpNonWhiteSp],
        [nString, "\\w",       sHlpWordChar],
        [nString, "\\W",       sHlpNonWordChar],
        [nString, "\\x{F}",    sHlpCharHex],
        [nString, "\\xFF",     sHlpCharHex2],
        [nString, "\\uFFFF",   sHlpCharHex4],
        [nSepar],
        [nString, "ab|xy",     sHlpAlternative],
        [nString, "[abc]",     sHlpCharSet],
        [nString, "[^abc]",    sHlpNegCharSet],
        [nString, "[a-z]",     sHlpRange],
        [nString, "[^a-z]",    sHlpNegRange],
        [nSepar],
        [nString, "^",         sHlpBeginLine],
        [nString, "$",         sHlpEndLine],
        [nString, "\\A",       sHlpBeginText],
        [nString, "\\Z",       sHlpEndText],
        [nString, "\\a",       sHlpBeginRange],
        [nString, "\\z",       sHlpEndRange],
        [nString, "\\b",       sHlpWordBoun],
        [nString, "\\B",       sHlpNonWordBoun],
        [nString, "\\K",       sHlpExcludePrev],
  
        [nBreak,  "?",         sHlpZeroOrOne],
        [nString, "*",         sHlpZeroOrMore],
        [nString, "+",         sHlpOneOrMore],
        [nString, "{3}",       sHlpExactly],
        [nString, "{3,}",      sHlpAtLeast],
        [nString, "{3,7}",     sHlpFromTo],
        [nGrayed, "\xA0",      sHlpGreedy],
        [nString, "?",         sHlpLazy],
        [nString, "+",         sHlpPossesive],
        [nSepar],
        [nString, "(ab)",      sHlpCapture1],
        [nString, "(?^ab)",    sHlpCapture2],
        [nString, "(?:ab)",    sHlpNotCapture],
        [nString, "(?>bc|b)",  sHlpAtomicGrouping],
        [nString, "(?<=ab)",   sHlpPreceded],
        [nString, "(?<!ab)",   sHlpNotPreceded],
        [nString, "(?=ab)",    sHlpFollowed],
        [nString, "(?!ab)",    sHlpNotFollowed],
        [nString, "(?(1)x|y)", sHlpCondition],
        [nString, "\\9",       sHlpBackrefer9],
        [nString, "\\99",      sHlpBackrefer99],
        [nSepar],
        [nString, "(?i)",      sHlpIgnoreCase],
        [nString, "(?m)",      sHlpMultiline],
        [nString, "(?s)",      sHlpDotDefault],
        [nString, "(?U)",      sHlpInvertGreed],
        [nString, "(?-i)",     sHlpMatchCase],
        [nString, "(?-m)",     sHlpMultilineOff],
        [nString, "(?-s)",     sHlpDotDefaultOff],
        [nString, "(?-U)",     sHlpInvertGreedOff]];
  }
  else
  {
    if (hWnd)
    {
      hFromPos = GetDlgItem(hDlg, IDC_SEARCH_REPLACE);
      hEdit    = hWithE;
    }
    else
    {
      hFromPos = aWnd[IDWITHE].HWND;
      hEdit    = aWnd[IDWITHE].HWND;
    }

    if (bRegExp)
      aMenu = [
        [nString, "\\\\",    sHlpBackslash],
        [nString, "\\f",     sHlpFF + " \\x0C"],
        [nString, "\\n",     sHlpNL],
        [nString, "\\r",     sHlpNL],
        [nString, "\\t",     sHlpTab + " \\x09"],
        [nString, "\\v",     sHlpVTab + " \\x0B"],
        [nString, "\\x{F}",  sHlpCharHex],
        [nString, "\\xFF",   sHlpCharHex2],
        [nString, "\\uFFFF", sHlpCharHex4],
        [nSepar],
        [nString, "\\0",     sHlpEntireStr],
        [nString, "\\9",     sHlpSubmatch9],
        [nString, "\\99",    sHlpSubmatch99]];
  }

  if (bRegExp)
  {
    if (sHelpFile)
    {
      aMenu.push([nSepar]);
      aMenu.push([nString, "\xA0", sHelpFile]);
    }
  }
  else
    aMenu = [
      [nString, "\\\\",     sHlpBackslash],
      [nString, "\\0",      sHlpNull],
      [nString, "\\n",      sHlpNL],
      [nString, "\\t",      sHlpTab],
      [nString, "\\[FFFF]", sHlpCharHex4]];

  oSys.Call("User32::GetWindowRect", hFromPos, lpBuffer);
  nX = AkelPad.MemRead(_PtrAdd(lpBuffer,  0), DT_DWORD);
  nY = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD);

  if (hWnd)
    oSys.Call("User32::SetFocus", GetDlgItem(hDlg, nID));
  else
  {
    hWnd = hWndFRT;
    oSys.Call("User32::SetFocus", hEdit);
  }

  for (i = 0; i < aMenu.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu, aMenu[i][0], i + 1, aMenu[i][1] + "\t" + aMenu[i][2]);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_RETURNCMD|TPM_NONOTIFY*/, nX, nY, 0, hWnd, 0);

  oSys.Call("User32::DestroyMenu", hMenu);
  oSys.Call("User32::SetFocus", hEdit);

  if (nCmd--)
  {
    if (aMenu[nCmd][1] !== "\xA0")
      SendMessage(hEdit, 194 /*EM_REPLACESEL*/, 1, aMenu[nCmd][1]);
    else if (aMenu[nCmd][2] === sHelpFile)
      AkelHelp(sHelpFile);
  }
}

function SaveFRT()
{
  var nItems = GetItemCountLV(IDFRTLV);
  var sText  = "";
  var i;

  for (i = 0; i < nItems; ++i)
    sText += GetTextLV(IDFRTLV, i, 0) + "\t" + GetTextLV(IDFRTLV, i, 1) + "\t" + GetTextLV(IDFRTLV, i, 2) + "\t" + GetTextLV(IDFRTLV, i, 3) + "\r\n";

  AkelPad.WriteFile(WScript.ScriptFullName.replace(/\.js$/i, "_templates.tsv"), sText, sText.length, 1200 /*UTF-16LE*/, true);

  oSys.Call("User32::GetWindowRect", hWndFRT, lpBuffer);

  if (hDlg)
  {
    oSys.Call("User32::GetWindowRect", GetDlgItem(hDlg, IDC_SEARCH_MATCHCASE), _PtrAdd(lpBuffer, 16));
    nFRTX = AkelPad.MemRead(_PtrAdd(lpBuffer,  0), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 16), DT_DWORD);
    nFRTY = AkelPad.MemRead(_PtrAdd(lpBuffer,  4), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer, 20), DT_DWORD);
  }
  else
  {
    nBRX = AkelPad.MemRead(_PtrAdd(lpBuffer,  0), DT_DWORD);
    nBRY = AkelPad.MemRead(_PtrAdd(lpBuffer,  4), DT_DWORD);
  }

  nFRTW   = AkelPad.MemRead(_PtrAdd(lpBuffer,  8), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer,  0), DT_DWORD);
  nFRTH   = AkelPad.MemRead(_PtrAdd(lpBuffer, 12), DT_DWORD) - AkelPad.MemRead(_PtrAdd(lpBuffer,  4), DT_DWORD);
  nFRTSel = GetCurSelLV(IDFRTLV);

  GetColumnsWidthLV(IDFRTLV);
  GetColumnsWidthLV(IDBRLV);
}

function CheckRegExp(sPat)
{
  //based on Instructor's code CheckPat.js: http://akelpad.sourceforge.net/forum/viewtopic.php?p=25621#25621
  var lpPat     = AkelPad.MemAlloc((sPat.length + 1) * 2 /*sizeof(wchar_t)*/);
  var lpPatExec = AkelPad.MemAlloc(_X64? 216 : 108 /*sizeof(PATEXEC)*/);
  var lpStr     = AkelPad.MemAlloc(2 /*sizeof(wchar_t)*/);
  var nErrOffset;

  AkelPad.MemCopy(lpPat, sPat, DT_UNICODE);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ?  24 : 12) /*PATEXEC.wpText*/,      lpStr, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ?  32 : 16) /*PATEXEC.wpMaxText*/,   lpStr, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ?  40 : 20) /*PATEXEC.wpRange*/,     lpStr, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ?  48 : 24) /*PATEXEC.wwpMaxRange*/, lpStr, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 112 : 56) /*PATEXEC.wpPat*/,       lpPat, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 120 : 60) /*PATEXEC.wpMaxPat*/,    _PtrAdd(lpPat, sPat.length * 2 /*sizeof(wchar_t)*/), DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 128 : 64) /*PATEXEC.wpStr*/,       lpStr, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpPatExec, _X64 ? 136 : 68) /*PATEXEC.wpMaxStr*/,    lpStr, DT_QWORD);

  SendMessage(hMainWnd, 1415 /*AKD_PATEXEC*/, 0, lpPatExec);
  nErrOffset = AkelPad.MemRead(_PtrAdd(lpPatExec, _X64 ? 192 : 96) /*PATEXEC.nErrorOffset*/, DT_QWORD);

  AkelPad.MemFree(lpPat);
  AkelPad.MemFree(lpPatExec);
  AkelPad.MemFree(lpStr);

  return nErrOffset;
}

function CheckEscSeq(sPat)
{
  var nErrOffset = 0;
  var i, n;

  for (i = 0; i < sPat.length; ++i)
  {
    if (sPat.charAt(i) === "\\")
    {
      if (sPat.charAt(++i) === "[")
      {
        while (sPat.charAt(++i) === " ");

        for (n = 0; n < 4; (++n < 4) && ++i)
        {
          if (! ((sPat.charCodeAt(i) >= 48) && (sPat.charCodeAt(i) <= 57) || (sPat.charCodeAt(i) >= 65) && (sPat.charCodeAt(i) <= 70) || (sPat.charCodeAt(i) >= 97) && (sPat.charCodeAt(i) <= 102)))
          {
            nErrOffset = i + 1;
            break;
          }
        }

        if (nErrOffset)
          break;

        while (sPat.charAt(++i) === " ");

        if (sPat.charAt(i) !== "]")
        {
          nErrOffset = i + 1;
          break;
        }
      }
      else if ((sPat.charAt(i) !== "\\") && (sPat.charAt(i) !== "0") && (sPat.charAt(i) !== "n") && (sPat.charAt(i) !== "t"))
      {
        nErrOffset = i + 1;
        break;
      }
    }
  }

  return nErrOffset;
}

function EscSeqToRegExp(sText)
{
  return sText.replace(/\\([^\[])|\\\[(\d{4})\]|([\/.^$+*?|()\[\]{}])/g,
    function(sArg0, sArg1, sArg2, sArg3)
    {
      if (sArg3)
        return "\\" + sArg3;
      else if (sArg2)
        return "\\u" + sArg2;
      else if (sArg1 === "0")
        return "\\x00";
      else
        return "\\" + sArg1;
    });
}

function ReadIni()
{
  var sLangTxt = AkelPad.ReadFile(WScript.ScriptFullName.replace(/\.js$/i, "_" + AkelPad.GetLangId() + ".lng"), 0x1D /*OD_ADT_BINARY_ERROR|OD_ADT_DETECT_CODEPAGE|OD_ADT_DETECT_BOM|OD_ADT_NOMESSAGES*/);
  var i, n;

  if (sLangTxt)
  {
    try
    {
      eval(sLangTxt);
    }
    catch (oError)
    {
      sLangTxt = "";
    }
  }

  if (! sLangTxt)
  {
    sTxtMore          = '&More';
    sTxtCount         = 'C&ount';
    sTxtFindAll       = 'Find al&l';
    sTxtShowInLog     = 'Show in Log panel';
    sTxtOnlyMatched   = 'only matched';
    sTxtEntireLines   = 'entire lines';
    sTxtCopyToCB      = 'Copy to clipboard';
    sTxtOpenInTab     = "Open in new tab";
    sTxtBookmarkLines = 'Bookmark lines';
    sTxtUnmarkLines   = 'Unmark lines';
    sTxtTemplates     = 'Templates';
    sTxtBatches       = 'Batches';
    sTxtTransparentNA = 'Transparency - only when inactive';
    sTxtWait          = 'Wait...';
    sTxtStop          = 'Stop';
    sTxtNoName        = 'no name';
    sTxtTotalFound    = 'Total found: ';
    sTxtReplAllCD     = '"Replace all" closes dialo&g';
    sTxtReplAllWM     = '"Replace all" withou&t message';
    sTxtCheckInSel    = 'Check "in selection" if selection &not empty';
    sTxtCycleSearch   = 'C&ycle search';
    sTxtPrompt        = '&Prompt';
    sTxtWhatFind      = 'What find';
    sTxtReplaceWith   = 'Replace with';
    sTxtMatchCase     = 'Match &case';
    sTxtWholeWord     = '&Whole word';
    sTxtRegExp        = 'Regular e&xpressions';
    sTxtDotMatchesNL  = '&. matches \\n';
    sTxtEscSeq        = '&Esc sequences';
    sTxtDirection     = 'Direction';
    sTxtDirDown       = '&Down';
    sTxtDirUp         = '&Up';
    sTxtDirBeginning  = '&Beginning';
    sTxtDirInSel      = '&In selection';
    sTxtDirAllFiles   = 'All file&s';
    sTxtNew           = 'New';
    sTxtAdd           = 'Add';
    sTxtRename        = 'Rename';
    sTxtMoveUp        = 'Move up';
    sTxtMoveDown      = 'Move down';
    sTxtRemove        = 'Remove';
    sTxtCheckExpr     = 'Check expression';
    sTxtAddToBatch    = 'Add to batch';
    sTxtOK            = 'OK';
    sTxtClose         = 'Close';
    sTxtBatchReplace  = 'Batch replace';
    sTxtBatchReplAll  = 'Batch replace &all';
    sTxtEnableAll     = 'Enable&/disable all';
    sTxtClosesDialog  = 'Closes dialo&g';
    sTxtWithoutMsg    = 'Withou&t message';
    sTxtTemplateName  = 'Template name';
    sTxtConditions    = 'Conditions';
    sTxtAllColumns    = 'All columns';
    sTxtNameOnly      = 'Name only';
    sTxtSortByName    = 'Sort by name';
    sTxtNameInvalid   = 'Invalid name.';
    sTxtNameExists    = 'This name already exists.';
    sTxtWantRemove    = 'Do you want to remove this template?';
    sTxtBatchNumber   = 'Batch #';
    sTxtWantBatchRepl = 'Do you want to batch replace all?';
    sTxtNoFindText    = 'No text in field "What find".';
    sTxtExprOK        = 'Expression is OK.';
    sTxtExprError     = 'Error in expression';
    sTxtCountChanges  = 'Count of changes: ';
    //context menu edit
    sMnuUndo      = '&Undo';
    sMnuRedo      = '&Redo';
    sMnuCut       = 'C&ut';
    sMnuCopy      = '&Copy';
    sMnuPaste     = '&Paste';
    sMnuDelete    = '&Delete';
    sMnuSelectAll = 'Select &all';
    sMnuAPFont    = 'AkelPad font';
    sMnuNextTempl = 'Next template';
    sMnuPrevTempl = 'Previous template';
    //RegExp help
    sHlpAnyChar        = 'any character (dot)';
    sHlpSpecChars      = '()[]{}^$.?+*|\\ special chars';
    sHlpBackslash      = 'backslash';
    sHlpNull           = 'null character';
    sHlpFF             = 'form feed';
    sHlpNL             = 'new line';
    sHlpAnyNL          = 'any new line';
    sHlpTab            = 'tab';
    sHlpVTab           = 'vertical tab';
    sHlpDigit          = 'digit';
    sHlpNonDigit       = 'non-digit';
    sHlpWhiteSp        = 'whitespace';
    sHlpNonWhiteSp     = 'non-whitespace';
    sHlpWordChar       = 'word character (non-delimiter)';
    sHlpNonWordChar    = 'non-word character (delimiter)';
    sHlpCharHex        = 'char - hex code, range 0-10FFFF';
    sHlpCharHex2       = 'char - 2-digit hex code';
    sHlpCharHex4       = 'char - 4-digit hex code';
    sHlpAlternative    = 'alternative ab or xy';
    sHlpCharSet        = 'character set, any specified';
    sHlpNegCharSet     = 'negative character set';
    sHlpRange          = 'range of chars from a to z';
    sHlpNegRange       = 'negative range of chars';
    sHlpBeginLine      = 'beginning of line';
    sHlpEndLine        = 'end of line';
    sHlpBeginText      = 'beginning of text';
    sHlpEndText        = 'end of text';
    sHlpBeginRange     = 'beginning of search range';
    sHlpEndRange       = 'end of search range';
    sHlpWordBoun       = 'word boundary';
    sHlpNonWordBoun    = 'non-word boundary';
    sHlpExcludePrev    = 'excludes previous chars from result';
    sHlpZeroOrOne      = 'zero or one time';
    sHlpZeroOrMore     = 'zero or more times';
    sHlpOneOrMore      = 'one or more times';
    sHlpExactly        = 'exactly 3 times';
    sHlpAtLeast        = 'at least 3 times';
    sHlpFromTo         = 'from 3 to 7 times';
    sHlpEntireStr      = 'entire string matched';
    sHlpSubmatch9      = '9th captured submatch, range 1-9';
    sHlpSubmatch99     = '99th captured submatch, range 01-99';
    sHlpGreedy         = '- above quantifiers are greedy';
    sHlpLazy           = 'add at end for lazy quantifier';
    sHlpPossesive      = 'add at end for possesive quantifier';
    sHlpCapture1       = 'matches ab, captures';
    sHlpCapture2       = 'matches negative ab, captures';
    sHlpNotCapture     = 'matches ab, not captures';
    sHlpAtomicGrouping = 'atomic grouping, not captures';
    sHlpPreceded       = 'preceded by ab';
    sHlpNotPreceded    = 'not preceded by ab';
    sHlpFollowed       = 'followed by ab';
    sHlpNotFollowed    = 'not followed by ab';
    sHlpCondition      = 'if (1) then x, else y';
    sHlpBackrefer9     = 'backreference, range 1-9';
    sHlpBackrefer99    = 'backreference, range 01-99';
    sHlpIgnoreCase     = 'case insensitive';
    sHlpMultiline      = 'multiline search (default)';
    sHlpDotDefault     = 'dot matches any char (default)';
    sHlpInvertGreed    = 'invert greediness';
    sHlpMatchCase      = 'match case';
    sHlpMultilineOff   = 'turn off multiline search';
    sHlpDotDefaultOff  = 'dot matches any char, except \\n';
    sHlpInvertGreedOff = 'turn off greediness inversion';
  }

  try
  {
    eval(ReadIni.Text = AkelPad.ReadFile(WScript.ScriptFullName.replace(/\.js$/i, ".ini"), 0x1D /*OD_ADT_BINARY_ERROR|OD_ADT_DETECT_CODEPAGE|OD_ADT_DETECT_BOM|OD_ADT_NOMESSAGES*/));
  }
  catch (oError)
  {}

  if (nOpacity > 255) nOpacity = 255;
  else if (nOpacity < 15) nOpacity = 15;

  nFRTW = Math.max(Scale.X(nFRTW), nFRTMinW);
  nFRTH = Math.max(Scale.Y(nFRTH), nFRTMinH);

  if (! aBR)
  {
    nBR = 0;
    aBR = [[], [], [], [], [], [], [], [], []];
  }

  if (! aBRCB)
  {
    aBRCB = [[], [], [], [], [], [], [], [], []];
    for (i = 0; i < aBR.length; ++i)
    {
      for (n = 0; n < aBR[i].length; ++n)
        aBRCB[i][n] = 1;
    }
  }

  if ((nBR < 0) || (nBR >= aBR.length))
    nBR = 0;

  if (! aBRName)
    aBRName = ["", "", "", "", "", "", "", "", ""];

  if (! aFRTCol)
    aFRTCol = [[1, 120], [0, 90], [0, 90], [0, 65]];

  if (! aBRCol)
    aBRCol = [aFRTCol[0].slice(0), aFRTCol[1].slice(0), aFRTCol[2].slice(0), aFRTCol[3].slice(0)];

  for (i = 0; i < aFRTCol.length; ++i)
  {
    aFRTCol[i][1] = Scale.X(aFRTCol[i][1]);
    aBRCol[i][1]  = Scale.X(aBRCol[i][1]);
  }
}

function WriteIni()
{
  var i, n;

  var sText =
    'bGoToDlg='    + bGoToDlg + ';\r\n' +
    'bFastCount='  + bFastCount + ';\r\n' +
    'bTranspNA='   + bTranspNA + ';\r\n' +
    'nOpacity='    + nOpacity + ';\r\n' +
    'bMore='       + bMore + ';\r\n' +
    'nDlgX='       + nDlgX + ';\r\n' +
    'nDlgY='       + nDlgY + ';\r\n' +
    'nFRTX='       + nFRTX + ';\r\n' +
    'nFRTY='       + nFRTY + ';\r\n' +
    'nFRTW='       + Scale.UX(nFRTW) + ';\r\n' +
    'nFRTH='       + Scale.UY(nFRTH) + ';\r\n' +
    'nBRX='        + nBRX + ';\r\n' +
    'nBRY='        + nBRY + ';\r\n' +
    'bAEFont='     + bAEFont + ';\r\n' +
    'nFRTSel='     + nFRTSel + ';\r\n' +
    'bFRTSort='    + bFRTSort + ';\r\n' +
    'nBR='         + nBR + ';\r\naBR=[';

  for (i = 0; i < aBR.length; ++i)
  {
    sText += '[';

    for (n = 0; n < aBR[i].length; ++n)
      sText += '"' + aBR[i][n].replace(/[\\"]/g, '\\$&') + ((n === aBR[i].length - 1) ? '"' : '",');

    sText += ']' + ((i === aBR.length - 1) ? '' : ',');
  }
  sText += '];\r\naBRCB=[';

  for (i = 0; i < aBRCB.length; ++i)
  {
    sText += '[';

    for (n = 0; n < aBRCB[i].length; ++n)
      sText += aBRCB[i][n] + ((n === aBR[i].length - 1) ? '' : ',');

    sText += ']' + ((i === aBRCB.length - 1) ? '' : ',');
  }
  sText += '];\r\naBRName=[';

  for (i = 0; i < aBRName.length; ++i)
    sText += '"' + aBRName[i].replace(/[\\"]/g, '\\$&') + ((i === aBRName.length - 1) ? '"' : '",');

  sText += '];\r\naFRTCol=[';

  for (i = 0; i < aFRTCol.length; ++i)
    sText += '[' + aFRTCol[i][0] + ',' + Scale.UX(aFRTCol[i][1]) + ']' + ((i === aFRTCol.length - 1) ? '' : ',');

  sText += '];\r\naBRCol=[';

  for (i = 0; i < aBRCol.length; ++i)
    sText += '[' + aBRCol[i][0] + ',' + Scale.UX(aBRCol[i][1]) + ']' + ((i === aBRCol.length - 1) ? '' : ',');

  sText += '];\r\n';

  if (sText !== ReadIni.Text) 
    AkelPad.WriteFile(WScript.ScriptFullName.replace(/\.js$/i, ".ini"), sText, sText.length, 1200 /*UTF-16LE*/, true);
}
