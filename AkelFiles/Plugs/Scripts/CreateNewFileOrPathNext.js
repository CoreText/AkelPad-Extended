// AZJIO 02.04.2020 / texter
//
// Description(1033): Create a new file next to the current document.
// Description(1049): Создать новый файл рядом с текущим документом.
//
// Arguments:════════════════════════════════════════════════════════════════════════╗
// ║ bSelected (1 or 0) - use selection to create filenames and paths (default is 1) ║
// ║ bFullPath (1 or 0) - create file, or edit current path (default is 1)           ║
// ║ bCopyFile (1 or 0) - copy file instead of simple creating (default is 0)        ║
// ╚═════════════════════════════════════════════════════════════════════════════════╝
// Usage:
//   Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js")
//   "Create new file in the same directory" Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js") Icon("%a\AkelFiles\icons\ToolbarEx.dll", 0)
//   "Copy file to some directory" Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js", "-bSelected=1 -bFullPath=1 -bCopyFile=1")
//
// Possible key bindings:═══════════════════════════╗
// ║ Alt+N      - Create new file in same dir       ║ Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js", "-bSelected=1 -bFullPath=0")
// ║ Ctrl+Alt+N - Create new file and edit the path ║ Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js", "-bSelected=1 -bFullPath=1")
// ╚════════════════════════════════════════════════╝
var hMainWnd  = AkelPad.GetMainWnd();
var sEditFile = AkelPad.GetEditFile(0);
var sFileFolder = AkelPad.GetFilePath(sEditFile, 1);
var sFileExt = AkelPad.GetFilePath(sEditFile, 4 /*CPF_FILEEXT*/ );
var sNewName = "new";
var sFileDir;
var sFullPath;
var FilePath;
var sSelectedText;
var pSlash = "\\";
var oError;

// script arguments
var bSelected = AkelPad.GetArgValue("bSelected", 1);
var bFullPath = AkelPad.GetArgValue("bFullPath", 1);
var bCopyFile = AkelPad.GetArgValue("bCopyFile", 0);

var fso = new ActiveXObject("Scripting.FileSystemObject");

if ((! sFileFolder) || (! fso.FolderExists(sFileFolder)))
{ // если каталог удалён, например файл из архива в %temp%
  // if (! fso.FileExists(sEditFile)) // если файл удалён, но в принципе создать файл в той же папке можно
  popupShow("THE FOLDER OF THE FILE IS NOT FOUND!");
  WScript.Quit();
}

//////////////////////////////////////////////////////////////////////////

if (bSelected)
{
  var sSelectedText = (AkelPad.GetSelText()).replace(/^\s+|\s+$/g, "").replace(/\//g, "\\");
  if (sSelectedText && (sSelectedText.length <= 255))
    sNewName = HandleSelected(sSelectedText);
}

FilePath = AkelPad.InputBox(hMainWnd, "New File In Path", "File Name", BuildFullFilePath());
FilePath = ParseThePath(FilePath);

if (! FilePath)
  WScript.Quit();
else if ((bFullPath && fso.FileExists(FilePath)) || ((! bFullPath) && fso.FileExists(sFileFolder + "\\" + FilePath)))
{
  sNewName = AkelPad.GetFilePath(FilePath, 3);
  sFileExt = AkelPad.GetFilePath(FilePath, 4);
  sNewName = FilePath.slice(0, FilePath.lastIndexOf("." + sFileExt));

  do {
    FilePath = AkelPad.InputBox(hMainWnd, "File In Path Already Exists!", "New File Name", BuildFullFilePath(sNewName, "no"));
    if (FilePath)
    {
      sFileExt = AkelPad.GetFilePath(FilePath, 4);
      sNewName = FilePath.slice(0, FilePath.lastIndexOf("." + sFileExt));
      FilePath = ParseThePath(FilePath);
    }
    else
    {
      WScript.Quit();
      break;
    }
  } while ((bFullPath && fso.FileExists(FilePath)) || ((! bFullPath) && fso.FileExists(sFileFolder + "\\" + FilePath)));

  if (! FilePath)
    WScript.Quit();
}

if (! fso.FolderExists(sFileFolder))
  sFileFolder = AkelPad.GetFilePath(sEditFile, 1);

sFileDir = (bFullPath) ? AkelPad.GetFilePath(FilePath, 1) : AkelPad.GetFilePath(sFileFolder + "\\" + FilePath, 1);
sFullPath = (bFullPath) ? FilePath : sFileFolder + "\\" + FilePath;

if (! fso.FolderExists(sFileDir))
{
  var confirmation = AkelPad.MessageBox(hMainWnd, FilePath, "Create New File In New Path?", 33);
  if (confirmation === 1)
  {
    try
    {
      sFileDir = fso.CreateFolder(sFileDir);
    }
    catch (oError)
    {
      AkelPad.MessageBox(0, Error.message + "\n\n" + oError.description, WScript.ScriptName, 48);
    }
  }
  else
    WScript.Quit();

  if (! sFileDir)
    WScript.Quit();
}

if (FilePath)
{
  try
  {
    if (bCopyFile)
      fso.CopyFile(sEditFile, sFullPath, false);  // можно копировать со старым содержимым
    else
      fso.CreateTextFile(sFullPath, false, true); // флаги UTF8, без перезаписи
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, Error.message + "\n\n" + oError.description, WScript.ScriptName, 48);
  }
}

