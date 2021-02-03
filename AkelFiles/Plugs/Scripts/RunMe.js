/**********************************************************************
 *  RunMe.js  v.2.2                                                   *
 *  (C) DV, Dec 2015                                                  *
 **********************************************************************/
/*
 *  Simple usage:
 *    Call("Scripts::Main", 1, "RunMe.js")
 *  To specify command line manually:
 *    Call("Scripts::Main", 1, "RunMe.js", "1")
 *
 *  Version 2.1 adds new ability to run a file specified by the selected
 *  text. First it tries to extract a file extension from the selected
 *  text - and if this succeeds, searches for a matching item in the
 *  oCommands. If such item exists, the specified file is run. Otherwise
 *  it calls isSupportedFileExtFromSelectedText - and if this function
 *  returns false, the physical file itself is processed.
 *
 *  Format of 'oCommands':
 *  var oCommands = {
 *    "extensions-1" :
 *      "command-1" ,
 *    "extensions-2" :
 *      "command-2" ,
 *    ...
 *  };
 *  where 'extensions' are space-separated extensions e.g. "cpp cxx hxx"
 *  and 'command' is a command to be executed.
 *  You can use empty command ("") to do nothing.
 *  You can use empty extension ("") in the end of 'oCommands' to match
 *  any file extension which was not matched by previous items.
 *
 *  The command may include:
 *  %a - AkelPad directory: "C:\Program Files\AkelPad"
 *  %d - file directory: "C:", "C:\Program Files"
 *  %e - file extension: "txt", "js"
 *  %f - file full pathname: "C:\File.txt"
 *  %n - file name: "File"
 *
 *  If a command is started with ':', this command should contain a name
 *  of internal function to be executed. For example:
 *    var oCommands = {
 *      ...
 *      "js" :
 *        ":run_js(\"%n.%e\")" ,
 *      ...
 *    };
 *    function run_js(fileName)
 *    {
 *      AkelPad.Call("Scripts::Main", 1, fileName);
 *    }
 *
 *  Note:
 *  When using a compiler or an interpreter, you can specify a command
 *  in a form of "cmd /c your-command-here || pause".
 *  This makes the console window remain in case of error from the
 *  compiler/interpreter.
 *
 **********************************************************************/


// user-defined set of file extensions and commands
var oCommands = {
  "ini nfo coder" :
    "" /* do nothing */ ,
  "bat cmd" :
    //"cmd /C \"%f\" || pause",
    ":run_cmd_bat(\"%f\")",
  // free basic
  "bas" :
    ":run_bas(\"%f\")" ,
  "sh" :
    ":run_sh(\"%f\")" ,
  "go" :
    ":run_go(\"%f\")" ,
  "js" :
    ":run_js(\"%f\")" ,
  /*
  "js" :
    ":run_js(\"%d\", \"%n.%e\")" ,
  */
  "ts" :
    ":run_typescript(\"%f\")" ,
  "c" :
  	// "cmd /c C:\\tools\\tcc\\tcc.exe -luser32 -run \"%f\" || pause" ,
  	":run_c(\"%f\")" ,
  "cpp cc cxx hxx hpp hh h" :
    ":run_cpp(\"%f\")" ,
  "java" :
    ":run_java(\"%f\")" ,
  "cs" :
    ":run_cs(\"%f\")" ,
  "awk" :
    "cmd /c %a\\Tools\\gawk\\gawk.exe -f \"%f\" || pause" ,
  "nsi nsis" :
    ":run_nsis(\"%f\")" ,
  "php phtml php3 php4 php5 php7 phps" :
    ":run_php(\"%f\")" ,
  "py pyw" :
    ":run_py(\"%f\")" ,
  "pas pp" :
    ":run_pas(\"%f\")" ,
  /*
  // free pascal
  "pas" :
    ":run_pasfile(\"%f\")" ,
  */
  "rb" :
    ":run_ruby(\"%f\")" ,
  "sass" :
    ":run_sass(\"%f\")" ,
  "scss" :
    ":run_scss(\"%f\")" ,
  "sql mysql" :
    ":run_sql(\"%f\")" ,
  "mysql" :
    ":run_mysql(\"%f\")" ,
  "txt" :
    ":run_php(\"%f\")" ,
  "xml" :
    // "cmd /c %a\\Tools\\libxml\\xmllint.exe --format \"%f\" || pause" ,
    "cmd /c %a\\Tools\\libxml\\libxml2-2.7.8.win32\\bin\\xmllint.exe --format \"%f\" || pause" ,

  // this item should be always the last one!
  "" /* apply to any remained extension */ :
    ":run_anyfile(\"%f\")"
  /* Do not add anything after this !!! */
};

