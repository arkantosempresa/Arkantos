$c = Get-Content -Path "src\app.js"
$stack = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $c.Count; $i++) {
    $lineNum = $i + 1
    $line = $c[$i]
    foreach ($char in $line.ToCharArray()) {
        if ($char -eq '{') {
            $stack.Add("${lineNum}: ${line}")
        } elseif ($char -eq '}') {
            if ($stack.Count -gt 0) {
                $stack.RemoveAt($stack.Count - 1)
            }
        }
    }
}

Write-Host "Unclosed count: $($stack.Count)"
foreach ($item in $stack) {
    Write-Host "Unclosed: $item"
}
