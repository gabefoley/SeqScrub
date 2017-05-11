var invalidChars
var count = 0
var baddegg = 0
summary = "";
ids_with_underscores = ["XP", "XM", "XR", "WP", "NP", "NC", "NG", "NM", "NR"]

// $( document ).ajaxSend(function() {
//   $( ".loader" ).show();
// });

// $(document).ajaxComplete(function () {
//      $( ".loader" ).hide();
//  });

// $('div.container').block({
//     message: '<h1>Premium Users only</h1>',
// });

$(document).on({
    ajaxStart: function() { $( ".loader" ).show();    },
     // ajaxStop: function() { $( ".loader" ).hide(); }    
});

function checkFinal(count){
  if (count == numRecords){
    $( ".loader" ).hide();
  }
}


document.getElementById('file').onchange = function () {

  filename = this.value.replace(/.*[\/\\]/, '');
  $("#fileToSave").val(filename)
};

//Program a custom submit function for the form
$("form#data").submit(function(event) {



  // Clear all the output sections
  summary = "";
  count = 0
  $("#cleanedSeqs").empty();
  $("#badCharacters").empty();
  $("#obsoleteSeqs").empty();
  $("#badIds").empty();

  addUnderscores = $('#addUnderscore').is(":checked");
  commonName = $('#commonName').is(":checked")


  //Disable the default form submission
  event.preventDefault();

  //Grab all form data  
  var formData = new FormData($(this)[0]);
  invalidChars = $("#invalidChars").val().split(" ");

  //Change the filename for the file to save to mirror the uploaded filename
  var filepath = $('#file').val();
  var filename = filepath.split(/(\\|\/)/g).pop();
  var ncbiList = [];
  var uniprotList = [];
  uniprotDict = {};
  ncbiDict = {};


  $.ajax({
    url: 'upload.php',
    type: 'POST',
    data: formData,
    async: true,
    cache: false,
    contentType: false,
    processData: false,
    success: function(returndata) {

      console.log(returndata)

      jsonData = JSON.parse(returndata);
      numRecords = jsonData.length;

      // For each sequence in the file
      for (var i = 0; i < jsonData.length; i++) {

        var id = jsonData[i].id.toString();

        var record = {
          id: jsonData[i].id,
          type: jsonData[i].type,
          species: "",
          seq: jsonData[i].seq,
          obsolete: "",
          ncbiChecked: false,
          originalHeader: jsonData[i].originalHeader
        };


        if (record.type == 'tr' || record.type == 'sp' || record.type == 'pdb' || record.type == '') {
          uniprotList.push(record)

        } else {
          record.ncbiChecked = true;
          ncbiList.push(record);
        }
      }

      if (uniprotList.length > 0) {
        console.log("Uniprot length = ", uniprotList.length)
        while (uniprotList.length){
          getDataFromUniprot(uniprotList.splice(0,500))

        }
      }
      if (ncbiList.length > 0) {
        console.log("NCBI length = ", ncbiList.length)
        while (ncbiList.length){
          // console.log("first time round", ncbiList.splice(0,300))
        getDataFromNCBI(ncbiList.splice(0,500));
      }
      }
    }

  });



})


function getIDString(records, database){
  
  idString = "";

  for (var i = 0, size = records.length; i < size; i++) {
    idString += records[i].id + (database == 'UniProt' ? "+OR+id:" : "," );
  }

  idString = idString.substring(0, idString.length - (database == 'UniProt' ? 7 : 1));
  return idString
}


/**
 * [getSpeciesFromExternal description]
 * @param  {[type]} record [description]
 * @return {[type]}        [description]
 */
