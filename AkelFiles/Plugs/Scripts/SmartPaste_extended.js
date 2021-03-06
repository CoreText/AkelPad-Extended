// http://AkelPad.sourceforge.net/forum/viewtopic.php?p=26373#26373
// Version: 1.3
// Author: Shengalts Aleksander aka Instructor / texter
//
//
//
// Description(1033): Paste text preserving leading spaces.
// Description(1049): Вставить текст сохраняя пробелы в начале.
//
// Arguments:
// -NormalPaste=1            -Normal paste condition (one of the following):
//                              1  if caret not on line start.
//                              0  disabled (default).
// -ClipboardUnindent=0      -Remove leading spaces from clipboard text before paste (one of the following):
//                              2  remove all.
//                              1  smart remove (default).
//                              0  don't remove.
// -ClipboardEmpty=true      -If clipboard is empty then paste new line (default is false).
// -NewLineToStart=1         -Insert new line to the beginning of clipboard text if nessesary (one of the following):
//                              2  insert when nessesary, but only for multiline clipboard (default).
//                              1  insert when nessesary.
//                              0  don't insert.
// -NewLineToEnd=1           -Insert new line to the end of clipboard text if nessesary (one of the following):
//                              2  insert when nessesary, but only for multiline clipboard (default).
//                              1  insert when nessesary.
//                              0  don't insert.
// -Select=2                 -Select pasted text (one of the following):
//                              2  select only clipboard part.
//                              1  select all pasted.
//                              0  don't select (default).
// Usage:
// Call("Scripts::Main", 1, "SmartPaste.js", '-NormalPaste=0 -ClipboardUnindent=1 -NewLineToStart=0 -NewLineToEnd=1 -Select=1')

//Arguments
var nNormalPaste = AkelPad.GetArgValue("NormalPaste", 0);
var nClipboardUnindent = AkelPad.GetArgValue("ClipboardUnindent", 1);
var bClipboardEmpty = AkelPad.GetArgValue("ClipboardEmpty", false);
var nNewLineToStart = AkelPad.GetArgValue("NewLineToStart", 2);
var nNewLineToEnd = AkelPad.GetArgValue("NewLineToEnd", 2);
var nSelect = AkelPad.GetArgValue("Select", 0);

//Variables
var hMainWnd = AkelPad.GetMainWnd();
var hWndEdit;
var hWndFocus;
var oSys = AkelPad.SystemFunction();
var oPattern;
var pSpaces;
var pLine;
var pText;
var lpLinesArray;
var nSelStartMove = 0;
var nSelEndMove = 0;
var nSpacesLen = 0;
var nFirstSpacesLen = 0;

//Allow script for plugins AkelEdit windows
hWndFocus = AkelPad.SendMessage(hMainWnd, 1317 /*AKD_GETFOCUS*/ , 0, 0);
if (!AkelPad.SetEditWnd(hWndFocus))
{
  AkelPad.SendMessage(hWndFocus, 0x302 /*WM_PASTE*/ , 0, 0);
  WScript.Quit();
}
hWndEdit = AkelPad.GetEditWnd();

//Get clipboard text
if (!(pText = AkelPad.GetClipboardText()))
{
  if (bClipboardEmpty)
    pText = "\n";
  else
    WScript.Quit();
}

