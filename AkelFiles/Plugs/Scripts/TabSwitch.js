/// TabSwitch.js
// Переключение между вкладками.
// http://tc-image.3dn.ru/forum/9-237-870-16-1333022433
// http://akelpad.sourceforge.net/forum/viewtopic.php?p=4368#4368
// Version: 4.4
// Author: Shengalts Aleksander aka Instructor
//
//
// Description(1033): Switch between tabs.
// Description(1049): Переключение между вкладками
//
// Arguments:
// -Next=true           -Switch direction (one of the following):
//                         true   Forward switch.
//                         false  Backward switch (default).
//                         -1     Stay current.
// -CtrlTab=false       -No Ctrl+Tab hotkey is assigned to TabSwitch.js (default is true).
// -RightLeft=true      -Switch between tabs: Left-Right. Default is false - switch between tabs: Next-Previous.
// -MinTabs=2           -Minimum number of tabs before switch window appeared (default is 2).
// -TabIndex=0          -Activate tab by specified index. If used, all other arguments ignored.
// -FontName="Arial"    -Font name. Unchanged, if "".
// -FontStyle=3         -Font style (one of the following):
//                         0  ignored (default).
//                         1  normal.
//                         2  bold.
//                         3  italic.
//                         4  bold italic.
// -FontSize=10         -Font size. Unchanged, if 0 (default).
// -LineGap=10          -Space between items (default is 1).
// -SingleClick=false   -Single mouse click chooses item (default is true).
// -ShowModify=2        -Show modification sign (one of the following):
//                         0  hidden.
//                         1  display asterisk * at the end (default).
//                         2  display asterisk * at the beginning.
// -OnlyNames=true      -Show only file name. Default is false - show full path.
// -WindowLeft=100      -Left window position. Special values:
//                        -1 centered (default).
//                        -2 cursor position.
// -WindowTop=100       -Top window position. Special values:
//                        -1 centered (default).
//                        -2 cursor position.
// -WindowMaxHeight=500 -Maximum window height. Special values:
//                        -1 unlimited (default).
// -WindowMaxWidth=500  -Maximum window width. Special values:
//                        -1 unlimited (default).
//
// Usage:
//   -"Previous (Ctrl+Tab)" Call("Scripts::Main", 1, "TabSwitch.js", `-Next=false`)
//   -"Next (Ctrl+Shift+Tab)" Call("Scripts::Main", 1, "TabSwitch.js", `-Next=true`)
//   -"Right (Ctrl+Tab)" Call("Scripts::Main", 1, "TabSwitch.js", `-RightLeft=true -Next=true`)
//   -"Left (Ctrl+Shift+Tab)" Call("Scripts::Main", 1, "TabSwitch.js", `-RightLeft=true -Next=false`)
//   -"Tab1 (Alt+1)" Call("Scripts::Main", 1, "TabSwitch.js", `-TabIndex=0`)
//   -"Tab2 (Alt+2)" Call("Scripts::Main", 1, "TabSwitch.js", `-TabIndex=1`)
// Toolbar button example:
//   -"Tab list" Call("Scripts::Main", 1, "TabSwitch.js", `-Next=-1 -CtrlTab=false -RightLeft=true -MinTabs=1 -WindowLeft=%bl -WindowTop=%bb`)
// ContextMenu item example:
//   -"Tab list" Call("Scripts::Main", 1, "TabSwitch.js", `-Next=-1 -CtrlTab=false -RightLeft=true -MinTabs=1 -WindowLeft=-2 -WindowTop=-2`)

