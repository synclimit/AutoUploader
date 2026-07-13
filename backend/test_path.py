from services.system.path_service import PathService
import os

print(os.path.join(PathService.get_logs_dir(), 'autouploader.log'))
