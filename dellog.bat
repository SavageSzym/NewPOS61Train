@echo off

rem np6x logs

rem rmdir /s /q posfiles

rem pause
rmdir /s /q OutPutFiles001
rmdir /s /q OutPutFiles002
rmdir /s /q OutPutFiles003
rmdir /s /q OutPutFiles017
rmdir /s /q OutPutFiles019
rmdir /s /q OutPutFiles020
rmdir /s /q OutPutFilesWS
rmdir /s /q out
rmdir  /s /q OutPutFiles
rmdir /s /q OUTBOI
rem  pause
cd .\bin
rmdir  /s /q OutPutFiles
del *.log
del *.lg*
del /f memtrace.txt

rem pause
cd .\javabin
del  *.log
del *.lg
del *.lck

rem pause
cd ..
cd ..
cd .\posdata
del *.ser


rem np3x logs

rem rmdir /s /q posfiles

rem cd .\bin
rem del *.log
rem del *.lg*
rem del *.bak
rem del *.00*
rem del *.01*
rem del *.02*
rem del *.03*
rem del *.04*
rem del *.05*
rem del *.06*
rem del *.07*
rem del *.08*
rem del *.09*
rem del *.$$$
rem del *.POS
rem del nf_info.txt
rem del /f memtrace.txt
rem del /f memleak.txt

rem cd .\posdata
rem del *.log
rem del *.lg*
rem del *.bak
rem del *.00*
rem del *.01*
rem del *.02*
rem del *.03*
rem del *.04*
rem del *.05*
rem del *.06*
rem del *.07*
rem del *.08*
rem del *.09*
rem del *.$$$
rem del *.POS
rem del nf_info.txt
rem del /f memtrace.txt
rem del /f memleak.txt