//Arguments
var bNext=AkelPad.GetArgValue("Next", false);
var bCtrlTab=AkelPad.GetArgValue("CtrlTab", true);
var bRightLeft=AkelPad.GetArgValue("RightLeft", false);
var nMinTabs=AkelPad.GetArgValue("MinTabs", 2);
var nTabIndex=AkelPad.GetArgValue("TabIndex", -1);
var pFontName=AkelPad.GetArgValue("FontName", "");
var nFontStyle=AkelPad.GetArgValue("FontStyle", 0);
var nFontSize=AkelPad.GetArgValue("FontSize", 0);
var nLineGap=AkelPad.GetArgValue("LineGap", 1);
var bSingleClick=AkelPad.GetArgValue("SingleClick", true);
var nShowModify=AkelPad.GetArgValue("ShowModify", 1);
var bOnlyNames=AkelPad.GetArgValue("OnlyNames", false);
var nWindowLeft=AkelPad.GetArgValue("WindowLeft", -1);
var nWindowTop=AkelPad.GetArgValue("WindowTop", -1);
var nWindowMaxHeight=AkelPad.GetArgValue("WindowMaxHeight", -1);
var nWindowMaxWidth=AkelPad.GetArgValue("WindowMaxWidth", -1);

//Variables
var hMainWnd=AkelPad.GetMainWnd();
var hWndEdit=AkelPad.GetEditWnd();
var oSys=AkelPad.SystemFunction();
var hInstanceDLL=AkelPad.GetInstanceDll();
var pClassName="AkelPad::Scripts::" + WScript.ScriptName + "::" + oSys.Call("kernel32::GetCurrentProcessId");
var hWndContainer=0;
var hWndListBox=0;
var hHookPost;
var hHookSend;
var dwMainThreadID=oSys.Call("user32::GetWindowThreadProcessId", hMainWnd, 0);
var hSubClass;
var hDC;
var hBrushHollow;
var hFontEdit;
var lpFrameList=[];
var rcMain=[];
var ptPoint=[];
var nItemHeight;
var nScreenWidth;
var nControlWidth;
var nControlHeight;
var nMaxControlHeight;
var nCharWidth;
var nCharHeight;
var nMaxCharWidth=0;
var nMaxCharHeight=0;
var nIconSize=16;
var nIconGap=2;
var bNoSwitch=false;
var i;

if (nTabIndex >= 0)
{
  var hWndTab;
  var lpFrame;
  var nCurSel;

  hWndTab=oSys.Call("user32::GetDlgItem", hMainWnd, 10003 /*ID_TAB*/);
  if (lpFrame=AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 8 /*FWF_BYTABINDEX*/, nTabIndex))
    oSys.Call("user32::PostMessage" + _TCHAR, hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrame);
  WScript.Quit();
}

//Get list of documents
nCurSel=GetFrameList(lpFrameList);

