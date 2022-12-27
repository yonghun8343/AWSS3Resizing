// Node 버전 18.x에서 사용
const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const transforms = [
  { name: "w_200", width: 200 },
  { name: "w_400", width: 400 },
];

const client = new S3Client({ region: "ap-northeast-2" });

exports.handler = async (event, _, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");
  const filename = parts[parts.length - 1];

  try {
    const image = await client.send(
      new GetObjectCommand({ Bucket, Key: sanitizedKey })
    );

    // 12버전과 다르게 stream으로 body가 오기 때문에 buffer로 바꿔 줄 필요가 있다.
    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
      });

    await Promise.all(
      transforms.map(async ({ name, width }) => {
        const body = await streamToBuffer(image.Body);
        const resizedImg = await sharp(body)
          .resize({ width: width })
          .toBuffer();
        return await client.send(
          new PutObjectCommand({
            Bucket,
            Body: resizedImg,
            Key: `images/${name}/${filename}`,
          })
        );
      })
    );
    callback(null, `Success: ${filename}`);
  } catch (err) {
    callback(`Error resizing files: ${err}`);
  }
};
