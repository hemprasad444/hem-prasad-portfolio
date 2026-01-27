param(
  [int]$Port = 5173,
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

function Get-ContentType([string]$Path) {
  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css"  { "text/css; charset=utf-8" }
    ".js"   { "application/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".png"  { "image/png" }
    ".jpg"  { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".svg"  { "image/svg+xml; charset=utf-8" }
    ".gif"  { "image/gif" }
    ".webp" { "image/webp" }
    ".pdf"  { "application/pdf" }
    ".txt"  { "text/plain; charset=utf-8" }
    default { "application/octet-stream" }
  }
}

function Resolve-SafePath([string]$RequestedPath) {
  $relative = ($RequestedPath -replace "/", "\").TrimStart("\")
  if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "index.html" }
  if ($relative -match "^\.\.") { return $null }

  $full = [IO.Path]::GetFullPath((Join-Path $Root $relative))
  $rootFull = [IO.Path]::GetFullPath($Root)
  if (-not $full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) { return $null }
  return $full
}

$prefix = "http://localhost:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Serving: $Root"
Write-Host "Open:    $prefix"
Write-Host "Stop:    Ctrl+C"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    try {
      $path = Resolve-SafePath $req.Url.AbsolutePath
      if (-not $path) {
        $res.StatusCode = 400
        $bytes = [Text.Encoding]::UTF8.GetBytes("Bad request")
        $res.ContentType = "text/plain; charset=utf-8"
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
        continue
      }

      if (Test-Path $path -PathType Container) {
        $path = Join-Path $path "index.html"
      }

      if (-not (Test-Path $path -PathType Leaf)) {
        # SPA-ish fallback: if it's not a file path request, return index.html
        if ($req.Url.AbsolutePath -notmatch "\.[a-zA-Z0-9]+$") {
          $path = Join-Path $Root "index.html"
        } else {
          $res.StatusCode = 404
          $bytes = [Text.Encoding]::UTF8.GetBytes("Not found")
          $res.ContentType = "text/plain; charset=utf-8"
          $res.OutputStream.Write($bytes, 0, $bytes.Length)
          $res.Close()
          continue
        }
      }

      $bytes = [IO.File]::ReadAllBytes($path)
      $res.StatusCode = 200
      $res.ContentType = Get-ContentType $path
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.Close()
    } catch {
      try {
        $res.StatusCode = 500
        $bytes = [Text.Encoding]::UTF8.GetBytes("Server error")
        $res.ContentType = "text/plain; charset=utf-8"
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
      } catch { }
    }
  }
} finally {
  if ($listener) { $listener.Stop(); $listener.Close() }
}

