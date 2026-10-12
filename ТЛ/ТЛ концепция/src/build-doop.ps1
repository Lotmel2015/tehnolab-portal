$ErrorActionPreference = 'Stop'
$root = 'C:\Users\admin\Documents\MultiTool\HomeChats\Chat-41'
$tplPath = Join-Path $root 'tpl-doop.html'
$outName = [string]([char]0x041F) + [char]0x0440 + [char]0x043E + [char]0x0433 + [char]0x0440 + [char]0x0430 + [char]0x043C + [char]0x043C + [char]0x0430 + ' ' + [char]0x0422 + [char]0x0435 + [char]0x0445 + [char]0x043D + [char]0x043E + [char]0x043B + [char]0x043E + [char]0x0433 + [char]0x0438 + [char]0x0447 + [char]0x0435 + [char]0x0441 + [char]0x043A + [char]0x0430 + [char]0x044F + ' ' + [char]0x043B + [char]0x0430 + [char]0x0431 + [char]0x043E + [char]0x0440 + [char]0x0430 + [char]0x0442 + [char]0x043E + [char]0x0440 + [char]0x0438 + [char]0x044F + '.html'
$outPath = Join-Path $root $outName
$tmp = Join-Path $root '.tpl-doop.tmp.html'

$tpl = Get-Content -LiteralPath $tplPath -Raw -Encoding UTF8

$imgs = @(
  @{ Token = '__IMG_LAB01_ROBOTICS__'; File = 'lab01-robotics.jpg' },
  @{ Token = '__IMG_LAB02_ELECTRONICS__'; File = 'lab02-electronics.jpg' },
  @{ Token = '__IMG_LAB03_BLENDER__'; File = 'lab03-blender.jpg' },
  @{ Token = '__IMG_LAB04_KOMPAS__'; File = 'lab04-kompas.jpg' },
  @{ Token = '__IMG_LAB05_UAV__'; File = 'lab05-uav.jpg' },
  @{ Token = '__IMG_LAB06_VR__'; File = 'lab06-vr.jpg' },
  @{ Token = '__IMG_LAB07_PBL__'; File = 'lab07-pbl.jpg' }
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
if ($found -ne 7) { throw 'Not all image tokens were replaced!' }

$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($tmp, $tpl, $utf8Bom)
Move-Item -LiteralPath $tmp -Destination $outPath -Force

$sizeKB = [Math]::Round((Get-Item -LiteralPath $outPath).Length / 1KB)
Write-Output "OK: $outPath"
Write-Output "SIZE_KB: $sizeKB"