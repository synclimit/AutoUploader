class OAuthConfigurationException(Exception):
    pass

class OAuthConnectionException(Exception):
    pass

class TokenExchangeException(Exception):
    pass

class RefreshTokenException(Exception):
    pass

class InvalidScopeException(Exception):
    pass

class GoogleUnavailableException(Exception):
    pass

class UnauthorizedException(Exception):
    pass
