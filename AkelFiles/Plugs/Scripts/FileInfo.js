// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9791#9791
// Version: 2016-06-21
// Author: KDJ
//
// *** File info and text statistics ***
//
// Required to include: ChooseFont_function.js and FileAndStream_functions.js
//
// Usage:
//   Call("Scripts::Main", 1, "FileInfo.js")               - without arguments - shows dialog box
//   Call("Scripts::Main", 1, "FileInfo.js", "0")          - general statistics all
//   Call("Scripts::Main", 1, "FileInfo.js", "1")          - detailed statistics all
//   Call("Scripts::Main", 1, "FileInfo.js", "1 CL")       - detailed statistics of chars and lines only
//   Call("Scripts::Main", 1, "FileInfo.js", "0 W 2")      - general statistics of words, outupt in log window
//   Call("Scripts::Main", 1, "FileInfo.js", "1 CWL 2 -1") - detailed statistics all, outupt in log window, sort by statistics descending
//
// First argument:
//   0 - general
//   1 - details
// Second argument (default is "CWL"):
//   C - chars
//   W - words
//   L - lines
// Third argument, output:
//  -1 - MDI mode - output in new tab, SDI - output in log window (default)
//   0 - output in new window
//   1 - output in new tab (MDI), SDI - output in new window
//   2 - output in log window
// Fourth argument, sort by statistics:
//  -1 - sort descending
//   0 - not sort
//   1 - sort ascending
//
// Note:
//   This script should be saved in Unicode format

var DT_QWORD  = 2;
var DT_DWORD  = 3;
var DT_WORD   = 4;
var oSys      = AkelPad.SystemFunction();
var hMainWnd  = AkelPad.GetMainWnd();
var hEditWnd  = AkelPad.GetEditWnd();
var hInstDLL  = AkelPad.GetInstanceDll();
var bChars    = 1;
var bWords    = 1;
var bLines    = 1;
var bCharsDet = 0;
var bWordsDet = 0;
var bLinesDet = 0;
var bSort     = 0;
var bDesc     = 0;
var nOutput   = -1;
var bFont     = 0;
var aFontOut;

if ((! hEditWnd) || (! AkelPad.Include("ChooseFont_function.js")) || (! AkelPad.Include("FileAndStream_functions.js")))
  WScript.Quit();

GetLangStrins();

if (WScript.Arguments.length)
{
  if (WScript.Arguments(0) == "1")
  {
    bCharsDet = 1;
    bWordsDet = 1;
    bLinesDet = 1;
  }

  if (WScript.Arguments.length > 1)
  {
    bChars = /C/i.test(WScript.Arguments(1));
    bWords = /W/i.test(WScript.Arguments(1));
    bLines = /L/i.test(WScript.Arguments(1));
  }

  if (WScript.Arguments.length > 2)
  {
    nOutput = parseInt(WScript.Arguments(2));

    if (isNaN(nOutput) || (nOutput < 0) || (nOutput > 2))
      nOutput = -1;
  }

  if (WScript.Arguments.length > 3)
  {
    bSort = parseInt(WScript.Arguments(3));

    if (isNaN(bSort))
      bSort = 0;
    else if (bSort > 0)
      bDesc = 0;
    else if (bSort < 0)
      bDesc = 1;
  }
}
else
{
  var sClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + hInstDLL;
  var hDlg;
  var bOK;

  var IDSTATSG   = 1000;
  var IDALLG     = 1001;
  var IDCHARS    = 1002;
  var IDCHARSDET = 1003;
  var IDWORDS    = 1004;
  var IDWORDSDET = 1005;
  var IDLINES    = 1006;
  var IDLINESDET = 1007;
  var IDALL      = 1008;
  var IDALLDET   = 1009;
  var IDOUTPUTG  = 1010;
  var IDWND      = 1011;
  var IDTAB      = 1012;
  var IDLOG      = 1013;
  var IDFONT     = 1014;
  var IDFONTSETB = 1015;
  var IDSORT     = 1016;
  var IDDESC     = 1017;
  var IDOKB      = 1018;
  var IDCANCELB  = 1019;

  ReadWriteIni(0);
  if (! aFontOut)
    aFontOut = ConvertFontFormat(AkelPad.SendMessage(hEditWnd, 49 /*WM_GETFONT*/, 0, 0), 2, 3);

  AkelPad.WindowRegisterClass(sClass);

  //0x50000007=WS_VISIBLE|WS_CHILD|BS_GROUPBOX
  //0x50000009=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTORADIOBUTTON
  //0x50010000=WS_VISIBLE|WS_CHILD|WS_TABSTOP
  //0x50010001=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
  //0x50010003=WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_AUTOCHECKBOX
  //0x90C80040=WS_POPUP|WS_VISIBLE|WS_CAPTION|WS_SYSMENU|DS_SETFONT

  AkelPad.CreateDialog(0, sClass, sTxtCaption, 0x90C80040, 0, 0, 200, 353, hMainWnd, DlgCallback, 0x3 /*CDF_PIXELS|CDF_MODAL*/, 0, 0, "", 0, 0, "|",
    // Class,    Title,               Style,        X,   Y,   W,   H, ID,         lParam
    0, "BUTTON", sTxtStats,           0x50000007,  10,  10, 180, 115, IDSTATSG,   0, "|",
    0, "BUTTON", "",                  0x50000007,  10,  85, 180,  40, IDALLG,     0, "|",
    0, "BUTTON", sTxtChars,           0x50010003,  20,  30,  80,  16, IDCHARS,    0, "|",
    0, "BUTTON", sTxtDetails,         0x50010003, 100,  30,  80,  16, IDCHARSDET, 0, "|",
    0, "BUTTON", sTxtWords,           0x50010003,  20,  50,  80,  16, IDWORDS,    0, "|",
    0, "BUTTON", sTxtDetails,         0x50010003, 100,  50,  80,  16, IDWORDSDET, 0, "|",
    0, "BUTTON", sTxtLines,           0x50010003,  20,  70,  80,  16, IDLINES,    0, "|",
    0, "BUTTON", sTxtDetails,         0x50010003, 100,  70,  80,  16, IDLINESDET, 0, "|",
    0, "BUTTON", sTxtAll,             0x50010003,  20, 100,  80,  16, IDALL,      0, "|",
    0, "BUTTON", sTxtAllDet,          0x50010003, 100, 100,  80,  16, IDALLDET,   0, "|",
    0, "BUTTON", sTxtOutput,          0x50000007,  10, 135, 180, 175, IDOUTPUTG,  0, "|",
    0, "BUTTON", sTxtNewWnd,          0x50000009,  50, 155, 120,  16, IDWND,      0, "|",
    0, "BUTTON", sTxtNewTab,          0x50000009,  50, 175, 120,  16, IDTAB,      0, "|",
    0, "BUTTON", sTxtLogWnd,          0x50000009,  50, 195, 120,  16, IDLOG,      0, "|",
    0, "BUTTON", sTxtFont,            0x50010003,  20, 215, 120,  16, IDFONT,     0, "|",
    0, "BUTTON", aFontOut.toString(), 0x50010000,  20, 235, 160,  20, IDFONTSETB, 0, "|",
    0, "BUTTON", sTxtSort,            0x50010003,  20, 265, 120,  16, IDSORT,     0, "|",
    0, "BUTTON", sTxtDesc,            0x50010003,  35, 285, 105,  16, IDDESC,     0, "|",
    0, "BUTTON", sTxtOK,              0x50010001,  10, 320,  85,  23, IDOKB,      0, "|",
    0, "BUTTON", sTxtCancel,          0x50010000, 105, 320,  85,  23, IDCANCELB,  0);

  AkelPad.WindowUnregisterClass(sClass);

  if (! bOK)
    WScript.Quit();
}

