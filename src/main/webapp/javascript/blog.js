var selectedForUpload = new Array();

var MAX_PICTURE_SIZE_SUM = 40000000;

var MAX_BLOG_TEXT_LENGTH = 4096;
      
var xhr;
      
var lastUploadedFile;
      
var currentFileNum = 1;
	  
var totalSizeSum = 0;
	  
var totalLoaded = 0;
	  
var sizeOfCurrentFile = 0;

var pictureFileSize = 0;

var firefoxDragDrop = existFileReader();

var SINGLE_FILE_MAX_SIZE;

var uploadStartedByButton = false;

var publicUrl = null;
      
if (browserFirefox)
{
    // SINGLE_FILE_MAX_SIZE = 134217728;
    SINGLE_FILE_MAX_SIZE = 500000000;
}
else 
{
    SINGLE_FILE_MAX_SIZE = 999999999;
}

function existFileReader()
{
    try
    {
        var featureTest = new FileReader();
        if (featureTest != null) 
        {
            return true;
        } 
    }
    catch (Exception)
    {
    }
      
    return false;
}        

function isPictureFile(fileType) {
    lowerCaseFileType = fileType.toLowerCase();
          
    return((lowerCaseFileType.indexOf("jpg") >= 0) ||
           (lowerCaseFileType.indexOf("jpeg") >= 0) ||
           (lowerCaseFileType.indexOf("gif") >= 0) ||
           (lowerCaseFileType.indexOf("png") >= 0) ||
           (lowerCaseFileType.indexOf("bmp") >= 0));
}

function selectedDuplicate(fileName) {
    for (var i = 0; i < selectedForUpload.length; i++) {
        var selectedFileName;
        if (browserSafari) {
            selectedFileName = selectedForUpload[i].fileName
        } else {
            selectedFileName = selectedForUpload[i].name
        }
      
        if (selectedFileName == fileName) {
            return true;
        }  
    }
          
    return false;
}

function prepareDropZone() {
    if (browserSafari) {
        // in Safari files can be dropped only to the file input component, not to a div
        return;
    }
      
    var dropZone;
    dropZone = document.getElementById("dropZone"); 
    dropZone.addEventListener("mouseover", hideHint, false);      
    dropZone.addEventListener("mouseout", showHint, false);  
    dropZone.addEventListener("dragenter", dragenter, false);  
    dropZone.addEventListener("dragover", dragover, false);  
    dropZone.addEventListener("drop", drop, false);      
}
    
function dragenter(e) {  
    e.stopPropagation();  
    e.preventDefault();  
}  
  
function dragover(e) {  
    e.stopPropagation();  
    e.preventDefault();  
}     
    
function drop(e) { 
    e.stopPropagation();  
    e.preventDefault();  
          
    var dt = e.dataTransfer;  
    var files = dt.files;  

    if (firefoxDragDrop)
    {
        handleFiles(files);  
    }
    else
    {   
        positionStatusDiv();

        var fileNum = files.length;
  
        for (var i = 0; i < fileNum; i++) { 
             selectedForUpload.push(files[i]);
        }

        var file = selectedForUpload.pop();
        if (file) {
            new singleFileBinaryUpload(file); 
        }
    }
}     
  
function showHint() {
    var hintText = document.getElementById("dragDropHint");
    if (hintText != null) {
        hintText.style.visibility = 'visible';  
    }
}
  
function hideHint() {
    var hintText = document.getElementById("dragDropHint");
    if (hintText != null) {
        hintText.style.visibility = 'hidden';  
    }
}

