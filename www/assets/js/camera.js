/* global $ Camera navigator */

var cameraModule = function(){ 
  var _schema, _wartung_id, _dateiname;
  function camSuccess(imgData) {
    saveImg(imgData);
  }
  
  function camError(error) {
    alert('Failed because: ' + error);
  }
   
  function accessCamera(schema, wartung_id, dateiname) {
    _schema = schema;
    _wartung_id = wartung_id;
    _dateiname = dateiname;
    navigator.camera.getPicture(camSuccess, camError, { quality: 85,
      sourceType: Camera.PictureSourceType.CAMERA,
      destinationType: Camera.DestinationType.FILE_URI,
      targetWidth: 2200,
      targetHeight: 2200,
      encodingType: Camera.EncodingType.JPEG,
      allowEdit: false,
      correctOrientation: true,
      saveToPhotoAlbum: false 
    });
  }
  function alertDismissed() {
    // body...
  }
  function saveImg(fileURI) {
    var retries = 0;
    var win = function (r) {
      navigator.camera.cleanup();
      retries = 0;
      navigator.notification.alert(
          'Foto erfolgreich hochgeladen!',  // message
          alertDismissed,         // callback
          'Upload Server',            // title
          'OK'                    // buttonName
      );
    }
    var fail = function (error) {
      if (retries == 0) {
        retries ++
        setTimeout(function() {
            saveImg()
        }, 1000)
      } else {
        retries = 0;
        navigator.camera.cleanup();
        alert('Upload fehlgeschlagen ' + JSON.stringify(error));
      }
    }
  
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    options.chunkedMode = false;
    options.headers = {
      "Access-Control-Allow-Origin": "*",
      "Authorization": "Bearer " + window.qgemToken
    };
    options.httpMethod = 'POST';
    options.trustAllHosts = true;
    options.params = {
      "resource": "externedateien",
      "schema": _schema,
      "wartung_id": _wartung_id,
      "dateiname": _dateiname
    }; 
    var ft = new FileTransfer();
    ft.upload(fileURI, encodeURI(uploadServer + '/upload'), win, fail, options);
  }
  
  return {
    accessCamera: accessCamera
  }
  
}();



