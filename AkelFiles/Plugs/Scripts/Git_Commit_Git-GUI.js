/**
 * Git Commit Git-GUI
 * done for CommandPallete.lng to run

"Git: Commit (git-gui)" Exec(`%comspec% /B /C cd /d "%d" & git gui&`)

 */

AkelPad.Exec('%comspec% /B /C cd /d "'+ AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) +'" & git gui&');
