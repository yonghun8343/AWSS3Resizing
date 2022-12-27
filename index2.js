// Node버전 12.x버전에서 사용
const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();

const transforms = [
  { name: "w_200", width: 200 },
  { name: "w_400", width: 400 },
];

exports.handler = async (event, _, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");
  const filename = parts[parts.length - 1];

  try {
    const { Body } = await s3
      .getObject({ Bucket, Key: sanitizedKey })
      .promise();

    await Promise.all(
      transforms.map(async ({ name, width }) => {
        const resizedImg = await sharp(Body)
          .resize({ width: width })
          .toBuffer();
        return await s3
          .putObject({
            Bucket,
            Body: resizedImg,
            Key: `images/${name}/${filename}`,
          })
          .promise();
      })
    );
    callback(null, `Success: ${filename}`);
  } catch (err) {
    callback(`Error resizing files: ${err}`);
  }
};
