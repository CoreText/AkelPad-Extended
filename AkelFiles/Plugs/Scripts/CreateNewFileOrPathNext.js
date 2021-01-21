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
//   "Create new file in same directory" Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js") Icon("%a\AkelFiles\icons\ToolbarEx.dll", 0)
//   "Copy File to some directory" Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js", "-bSelected=1 -bFullPath=1 -bCopyFile=1")
//
// The hot keys you could bind:═════════════════════╗
// ║ Alt+N      - Create new file in same dir       ║ Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js", "-bSelected=1 -bFullPath=0")
// ║ Ctrl+Alt+N - Create new file and edit the path ║ Call("Scripts::Main", 1, "CreateNewFileOrPathNext.js", "-bSelected=1 -bFullPath=1")
// ╚════════════════════════════════════════════════╝
var hMainWnd  = AkelPad.GetMainWnd();
var sEditFile = AkelPad.GetEditFile(0);
var FilePath;
var sFileFolder = AkelPad.GetFilePath(sEditFile, 1);
var sNewName = "new";
var sFileExt = AkelPad.GetFilePath(sEditFile, 4 /*CPF_FILEEXT*/ );
var sSelectedText;
var bSelected = AkelPad.GetArgValue("bSelected", 1);
var bFullPath = AkelPad.GetArgValue("bFullPath", 1);
var bCopyFile = AkelPad.GetArgValue("bCopyFile", 0);
var oError;

var fso = new ActiveXObject("Scripting.FileSystemObject");

if ((! sFileFolder) || (! fso.FolderExists(sFileFolder)))
{ // если каталог удалён, например файл из архива в %temp%
  // if (! fso.FileExists(sEditFile)) // если файл удалён, но в принципе создать файл в той же папке можно
  PopupShow("THE FOLDER OF THE FILE IS NOT FOUND!");
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
    }
  } while ((bFullPath && fso.FileExists(FilePath)) || ((! bFullPath) && fso.FileExists(sFileFolder + "\\" + FilePath)));

  if (! FilePath)
    WScript.Quit();
}

var sFileDir = (bFullPath) ? AkelPad.GetFilePath(FilePath, 1) : AkelPad.GetFilePath(sFileFolder + "\\" + FilePath, 1);
var sFullPath = (bFullPath) ? FilePath : sFileFolder + "\\" + FilePath;

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
 * Show the popup.
 *
 * @param sContent of the popup
 * @param sTitle of the popup
 * @param nSec seconds
 * @return bool|obj WScript.Shell
 */
function PopupShow(sContent, sTitle, nSec)
{
  var nSeconds = nSec || 2,
      strContent = sContent || WScript.ScriptFullName,
      strTitle = sTitle || WScript.Name;

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

  return sNewName;
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
