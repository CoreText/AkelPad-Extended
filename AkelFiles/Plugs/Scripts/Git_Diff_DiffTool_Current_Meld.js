/**
 * Git Diff Current File With Difftool (Meld)
 * done for CommandPallete.lng to run

"Git: Diff Current File (difftool Meld)" Exec(`cmd.exe /K cd /d "%d" & git difftool -y --tool=meld & exit`)

 */

AkelPad.Exec('%comspec% /B /C cd /d "'+ AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) +'" & git difftool -y --tool=meld');
