/**
 * Git MergeTool (Meld)
 * done for CommandPallete.lng to run

"Git: Merge Tool Conflict Issue (mergetool Meld)" Exec(`cmd.exe /K cd /d "%d" & git mergetool --prompt --gui --tool=meld"`)

 */

AkelPad.Exec('%comspec% /B /C cd /d "'+ AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) +'" & git mergetool --prompt --gui --tool=meld');
