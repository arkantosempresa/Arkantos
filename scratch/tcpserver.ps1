$port = 8080
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "TCP Web Server escuchando en puerto $port..."

$root = (Get-Location).Path

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
        
        $requestLine = $reader.ReadLine()
        if ($null -eq $requestLine) { $client.Close(); continue }

        $parts = $requestLine.Split(" ")
        if ($parts.Length -lt 2) { $client.Close(); continue }
        
        $path = $parts[1].Split("?")[0]
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }

        $cleanPath = $path.TrimStart('/').Replace('/', '\')
        $filePath = Join-Path $root $cleanPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            $contentType = "text/html; charset=utf-8"
            if ($filePath.EndsWith(".js")) { $contentType = "application/javascript; charset=utf-8" }
            elseif ($filePath.EndsWith(".css")) { $contentType = "text/css" }
            elseif ($filePath.EndsWith(".png")) { $contentType = "image/png" }
            elseif ($filePath.EndsWith(".json")) { $contentType = "application/json" }

            $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = "HTTP/1.1 404 Not Found`r`nContent-Length: 0`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
        }

        $stream.Flush()
        $client.Close()
    } catch {
        # continuar escuchando
    }
}