function handleFiles(files) {  
    var dropZone = document.getElementById("dropZone");  
    var uploadFileList = document.getElementById("uploadFiles");

    for (var i = 0; i < files.length; i++) {  
        var file = files[i];  
              
        var fileName;
        var fileSize;
              
        if (browserSafari) {
            fileName = file.fileName;
            file.size = file.fileSize;
        } else {
            fileName = file.name
            fileSize = file.size;
        }
              
        if (file.size > SINGLE_FILE_MAX_SIZE) {
            alert(fileName + ': ' + resourceBundle["blog.uploadFileTooLarge"]);
        } else {
            if (!selectedDuplicate(fileName)) {
                if (!browserSafari) {
                    var hintText = document.getElementById("dragDropHint");
                    if (hintText) {
                        dropZone.removeChild(hintText);
                    }
                }

                if (firefoxDragDrop && isPictureFile(file.type)) {  
                      
                    if (pictureFileSize < MAX_PICTURE_SIZE_SUM) {
                        var img = document.createElement("img");  
                      
                        img.className += (img.className ? " " : "") + "uploadPreview";
                      
                        img.file = file;  
                        dropZone.appendChild(img);  
     
                        var reader = new FileReader();  
                        reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);  
                        reader.readAsDataURL(file);  
                              
                        pictureFileSize += file.size;
                     }
                } 
                      
                var listElem = document.createElement("li");
                      
                listElem.className += (listElem.className ? " " : "") + "selectedForUpload";
                      
                var listElemText = document.createTextNode(fileName);
                listElem.appendChild(listElemText);
                uploadFileList.appendChild(listElem);
                      
                selectedForUpload.push(file);
            }

            /*
            document.getElementById('selectedForUpload').style.visibility = 'visible';
            document.getElementById('selectedForUpload').style.display = 'block';
            */
        }
    }  
} 

function submitPost() {
    var blogText = document.getElementById("blogText").value;

    if ((selectedForUpload.length == 0) && (trim(blogText).length == 0)) {
        alert(resourceBundle["blog.emptyPost"]);
        return;
    }
    
    if (trim(blogText).length == 0) {
        if (!confirm(resourceBundle["blog.confirmSendEmptyText"])) {
            return;
        }
    } else if (trim(blogText).length > MAX_BLOG_TEXT_LENGTH) {
        alert(resourceBundle["blog.textTooLong"]);
        return;
    }
    
    var geoDataSwitcher = document.getElementById("blogGeoDataSwitcher");
    
    if (geoDataSwitcher && geoDataSwitcher.checked) {
        var latitude = parseFloat(document.getElementById("latitude").value);

        if (isNaN(latitude) || (latitude < (-90.0)) || (latitude > 90.0)) {
            alert(resourceBundle["error.latitudeInvalid"]);
            return;  
        }    

        var longitude = parseFloat(document.getElementById("longitude").value);

        if (isNaN(longitude) || (longitude < (-180.0)) || (longitude > 180.0)) {
            alert(resourceBundle["error.longitudeInvalid"]);
            return;  
        }    
    }
    
    if (selectedForUpload.length > 0) {
        positionStatusDiv();
        sendFiles();
    } else {
        document.getElementById("blogForm").submit();
    }   
}

function positionStatusDiv()
{
    var statusDiv = document.getElementById("uploadStatus");

    var statusDivWidth = statusDiv.offsetWidth;
    var statusDivHeight = statusDiv.offsetHeight; 

    var windowWidth;
    var windowHeight;
    var yScrolled;
    var xScrolled = 0;

    if (browserFirefox) 
    {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        yScrolled = window.pageYOffset;
        xScrolled = window.pageXOffset;
    }
    else 
    {
        windowWidth = document.body.clientWidth;
        windowHeight = document.body.clientHeight;
        yScrolled = document.body.scrollTop;
    }

    statusDiv.style.top = ((windowHeight - statusDivHeight) / 2 + yScrolled) + 'px';
    statusDiv.style.left = ((windowWidth - statusDivWidth) / 2 + xScrolled) + 'px';
}

function hideBrowserSpecifics()
{
    document.getElementById('lastUploaded').style.visibility = 'hidden';
    document.getElementById('lastUploaded').style.display = 'none';
    /*
    document.getElementById('selectedForUpload').style.visibility = 'hidden';
    document.getElementById('selectedForUpload').style.display = 'none';
    */
          
    if (browserSafari)
    {
        document.getElementById('dropTarget').style.visibility = 'hidden';
        document.getElementById('dropTarget').style.display = 'none';
    }
}

function sendFiles() {  
    uploadStartedByButton = true;

    var filesToUploadNumCont = document.getElementById("filesToUploadNum");

    filesToUploadNumCont.innerHTML = selectedForUpload.length;  
		  
	for (var i = 0; i < selectedForUpload.length; i++) {
	    if (browserSafari) {
	        totalSizeSum += selectedForUpload[i].fileSize;
	    } else {
		    totalSizeSum += selectedForUpload[i].size;
		}
	}
		  
    var file = selectedForUpload.pop();
          
    if (file) {
        singleFileBinaryUpload(file);
    }
} 
      
