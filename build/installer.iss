[Setup]
AppName=AutoUploader
AppVersion=1.0.0
AppPublisher=Raynz Studio
DefaultDirName={autopf}\AutoUploader
DefaultGroupName=AutoUploader
OutputDir=..\release
OutputBaseFilename=AutoUploader_Setup
Compression=lzma
SolidCompression=yes
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\AutoUploader.exe

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"

[Files]
Source: "..\backend\dist\AutoUploader\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\AutoUploader"; Filename: "{app}\AutoUploader.exe"
Name: "{group}\Uninstall AutoUploader"; Filename: "{uninstallexe}"
Name: "{commondesktop}\AutoUploader"; Filename: "{app}\AutoUploader.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\AutoUploader.exe"; Description: "Launch AutoUploader"; Flags: nowait postinstall skipifsilent

[Code]
procedure InitializeWizard;
begin
  // Could add custom initialization here
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  AppDataPath: string;
begin
  if CurStep = ssPostInstall then
  begin
    // Explicitly create AppData folders
    AppDataPath := ExpandConstant('{userappdata}\AutoUploader');
    ForceDirectories(AppDataPath + '\logs');
    ForceDirectories(AppDataPath + '\exports');
    ForceDirectories(AppDataPath + '\workspace');
    ForceDirectories(AppDataPath + '\cache');
    ForceDirectories(AppDataPath + '\backup');
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  AppDataPath: string;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    if MsgBox('Delete all user data (Settings, Database, License)?', mbConfirmation, MB_YESNO) = idYes then
    begin
      AppDataPath := ExpandConstant('{userappdata}\AutoUploader');
      DelTree(AppDataPath, True, True, True);
    end;
  end;
end;
