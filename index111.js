const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const Bucket = "student-01-test-bucket";
const transforms = [
  { name: "w_200", width: 200 },
  { name: "w_400", width: 400 },
];

const client = new S3Client({ region: "ap-northeast-2" });

exports.handler = async (event, _, callback) => {
  const key = event.Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");
  const filename = parts[parts.length - 1];

  try {
    const image = await client.send(
      new GetObjectCommand({ Bucket, Key: sanitizedKey })
    );

    await Promise.all(
      transforms.map(async (item) => {
        const resizedImg = await sharp(image.Body)
          .resize({ width: item.width })
          .toBuffer();
        return await client.send(
          new PutObjectCommand({
            Bucket,
            Body: resizedImg,
            Key: `images/${item.name}/${filename}`,
          })
        );
      })
    );
    callback(null, `Success: ${filename}`);
  } catch (err) {
    callback(`Error resizing files: ${err}`);
  }
};
