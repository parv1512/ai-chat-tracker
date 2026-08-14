@echo off
echo Looking for the AI Chat Tracker server on port 4795...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4795 ^| findstr LISTENING') do (
  echo Stopping process %%a
  taskkill /F /PID %%a
)
echo Done. If nothing printed above, the server wasn't running.
pause
