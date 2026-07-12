class UploadFailed(Exception):
    pass

class QuotaExceeded(Exception):
    pass

class CredentialUnavailable(Exception):
    pass

class OAuthUnavailable(Exception):
    pass

class InvalidMetadata(Exception):
    pass

class MissingVideo(Exception):
    pass

class UploadCancelled(Exception):
    pass

class NetworkFailure(Exception):
    pass