/**
 * compile and run
 * Call("Log::Output", 1, `"D:\FreeBASIC\fbc.exe" "%f"`, "%d")
 */
function run_bas(filePathName, args) // 'args' is optional
{
  var cmd1 = "C:\\freebasic\\fbc.exe \"%n.%e\""; // <-- compile
  var cmd2 = buildCommandWithOptionalArgs("\"%n.exe\"", args); // <-- run
  var cmd = "cmd /c " + cmd1 + " && " + cmd2;
  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  runCommand(cmd, getFileDir(filePathName));
}

/**
 * Compile .bat .cmd
 */
function run_cmd_bat(filePathName, args) {
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd1 = "cmd /c \"\"%f\"\" || pause";
  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Batch: ["+ fileNameExt +"]\n");
  cmd = substituteVars(cmd1, filePathName);
  runCommand(cmd, getFileDir(filePathName));
}

/*
// user-defined functions...
function run_js(fileDir, fileName, args) // 'args' is optional
{
  if (fileDir.toUpperCase() == getAkelPadDir(5).toUpperCase())
  {
    // script is under AkelPad's Scripts directory
    if (args == undefined || args == "")
      AkelPad.Call("Scripts::Main", 1, fileName);
    else
      AkelPad.Call("Scripts::Main", 1, fileName, args);
  }
  else
  {
    // call default js interpreter
    var cmd = (fileDir == "") ? fileName : fileDir + "\\" + fileName;
    cmd = buildCommandWithOptionalArgs("\"" + cmd + "\"", args);
    runCommand(cmd, "", 0); // do not capture output
  }
}
*/

/**
 * Bash sh
 */