if (pText)
{
  //Get line spaces
  var nSelStart = AkelPad.GetSelStart();
  var nMinLineStart = AkelPad.SendMessage(hWndEdit, 3138 /*AEM_GETRICHOFFSET*/, 18 /*AEGI_WRAPLINEBEGIN*/, nSelStart);
  var nMinLineEnd = AkelPad.SendMessage(hWndEdit, 3138 /*AEM_GETRICHOFFSET*/, 19 /*AEGI_WRAPLINEEND*/, nSelStart);
  var nSelEnd = AkelPad.GetSelEnd();
  //var nMaxLineStart=AkelPad.SendMessage(hWndEdit, 3138 /*AEM_GETRICHOFFSET*/, 18 /*AEGI_WRAPLINEBEGIN*/, nSelEnd);
  var nMaxLineEnd = AkelPad.SendMessage(hWndEdit, 3138 /*AEM_GETRICHOFFSET*/, 19 /*AEGI_WRAPLINEEND*/, nSelEnd);
  var bCaretAtEnd;
  var bMultilineClipboard;

  if (nSelEnd < nMaxLineEnd)
    bCaretAtEnd = false;
  else
    bCaretAtEnd = true;

  pLine = AkelPad.GetTextRange(nMinLineStart, nMinLineEnd);

  pSpaces = pLine.replace(/^([ \t]*).*/g, "$1");
  nSpacesLen = pSpaces.length;
  if (nSelStart - nMinLineStart <= nSpacesLen)
  {
    pSpaces = pSpaces.substr(0, nSelStart - nMinLineStart);
    nSpacesLen = pSpaces.length;
  }
  else if (nNormalPaste)
  {
    AkelPad.Command(4155 /*IDM_EDIT_PASTE*/ );
    WScript.Quit();
  }

  //Correct clipboard text
  pText = pText.replace(/\r\r\n|\r\n/g, "\n");
  // if (nClipboardUnindent === 1)
  // {
  //   if (pText.match(/^([ \t]*)/) && RegExp.$1.length)
  //   {
  //     oPattern = new RegExp("^[ \t]{1," + RegExp.$1.length + "}", "gm");
  //     pText = pText.replace(oPattern, "");
  //   }
  //   // else if (pText.match(/^([ \t]*)/) && nSpacesLen)
  //   // {
  //   //   oPattern = new RegExp("^[ \t]{1," + nSpacesLen + "}", "gm");
  //   //   pText = pText.replace(oPattern, "");
  //   // }
  // }
  // else if (nClipboardUnindent === 2)
  // {
  //   pText = pText.replace(/^[ \t]*/gm, "");
  // }
  //
  // if (nNewLineToStart === 2 || nNewLineToEnd === 2)
  // {
  //   if (/\r/.test(pText))
  //     bMultilineClipboard = true;
  //   else
  //     bMultilineClipboard = false;
  // }
  // if (nNewLineToStart === 1 || (nNewLineToStart === 2 && bMultilineClipboard))
  // {
  //   if (nSelStart - nMinLineStart > nSpacesLen)
  //   {
  //     pText = "\n" + pText;
  //     nSelStartMove += 1;
  //   }
  // }
  // if (nNewLineToEnd === 1 || (nNewLineToEnd === 2 && bMultilineClipboard))
  // {
  //   if (pText.charAt(pText.length - 1) === "\n")
  //   {
  //     if (bCaretAtEnd)
  //     {
  //       //Remove new line from end
  //       pText = pText.substr(0, pText.length - 1);
  //     }
  //   }
  //   else if (!bCaretAtEnd)
  //   {
  //     //Add new line to end
  //     pText = pText + "\n";
  //     nSelEndMove -= 1;
  //   }
  //   if (!bCaretAtEnd)
  //     nSelEndMove -= nSpacesLen;
  // }
}

// Indent text
var sClipText = AkelPad.GetClipboardText();
nFirstSpacesLen = sClipText.match(/^[\s\t]*/)[0].length;
var aLineSpacesMatch = null;
var bIsBegin = false;
lpLinesArray = pText.split("\n");