var hWndWait       = GetWaitWindow();
var sLineSep       = Pad("", 49, "R","-");
var sFileName      = AkelPad.GetEditFile(0);
var aOutput        = [];
var aChars         = [];
var aWords         = [];
var aLines         = [];
var aLinesWhite    = [];
var aLinesWhiteEnd = [];
var aLinesBadNL    = [];
var aStreams       = [];
var bStream        = false;
var nMinLenL       = Infinity;
var nMaxLenL       = 0;
var nEmptyEntire   = 0;
var sStreamName;
var oFSO;
var oFile;
var nFileSize;
var dFileDate;
var sFileDateC;
var sFileDateM;
var sText;
var nChars;
var nLatins;
var nDigits;
var nUnders;
var nWhites;
var nSpaces;
var nHTabs;
var nVTabs;
var nFF;
var nCR;
var nLF;
var nOthers;
var aWordTDH;
var nWordTDH;
var nWordDH;
var nWordT;
var nWordD;
var nWordH;
var aTextLines;
var nFirstLine;
var nEmptyLines;
var nEmptyWhite;
var nWhiteEnd;
var reBadNL;
var sChar;
var nCode;
var sWord;
var aExec;
var i, n;

if (sFileName)
{
  i = sFileName.lastIndexOf(":");

  if (i > 3) //NTFS stream
  {
    bStream     = true;
    sStreamName = sFileName.substr(i + 1);
    sFileName   = sFileName.substr(0, i);
  }

  aStreams = EnumStreams(sFileName);

  if (bStream)
  {
    for (i = 1; i < aStreams.length; ++i)
    {
      if (aStreams[i][0] == sStreamName)
      {
        nFileSize  = aStreams[i][1];
        break;
      }
    }
    sFileName = sFileName + ":" + sStreamName;
  }
  else
  {
    oFSO       = new ActiveXObject("Scripting.FileSystemObject");
    oFile      = oFSO.GetFile(sFileName);
    nFileSize  = oFile.Size;
    dFileDate  = new Date(oFile.DateCreated);
    sFileDateC = DateToShortLocaleString(dFileDate);
    dFileDate  = new Date(oFile.DateLastModified);
    sFileDateM = DateToShortLocaleString(dFileDate);
  }
}
else
{
  sFileName  = sTxtNoFile;
  nFileSize  = "?";
  sFileDateC = "?";
  sFileDateM = "?";
}

aOutput.push(Pad(sTxtFile, 22) + sFileName);
aOutput.push(Pad(sTxtSize, 22) + nFileSize + (bStream ? " " + sTxtStream : ""));

if (! bStream)
{
  aOutput.push(Pad(sTxtCreated,  22) + sFileDateC);
  aOutput.push(Pad(sTxtModified, 22) + sFileDateM);

  for (i = 1; i < aStreams.length; ++i)
  {
    if (i == 1)
      aOutput.push(Pad(sTxtStreams, 22) + aStreams[i][0]);
    else
      aOutput.push(Pad(aStreams[i][0], aStreams[i][0].length + 22, "L"));
  }
}

if (bLines)
{
  if (AkelPad.GetSelStart() == AkelPad.GetSelEnd())
  {
    sText      = AkelPad.GetTextRange(0, -1, 1 /*\r*/);
    nFirstLine = 1;
  }
  else
  {
    sText      = AkelPad.GetSelText(1 /*\r*/);
    nFirstLine = AkelPad.SendMessage(hEditWnd, 3129 /*AEM_GETLINENUMBER*/, 1 /*AEGL_FIRSTSELLINE*/, 0);
    nFirstLine = AkelPad.SendMessage(hEditWnd, 3143 /*AEM_GETUNWRAPLINE*/, nFirstLine, 0) + 1;
  }
  aTextLines = sText.split("\r");
}

if (AkelPad.GetSelStart() == AkelPad.GetSelEnd())
{
  sText = AkelPad.GetTextRange(0, -1, 0);
  sTxtStatsTxt += sTxtEntire;
}
else
{
  sText = AkelPad.GetSelText(0);
  sTxtStatsTxt += sTxtSelect;
}

