exports.getExtension = function(objectKey) {
  var parts = exports.getFilePathArray(objectKey);
  if (parts.length == 0) return '';
  var filename = parts[parts.length - 1];
  var loc = filename.lastIndexOf('.');
  if (loc >= 0)
    return filename.substr(loc + 1).toLowerCase();
  else return '';
}

exports.getFilePathArray = function(filePath) {
  return (filePath || '').split('/').filter(function(s) { return s ? true : false });
}

exports.getMimeType = function(supportedFormats, supportedFormat) {
  var found = supportedFormats[supportedFormat.toLowerCase()];
  if (found) {
    if (Array.isArray(found))
      return found[0].toLowerCase();
    else
      return found.toLowerCase();
  } else {
    throw new Error(supportedFormat + " is not a supported format found in config.");
  }
}

// opts can include any of the following:
//   imageMetadata - the result of calling ImageMagick#identify
//   objectMetadata - the Metadata value from the response to AWS.S3#getObject
//   contentType - the ContentType value from the response to AWS.S3#getObject
exports.getSupportedFormat = function(objectKey, supportedFormats, opts) {
  var extension = exports.getExtension(objectKey);
  var supportedFormat = Object.keys(supportedFormats).find(function(key) {
    var options = supportedFormats[key];
    if (!Array.isArray(options)) options = [options];
    if (
      // Note: it may prove smarter to loop through the supported formats once for each of
      // the clauses below. That would set a priority on the individual clause, instead of
      // the order of the entries in config.
      (opts["imageMetadata"] && opts["imageMetadata"]["format"] && (opts["imageMetadata"]["format"].toLowerCase() == key)) ||
      (opts["contentType"] && includes(options, opts["contentType"].toLowerCase())) ||
      includes(options, extension) ||
      (opts["objectMetadata"] && opts["objectMetadata"]["content-type"] && includes(options, opts["objectMetadata"]["content-type"].toLowerCase())) ||
      (extension == key)
    ) {
      return key;
    }
  });
  if (!supportedFormat) throw new Error("Could not find a supported format for " + objectKey);
  return supportedFormat;
}

function includes(arr, item) {
  return arr.indexOf(item) >= 0;
}
