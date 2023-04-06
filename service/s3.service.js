import AWS from 'aws-sdk';
import { readFileSync } from 'fs';
// import config from '../config/config.js';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});
const uploadS3 = async (file) => {
  try {
    const type = file.originalFilename.split('.')[1];
    const buffer = readFileSync(file.path);
    const params = {
      Bucket: config.s3.BUCKET_NAME,
      Key: file.originalFilename,
      Body: buffer,
      ACL: 'public-read',
      ContentType: `image/${type}`,
    };
    const s3Response = await s3.upload(params).promise();
    return s3Response;
  } catch (e) {
    console.log('Error in s3 upload', e);
  }
};
const s3Service = {
  uploadS3,
};

export default s3Service;
