/* global $ Camera navigator */
var uploadServer = 'https://externalfiles-franzgusenbauer.c9users.io/upload';

function camSuccess(imgData) {
  saveImg(imgData);
}

function camError(error) {
  alert('Failed because: ' + error);
}

function accessCamera() {
  navigator.camera.getPicture(camSuccess, camError, { quality: 75,
    sourceType: Camera.PictureSourceType.CAMERA,
    destinationType: Camera.DestinationType.FILE_URI,
    targetWidth: 1280,
    targetHeight: 1280,
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
  options.params = {}; // if we need to send parameters to the server request
  options.chunkedMode = false;
  options.headers = {
    "Access-Control-Allow-Origin": "*",
    "Authorization": "Bearer " + window.qgemToken
  };
  options.httpMethod = 'POST';
  options.trustAllHosts = true;
  options.params = {'key': 'fk_wartung', value: 1 }; 
  var ft = new FileTransfer();
  ft.upload(fileURI, encodeURI(uploadServer), win, fail, options);
}