if (fso.FileExists(sFullPath))
  AkelPad.OpenFile(sFullPath);

//////////////////////////////////////////////////////////////////////////

/**
 * If the text is selected - use selection as a new file path.
 * @TODO: refactor, or do some interesting stuff
 *
 * @param string selected text
 * @return string of new file name
 */
function HandleSelected(sSelectedTxt)
{
  var sTmp = sSelectedTxt = sSelectedText || "";
  var rMatch;

  if (sSelectedTxt.substr(0, 1) === "\\")
    sSelectedTxt = sSelectedTxt.replace(/^\\/, "");

  if (~sSelectedTxt.indexOf("..\\"))
  {
    rMatch = sSelectedTxt.match(/(\.\.)+?/g);
    if (typeof rMatch === "object")
    {
      for (var i = 0, nLen = rMatch.length; i < nLen; i++)
        sFileFolder = AkelPad.GetFilePath(sFileFolder, 1);
    }
    else
      sFileFolder = AkelPad.GetFilePath(sFileFolder, 1);
  }

  if (~sSelectedTxt.indexOf(".")) {
    if (~sSelectedTxt.indexOf("*"))
    {
      sNewName = sSelectedTxt.replace("\*", sNewName);
      sFileExt = AkelPad.GetFilePath(sSelectedTxt, 4 );
      sNewName = sNewName.replace("."+sFileExt, "");
    }
    else
    {
      sNewName = AkelPad.GetFilePath(sSelectedTxt, 3 );
      sFileExt = AkelPad.GetFilePath(sSelectedTxt, 4 );
    }
  }
  else
  {
    sNewName = sSelectedTxt;
    if (~sSelectedTxt.indexOf("."))
      sFileExt = "";
  }
  
  sNewName = sNewName.replace(/^\s+|\s+$/g, "");
  return (bFullPath)? correctFileNameFull(sNewName) : correctFileName(sNewName);
}

/**
 * Parse and sanitize the user's input.
 *
 * @param string sFileP
 * @return string sFileP
 */
function ParseThePath(sFileP)
{
  var sFileP = sFileP || "",
      rMatch, oError;

  if (! sFileP)
    return "";

  try
  {
    sFileP = sFileP.replace(/\/+/g         , "\\")
                   .replace(/(\/\\)+/g     , "\\")
                   .replace(/\\\\+/g       , "\\")
                   .replace(/\\\\+/g       , "\\")
                   .replace(/\\\.\\/g      , "\\\.\.\\")
                   .replace(/\\\.\\/g      , "\\\.\.\\")
                   .replace(/(\\\.\.\.+)+/g, "\\\.\.")
                   .replace(/^\s+|\s+$/g   , "");

    if (sFileP.substr(0, 2) === ".\\")
      sFileP = sFileP.replace(/^\.\\/, "");
    if (sFileP.substr(0, 1) === "\\")
      sFileP = sFileP.replace(/^\\/, "");

    if (~sFileP.indexOf("..\\"))
    {
      rMatch = sFileP.match(/(\.\.\\)+?/g);
      sFileP = sFileP.replace(/(\.\.\\)+/g, "");

      if (typeof rMatch === "object")
      {
        for (var i = 0, nLen = rMatch.length; i < nLen; i++)
          sFileFolder = AkelPad.GetFilePath(sFileFolder, 1);
      }
    }

  }
  catch (oError)
  {
    AkelPad.MessageBox(0, "Error: \n\n"+ Error.message + "\n\n" + oError.description, WScript.ScriptName, 48);
  }

  sFileP = sFileP.replace(/^\s+|\s+$/g, "");
  return (bFullPath)? correctFileNameFull(sFileP) : correctFileName(sFileP);
}

