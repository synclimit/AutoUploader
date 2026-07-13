Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.OpenFileDialog
$dlg.Title = "Select Watch Folder"
$dlg.Filter = "Folder|\n"
$dlg.CheckFileExists = $false
$dlg.CheckPathExists = $true
$dlg.FileName = "Folder Selection."
$dlg.ValidateNames = $false
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$result = $dlg.ShowDialog($form)
if ($result -eq 'OK') {
    Write-Output (Split-Path $dlg.FileName)
}
