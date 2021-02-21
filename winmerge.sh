#!/bin/sh

# git config --replace --global diff.tool winmerge
# git config --replace --global difftool.winmerge.cmd
#    "winmerge.sh \"\$LOCAL\" \"\$REMOTE\""
# git config --replace --global difftool.prompt false

SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )";
# echo "${SCRIPT_PATH}/Tools/WinMergePortable/App/WinMerge/";

echo Launching WinMergeU.exe: $1 $2
"${SCRIPT_PATH}/Tools/WinMergePortable/App/WinMerge/WinMergeU.exe" -e -ub -dl "Base" -dr "Mine" "$1" "$2"
