' Silently starts the AI Chat Tracker server in the background.
' No console window appears — it just runs invisibly.
' Add a shortcut to THIS file in your Windows Startup folder (see README)
' to have it launch automatically every time you log in.

Dim fso, scriptDir, shell

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = scriptDir

' 0 = hidden window, False = don't wait for it to exit
shell.Run "node server.js", 0, False
