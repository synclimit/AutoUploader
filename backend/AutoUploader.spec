# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas_pyd, binaries_pyd, hiddenimports_pyd = collect_all('pydantic')
datas_core, binaries_core, hiddenimports_core = collect_all('pydantic_core')

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[] + binaries_pyd + binaries_core,
    datas=[
        ('frontend_dist', 'frontend_dist'),
        ('services/license/keys', 'services/license/keys'),
        ('prompts', 'prompts'),
        ('../version.json', '.'),
        ('tokens/client_secret.json', 'tokens'),
        ('../client_secret.json', '.'),
    ] + datas_pyd + datas_core,
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'passlib.handlers.bcrypt',
        'sqlite3',
        'sqlalchemy.ext.baked',
        'pydantic',
        'pydantic.validators',
        'pydantic.deprecated.default_value',
        'pydantic_core',
        'pydantic_core._pydantic_core',
        'win32timezone',
        'webview',
        'webview.platforms.winforms',
        'webview.platforms.edgechromium',
        'clr_loader',
        'google.auth._regional_access_boundary_utils',
    ] + hiddenimports_pyd + hiddenimports_core,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='AutoUploader',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../assets/icon.ico',
    version='file_version_info.txt'
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='AutoUploader',
)
