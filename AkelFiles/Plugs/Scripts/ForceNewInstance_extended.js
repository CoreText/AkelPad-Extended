// http://tc-image.3dn.ru/forum/9-258-848-16-1332958870
// http://akelpad.sourceforge.net/forum/viewtopic.php?p=4222#4222
// Version: 1.4
// Author: Shengalts Aleksander aka Instructor / texter
//
/// Extended version from ForceNewInstance.js
//
// Description(1033): Force create new program instance.
// Description(1049): ‘орсировать создание нового экземпл€ра программы.
//
// Arguments:
// -CmdLine="/Command(4155)" -Command line than will be appended to CmdLineBegin parameter of the second instance.
// -MDI=1                    -By default 1 MDI mode, 0 is SDI, 2 is PMDI
//
// Usage:
// Call("Scripts::Main", 1, "ForceNewInstance_extended.js", `-CmdLine="/Command(4155)"`)
// Call("Scripts::Main", 1, "ForceNewInstance_extended.js", '-MDI=2')

//Arguments
var pCmdLine=AkelPad.GetArgValue("CmdLine", "");
var pMDI=AkelPad.GetArgValue("MDI", 1);

ForceNewInstance(pCmdLine, pMDI);

function ForceNewInstance(pCmdLine, pMDI)
{
  var hMainWnd=AkelPad.GetMainWnd();
  var oSet=AkelPad.ScriptSettings();
  var hNewMainWnd=0;
  var lpPluginFunction;
  var lpCmdLineBegin;
  var nCmdLineBeginLen;
  var pCmdLineCurrent="";
  var bOpenOnStartEnable=false;

  //Plugin running?
  if (lpPluginFunction=AkelPad.SendMessage(hMainWnd, 1329 /*AKD_DLLFIND*/, "Sessions::Main", 0))
  {
    //Plugin autoloading?
    if (AkelPad.MemRead(_PtrAdd(lpPluginFunction, _X64?812:800) /*offsetof(PLUGINFUNCTION, bAutoLoad)*/, 3 /*DT_DWORD*/))
    {
      //Plugin opens session on start?
      if (oSet.Begin("Sessions", 0x21 /*POB_READ|POB_PLUGS*/))
      {
        bOpenOnStartEnable=oSet.Read("OpenOnStartEnable", 1 /*PO_DWORD*/);
        oSet.End();
      }
      //Turn off open session on start
      if (bOpenOnStartEnable)
      {
        if (oSet.Begin("Sessions", 0x22 /*POB_SAVE|POB_PLUGS*/))
        {
          oSet.Write("OpenOnStartEnable", 1 /*PO_DWORD*/, false);
          oSet.End();
        }
      }
    }
  }

  if (pCmdLine)
  {
    if (oSet.Begin("", 0x42 /*POB_SAVE|POB_PROGRAM*/))
    {
      if (nCmdLineBeginLen=AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 105 /*MI_CMDLINEBEGIN*/, 0))
      {
         if (lpCmdLineBegin=AkelPad.MemAlloc(nCmdLineBeginLen * 2 /*sizeof(wchar_t)*/))
         {
           if (AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 105 /*MI_CMDLINEBEGIN*/, lpCmdLineBegin))
             pCmdLineCurrent=AkelPad.MemRead(lpCmdLineBegin, 1 /*DT_UNICODE*/);
           AkelPad.MemFree(lpCmdLineBegin);
         }
      }
      oSet.Write("CmdLineBegin", 3 /*PO_STRING*/, pCmdLineCurrent + " " + pCmdLine);
      oSet.End();
    }
  }

  if (pMDI)
  {
    if (oSet.Begin("", 0x42 /*POB_SAVE|POB_PROGRAM*/))
    {
      oSet.Write("MDI", 1 /*PO_DWORD*/, pMDI);
      oSet.End();
    }
  }

  if (AkelPad.SendMessage(hMainWnd, 1222 /*AKD_GETMAININFO*/, 153 /*MI_SINGLEOPENPROGRAM*/, 0))
  {
    AkelPad.Command(4256 /*IDM_OPTIONS_SINGLEOPEN_PROGRAM*/);
    hNewMainWnd=AkelPad.Command(4102 /*IDM_FILE_CREATENEW*/);
    AkelPad.Command(4256 /*IDM_OPTIONS_SINGLEOPEN_PROGRAM*/);
    AkelPad.SendMessage(hNewMainWnd, 273 /*WM_COMMAND*/, 4256 /*IDM_OPTIONS_SINGLEOPEN_PROGRAM*/, 0);
  }
  else hNewMainWnd=AkelPad.Command(4102 /*IDM_FILE_CREATENEW*/);

  //Turn on open session on start
  if (bOpenOnStartEnable)
  {
    if (oSet.Begin("Sessions", 0x22 /*POB_SAVE|POB_PLUGS*/))
    {
      oSet.Write("OpenOnStartEnable", 1 /*PO_DWORD*/, true);
      oSet.End();
    }
  }

  if (pCmdLine)
  {
    if (oSet.Begin("", 0x42 /*POB_SAVE|POB_PROGRAM*/))
    {
      oSet.Write("CmdLineBegin", 3 /*PO_STRING*/, pCmdLineCurrent);
      oSet.End();
    }
  }

  if (pMDI)
  {
    if (oSet.Begin("", 0x42 /*POB_SAVE|POB_PROGRAM*/))
    {
      oSet.Write("MDI", 1 /*PO_DWORD*/, 1);
      oSet.End();
    }
  }

  return hNewMainWnd;
}
