$cons = Get-NetTCPConnection -LocalPort 4001 -State Listen -ErrorAction SilentlyContinue
if ($cons) {
  $processId = $cons[0].OwningProcess
  Write-Host "Killing PID $processId on :4001"
  Stop-Process -Id $processId -Force
} else {
  Write-Host "No listener on :4001"
}