if (bChars || bWords || bLines)
{
  aOutput.push(sLineSep);
  aOutput.push(Pad(sTxtStatsTxt, 49, "C"));
  aOutput.push(sLineSep);
}

//chars
if (bChars)
{
  nChars  = sText.length;
  nLatins = Count(/[a-z]/gi);
  nDigits = Count(/\d/g);
  nUnders = Count(/_/g);
  nSpaces = Count(/ /g);
  nHTabs  = Count(/\t/g);
  nVTabs  = Count(/\v/g);
  nFF     = Count(/\f/g);
  nCR     = Count(/\r/g);
  nLF     = Count(/\n/g);
  nWhites = nSpaces + nHTabs + nVTabs + nFF + nCR + nLF;
  nOthers = nChars - nLatins - nDigits - nUnders - nWhites;

  aOutput.push(         Pad(sTxtChars + ":",  32) + nChars);
  aOutput.push("  "   + Pad(sTxtLatin, 32) + nLatins);
  aOutput.push("  "   + Pad(sTxtDigit, 32) + nDigits);
  aOutput.push("  "   + Pad(sTxtUnder, 32) + nUnders);
  aOutput.push("  "   + Pad(sTxtWhite, 32) + nWhites);
  aOutput.push("    " + Pad(sTxtSpace, 32) + nSpaces);
  aOutput.push("    " + Pad(sTxtHTab,  32) + nHTabs);
  aOutput.push("    " + Pad(sTxtVTab,  32) + nVTabs);
  aOutput.push("    " + Pad(sTxtFF,    32) + nFF);
  aOutput.push("    " + Pad(sTxtCR,    32) + nCR);
  aOutput.push("    " + Pad(sTxtLF,    32) + nLF);
  aOutput.push("  "   + Pad(sTxtOther, 32) + nOthers);
  aOutput.push(sLineSep);
}

