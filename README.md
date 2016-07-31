# aws-lambda-image-resizer
Listens on an S3 bucket and resizes images according to config.

The original image will remain untouched; the resized images will be saved into a "subdirectory" named after the original file
but with new filenames matching the config. For example, uploading a file to

```
my-bucket/original-file.jpg
```

will result in filenames such as

```
my-bucket/original-file/small
my-bucket/original-file/thumb
```

according to the keys in the "sizes" portion of config.



## Configuration
Config should be stored in a .json file in S3 according to https://github.com/gilt/aws-lambda-config#motivation. TLDR: drop
a file named {your-lambda-function-name}.json into a bucket named like this: aws.lambda.{your-region}.{your-account-id}.config.
The config file should be in this format (descriptions below):

```
{
  "supportedFormats": {
    "png": [
      "image/png",
      "png"
    ],
    "jpeg": [
      "image/jpeg",
      "image/pjpeg",
      "jpg",
      "jpeg",
      "jpe"
    ],
    ...
  },
  "sizes": {
    "small": {
      "width": 100,
      "height": 100
    },
    "thumb": {
      "width": 16,
      "height": 16
    },
    ...
  }
}
```


### supportedFormats
This is a map of imagemagick [supported format](http://www.imagemagick.org/script/formats.php) to an array of mime-types
and file extensions that should match that format. The first member of the mime-type/extension array will be used as the
content-type when writing to S3. Files with formats not found in this list will not be processed. For efficiency, it is
assumed that all values in this config (both format name and mime-type/extension list) are all in lowercase.


### sizes
This is a map of output name (the resized object will use this name when written to S3) to size configuration (width and height).
Each image uploaded to S3 will be resized to this full list of sizes.



## To Deploy to your AWS account
1. In CloudWatch Logs, create a log group named '/aws/lambda/{your-stack-name-here}'. It is really annoying that this can't
   be automatically created in the CloudFormation template, but it can't. If there is ever support for this in CloudFormation,
   these instructions will be updated.
2. Create a CloudFormation stack using https://s3.amazonaws.com/com.gilt.public.backoffice/cloudformation_templates/aws-lambda-image-resizer-deploy.template
3. Upload your config file to aws.lambda.{your-region}.{your-account-id}.config/{stack-name}.json
4. Set up notifications from S3 to the new Lambda function, for all of your image buckets.
5. Set up alarms based on the metrics created by this template: errors, lambda-function-timeouts, resized-files.



## Testing
```
  mocha --recursive test
```



## Deployment (contributors)
After making changes, please do the following:

1. Upload this zipped repo to the com.gilt.public.backoffice/lambda_functions bucket. To produce the .zip file:

   ```
     rm -rf node_modules
     npm install --production
     zip -r aws-lambda-image-resizer.zip . -x *.git* -x *aws-lambda-image-resizer.zip* -x cloud_formation/\* -x *aws-sdk* -x *imagemagick*
   ```

   Unfortunately we can't use the Github .zip file directly, because it zips the code into a subdirectory named after
   the repo; AWS Lambda then can't find the .js file containing the helper functions because it is not on the top-level.

2. Upload the edited templates from the cloud_formation directort to com.gilt.public.backoffice/cloudformation_templates.


## License
Copyright 2016 Ryan Martin

Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0