// Place this file in the directory: ...\AkelPad\AkelFiles\Plugs\Scripts.
//
// Using Hotkeys plugin, you can asign keys:
// Ctrl+] - to command Call("Scripts::Main", 1, "ShiftEndHome.js", "0"),
// Ctrl+[ - to command Call("Scripts::Main", 1, "ShiftEndHome.js", "1").
//
// Call("Scripts::Main", 1, "ShiftEndHome.js", "0") - Shift+End
// Call("Scripts::Main", 1, "ShiftEndHome.js", "1") - Shift+Home

var VK_END = 0x23;
var hEditWnd = AkelPad.GetEditWnd();
var nAction;

if (WScript.Arguments.length)
{
  nAction = Number(WScript.Arguments(0));
  if (hEditWnd) {
    AkelPad.SendMessage(hEditWnd, 3044 /*AEM_KEYDOWN*/, VK_END + nAction, 0x2 /*AEMOD_SHIFT*/);
    if (nAction) {
    	AkelPad.SendMessage(hEditWnd, 3044 /*AEM_KEYDOWN*/, 0x25 /*LEFT ARROW key*/, 0x2 /*AEMOD_SHIFT*/);
    }
  }

  AkelPad.Command(4156);
}