function singleFileBinaryUpload(file) {
      
    var fileName;
    var fileSize;
    if (browserSafari) {
        fileName = file.fileName;
        fileSize = file.fileSize;
    } else {
        fileName = file.name
        fileSize = file.size;
    }
      
    sizeOfCurrentFile = fileSize;
	  
    if (existUploadTargetFile(fileName))
    {
        if (!confirm(fileName + ': ' + resourceBundle["upload.file.exists"])) 
        {
            var nextFile = selectedForUpload.pop();
            if (nextFile) 
            {
                new singleFileBinaryUpload(nextFile)
            }

            return;
        }
    }
      
    lastUploadedFile = fileName;
      
    document.getElementById("currentFile").innerHTML = shortText(fileName, 50);
          
    document.getElementById("statusText").innerHTML = "0 " + resourceBundle["label.of"] + " " + formatDecimalNumber(fileSize) + " bytes ( 0%)";

    var statusWin = document.getElementById("uploadStatus");
    statusWin.style.visibility = 'visible';

    var now = new Date();

    var serverFileName = document.getElementById("dateYear").value + "-" +
                         document.getElementById("dateMonth").value + "-" +
                         document.getElementById("dateDay").value + "-" +
                         now.getTime() + "-" + currentFileNum + 
                         getFileNameExt(fileName).toLowerCase();
                         
    var firstUploadServerFileName = document.getElementById("firstUploadFileName");
    if (firstUploadServerFileName.value.length == 0) {
        firstUploadServerFileName.value = serverFileName;
    }

    var uploadUrl = "/webfilesys/upload/singleBinary/blog/" + serverFileName; 

    xhr = new XMLHttpRequest();  

    xhr.onreadystatechange = handleUploadState;
    xhr.upload.addEventListener("progress", updateProgress, false);
    xhr.upload.addEventListener("load", uploadComplete, false);

    xhr.open("POST", uploadUrl, true);  

	if (!browserMSIE) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');  
	}
         
    if (firefoxDragDrop) {
        try {
            xhr.sendAsBinary(file.getAsBinary());    
        } catch (ex) {
            // Chrome has no file.getAsBinary() function
            xhr.send(file);
        }
    } else {
        xhr.send(file);
    }    
}

function handleUploadState() {
    if (xhr.readyState == 4) {
        var statusWin = document.getElementById("uploadStatus");
        statusWin.style.visibility = 'hidden';

        if (xhr.status == 200) {
			  
            totalLoaded += sizeOfCurrentFile;
			  
            // start uploading the next file
            var file = selectedForUpload.pop();
            if (file) {
		        currentFileNum++;
                var currentFileNumCont = document.getElementById("currentFileNum");
                currentFileNumCont.innerHTML = currentFileNum;  
				  
                new singleFileBinaryUpload(file)
            } else {
                if (firefoxDragDrop || uploadStartedByButton) {
                    document.getElementById("blogForm").submit();
                } else {
                    document.getElementById('lastUploadedFile').innerHTML = lastUploadedFile;
                    document.getElementById('lastUploaded').style.visibility = 'visible';
                    document.getElementById('lastUploaded').style.display = 'block';
                    document.getElementById('doneButton').style.visibility = 'visible';
                }
            }
        } else {
            alert(resourceBundle["upload.error"] + " " + lastUploadedFile);
            var file = selectedForUpload.pop();
            if (file) {
		        currentFileNum++;
                var currentFileNumCont = document.getElementById("currentFileNum");
                currentFileNumCont.innerHTML = currentFileNum;  
                new singleFileBinaryUpload(file)
			}
        }
    }
}

function updateProgress(e) {
    if (e.lengthComputable) {  
        var percent = Math.round((e.loaded * 100) / e.total);  
                
        document.getElementById("statusText").innerHTML = formatDecimalNumber(e.loaded) + " " + resourceBundle["label.of"] + " " + formatDecimalNumber(e.total) + " bytes (" + percent + "%)";

        document.getElementById("done").width = 3 * percent;

        document.getElementById("todo").width = 300 - (3 * percent);
			  
        percent = Math.round(((totalLoaded + e.loaded) * 100) / totalSizeSum);

        document.getElementById("totalStatusText").innerHTML = formatDecimalNumber(totalLoaded + e.loaded) + " " + resourceBundle["label.of"] + " " + formatDecimalNumber(totalSizeSum) + " bytes (" + percent + "%)";

        document.getElementById("totalDone").width = 3 * percent;

        document.getElementById("totalTodo").width = 300 - (3 * percent);
    }  
}
      
