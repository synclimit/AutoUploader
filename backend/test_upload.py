import requests

def test_upload():
    # We need a dummy channel_id. Let's get the first channel.
    accounts_res = requests.get('http://localhost:8001/api/v1/channels')
    channels = accounts_res.json()
    if not channels:
        print("No channels to test with.")
        return
    channel_id = channels[0]['id']
    
    # Create a dummy file
    with open('dummy_video.mp4', 'wb') as f:
        f.write(b'dummy video content')
        
    print(f"Testing upload for channel {channel_id}")
    
    with open('dummy_video.mp4', 'rb') as f:
        files = {
            'files': ('dummy_video.mp4', f, 'video/mp4')
        }
        data = {
            'channel_id': channel_id
        }
        res = requests.post('http://localhost:8001/api/v1/import/upload', files=files, data=data)
        
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == '__main__':
    test_upload()