//words
if (bWords)
{
  aWordTDH = sText.match(/[^\x00-\x20'`"\\\|\[\]\(\)\{\}<>,\.;:\+\-=~!@#\$%^&\*/\?]+/g);
  nWordTDH = aWordTDH ? aWordTDH.length : 0;
  nWordD   = Count(/(^|[\x00-\x20'`"\\\|\[\]\(\)\{\}<>,\.;:\+\-=~!@#\$%^&\*/\?])\d+(?=($|[\x00-\x20'`"\\\|\[\]\(\)\{\}<>,\.;:\+\-=~!@#\$%^&\*/\?]))/g);
  nWordH   = Count(/(^|[\x00-\x20'`"\\\|\[\]\(\)\{\}<>,\.;:\+\-=~!@#\$%^&\*/\?])0x[\da-f]+(?=($|[\x00-\x20'`"\\\|\[\]\(\)\{\}<>,\.;:\+\-=~!@#\$%^&\*/\?]))/gi);
  nWordT   = nWordTDH - nWordD - nWordH;
  nWordDH  = nWordD   + nWordH;

  aOutput.push(         Pad(sTxtWords + ":", 32) + nWordTDH);
  aOutput.push("  "   + Pad(sTxtText,  32) + nWordT);
  aOutput.push("  "   + Pad(sTxtInt,   32) + nWordDH);
  aOutput.push("    " + Pad(sTxtDec,   32) + nWordD);
  aOutput.push("    " + Pad(sTxtHex,   32) + nWordH);
  aOutput.push(sLineSep);
}

//lines
if (bLines)
{
  for (i = 0; i < aTextLines.length; ++i)
  {
    if (aTextLines[i].length < nMinLenL)
      nMinLenL = aTextLines[i].length;
    if (aTextLines[i].length > nMaxLenL)
      nMaxLenL = aTextLines[i].length;
    if (aTextLines[i].length == 0)
      ++nEmptyEntire;
  }

  nEmptyWhite = Count(/^[ \t\v\f]+$/gm);
  nWhiteEnd   = Count(/\S+[ \t\v\f]+$/gm);
  nEmptyLines = nEmptyEntire + nEmptyWhite;

  if (AkelPad.GetEditNewLine(hEditWnd) == 1) //Win
  {
    reBadNL = /\r\r\n|\r\n|\r|\n/g;
    while (aExec = reBadNL.exec(sText))
    {
      if (aExec[0] != "\r\n")
        aLinesBadNL.push(RegExp.index);
    }
  }
  else
  {
    if (AkelPad.GetEditNewLine(hEditWnd) == 2) //Unix
      reBadNL = /\r{1,2}\n|\r/g;
    else //Mac
      reBadNL = /\r{0,2}\n/g;
    while (reBadNL.test(sText))
      aLinesBadNL.push(RegExp.index);
  }

  aOutput.push(         Pad(sTxtLines + ":",    32) + aTextLines.length);
  aOutput.push("  "   + Pad(sTxtEmptyL,   32) + nEmptyLines);
  aOutput.push("    " + Pad(sTxtEnEmptyL, 32) + nEmptyEntire);
  aOutput.push("    " + Pad(sTxtWhiteL,   32) + nEmptyWhite);
  aOutput.push("  "   + Pad(sTxtWhiteEnd, 32) + nWhiteEnd);
  aOutput.push("  "   + Pad(sTxtBadNLF,   32) + aLinesBadNL.length);
  aOutput.push(sLineSep);
  aOutput.push(         Pad(sTxtMinLenL,  32) + nMinLenL);
  aOutput.push(         Pad(sTxtMaxLenL,  32) + nMaxLenL);
  aOutput.push(sLineSep);
}

//chars details
if (bChars && bCharsDet)
{
  for (i = 0; i < sText.length; ++i)
  {
    nCode = sText.charCodeAt(i);

    if (nCode > 31)
      sChar = sText.charAt(i);
    else
      sChar = " ";

    if (aChars[nCode])
      ++aChars[nCode][0];
    else
      aChars[nCode] = [1, sChar, nCode];
  }

  if (aChars.length)
  {
    aOutput.push(sTxtChars + " - " + sTxtDetails);
    aOutput.push(Pad(sTxtStats, 10, "L") + "     %      " + Pad(sTxtChar, 7) + Pad(sTxtCode, 6, "L") + Pad("(hex)", 11, "L"));
    aOutput.push(sLineSep);

    if (bSort)
      SortByStats(aChars);

    for (i = 0; i < aChars.length; ++i)
    {
      if (aChars[i])
        aOutput.push(Pad(aChars[i][0].toString(), 10, "L") + Pad(Percent(aChars[i][0] / nChars), 9, "L") + "    " + aChars[i][1] + Pad("(" + aChars[i][2] + ")", 11, "L") + "     (" + Pad(aChars[i][2].toString(16).toUpperCase(), 4, "L", "0") + ")");
    }

    aOutput.push(sLineSep);
  }
}

//words details
if (bWords && bWordsDet)
{
  if (nWordTDH)
  {
    aWordTDH.sort();
    i = 0;
    while (i < nWordTDH)
    {
      sWord = aWordTDH[i];
      n     = 1;
      ++i;
      while ((i < nWordTDH) && (sWord == aWordTDH[i]))
      {
        ++n;
        ++i;
      }
      aWords.push([n, sWord]);
    }
  }

  if (aWords.length)
  {
    aOutput.push(sTxtWords + " - " + sTxtDetails);
    aOutput.push(Pad(sTxtStats, 10, "L") + "     %       " + sTxtWord);
    aOutput.push(sLineSep);

    if (bSort)
      SortByStats(aWords);

    for (i = 0; i < aWords.length; ++i)
      aOutput.push(Pad(aWords[i][0].toString(), 10, "L") + Pad(Percent(aWords[i][0] / nWordTDH), 9, "L") + "    " + aWords[i][1]);

    aOutput.push(sLineSep);
  }
}

//lines details
if (bLines && bLinesDet)
{
  for (i = 0; i < aTextLines.length; ++i)
  {
    if (/^\s+$/.test(aTextLines[i]))
      aLinesWhite.push(i + nFirstLine);
    else if (/\S+\s+$/.test(aTextLines[i]))
      aLinesWhiteEnd.push(i + nFirstLine);

    if (aLines[aTextLines[i].length])
    {
      ++aLines[aTextLines[i].length][0];
      aLines[aTextLines[i].length][2].push(i + nFirstLine);
    }
    else
      aLines[aTextLines[i].length] = [1, aTextLines[i].length, [i + nFirstLine]];
  }

  aOutput.push(sTxtLines + " - " + sTxtDetails);
  aOutput.push(Pad(sTxtStats, 10, "L") + "     %      " + Pad(sTxtLength, 7, "L") + "    " + sTxtLineNum);
  aOutput.push(sLineSep);

  if (bSort)
    SortByStats(aLines);

  for (i = 0; i < aLines.length; ++i)
  {
    if (aLines[i])
      aOutput.push(Pad(aLines[i][0].toString(), 10, "L") + Pad(Percent(aLines[i][0] / aTextLines.length), 9, "L") + Pad(aLines[i][1].toString(), 10, "L") + "    [" + aLines[i][2] + "]");
  }

  if (aLinesWhite.length)
    aOutput.push(Pad(sTxtWhiteL, 33) + "[" + aLinesWhite + "]");
  if (aLinesWhiteEnd.length)
    aOutput.push(Pad(sTxtWhiteEnd, 33) + "[" + aLinesWhiteEnd + "]");
  if (aLinesBadNL.length)
  {
    OffsetToLineNumber(aLinesBadNL);
    aOutput.push(Pad(sTxtBadNLF, 33) + "[" + aLinesBadNL + "]");
  }

  aOutput.push(sLineSep);
}

oSys.Call("User32::DestroyWindow", hWndWait);
AkelPad.SendMessage(GetOutputWindow(), 12 /*WM_SETTEXT*/, 0, aOutput.join("\r"));

function DlgCallback(hWnd, uMsg, wParam, lParam)
{
  var nID;

  if (uMsg == 272 /*WM_INITDIALOG*/)
  {
    hDlg = hWnd;

    CheckButtons();
    CheckRadioButtons();
    CenterWindow(hWnd);
  }

  else if (uMsg == 273 /*WM_COMMAND*/)
  {
    nID = wParam & 0xFFFF;

    if (((nID >= IDCHARS) && (nID <= IDALLDET)) || (nID == IDFONT) || (nID == IDSORT) || (nID == IDDESC))
    {
      if (nID == IDCHARS)
        bChars = ! bChars;
      else if (nID == IDWORDS)
        bWords = ! bWords;
      else if (nID == IDLINES)
        bLines = ! bLines;
      else if (nID == IDCHARSDET)
        bCharsDet = ! bCharsDet;
      else if (nID == IDWORDSDET)
        bWordsDet = ! bWordsDet;
      else if (nID == IDLINESDET)
        bLinesDet = ! bLinesDet;
      else if (nID == IDALL)
        bChars = bWords = bLines = AkelPad.SendMessage(lParam, 240 /*BM_GETCHECK*/, 0, 0);
      else if (nID == IDALLDET)
        bCharsDet = bWordsDet = bLinesDet = AkelPad.SendMessage(lParam, 240 /*BM_GETCHECK*/, 0, 0);
      else if (nID == IDFONT)
        bFont = ! bFont;
      else if (nID == IDSORT)
        bSort = ! bSort;
      else if (nID == IDDESC)
        bDesc = ! bDesc;

      CheckButtons();
    }
    else if ((nID >= IDWND) && (nID <= IDLOG))
      nOutput = nID - IDWND;
    else if (nID == IDFONTSETB)
      MenuFont(hWnd);
    else if ((nID == IDOKB) || (nID == IDCANCELB) || (nID == 2 /*IDCANCEL*/))
    {
      bOK = (nID == IDOKB);
      oSys.Call("User32::PostMessageW", hWnd, 16 /*WM_CLOSE*/, 0, 0);
    }
  }

  else if (uMsg == 16 /*WM_CLOSE*/)
  {
    ReadWriteIni(1);
    oSys.Call("User32::EndDialog", hDlg, 0);
  }

  return 0;
}

function SendDlgItemMessage(hWnd, nID, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendDlgItemMessageW", hWnd, nID, uMsg, wParam, lParam);
}

function GetDlgItem(hWnd, nID)
{
  return oSys.Call("User32::GetDlgItem", hWnd, nID);
}

function CheckButtons()
{
  SendDlgItemMessage(hDlg, IDCHARS,    241 /*BM_SETCHECK*/, bChars, 0);
  SendDlgItemMessage(hDlg, IDWORDS,    241 /*BM_SETCHECK*/, bWords, 0);
  SendDlgItemMessage(hDlg, IDLINES,    241 /*BM_SETCHECK*/, bLines, 0);
  SendDlgItemMessage(hDlg, IDCHARSDET, 241 /*BM_SETCHECK*/, bCharsDet, 0);
  SendDlgItemMessage(hDlg, IDWORDSDET, 241 /*BM_SETCHECK*/, bWordsDet, 0);
  SendDlgItemMessage(hDlg, IDLINESDET, 241 /*BM_SETCHECK*/, bLinesDet, 0);
  SendDlgItemMessage(hDlg, IDALL,      241 /*BM_SETCHECK*/, bChars && bWords && bLines, 0);
  SendDlgItemMessage(hDlg, IDALLDET,   241 /*BM_SETCHECK*/, bCharsDet && bWordsDet && bLinesDet, 0);
  SendDlgItemMessage(hDlg, IDFONT,     241 /*BM_SETCHECK*/, bFont, 0);
  SendDlgItemMessage(hDlg, IDSORT,     241 /*BM_SETCHECK*/, bSort, 0);
  SendDlgItemMessage(hDlg, IDDESC,     241 /*BM_SETCHECK*/, bDesc, 0);

  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDCHARSDET), bChars);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDWORDSDET), bWords);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDLINESDET), bLines);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDFONTSETB), bFont);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDSORT),     bChars && bCharsDet || bWords && bWordsDet || bLines && bLinesDet);
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDDESC),     bSort && (bChars && bCharsDet || bWords && bWordsDet || bLines && bLinesDet));
}