function uploadComplete(e) {
    document.getElementById("statusText").innerHTML = "100 %";

    document.getElementById("done").width = 300;

    document.getElementById("todo").width = 0;
}
      
function returnToList() {
    if (confirm(resourceBundle["blog.confirmCancel"])) {
        window.location.href = '/webfilesys/servlet?command=blog&cmd=list';
    }
}

function editBlogEntry(fileName) {
    window.location.href = "/webfilesys/servlet?command=blog&cmd=editEntry&fileName=" + encodeURIComponent(fileName);
}

function jsComments(path) {
    var commentWin = window.open("/webfilesys/servlet?command=listComments&actPath=" + encodeURIComponent(path),"commentWin","status=no,toolbar=no,location=no,menu=no,scrollbars=yes,width=550,height=400,resizable=yes,left=80,top=100,screenX=80,screenY=100");
    commentWin.focus();
}

function deleteBlogEntry(fileName) {

    if (!confirm(resourceBundle["blog.confirmDelete"])) {
        return;
    }

    showHourGlass();
    
    var url = "/webfilesys/servlet?command=blog&cmd=deleteEntry&fileName=" + encodeURIComponent(fileName);
    
    var responseXml = xmlRequestSynchron(url);
   
    var success = null;
   
    if (responseXml) {
        var successItem = responseXml.getElementsByTagName("success")[0];
        if (successItem) {
            success = successItem.firstChild.nodeValue;
        }         
    }

    hideHourGlass();    
    
    if (success == "deleted") {
        window.location.reload();
    } else {
        alert(resourceBundle["blog.deleteError"]);
    }
}

function loadGoogleMapsAPIScriptCode() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=handleGoogleMapsApiReady";
    document.body.appendChild(script);
}
  
function handleGoogleMapsApiReady() {
    // console.log("Google Maps API loaded");
}
  
var posMarker;
  
function selectLocation() {
    var markerPos = posMarker.getPosition();
  
    document.blogForm.latitude.value = markerPos.lat(); 
    document.blogForm.longitude.value = markerPos.lng();
       
    hideMap();
}
  
function showMap(selectLocation) {
    var latitude = document.blogForm.latitude.value;

    var coordinatesNotYetSelected = false;

    if (latitude == '') {
        coordinatesNotYetSelected = true;
            
        if (selectLocation) {
            latitude = '51.1';
        } else {
            alert(resourceBundle["alert.missingLatitude"]);
            return;
        }
    }
  
    var longitude = document.blogForm.longitude.value;

    if (longitude == '') {
        coordinatesNotYetSelected = true;

        if (selectLocation) {
            longitude = '13.76';
        } else {
            alert(resourceBundle["alert.missingLongitude"]);
            return;
        }
    }

    var zoomFactor = parseInt(document.blogForm.zoomFactor[document.blogForm.zoomFactor.selectedIndex].value);
      
    var infoText;

    if (selectLocation) {
        infoText = resourceBundle["label.hintGoogleMapSelect"];
    } else {
        infoText = document.blogForm.infoText.value;
    }        
      
    var mapCenter = new google.maps.LatLng(latitude, longitude);
    
    var myOptions = {
        zoom: zoomFactor,
        center: mapCenter,
        mapTypeId: google.maps.MapTypeId.HYBRID
    }
      
    var map = new google.maps.Map(document.getElementById("map"), myOptions);      
          
    if (selectLocation) {
        document.getElementById("selectButton").style.visibility = 'visible';
    }

    var markerPos = new google.maps.LatLng(latitude, longitude);

    posMarker = new google.maps.Marker({
        position: markerPos,
    });

    posMarker.setMap(map);
        
    if ((selectLocation && coordinatesNotYetSelected) ||
        (!selectLocation && (infoText != ''))) {
        var infowindow = new google.maps.InfoWindow({
            content: '<div style="width:160px;height:40px;overflow-x:auto;overflow-y:auto">' + infoText + '</div>'
        });

        infowindow.open(map, posMarker);
    }    
        
    google.maps.event.addListener(map, 'click', function(event) {
        var clickedPos = event.latLng;
        posMarker.setPosition(clickedPos);
        // map.setCenter(clickedPos);
    });        

    centerBox(document.getElementById("mapFrame"));

    document.getElementById("mapFrame").style.visibility = 'visible';
}  