function getDataFromUniprot(records) {
  console.log ("%%%%% UNIPROT LENGTH %%%%%", records.length)
  idString = getIDString(records, "UniProt")

  // url = "http://www.uniprot.org/uniprot/?query=" + idString + "&format=xml"
  url = "http://www.uniprot.org/uniprot/?query=id:" + idString +"&format=tab&columns=id,entry%20name,protein%20names,organism,organism%20id,reviewed"

  console.log(url)

  var promise = $.ajax({
    url: url,
    type: 'POST',
    async: true,

    success: function(speciesData) {

      getSpeciesNameFromUniProt2(records, speciesData, idString);

    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        response = XMLHttpRequest.responseText
        alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable")

        obsoleteList = []
        appendOutput(records, obsoleteList)
      
      }

      else {
        alert("There was a fatal error \n" + records.length + " sequences are being written to unmappable" );
        obsoleteList = []
        appendOutput(records, obsoleteList)

        if (count != numRecords) {
          alert("Please note: Currently not all sequences have been written to an output field")
        }
        else {
          alert ("Please note: Despite the error, all sequences have still been written to an output field")
        }

        // $( ".loader" ).hide();
        // return


      }






    }   
  });
}


function getDataFromNCBI(records) {

  console.log ("%%%%% NCBI LENGTH %%%%%", records.length)


  idString = getIDString(records, "NCBI")


  urlDoc = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=docsum"
  console.log(urlDoc)

  var promise = $.ajax({
    url: urlDoc,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      // console.log("Data from NCBI", speciesData);
      getIDFromNCBI(records, speciesData)
    },
    // error: function (XMLHttpRequest, textStatus, errorThrown) {
    //   obsoleteList = []

    //   // for (record in records){
    //   //   obsoleteList.push(records[record].id)

    //   // }

    //   appendOutput(records, obsoleteList)
      

    // }

    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        // response = XMLHttpRequest.responseText
        // alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable")

        obsoleteList = []
        appendOutput(records, obsoleteList)
      
      }

      else {
        alert("There was a fatal error \n" + records.length + " sequences are being written to unmappable" );
        obsoleteList = []
        appendOutput(records, obsoleteList)

        if (count != numRecords) {
          alert("Please note: Currently not all sequences have been written to an output field")
        }
        else {
          alert ("Please note: Despite the errors, all sequences have still been written to an output field")
        }

        // $( ".loader" ).hide();
        // return


      }






    }   

    // error: function() {

    //   var string = record.originalHeader + record.seq + "&#010;&#010;";
    //   $("#badIds").append(string.trim());

    // }

  });


  // promise.done(function(speciesData) {});
}



function getIDFromNCBI(records, speciesData) {

  fullList = [];
  obsoleteList = [];
  // console.log(records)
  // console.log("And then the change")

  if (speciesData != null) {


    for (record in records) {
      path = "*/DocSum/Id[contains(., '" + records[record].id + "')]/following-sibling::Item[@Name='AccessionVersion']/text()"

      // console.log(path)

      var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);
      // console.log(node)


      try {
        var thisNode = node.iterateNext();

        while (thisNode) {
          records[record].id = thisNode.textContent
          records[record].type = '';
          console.log(thisNode.textContent, records[record].id)
          thisNode = node.iterateNext();
        }
      } catch (e) {
        console.log('Error: Document tree modified during iteration ' + e);
      }

    }

    console.log('done')

    obsoleteCheck = "//DocSum[Item[contains(., 'removed')]]//Item[@Name='AccessionVersion']/text()";


    // path = "//Item[@Name='AccessionVersion']/text()"




    // try {
    //   var thisNode = node.iterateNext();

    //   while (thisNode) {
    //     fullList.push(thisNode.textContent);
    //     thisNode = node.iterateNext();
    //   }
    // } catch (e) {
    //   console.log('Error: Document tree modified during iteration ' + e);
    // }


    // recordLen = Object.keys(records).length

    // console.log(fullList.length)
    // console.log(records.length)


    // for (var i = 0, size = records.length - 1; i <= size; i++) {
    //   records[i].id = fullList[i]
    //   records[i].type = ''; // Remove the previous identifier

    // }

    var node = speciesData.evaluate(obsoleteCheck, speciesData, null, XPathResult.ANY_TYPE, null);

    try {
      var thisNode = node.iterateNext();

      while (thisNode) {
        obsoleteList.push(thisNode.textContent);
        thisNode = node.iterateNext();
      }
    } catch (e) {
      console.log('Error: Document tree modified during iteration ' + e);
    }
    getSpeciesNameFromNCBI(records, idString, obsoleteList)



  }
}

