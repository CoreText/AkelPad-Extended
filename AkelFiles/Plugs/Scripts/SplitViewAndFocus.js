/**
 * Split current edited file and focus.
 *
 * Usefull script, espetially when you tile tabs and
 * split the view to locate the cursor somewhere else

"Vertical Default"   Call("Scripts::Main", 1, "SplitViewAndFocus.js")
"Horizontal Default" Call("Scripts::Main", 1, "SplitViewAndFocus.js", '"1"')

 * Vertical split is 1 by default, Horizontal is 0
 * Posible hotkey:
 * Shift + Alt + D
 */

var EditWnd = AkelPad.GetEditWnd();
if (! EditWnd)
  WScript.Quit();

var MainWnd = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

//Arguments
var bDirectionDefault = ((WScript.Arguments.length)? WScript.Arguments(0) : 1);

var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

if (1 === AkelPad.IsMDI() && lpRect)
{
  var hMdiClient = AkelPad.SendMessage(MainWnd, 1223, 1, AkelPad.SendMessage(MainWnd, 1288, 1, 0));
  if (hMdiClient)
    SplitWindowMDI(hMdiClient, lpRect);
}
else if (lpRect)
  SplitWindow(lpRect);
else
  DummySplit();


function SplitWindowMDI(hMdiC, pRect)
{
  oSys.Call("user32::GetWindowRect", hMdiC, pRect);
  var rcWnd = parseRectMDI(pRect);
  //AkelPad.MessageBox(0, "top: "+rcWnd.top +"\n\nright: "+ rcWnd.right +"\n\nbottom: "+ rcWnd.bottom +"\n\nleft: "+ rcWnd.left, WScript.ScriptName, 0);

  if
  (bDirectionDefault &&
    (
       (rcWnd.right < rcWnd.bottom) && (rcWnd.top < rcWnd.left) // right side
    || (rcWnd.left > rcWnd.bottom)
    || (rcWnd.right > rcWnd.bottom) && (rcWnd.top > rcWnd.left) // left side
    )
  )
    AkelPad.Command(4213);
  else
    AkelPad.Command(4214); // horizontal

  AkelPad.Command(4341);
  AkelPad.MemFree(pRect);
}

function SplitWindow(pRect)
{
  oSys.Call("user32::GetWindowRect", MainWnd, pRect);
  var rcWnd = parseRectMDI(pRect);
  //AkelPad.MessageBox(0, "top: "+rcWnd.top +"\n\nright: "+ rcWnd.right +"\n\nbottom: "+ rcWnd.bottom +"\n\nleft: "+ rcWnd.left, WScript.ScriptName, 0 /*MB_OK*/);

  if
  (bDirectionDefault &&
    (
       (rcWnd.right < rcWnd.bottom) && (rcWnd.top < rcWnd.left) // right side
    || (rcWnd.right > rcWnd.bottom) && (rcWnd.left === rcWnd.top)
    || (rcWnd.right > rcWnd.bottom) && (rcWnd.top > rcWnd.left) // left side
    )
  )
    AkelPad.Command(4213);
  else
    AkelPad.Command(4214); // horizontal

  AkelPad.MemFree(pRect);
  AkelPad.Command(4341);
}

function DummySplit()
{
  if (bDirectionDefault)
    AkelPad.Command(4213);
  else
    AkelPad.Command(4214);
  AkelPad.Command(4341);
}

function parseRectMDI(lpRect)
{
  return {
    left: AkelPad.MemRead(_PtrAdd(lpRect, 0), 3 /*DT_DWORD*/ ),
    top: AkelPad.MemRead(_PtrAdd(lpRect, 4), 3 /*DT_DWORD*/ ),
    right: AkelPad.MemRead(_PtrAdd(lpRect, 8), 3 /*DT_DWORD*/ ),
    bottom: AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/ )
  };
}
