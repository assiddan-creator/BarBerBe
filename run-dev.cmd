@echo off
cd /d "C:\Users\assid\Desktop\APPS\BarBer B"
echo Working directory: %CD%
echo.
echo Running npm install...
call npm install
if errorlevel 1 exit /b 1
echo.
echo Starting dev server on http://localhost:3456 ...
call npm run dev