function hideMap() {
    document.getElementById("selectButton").style.visibility = 'hidden';
    document.getElementById("mapFrame").style.visibility = 'hidden';
}

function toggleGeoData(checkbox) {

    var geoDataCont = document.getElementById("blogGeoTagCont");

    if (checkbox.checked) {
        geoDataCont.style.display = "block";
    } else {
        geoDataCont.style.display = "none";
    }
}

function publishBlog() {
    publishCont = document.getElementById("publishCont");
        
    if (!publishCont) {
        alert('publishCont is not defined');
        return;
    }
        
    var windowWidth = getWinWidth();
    var windowHeight = getWinHeight();
    
    if (browserMSIE) 
    {
        yScrolled = (document.documentElement.scrollTop || document.body.scrollTop);
        xScrolled =(document.documentElement.scrollLeft || document.body.scrollLeft);
    }
    else
    {
        yScrolled = window.pageYOffset;
        xScrolled = window.pageXOffset;
        
        if (yScrolled > 0)
        {
            // scrollbar exists 
            windowWidth = windowWidth - 20;
        }
    }
        
    var boxWidth = 400;
        
    if (boxWidth > windowWidth - 10) {
        boxWidth = windowWidth - 10;
    }

    publishCont.style.width = boxWidth + 'px';

    var boxHeight = 250;

    /*
    if (boxHeight > windowHeight - 60) {
        boxHeight = windowHeight - 60;
    }
    */

    publishCont.style.height = boxHeight + 'px';
        
    publishContWidth = publishCont.offsetWidth;
    
    xoffset = (windowWidth - publishContWidth) / 2;
    
    if (xoffset < 2)
    {
        xoffset = 2;
    }
        
    publishContXpos = xoffset + xScrolled;

    publishCont.style.left = publishContXpos + 'px';

    publishContYpos = (windowHeight - boxHeight) / 2 + yScrolled;
    if (publishContYpos < 10)
    {
        publishContYpos = 10;
    }

    publishCont.style.top = publishContYpos + 'px';
        
    var xmlUrl = "/webfilesys/servlet?command=blog&cmd=publishForm";
        
    var xslUrl = "/webfilesys/xsl/blog/publishBlog.xsl";    
        
    publishCont.innerHTML = browserXslt(xmlUrl, xslUrl);
    
    setBundleResources();

    publishCont.style.visibility = "visible";
}

function hidePublishForm() {
    publishCont = document.getElementById("publishCont");
        
    if (!publishCont) {
        alert('publishCont is not defined');
        return;
    }

    publishCont.style.visibility = "hidden";
}

function validatePublishFormAndSubmit() {
    var daysPerPage = parseInt(document.getElementById("daysPerPage").value);

    if (isNaN(daysPerPage) || (daysPerPage < 1) || (daysPerPage > 32)) {
        alert(resourceBundle["blog.invalidDaysPerPageValue"]);
        document.getElementById("daysPerPage").focus();
        return;
    }
    
    var expirationDays = parseInt(document.getElementById("expirationDays").value);

    if (isNaN(expirationDays) || (expirationDays < 1) || (expirationDays > 10000)) {
        alert(resourceBundle["blog.invalidExpirationDays"]);
        document.getElementById("expirationDays").focus();
        return;
    }
    
    if (document.getElementById("language").value.length == 0) {
        alert(resourceBundle["error.missingLanguage"]);
        document.getElementById("language").focus();
        return;
    }
    
	var formData = getFormData(document.getElementById("publishForm"));
	
	xmlRequestPost("/webfilesys/servlet", formData, showPublishResult);	
}

