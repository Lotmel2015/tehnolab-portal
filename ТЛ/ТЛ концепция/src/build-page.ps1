$ErrorActionPreference = 'Stop'
$root = 'C:\Users\admin\Documents\MultiTool\HomeChats\Chat-41'
$tplPath = Join-Path $root 'tpl-page.html'
$outName = [string]([char]0x0421) + [char]0x0442 + [char]0x0440 + [char]0x0430 + [char]0x043D + [char]0x0438 + [char]0x0446 + [char]0x0430 + ' ' + [char]0x0422 + [char]0x0435 + [char]0x0445 + [char]0x043D + [char]0x043E + [char]0x043B + [char]0x043E + [char]0x0433 + [char]0x0438 + [char]0x0447 + [char]0x0435 + [char]0x0441 + [char]0x043A + [char]0x043E + [char]0x0439 + ' ' + [char]0x043B + [char]0x0430 + [char]0x0431 + [char]0x043E + [char]0x0440 + [char]0x0430 + [char]0x0442 + [char]0x043E + [char]0x0440 + [char]0x0438 + [char]0x0438 + '.html'
$outPath = Join-Path $root $outName
$tmp = Join-Path $root '.tpl-page.tmp.html'

$tpl = Get-Content -LiteralPath $tplPath -Raw -Encoding UTF8

$imgs = @(
  @{ Token = '__IMG_LAB01_ROBOTICS__'; File = 'lab01-robotics.jpg' },
  @{ Token = '__IMG_LAB06_VR__'; File = 'lab06-vr.jpg' },
  @{ Token = '__IMG_LAB01_PROC__'; File = 'lab01-proc.jpg' },
  @{ Token = '__IMG_LAB02_PROC__'; File = 'lab02-proc.jpg' },
  @{ Token = '__IMG_LAB03_PROC__'; File = 'lab03-proc.jpg' },
  @{ Token = '__IMG_LAB04_PROC__'; File = 'lab04-proc.jpg' },
  @{ Token = '__IMG_LAB05_PROC__'; File = 'lab05-proc.jpg' },
  @{ Token = '__IMG_LAB06_PROC__'; File = 'lab06-proc.jpg' },
  @{ Token = '__IMG_LAB07_PROC__'; File = 'lab07-proc.jpg' }
)
$found = 0
foreach ($img in $imgs) {
  $fp = Join-Path $root $img.File
  if (-not (Test-Path -LiteralPath $fp)) { throw "Missing image: $fp" }
  $bytes = [System.IO.File]::ReadAllBytes($fp)
  $b64 = [System.Convert]::ToBase64String($bytes)
  $dataUri = "data:image/jpeg;base64,$b64"
  if ($tpl.Contains($img.Token)) {
    $tpl = $tpl.Replace($img.Token, $dataUri)
    $found = $found + 1
  }
}
if ($found -ne 9) { throw "Not all image tokens were replaced! Found: $found" }

$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($tmp, $tpl, $utf8Bom)
Move-Item -LiteralPath $tmp -Destination $outPath -Force

$sizeKB = [Math]::Round((Get-Item -LiteralPath $outPath).Length / 1KB)
Write-Output "OK: $outPath"
Write-Output "SIZE_KB: $sizeKB"