# engine for filetype .js/.vbs not found

To resolve the issue you need to activate WSH

1. Open an elevated Command Prompt window.
2. Type the following command and press Enter:

```
regsvr32 %systemroot%\system32\jscript.dll

assoc .js=JSFile
assoc .vbs=VBSFile
```

3. Type exit to close the Command Prompt window.
4. Right-click jscript_fix.reg (zipped), click “Save Target as” or the equivalent option in your browser, and save the file to the desktop.
5. Unzip the archive, and double-click on the .reg file to apply the settings. The fix applies to all versions of Windows, including Windows 10.
6. Click Yes when asked for confirmation.
