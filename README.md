# AWSS3Resizing

지극히 개인적으로 저장 해 두기 위해서 만든 기능

## 사전 준비

### S3 버킷 생성

S3 버킷을 미리 생성 해 줍니다.

그리고 원활한 예제를 위해서 /images/origin에 파일을 하나 만들어 줍니다.

이벤트 트리거를 걸기 위해서는 우선 람다 함수가 필요하기 때문에 생성만 해 줍니다.

### IAM 생성

lambda를 기반으로 S3에 접근 할 수 있는 IAM을 생성합니다.

IAM의 역할 -> 역할 생성 -> 사용 사례에서 Lambda 선택 -> AmazonS3FullAccess, AWSLambdaBasicExecutionRole 선택

### Lambda 생성

람다를 생성 해 줍니다. 기존 역할에는 방금 생성한 IAM을 해 줍니다.

시간은 3초가 너무 짧습니다. 10초로 해 줍니다.

메모리도 128MB가 Default로 되어있는데, 메모리가 작습니다. 512MB로 만들어 줍니다.

### 코드 작성

sharp라는 모듈을 이용하여 이미지를 리사이징합니다.

Lambda는 기본적으로 생성 할 때 x64, 운영체제는 리눅스로 생성이 되기 때문에

아래의 명령어를 입력하여 모듈을 설치 해 줍니다.

```bash
npm install --arch=x64 --platform=linux sharp
```

index.js은 Node 18.x에서 사용하는 코드 입니다.
index2.js는 Node 12.x에서 사용하는 코드 입니다.

### 코드 압축 및 업로드

람다에서는 기본적으로 Node 12.x에서는 aws-sdk가 설치가 되어있습니다.
Node 18.x에서는 @aws-sdk/client-s3가 설치되어 있습니다.

그러나 sharp는 별도로 가지고 있지 않기 때문에 코드를 압축해서 업로드 해 주어야합니다.

코드 압축 후 "에서 업로드"를 눌러 업로드 해 줍니다.

업로드는 자동으로 Deploy가 됩니다.

### 테스트

테스트코드는 다음과 같습니다.

이벤트 예제에서 s3.bucket.name과 s3.bucket.arn, s3.objet.key를 수정 해 줍니다.

예시는 다음과 같습니다.

```json
{
  "Records": [
    {
      "eventVersion": "2.0",
      "eventSource": "aws:s3",
      "awsRegion": "ap-northeast-2",
      "eventTime": "1970-01-01T00:00:00.000Z",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "EXAMPLE"
      },
      "requestParameters": {
        "sourceIPAddress": "127.0.0.1"
      },
      "responseElements": {
        "x-amz-request-id": "EXAMPLE123456789",
        "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "testConfigRule",
        "bucket": {
          "name": "student-01-test-bucket",
          "ownerIdentity": {
            "principalId": "EXAMPLE"
          },
          "arn": "arn:aws:s3:::student-01-test-bucket"
        },
        "object": {
          "key": "images/origin/Loading Data.png",
          "size": 1024,
          "eTag": "0123456789abcdef0123456789abcdef",
          "sequencer": "0A1B2C3D4E5F678901"
        }
      }
    }
  ]
}
```

### S3에 트리거 설정

버킷에서 속성의 하단에 이벤트 알림을 생성 합니다.

여기서 작성 해야할 부분은 아래와 같습니다.

접두사 : images/origin

이벤트 유형: 전송(s3:ObjectCreated:Put)

대상 : Lambda 함수에서 만든 람다 선택
