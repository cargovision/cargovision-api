const { R2 } =  require('node-cloudflare-r2');
const path = require("path");

const r2 = new R2({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
});

const bucket = r2.bucket(process.env.R2_BUCKET);

bucket.provideBucketPublicUrl(process.env.R2_PUBLIC_URL);

const uploadImage = async (buffer, file, contentType = 'image/jpeg') => {
    const upload = await bucket.upload(buffer, file, undefined, contentType);
    
    return upload.publicUrls[0];
};

module.exports = uploadImage;