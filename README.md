# Serverless image resize lambda

It is triggered when .png file is added to S3 bucket.
The function retrieved the image, resizes it to a defined size and uploads to S3 with filename_thumbnail.png