function CheckRadioButtons()
{
  if (nOutput < 0)
  {
    if (AkelPad.IsMDI())
      nOutput = 1;
    else
      nOutput = 0;
  }

  if ((nOutput == 2) && (! IsLogPluginExists()))
    nOutput = 1;

  if ((nOutput == 1) && (! AkelPad.IsMDI()))
    nOutput = 0;

  SendDlgItemMessage(hDlg, IDWND + nOutput, 241 /*BM_SETCHECK*/, 1, 0);

  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDTAB), AkelPad.IsMDI());
  oSys.Call("User32::EnableWindow", GetDlgItem(hDlg, IDLOG), IsLogPluginExists());
}

function IsLogPluginExists()
{
  return IsFileExists(AkelPad.GetAkelDir(4 /*ADTYPE_PLUGS*/) + "\\Log.dll");
}

function MenuFont(hWndOwn)
{
  var hMenu = oSys.Call("User32::CreatePopupMenu");
  var oRect = {};
  var nCmd;
  var vCF;

  GetWindowPos(GetDlgItem(hDlg, IDFONT), oRect);

  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 1, sTxtMonoFonts);
  oSys.Call("User32::AppendMenuW", hMenu, 0 /*MF_STRING*/, 2, sTxtAllFonts);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_RETURNCMD|TPM_NONOTIFY*/, oRect.X + 16, oRect.Y + 16, 0, hWndOwn, 0);
  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd)
  {
    if (vCF = ChooseFont(hWndOwn, 3, aFontOut, 0, nCmd - 2, 3))
    {
      aFontOut = vCF;
      SendDlgItemMessage(hDlg, IDFONTSETB, 12 /*WM_SETTEXT*/, 0, aFontOut.toString());
    }
  }
}

function GetWindowPos(hWnd, oRect)
{
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("User32::GetWindowRect", hWnd, lpRect);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  AkelPad.MemFree(lpRect);
}

function GetWaitWindow()
{
  var hWnd =
        oSys.Call("User32::CreateWindowExW",
                  0,          //dwExStyle
                  "STATIC",   //lpClassName
                  0,          //lpWindowName
                  0x90400001, //dwStyle=WS_POPUP|WS_VISIBLE|WS_DLGFRAME|SS_CENTER
                  0,          //x
                  0,          //y
                  200,        //nWidth
                  80,         //nHeight
                  hMainWnd,   //hWndParent
                  0,          //ID
                  hInstDLL,
                  0);

  CenterWindow(hWnd);
  AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/), 0);
  AkelPad.SendMessage(hWnd, 12 /*WM_SETTEXT*/, 0, "\n\n" + sTxtWait);

  return hWnd;
}

function CenterWindow(hWnd)
{
  var oRectEdit = {};
  var oRect     = {};

  GetWindowPos(hEditWnd, oRectEdit);
  GetWindowPos(hWnd, oRect);

  oRect.X = oRectEdit.X + (oRectEdit.W - oRect.W) / 2;
  oRect.Y = oRectEdit.Y + (oRectEdit.H - oRect.H) / 2;

  oSys.Call("User32::SetWindowPos", hWnd, 0, oRect.X, oRect.Y, 0, 0, 0x15 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOSIZE*/);
}

