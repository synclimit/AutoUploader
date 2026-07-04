from abc import ABC, abstractmethod
from .upload_context import UploadContext
from .upload_result import UploadResult

class BaseUploader(ABC):
    @abstractmethod
    def upload(self, context: UploadContext) -> UploadResult:
        """Execute the upload process given an immutable UploadContext and return an immutable UploadResult."""
        pass
