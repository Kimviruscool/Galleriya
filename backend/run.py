from app import create_app

# create_app 함수를 통해 Flask 앱 객체 생성
app = create_app()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)