$ErrorActionPreference = 'Stop'
$root = 'C:\Users\admin\Documents\MultiTool\HomeChats\Chat-41'
$srcDir = Join-Path $root 'src'
$imgDir = 'assets/img'

$map = @{
  '__IMG_LAB01_ROBOTICS__'   = 'lab01-robotics.jpg'
  '__IMG_LAB02_ELECTRONICS__'= 'lab02-electronics.jpg'
  '__IMG_LAB03_BLENDER__'    = 'lab03-blender.jpg'
  '__IMG_LAB04_KOMPAS__'     = 'lab04-kompas.jpg'
  '__IMG_LAB05_UAV__'        = 'lab05-uav.jpg'
  '__IMG_LAB06_VR__'         = 'lab06-vr.jpg'
  '__IMG_LAB07_PBL__'        = 'lab07-pbl.jpg'
  '__IMG_LAB01_PROC__'       = 'lab01-proc.jpg'
  '__IMG_LAB02_PROC__'       = 'lab02-proc.jpg'
  '__IMG_LAB03_PROC__'       = 'lab03-proc.jpg'
  '__IMG_LAB04_PROC__'       = 'lab04-proc.jpg'
  '__IMG_LAB05_PROC__'       = 'lab05-proc.jpg'
  '__IMG_LAB06_PROC__'       = 'lab06-proc.jpg'
  '__IMG_LAB07_PROC__'       = 'lab07-proc.jpg'
}

function Build-Page {
  param([string]$TplPath, [string]$OutPath)
  $tpl = Get-Content -LiteralPath $TplPath -Raw -Encoding UTF8
  $count = 0
  foreach ($k in $map.Keys) {
    if ($tpl.Contains($k)) {
      $tpl = $tpl.Replace($k, "$imgDir/$($map[$k])")
      $count = $count + 1
    }
  }
  if ($tpl -match '__IMG_') { throw "Leftover tokens in $TplPath" }
  $utf8Bom = New-Object System.Text.UTF8Encoding($true)
  [System.IO.File]::WriteAllText($OutPath, $tpl, $utf8Bom)
  Write-Output "BUILT ($count imgs): $OutPath"
}

$nConc = -join @([char]0x041A,[char]0x043E,[char]0x043D,[char]0x0446,[char]0x0435,[char]0x043F,[char]0x0446,[char]0x0438,[char]0x044F,' ',[char]0x0422,[char]0x0435,[char]0x0445,[char]0x041B,[char]0x0430,[char]0x0431,'.html')
$nProg = -join @([char]0x041F,[char]0x0440,[char]0x043E,[char]0x0433,[char]0x0440,[char]0x0430,[char]0x043C,[char]0x043C,[char]0x0430,' ',[char]0x0422,[char]0x0435,[char]0x0445,[char]0x043D,[char]0x043E,[char]0x043B,[char]0x043E,[char]0x0433,[char]0x0438,[char]0x0447,[char]0x0435,[char]0x0441,[char]0x043A,[char]0x043E,[char]0x0439,' ',[char]0x043B,[char]0x0430,[char]0x0431,[char]0x043E,[char]0x0440,[char]0x0430,[char]0x0442,[char]0x043E,[char]0x0440,[char]0x0438,[char]0x0438,'.html')
$nPage = -join @([char]0x0421,[char]0x0442,[char]0x0440,[char]0x0430,[char]0x043D,[char]0x0438,[char]0x0446,[char]0x0430,' ',[char]0x0422,[char]0x0435,[char]0x0445,[char]0x043D,[char]0x043E,[char]0x043B,[char]0x043E,[char]0x0433,[char]0x0438,[char]0x0447,[char]0x0435,[char]0x0441,[char]0x043A,[char]0x043E,[char]0x0439,' ',[char]0x043B,[char]0x0430,[char]0x0431,[char]0x043E,[char]0x0440,[char]0x0430,[char]0x0442,[char]0x043E,[char]0x0440,[char]0x0438,[char]0x0438,'.html')
$nPort = -join @([char]0x041F,[char]0x043E,[char]0x0440,[char]0x0442,[char]0x0430,[char]0x043B,' ',[char]0x0422,[char]0x0435,[char]0x0445,[char]0x043D,[char]0x043E,[char]0x043B,[char]0x043E,[char]0x0433,[char]0x0438,[char]0x0447,[char]0x0435,[char]0x0441,[char]0x043A,[char]0x0430,[char]0x044F,' ',[char]0x043B,[char]0x0430,[char]0x0431,[char]0x043E,[char]0x0440,[char]0x0430,[char]0x0442,[char]0x043E,[char]0x0440,[char]0x0438,[char]0x044F,'.html')

Build-Page -TplPath (Join-Path $srcDir 'template.html') -OutPath (Join-Path $root $nConc)
Build-Page -TplPath (Join-Path $srcDir 'tpl-doop.html')  -OutPath (Join-Path $root $nProg)
Build-Page -TplPath (Join-Path $srcDir 'tpl-page.html')   -OutPath (Join-Path $root $nPage)
Build-Page -TplPath (Join-Path $srcDir 'tpl-portal.html') -OutPath (Join-Path $root $nPort)

Write-Output 'DONE'