function Count(oRE)
{
  var aMatch = sText.match(oRE);
  return aMatch ? aMatch.length : 0;
}

function Pad(sString, nLen, sType, sChar)
{
  var i = 0;

  if (! sType) sType = "R";
  if (! sChar) sChar = " ";

  if (sType == "R")
  {
    while (sString.length < nLen)
      sString += sChar;
  }
  else if (sType == "L")
  {
    while (sString.length < nLen)
      sString = sChar + sString;
  }
  else if (sType == "C")
  {
    while (sString.length < nLen)
    {
      if ((i % 2) == 0)
        sString += sChar;
      else
        sString = sChar + sString;
      ++ i;
    }
  }
  return sString;
}

function SortByStats(a)
{
  a.sort(function(a1, a2)
         {
           if (a1[0] < a2[0])
             return bDesc ? 1 : -1;
           if (a1[0] > a2[0])
             return bDesc ? -1 : 1;
           return 0;
         });
}

function Percent(n)
{
  var s = (Math.round(n * 10000) / 100).toString();

  n = s.indexOf(".");

  if (n == -1)
    s = s + ".00";
  else if (n == s.length - 2)
    s = s + "0";

  return s;
}

function DateToShortLocaleString(dDate)
{
  var lpSysTime = AkelPad.MemAlloc(16 /*sizeof(SYSTEMTIME)*/);
  var lpString  = AkelPad.MemAlloc(256 * 2);
  var sDateTime;

  AkelPad.MemCopy(_PtrAdd(lpSysTime,  0), dDate.getFullYear(),     DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime,  2), dDate.getMonth() + 1,    DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime,  4), dDate.getDay(),          DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime,  6), dDate.getDate(),         DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime,  8), dDate.getHours(),        DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime, 10), dDate.getMinutes(),      DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime, 12), dDate.getSeconds(),      DT_WORD);
  AkelPad.MemCopy(_PtrAdd(lpSysTime, 14), dDate.getMilliseconds(), DT_WORD);

  oSys.Call("Kernel32::GetDateFormatW",
            0x400, //LOCALE_USER_DEFAULT
            0x1,   //DATE_SHORTDATE
            lpSysTime,
            0,
            lpString,
            256);
  sDateTime = AkelPad.MemRead(lpString, 1 /*DT_UNICODE*/) + " ";

  oSys.Call("Kernel32::GetTimeFormatW",
            0x400, //LOCALE_USER_DEFAULT
            0x8,   //TIME_FORCE24HOURFORMAT
            lpSysTime,
            0,
            lpString,
            256);
  sDateTime += AkelPad.MemRead(lpString, 1 /*DT_UNICODE*/);

  AkelPad.MemFree(lpSysTime);
  AkelPad.MemFree(lpString);

  return sDateTime;
}

function OffsetToLineNumber(aLinesBadNL)
{
  var lpCharIndex1  = AkelPad.MemAlloc(_X64 ? 24 : 12); //sizeof(AECHARINDEX)
  var lpCharIndex2  = AkelPad.MemAlloc(_X64 ? 24 : 12); //sizeof(AECHARINDEX)
  var lpIndexOffset = AkelPad.MemAlloc(_X64 ? 32 : 16); //sizeof(AEINDEXOFFSET)
  var i;

  AkelPad.MemCopy(lpIndexOffset, lpCharIndex1, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpIndexOffset, _X64 ? 8 : 4), lpCharIndex2, DT_QWORD);
  AkelPad.MemCopy(_PtrAdd(lpIndexOffset, _X64 ? 24 : 12), 3 /*AELB_ASIS*/, DT_DWORD);

  AkelPad.SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, (AkelPad.GetSelStart() == AkelPad.GetSelEnd()) ? 1 /*AEGI_FIRSTCHAR*/ : 3 /*AEGI_FIRSTSELCHAR*/, lpCharIndex1);

  for (i = 0; i < aLinesBadNL.length; ++i)
  {
    AkelPad.MemCopy(_PtrAdd(lpIndexOffset, _X64 ? 16 : 8), aLinesBadNL[i], DT_QWORD);
    AkelPad.SendMessage(hEditWnd, 3135 /*AEM_INDEXOFFSET*/, 0, lpIndexOffset);

    aLinesBadNL[i] = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpCharIndex2);
    aLinesBadNL[i] = AkelPad.SendMessage(hEditWnd, 1078 /*EM_EXLINEFROMCHAR*/, 0, aLinesBadNL[i]);
    aLinesBadNL[i] = AkelPad.SendMessage(hEditWnd, 3143 /*AEM_GETUNWRAPLINE*/, aLinesBadNL[i], 0) + 1;
  }

  AkelPad.MemFree(lpCharIndex1);
  AkelPad.MemFree(lpCharIndex2);
  AkelPad.MemFree(lpIndexOffset);
}

function GetOutputWindow()
{
  var hWnd;

  if (AkelPad.IsMDI())
  {
    if (nOutput == 2)
      hWnd = GetLogWindow();
    else
      hWnd = GetNewEditWindow(nOutput);
  }
  else
  {
    if ((nOutput == -1) || (nOutput == 2))
      hWnd = GetLogWindow();
    else
      hWnd = GetNewEditWindow(0);
  }

  return hWnd;
}

