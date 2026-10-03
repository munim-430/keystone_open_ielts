@echo off
TITLE KEYSTONE OPEN IELTS - BATCH PRINT CONSOLE
COLOR 0E

echo =======================================================================
echo          KEYSTONE OPEN IELTS - CLASSROOM BATCH PRINT SPOOLER
echo =======================================================================
echo.
echo Opening the consolidated A4 multi-page printable report in your browser...
echo.

start http://localhost:3000/report?mode=batch

echo Once the page loads, your browser will render all completed candidate
echo scorecards on consecutive A4 pages. Click 'Print Now' to send all jobs
echo directly to your classroom printer.
echo.
pause
