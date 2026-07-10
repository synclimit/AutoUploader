import pickle
p = r'C:\Users\Server Abal\AppData\Roaming\AutoUploader\tokens\accounts\743ada11-e6d5-4616-862f-0dc39512c9da.pickle'
try:
    with open(p, 'rb') as f:
        creds = pickle.load(f)
    print('Valid:', getattr(creds, 'valid', 'No'))
    print('Refresh:', getattr(creds, 'refresh_token', 'No'))
except Exception as e:
    print('Error:', type(e), e)