function GetNewEditWindow(bNewTab)
{
  var aFontEdit;

  if (bNewTab)
  {
    //To eliminate conflict with Templates plugin: lParam=1
    AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4101 /*wParam=MAKEWPARAM(0,IDM_FILE_NEW)*/, 1 /*lParam=TRUE*/);

    if (bFont)
    {
      WScript.Sleep(10);
      AkelPad.Font(aFontOut[0], aFontOut[1], aFontOut[2])
    }
  }
  else
  {
    if (bFont)
    {
      aFontEdit = ConvertFontFormat(AkelPad.SendMessage(hEditWnd, 49 /*WM_GETFONT*/, 0, 0), 2, 3);

      AkelPad.SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 0, 0);
      AkelPad.Font(aFontOut[0], aFontOut[1], aFontOut[2])
    }

    //Force create new instance
    if (AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 153 /*MI_SINGLEOPENPROGRAM*/, 0))
    {
      AkelPad.Command(4256 /*IDM_OPTIONS_SINGLEOPEN_PROGRAM*/);
      hMainWnd = AkelPad.Command(4102 /*IDM_FILE_CREATENEW*/);
      AkelPad.Command(4256 /*IDM_OPTIONS_SINGLEOPEN_PROGRAM*/);
      AkelPad.SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4256 /*IDM_OPTIONS_SINGLEOPEN_PROGRAM*/, 0);
    }
    else
      hMainWnd = AkelPad.Command(4102 /*IDM_FILE_CREATENEW*/);

    if (bFont)
    {
      AkelPad.Font(aFontEdit[0], aFontEdit[1], aFontEdit[2])
      AkelPad.SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, 1, 0);
    }
  }

  return AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 2 /*FI_WNDEDIT*/, 0);
}

function GetLogWindow()
{
  var lpWnd = AkelPad.MemAlloc(_X64 ? 8 : 4); //sizeof(HWND)
  var hWnd;

  if (! AkelPad.IsPluginRunning("Log::Output"))
    AkelPad.Call("Log::Output");

  AkelPad.Call("Log::Output", 2, lpWnd);
  hWnd = AkelPad.MemRead(lpWnd, DT_QWORD);
  AkelPad.MemFree(lpWnd);

  if (bFont)
    AkelPad.SendMessage(hWnd, 48 /*WM_SETFONT*/, ConvertFontFormat(aFontOut, 3, 2), 0);

  return hWnd;
}

function ReadWriteIni(bWrite)
{
  var sIniFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + ".ini";
  var sIniTxt;
  var oError;

  if (bWrite)
  {
    sIniTxt = 'bChars='     + bChars    + ';\r\n' +
              'bWords='     + bWords    + ';\r\n' +
              'bLines='     + bLines    + ';\r\n' +
              'bCharsDet='  + bCharsDet + ';\r\n' +
              'bWordsDet='  + bWordsDet + ';\r\n' +
              'bLinesDet='  + bLinesDet + ';\r\n' +
              'bSort='      + bSort     + ';\r\n' +
              'bDesc='      + bDesc     + ';\r\n' +
              'nOutput='    + nOutput   + ';\r\n' +
              'bFont='      + bFont     + ';\r\n' +
              'aFontOut=["' + aFontOut[0] + '",' + aFontOut[1] + ',' + aFontOut[2] + '];';

    WriteFile(sIniFile, null, sIniTxt, 1);
  }

  else if (IsFileExists(sIniFile))
  {
    try
    {
      eval(AkelPad.ReadFile(sIniFile));
    }
    catch (oError)
    {
    }
  }
}