function getSpeciesNameFromNCBI(records, idString, obsoleteList) {
  speciesList = [];

  idString = getIDString(records, "NCBI")

  // urlAll = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=all"
  urlAll = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=fasta"


  console.log(urlAll)
  console.log("^^^^")
  var promise = $.ajax({
    url: urlAll,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      // console.log("Data from NCBI", speciesData);
      if (speciesData != null) {


        for (record in records){
          accession = split(records[record].id, ".")
          // console.log(accession)

          path = "/TSeqSet/TSeq/TSeq_accver[contains(., '" + accession + "')]/../TSeq_orgname/text()"

          // path = "//Textseq-id_accession[contains(., '"+ accession + "')]/ancestor::Seq-entry//Org-ref_taxname/text()";
          // console.log(path)
          var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);

          // console.log(node)

        try {
          var thisNode = node.iterateNext();

          while (thisNode) {

            // console.log(accession, " AND NOW WITH ", thisNode.textContent )

            records[record].species = thisNode.textContent
            thisNode = node.iterateNext();

          }
        } catch (e) {
          console.log('Error: Document tree modified during iteration ' + e);
        }

        // console.log("Finished iteration")

        }

      }

      appendOutput(records, obsoleteList)

    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      if (errorThrown == "Bad Request"){
        // response = XMLHttpRequest.responseText
        // alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable")

        obsoleteList = []
        appendOutput(records, obsoleteList)
      
      }

      else {
        alert("There was a fatal error \n" + records.length + " sequences are being written to unmappable and the program is exiting prematurely" );
        obsoleteList = []
        appendOutput(records, obsoleteList)
        if (count != numRecords) {
          alert("Please note: Not all sequences were written to an output field")
        }
        else {
          alert ("Please note: Despite the errors, all sequences have still been written to an output field")
        }
        $( ".loader" ).hide();

      }




    }   


  })


}



function getSpeciesNameFromUniProt2(records, speciesData, idString) {
  console.log('got here')
  console.log(records)
  obsoleteList = [];
  speciesDict = {}

  if (speciesData != null) {

    splitData = speciesData.split("\n")


    for (line in splitData) {
      if (splitData[line] != null){
      // console.log(splitData[line])
      splitLine = splitData[line].split("\t")
      if (splitLine[2] != null){
      if (splitLine[2].includes("Deleted") || (splitLine[2].includes("Merged"))) {
        console.log("add to obsolete", splitLine[0])
        obsoleteList.push(splitLine[0])
      }

      else {
        endIndex = splitLine[3].indexOf(" (")

          speciesDict[splitLine[0]] = splitLine[3].substr(0, endIndex == -1 ? splitLine[3].length : endIndex)
        }
        
      }
    }
  }
  }

    for (record in records){
      console.log(records[record] )
      if (records[record].id in speciesDict){
        records[record].species = speciesDict[records[record].id]
      }
  }

  appendOutput(records, obsoleteList)
}



