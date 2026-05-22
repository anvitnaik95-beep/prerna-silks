# Prerna Silks Push Helper Script
& "C:\Program Files\Git\cmd\git.exe" branch -M main
& "C:\Program Files\Git\cmd\git.exe" remote remove origin 2>$null
& "C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/anvitnaik95-beep/prerna-silks.git
Write-Host "✅ GitHub remote successfully linked!" -ForegroundColor Green
Write-Host "🚀 Pushing code to GitHub. If prompted, please complete the login screen..." -ForegroundColor Yellow
& "C:\Program Files\Git\cmd\git.exe" push -u origin main