function GetLangStrins()
{
  if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1045) //Polish
  {
    sTxtCaption   = "Informacja o pliku";
    sTxtWait      = "Proszę czekać...";
    sTxtNoFile    = "Brak nazwy, plik nie został zapisany";
    sTxtStatsTxt  = "Statystyka tekstu";
    sTxtEntire    = " - cały tekst";
    sTxtSelect    = " - obszar zaznaczenia";
    sTxtDetails   = "Szczegóły";
    sTxtWord      = "Słowo";
    sTxtChar      = "Znak";
    sTxtCode      = "(Kod)";
    sTxtLength    = "Długość";
    sTxtLineNum   = "[Numery wierszy]";
    sTxtFile      = "Plik, pełna nazwa:";
    sTxtSize      = "Rozmiar [Bajty]:";
    sTxtCreated   = "Utworzony:";
    sTxtModified  = "Ostatnio zapisany:";
    sTxtChars     = "Znaki";
    sTxtLatin     = "Litera łacińska:";
    sTxtDigit     = "Cyfra:";
    sTxtUnder     = "Znak podkreślenia:";
    sTxtWhite     = "Biały znak:";
    sTxtSpace     = "Spacja (20h):";
    sTxtHTab      = "Tabulator (09h):";
    sTxtVTab      = "Tabulator pionowy (0Bh):";
    sTxtFF        = "Wysuw strony FF (0Ch):";
    sTxtCR        = "Powrót karetki CR (0Dh):";
    sTxtLF        = "Nowy wiersz LF (0Ah):";
    sTxtOther     = "Inne:";
    sTxtWords     = "Słowa";
    sTxtText      = "Tekst:";
    sTxtInt       = "Liczba całkowita:";
    sTxtDec       = "Dziesiętna:";
    sTxtHex       = "Hex (0x...):";
    sTxtLines     = "Wiersze";
    sTxtEmptyL    = "Pusty wiersz:";
    sTxtEnEmptyL  = "Całkowicie pusty:";
    sTxtWhiteL    = "Tylko białe znaki:";
    sTxtWhiteEnd  = "Zakończony białym znakiem:";
    sTxtBadNLF    = "Błędny format nowego wiersza:";
    sTxtMinLenL   = "Min. długość wiersza:";
    sTxtMaxLenL   = "Max. długość wiersza:";
    sTxtStream    = "(strumień NTFS)";
    sTxtStreams   = "Strumienie NTFS:";
    sTxtStats     = "Statystyka";
    sTxtAll       = "&Wszystko";
    sTxtAllDet    = "&Szczegółowo";
    sTxtOutput    = "Wyjście";
    sTxtNewWnd    = "Nowe okno";
    sTxtNewTab    = "Nowa karta (MDI)";
    sTxtLogWnd    = "Okno log";
    sTxtFont      = "Czcionka";
    sTxtMonoFonts = "Czcionki monospace";
    sTxtAllFonts  = "Wszystkie czcionki";
    sTxtSort      = "Sortuj wg statystyki";
    sTxtDesc      = "Malejąco";
    sTxtOK        = "OK";
    sTxtCancel    = "Anuluj";
  }
  else if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1049) //Russian
  {
    //translated by yozhic
    sTxtCaption   = "Информация о файле";
    sTxtWait      = "Пожалуйста, подождите...";
    sTxtNoFile    = "Отсутствует имя, файл не сохранён";
    sTxtStatsTxt  = "Статистика по тексту";
    sTxtEntire    = " - полный текст";
    sTxtSelect    = " - выделенный текст";
    sTxtDetails   = "Детально";
    sTxtWord      = "Слово";
    sTxtChar      = "Символ";
    sTxtCode      = "(Код)";
    sTxtLength    = "Длина";
    sTxtLineNum   = "[Номера строк]";
    sTxtFile      = "Файл, полное имя:";
    sTxtSize      = "Размер [в Байтах]:";
    sTxtCreated   = "Дата создания:";
    sTxtModified  = "Дата модификации:";
    sTxtChars     = "Символы";
    sTxtLatin     = "Латинские буквы:";
    sTxtDigit     = "Цифра:";
    sTxtUnder     = "Символы подчёркивания:";
    sTxtWhite     = "Пробельные символы:";
    sTxtSpace     = "Пробел (20h):";
    sTxtHTab      = "Табуляция (09h):";
    sTxtVTab      = "Вертикальная табуляция (0Bh):";
    sTxtFF        = "Перевод страницы (0Ch):";
    sTxtCR        = "Возврат каретки (0Dh):";
    sTxtLF        = "Перевод строки (0Ah):";
    sTxtOther     = "Другие:";
    sTxtWords     = "Слова";
    sTxtText      = "Текст:";
    sTxtInt       = "Целые числа:";
    sTxtDec       = "Десятичные:";
    sTxtHex       = "Hex (0x...):";
    sTxtLines     = "Строки";
    sTxtEmptyL    = "Пустые строки:";
    sTxtEnEmptyL  = "Абсолютно пустые:";
    sTxtWhiteL    = "Только из пробельных символов:";
    sTxtWhiteEnd  = "Заканчивающиеся проб. символами:";
    sTxtBadNLF    = "Неверный формат новой строки:";
    sTxtMinLenL   = "Min. длина строки:";
    sTxtMaxLenL   = "Max. длина строки:";
    sTxtStream    = "(поток NTFS)";
    sTxtStreams   = "Потоки NTFS:";
    sTxtStats     = "Статистика";
    sTxtAll       = "Вс&я";
    sTxtAllDet    = "Дет&альная";
    sTxtOutput    = "Вывод";
    sTxtNewWnd    = "Новое окно";
    sTxtNewTab    = "Новая вкладка (MDI)";
    sTxtLogWnd    = "Панель вывода";
    sTxtFont      = "Шрифт";
    sTxtMonoFonts = "Моноширинный шрифт";
    sTxtAllFonts  = "Все шрифты";
    sTxtSort      = "Sort by statistics";                  //new
    sTxtDesc      = "Descending";                          //new
    sTxtOK        = "OK";
    sTxtCancel    = "Отмена";
  }
  else
  {
    sTxtCaption   = "File info";
    sTxtWait      = "Please wait...";
    sTxtNoFile    = "No name, the file is not saved";
    sTxtStatsTxt  = "Text statistics";
    sTxtEntire    = " - entire text";
    sTxtSelect    = " - selected text";
    sTxtDetails   = "Details";
    sTxtWord      = "Word";
    sTxtChar      = "Char";
    sTxtCode      = "(Code)";
    sTxtLength    = "Length";
    sTxtLineNum   = "[Line numbers]";
    sTxtFile      = "File, full name:";
    sTxtSize      = "Size [Bytes]:";
    sTxtCreated   = "Created time:";
    sTxtModified  = "Last modified:";
    sTxtChars     = "Chars";
    sTxtLatin     = "Latin letter:";
    sTxtDigit     = "Digit:";
    sTxtUnder     = "Underscore char:";
    sTxtWhite     = "Whitespace:";
    sTxtSpace     = "Space (20h):";
    sTxtHTab      = "Tab (09h):";
    sTxtVTab      = "Vertical Tab (0Bh):";
    sTxtFF        = "Form Feed (0Ch):";
    sTxtCR        = "Carriage Return (0Dh):";
    sTxtLF        = "Line Feed (0Ah):";
    sTxtOther     = "Other:";
    sTxtWords     = "Words";
    sTxtText      = "Text:";
    sTxtInt       = "Integer:";
    sTxtDec       = "Decimal:";
    sTxtHex       = "Hex (0x...):";
    sTxtLines     = "Lines";
    sTxtEmptyL    = "Empty line:";
    sTxtEnEmptyL  = "Entirely empty:";
    sTxtWhiteL    = "Whitespaces only:";
    sTxtWhiteEnd  = "Terminated by whitespace:";
    sTxtBadNLF    = "Bad NewLine format:";
    sTxtMinLenL   = "Min line length:";
    sTxtMaxLenL   = "Max line length:";
    sTxtStream    = "(NTFS stream)";
    sTxtStreams   = "NTFS streams:";
    sTxtStats     = "Statistics";
    sTxtAll       = "&All";
    sTxtAllDet    = "With &details";
    sTxtOutput    = "Output";
    sTxtNewWnd    = "New window";
    sTxtNewTab    = "New tab (MDI)";
    sTxtLogWnd    = "Log window";
    sTxtFont      = "Font";
    sTxtMonoFonts = "Monospace fonts";
    sTxtAllFonts  = "All fonts";
    sTxtSort      = "Sort by statistics";
    sTxtDesc      = "Descending";
    sTxtOK        = "OK";
    sTxtCancel    = "Cancel";
  }
}