if (pSpaces)
{
  if (lpLinesArray && lpLinesArray.length > 1)
  {
    var nLen = (lpLinesArray.length > 8)? 10 : lpLinesArray.length;                // 8 iterations should be enough to find the indent
    for (var nDelta = 0, aLines = []; nDelta < nLen; nDelta++)
    {
      if (nDelta !== 0 && lpLinesArray[nDelta] && lpLinesArray[nDelta].match(/^[^\s\t]/) && lpLinesArray[nDelta] !== "\n")
        bIsBegin = true;

      if (/^[\s\t]+/.test(lpLinesArray[nDelta]))
      {
        aLineSpacesMatch = lpLinesArray[nDelta].match(/^[\s\t]+/);
        if (aLineSpacesMatch)
          aLines.push(aLineSpacesMatch[0].length);
      }
    }

    aLines.sort(function (a, b) { return a - b; });

    var nAverageIndent = aLines[0];
    for (var nIndex = 0, nLinesLen = lpLinesArray.length; nIndex <= nLinesLen; nIndex++)
    {
      var rSpacesRemove = new RegExp("^[ \s\t]{0,"+ nFirstSpacesLen +"}", "g");
      var rSpacesAdditionalRemove = new RegExp("^[ \s\t]{0,"+ nAverageIndent +"}", "g");

      //AkelPad.MessageBox(0, "pSpaces: "+ pSpaces.length + "\n\nbIsBegin: "+ bIsBegin  + "\n\nnAverageIndent: "+ nAverageIndent + "\n\nCompute: "+ (nSpacesLen - nAverageIndent) + "\n\nCompute2: "+ (Math.max(0, nSpacesLen - nAverageIndent) === 0), WScript.ScriptName, 0);
      if (nIndex === 0 && lpLinesArray[nIndex])
      {
        if (nFirstSpacesLen === 0)
          lpLinesArray[0] = /* pSpaces + */ lpLinesArray[nIndex].replace(rSpacesRemove, "");
        else
          lpLinesArray[0] = /* pSpaces.replace(nFirstSpacesLen, "")  +*/ lpLinesArray[nIndex].replace(rSpacesRemove, "");
      }
      else
      {
        if (lpLinesArray[nIndex])
        {
          if (nFirstSpacesLen === 0)
          {
            lpLinesArray[nIndex] = (
                (bIsBegin)
                  ? pSpaces
                  : pSpaces.replace(rSpacesAdditionalRemove, "")
              ) + (
                (bIsBegin)
                  ? lpLinesArray[nIndex]
                  : (
                    (Math.max(0, nSpacesLen - nAverageIndent) === 0)
                      ? lpLinesArray[nIndex].replace(new RegExp("^[ \s\t]{0,"+ (nAverageIndent - nSpacesLen) +"}", "g"), "")
                      : lpLinesArray[nIndex]/* .replace(rSpacesAdditionalRemove, "") */ .replace(rSpacesRemove, "")
                  )
              );
          }
          else
          {
            lpLinesArray[nIndex] = pSpaces.replace(new RegExp("^[\s\t]{0,"+ (nFirstSpacesLen + nAverageIndent - nSpacesLen) +"}", "g"), "") + lpLinesArray[nIndex].replace(rSpacesRemove, "");
          }
        }
      }

      //AkelPad.MessageBox(0, lpLinesArray[nIndex], WScript.ScriptName, 0 /*MB_OK*/);
      rSpacesAdditionalRemove.lastIndex = 0;
      rSpacesRemove.lastIndex = 0;
    }
  }
}
else
{
  if (lpLinesArray && lpLinesArray.length > 1)
  {
    var nLen = (lpLinesArray.length > 8)? 10 : lpLinesArray.length;                // 8 iterations should be enough to find the indent
    for (var nDelta = 0, aLines = []; nDelta < nLen; nDelta++)
    {
      if (nDelta !== 0 && lpLinesArray[nDelta] && lpLinesArray[nDelta].match(/^[^\s\t]/) && lpLinesArray[nDelta] !== "\n")
        bIsBegin = true;

      if (/^[\s\t]+/.test(lpLinesArray[nDelta]))
      {
        aLineSpacesMatch = lpLinesArray[nDelta].match(/^[\s\t]+/);
        if (aLineSpacesMatch)
          aLines.push(aLineSpacesMatch[0].length);
      }
      //AkelPad.MessageBox(0, lpLinesArray[nDelta], WScript.ScriptName, 0 /*MB_OK*/);
    }

    aLines.sort(function (a, b) { return a - b; });

    var nAverageIndent = aLines[0];

    //AkelPad.MessageBox(0, "nFirstSpacesLen = "+ nFirstSpacesLen + "\n\n" + "nSpacesLen = "+ nSpacesLen + "\n\n" + aLines.join("\n"), WScript.ScriptName,0);
    if (nSpacesLen === 0 && nFirstSpacesLen === 0)
    {
      for (var nIndex = 0, nLinesLen = lpLinesArray.length; nIndex <= nLinesLen; nIndex++)
      {
        if (lpLinesArray[nIndex])
        {
          var rSpacesAdditionalRemove = new RegExp("^[ \s\t]{0,"+ nAverageIndent +"}", "g");
          lpLinesArray[nIndex] = ((bIsBegin)? lpLinesArray[nIndex] : lpLinesArray[nIndex].replace(rSpacesAdditionalRemove, ""));
          rSpacesAdditionalRemove.lastIndex = 0;
        }
      }
    }
  }
}
pText = lpLinesArray.join("\n");


//Insert text
if (nSelect === 2 && (nSelStartMove || nSelEndMove))
  SetRedraw(hWndEdit, false);
AkelPad.ReplaceSel(pText, nSelect ? -1 : 0);

if (nSelect === 2 && (nSelStartMove || nSelEndMove))
{
  AkelPad.SetSel(AkelPad.GetSelStart() + nSelStartMove, AkelPad.GetSelEnd() + nSelEndMove);
  SetRedraw(hWndEdit, true);
}

function SetRedraw(hWnd, bRedraw)
{
  AkelPad.SendMessage(hWnd, 11 /*WM_SETREDRAW*/ , bRedraw, 0);
  if (bRedraw) oSys.Call("user32::InvalidateRect", hWnd, 0, true);
}