if (lpFrameList.length >= nMinTabs && lpFrameList.length > 0)
{
  if (bCtrlTab)
  {
    if (!(oSys.Call("user32::GetKeyState", 0x11 /*VK_CONTROL*/) & 0x8000))
    {
      //Ctrl already released
      if (lpFrameList.length >= 2)
        oSys.Call("user32::PostMessage" + _TCHAR, hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameList[nCurSel][1]);
      WScript.Quit();
    }
  }

  //Get font
  if (pFontName || nFontStyle || nFontSize)
    hFontEdit=CreateFont(pFontName, nFontStyle, nFontSize);
  else
    hFontEdit=AkelPad.SendMessage(hWndEdit, 0x31 /*WM_GETFONT*/, 0, 0);
  if (!hFontEdit) WScript.Quit();

  //Get maximum character size
  if (lpSize=AkelPad.MemAlloc(8 /*sizeof(SIZE)*/))
  {
    if (hDC=oSys.Call("user32::GetDC", hWndEdit))
    {
      oSys.Call("gdi32::SelectObject", hDC, hFontEdit);

      for (i=0; i < lpFrameList.length; ++i)
      {
        if (oSys.Call("gdi32::GetTextExtentPoint32" + _TCHAR, hDC, lpFrameList[i][0], lpFrameList[i][0].length, lpSize))
        {
          nCharWidth=AkelPad.MemRead(_PtrAdd(lpSize, 0) /*offsetof(SIZE, cx)*/, 3 /*DT_DWORD*/);
          nCharHeight=AkelPad.MemRead(_PtrAdd(lpSize, 4) /*offsetof(SIZE, cy)*/, 3 /*DT_DWORD*/);
          if (nCharWidth > nMaxCharWidth) nMaxCharWidth=nCharWidth;
          if (nCharHeight > nMaxCharHeight) nMaxCharHeight=nCharHeight;
        }
      }
      oSys.Call("user32::ReleaseDC", hWndEdit, hDC);
    }
    nMaxCharWidth+=nIconSize + nIconGap + 16;

    AkelPad.MemFree(lpSize);
  }

  //Create dialog
  if (AkelPad.WindowRegisterClass(pClassName, 0x21 /*WM_MOUSEACTIVATE*/,
                                              0x2B /*WM_DRAWITEM*/))
  {
    if (hWndContainer=oSys.Call("user32::CreateWindowEx" + _TCHAR, 0, pClassName, 0, 0x80000000 /*WS_POPUP*/, 0, 0, 0, 0, hMainWnd, 0, hInstanceDLL, DialogCallback))
    {
      if (hWndListBox=oSys.Call("user32::CreateWindowEx" + _TCHAR, 0, "LISTBOX", 0, 0x50700010 /*WS_VISIBLE|WS_CHILD|WS_HSCROLL|WS_VSCROLL|WS_DLGFRAME|LBS_OWNERDRAWFIXED*/, 0, 0, 0, 0, hWndContainer, 0, hInstanceDLL, 0))
      {
        //Make hWndContainer invisible
        hBrushHollow=oSys.Call("gdi32::GetStockObject", 5 /*HOLLOW_BRUSH*/);
        oSys.Call("user32::SetClassLong" + _TCHAR, hWndContainer, -10 /*GCL_HBRBACKGROUND*/, hBrushHollow);

        AkelPad.SendMessage(hWndListBox, 48 /*WM_SETFONT*/, hFontEdit, 1);
        nItemHeight=nMaxCharHeight + nLineGap;
        i=AkelPad.SendMessage(hWndListBox, 0x1A1 /*LB_GETITEMHEIGHT*/, 0, 0);
        if (nItemHeight < i)
          nItemHeight=i;
        else
          AkelPad.SendMessage(hWndListBox, 0x1A0 /*LB_SETITEMHEIGHT*/, 0, nItemHeight);
        nMaxControlHeight=lpFrameList.length * nItemHeight + oSys.Call("user32::GetSystemMetrics", 8 /*SM_CYDLGFRAME*/) * 2;
        if (nWindowMaxHeight > 0)
          nControlHeight=Math.min(nWindowMaxHeight, nMaxControlHeight);
        else
          nControlHeight=nMaxControlHeight;
        nControlHeight=Math.min(oSys.Call("user32::GetSystemMetrics", 62 /*SM_CYMAXIMIZED*/) - 8, nControlHeight);
        if (nWindowMaxWidth > 0)
          nControlWidth=Math.min(nWindowMaxWidth, nMaxCharWidth);
        else
          nControlWidth=nMaxCharWidth;
        nControlWidth=Math.min(oSys.Call("user32::GetSystemMetrics", 61 /*SM_CXMAXIMIZED*/) - 8, nControlWidth);

        if (nMaxCharWidth > nControlWidth)
        {
          AkelPad.SendMessage(hWndListBox, 0x194 /*LB_SETHORIZONTALEXTENT*/, nMaxCharWidth, 0);
          if (nMaxControlHeight == nControlHeight)
            nControlHeight+=oSys.Call("user32::GetSystemMetrics", 21 /*SM_CXHSCROLL*/);
        }

        //Fill listbox
        for (i=0; i < lpFrameList.length; ++i)
          oSys.Call("user32::SendMessage" + _TCHAR, hWndListBox, 0x180 /*LB_ADDSTRING*/, 0, lpFrameList[i][0]);

        GetWindowSize(hMainWnd, 0, rcMain);
        if (nWindowLeft >= 0)
          rcMain.left=nWindowLeft;
        else if (nWindowLeft == -2)
        {
          GetCursorPos(ptPoint);
          rcMain.left=ptPoint.x;
        }
        else
          rcMain.left+=rcMain.right / 2 - nControlWidth / 2;
        if (!(nScreenWidth=oSys.Call("user32::GetSystemMetrics", 78 /*SM_CXVIRTUALSCREEN*/)))
          nScreenWidth=oSys.Call("user32::GetSystemMetrics", 61 /*SM_CXMAXIMIZED*/);
        rcMain.left=Math.min(rcMain.left, Math.max((nScreenWidth - 8) - nControlWidth, 0));
        if (rcMain.left < 0) rcMain.left=0;

        if (nWindowTop >= 0)
          rcMain.top=nWindowTop;
        else if (nWindowTop == -2)
        {
          GetCursorPos(ptPoint);
          rcMain.top=ptPoint.y;
        }
        else
          rcMain.top+=rcMain.bottom / 2 - nControlHeight / 2;
        rcMain.top=Math.min(rcMain.top, Math.max((oSys.Call("user32::GetSystemMetrics", 62 /*SM_CYMAXIMIZED*/) - 8) - nControlHeight, 0));
        if (rcMain.top < 0) rcMain.top=0;

        oSys.Call("user32::SetWindowPos", hWndContainer, 0, rcMain.left, rcMain.top, nControlWidth, nControlHeight, 0x14 /*SWP_NOZORDER|SWP_NOACTIVATE*/);
        oSys.Call("user32::SetWindowPos", hWndListBox, 0, 0, 0, nControlWidth, nControlHeight, 0x16 /*SWP_NOMOVE|SWP_NOZORDER|SWP_NOACTIVATE*/);
        AkelPad.SendMessage(hWndListBox, 0x186 /*LB_SETCURSEL*/, nCurSel, 0);
        oSys.Call("user32::ShowWindow", hWndContainer, 4 /*SW_SHOWNOACTIVATE*/);
        //oSys.Call("user32::SetFocus", hWndListBox);
        //oSys.Call("user32::ShowWindow", hWndContainer, 5 /*SW_SHOW*/);
        //oSys.Call("user32::UpdateWindow", hMainWnd);

        //Cause listbox is non-active, hook and send to listbox keyboard and mouse actions.
        if (hHookPost=AkelPad.ThreadHook(3 /*WH_GETMESSAGE*/, HookPostCallback, dwMainThreadID, 0x201 /*WM_LBUTTONDOWN*/,
                                                                                                0x0A1 /*WM_NCLBUTTONDOWN*/,
                                                                                                0x204 /*WM_RBUTTONDOWN*/,
                                                                                                0x0A4 /*WM_NCRBUTTONDOWN*/,
                                                                                                0x207 /*WM_MBUTTONDOWN*/,
                                                                                                0x0A7 /*WM_NCMBUTTONDOWN*/,
                                                                                                0x100 /*WM_KEYDOWN*/,
                                                                                                0x101 /*WM_KEYUP*/,
                                                                                                0x104 /*WM_SYSKEYDOWN*/,
                                                                                                0x105 /*WM_SYSKEYUP*/,
                                                                                                0x20A /*WM_MOUSEWHEEL*/))
        {
          if (hHookSend=AkelPad.ThreadHook(4 /*WH_CALLWNDPROC*/, HookSendCallback, dwMainThreadID, 0x6 /*WM_SETFOCUS*/))
          {
            if (hSubClass=AkelPad.WindowSubClass(hWndListBox, ListBoxCallback, 0x021 /*WM_MOUSEACTIVATE*/,
                                                                               0x087 /*WM_GETDLGCODE*/,
                                                                               0x100 /*WM_KEYDOWN*/,
                                                                               0x101 /*WM_KEYUP*/,
                                                                               0x201 /*WM_LBUTTONDOWN*/,
                                                                               0x202 /*WM_LBUTTONUP*/,
                                                                               0x203 /*WM_LBUTTONDBLCLK*/))
            {
              //Allow other scripts running
              AkelPad.ScriptNoMutex();

              //Message loop
              AkelPad.WindowGetMessage();

              AkelPad.WindowUnsubClass(hWndListBox);
            }
            AkelPad.ThreadUnhook(hHookSend);
          }
          AkelPad.ThreadUnhook(hHookPost);
        }

        if (!bNoSwitch)
        {
          i=AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0);
          oSys.Call("user32::PostMessage" + _TCHAR, hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameList[i][1]);
        }
        //oSys.Call("user32::DestroyWindow", hWndListBox);
      }
      oSys.Call("user32::DestroyWindow", hWndContainer);
    }
    AkelPad.WindowUnregisterClass(pClassName);
  }

  //Release font
  if (pFontName || nFontStyle || nFontSize)
  {
    if (hFontEdit)
      oSys.Call("gdi32::DeleteObject", hFontEdit);
  }
}
else
{
  if (lpFrameList.length >= 2)
    oSys.Call("user32::PostMessage" + _TCHAR, hMainWnd, 1285 /*AKD_FRAMEACTIVATE*/, 0, lpFrameList[nCurSel][1]);
}

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 0x021 /*WM_MOUSEACTIVATE*/)
  {
    return 3 /*MA_NOACTIVATE*/;
  }
  else if (uMsg == 0x2B /*WM_DRAWITEM*/)
  {
    var hDC;
    var hIcon;
    var nItemID;
    var nItemState;
    var lpItem;
    var rcItem=[];
    var crText;
    var crBk;
    var hBrushBk;
    var nModeBkOld;

    hDC=AkelPad.MemRead(_PtrAdd(lParam, _X64?32:24) /*offsetof(DRAWITEMSTRUCT, hDC)*/, 2 /*DT_QWORD*/);
    nItemID=AkelPad.MemRead(_PtrAdd(lParam, _X64?8:8) /*offsetof(DRAWITEMSTRUCT, itemID)*/, 3 /*DT_DWORD*/);
    nItemState=AkelPad.MemRead(_PtrAdd(lParam, _X64?16:16) /*offsetof(DRAWITEMSTRUCT, itemState)*/, 3 /*DT_DWORD*/);
    lpItem=_PtrAdd(lParam, _X64?40:28) /*offsetof(DRAWITEMSTRUCT, rcItem)*/;
    RectToArray(lpItem, rcItem);

    //Set background
    if (nItemState & 0x1 /*ODS_SELECTED*/)
    {
      crText=oSys.Call("user32::GetSysColor", 14 /*COLOR_HIGHLIGHTTEXT*/);
      crBk=oSys.Call("user32::GetSysColor", 13 /*COLOR_HIGHLIGHT*/);
      hBrushBk=oSys.Call("user32::GetSysColorBrush", 13 /*COLOR_HIGHLIGHT*/);
    }
    else
    {
      crText=oSys.Call("user32::GetSysColor", 8 /*COLOR_WINDOWTEXT*/);
      crBk=oSys.Call("user32::GetSysColor", 5 /*COLOR_WINDOW*/);
      hBrushBk=oSys.Call("user32::GetSysColorBrush", 5 /*COLOR_WINDOW*/);
    }
    oSys.Call("user32::FillRect", hDC, lpItem, hBrushBk);
    nModeBkOld=oSys.Call("gdi32::SetBkMode", hDC, 1 /*TRANSPARENT*/);

    //Draw icon
    hIcon=AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 38 /*FI_ICONHANDLE*/, lpFrameList[nItemID][1]);
    oSys.Call("user32::DrawIconEx", hDC, rcItem.left, rcItem.top + (rcItem.bottom - rcItem.top) / 2 - nIconSize / 2, hIcon, nIconSize, nIconSize, 0, 0, 0x3 /*DI_NORMAL*/);

    //Draw text
    oSys.Call("gdi32::SetTextColor", hDC, crText);
    oSys.Call("gdi32::SetBkColor", hDC, crBk);
    oSys.Call("gdi32::TextOut" + _TCHAR, hDC, rcItem.left + nIconSize + nIconGap, rcItem.top + (rcItem.bottom - rcItem.top) / 2 - nMaxCharHeight / 2, lpFrameList[nItemID][0], lpFrameList[nItemID][0].length);

    oSys.Call("gdi32::SetBkMode", hDC, nModeBkOld);
  }
  return 0;
}

