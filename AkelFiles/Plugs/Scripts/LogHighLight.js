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

var hWndOutput = GetOutputWindow(); // �������� ���������� ���� �������
var hMainWnd;
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
var sSelText = AkelPad.GetArgValue("sSelText", AkelPad.GetSelText());

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

sSelText = sSelText.replace(/[\\\/.^$+*?|()\[\]{}]/g, "\\$&").replace(/\"\"/g, '\\""');

AkelPad.SetEditWnd(hWndOutput);                                   // ������������� ������� ����� ��������������
var sLogText = AkelPad.GetTextRange(0, -1);                       // �������� ����� �������
var pPathCoder1 = pPath + "\\AkelFiles\\Plugs\\Coder\\ss1.coder";
var pTextCoder = AkelPad.ReadFile(pPathCoder, 0xD, 1200, true);   // 1200 = 16LE

if (/[\r\n]/.test(sSelText))                                      // �������� ��������� ���� ������� ������������� �����, Coder ��� �� ���������
{
  AkelPad.SetEditWnd(0);
  WScript.Echo("�� ��� �������������� ������");
  WScript.Quit();
}

if (bNotRegExp)
  sSelText = sSelText.replace(/[\\]\\[\\{\\}\\(\\)\\*\\+\\?\\.\\^\\$\\|\\=\\<\\>\\#\\\\]/g, "\\"); // ������������ ����������� ����������� ���������

pTextCoder = pTextCoder.replace(/%#\$&@/g, sSelText);             // ������ ������� � ���.���. ������
AkelPad.WriteFile(pPathCoder1, pTextCoder, -1, 1200, true);       // 1200 = 16LE
AkelPad.Call("Log::Output", 4, sLogText, -1, 0, 0, ".ss1")        // �������� ����� ������� ��������� alias

AkelPad.SetEditWnd(0);                                            // ���������� ���� ��������������
AkelPad.Call("Coder::Settings", 2);                               // ������������  ���������


function GetOutputWindow()
{
  var lpWnd;
  var hWnd = 0;

  if (lpWnd = AkelPad.MemAlloc(_X64 ? 8 : 4 /*sizeof(HWND)*/ ))
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
