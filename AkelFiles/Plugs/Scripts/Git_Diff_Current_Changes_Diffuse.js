/**
 * Git Diff Current Changes With Difftool (Diffuse)
 * done for CommandPallete.lng to run

"Git: Diff Current Changes (difftool Diffuse)" Exec(`%comspec% /K cd /d "%d" & "%a\Tools\Diffuse\diffuse.exe" -m & exit`)

 */

AkelPad.MessageBox(0, '%%a\\Tools\\Diffuse\\diffuse.exe ' + AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) + ' ' + AkelPad.GetAkelDir(), WScript.ScriptName, 0);
AkelPad.Exec('%comspec% /B /C cd /d "'+ AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) +'" & "'+ AkelPad.GetAkelDir() +'\\Tools\\Diffuse\\diffuse.exe" -m & exit');
