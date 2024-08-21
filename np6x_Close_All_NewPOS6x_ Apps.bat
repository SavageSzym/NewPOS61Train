@echo off
title    Terminate all NewPOS 6x Programs
echo  *********************************************************** 
echo.    
echo.    NewPOS 6x Standalone Environment
echo.    
echo.    Press ENTER to terminate all NewPOS 6x programs
echo.    
echo  ***********************************************************
echo.    

taskkill /im NewPOS?v6.* -f
taskkill /im java.exe -f
taskkill /im javaw.exe -f
taskkill /im jusched.exe -f
taskkill /im npApp.exe -f
taskkill /im updtService.exe -f
taskkill /im updtServiceExec.exe -f
taskkill /im updtMain.exe -f
taskkill /im iexplorer.exe -f
taskkill /im conime.exe -f
taskkill /im np6shell.exe -f
taskkill /im mcdonalds.exe -f

cd C:\NewPOS616UK\posdata
del *.ser

exit