function HookPostCallback(nCode, wParam, lParam)
{
  var uMsg=AkelPad.MemRead(_PtrAdd(lParam, _X64?8:4) /*offsetof(MSG, message)*/, 3 /*DT_DWORD*/);
  var nParamW;
  var nParamL;

  if (uMsg == 0x201 /*WM_LBUTTONDOWN*/ ||
      uMsg == 0x0A1 /*WM_NCLBUTTONDOWN*/ ||
      uMsg == 0x204 /*WM_RBUTTONDOWN*/ ||
      uMsg == 0x0A4 /*WM_NCRBUTTONDOWN*/ ||
      uMsg == 0x207 /*WM_MBUTTONDOWN*/ ||
      uMsg == 0x0A7 /*WM_NCMBUTTONDOWN*/)
  {
    var hWnd=AkelPad.MemRead(_PtrAdd(lParam, 0) /*offsetof(MSG, hwnd)*/, 2 /*DT_QWORD*/);

    if (hWnd != hWndListBox)
    {
      //Not in rect
      bNoSwitch=true;

      //Exit message loop
      oSys.Call("user32::PostQuitMessage", 0);
    }
  }
  else if (uMsg == 0x100 /*WM_KEYDOWN*/ ||
           uMsg == 0x101 /*WM_KEYUP*/ ||
           uMsg == 0x104 /*WM_SYSKEYDOWN*/ ||
           uMsg == 0x105 /*WM_SYSKEYUP*/ ||
           uMsg == 0x20A /*WM_MOUSEWHEEL*/)
  {
    nParamW=AkelPad.MemRead(_PtrAdd(lParam, _X64?16:8) /*offsetof(MSG, nParamW)*/, 2 /*DT_QWORD*/);
    nParamL=AkelPad.MemRead(_PtrAdd(lParam, _X64?24:12) /*offsetof(MSG, lParam)*/, 2 /*DT_QWORD*/);
    AkelPad.SendMessage(hWndListBox, uMsg, nParamW, nParamL);
    AkelPad.MemCopy(_PtrAdd(lParam, _X64?8:4) /*offsetof(MSG, message)*/, 0 /*WM_NULL*/, 3 /*DT_DWORD*/);
  }
}

