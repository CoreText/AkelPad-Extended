 //  ============================================================================
 //  Version: 2015-10-07
 //  Author: Kley
 //
 //  Description(1033): Rename/Save As... file.
 //  Description(1049): Переименовать/Сохранить Как... файл.
 //
 //  Arguments:
 //  -dir="%a\MyDir"  -папка для сохранения файла (по умолчанию папка редактируемого файла).
 //                     Если папка не существует, то она будет создана.
 //  -save=true       -сохранить как... (по умолчанию false - переименовать).
 //                     Новый файл сохраняется в любом случаи (в указанную папку).
 //
 //  Usage:
 //  Call("Scripts::Main", 1, "RenameFileAs.js", `-dir="c:\temp" -save=true`) - "Save As... (MyDir)"
 //  Call("Scripts::Main", 1, "RenameFileAs.js", `-save=true`)                - "Save As..."
 //  Call("Scripts::Main", 1, "RenameFileAs.js")                              - "Rename..."
 //
 //  Note:
 //  Основное назначение скрипта - переименование файла.
 //  Ситуации, типа: "Такой файл существует. Заменить?" не обрабатываются.
 //  Для создания папок\файлов, например в папке ProgramFiles,
 //                            возможно, потребуются права Администратора.
 //
 //  Сборка из функций разных скриптов плюс RenameFile.js (v1.1) от Instructor.
 //  ============================================================================

 //Arguments
 var pDefaultDir = AkelPad.GetArgValue("dir", "");
 var bSaveAs = AkelPad.GetArgValue("save", false);

 //Variables
 var hWndEdit = AkelPad.GetEditWnd();
 if (!hWndEdit) WScript.Quit();

 var oSys = AkelPad.SystemFunction();
 var hMainWnd = AkelPad.GetMainWnd();
 var pFileFullName = AkelPad.GetEditFile(0);
 var pFileBaseName = AkelPad.GetFilePath(pFileFullName, 3 /*CPF_FILEBASENAME*/);
 var pExt = AkelPad.GetFilePath(pFileFullName, 4 /*CPF_FILEEXT*/);
 var pFileDir = AkelPad.GetFilePath(pFileFullName, 1 /*CPF_DIR*/);
 var pNewFileFullName = "";
 var pClassName;
 var lpPoint64;
 var lpSel;
 var lpCaret;
 var dwFlags;
 var hSubClass;
 var pBookmarks;
 var aCurMarks;
 var nCodePage;
 var nBOM;
 var nSaveResult;
 var nCloseFile = 0;
 var bCancel = false;
 var aFont = ["MS Shell Dlg", 1, 10];

 var hWndFile = 0;
 var hWndExt  = 0;
 var hWndOk   = 0;

 //Control IDs
 var ID_FILEE   = 1001;
 var ID_EXTE    = 1002;
 var ID_MENUB   = 1003;
 var ID_OKB     = 1004;
 var ID_CANCELB = 1005;
 var ID_STATIC  =   -1;

 if (/%a\\/.test(pDefaultDir))
   pDefaultDir = pDefaultDir.replace(/%a/, AkelPad.GetAkelDir());

 if (pDefaultDir)
 {
   if (!IsFileExist(pDefaultDir))
   {
     if (!CreateDir(pDefaultDir))
       WScript.Quit();
   }

   if (pFileFullName)
   {
     if (bSaveAs)
       pFileDir = pDefaultDir;
   }
   else
   {
     pExt = GetAliasExt(hWndEdit, 0);

     if (!pExt || pExt == "?")
       pExt = GetDefaultExt(hMainWnd);

     pFileDir = pDefaultDir;
     bSaveAs = true
   }
 }
 else
 {
   if (!pFileFullName)
   {
     // AkelPad.MessageBox(hMainWnd, GetLangString(14), WScript.ScriptName, 48 /*MB_OK|MB_ICONEXCLAMATION*/);
     AkelPad.Command(4105);
     WScript.Quit();
   }
 }

 pClassName = "AkelPad::Scripts::" +
               WScript.ScriptName  + "::" +
               oSys.Call("kernel32::GetCurrentProcessId");

 if (AkelPad.WindowRegisterClass(pClassName))
 {
   //0x50000000 = WS_VISIBLE|WS_CHILD
   //0x50010000 = WS_VISIBLE|WS_CHILD|WS_TABSTOP
   //0x50010001 = WS_VISIBLE|WS_CHILD|WS_TABSTOP|BS_DEFPUSHBUTTON
   //0x50810080 = WS_VISIBLE|WS_CHILD|WS_TABSTOP|WS_BORDER|ES_AUTOHSCROLL
   //0x90C80840 = DS_SETFONT|WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|DS_CENTER

   AkelPad.CreateDialog(0,
                        pClassName,
                        (bSaveAs) ? GetLangString(12) : GetLangString(11),
                        0x90C80840,
                        10,
                        10,
                        270,
                        63,
                        hMainWnd,
                        DialogCallback,
                        0x1,            //CDF_MODAL
                        0,              //hMenu
                        0,              //hInstance
                        "",             //pFaceName
                        0,              //nFontStyle
                        0,              //nPointSize
                        "|",
   0, "STATIC", GetLangString(0), 0x50000000, 8,   8,  195, 10, ID_STATIC,  0, "|",
   0, "STATIC", GetLangString(1), 0x50000000, 212, 8,  50,  10, ID_STATIC,  0, "|",
   0, "STATIC", "\u2022",         0x50000000, 206, 25, 5,   10, ID_STATIC,  0, "|",
   0, "EDIT"  , "",               0x50810080, 8,   20, 195, 14, ID_FILEE,   0, "|",
   0, "EDIT"  , "",               0x50810080, 212, 20, 50,  14, ID_EXTE,    0, "|",
   0, "BUTTON", "...",            0x50010000, 8,   40, 15,  15, ID_MENUB,   0, "|",
   0, "BUTTON", "OK",             0x50010001, 154, 40, 50,  15, ID_OKB,     0, "|",
   0, "BUTTON", GetLangString(5), 0x50010000, 212, 40, 50,  15, ID_CANCELB, 0);

   AkelPad.WindowUnregisterClass(pClassName);
 }

 if (!bCancel)
 {
   if (lpPoint64=AkelPad.MemAlloc(_X64?16:8 /*sizeof(POINT64)*/))
   {
     if (lpSel=AkelPad.MemAlloc(_X64?56:32 /*sizeof(AESELECTION)*/))
     {
       if (lpCaret=AkelPad.MemAlloc(_X64?24:12 /*sizeof(AECHARINDEX)*/))
       {
         //Get document state
         SendMessage(hWndEdit, 3179 /*AEM_GETSCROLLPOS*/, 0, lpPoint64);
         SendMessage(hWndEdit, 3125 /*AEM_GETSEL*/, lpCaret, lpSel);
         nCodePage=AkelPad.GetEditCodePage(hWndEdit);
         nBOM=AkelPad.GetEditBOM(hWndEdit);

         if (AkelPad.IsPluginRunning("LineBoard::Main"))
           pBookmarks=GetBookmarksString(hWndEdit, 0);
         if (AkelPad.IsPluginRunning("Coder::HighLight"))
           aCurMarks = GetMarks();

         if (bSaveAs)
         {
           //SaveAs file
           nSaveResult = AkelPad.SaveFile(hWndEdit, pNewFileFullName, nCodePage, nBOM);
           if (nSaveResult)
           {
             if (nSaveResult != -4 /*ESD_CODEPAGEERROR*/)
               AkelPad.MessageBox(hMainWnd, GetLangString(4).replace(/%d/, "" + nSaveResult),
                                                    WScript.ScriptName, 16 /*MB_ICONERROR*/);
           }
           else
             //Close editing file
             nCloseFile = SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4324 /*IDM_WINDOW_FILECLOSE*/, 0);
         }
         else
         {
           //Close editing file
           nCloseFile = SendMessage(hMainWnd, 273 /*WM_COMMAND*/, 4324 /*IDM_WINDOW_FILECLOSE*/, 0);

           if (nCloseFile)
           {
             //Rename file
             //if (!oSys.Call("kernel32::MoveFile" + _TCHAR, pFileFullName, pNewFileFullName))
             //{
             //  AkelPad.MessageBox(hMainWnd, GetLangString(3).replace(/%d/, "" + oSys.GetLastError()),
             //                                         WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
             //  pNewFileFullName=pFileFullName;
             //}
             var fso = new ActiveXObject("Scripting.FileSystemObject");
             fso.MoveFile(pFileFullName, pNewFileFullName);
             WScript.Sleep(500);
           }
         }

         if (nCloseFile)
         {
           //Open file
           AkelPad.OpenFile(pNewFileFullName, 0, nCodePage, nBOM);
           WScript.Sleep(500);

           //Restore document position
           if (AkelPad.IsPluginRunning("LineBoard::Main"))
             AkelPad.Call("LineBoard::Main", 13, AkelPad.GetEditWnd(), 0, pBookmarks);
           if (AkelPad.IsPluginRunning("Coder::HighLight"))
             SetMarks(aCurMarks);

           dwFlags=AkelPad.MemRead(_PtrAdd(lpSel, _X64?48:24) /*offsetof(AESELECTION, dwFlags)*/, 3 /*DT_DWORD*/);
           AkelPad.MemCopy(_PtrAdd(lpSel, _X64?48:24) /*offsetof(AESELECTION, dwFlags)*/,
                                        dwFlags | 0x808 /*AESELT_LOCKSCROLL|AESELT_INDEXUPDATE*/, 3 /*DT_DWORD*/);
           SendMessage(hWndEdit, 3126 /*AEM_SETSEL*/, lpCaret, lpSel);
           SendMessage(hWndEdit, 3180 /*AEM_SETSCROLLPOS*/, 0, lpPoint64);

           if (AkelPad.IsPluginRunning("Explorer::Main"))
           {
              //AkelPad.Call("Explorer::Main", 2);
              AkelPad.Call("Explorer::Main", 1, "");
           }
           dwFlags = null;
         }
         AkelPad.MemFree(lpCaret);
       }
       AkelPad.MemFree(lpSel);
     }
     AkelPad.MemFree(lpPoint64);
   }
 }

 function DialogCallback(hWnd, uMsg, wParam, lParam)
 {
   if (uMsg == 272 /*WM_INITDIALOG*/)
   {
     hWndFile = GetDlgItem(hWnd, ID_FILEE);
     hWndExt  = GetDlgItem(hWnd, ID_EXTE);
     hWndOk   = GetDlgItem(hWnd, ID_OKB);

     SetEditFont();

     SendMessage(hWndFile, 197 /*EM_LIMITTEXT*/ , 255, 0);
     SendMessage(hWndFile, 194 /*EM_REPLACESEL*/,   0, pFileBaseName);
     SendMessage(hWndExt,  197 /*EM_LIMITTEXT*/ , 255, 0);
     SendMessage(hWndExt,  194 /*EM_REPLACESEL*/,   0, pExt);

     //Устанавливаем раскладку клавиатуры, как в AkelPad
     oSys.Call("user32::ActivateKeyboardLayout", GetEditLangId(hMainWnd), 0);
   }
   else if (uMsg == 273 /*WM_COMMAND*/)
   {
     var nID   = LOWORD(wParam);
     var nCode = HIWORD(wParam);

     if (nID == ID_OKB)
     {
       if (IsNewFileName())
         oSys.Call("User32::EndDialog", hWnd, 0);
       else oSys.Call("user32::SetFocus", hWndFile);
     }
     else if (nID == ID_MENUB)
     {
       ContextMenu(hWnd, lParam);
       oSys.Call("User32::SetFocus", hWndFile);
     }
     else if ( (nID == ID_FILEE) || (nID == ID_EXTE) )
     {
       if (nCode == 0x0100 /*EN_SETFOCUS*/)
       {
         oSys.Call("User32::PostMessage" + _TCHAR, lParam, 177 /*EM_SETSEL*/, 0, -1);
         hSubClass = AkelPad.WindowSubClass(lParam, EditCallback, 258 /*WM_CHAR*/);
       }
       else if (nCode == 0x0200 /*EN_KILLFOCUS*/)
         AkelPad.WindowUnsubClass(lParam);

       if (nID == ID_FILEE)
         oSys.Call("user32::EnableWindow", hWndOk, GetTextLength(hWndFile));
     }
     else if ((nID == ID_CANCELB) || (nID == 2 /*IDCANCEL*/))
     {
       bCancel = true;
       oSys.Call("User32::EndDialog", hWnd, 0);
     }
   }
   return 0;
 }

 function LOWORD(dwNumber)
 {
   return (dwNumber & 0xffff);
 }

 function HIWORD(dwNumber)
 {
   return (dwNumber >> 16);
 }

 function GetDlgItem(hWnd, nID)
 {
   return oSys.Call("User32::GetDlgItem", hWnd, nID);
 }

 function EditCallback(hWnd, uMsg, wParam, lParam)
 {
   var nID = oSys.Call("User32::GetDlgCtrlID", hWnd);

   if (uMsg == 258 /*WM_CHAR*/)
   {
     if ((nID == ID_FILEE) || (nID == ID_EXTE))
     {
       if ( (wParam == 34 /*"*/) || (wParam == 42 /***/) || (wParam == 47 /*/*/) ||
            (wParam == 58 /*:*/) || (wParam == 60 /*<*/) || (wParam == 62 /*>*/) ||
            (wParam == 63 /*?*/) || (wParam == 92 /*\*/) || (wParam == 124 /*|*/) )

         AkelPad.WindowNoNextProc(hSubClass);
     }
   }
   return 0;
 }

 function IsNewFileName()
 {
   var pNewFile = CorrectFileName(GetEditText(hWndFile));
   var sExt     = CorrectFileName(GetEditText(hWndExt));

   if (sExt)
     pNewFile += "." + sExt;

   pNewFile = pFileDir + "\\" + pNewFile;

   if (pNewFile == pFileFullName)
     return false;

   if (IsFileExist(pNewFile))
   {
     AkelPad.MessageBox(hMainWnd, GetLangString(2).replace(/%s/, pNewFile),
                            WScript.ScriptName, 48 /*MB_ICONEXCLAMATION*/);
     return false;
   }

   pNewFileFullName = pNewFile;
   return true;
 }

 function IsFileExist(pFile)
 {
   if (oSys.Call("kernel32::GetFileAttributes" + _TCHAR, pFile) == -1)
     return false;
   return true;
 }

 function ContextMenu(hWndDlg, hWndCrl)
 {
   var hMenu = oSys.Call("User32::CreatePopupMenu");
   var oRect = new Object();
   var nPosX;
   var nPosY;
   var nMenu;
   var nCmd;

   GetWindowPos(hWndCrl, oRect);

   nPosX = oRect.X;
   nPosY = oRect.Y + oRect.H;

   nMenu = SendMessage(hWndEdit, 3125 /*AEM_GETSEL*/, 0, 0) ? 0x0 /*MF_STRING*/ : 0x1 /*MF_GRAYED*/;
     oSys.Call("User32::AppendMenuW", hMenu, nMenu, 1, GetLangString(6));

   nMenu = SendMessage(hWndEdit, 0xC1 /*EM_LINELENGTH*/, 0, 0) ? 0x0 /*MF_STRING*/ : 0x1 /*MF_GRAYED*/;
     oSys.Call("User32::AppendMenuW", hMenu, nMenu, 2, GetLangString(13));

   nMenu = (GetTextLength(hWndFile)) ? 0x0 /*MF_STRING*/ : 0x1 /*MF_GRAYED*/;

     oSys.Call("User32::AppendMenuW", hMenu, 0x800 /*MF_SEPARATOR*/, 0, 0);
     oSys.Call("User32::AppendMenuW", hMenu, nMenu, 3, GetLangString(7));
     oSys.Call("User32::AppendMenuW", hMenu, nMenu, 4, GetLangString(8));
     oSys.Call("User32::AppendMenuW", hMenu, nMenu, 5, GetLangString(9));
     oSys.Call("User32::AppendMenuW", hMenu, 0x800 /*MF_SEPARATOR*/, 0, 0);
     oSys.Call("User32::AppendMenuW", hMenu, nMenu, 6, GetLangString(10));

   nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nPosX, nPosY, 0, hWndDlg, 0);

   oSys.Call("User32::DestroyMenu", hMenu);

   ReplaceFileText(hWndFile, nCmd);
 }

 function GetWindowPos(hWnd, oRect)
 {
   var lpRect = AkelPad.MemAlloc(16) //sizeof(RECT);

   oSys.Call("User32::GetWindowRect", hWnd, lpRect);

   oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), 3 /*DT_DWORD*/);
   oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), 3 /*DT_DWORD*/);
   oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), 3 /*DT_DWORD*/) - oRect.X;
   oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), 3 /*DT_DWORD*/) - oRect.Y;

   AkelPad.MemFree(lpRect);
 }

 function ReplaceFileText(hWnd, nCommand)
 {
   var pText = "";

   switch (nCommand)
   {
     case 1:
       pText = CorrectFileName(AkelPad.GetSelText(3 /*"\r\n"*/));
       break;
     case 2:
       pText = AkelPad.GetTextRange(0, SendMessage(hWndEdit, 0xC1 /*EM_LINELENGTH*/, 0, 0));
       pText = CorrectFileName(pText);
       break;
     case 3:
       pText = GetEditText(hWnd).replace(/ /g, "_");
       break;
     case 4:
       pText = GetEditText(hWnd).replace(/_/g, " ");
       break;
     case 5:
       pText = GetEditText(hWnd).replace(/ /g, "");
       break;
     case 6:
       pText = String2Words(GetEditText(hWnd)); // ReadMe -> Read Me
       break;
     default:
       return;
       break;
   }

   if (pText)
   {
     SendMessage(hWnd, 0x00B1 /*EM_SETSEL*/, 0, -1);
     SendMessage(hWnd, 194 /*EM_REPLACESEL*/,  true, pText);
   }
 }

 function CorrectFileName(pFileName)
 {
   pFileName = pFileName.replace(/[\r\n|\n|\r]/gm, " ");     //заменить переводы строк пробелами
   pFileName = pFileName.replace(/\t+/g, " ");               //заменить табуляцию на пробел
   pFileName = pFileName.replace(/[\\\/:\*\?"{}<>\|]/g, ""); //удалить запрещенные символы
   pFileName = pFileName.replace(/ {2,}/g, " ");             //удалить повторяющиеся пробелы
   pFileName = pFileName.replace(/(^ +)|( +$)/g, "");        //удалить пробелы по краям строк
   return pFileName;
 }

 function GetEditText(hWndEditControl)
 {
   var nTextLen = GetTextLength(hWndEditControl) + 1;
   var lpText = AkelPad.MemAlloc(nTextLen * 2);

   SendMessage(hWndEditControl, 13 /*WM_GETTEXT*/, nTextLen, lpText);

   var pText = AkelPad.MemRead(lpText, 1 /*DT_UNICODE*/);

   AkelPad.MemFree(lpText);

   return pText;
 }

 function GetTextLength(hWnd)
 {
   return SendMessage(hWnd, 14 /*WM_GETTEXTLENGTH*/, 0, 0);
 }

 function String2Words(pStr)
 {
   var aWord = pStr.split('');
   var pUCase;

   for (var i = 0; i < aWord.length; i++)
   {
     pUCase = aWord[i].toUpperCase();

     if (pUCase != aWord[i].toLowerCase())
     {
       if (pUCase == aWord[i])
         aWord[i] = " " + aWord[i];
     }
   }

   aWord = aWord.join('');
   aWord = aWord.replace(/ +/g, " ");
   aWord = aWord.replace(/^ +| +$/gm, "");

   return aWord;
 }

 function GetAliasExt(hWndEdit, hDocEdit)
 {
    var ext = "";
   var pAlias = "";
   var lpAlias;

   if (lpAlias = AkelPad.MemAlloc(256 * 2 /*sizeof(wchar_t)*/))
   {
     AkelPad.CallW("Coder::Settings", 18, hWndEdit, hDocEdit, lpAlias, 0);
     pAlias = AkelPad.MemRead(lpAlias, 1 /*DT_UNICODE*/);
     AkelPad.MemFree(lpAlias);
   }

    if (pAlias)
    {
       ext = pAlias.split('.');
       ext = ext[ext.length-1];
    }
    return ext;
 }

 function GetDefaultExt(hWnd)
 {
   var pDefExt;
   var lParam;

   if (lParam = AkelPad.MemAlloc(256))
   {
     SendMessage(hWnd, 1222 /*AKD_GETMAININFO*/, 224 /*MI_DEFAULTSAVEEXT*/, lParam);
     pDefExt = AkelPad.MemRead(lParam, 1 /*DT_UNICODE*/);
     AkelPad.MemFree(lParam);

     return pDefExt;
   }
   return "txt";
 }

 function GetBookmarksString(hWndEdit, hDocEdit)
 {
   var pBookmarksStr = "";
   var lpBookmarksStr;
   var nBookmarksLen;
   var lpBookmarksLen;

   if (lpBookmarksLen = AkelPad.MemAlloc(4 /*sizeof(int)*/))
   {
     AkelPad.CallW("LineBoard::Main", 12, hWndEdit, hDocEdit, 0, lpBookmarksLen);

     if ((nBookmarksLen = AkelPad.MemRead(lpBookmarksLen, 3 /*DT_DWORD*/)) > 1)
     {
       if (lpBookmarksStr = AkelPad.MemAlloc(nBookmarksLen * 2 /*sizeof(wchar_t)*/))
       {
         AkelPad.CallW("LineBoard::Main", 12, hWndEdit, hDocEdit, lpBookmarksStr, 0);
         pBookmarksStr = AkelPad.MemRead(lpBookmarksStr, 1 /*DT_UNICODE*/);
         AkelPad.MemFree(lpBookmarksStr);
       }
     }
     AkelPad.MemFree(lpBookmarksLen);
   }
   return pBookmarksStr;
 }

 function GetMarks()
 {
   var lpStack;
   var lpMarkText;
   var dwMarkID;
   var aCur = [];

   if (lpStack = AkelPad.MemAlloc(_X64?16:8 /*sizeof(STACKMARKTEXT)*/))
   {
     AkelPad.Call("Coder::HighLight", 12 /*DLLA_HIGHLIGHT_GETMARKSTACK*/,
                    AkelPad.GetEditWnd(), AkelPad.GetEditDoc(), lpStack);

     lpMarkText = AkelPad.MemRead(_PtrAdd(lpStack, 0) /*offsetof(STACKMARKTEXT,first)*/, 2 /*DT_QWORD*/);

     while (lpMarkText)
     {
       dwMarkID = AkelPad.MemRead(_PtrAdd(lpMarkText, _X64?24:12) /*offsetof(MARKTEXT,dwMarkID)*/, 3 /*DT_DWORD*/);

       if (dwMarkID != -2 /*MARKID_SELECTION*/)
       {
         var lpMarkItem = AkelPad.MemRead(_PtrAdd(lpMarkText, _X64?16:8) /*offsetof(MARKTEXT,hMarkTextHandle)*/, 2 /*DT_QWORD*/);
         var lpText     = AkelPad.MemRead(_PtrAdd(lpMarkItem, _X64?24:12) /*offsetof(AEMARKTEXTITEMW,pMarkText)*/, 2 /*DT_QWORD*/);
         var pText      = AkelPad.MemRead(lpText, 1 /*DT_UNICODE*/);
         var nFlags     = AkelPad.MemRead(_PtrAdd(lpMarkItem, _X64?36:20) /*offsetof(AEMARKTEXTITEMW,dwFlags)*/, 3 /*DT_DWORD*/);
         var nMatchCase = (nFlags & 0x00000001/*AEHLF_MATCHCASE*/) ? 1:0;
         var nWholeWord = (nFlags & 0x00000002/*AEHLF_WHOLEWORD*/) ? 1:0;
         var nRegExp    = (nFlags & 0x10000000/*AEHLF_REGEXP*/)    ? 1:0;
         var nFontStyle = AkelPad.MemRead(_PtrAdd(lpMarkItem, _X64?40:24) /*offsetof(AEMARKTEXTITEMW,dwFontStyle)*/, 3 /*DT_DWORD*/);
         var sTextColor = RGBToHex(_PtrAdd(lpMarkItem, _X64?44:28) /*offsetof(AEMARKTEXTITEMW,crText)*/);
         var sBkColor   = RGBToHex(_PtrAdd(lpMarkItem, _X64?48:32) /*offsetof(AEMARKTEXTITEMW,crBk)*/);

         aCur.push([sTextColor,
                    sBkColor,
                    nMatchCase | 4 * nWholeWord | 2 * nRegExp,
                    nFontStyle,
                    dwMarkID.toString(),
                    pText]);
       }
       lpMarkText = AkelPad.MemRead(_PtrAdd(lpMarkText, 0) /*offsetof(MARKTEXT,next)*/, 2 /*DT_QWORD*/);
     }
     AkelPad.MemFree(lpStack);

     return aCur;
   }
 }

 function RGBToHex(lpRGB)
 {
   var sHex = "0";
   var sByte;

   if (AkelPad.MemRead(lpRGB, 3 /*DT_DWORD*/) != -1)
   {
     sHex = "#";

     for (var i = 0; i < 3; ++i)
     {
       sByte = AkelPad.MemRead(_PtrAdd(lpRGB, i), 5 /*DT_BYTE*/).toString(16).toUpperCase();

       if (sByte.length == 1)
         sByte = "0" + sByte;

       sHex += sByte;
     }
   }
   return sHex;
 }

 function SetMarks(aMarks)
 {
   for (var i = 0; i < aMarks.length; i++)
   {
     AkelPad.Call("Coder::HighLight", 2,
                            aMarks[i][0],
                            aMarks[i][1],
                   parseInt(aMarks[i][2]),
                   parseInt(aMarks[i][3]),
                   parseInt(aMarks[i][4]),
                            aMarks[i][5]);
   }
 }

 function CreateDir(pDir)
 {
   var oFSO = new ActiveXObject("Scripting.FileSystemObject");

   if (oFSO.CreateFolder(pDir))
     return true;

   return false;
 }

 function GetEditLangId(hWnd)
 {
   var nEditThreadId = oSys.Call("user32::GetWindowThreadProcessId", hWnd, 0);
   var nLang = oSys.Call("user32::GetKeyboardLayout", nEditThreadId);
   return (nLang);
 }

 function SetEditFont()
 {
   var nLFSize  = 28 + 32 * 2; //sizeof(LOGFONTW)
   var lpLF     = AkelPad.MemAlloc(nLFSize);
   var hFont;
   var hDC;
   var nHeight;
   var nWeight  = 400;
   var bItalic  = 0;

   hDC     =  oSys.Call("User32::GetDC", hMainWnd);
   nHeight = -oSys.Call("Kernel32::MulDiv", aFont[2], oSys.Call("Gdi32::GetDeviceCaps", hDC, 90 /*LOGPIXELSY*/), 72);
   oSys.Call("User32::ReleaseDC", hMainWnd, hDC);

   if ( (aFont[1] == 2) || (aFont[1] == 4) )
     nWeight = 700;
   if (aFont[1] > 2)
     bItalic = 1;

   AkelPad.MemCopy(_PtrAdd(lpLF,  0), nHeight,  3 /*DT_DWORD*/); //lfHeight
   AkelPad.MemCopy(_PtrAdd(lpLF, 16), nWeight,  3 /*DT_DWORD*/); //lfWeight
   AkelPad.MemCopy(_PtrAdd(lpLF, 20), bItalic,  5 /*DT_BYTE*/);  //lfItalic
   AkelPad.MemCopy(_PtrAdd(lpLF, 28), aFont[0], 1 /*DT_UNICODE*/); //lfFaceName

   hFont = oSys.Call("Gdi32::CreateFontIndirectW", lpLF);
   AkelPad.MemFree(lpLF);

   SendMessage(hWndFile, 48 /*WM_SETFONT*/, hFont, true);
   SendMessage(hWndExt, 48 /*WM_SETFONT*/, hFont, true);
 }
 //function SetEditFont() {
 //  var hFont = SendMessage(hMainWnd, 1233 /*AKD_GETFONTW*/, 0, 0);
 //
 //  SendMessage(hWndFile, 48 /*WM_SETFONT*/, hFont, 0);
 //  SendMessage(hWndExt, 48 /*WM_SETFONT*/, hFont, 0);
 //  oSys.Call("User32::InvalidateRect", hWndFile, 0, 1);
 //  oSys.Call("User32::InvalidateRect", hWndExt, 0, 1);
 //}

 function SendMessage(hWnd, uMsg, wParam, lParam)
 {
   return oSys.Call("User32::SendMessage" + _TCHAR, hWnd, uMsg, wParam, lParam);
 }

 function GetLangString(nStringID)
 {
   var nLangID = AkelPad.GetLangId(1 /*LANGID_PRIMARY*/);

   if (nLangID == 0x19) //LANG_RUSSIAN
   {
     if (nStringID == 0)
       return "Новое имя файла";
     if (nStringID == 1)
       return "Расширение";
     if (nStringID == 2)
       return "Файл \"%s\" уже существует.";
     if (nStringID == 3)
       return "Ошибка MoveFile: \"%d\".";
     if (nStringID == 4)
       return "Ошибка: %d";
     if (nStringID == 5)
       return "Отмена";
     if (nStringID == 6)
       return "Заменить выделенным текстом";
     if (nStringID == 13)
       return "Заменить текстом первой строки";
     if (nStringID == 7)
       return "Заменить пробелы на знак ''_''";
     if (nStringID == 8)
       return "Заменить пробелами знак ''_''";
     if (nStringID == 9)
       return "Удалить пробелы";
     if (nStringID == 10)
       return "FileName -> File Name";
     if (nStringID == 11)
       return "Переименовать";
     if (nStringID == 12)
       return "Сохранить как...";
     if (nStringID == 14)
       return "Вы должны указать путь для сохранения файла.";
   }
   else
   {
     if (nStringID == 0)
       return "New file name";
     if (nStringID == 1)
       return "Extension";
     if (nStringID == 2)
       return "File \"%s\" already exists.";
     if (nStringID == 3)
       return "MoveFile error: \"%d\".";
     if (nStringID == 4)
       return "Error: %d";
     if (nStringID == 5)
       return "Cancel";
     if (nStringID == 6)
       return "Selected text -> file name";
     if (nStringID == 13)
       return "First line text -> file name";
     if (nStringID == 7)
       return "Spaces -> ''_''";
     if (nStringID == 8)
       return "''_'' -> Spaces";
     if (nStringID == 9)
       return "Delete spaces";
     if (nStringID == 10)
       return "FileName -> File Name";
     if (nStringID == 11)
       return "Rename";
     if (nStringID == 12)
       return "Save As...";
     if (nStringID == 14)
       return "You must specify the path to save the file.";
   }
   return "";
 }
