[Setup]
AppName=Raynz PitStop
AppVersion=1.0.0
AppPublisher=Raynz Studio
DefaultDirName={autopf}\Raynz PitStop
DefaultGroupName=Raynz PitStop
OutputDir=..\release
OutputBaseFilename=RaynzPitStop_Setup
Compression=lzma
SolidCompression=yes
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\RaynzPitStop.exe

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"

[Files]
Source: "..\backend\dist\RaynzPitStop\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Raynz PitStop"; Filename: "{app}\RaynzPitStop.exe"
Name: "{group}\Uninstall Raynz PitStop"; Filename: "{uninstallexe}"
Name: "{commondesktop}\Raynz PitStop"; Filename: "{app}\RaynzPitStop.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\RaynzPitStop.exe"; Description: "Launch Raynz PitStop"; Flags: nowait postinstall skipifsilent

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
    AppDataPath := ExpandConstant('{userappdata}\RaynzPitStop');
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
      AppDataPath := ExpandConstant('{userappdata}\RaynzPitStop');
      DelTree(AppDataPath, True, True, True);
    end;
  end;
end;