function HookSendCallback(nCode, wParam, lParam)
{
  var uMsg=AkelPad.MemRead(_PtrAdd(lParam, _X64?16:8) /*offsetof(CWPSTRUCT, message)*/, 3 /*DT_DWORD*/);
  var nParamW;
  var nParamL;

  if (uMsg == 0x6 /*WM_SETFOCUS*/)
  {
    bNoSwitch=true;

    //Exit message loop
    oSys.Call("user32::PostQuitMessage", 0);
  }
}

function ListBoxCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 0x021 /*WM_MOUSEACTIVATE*/)
  {
    return 3 /*MA_NOACTIVATE*/;
  }
  else if (uMsg == 0x087 /*WM_GETDLGCODE*/)
  {
    AkelPad.WindowNoNextProc(hSubClass);
    return 0x4 /*DLGC_WANTALLKEYS*/;
  }
  else if (uMsg == 0x100 /*WM_KEYDOWN*/)
  {
    if (wParam == 0x43 /*c*/)
    {
      if (bCtrlTab || (oSys.Call("user32::GetKeyState", 0x11 /*VK_CONTROL*/) & 0x8000))
      {
        i=AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0);
        AkelPad.SetClipboardText(lpFrameList[i][0]);
      }
    }
    else if (wParam == 0x9 /*VK_TAB*/)
    {
      var nCount;

      nCount=AkelPad.SendMessage(hWndListBox, 0x18B /*LB_GETCOUNT*/, 0, 0);
      i=AkelPad.SendMessage(hWndListBox, 0x188 /*LB_GETCURSEL*/, 0, 0);

      if (!(oSys.Call("user32::GetKeyState", 0x10 /*VK_SHIFT*/) & 0x8000))
      {
        if (++i >= nCount)
          i=0;
      }
      else
      {
        if (--i < 0)
          i=nCount - 1;
      }
      AkelPad.SendMessage(hWndListBox, 0x186 /*LB_SETCURSEL*/, i, 0);
    }
    else if (wParam == 0xD /*VK_RETURN*/)
    {
      //Exit message loop
      oSys.Call("user32::PostQuitMessage", 0);
    }
    else if (wParam == 0x1B /*VK_ESCAPE*/)
    {
      bNoSwitch=true;

      //Exit message loop
      oSys.Call("user32::PostQuitMessage", 0);
    }
  }
  else if (uMsg == 0x101 /*WM_KEYUP*/)
  {
    if (wParam == 0x11 /*VK_CONTROL*/)
    {
      if (bCtrlTab)
      {
        //Exit message loop
        oSys.Call("user32::PostQuitMessage", 0);
      }
    }
  }
  else if (uMsg == 0x201 /*WM_LBUTTONDOWN*/)
  {
    var lResult=AkelPad.SendMessage(hWndListBox, 0x01A9 /*LB_ITEMFROMPOINT*/, 0, lParam);

    if (HIWORD(lResult) == 0)
      AkelPad.SendMessage(hWndListBox, 0x186 /*LB_SETCURSEL*/, LOWORD(lResult), 0);
    AkelPad.WindowNoNextProc(hSubClass);
  }
  else if (uMsg == 0x202 /*WM_LBUTTONUP*/ ||
           uMsg == 0x203 /*WM_LBUTTONDBLCLK*/)
  {
    if (uMsg == 0x203 /*WM_LBUTTONDBLCLK*/ || bSingleClick)
    {
      //Exit message loop
      oSys.Call("user32::PostQuitMessage", 0);
    }
  }
}

