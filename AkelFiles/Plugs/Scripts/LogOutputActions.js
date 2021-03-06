// Log Output Actions (Copy | Open In The New Tab)
// Действия с Log::Output (копия | открыть в новой вкладке)
//
// Author: texter
//
// should have CommonFunctions.js
//
// Arguments:
//   sLogExt   -syntax of the log
//   bCopy     -copy contents of the log into the clipboard
//   bNewTab   -open the new tab and copy contents from the log to that new tab
//
//
// Usage:
//   By default will open contents of the log in the new tab
//
//   "Copy contents of the log in the new tab" Call("Scripts::Main", 1, "LogOutputActions.js", '-sLogExt=".git"')
//   "Copy contents of the log to the clipboard" Call("Scripts::Main", 1, "LogOutputActions.js", '-bCopy=1')
//
//   "Скопировать содержимое журнала в новую вкладку" Call("Scripts::Main", 1, "LogOutputActions.js", '-sLogExt=".git"')
//   "Скопировать содержимое журнала в память" Call("Scripts::Main", 1, "LogOutputActions.js", '-bCopy=1')
//

var oSys     = AkelPad.SystemFunction();
var fso = new ActiveXObject("Scripting.FileSystemObject");
var WshShell = new ActiveXObject("WScript.Shell");

// Arguments
var sLogExt = AkelPad.GetArgValue("sLogExt", ".txt");
var bCopy = AkelPad.GetArgValue("bCopy", 0);
var bNewTab = AkelPad.GetArgValue("bNewTab", 1);

if (bCopy)
  LogOutputActions(sLogExt, CopyLogContentsToClipboardCB);
else
  LogOutputActions(sLogExt, CopyLogContentsToNewTabCB);


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
    AkelPad.MessageBox(0, "LogOutputActions Error:\n\n"+ oError.name + "\n\n" + oError.description + "\n\n", WScript.ScriptName, 16 /*MB_ICONERROR*/);
    return false;
  }
  hWndOutput = 0;
  return true;
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
