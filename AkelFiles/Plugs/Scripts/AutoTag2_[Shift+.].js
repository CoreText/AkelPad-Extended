// Tag Auto Close
//
// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9326#9326
// http://outstanding.hmarka.net/akelpad/scripts/autotag.js
//
// Version: 2.0 (2021.01.23) (by texter)
//    Добавлена возможность закрытия тэга где угодно, при условии что после оператора сравнения "<" где-нибудь в коде
//    будет всегда пробел и тогда не должно быть никаких проблем забиндить скрипт (например на Shift+.),
//    чтобы не вспоминать какое нужно для этого сочетание клавиш
// Version: 1.4 (2013.05.20) (by VladSh)
//    Исправлено неверное определение тэга при указании нескольких слов текста после открывающего тэга
// Version: 1.3 (2012.10.20) (by VladSh)
//    Исправлено:
//    - неправильное срабатывание после уже установленного закрывающего символа;
//    - раздвоение закрывающего символа в некоторых случаях
//    + Оптимизация кода
// Version: 1.2 (2011.06.24) (by Poma)
//    Now correctly closes tags with attributes
// Version: 1.1 (2010.09.27) (by VladSh)
//    Added handling BBCode-style tags
// Version: 1.0 (2010.09.26) (by FeyFre)
//    Initial release
//
//////////////////////////////////////////////////////////////////////////// Description
//
// Arguments:
//  1 = "<" - the first argument
//  2 = ">" - the second argument
//  3 = "0" - the third argument that finds the opended tag to close it. For that you should set this arg to "1"
//
// Examples:
//  Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"<" ">"`)     or without arguments. For HTML you can bind (Shift+.)
//  Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"[" "]"`)     but for BBCode it's better to use Ctrl+] hot key
//  Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"<" ">" "1"`) to close opened tag somewhere in the docuement (Shift+Alt+.)
//  Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"[" "]" "1"`) to close opened tag somewhere in the docuement (Ctrl+Shift+])
//
// Usage:
//  For smooth integration into AkelPad you can assign hotkey for this Script,
//  which equal keystroke correspondent closing tag style you using, i.e Ctrl+] key for BBCode
//  and Shift+. for XML/HTML/SGML derived markups, but only if you normally use spaces between
//  comparisons in your code like so: " <= ", so to avoid unwanted autoclose.
//
// ╔Possible hot keys:══════════════════╦══════════════════════════════════════════════════════════════════╦══════════════════╗
// ║ Name:                              ║ Command:                                                         ║ Hotkey (446)     ║
// ║ AUTOTAG_HTML_AUTOCLOSE             ║ Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"<" ">"`)     ║ Shift + .        ║
// ║ AUTOTAG_HTML_AUTOCLOSE_COMPLETE    ║ Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"<" ">" "1"`) ║ Shift + Alt + W  ║
// ║ AUTOTAG_BBCode_AUTOCLOSE           ║ Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"[" "]"`)     ║ Ctrl + ]         ║
// ║ AUTOTAG_BBCode_AUTOCLOSE_COMPLETE  ║ Call("Scripts::Main", 1, "AutoTag2_[Shift+.].js", `"[" "]" "1"`) ║ Ctrl + Shift + ] ║
// ╚════════════════════════════════════╩══════════════════════════════════════════════════════════════════╩══════════════════╝
//
// P.s.:
//  You can use AutoTag script in addition with Call("Scripts::Main", 1, "autoInsertTab.js")
//  that you can bind to Enter key and also bind Call("Scripts::Main", 1, "autoInsertQuotes.js") to '=' key
//
//  <a href="./index.html"
//  <a href="javascript:my_function();window.print();"
//

var hWndEdit = AkelPad.GetEditWnd();
if (hWndEdit)
{
  // default arguments
  var qStart = "<";
  var qEnd = ">";
  var bCloseTag = 0;

  if (WScript.Arguments.length >= 1)
  {
    qStart = WScript.Arguments(0) || qStart;
    if (WScript.Arguments.length >= 2)
    {
      qEnd = WScript.Arguments(1) || qEnd;
      if (WScript.Arguments.length >= 3)
      {
        bCloseTag = WScript.Arguments(2) || bCloseTag;
      }
    }
  }

  var aHtmlSelfClosedTags = ["!doctype", "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
  var rPattern = ((+bCloseTag)
    ? "[^<(){}\\[\\]\\\\\\/]"                                           // the pattern that was used before in v1.4
    : "[^<"+ ("\\"+qEnd) +"(){}\\[\\]\$\&\|\;\+\^\%\#\@\!\?\`\\\\\\/]"  // restrict all unwanted symbols in attributes level
  );

  try
  {
    rPattern = new RegExp(rPattern, "i");
  }
  catch (oError)
  {
    AkelPad.MessageBox(0, "Error: \n\n"+ Error.message + "\n\n" + oError.description, WScript.ScriptName, 48);
  }

  var lEnd = qEnd.length;
  var nCaret = AkelPad.GetSelStart();
  var worker = nCaret - lEnd;
  var sText = text = "";
  var tag = new Array();
  var ntag;
  var bSkipSymbol = false;

  while (worker >= 0)                                          // берём по одному символу от каретки до открывающего символа
  {
    ntag = worker + lEnd;                                      // текущая позиция
    sText = text = AkelPad.GetTextRange(worker, ntag);

    if (sText === '"' || sText === "'" && (! bCloseTag))       // skip the level in HTML/XML attributes that is between the double quotes
      bSkipSymbol = ! bSkipSymbol;                             // in order to remove slashes from the unwanted range,
    if (bSkipSymbol)                                           // so the script could apply autoclose only for the pair tags
      sText = "*";                                             //
    else                                                       // you'll be able to autoclose this code:
      sText = text;                                            //   <a href="javascript:my_function();window.print();"

    if (sText && rPattern.test(sText))                         // собираем тэг
    {
      if (text !== " " && text !== qEnd)
        tag.push(text);
      else
        tag = new Array();
    }
    else if (text === qStart)                                  // получаем тэг и добавляем
    {
      tag = tag.reverse().join("");

      if (! tag)
        break;
      if (/^\W/.test(tag))
        break;
      if (InArray(aHtmlSelfClosedTags, tag))
        break;

      text = qStart + "/" + tag;
      ntag += tag.length;                                      // текущая позиция + длина тэга

      if (
        AkelPad.GetTextRange(ntag, ntag + lEnd) !== qEnd &&    // закрывающий символ тэга перед значением
        AkelPad.GetTextRange(nCaret - lEnd, nCaret) !== qEnd)  // закрывающий символ тэга, когда нет текста
      {
        text = (bCloseTag)? text : qEnd + text;
        nCaret += (bCloseTag)? lEnd - qEnd.length : lEnd;
      }

      if (tag.substr(tag.length - lEnd) !== qEnd)
        text += qEnd;                                          // закрывающий символ закрывающего тэга

      AkelPad.ReplaceSel(text);
      AkelPad.SetSel(nCaret, nCaret);

      WScript.Quit();
    }
    else
      break;

    worker--;
  }

  AkelPad.ReplaceSel(qEnd);
}

/**
 * Find element in the array.
 *
 * @param array - haystack
 * @param obj   - needle
 * @return bool if found
 */
function InArray(arr, obj)
{
  for (var i = 0; i < arr.length; i++)
    if (arr[i].toUpperCase() === obj.toUpperCase())
      return true;
  return false;
}