function getSpeciesNameFromUniProt(records, speciesData) {
  fullList = [];

  if (speciesData != null) {
    // xmlDoc = speciesData;

    // path = "//*[@type='scientific']/text()";

    for (record in records) {
      path = "";

      if (records[record].type == "pdb") {
        path = "//*[name()='dbReference'][@id='" + records[record].id + "']/preceding-sibling::*[name()='organism']/*[@type='scientific']"
      }

      else {
              path = "/*/*/*[name()='accession'][contains(., '" + records[record].id + "')]/following-sibling::*[name()='organism']/*[@type='scientific']"

      }

       // console.log(path);
       // console.log("DATA: ", speciesData)
      var node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);
      // node.iterateNext();
      // console.log( records[record].id, " and ", node.textContent)

      try {
        var thisNode = node.iterateNext();

        while (thisNode) {

          records[record].species = thisNode.textContent;


          // fullList.push(thisNode.textContent);
          thisNode = node.iterateNext();
          // console.log(fullList)
        }
      } catch (e) {
        console.log('Error: Document tree modified during iteration ' + e);
      }


    }
    // path = "//*[name()='accession'][1]/text() | //*[@type='scientific']/text()"


    // try {
    //   var thisNode = node.iterateNext();

    //   while (thisNode) {
    //     fullList.push(thisNode.textContent);
    //     thisNode = node.iterateNext();
    //   }
    // } catch (e) {
    //   console.log('Error: Document tree modified during iteration ' + e);
    // }

    // Make a dictionary of the id -> species

    // console.log(fullList)

    // speciesDict = {}

    // for (var i = 0, size = (fullList.length / 2) - 1; i <= size; i++) {
    //   speciesDict[fullList[i]] = fullList[i + fullList.length / 2]

    // }
    // console.log(records.length)

    // console.log(fullList.length)

    // console.log(records)
    // console.log(fullList)

    // console.log(speciesDict)



    // for (record in records) {
    // // records[record].species = fullList[records]

    // if (records[record].id in speciesDict){

    //   records[record].species = speciesDict[records[record].id]

    // }

    // else {

    //   path = "//*[name()='accession']/text() | //*[@type='scientific']/text()"



    // }

    //   if (!speciesDict[records[record].id]){
    //     console.log("*******")
    //     console.log(records[record].id)
    //   }
    // }

    // console.log(records)


  }

      // console.log("Sending to obsolete")
    checkUniProtObsolete(records)




}

function checkUniProtObsolete(records, idString) {

  obsoleteList = [];
  // idString = "";

  //   for (var i = 0, size = records.length; i < size; i++) {

  //   idString += "id:" + records[i].id + "+OR+";
  // }

  // idString = idString.substring(0, idString.length - 4);

  idString = getIDString(records, "UniProt")



  // console.log(idString);




  urlDoc = "http://www.uniprot.org/uniprot/?query=" + idString + "&format=tab&columns=protein%20names,id";

  // console.log('Obsolete Uniprot entries')

  // console.log(urlDoc)



  var promise = $.ajax({
    url: urlDoc,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      if (speciesData != null) {

        splitData = speciesData.split("\n")


        for (line in splitData) {
          // console.log(splitData[line])
          splitLine = splitData[line].split("\t")
          // console.log(splitLine)
          if (splitLine[0] == "Deleted.") {
            obsoleteList.push(splitLine[1])

          }
        }

      }

      appendOutput(records, obsoleteList)

    },

  })



}



