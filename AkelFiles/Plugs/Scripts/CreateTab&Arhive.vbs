' CreateTab&Arhive.vbs
'========================   Описание   =====================================   
' Создание списка всех открытых вкладок + архивирование
'=======================   Параметры  ======================================
' 1-й параметр:  
'   0 - создание списка всех открытых вкладок
'   1 - создание и открытие списка
'   2 - создание и архивирование файлов по списку
'   3 - создание и архивирование списка всех открытых вкладок и сохранение безымянных
'         полный путь к примерному файлу сохранению безымянных файлов (%a\1\Name.txt)
' 2-й параметр:
'    путь куда сохранять список  
' 3-й параметр:  
'   путь куда сохранять архив
'========================    Примеры    ====================================
' -"Создание списка всех открытых вкладок" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"0"`)
' -"Создание списка всех открытых вкладок +" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"1"`)
' -"Архивирование всех открытых вкладок" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"2"`)
' -"Архивирование всех открытых вкладок, включая безымянные с сохранением" Call("Scripts::Main", 1, "CreateTab&Arhive.vbs", `"%a\1\Name.txt" "" "e:\Архив_AkelPad"`) Icon("%a\AkelPadImage.dll",779)

' используется Functions.vbs, который следует положить в ...AkelFiles\Plugs\Scripts\Include\

' Автор:           Аверин Андрей
' Версия:          1.3 (19.07.2011 - 23.12.2014)
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
     Case "2", "3" .Call "Scripts::Main", 1, "ZipArhive.vbs", aPath & Chr(32) & Chr(34) & aList & Chr(34) ' вызов скрипта архивирования
   End Select
End With