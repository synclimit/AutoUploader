class InvalidCredentialException(Exception):
    pass

class DuplicateProjectException(Exception):
    pass

class MissingJsonException(Exception):
    pass

class OAuthFailedException(Exception):
    pass

class RefreshFailedException(Exception):
    pass

class WorkspaceException(Exception):
    pass

class ValidationException(Exception):
    pass