function run_sh(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd = buildCommandWithOptionalArgs("sh \"" + fileNameExt + "\"", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Bash: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}

/**
 * Node
 */
function run_js(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd = buildCommandWithOptionalArgs("node \"" + fileNameExt + "\"", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Node: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}

/**
 * TypeScript
 */
function run_typescript(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);
      
  var cmd1 = 'tsc ""' + fileNameExt +'"';

  // var cmd1 = buildCommandWithOptionalArgs("tsc \"" + fileNameExt + "\" ", args);
  var cmd2 = buildCommandWithOptionalArgs("node \"" + fileName + '.js' + "\"", args);

  var cmd = 'cmd /c "' + cmd1 + '"';
  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  setCurrentDir(getFileDir(filePathName));

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING TypeScript: ["+ fileNameExt +"]\n");
  runCommand((cmd + ' && ' + cmd2), dir);
}

/**
 * Typescript node
 */
function run_tsjs(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd = buildCommandWithOptionalArgs("ts-node \"" + fileNameExt + "\"", args);
  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Node TypeScript: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}

/**
 * Go lang
 *
 * go run $(ls -1 *.go | grep -v _test.go)
 *
 * or:
 * go run !(*_test).go
 *
 * then:
 *
 * go build && ./<executable>
 *
 * ______________________________________
 * go run . && go build && ./MainGo
 */
function run_go(filePathName, args) // 'args' is optional
{
  /*
  var dir = getFileDir(filePathName);
  var fileName = getFileName(filePathName);
  var cmd1 = 'go run . ';
  var cmd = 'cmd /c "' + cmd1 + '"';

  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  setCurrentDir(dir);

  // cmd = buildCommandWithOptionalArgs("go run \"" + fileName + "\"", args);
  AkelPad.Call("Log::Output", 5, "\n--------------- COMPILING Go:\n");
  runCommand((cmd + ' && ' + fileName), dir);
  */

  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd = buildCommandWithOptionalArgs("go run \"" + fileNameExt + "\"", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING GO: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}

/**
 * Java
 */
function run_java(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd1 = 'javac ""' + fileNameExt + '"';
  var cmd2 = buildCommandWithOptionalArgs("java -cp . \"" + fileName + "\"", args);

  var cmd = 'cmd /c "' + cmd1 + '"';
  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  setCurrentDir(getFileDir(filePathName));

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Java: ["+ fileNameExt +"]\n");
  runCommand((cmd + ' && ' + cmd2), dir);
}

/**
 * C#
 */
function run_cs(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  // csc -out:HelloWorld.exe HelloWorld.cs && HelloWorld.exe
  var cmd1 = 'csc -out:' + fileName + '.exe "' + fileNameExt + '"';

  var cmd = 'cmd /c "' + cmd1 + '"';
  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  setCurrentDir(getFileDir(filePathName));

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING C#: ["+ fileNameExt +"]\n");
  runCommand((cmd + ' && ' + fileName), dir);
}

/**
 * Pascal
 */
function run_pas(filePathName, args) // 'args' is optional
{
  var sPath = envGetVar("PATH");
  var sPathNew = sPath + ";C:\\FPC\\2.6.0\\bin\\i386-win32";
  envSetVar("PATH", sPathNew); // adding path to fpc.exe
  var cmd1 = "fpc.exe \"%f\""; // compile
  var cmd2 = buildCommandWithOptionalArgs("\"%n.exe\"", args); // run the .exe in Log::Output
//  var cmd2 = "rundll32.exe shell32,ShellExec_RunDLL \"%n.exe\""; // run the .exe
  var cmd = "cmd /c " + cmd1 + " && " + cmd2;
  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  setCurrentDir(getFileDir(filePathName));
  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Pascal:\n");
  runCommand(cmd); // run
  envSetVar("PATH", sPath); // restoring original PATH
}

/**
 * Получаем скрипт, который компилирует во FreePascal и сразу запускает полученный exe файл.
 * Проверил на WinServer2003(32) и Win7(32)
 */
function run_pasfile(filePathName)
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);
  
	var cmd1 = "fpc.exe \"%f\""; // compile
	var cmd2 = "cd \"%d\\\" && rundll32.exe shell32,ShellExec_RunDLL \"%d\\%n.exe\""; // current dir = file dir && run .exe
	var cmd = "cmd /c" + cmd1 + " && " + cmd2;
	cmd = prepareCommand(cmd, filePathName); // pre-process %f, %n etc.
	setCurrentDir(getFileDir(filePathName));
	AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING FreePascal: ["+ fileNameExt +"]\n");
	runCommand(cmd); // run
}

/**
 * PHP
 */
