// Git Log Selected Lines
// it will show you commits with diffs regarding selected
//
// Arguments:
// 	"cmd" - command to run
// 	"%f"  - current file
//
// Usage:
// 	"log selected lines" Call("Scripts::Main", 1, "Git_Log_Selected.js", `"%f"`)
//
var hWndEdit;
if (hWndEdit = AkelPad.GetEditWnd()) {

	var nSelStart = AkelPad.SendMessage(hWndEdit, 3129 /*AEM_GETLINENUMBER*/, 21 /*AEGI_UNWRAPLINEFROMRICHOFFSET*/, AkelPad.GetSelStart() );
	var nSelEnd   = AkelPad.SendMessage(hWndEdit, 3129 /*AEM_GETLINENUMBER*/, 21 /*AEGI_UNWRAPLINEFROMRICHOFFSET*/, AkelPad.GetSelEnd() );

	var argsCount = WScript.Arguments.length;
	var arg = argsCount
		? WScript.Arguments(0)
		: AkelPad.GetEditFile(0);

	if  (arg) {
	    var currFullPathFile = arg;
	    var currFileName = getFileName(arg);
	    var currFile     = getFileNameExt(arg);
	    var dir          = getFileDir(arg);

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

	    function getFileName(filePathName) // file name w/o extension
	    {
	      var n2 = filePathName.lastIndexOf(".");
	      var n1 = filePathName.lastIndexOf("\\");
	      var nn = filePathName.lastIndexOf("/");
	      if (nn > n1)  n1 = nn;
	      var s = "";
	      if (n1 < 0 && n2 < 0)
	        s = filePathName;
	      else if (n1 < 0)
	        s = filePathName.substr(0, n2);
	      else if (n2 < 0)
	        s = filePathName.substr(n1 + 1);
	      else if (n2 > n1)
	        s = filePathName.substr(n1 + 1, n2 - n1 - 1);
	      return s;
	    }

	    function getFileNameExt(filePathName) // file name with extension
	    {
	      var n = filePathName.lastIndexOf("\\");
	      var nn = filePathName.lastIndexOf("/");
	      if (nn > n)  n = nn;
	      return (n >= 0) ? filePathName.substr(n + 1) : filePathName;
	    }

	    var pCommand  = AkelPad.GetArgValue(
	        "cmd",
	        "cmd.exe /K cd /d \"" + dir + "\" & git log -L " + (nSelStart + 1) + "," + (nSelEnd + 1) + ":" + currFile + " & exit "
	    );

	    if (!pCommand) {
	    	if (!AkelPad.Include("ShowMenuEx.js")) WScript.Quit();
	    	pCommand = getSelectedMenuItem(POS_CURSOR, false);
	    	if (!pCommand) WScript.Quit();
	    }
	    AkelPad.Call("Log::Output", 1, pCommand, "", "", "", -1, -1, 50, ".git");
        pCommand = null;
	}

}
