$ErrorActionPreference = 'Stop'
$root = 'C:\Users\admin\Documents\MultiTool\HomeChats\Chat-41'
$tplPath = Join-Path $root 'template.html'
$outPath = Join-Path $root ('Концепция ТехЛаб.html')
$tmp = Join-Path $root '.template.tmp.html'

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

foreach ($img in $imgs) {
  $fp = Join-Path $root $img.File
  if (-not (Test-Path -LiteralPath $fp)) { throw "Missing image: $fp" }
  $bytes = [System.IO.File]::ReadAllBytes($fp)
  $b64 = [System.Convert]::ToBase64String($bytes)
  $dataUri = "data:image/jpeg;base64,$b64"
  $tpl = $tpl.Replace($img.Token, $dataUri)
}

$time = Get-Date -Format 'HH:mm:ss'
$tpl = $tpl.Replace('04.10.2026.', "04.10.2026 в $time.")

$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($tmp, $tpl, $utf8Bom)

if ($tpl -match '__IMG_LAB') { throw 'Some image tokens were not replaced!' }

Move-Item -LiteralPath $tmp -Destination $outPath -Force

$sizeKB = [Math]::Round((Get-Item -LiteralPath $outPath).Length / 1KB)
Write-Output "OK: $outPath"
Write-Output "SIZE_KB: $sizeKB"