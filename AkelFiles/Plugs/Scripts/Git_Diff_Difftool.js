// Git Diff Current File with Commit ID from Buffer
// you should copy commit id (min 7 chars) before executing the script.
//
//
// [merge]
//   tool = meld
// [mergetool "meld"]
//   cmd = \"C:\\Absolute\\Path\\Meld\\Meld.exe\" "$LOCAL" "$BASE" "$REMOTE" "--output=$MERGED"
//   path = C:\\Absolute\\Path\\Meld\\Meld.exe
//   trustExitCode = false
//   keepBackup = false
// [diff]
//   tool = meld
// [difftool "meld"]
//   cmd = \"C:\\Absolute\\Path\\Meld\\Meld.exe\" "$LOCAL" "$REMOTE"
// [difftool "winmerge"]
//   cmd = winmerge.sh "$LOCAL" "$REMOTE"
//   keepBackup = false
// [difftool "kdiff3"]
//   path = C:\\Absolute\\Path\\KDiff3\\kdiff3.exe
//   cmd = \"C:\\Absolute\\Path\\KDiff3\\kdiff3.exe\" "$LOCAL" "$REMOTE"
//   trustExitCode = false
//
//
// Arguments:
// 	cmd - имя команды; если указано, то меню выводиться не будет, а выполнится указанная команда;
//  tool - имя желаемого difftool указанного в .gitconfig
//
// Usage:
//    "Git Diff Current File with Commit ID from Buffer (difftool WinMerge) " Call("Scripts::Main", 1, "Git_Diff_Difftool.js", `-tool=meld`)
//
var sSelText;
var hWndEdit;
var diffTool = AkelPad.GetArgValue('tool', 'winmerge');

if (hWndEdit = AkelPad.GetEditWnd())
{
	var nSelStart = AkelPad.SendMessage(hWndEdit, 3129 /*AEM_GETLINENUMBER*/ , 21 /*AEGI_UNWRAPLINEFROMRICHOFFSET*/ , AkelPad.GetSelStart());
	var nSelEnd = AkelPad.SendMessage(hWndEdit, 3129 /*AEM_GETLINENUMBER*/ , 21 /*AEGI_UNWRAPLINEFROMRICHOFFSET*/ , AkelPad.GetSelEnd());

	var argsCount = WScript.Arguments.length;
	var arg = argsCount
	 ? WScript.Arguments(0)
	 : AkelPad.GetEditFile(0);

	if (arg)
	{
		var currFullPathFile = arg;
		var currFileName = getFileName(arg);
		var currFile = getFileNameExt(arg);
		var dir = getFileDir(arg);
		var clipText = AkelPad.GetClipboardText().replace(/[\r|\n|\s|\t]/g, '') || 0;
		var theText;

		if (clipText.length <= 40 && clipText.length !== 0)
			theText = clipText;

		function getFileDir(filePathName) // file directory w/o trailing '\'
		{
			var n = filePathName.lastIndexOf("\\");
			var nn = filePathName.lastIndexOf("/");
			if (nn > n) n = nn;
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
			if (nn > n1) n1 = nn;
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
			if (nn > n) n = nn;
			return (n >= 0) ? filePathName.substr(n + 1) : filePathName;
		}

		function trimStr(str)
		{
			return str.replace(/^\s+/, "").replace(/\s+$/, "");
		}

		if (theText)
		{
			// git difftool d653913567bbd07ec28d9a26dbf8ba84e8d42fd6 HEAD index_1.php --tool=winmerge
			var pCommand = AkelPad.GetArgValue(
					"cmd",
					'cmd.exe /K cd /d \"' + dir + '\" & git difftool ' + trimStr(theText) + ' HEAD \"' + currFile + '\" -y --trust-exit-code --tool=' + diffTool + ' & exit '
				),
				pCommandBefore = pCommand;

			if (!pCommand)
			{
				if (!AkelPad.Include("ShowMenuEx.js")) WScript.Quit();
				pCommand = getSelectedMenuItem(POS_CURSOR, false);
				if (!pCommand) WScript.Quit();
			}

			//AkelPad.Call("Log::Output", 1, ("[" + WScript.ScriptName + "]=======\n" + theText + "\n"), "", "", "", -2, -2, 32, ".git");
			AkelPad.Call("Log::Output", 1, (pCommand), "", "", "", -2, -2, 32, ".git");
		}
	}

}