function GetFrameList(lpFrameList)
{
  var lpCurFrame=AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 1 /*FWF_CURRENT*/, 0);
  var lpInitFrame;
  var lpFrame;
  var nCurFrame=0;
  var bModified;
  var i;

  if (bRightLeft)
    lpInitFrame=AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 8 /*FWF_BYTABINDEX*/, 0);
  else
    lpInitFrame=lpCurFrame;
  lpFrame=lpInitFrame;

  for (i=0; lpFrame; ++i)
  {
    lpFrameList[i]=[0, 0];
    lpFrameList[i][0]=AkelPad.MemRead(AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 32 /*FI_FILEW*/, lpFrame), 1 /*DT_UNICODE*/);
    lpFrameList[i][1]=lpFrame;
    if (bOnlyNames)
      lpFrameList[i][0]=AkelPad.GetFilePath(lpFrameList[i][0], 2 /*CPF_FILENAME*/);
    if (nShowModify)
    {
      bModified=AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 15 /*FI_MODIFIED*/, lpFrame);
      lpFrameList[i][0]=((nShowModify == 2 && bModified)?"* ":"") + lpFrameList[i][0] + ((nShowModify == 1 && bModified)?" *":"");
    }
    if (lpFrame == lpCurFrame)
      nCurFrame=i;

    if (bRightLeft)
      lpFrame=AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 8 /*FWF_BYTABINDEX*/, i + 1);
    else
      lpFrame=AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 3 /*FWF_PREV*/, lpFrame);
    if (lpFrame == lpInitFrame) break;
  }

  //Next frame
  if (lpFrameList.length >= 2 && bNext != -1)
  {
    if ((bRightLeft && bNext) || (!bRightLeft && !bNext))
      ++nCurFrame;
    else
      --nCurFrame;
    if (nCurFrame < 0)
      nCurFrame=lpFrameList.length - 1;
    else if (nCurFrame >= lpFrameList.length)
      nCurFrame=0;
  }
  return nCurFrame;
}

