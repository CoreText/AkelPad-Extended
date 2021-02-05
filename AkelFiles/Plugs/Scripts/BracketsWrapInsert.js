// http://akelpad.sourceforge.net/forum/viewtopic.php?p=1608#1608
// Description(1033): Formation, carrying over and disclosing of symbols of the block {}
// Description(1049): Проставка символов скрипт-блока {}
// Version: 4.0 (2020.01.06)
// Author: VladSh / texter
//
// Extended Version: 4.0 (2020.01.06) of BlockEnclose.js
//
/////////////////////////////////////// Usage:
//
// Call("Scripts::Main", 1, "BracketsWrapInsert.js", "-style=1")
//
// The possible hotkey is Ctrl+Shift+Space, or Ctrl+Down
//
/////////////////////////////////////// Arguments:
//
//  -style:
//    [0] - allman (old c-style)
//    1 - java
//
/////////////////////////////////////// that will allow to insert braces, like so:
//
// if ()[caret was here] {
//   [caret after]
// }
//
/////////////////////////////////////// and wrap selection appropriately, like so:
//
// if (a < b)
//   return true;
//
// if (a < b)
// [selection begin here]  return true;[selection end, or somewhere on the next line]
//
// if (a < b)
// {
//   return true;[caret after]
// }
//
// and braces will align on the same column as `if` statement,
// exactly where select start was.
//
/////////////////////////////////////// split line, like so:
//
// some [caret here]text
//
// some {
//   text[caret here]
// }
//
///////////////////////////////////////

var hWndEdit;
if (AkelPad.GetMainWnd() && AkelPad.IsAkelEdit())
{
  if (!AkelPad.Include("selCompleteLine.js")) WScript.Quit();
  hWndEdit = AkelPad.GetEditWnd();
  oCh.runWithRedraw();
}

function process()
{
  var existentShift = "";
  var existentLeft = "";
  var existentRight = "";
  var smbNull = " \t";
  getShift();
  var nStyle = AkelPad.GetArgValue("style", 0);
  var leftPartEndStyle = (nStyle) ? " " : pBreak;

  oCh.setCompleteLineText();

  var sSelectedText = AkelPad.GetSelText();
  var nSelectedTextStart = AkelPad.GetSelStart();
  //var nSelectedTextEnd = AkelPad.GetSelEnd();
  var bNotNewLine = true;

  var nSelectedFirstSpacesCount = sSelectedText.replace(/^(\s*).*$/, "$1").length;
  var nMinLineStart = AkelPad.SendMessage(hWndEdit, 3138 /*AEM_GETRICHOFFSET*/ , 18 /*AEGI_WRAPLINEBEGIN*/ , nSelectedTextStart);

  if (nSelectedTextStart > nMinLineStart + smbNull.length)
    sShift = sShift.slice(nSelectedFirstSpacesCount);

  if (oCh.Text)
  {
    if (nSelectedTextStart < nMinLineStart + smbNull.length)
      existentShift = oCh.Text.slice(0, oCh.Text.lastIndexOf(oStr.trim(oCh.Text, smbNull)));                         // Определяем существующий отступ 1-го значащего символа от начала строки
    else
      existentShift = oCh.Text.slice(nSelectedFirstSpacesCount, oCh.Text.lastIndexOf(oStr.trim(oCh.Text, smbNull)));
  }

  if (oCh.rBegin[0] === oCh.rBegin[1])                                                                               // Если нет выделения
  {
    pozOpen = oCh.Text.lastIndexOf(" " + sbOpen);
    if (pozOpen === -1)
    {
      pozOpen = oCh.Text.lastIndexOf(pTab + sbOpen);
      bNotNewLine = false;
    }
    if (pozOpen > 0)                                                                                                 // Действия, выполняемые, если в текущей строке есть открывающая скобка
    {
      existentLeft = oStr.rtrim(oCh.Text.slice(0, pozOpen), smbNull);                                                // Остающиеся символы выделения перед открывающей скобкой
      if (existentLeft)
        existentLeft += leftPartEndStyle;

      existentRight = oStr.trim(oCh.Text.slice(pozOpen + 2), smbNull);                                               // Кусок выделения после открывающей скобки, т.е. который должен быть внутри блока; 2 - размер искомого блока: " " + sbOpen
      bNotNewLine = true;
    }
    else
    {
      existentLeft = oStr.trim(AkelPad.GetTextRange(oCh.rResult[0], oCh.rBegin[0]), smbNull);
      if (existentLeft)
      {
        if (! bNotNewLine && nStyle)
        {
          existentLeft = existentShift + existentLeft;
          bNotNewLine = true;
        }
        else
        {
          existentLeft = existentShift + existentLeft + leftPartEndStyle;
          bNotNewLine = false;
        }
      }

      existentRight = oStr.trim(AkelPad.GetTextRange(oCh.rBegin[0], oCh.rResult[1]), smbNull);
    }

    if (existentRight.charAt(existentRight.length - 1) === sbClose)                                                  // Если закрывающая скобка есть - удаляем, так проще, - потом всё равно проставляем
      existentRight = existentRight.substr(0, existentRight.length - 1);

    existentRight = existentShift + sShift + existentRight;
  }
  else
  {
    existentRight = sShift + oCh.Text.replace(/\r/g, pBreak + sShift);
    bNotNewLine = false;
  }

  if (nStyle && bNotNewLine)
  {
      oCh.Text = existentLeft + ' ' + sbOpen + pBreak + existentRight + pBreak + existentShift + sbClose;
      bNotNewLine = false;
  }
  else
    oCh.Text = existentLeft + existentShift + sbOpen + pBreak + existentRight + pBreak + existentShift + sbClose;

  oCh.setSelCaret(oCh.rResult[0] + oCh.Text.length - (existentShift.length + 2));                                    // Устанавливаем каретку в конец блока
}
