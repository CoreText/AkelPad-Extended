// AZJIO / texter
// 14.02.2021
//
// Description(1033): Highlight the text in the console (Log plugin)
// Description(1049): ���������� ����� � ������� (Log ������)
//
// �����, ����� ���� ����� "%a\AkelFiles\Plugs\Coder\sss1.tmp" � "%a\AkelFiles\Plugs\Coder\ss1.coder"
// sss1.tmp ���������� ��������� � ss1.coder ��� ������ ������ �������.
//
// Usage:
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="������" -bNotRegExp=1');             // ������������ �����
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="' + sWhatText + '" -bNotRegExp=1');  // sWhatText - ���������� � �������
//
// ������ ������� �������� ���.���. � ������� `FindReplaceEx.js`:
// AkelPad.Call("Scripts::Main", 1, "LogHighLight.js", '-sSelText="' + sWhatText + '" -bNotRegExp=' + (SendDlgItemMessage(hDlg, IDC_SEARCH_REGEXP, 240 /*BM_GETCHECK*/, 0, 0)?0:1));
// 
// highlight test RegExp (?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')

var hWndOutput = GetOutputWindow(); // �������� ���������� ���� �������
var hMainWnd;
var oError;

if (! hWndOutput)
{
  WScript.Echo("������� �������, ������ ������������");
  WScript.Quit();
}

var pPath = AkelPad.GetAkelDir();
var pPathCoder = pPath + "\\AkelFiles\\Plugs\\Coder\\sss1.tmp";
if (! FileExists(pPathCoder))
{
  WScript.Echo('����� ���� "\\AkelFiles\\Plugs\\Coder\\sss1.tmp"');
  WScript.Quit();
}

// Arguments
var bNotRegExp = AkelPad.GetArgValue("bNotRegExp", 1);
var sText = AkelPad.GetArgValue("sText", "");
var sSelText = "";
sSelText = (! sText)? AkelPad.GetSelText() : decodeURIComponent(sText.replace(/^["]/, "").replace(/["]$/, ""));

if (sSelText === "")
{
  hMainWnd = AkelPad.GetMainWnd();
  if (AkelPad.MessageBox(hMainWnd, "����� �������� �����!\n������������ ���������� ��������� �� ������ ������?", WScript.ScriptName, 4 + 256 + 32) === 6)
  {
    sSelText = AkelPad.GetClipboardText();
    bNotRegExp = 0;
  }
  else
    WScript.Quit();
}

try
{
  var sTextOriginal = sSelText;
	var sSelTextEscaped = sSelText
	 .replace(/[\\\/.,^\!@#\�$%&*+\-\_\=?|()\[\]{}\<\>\;\:]/g, "\\$&")
	 .replace(/\"\"/g, '\\""')                                        // escape " quotes between quotes ""
	 .replace(/\`/g, '\\W')                                           // escape ` in ss1.coder regexp string
	;

  sSelText = sSelText.replace(/^["]/, "").replace(/["]$/, "");      // remove unwanted quotes

	AkelPad.SetEditWnd(hWndOutput);                                   // ������������� ������� ����� ��������������
	var sLogText = AkelPad.GetTextRange(0, -1);                       // �������� ����� �������
	var pPathCoder1 = pPath + "\\AkelFiles\\Plugs\\Coder\\ss1.coder";
	var pTextCoder = AkelPad.ReadFile(pPathCoder, 0xD, 1200, true);   // 1200 = 16LE

	if (/[\r\n]/.test(sSelTextEscaped))                               // �������� ��������� ���� ������� ������������� �����, Coder ��� �� ���������
	{
	  AkelPad.SetEditWnd(0);
	  WScript.Echo("�� ��� �������������� ������");
	  WScript.Quit();
	}

  //AkelPad.MessageBox(0, "\n\nbNotRegExp:\n"+ bNotRegExp +"\n\nText:\n"+ sSelText +"\n\nText Escaped:\n"+ sSelTextEscaped, WScript.ScriptName, 0);
	if (bNotRegExp)
	  sSelText = sSelTextEscaped;

	pTextCoder = pTextCoder.replace(/%#\$&@/g, sSelText);             // ������ ������� � ���.���. ������

	AkelPad.WriteFile(pPathCoder1, pTextCoder, -1, 1200, true);       // 1200 = 16LE
}
catch (oError)
{
  AkelPad.MessageBox(0,
    'LogHighLight.js Error:\n'+ oError.name +"\n"+ oError.description  +"\n\n"+ sSelText +"\n\nPath to coder file:\n"+ pPathCoder1 +"\n\npTextCoder:\n"+ pTextCoder
    , WScript.ScriptName, 16 /*MB_ICONERROR*/);
}

AkelPad.Call("Log::Output", 4, sLogText, -1, 0, 0, ".ss1")          // �������� ����� ������� ��������� alias
AkelPad.SetEditWnd(0);                                              // ���������� ���� ��������������
AkelPad.Call("Coder::Settings", 2);                                 // ������������  ���������

//////////////////////////////////////////////////////////////////////

function GetOutputWindow()
{
  var lpWnd;
  var hWnd = 0;
  if (lpWnd = AkelPad.MemAlloc(_X64 ? 8 : 4 /*sizeof(HWND)*/))
  {
    AkelPad.Call("Log::Output", 2, lpWnd);
    hWnd = AkelPad.MemRead(lpWnd, 2 /*DT_QWORD*/ );
    AkelPad.MemFree(lpWnd);
  }
  return hWnd;
}

// ���� ������ ������ ������������, �� ����� ������ ������� ��� �������
function FileExists(pPathCoder)
{
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  return (fso.FileExists(pPathCoder) ? 1 : 0);
}