function CreateFont(pFaceName, nFontStyle, nPointSize)
{
  //Release it with: oSys.Call("gdi32::DeleteObject", hFont);
  var lpLogFontSrc;
  var lpLogFontDst;
  var hDC;
  var hFont=0;
  var nHeight;
  var nWeight;
  var nItalic;

  if (lpLogFontDst=AkelPad.MemAlloc(92 /*sizeof(LOGFONTW)*/))
  {
    lpLogFontSrc=AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 48 /*FI_EDITFONTW*/, 0);
    oSys.Call("kernel32::RtlMoveMemory", lpLogFontDst, lpLogFontSrc, 92 /*sizeof(LOGFONTW)*/);

    if (nPointSize)
    {
      if (hDC=oSys.Call("user32::GetDC", hMainWnd))
      {
        nHeight=-oSys.Call("kernel32::MulDiv", nPointSize, oSys.Call("gdi32::GetDeviceCaps", hDC, 90 /*LOGPIXELSY*/), 72);
        AkelPad.MemCopy(_PtrAdd(lpLogFontDst, 0) /*offsetof(LOGFONTW, lfHeight)*/, nHeight, 3 /*DT_DWORD*/);
        oSys.Call("user32::ReleaseDC", hMainWnd, hDC);
      }
    }
    if (nFontStyle != 0 /*FS_NONE*/)
    {
      nWeight=(nFontStyle == 2 /*FS_FONTBOLD*/ || nFontStyle == 4 /*FS_FONTBOLDITALIC*/)?700 /*FW_BOLD*/:400 /*FW_NORMAL*/;
      AkelPad.MemCopy(_PtrAdd(lpLogFontDst, 16) /*offsetof(LOGFONTW, lfWeight)*/, nWeight, 3 /*DT_DWORD*/);
      nItalic=(nFontStyle == 3 /*FS_FONTITALIC*/ || nFontStyle == 4 /*FS_FONTBOLDITALIC*/)?1:0;
      AkelPad.MemCopy(_PtrAdd(lpLogFontDst, 20) /*offsetof(LOGFONTW, lfItalic)*/, nItalic, 5 /*DT_BYTE*/);
    }
    if (_TSTR == 0 /*DT_ANSI*/ && !pFaceName)
      pFaceName=AkelPad.MemRead(_PtrAdd(lpLogFontDst, 28) /*offsetof(LOGFONTW, lfFaceName)*/, 1 /*DT_UNICODE*/);
    if (pFaceName)
      AkelPad.MemCopy(_PtrAdd(lpLogFontDst, 28) /*offsetof(LOGFONTW, lfFaceName)*/, pFaceName.substr(0, 32 /*LF_FACESIZE*/), _TSTR);

    hFont=oSys.Call("gdi32::CreateFontIndirect" + _TCHAR, lpLogFontDst);
    AkelPad.MemFree(lpLogFontDst);
  }
  return hFont;
}

