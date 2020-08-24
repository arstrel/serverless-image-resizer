'use strict';
const imageThumbnail = require('image-thumbnail');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const getS3Image = async (Bucket, Key) => {
  try {
    const resp = await s3.getObject({ Bucket, Key }).promise();
    console.log(resp, `image is Buffer? ${Buffer.isBuffer(resp.Body)}`);
    return resp.Body;
  } catch (err) {
    console.error('Error at getS3Image: ', err);
  }
};

const newFilename = (key) => {
  const [name, ext] = key.split('.');
  return `${name}_thumbnail.png`;
};

const uploadToS3 = async (Bucket, Key, imageBuffer) => {
  const params = {
    Body: imageBuffer,
    Bucket,
    Key,
  };
  console.log(
    `Upload to S3: params: ${Bucket}, ${Key}, image is Buffer ?: ${Buffer.isBuffer(
      imageBuffer
    )}`
  );
  try {
    const resp = await s3.putObject(params).promise();
    const url = `${s3.config.endpoint.href}/${Bucket}/${Key}`;
    console.log(`
      Url: ${url}
      resp: ${resp}`);
    return url;
  } catch (err) {
    console.error('Error at uploadToS3: ', err);
  }
};

const resizeImage = async (image) => {
  const options = {
    width: Number(process.env.THUMBNAIL_WIDTH),
    height: Number(process.env.THUMBNAIL_HEIGHT),
  };

  console.log(
    `resizeImage: is Buffer? ${Buffer.isBuffer(image)}. ${typeof image}`
  );

  const exampleImage = {
    uri:
      'https://images.unsplash.com/photo-1598161940988-fdf0db05a455?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80',
  };

  const thumbnail = await imageThumbnail(image, options);

  return thumbnail;
};

module.exports.thumbnailGenerator = async (event) => {
  console.log('Event log:', event);
  try {
    // parse event
    const bucket = event['Records'][0]['s3']['bucket']['name'];
    const key = event['Records'][0]['s3']['object']['key'];
    // only create a thumbnail on non thumbnail pictures
    if (!key.includes('_thumbnail.png')) {
      // get the image
      const imageBuffer = await getS3Image(bucket, key);
      // resize the image
      const thumbnailBuffer = await resizeImage(imageBuffer);
      // get the new filename
      const thumbnailKey = newFilename(key);
      // upload the file
      const url = await uploadToS3(bucket, thumbnailKey, thumbnailBuffer);
      return url;
    }
  } catch (err) {
    console.error(err);
  }
};
