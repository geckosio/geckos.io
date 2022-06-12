Write-Output "Removing node_modules ..."
Get-ChildItem -Include node_modules -Recurse -force | Remove-Item -Force -Recurse

Write-Output "Removing dist ..."
Get-ChildItem -Include dist -Recurse -force | Remove-Item -Force -Recurse

Write-Output "Removing jsm ..."
Get-ChildItem -Include jsm -Recurse -force | Remove-Item -Force -Recurse

Write-Output "Removing package-lock.json ..."
Get-ChildItem -Include package-lock.json -Recurse -force | Remove-Item -Force -Recurse

Write-Output "DONE!"
