' CreateTab&Arhive.vbs
'========================   ��������   =====================================   
' �������� ������ ���� �������� ������� + �������������
'=======================   ���������  ======================================
' 1-� ��������:  
'   0 - �������� ������ ���� �������� �������
'   1 - �������� � �������� ������
'   2 - �������� � ������������� ������ �� ������
'   3 - �������� � ������������� ������ ���� �������� ������� � ���������� ����������
'         ������ ���� � ���������� ����� ���������� ���������� ������ (%a\1\Name.txt)
' 2-� ��������:
'    ���� ���� ��������� ������  
' 3-� ��������:  
'   ���� ���� ��������� �����
'========================    �������    ====================================
' -"�������� ������ ���� �������� �������" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"0"`)
' -"�������� ������ ���� �������� ������� +" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"1"`)
' -"������������� ���� �������� �������" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"2"`)
' -"������������� ���� �������� �������, ������� ���������� � �����������" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"%a\1\Name.txt" "" "e:\�����_AkelPad"`) Icon("%a\AkelPadImage.dll",779)

' ������������ Functions.vbs, ������� ������� �������� � ...AkelFiles\Plugs\Scripts\Include\

' �����:           ������ ������
' ������:          1.3 (19.07.2011 - 23.12.2014)
' Mail:            Averin-And@yandex.ru
' Site:            http://tc-image.3dn.ru/forum/9-350-1082-16-1333503831
'===========================================================================
With WScript Cnt = .Arguments.Count
 If Cnt > 0 Then
   prm = .Arguments(0)
   If Cnt > 1 Then
     aList = .Arguments(1) : If Cnt > 2 Then aPath  = .Arguments(2)
   End If
 End If
End With

With AkelPad
   If Len(aList) = 0 Then aList = .GetAkelDir(1) & "\List\AkelPadTabList.lst"
   If Len(aPath) = 0 Then aPath = "c:\"
   .Include("Functions.vbs") : CreateAllTabLists aList, prm
   Select Case  prm
     Case "1" .OpenFile aList
     Case "2", "3" .Call "Scripts::Main", 1, "ZipArhive.vbs", aPath & Chr(32) & Chr(34) & aList & Chr(34) ' ����� ������� �������������
   End Select
End With