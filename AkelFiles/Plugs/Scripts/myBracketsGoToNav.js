// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9923#9923
// Version: 2013-08-23
// Author: KDJ / texter
//
// *** Go to or select between nearest brackets ***
//
// Usage:
//   Call("Scripts::Main", 1, "myBracketsGoToNav.js", "l") - go to left to opening bracket
//   Call("Scripts::Main", 1, "myBracketsGoToNav.js", "r") - go to right to closing bracket
//
// Remarks:
//   To change a set of brackets, change the value nABrackets variable.
//   Can assign shortcut keys, eg: Ctrl+Alt+Left, Ctrl+Alt+Right

var nABrackets = 1;
var aOpen;
var aClose;


if (nABrackets == 0)
{
  aOpen  = ["(", "[", "{", "<", "'", "\"", "\/", "\\", "\`", "“", "«", "\,", "\.", "\;", "\:", "\?", "\!", "\#", "\^", "\%", "\&", "\@", "\|", "\=", "\-", "\+", "\*"];
  aClose = [")", "]", "}", ">", "'", "\"", "\/", "\\", "\`", "”", "»", "\,", "\.", "\;", "\:", "\?", "\!", "\#", "\^", "\%", "\&", "\@", "\|", "\=", "\-", "\+", "\*"];
}
else if (nABrackets == 1)
{
  aOpen  = ["(", "[", "{", "<", "'", "\"", "\`", "“", "«", "\,", "\.", "\;", "\:", "\?", "\!", "\#", "\^", "\%", "\&", "\@", "\|", "\=", "\-", "\+", "\*"];
  aClose = [")", "]", "}", ">", "'", "\"", "\`", "”", "»", "\,", "\.", "\;", "\:", "\?", "\!", "\#", "\^", "\%", "\&", "\@", "\|", "\=", "\-", "\+", "\*"];
}
else if (nABrackets == 2)
{
  aOpen  = ["(", "[", "{"];
  aClose = [")", "]", "}"];
}
else if (nABrackets == 3)
{
  aOpen  = ["'", "\"", "\`", "“", "«"];
  aClose = ["'", "\"", "\`", "”", "»"];
}

var hEditWnd = AkelPad.GetEditWnd();
var selText = AkelPad.GetSelText();
var sAction;

if (! hEditWnd)
  WScript.Quit();
if (WScript.Arguments.length)
  sAction = WScript.Arguments(0);
if (! sAction)
  WScript.Quit();

if (selText !== '' && sAction === 'l') {
  AkelPad.SendMessage(hEditWnd, 3044 /*AEM_KEYDOWN*/, 0x25 /*Left Arrow*/, 0);
}
else if (selText !== '' && sAction === 'r') {
  AkelPad.SendMessage(hEditWnd, 3044 /*AEM_KEYDOWN*/, 0x27 /*Right Arrow*/, 0);
}


var nCarPos   = GetOffset(hEditWnd, 5 /*AEGI_CARETCHAR*/);
var nLastChar = GetOffset(hEditWnd, 2 /*AEGI_LASTCHAR*/);
var sTxt      = AkelPad.GetTextRange(0, nLastChar, 1 /*\r*/);
var sCarChar  = AkelPad.GetTextRange(nCarPos, nCarPos + 1);
var bSelAll   = false;
var nPos;
var nBrack;
var nBrackPos;
var nBegSel;
var nEndSel;
var i;

if ((sAction == "l") && (nCarPos > 0))
{
  nBrackPos = -1;
  for (i = 0; i < aOpen.length; ++i)
  {
    nPos = sTxt.lastIndexOf(aOpen[i], nCarPos - 1);
    if (nPos > nBrackPos)
      nBrackPos = nPos;
  }
  if (nBrackPos > -1)
    AkelPad.SetSel(nBrackPos, nBrackPos);
}

else if ((sAction == "r") && (nCarPos < nLastChar - 1))
{
  nBrackPos = nLastChar;
  for (i = 0; i < aClose.length; ++i)
  {
    nPos = sTxt.indexOf(aClose[i], nCarPos + 1);
    if ((nPos > -1) && (nPos < nBrackPos))
      nBrackPos = nPos;
  }
  if (nBrackPos < nLastChar)
    AkelPad.SetSel(nBrackPos, nBrackPos);
}

else if (sAction == "L")
{
  nBrack = ArraySearch(aOpen, sCarChar);

  if (nBrack < 0)
  {
    nBrackPos = -1;
    for (i = 0; i < aOpen.length; ++i)
    {
      nPos = sTxt.lastIndexOf(aOpen[i], nCarPos - 1);
      if (nPos > nBrackPos)
      {
        nBrackPos = nPos;
        nBrack    = i;
      }
    }
    if (nBrackPos > -1)
      nBegSel = nBrackPos + 1;
  }
  else
  {
    nBegSel = nCarPos;
    bSelAll = true;
  }

  if (nBrack > -1)
  {
    nBrackPos = sTxt.indexOf(aClose[nBrack], nCarPos + bSelAll);
    if (nBrackPos > -1)
    {
      if ((nBrackPos == nCarPos) && (! bSelAll))
      {
        --nBegSel;
        bSelAll = true;
      }
      nEndSel = (bSelAll) ? (nBrackPos + 1) : (nBrackPos);
      AkelPad.SetSel(nEndSel, nBegSel);
    }
  }
}

else if ((sAction == "R") && (nCarPos > 0))
{
  nBrack = ArraySearch(aClose, sCarChar);

  if (nBrack < 0)
  {
    nBrackPos = nLastChar;
    for (i = 0; i < aClose.length; ++i)
    {
      nPos = sTxt.indexOf(aClose[i], nCarPos + 1);
      if ((nPos > -1) && (nPos < nBrackPos))
      {
        nBrackPos = nPos;
        nBrack    = i;
      }
    }
    if (nBrackPos < nLastChar)
      nBegSel = nBrackPos;
  }
  else
  {
    nBegSel = nCarPos + 1;
    bSelAll = true;
  }

  if (nBrack > -1)
  {
    nBrackPos = sTxt.lastIndexOf(aOpen[nBrack], nCarPos - bSelAll);
    if (nBrackPos > -1)
    {
      if ((nBrackPos == nCarPos) && (! bSelAll))
      {
        ++nBegSel;
        bSelAll = true;
      }
      nEndSel = (bSelAll) ? (nBrackPos) : (nBrackPos + 1);
      AkelPad.SetSel(nEndSel, nBegSel);
    }
  }
}

function ArraySearch(aArray, sChar)
{
  var nPos = -1;
  var i;

  for (i = 0; i < aArray.length; ++i)
  {
    if (aArray[i] == sChar)
    {
      nPos = i;
      break;
    }
  }
  return nPos;
}

function GetOffset(hWnd, nFlag)
{
  var nOffset = -1;
  var lpIndex;

  if (lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/))
  {
    AkelPad.SystemFunction().Call("User32::SendMessage" + _TCHAR, hWnd, 3130 /*AEM_GETINDEX*/, nFlag, lpIndex);
    nOffset = AkelPad.SystemFunction().Call("User32::SendMessage" + _TCHAR, hWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
    AkelPad.MemFree(lpIndex);
  }
  return nOffset;
}

