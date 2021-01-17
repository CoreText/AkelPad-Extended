@echo off
:: setlocal enableDelayedExpansion
set "cur_path=%~d1%~p1%~n1"
set esc_path=%cur_path:\=\\%

start AkelPad.exe /Show(3)

:loop
start AkelPad.exe /If(`Call("Scripts::Main",4,"EvalCmd.js", 'if("%~1"===".")AkelPad.ScriptExitCode(1)')`, `/Call("Scripts::Main",4,"EvalCmd.js",'AkelPad.Call("Explorer::Main",1,"%esc_path%")')`, `/OpenFile("%~1")`)
shift
if not "%~1"=="" goto loop