function GetCursorPos(ptPoint)
{
  var lpPoint;

  ptPoint.x=0;
  ptPoint.y=0;

  if (lpPoint=AkelPad.MemAlloc(8 /*sizeof(POINT)*/))
  {
    if (oSys.Call("user32::GetCursorPos", lpPoint))
    {
      ptPoint.x=AkelPad.MemRead(_PtrAdd(lpPoint, 0) /*offsetof(POINT, x)*/, 3 /*DT_DWORD*/);
      ptPoint.y=AkelPad.MemRead(_PtrAdd(lpPoint, 4) /*offsetof(POINT, y)*/, 3 /*DT_DWORD*/);
    }
    AkelPad.MemFree(lpPoint);
  }
}

function RectToArray(lpRect, rcRect)
{
  rcRect.left=AkelPad.MemRead(_PtrAdd(lpRect, 0) /*offsetof(RECT, left)*/, 3 /*DT_DWORD*/);
  rcRect.top=AkelPad.MemRead(_PtrAdd(lpRect, 4) /*offsetof(RECT, top)*/, 3 /*DT_DWORD*/);
  rcRect.right=AkelPad.MemRead(_PtrAdd(lpRect, 8) /*offsetof(RECT, right)*/, 3 /*DT_DWORD*/);
  rcRect.bottom=AkelPad.MemRead(_PtrAdd(lpRect, 12) /*offsetof(RECT, bottom)*/, 3 /*DT_DWORD*/);
  return rcRect;
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
