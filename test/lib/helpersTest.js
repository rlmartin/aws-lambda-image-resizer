var assert = require('assert'),
    helpers = require('../../lib/helpers');

describe('index', function() {
  describe('#getExtension', function() {
    it("should work on a full path", function() {
      assert.equal(helpers.getExtension("path/to/my/filename.jpg"), "jpg");
    });

    it("should work on an isolated filename", function() {
      assert.equal(helpers.getExtension("filename.txt"), "txt");
    });

    it("should work on longer extensions", function() {
      assert.equal(helpers.getExtension("filename.xcproj"), "xcproj");
    });

    it("should work on an empty string", function() {
      assert.equal(helpers.getExtension(""), "");
      assert.equal(helpers.getExtension(null), "");
    });

    it("should work when filename is missing an extension", function() {
      assert.equal(helpers.getExtension("filename"), "");
    });
  });

  describe('#getFilePathArray', function() {
    it("should separate a normal path", function() {
      assert.deepEqual(helpers.getFilePathArray("path/to/my/filename.jpg"), ["path", "to", "my", "filename.jpg"]);
    });

    it("should not fail on an empty path", function() {
      assert.deepEqual(helpers.getFilePathArray(""), []);
      assert.deepEqual(helpers.getFilePathArray(null), []);
    });

    it("should remove empty sections", function() {
      assert.deepEqual(helpers.getFilePathArray("path////filename.jpg"), ["path", "filename.jpg"]);
    });
  });

  describe('#getMimeType', function() {
    var supportedFormats = {
      "png": ["image/png", "png"],
      "jpeg": ["image/jpeg", "image/pjpeg", "jpg", "jpeg"],
      "gif": "image/gif"
    }

    it("should return the first mime-type when found", function() {
      assert.equal(helpers.getMimeType(supportedFormats, "png"), "image/png");
      assert.equal(helpers.getMimeType(supportedFormats, "PNG"), "image/png");
      assert.equal(helpers.getMimeType(supportedFormats, "jpeg"), "image/jpeg");
      assert.equal(helpers.getMimeType(supportedFormats, "jPeG"), "image/jpeg");
    });

    it("should work when there is only one mime-type", function() {
      assert.equal(helpers.getMimeType(supportedFormats, "gif"), "image/gif");
    });

    it("should throw when not found", function() {
      assert.throws(function() {helpers.getMimeType(supportedFormats, "txt")}, Error, "txt is not a supported format found in config.");
    });
  });

  describe('#getSupportedFormat', function() {
    var supportedFormats = {
      "png": ["image/png", "png"],
      "jpeg": ["image/jpeg", "image/pjpeg", "jpg", "jpeg"],
      "gif": "image/gif"
    }

    it("should find a supported format based on the image metadata", function() {
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"imageMetadata": {"format": "PNG"}}), "png");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"imageMetadata": {"format": "JPEG"}}), "jpeg");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"imageMetadata": {"format": "GIF"}}), "gif");
    });

    it("should find a supported format based on contentType", function() {
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"contentType": "image/png"}), "png");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"contentType": "png"}), "png");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"contentType": "jpg"}), "jpeg");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"contentType": "image/gif"}), "gif");
    });

    it("should find a supported format based on the S3 object metadata", function() {
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"objectMetadata": {"content-type": "image/png"}}), "png");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"objectMetadata": {"content-type": "png"}}), "png");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"objectMetadata": {"content-type": "jpg"}}), "jpeg");
      assert.equal(helpers.getSupportedFormat("file", supportedFormats, {"objectMetadata": {"content-type": "image/gif"}}), "gif");
    });

    it("should find a supported format based on file extension", function() {
      assert.equal(helpers.getSupportedFormat("file.png", supportedFormats, {}), "png");
      assert.equal(helpers.getSupportedFormat("file.jpg", supportedFormats, {}), "jpeg");
      assert.equal(helpers.getSupportedFormat("file.jpeg", supportedFormats, {}), "jpeg");
      assert.equal(helpers.getSupportedFormat("file.gif", supportedFormats, {}), "gif");
    });

    it("should throw an execption if there is no match", function() {
      assert.throws(function() {helpers.getSupportedFormat("file.txt", supportedFormats, {})}, Error, "Could not find a supported format for file.txt");
    });
  });
});
