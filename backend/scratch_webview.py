import webview

def main():
    webview.create_window("AutoUploader", "http://127.0.0.1:8000")
    webview.start()

if __name__ == '__main__':
    main()
