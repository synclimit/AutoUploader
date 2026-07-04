import requests

def test_upload():
    # We need a dummy account_id. Let's get the first account.
    accounts_res = requests.get('http://localhost:8001/api/v1/accounts')
    accounts = accounts_res.json()
    if not accounts:
        print("No accounts to test with.")
        return
    account_id = accounts[0]['id']
    
    # Create a dummy file
    with open('dummy_video.mp4', 'wb') as f:
        f.write(b'dummy video content')
        
    print(f"Testing upload for account {account_id}")
    
    with open('dummy_video.mp4', 'rb') as f:
        files = {
            'files': ('dummy_video.mp4', f, 'video/mp4')
        }
        data = {
            'account_id': account_id
        }
        res = requests.post('http://localhost:8001/api/v1/import/upload', files=files, data=data)
        
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == '__main__':
    test_upload()
