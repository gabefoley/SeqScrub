var invalidChars
addUnderscores = true;
summary = "";


//Program a custom submit function for the form
$("form#data").submit(function(event) {

  //Disable the default form submission
  event.preventDefault();

  //Grab all form data  
  var formData = new FormData($(this)[0]);
  invalidChars = $("#invalidChars").val().split(" ");

  //Change the filename for the file to save to mirror the uploaded filename
  var filepath = $('#file').val();
  var filename = filepath.split(/(\\|\/)/g).pop();
  $("#fileToSave").val(filename.split(".").join("_cleaned."))

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

      // For each sequence in the file
      for (var i = 0; i < jsonData.length; i++) {

        var id = jsonData[i].id.toString();

        var record = {
          id: jsonData[i].id,
          type: jsonData[i].type,
          species: "",
          seq: jsonData[i].seq,
          obsolete: "",
          originalHeader: jsonData[i].originalHeader
        };


        if (record.type == 'tr' || record.type == 'sp') {
          uniprotList.push(record)

        } else if (record.type == 'gi' || record.type == 'XP') {
          ncbiList.push(record);
        }
      }

      if (uniprotList.length > 0) {
        getDataFromUniprot(uniprotList)


      }


      if (ncbiList.length > 0) {
        getDataFromNCBI(ncbiList);
      }


    }

  });



});

/**
 * [getSpeciesFromExternal description]
 * @param  {[type]} record [description]
 * @return {[type]}        [description]
 */
function getDataFromUniprot(records) {

  idString = "";

  for (var i = 0, size = records.length; i < size; i++) {

    idString += "id:" + records[i].id + "+OR+";
  }

  idString = idString.substring(0, idString.length - 4);

  url = "http://www.uniprot.org/uniprot/?query=" + idString + "&format=xml"

  console.log(url)

  var promise = $.ajax({
    url: url,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      // if (!$.trim(speciesData)) {
      //   var string = record.originalHeader + record.seq + "&#010;&#010;";
      //   $("#badIds").append(string.trim());
      // }
      // console.log(speciesData);
      getSpeciesNameFromUniProt(records, speciesData, idString);

    },

    // If we couldn't map the sequence to a species
    // error: function() {
    //   var string = record.originalHeader + record.seq + "&#010;&#010;";
    //   $("#badIds").append(string.trim());

    // }
  });

  // promise.done(function(speciesData) {


  // });
}


function getDataFromNCBI(records) {

  idString = "";

  for (var i = 0, size = records.length; i < size; i++) {


    idString += records[i].id + ",";
  }

  idString = idString.substring(0, idString.length - 1);

  urlDoc = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=docsum"

  console.log("next one")
  console.log(urlDoc)
  var promise = $.ajax({
    url: urlDoc,
    type: 'POST',
    async: true,
    success: function(speciesData) {

      // console.log("Data from NCBI", speciesData);
      getIDFromNCBI(records, speciesData)
    },

    // error: function() {

    //   var string = record.originalHeader + record.seq + "&#010;&#010;";
    //   $("#badIds").append(string.trim());

    // }

  });

  promise.done(function(speciesData) {});
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
          // console.log(thisNode.textContent, records[record].id)
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

  urlAll = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + idString + "&retmode=xml&rettype=all"


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

          path = "//Textseq-id_accession[contains(., '"+ accession + "')]/ancestor::Seq-entry//Org-ref_taxname/text()";
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

  })


}


function getSpeciesNameFromUniProt(records, speciesData) {

  // console.log('got here')
  // console.log(records)

  fullList = [];

  if (speciesData != null) {
    xmlDoc = speciesData;

    // path = "//*[@type='scientific']/text()";

    for (record in records) {
      path = "/*/*/*[name()='accession'][contains(., '" + records[record].id + "')]/following-sibling::*[name()='organism']/*[@type='scientific']"

      //  console.log(path);
      var node = xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);
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
  idString = "";

    for (var i = 0, size = records.length; i < size; i++) {

    idString += "id:" + records[i].id + "+OR+";
  }

  idString = idString.substring(0, idString.length - 4);


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

  //Boolean value to hold if the current sequence has illegal characters
  containsBad = false;

  // Check to see if there are any illegal characters

  for (i in records) {

    for (j in records[i].seq) {
      if (invalidChars.includes(records[i].seq[j])) {
        containsBad = true;
        // console.log(records[i])
      }
    }

    if ((records[i].species == null | records[i].species == "") && !(obsoleteList.includes(records[i].id))) {
      console.log("Bad seqeunce is", records[i].id)

      var string = records[i].originalHeader + records[i].seq + "&#010;&#010;";
      $("#badIds").append(string.trim());
    } else if (obsoleteList.includes(records[i].id)) {

      var string = records[i].originalHeader + records[i].seq + "&#010;&#010;";
      $("#obsoleteSeqs").append(string.trim());
    } else {

      formattedType = records[i].type;
      if (formattedType == "XP"){
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


        var string = records[i].originalHeader + records[i].seq + "&#010;&#010;";
        if (addUnderscores) {
          string = string.replace(/ /g, "_")
        }
        $("#badCharacters").append(string.trim());

      } else {

        dataString = "id=" + records[i].id + "&speciesName=" + records[i].species + "&seq=" + records[i].seq
        $.ajax({
          url: 'addSpeciesToLocal.php',
          type: 'POST',
          data: dataString,
          success: function() {}

        });

        var string = ">" + formattedType + records[i].id + "|" + records[i].species + "&#010;" + records[i].seq + "&#010;&#010;";
        if (addUnderscores) {
          string = string.replace(/ /g, "_")
        }

        $("#cleanedSeqs").append(string.trim());


        summarySpecies = records[i].species
        
        if (addUnderscores) {
          summarySpecies = summarySpecies.replace(/ /g, "_")
        }

        summary += ">" + formattedType + records[i].id + "|" + summarySpecies + " FROM: " + records[i].originalHeader + "\n";

      }



      containsBad = false;
    }
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
  element.setAttribute('download', $("#fileToSave").val());

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