' TabCloseExts.vbs
'========================   ��������   =====================================
' ������� ������� ������ �������� ����� ������
'=======================   ���������  ======================================
' ������ ����� ������, ���������� ����� ������������ | ; * ? < > " / \ 
'========================   �������   ======================================
' -"������� ������� ������ .vbs" Call("Scripts::Main", 1, "TabCloseExts.vbs", `vbs`)
' -"������� ������� ������ .txt � .ini" Call("Scripts::Main", 1, "TabCloseExts.vbs", `txt|ini`)

' ������������ Functions.vbs, ������� ������� �������� � ...AkelFiles\Plugs\Scripts\Include\

' �����:           ������ ������
' ������:          1.4 (12.03.2012 - 23.12.2014)
' Mail:            Averin-And@yandex.ru
' Site:            http://tc-image.3dn.ru/forum/9-413-1197-16-1333817670
'===========================================================================
With AkelPad If .GetEditWnd = 0 Then WScript.Quit
  .Include("Functions.vbs") : MainWnd = .GetMainWnd
  If WScript.Arguments.Count = 0 Then
    Line = .InputBox(hMainWnd, "������� ������� �������� �����", "������� ���(�) ������, ������� ������� ����� �������." & vb & "����������� ; (����� � �������)", "txt")
  Else
    Line = WScript.Arguments(0)
  End If
  If Len(Line) = 0 Then WScript.Quit
  Line = "|" & RegExpReplace(Line, "[\t\\\*\?;""/:<>]", "|", 1, 0, 1) & "|" : nTab = GetTab : SetRedraw MainWnd, False
  For i = 1 To nTab
    xFile = .GetEditFile(0)
    If Len(xFile) > 0 And InStr(Line, "|" & LCase(.GetFilePath(xFile, 4)) & "|") Then cmd 4318
    cmd 4316
  Next
  SetRedraw MainWnd, True
End With