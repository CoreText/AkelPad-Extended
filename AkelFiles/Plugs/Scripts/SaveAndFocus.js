// http://akelpad.sourceforge.net/forum/viewtopic.php?p=31982#31982
// Version: 2016-04-11
// Authors: Sticher78, text_r
//
// Status: Draft
//
// Активирует окно FileZilla, при сохранении файла на FTP.
// Если файл не сохранен никуда - открывается просто окно сохранения файла.
// Если файл сохранён, но не с FTP - просто активируется окно FileZilla.
//
// E.x.: Focus FileZilla if file is located in FileZilla's Temp directory
// P.s.: You can use "WindowsList.js" to see window names and test focus.
//
// Call("Scripts::Main", 1, "SaveAndFocus.js")
// Call("Scripts::Main", 1, "SaveAndFocus.js", `-Name="YourProgramToFocus" -Sleep=6666`)

AkelPad.Command(4105);                                      // Save File

var defaultAppName = 'Chrome',                              // only for WinSCP (just my own preference)
    WshShell,
    pName = AkelPad.GetArgValue("Name", ''),
    pSleep = AkelPad.GetArgValue("Sleep", 3000),
    fDir = AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1);

// AkelPad.MessageBox(0, fDir, WScript.ScriptName, 0);

/**
 * FileZilla
 */
if (~fDir.indexOf("FileZilla")) {
	WshShell = new ActiveXObject("WScript.Shell");
	WshShell.AppActivate("FileZilla");
}

/**
 * WinSCP and then Chrome, because there is no confirmation dialog opened in WinSCP
 */
if (~fDir.indexOf("WinSCP")) {
	WshShell = new ActiveXObject("WScript.Shell");
	WshShell.AppActivate("WinSCP");
	focus_the_app(pName);
}

/**
 * DoubleCommander
 */
if (~fDir.indexOf("\_dc")) {
	WshShell = new ActiveXObject("WScript.Shell");
	AkelPad.Command(4318);
	WshShell.AppActivate("Double");
	WshShell.AppActivate("Wait...");
	WScript.Sleep(500);
	WshShell.SendKeys(" ");
	//AkelPad.Call("Scripts::Main", 1, "CloseUnnamedAll.js", '-CloseUnnamed=false -CloseUnexisted=true');
}

/**
 * Custom App to focus
 */
function focus_the_app(progName) {
  var pName = progName ? progName : pName;
	if (typeof pName === 'string' && pName !== '') {
	  WshShell = new ActiveXObject("WScript.Shell");
	  WScript.Sleep(pSleep);
	  WshShell.AppActivate(pName);
	}
}