/**
 * Build the full file name path.
 *
 * @param stirng sName
 * @param stirng|bool sAddDir
 * @return string - file full path
 */
function BuildFullFilePath(sName, sAddDir)
{
  var strName = sName || sNewName,
      bWithFullPath = sAddDir || true,
      strFilePath = "";

  if (strName.substr(0, 1) === "\\")
    strName = strName.replace(/^\\/, "");
    
  strName = strName.replace(/^\s+|\s+$/g, "");

  if (! fso.FolderExists(sFileFolder))
    sFileFolder = AkelPad.GetFilePath(sEditFile, 1);

  strFilePath = ((! bFullPath || bWithFullPath === "no") ? "" : sFileFolder + "\\") + (strName ? strName : "new") + (sFileExt ? "." + sFileExt : "");

  function fFullNameIncrement(sArg)
  {
    var i = 0,
      strFilePathIncrement = sArg;
    do {
      i += 1;
      strFilePathIncrement = ((bWithFullPath === "no") ? "" : sFileFolder + "\\") + (strName ? strName : "new") + ("_" + i) + (sFileExt ? "." + sFileExt : "");
    }
    while (fso.FileExists(strFilePathIncrement))
    return strFilePathIncrement;
  }

  function fNameIncrement(sArg)
  {
    var i = 0,
      strFilePathIncrement = sArg;
    do {
      i += 1;
      strFilePathIncrement = (strName ? strName : "new") + ("_" + i) + (sFileExt ? "." + sFileExt : "");
    }
    while (fso.FileExists(sFileFolder + '\\' + strFilePathIncrement))
    return strFilePathIncrement;
  }

  if (bFullPath && fso.FileExists(strFilePath))
    strFilePath = fFullNameIncrement(strFilePath);
  else if ((! bFullPath) && fso.FileExists(sFileFolder + '\\' + strFilePath))
    strFilePath = fNameIncrement(strFilePath);

  return strFilePath;
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
 * Get the file name.
 *
 * @param string
 * @return string
 */
function getFileName(pFile)
{
	return pFile.slice(pFile.lastIndexOf(pSlash) + 1);
}

/**
 * Возвращает имя файла БЕЗ расширения.
 *
 * @param string pFile
 * @return string pFileName
 */
function getFileNameOnly(pFile)
{
	var pFileName = getFileName(pFile);
	var pos = pFileName.lastIndexOf(".");
	if (pos !== -1)
		pFileName = pFileName.slice(0, pos);
	return pFileName;
}

/**
 * Возвращает полное имя папки БЕЗ закрывающего \
 *
 * @param string pFile
 * @return string pDir
 */
function getParent(pFile)
{
	var pDir = "";
	var pozLastSep = pFile.lastIndexOf(pSlash);
	if (pozLastSep !== -1)
		pDir = pFile.slice(0, pozLastSep);
	return pDir;
}

/**
 * Remove inadmissible symbols (from wisgest).
 *
 * @param string pFileNameOnly
 * @return string pFileNameOnly sanitized
 */
function correctFileName(pFileNameOnly)
{
	pFileNameOnly = pFileNameOnly.replace(/\t/g, " ");		    // валим табуляции, т.к. диалог с ними иногда просто не отображается
	pFileNameOnly = pFileNameOnly.replace(/  /g, " ");		    // убираем повторяющиеся пробелы
	return pFileNameOnly.replace(/[\\\/:\*\?"{}<>\|]/g, "");
}

/**
 * Sanitize the given full path.
 *
 * @param string pFile
 * @return string
 */
function correctFileNameFull(pFile)
{
	pFileNameOnly = getFileName(pFile);
	pFileNameOnly = correctFileName(pFileNameOnly);
	return getParent(pFile) + pSlash + pFileNameOnly;
}