function showPublishResult() {
    if (req.readyState == 4) {
        if (req.status == 200) {
            var resultElem = req.responseXML.getElementsByTagName("result")[0];            
            var success = resultElem.getElementsByTagName("success")[0].firstChild.nodeValue;

            if (success == 'true') {
                publicUrl = resultElem.getElementsByTagName("publicUrl")[0].firstChild.nodeValue;            

                document.getElementById("publishTable").innerHTML = "";

                var tableRow = document.createElement("tr");
                document.getElementById("publishTable").appendChild(tableRow);

                var tableCell = document.createElement("td");
                tableCell.setAttribute("class", "formParm1");
                tableCell.innerHTML = resourceBundle["label.accesscode"];
                tableRow.appendChild(tableCell);

                tableRow = document.createElement("tr");
                document.getElementById("publishTable").appendChild(tableRow);

                tableCell = document.createElement("td");
                tableCell.setAttribute("class", "formParm2");
                tableCell.innerHTML = publicUrl;
                tableRow.appendChild(tableCell);

                tableRow = document.createElement("tr");
                document.getElementById("publishTable").appendChild(tableRow);

                tableCell = document.createElement("td");
                tableCell.style.paddingTop = "20px";
                tableCell.style.textAlign = "center";
                tableRow.appendChild(tableCell);

                var closeButton = document.createElement("input");
                closeButton.setAttribute("type", "button");
                closeButton.setAttribute("value", resourceBundle["button.closewin"]);
                closeButton.setAttribute("onclick", "hidePublishForm()");
                tableCell.appendChild(closeButton);
                
                document.getElementById("publishBlogButton").style.display = "none";                    
                document.getElementById("unpublishButton").style.display = "inline";
                document.getElementById("publicURLButton").style.display = "inline";
            }
        }
    }
}

function queryPublicLink() {
    var url = "/webfilesys/servlet?command=blog&cmd=getPublicURL";
    
    xmlRequest(url, handleQueryPublicLinkResult);
}

function handleQueryPublicLinkResult() {
    if (req.readyState == 4) {
        if (req.status == 200) {
            var resultElem = req.responseXML.getElementsByTagName("result")[0];            
            var success = resultElem.getElementsByTagName("success")[0].firstChild.nodeValue;

            if (success == 'true') {
                publicUrl = resultElem.getElementsByTagName("publicUrl")[0].firstChild.nodeValue;   
                document.getElementById("publicURLButton").style.display = "inline";
                document.getElementById("unpublishButton").style.display = "inline";
            } else {
                if (document.getElementById("publishBlogButton")) {
                    document.getElementById("publishBlogButton").style.display = "inline";
                }
            }
        }
    }
}

function showPublicURL() {

    var publishCont = document.getElementById("publishCont");
        
    if (!publishCont) {
        alert('publishCont is not defined');
        return;
    }
    
    publishBlog();
    
    publishCont.style.visibility = "hidden";

    document.getElementById("publishTable").innerHTML = "";

    var tableRow = document.createElement("tr");
    document.getElementById("publishTable").appendChild(tableRow);

    var tableCell = document.createElement("td");
    tableCell.setAttribute("class", "formParm1");
    tableCell.innerHTML = resourceBundle["label.accesscode"];
    tableRow.appendChild(tableCell);

    tableRow = document.createElement("tr");
    document.getElementById("publishTable").appendChild(tableRow);

    tableCell = document.createElement("td");
    tableCell.setAttribute("class", "formParm2");
    tableCell.innerHTML = publicUrl;
    tableRow.appendChild(tableCell);

    tableRow = document.createElement("tr");
    document.getElementById("publishTable").appendChild(tableRow);

    tableCell = document.createElement("td");
    tableCell.style.paddingTop = "20px";
    tableCell.style.textAlign = "center";
    tableRow.appendChild(tableCell);

    var closeButton = document.createElement("input");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("value", resourceBundle["button.closewin"]);
    closeButton.setAttribute("onclick", "hidePublishForm()");
    tableCell.appendChild(closeButton);
    
    publishCont.style.visibility = "visible";
}

function unpublish() {
    if (!confirm(resourceBundle["blog.confirmUnpublish"])) {
        return;
    }
    
    var url = "/webfilesys/servlet?command=blog&cmd=unpublish";

    xmlRequest(url, handleUnpublishResult);
}

function handleUnpublishResult() {
    if (req.readyState == 4) {
        if (req.status == 200) {
            var resultElem = req.responseXML.getElementsByTagName("result")[0];            
            var success = resultElem.getElementsByTagName("success")[0].firstChild.nodeValue;

            if (success == 'true') {
                document.getElementById("unpublishButton").style.display = "none";
                document.getElementById("publicURLButton").style.display = "none";
                document.getElementById("publishBlogButton").style.display = "inline";
                publicUrl = null;
            } 
        }
    }
}