function appendOutput(records, obsoleteList) {

  console.log("ONSOLETE LIST", obsoleteList)

  //Boolean value to hold if the current sequence has illegal characters
  containsBad = false;

  ncbiCheck = []

  // Check to see if there are any illegal characters

  for (i in records) {
  containsBad = false;


    for (j in records[i].seq) {
      if (invalidChars.includes(records[i].seq[j])) {
        containsBad = true;
        console.log("BAD EGG ", records[i].id)
        console.log(records[i].seq[j])
      }
    }

    if (containsBad){
      baddegg += 1
      console.log("bad egg is ", baddegg)


    }

    if ((records[i].species == null || records[i].species == "") && !(obsoleteList.includes(records[i].id))) {
      console.log("Bad sequence is", records[i].id)
      // console.log(records[i])
      if (records[i].ncbiChecked == true) {
        var string = records[i].originalHeader + records[i].seq + "&#010;";
        $("#badIds").append(string.trim());
        count +=1
        console.log("Count is now ", count )
        checkFinal(count)

      }

      else {
        records[i].ncbiChecked = true
        ncbiCheck.push(records[i])



      }

    } else if (obsoleteList.includes(records[i].id)) {

      var string = records[i].originalHeader + records[i].seq + "&#010;";
      $("#obsoleteSeqs").append(string.trim());
      count +=1
      console.log("Count is now ", count )
      checkFinal(count)


    } else {

      formattedType = records[i].type;
      if (ids_with_underscores.indexOf(formattedType) >= 0){
        formattedType = "";
      }
      else if (records[i].type.length > 0) {

        formattedType += "|";

      }


      // // If there are illegal characters highlight them within the text
      if (containsBad) {
      //   for (i in invalidChars) {
      //     console.log(i)

      //   }


        var string = records[i].originalHeader + records[i].seq + "&#010;";
        // if (addUnderscores) {
        //   string = string.replace(/ /g, "_")
        // }
        $("#badCharacters").append(string.trim());
        count +=1
        console.log("Count is now ", count )
        checkFinal(count)

      // }

      } else {

      //   dataString = "id=" + records[i].id + "&speciesName=" + records[i].species + "&seq=" + records[i].seq
      //   $.ajax({
      //     url: 'addSpeciesToLocal.php',
      //     type: 'POST',
      //     data: dataString,
      //     success: function() {}

      //   });

        var string = ">" + formattedType + records[i].id + "|" + records[i].species + "&#010;" + records[i].seq + "&#010;";
        // var string = ">" + formattedType + records[i].id + "|" + records[i].species + "&#010;&#010;" + records[i].seq + "&#010;";

        if (addUnderscores) {
          string = string.replace(/ /g, "_")
        }

        $("#cleanedSeqs").append(string.trim());
        count += 1
        console.log("Count is now ", count )
        checkFinal(count)




        summarySpecies = records[i].species
        
        if (addUnderscores) {
          summarySpecies = summarySpecies.replace(/ /g, "_")
        }

        summary += ">" + formattedType + records[i].id + "|" + summarySpecies + " FROM: " + records[i].originalHeader + "\n";

      // }



    }
  }


}
containsBad = false;



if (ncbiCheck.length > 0){  
  console.log("running ncbi check with ", ncbiCheck)
  getDataFromNCBI(ncbiCheck);
}
}

function getSpeciesFromLocal(record) {
  // console.log("Got to speciesFromLocal with ", record);
  var dataString = 'id=' + record.trimmedHeader;
  $.ajax({
    url: 'getSpeciesFromLocal.php',
    type: 'POST',
    data: dataString,
    success: function(returnData) {
      // console.log("Return data from getSpeciesFromLocal" + returnData);


      speciesData = JSON.parse(returnData);

      // If we already have an entry with the same sequence then use this entry
      if (speciesData.length > 0) {
        data = speciesData[0];


        var string = ">" + data['ID'] + data['speciesName'] + "&#010;" + record.seq + "&#010;&#010;";
        $("#cleanedSeqs").append(string.trim());
      } else {
        getSpeciesFromExternal(record)
      }
    }
  })

}

function downloadFile(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function downloadSummary(filename) {
  if (summary != null){
    download(summary, filename.split('_')[0] + "_summary.txt", "text/plain");
  }

}

function split(str, char) {
 var i = str.indexOf(char);

 if(i > 0)
  return  str.slice(0, i);
 else
  return str;     
}

function Abort()
{
   throw new Error('This is not an error. This is just to abort javascript');
}

// Allow for easy selection of full text in each window

$("#cleanedSeqs").click(function() {
  $("#cleanedSeqs").select();
});

$("#badCharacters").click(function() {
  $("#badCharacters").select();
});

$("#obsoleteSeqs").click(function() {
  $("#obsoleteSeqs").select();
});

$("#badIds").click(function() {
  $("#badIds").select();
});