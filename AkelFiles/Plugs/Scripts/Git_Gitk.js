/**
 * Gitk - The Git repository browser

"Git: Log/Browse Repo (gitk only master)" Exec(`%comspec% /B /C cd /d "%d" & gitk&`)
"Git: Log/Browse Repo (gitk show all refs like branches, tags, etc.)" Exec(`%comspec% /B /C cd /d "%d" & gitk& --all`)

-"Git: Log or Browse Repo (gitk show all refs like branches, tags, etc.)" Call("Scripts::Main", 1 "Git_Gitk.js", `-all=1`)

 */

var cmd = '%comspec% /B /C cd /d "'+ AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1) +'" & gitk&',
    refs = AkelPad.GetArgValue("all", 0),
    cmd = (refs)? cmd + ' --all' : cmd;

AkelPad.Exec(cmd);
