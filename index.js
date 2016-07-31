var AWS = require('aws-sdk'),
    Promise = require('bluebird')
    conf = Promise.promisifyAll(require('aws-lambda-config')),
    fs = Promise.promisifyAll(require('fs')),
    helpers = require('lib/helpers'),
    im = Promise.promisifyAll(require('imagemagick')),
    s3 = Promise.promisifyAll(new AWS.S3());

exports.handler = function(event, context) {
  return conf.getConfigAsync(context)
  .then(function(config) {
    return Promise.map(
      event.Records,
      function(record) {
        var localFilePath = "/tmp/" + new Date().getTime();
        var resizedLocalFilePath = "/tmp/" + new Date().getTime() + "-resized";
        var fullS3Path = record.s3.bucket.name + '/' + record.s3.object.key;
        var fullS3PathArray = helpers.getFilePathArray(fullS3Path);
        var rootS3Path = fullS3PathArray.slice(1, fullS3PathArray.length).join('/');
        var ext = helpers.getExtension(fullS3Path);
        if (ext.length > 0) rootS3Path = rootS3Path.substr(0, ext.length + 1);
        return s3.getObjectAsync({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key
        })
        .then(function(objectData) {
          return fs.writeFileAsync(localFilePath, objectData.Body)
          .then(function() {
            return im.identifyAsync(localFilePath);
          })
          .then(function(metadata) {
            var imageFormat = helpers.getSupportedFormat(record.s3.object.key, config.supportedFormats, {"imageMetadata": metadata, "objectMetadata": objectData.Metadata, "contentType": objectData.ContentType})
            if (!config.sizes) throw "config has no resizing information.";
            return Promise.map(
              Object.keys(config.sizes),
              function(resizeKey) {
                var resizeConfig = config.sizes[resizeKey];
                return im.cropAsync({
                  srcPath: localFilePath,
                  srcFormat: imageFormat,
                  dstPath: resizedLocalFilePath,
                  width: resizeConfig.width,
                  height: resizeConfig.height
                })
                .then(function(stdout) {
                  return fs.readFileAsync(resizedLocalFilePath);
                })
                .then(function(fileContents) {
                  return s3.putObjectAsync({
                    Bucket: record.s3.bucket.name,
                    Key: rootS3Path + "/" + resizeKey,
                    Body: fileContents,
                    ContentType: helpers.getMimeType(config.supportedFormats, imageFormat)
                  });
                })
                .then(function(putData) {
                  var result = {
                    bucket: record.s3.bucket.name,
                    object_key: record.s3.object.key,
                    resized_object_key: rootS3Path + "/" + resizeKey,
                    width: resizeConfig.width,
                    height: resizeConfig.height
                  };
                  console.info(JSON.stringify(result));
                  return result;
                });
              }
            );
          });
        });
      }
    );
  })
  .then(function(result) {
    context.succeed(result);
  })
  .catch(function(err) {
    console.error('UnknownException: ' + (err.stack || err));
    context.fail(err);
    throw err;
  });
}
