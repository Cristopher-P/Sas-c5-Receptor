
@echo off
echo Cleaning Antigravity Cache...
if exist "C:\Users\crist\AppData\Roaming\Antigravity\Cache" (
    rmdir /s /q "C:\Users\crist\AppData\Roaming\Antigravity\Cache"
    echo Deleted Cache
)
if exist "C:\Users\crist\AppData\Roaming\Antigravity\Code Cache" (
    rmdir /s /q "C:\Users\crist\AppData\Roaming\Antigravity\Code Cache"
    echo Deleted Code Cache
)
if exist "C:\Users\crist\AppData\Roaming\Antigravity\Local Storage" (
    rmdir /s /q "C:\Users\crist\AppData\Roaming\Antigravity\Local Storage"
    echo Deleted Local Storage
)
echo Done.