function run_php(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  // var cmd1 = buildCommandWithOptionalArgs("php -l \"" + fileNameExt + "\"", args);
  var cmd2 = buildCommandWithOptionalArgs("php \"" + fileNameExt + "\"", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING PHP: ["+ fileNameExt +"]\n");
  // runCommand(cmd1, dir);
  runCommand(cmd2, dir);

  /*
  var cmd2 = buildCommandWithOptionalArgs("php \"" + fileNameExt + "\"", args);
  runCommand(cmd2, dir);
  */
}

function run_sass(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd2 = buildCommandWithOptionalArgs(
    // "\"%a\\Tools\\Ruby200\\bin\\sass.bat\" --style expanded --load-path \"" + dir + "\" --trace " +
    "\"C:\\Ruby200\\bin\\sass.bat\" --style expanded --load-path \"" + dir + "\" --trace " +
    dir + "\\" + fileName + ".sass:" + dir + "\\" + fileName + ".css"
    , args
  );

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING SASS: ["+ fileNameExt +"]\n");
  // runCommand(cmd2, dir);
  runLogOutputCmd(cmd2, dir);
  AkelPad.Call("Log::Output", 5, "PROCESS FINISHED");
  // WScript.Echo("PROCESS FINISHED");

}

function run_scss(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd2 = buildCommandWithOptionalArgs(
  	// "\"%a\\Tools\\Ruby200\\bin\\sass.bat\" --style expanded --load-path \"" + dir + "\" --trace " +
    "\"C:\\Ruby200\\bin\\sass.bat\" --style expanded --load-path \"" + dir + "\" --trace " +
    dir + "\\" + fileName + ".scss:" + dir + "\\" + fileName + ".css"
    , args
  );

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING SCSS: ["+ fileNameExt +"]\n");
  // runCommand(cmd2, dir);
  runLogOutputCmd(cmd2, dir);
  AkelPad.Call("Log::Output", 5, "PROCESS FINISHED\n");
  // WScript.Echo("PROCESS FINISHED");

}

/**
 * MySQL
 */
function run_sql(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  // var cmd1 = buildCommandWithOptionalArgs("php -l \"" + fileNameExt + "\"", args);
  var cmd2 = buildCommandWithOptionalArgs("%a\\Tools\\MySQLex\\mysqlex.bat \"" + fileNameExt + "\" ", args);

  if ( fileNameExt === 'mysql' ) {
  	AkelPad.Call("Log::Output", 1, cmd2, "", "", "", -1, -1, 8388609);
  	return '';
  }

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING MySQL: ["+ fileNameExt +"]\n");
  // runCommand(cmd1, dir);
  runCommand(cmd2, dir);

  /*
  var cmd2 = buildCommandWithOptionalArgs("php \"" + fileNameExt + "\"", args);
  runCommand(cmd2, dir);
  */
}

/**
 * MySQL results in new tab
 */
function run_mysql(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  // var cmd1 = buildCommandWithOptionalArgs("php -l \"" + fileNameExt + "\"", args);
  var cmd2 = buildCommandWithOptionalArgs("%a\\Tools\\MySQLex\\mysqlex.bat \"" + fileNameExt + "\" ", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING MySQL: ["+ fileNameExt +"]\n");
  AkelPad.Call("Log::Output", 1, cmd2, "", "", "", -1, -1, 8388609);

  // runCommand(cmd1, dir);
  runCommand(cmd2, dir);

  /*
  var cmd2 = buildCommandWithOptionalArgs("php \"" + fileNameExt + "\"", args);
  runCommand(cmd2, dir);
  */
}

/**
 * Python
 */
function run_py(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd = buildCommandWithOptionalArgs("python \"" + fileNameExt + "\"", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Python: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}

/**
 * Ruby
 */
function run_ruby(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var cmd = buildCommandWithOptionalArgs("ruby \"" + fileNameExt + "\"", args);

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING Ruby: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}

/**
 * C
 * will show output when file will be compiled (compile twice)

   	// gcc -o Hello Hello.c && Hello
    // "cmd /c %a\\Tools\\tcc.exe -luser32 -run \"%f\" || pause" ,
    "cmd /c %a\\Tools\\mingw64\\bin\\gcc.exe \"%f\"" ,
 */
function run_c(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);

  var compilerExe = "%a\\Tools\\mingw64\\bin\\gcc.exe";

  var cmd1 = buildCommandWithOptionalArgs(
  	"cd \"%d\\\" && \"" + compilerExe + "\" -o \"%n.exe\" \"%d\\%n.c\"", args
  , args);

  var cmd2 = buildCommandWithOptionalArgs("\"%n.exe\"", args);
  var cmd = "cmd /c " + cmd1 + " && " + cmd2 ;
  cmd = substituteVars(cmd, filePathName);

  //AkelPad.Call("Log::Output", 5, cmd);

  cmd = substituteVars(cmd, filePathName); // pre-process %f, %n etc.
  setCurrentDir(getFileDir(filePathName));

  AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING C: ["+ fileNameExt +"]\n");
  runCommand(cmd, dir);
}


/**
 * C++
 */
function run_cpp(filePathName, args) // 'args' is optional
{
  var dir = getFileDir(filePathName),
      fileName = getFileName(filePathName),
      fileNameExt = getFileNameExt(filePathName);
      
  var useMinGW = true;
  if (useMinGW)
  {
  /**
	 * MinGW G++
	 */
    var compilerExe = "%a\\Tools\\mingw64\\bin\\g++.exe";
	/*
    AkelPad.Call("Log::Output", 5, compilerExe);
	  return ;
	*/

    var compilerDir = getFileDir(compilerExe);

    // cmd1: compile the source file (object file is created)
    var cmd1 = buildCommandWithOptionalArgs(compilerExe + " -c \"%f\" -o \"%d\\%n.o\"", args);

    // cmd2: create the executable (from the object file)
    var cmd2 = buildCommandWithOptionalArgs(compilerExe + " \"%d\\%n.o\" -o \"%d\\%n.exe\"", args);

    // cmd3: run the executable
    var cmd3 = buildCommandWithOptionalArgs("\"%d\\%n.exe\"", args);

    // cmd: the whole command line
    var cmd = "cmd /c " + cmd1 + " && " + cmd2 + " && " + cmd3 + " || pause";

    cmd = substituteVars(cmd, filePathName);

    /*
    WScript.Echo(cmd);
    return ;
    */

    AkelPad.Call("Log::Output", 5, "\n\n--------------- COMPILING C++: ["+ fileNameExt +"]\n");
    runCommand(cmd, compilerDir);
  }
  else
  {
    /*  Visual Studio 9 (2008)  */
    var sProgramFiles = envGetVar("ProgramFiles");
    var sProgramFilesx86 = envGetVar("ProgramFiles(x86)");
    if (sProgramFilesx86.length == 0)
      sProgramFilesx86 = sProgramFiles;
    else
      sProgramFiles = sProgramFilesx86.substr(0, sProgramFilesx86.length - 6);
    var sVcDir = sProgramFilesx86 + "\\Microsoft Visual Studio 9.0\\VC";
    var sVsCommon = sProgramFilesx86 + "\\Microsoft Visual Studio 9.0\\Common7\\IDE";
    var sMsSDK = sProgramFiles + "\\Microsoft SDKs\\Windows\\v6.0A";
    // update PATH environment variable...
    var sPath = envGetVar("PATH");
    var sPathNew = sVcDir + "\\bin;" + sMsSDK + "\\bin;" + sVsCommon + ";" + sPath;
    envSetVar("PATH", sPathNew); //WScript.Echo(envGetVar("PATH"));
    // update INLUDE environment variable...
    var sInclude = envGetVar("INCLUDE");
    var sIncludeNew = sMsSDK + "\\include;" + sVcDir + "\\include;" + sInclude;
    envSetVar("INCLUDE", sIncludeNew); //WScript.Echo(envGetVar("INCLUDE"));
    // update LIB environment variable...
    var sLib = envGetVar("LIB");
    var sLibNew = sMsSDK + "\\lib;" + sVcDir + "\\lib;" + sLib;
    envSetVar("LIB", sLibNew); //WScript.Echo(envGetVar("LIB"));
    // compile...
    var fileDir = getFileDir(filePathName);
    var cmd1 = "cl /O1 \"%f\" /link kernel32.lib user32.lib comctl32.lib gdi32.lib Advapi32.lib ole32.lib Oleaut32.lib";
    var cmd2 = buildCommandWithOptionalArgs("\"%d\\%n.exe\"", args);
    var cmd = "cmd /c " + cmd1 + " && " + cmd2 + " || pause";
    cmd = substituteVars(cmd, filePathName);
    //WScript.Echo(cmd);
    runCommand(cmd, fileDir);
    // restore original environment variables...
    envSetVar("PATH", sPath);
    envSetVar("INCLUDE", sInclude);
    envSetVar("LIB", sLib);
  }
}

function run_nsis(filePathName, args) // 'args' is optional
{
  var sProgramFiles = getProgramFilesDir("x86");
  var cmd = "\"" + sProgramFiles + "\\NSIS\\makensisw.exe\" \"" + filePathName + "\"";
  cmd = buildCommandWithOptionalArgs(cmd, args);
  runCommand(cmd, "", 0); // do not capture output
}

function run_anyfile(filePathName, args) // 'args' is optional
{
  var cmd = "rundll32.exe shell32,ShellExec_RunDLL \"" + filePathName + "\"";
  cmd = buildCommandWithOptionalArgs(cmd, args);
  runCommand(cmd, "", 0); // do not capture output
}

/* Explicitly defined extensions to recognize supported file types
   that may be extracted from the selected text.
   This function applies to any remaining extension that was not
   handled by any item from 'oCommands' prior to the last one.
   It's needed to filter strings like "some text.other text" that
   do not look like a valid file name.
*/
function isSupportedFileExtFromSelectedText(fileExt)
{
  var supportedExts = "bat bmp cmd doc docx exe gif htm html ico ini jpg msi nfo png reg rtf shtm shtml txt xls xlsx xml";
  return isOneOf(fileExt, supportedExts);
}

/* Helper function: when the optional argument 'args' exists,
   it is appended to the command 'cmd'.
*/
function buildCommandWithOptionalArgs(cmd, args)
{
  if (args != undefined)
  {
    if (args != "")
    {
      cmd = cmd + " " + args;
    }
  }
  return cmd;
}


///////////////////////////////////////////////////////////////////////
// script engine, do not modify...

AkelPad.ScriptNoMutex(4 /*ULT_LOCKMULTICOPY*/ );

if (!selfTest())
{
  WScript.Quit();
}

var oSys = undefined;
RunFile(GetCurrentFileInfo());

function GetCurrentFileInfo()
{
  var currentFile = {};
  currentFile.pathName = AkelPad.GetEditFile(0);
  currentFile.isModified = AkelPad.GetEditModified(0);

  // check if the selected text specifies a file
  var s = AkelPad.GetSelText();
  if (s != undefined)
  {
    if (s.length > 0)
    {
      // not empty
      if ((s.indexOf("\n") < 0) && (s.indexOf("\r") < 0))
      {
        // not multi-line
        var sExt = getFileExt(s);
        if ((sExt.length > 0) && (sExt.length < 10))
        {
          var ext = getCommandItemExt(sExt); // extension(s) from 'oCommands'
          if ((ext != undefined) &&
              (ext != "" || isSupportedFileExtFromSelectedText(sExt)))
          {
            // strings like "some text.other text" are filtered above
            s = s.replace(/\//g, "\\"); // all '/' to '\'
            currentFile.pathName = substituteVars(s, currentFile.pathName);
            currentFile.isModified = false;
          }
        }
      }
    }
    delete s;
  }

  if (currentFile.pathName.toUpperCase() == WScript.ScriptFullName.toUpperCase())
  {
    WScript.Echo("Don\'t want to execute self :)");
    WScript.Quit();
  }

  return currentFile;
}

function RunFile(currentFile)
{
  var fileExt = getFileExt(currentFile.pathName);
  if (fileExt.length > 0)
  {
    var ext = getCommandItemExt(fileExt);
    if (ext != undefined)
    {
      var cmd = oCommands[ext];
      if (cmd.length > 0)
      {
        if (currentFile.isModified)
          AkelPad.Command(4105); // save file

        if (WScript.Arguments.length > 0)
        {
          if (WScript.Arguments(0) == "1") // Command line...
          {
            var oSettings;
            var cmd1;
            var cmd2;

            cmd1 = undefined;
            oSettings = AkelPad.ScriptSettings();
            if (oSettings.Begin(WScript.ScriptBaseName, 0x1 /*POB_READ*/))
            {
              cmd1 = oSettings.Read(ext, 3 /*PO_STRING*/);
              oSettings.End();
            }
            if ((cmd1 == undefined) || (cmd1 == ""))
            {
              cmd1 = cmd;
            }
            cmd2 = AkelPad.InputBox(AkelPad.GetMainWnd(), WScript.ScriptName, "command:", cmd1);
            if (cmd2 == undefined)
              WScript.Quit(); // 'Cancel' pressed

            if (cmd2 != cmd1)
            {
              // This may save an empty cmd2 - such case has the special
              // meaning: it allows to use (restore) the default cmd.
              if (oSettings.Begin(WScript.ScriptBaseName, 0x2 /*POB_SAVE*/))
              {
                oSettings.Write(ext, 3 /*PO_STRING*/, cmd2);
                oSettings.End();
              }
            }
            if (cmd2 == "")
              WScript.Quit(); // Empty command line, nothing to do

            cmd = cmd2;
          }
        }

        cmd = substituteVars(cmd, currentFile.pathName);
        if (cmd.charAt(0) == ':')
        {
          cmd = cmd.replace(/\\/g, "\\\\");
          eval(cmd.substr(1));
        }
        else
        {
          runCommand(cmd, "");
        }
      }
    }
    else
      WScript.Echo("No matched extension found!");
  }
  else
    WScript.Echo("File extension is empty!");
}

function getCommandItemExt(fileExt)
{
  fileExt = fileExt.toLowerCase();
  for (var ext in oCommands)
  {
    ext = ext.toLowerCase();
    if ((ext.length == 0) || isOneOf(fileExt, ext))
      return ext;
  }
  return undefined;
}

function envGetVar(varName)
{
  var varValue = "";
  var lpBuffer;
  if (lpBuffer = AkelPad.MemAlloc(8192*_TSIZE))
  {
    if (oSys == undefined)
      oSys = AkelPad.SystemFunction();
    oSys.Call("kernel32::GetEnvironmentVariable" + _TCHAR, varName, lpBuffer, 8192);
    varValue = AkelPad.MemRead(lpBuffer, _TSTR);
    AkelPad.MemFree(lpBuffer);
  }
  return varValue;
}

function envSetVar(varName, varValue)
{
  if (oSys == undefined)
    oSys = AkelPad.SystemFunction();
  oSys.Call("kernel32::SetEnvironmentVariable" + _TCHAR, varName, varValue);
}

function getCurrentDir()
{
  var dir = "";
  var lpBuffer;
  if (lpBuffer = AkelPad.MemAlloc(8192*_TSIZE))
  {
    if (oSys == undefined)
      oSys = AkelPad.SystemFunction();
    oSys.Call("kernel32::GetCurrentDirectory" + _TCHAR, 8192, lpBuffer);
    dir = AkelPad.MemRead(lpBuffer, _TSTR);
    AkelPad.MemFree(lpBuffer);
  }
  return dir;
}

function setCurrentDir(dir)
{
  if (oSys == undefined)
    oSys = AkelPad.SystemFunction();
  oSys.Call("kernel32::SetCurrentDirectory" + _TCHAR, dir);
}

function getProgramFilesDir(bits)
{
  var sProgramFiles = envGetVar("ProgramFiles");
  var sProgramFilesx86 = envGetVar("ProgramFiles(x86)");
  if (sProgramFilesx86.length == 0)
    sProgramFilesx86 = sProgramFiles;
  else if (sProgramFiles.length == 0)
    sProgramFiles = sProgramFilesx86.substr(0, sProgramFilesx86.length - 6);

  if (bits == undefined || bits != 32 || bits != "x86")
    return sProgramFiles;
  else
    return sProgramFilesx86;
}

function getAkelPadDir(adtype)
{
  var s = AkelPad.GetAkelDir(adtype);
  return s;
}

function getFileExt(filePathName) // file extension w/o leading '.'
{
  var n = filePathName.lastIndexOf(".");
  return (n >= 0) ? filePathName.substr(n + 1) : "";
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

function isFullPath(filePathName)
{
  return /^([A-Za-z]\:)|(\\\\)/.test(filePathName);
}

function isOneOf(s, t) // t includes s
{
  var s1 = " " + s + " ";
  var t1 = " " + t + " ";
  return (t1.indexOf(s1) >= 0);
}

function substituteVars(cmd, filePathName)
{
  if (cmd.indexOf("%a") >= 0)
  {
    cmd = cmd.replace(/%a/g, getAkelPadDir(0));
  }
  if (cmd.indexOf("%d") >= 0)
  {
    cmd = cmd.replace(/%d/g, getFileDir(filePathName));
  }
  if (cmd.indexOf("%e") >= 0)
  {
    cmd = cmd.replace(/%e/g, getFileExt(filePathName));
  }
  if (cmd.indexOf("%f") >= 0)
  {
    cmd = cmd.replace(/%f/g, filePathName);
  }
  if (cmd.indexOf("%n") >= 0)
  {
    cmd = cmd.replace(/%n/g, getFileName(filePathName));
  }
  return cmd;
}

function runCommand(cmd, dir, captureOutput)
{
  if (captureOutput == undefined || captureOutput != 0)
  {
    // by default, capture output
    if (/[ ]*\|\|[ ]*pause[ ]*$/.test(cmd))
    {
      // exclude trailing "|| pause" from 'cmd' if present
      var n = cmd.lastIndexOf("||");
      cmd = cmd.substr(0, n);
    }
    runLogOutputCmd(cmd, dir);
  }
  else
  {
    if (dir == undefined || dir == "")
    {
      var WshShell = new ActiveXObject("WScript.Shell");
      try
      {
        WshShell.Run(cmd, 1, false);
      }
      catch (error)
      {
        var hMainWnd = AkelPad.GetMainWnd();
        var s = "Failed to execute:\n  " + cmd;
        AkelPad.MessageBox(hMainWnd, s, WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
      }
    }
    else
    {
      AkelPad.Exec(cmd, dir);
    }
  }
}

function runLogOutputCmd(cmd, dir)
{
  var lpState;

  // the command (child process) is about to be run...
  AkelPad.Call("Log::Output", 1, cmd, dir);

  // wait until the child process will actually be started...
  lpState = AkelPad.MemAlloc(4 /*sizeof(DWORD)*/);
  if (lpState)
  {
    var nState = -1;

    while (nState != 0 && nState < 4)
    {
      AkelPad.Call("Log::Output", 3, lpState);
      nState = AkelPad.MemRead(lpState, 3 /*DT_DWORD*/);
      //AkelPad.Call("Log::Output", 5, "State: " + dwState + "\n");
      WScript.Sleep(200);
    }

    AkelPad.MemFree(lpState);
  }
  else
  {
    // wait to be sure the process has been started
    WScript.Sleep(2000);
  }
}

function selfTest()
{
  if (oCommands == undefined)
  {
    WScript.Echo("\'oCommands\' is undefined.\nNothing to do.");
    return false;
  }

  var isEmpty = true;
  var hasEmptyExt = false;
  for (var ext in oCommands)
  {
    if (ext == undefined)
    {
      WScript.Echo("Undefined extension found.\nCan not proceed.");
      return false;
    }
    if (oCommands[ext] == undefined)
    {
      WScript.Echo("oCommands[\"" + ext + "\"]: command is undefined.\nCan not proceed.");
      return false;
    }
    if (hasEmptyExt)
    {
      WScript.Echo("Empty extension found while there are more items below.\nEmpty extension matches any remaining file extension, so such item\nshould be the last (otherwise all the further items will be ignored).");
      return false;
    }
    if (ext.length == 0)
    {
      hasEmptyExt = true;
    }
    isEmpty = false;
  }

  if (isEmpty)
  {
    WScript.Echo("\'oCommands\' is empty.\nNothing to do.");
    return false;
  }

  return true;
}
