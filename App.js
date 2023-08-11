import { 
  StatusBar 
} from 'expo-status-bar';

import { 
  Image 
} from 'expo-image';

import React, {
  Component, 
  useState,
  useRef,
  createRef,
  useEffect,
} from 'react';

import MapView from 'react-native-map-clustering';

import {
  PROVIDER_GOOGLE, 
  Marker
} from 'react-native-maps';

import { 
  StyleSheet,
  Text, 
  View, 
  Button, 
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';

import { BottomPopup } from './BottomPopup';
import { HistoryPanel } from './HistoryPanel';
import { RealtimePanel } from './RealtimePanel';
import { CreditsPanel } from './CreditsPanel';

//Whether or not we are starting up, switches off on first data refresh.
var startupFlag = 1;

//The default markers to render when no data exists.
const DEFAULT_MARKERS = [];

const MARKER_ANCHOR = {x: 0.5,y: 0.5};

const deviceWidth = Dimensions.get("window").width

const QUERY_TIMEOUT = 30000;

const CURRENT_BUILD = "v1.0.0";

var historyPanelRef;
var realtimePanelRef;
var creditsPanelRef;
var popupRef;

/**
 * This function acts as the Update() of the app, executing on runtime.
 * @returns The "viewport of the screen" to display
 */
function App() {
  popupRef = React.createRef();
  historyPanelRef = React.createRef();
  realtimePanelRef = React.createRef();
  creditsPanelRef = React.createRef();

  const [markerData, setMarkerData] = useState(DEFAULT_MARKERS);

  //Define Failure Function
  const fetchFailureAlert = () =>{
    Alert.alert(
      "Connection Failed", 
      "Unable to connect to server.\nPlease check your internet connection or try again later.", 
      [{text: 'Close'}], 
      {cancelable: true});
  }

  const parseFailureAlert = () =>{
    Alert.alert(
      "Data Error", 
      "There was an unexpected problem.\nPlease try again later.", 
      [{text: 'Close'}], 
      {cancelable: true}
    );
  }

  const dataClickHandler = async () => {
    //Show Pop Up
    popupRef.show()

    currentStatusString = "Establishing Connection to Server...";
    popupRef.updateRefreshState(currentStatusString.toString());

    var cpmArray = [];
    var locationArray = [];

    dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getAllCPMActive.asp";  

    try{
      const response2 = await fetchWithTimeout(dataStringQuery, {timeout: QUERY_TIMEOUT});
      const text = await response2.text();

      if(text != null){
        var newDataArray = deserializeCPMs(text);
  
        cpmArray = newDataArray;
        
        console.log("Retrieved Marker CPMs.");

      }else{
        parseFailureAlert();
        popupRef.close();
        return;
      }
    }
    catch(error){
      fetchFailureAlert();
      popupRef.close();
      return;
    }

    currentStatusString = "Retrieving and Loading Marker Data...";
    popupRef.updateRefreshState(currentStatusString.toString());

    dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getAllDeviceLocations.asp";

    try{
      const response3 = await fetchWithTimeout(dataStringQuery, {timeout: QUERY_TIMEOUT});
      const text3 = await response3.text();

      if(text3 != null){
        currentStatusString = "Data Retrieval Complete. Updating Markers...";
        popupRef.updateRefreshState(currentStatusString.toString());

        var newDataArray = deserializeLocations(text3);
        //Add the new Array onto the current marker one.
      
        locationArray = newDataArray;
      
        console.log("Retrieved Marker Locations.");

      }else{
        parseFailureAlert();
        popupRef.close();
        return;
      }
    }
    catch(error){
      fetchFailureAlert();
      popupRef.close();
      return;
    }

    const mergeById = (array1, array2) =>
    array1.map(itm => ({
      ...array2.find((item) => (item.geigerID === itm.geigerID) && item),
      ...itm
    }));

    //Merge Arrays
    let finalArray = mergeById(cpmArray, locationArray);

    //Clean up arrays
    for(let index = 0; index < finalArray.length; index++){
      let varArray = finalArray[index];
      let count = Object.keys(varArray).length;

      if(count < 8){
        finalArray.splice(index, 1);
        index--;
      }
    }

    popupRef.close();

    //Update Marker Data
    setMarkerData(finalArray);
  }

  const onClosePopup = () =>{
    popupRef.close();
  }

  const onCloseHistory = () =>{
    historyPanelRef.close();
  }

  const refreshOnClick = () =>{
    Alert.alert(
      "Refresh Marker Data?", 
      "(This may take a while...)", 
      [{text: 'Refresh', onPress: () => (dataClickHandler())}, {text: 'Cancel'}], 
      {cancelable: true});
  }

  const aboutOnClick = () =>{
    creditsPanelRef.show();
  }

  const waitForElement = () =>{
    if(popupRef.current !== null){
      dataClickHandler();
    }
    else{
      setTimeout(waitForElement, 250);
    }
  }

  //First Frame Run Refresh
  if(startupFlag == 1){
    startupFlag = 0;

    waitForElement();
  }

  return (
    <View style = {styles.body}>
      {/* Top Container */}
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={refreshOnClick} style ={styles.refreshButton}>
          <Image source={require('./resources/refresh-icon2.png')} style = {styles.refreshIcon}/>
        </TouchableOpacity>

        <Text style={styles.headerText}>GMCMap</Text>
        <Text style={styles.buildText}>{CURRENT_BUILD}</Text>
      </View>


      {/* Center Map Container */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} clusterColor='#3383f2' extent = {256} minPoints={10} maxZoom={15} radius={deviceWidth * 0.08}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0,
            longitudeDelta: 0.0,
          }}
          provider={PROVIDER_GOOGLE}
          // onMapReady={() => setTimeout(() => setMapReady(true), 100)}
          >
          

          {/* Child Markers */}
          {markersFromData(markerData)}
        </MapView>
      </View>

      {/* Bottom Container */}
      <View style={styles.bottomContainer}>
        {/* <Image source={require('.aS/resources/GMCMap-Logo-Ver3-Transparent.png')} style = {styles.logoIcon}/> */}

        {/* <Text>Copyright @ 2023 GQ Electronics LLC. All Rights Reserved.</Text> */}

        <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
          <TouchableOpacity onPress={aboutOnClick} style ={styles.aboutButton}>
            <Image source={require('./resources/about-icon.png')} style = {styles.aboutIcon}/>
          </TouchableOpacity>

          <Text style={{alignSelf:'center'}}>About</Text>
        </View>
      </View>

      <BottomPopup  
        ref={(target) => popupRef = target}
        onTouchOutside={onClosePopup}
        title="Loading..."
      >

      </BottomPopup>

      <HistoryPanel
        ref={(target) => historyPanelRef = target}
        onTouchOutside={onCloseHistory}
        title="History Data"
      >

      </HistoryPanel>

      <RealtimePanel
        ref={(target) => realtimePanelRef = target}
        title="Real-Time Data"
      >

      </RealtimePanel>

      <CreditsPanel
        ref={(target) => creditsPanelRef = target}
        title="About"
      >

      </CreditsPanel>
    </View>
  );
}

/**
 * This function deals with the creation of each marker, styling them and adding
 * the on click events for each marker and its corresponding info. It takes in an
 * array of "Marker" Data nodes and returns all of them mapped onto <Marker> objects.
 * @param {*} markerDataArray The array 
 * @returns The markers to add.
 */
function markersFromData(markerDataArray){
  trackChanges = Platform.OS === 'android' ? false : true;
  
  return markerDataArray.map((markerData) => {
    return (<Marker
      key={markerData.key}
      coordinate={markerData} 
      onPress={() => showMarkerInfo(markerData)} 
      tracksInfoWindowChanges={false}
      tracksViewChanges={trackChanges}
      anchor={MARKER_ANCHOR}
      image={markerSource(markerData)}
    >
        <View style={styles.markerTextContainer}>
          {/* <Image
            source={markerSource(markerData)}
            style={styles.markerIcon}
          >

          </Image> */}

          <Text style={styles.markerText} adjustsFontSizeToFit={true} numberOfLines={1}>
            {markerData.CPM}
          </Text>
        </View>
      </Marker>);
  })
};

/**
 * Array helper method for concatenating arrays efficiently.
 * @param {*} other_array 
 */
Array.prototype.extend = function (other_array) {
  /* You should include a test to check whether other_array really is an array */
  other_array.forEach(function(v) {this.push(v)}, this);
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 6000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}

/**
 * The OnClickEvent for a marker, generating an alert dialogue with the marker's data.
 * Dynamically Changes based on what information was provided for the marker
 */
function showMarkerInfo(markerData){
  let markerDataItem = {};

  const dataHandler = async () => {
    popupRef.show()

    currentStatusString = "Retrieving Marker Data...";
    popupRef.updateRefreshState(currentStatusString.toString());

    dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getMarkerData.asp?ID=" + markerData.geigerID;
      
    try{
      const response = await fetchWithTimeout(dataStringQuery, {timeout: QUERY_TIMEOUT});
      const text = await response.text();

      if(text != null){
        markerDataItem = deserializeMarkerData(text);
      
        console.log("Retrieved Marker Data.");
      }else{
        Alert.alert(
          "Data Error", 
          "There was an unexpected problem.\nPlease try again later.", 
          [{text: 'Close'}], 
          {cancelable: true}
        );

        popupRef.close();
        return;
      }
    }catch(error){
      Alert.alert("Connection Failed", 
        "Unable to connect to server.\nPlease check your internet connection or try again later.", 
        [{text: 'Close'}], 
        {cancelable: true
      });

      popupRef.close();
      return;
    }
    
    var titleString = markerDataItem.brand;
  
    if(titleString == "unregistered" || titleString == ""){
      titleString = "Undisclosed Model";
    }else{
      titleString += " " + markerDataItem.model;
    }

    var infoString = "CPM - " + markerData.CPM;
    infoString += "\n";
    
    if(markerDataItem.ACPM != 0){
      infoString += "ACPM - " + markerDataItem.ACPM;
      infoString += "\n";
    }

    if(markerDataItem.uSv != 0){
      infoString += "uSV - " + markerDataItem.uSv;
      infoString += "\n";
    }

    infoString += "\n";

    if(markerDataItem.author != ""){
      infoString += "By: " + markerDataItem.author;
      infoString += "\n";
      infoString += "\n";
    }else{
      infoString += "By: Anonymous";
      infoString += "\n";
      infoString += "\n";
    }

    if(markerDataItem.date != ""){
      infoString += markerDataItem.date;
    }
    popupRef.close();

    Alert.alert(titleString, infoString, getMarkerButtons(markerDataItem, markerData.geigerID), {cancelable: true});
  }

  dataHandler();
}

/**
 * Takes the marker's data node and adds the buttons depending on if the author gave history data
 * or allows contacting. The close button is always there.
 * @param {*} markerDataItem The marker data node
 * @returns the array of buttons
 */
function getMarkerButtons(markerDataItem, geigerID){
  var buttons = [];

  console.log(markerDataItem.historyData);

  if(markerDataItem.historyData == "YES"){
    const historyOnPress = () =>{
      historyPanelRef.updateRefreshState(geigerID);
      historyPanelRef.show();
    }

    buttons.push({text: 'History Data', onPress: () => historyOnPress()})
  }

  const realtimeOnPress = () =>{
    realtimePanelRef.updateRefreshState(geigerID);
    realtimePanelRef.updateModelState(markerDataItem.model);
    realtimePanelRef.show();
  }
  
  buttons.push({text: 'Real-Time Data', onPress: () => realtimeOnPress()})
  // buttons.push({text: 'Contact'})

  buttons.push({text: 'Close'});
  return buttons;
}

//TODO: Write Comments
function deserializeMarkerData(dataString){
  const varArray = dataString.split("#STRONGHASH#");

  let markerData = {
    "brand": varArray[0],
    "model": varArray[1],
    "ACPM": varArray[2],
    "uSv": varArray[3],
    "author": varArray[4],
    "date": varArray[5],
    "historyData": varArray[6],
  }

  return markerData;
}
/**
 * Gets the correct icon for the marker depending on its CPM value.
 * 0-50 Green, 50-100 Orange, 100+ Red.
 */
function markerSource(markerData){
  if(markerData.CPM < 50){
    return require('./resources/25pxmarkers/green-marker-dark.png');
  }
  else if(markerData.CPM < 100){
    return require('./resources/25pxmarkers/orange-marker-dark.png');
  }
  else{
    return require('./resources/25pxmarkers/red-marker-dark.png');
  }
}

//TODO: Write Comments
function deserializeCPMs(dataString){
  const lineArray = dataString.split("#55#");
  let newMarkerArray = [];

  dataCount = parseInt(lineArray[lineArray.length - 1])

  //Get the amount we took from the batch through this based on chunk size calculated from the new asp later.
  for(let index = 0; index < dataCount; index++){
    const varArray = lineArray[index].split("#AA#");

    let markerData = createCPMNode(varArray, index);

    newMarkerArray.push(markerData);
  }

  return newMarkerArray;
}

//TODO: Write Comments
function createCPMNode(varArray, index){
  let markerData = {
    "geigerID": varArray[0],
    "key": index,
    "CPM": varArray[1],
  }

  return markerData;
}

//TODO: Write Comments
function deserializeLocations(dataString){
  const lineArray = dataString.split("#55#");
  let newMarkerArray = [];

  dataCount = parseInt(lineArray[lineArray.length - 1])

  //Get the amount we took from the batch through this based on chunk size calculated from the new asp later.
  for(let index = 0; index < dataCount; index++){
    const varArray = lineArray[index].split("*AA*");

    let markerData = createLocationNode(varArray);

    if(markerData.validLoc == 1){
      newMarkerArray.push(markerData);
    }
  }

  return newMarkerArray;
}

//TODO: Write Comments
function createLocationNode(varArray){
  var locationData = varArray[1].split(",");

  //Validate Location
  var valid = 1;

  if(locationData[1] == null){
    valid = 0;
  }else{
    var latitudeRaw = parseFloat(locationData[0]);
    if(latitudeRaw < -90 || latitudeRaw > 90){
      valid = 0;
    }
  
    var longitudeRaw = parseFloat(locationData[1]);
    if(longitudeRaw < -180 || longitudeRaw > 180){
      valid = 0;
    }
  }

  let markerData = {
    "geigerID": varArray[0],
    "validLoc": valid,
    "latitude": latitudeRaw,
    "longitude": longitudeRaw,
    // "brand": varArray[2],
    // "model": varArray[3],
    // "historyData": varArray[4],
    "latitudeDelta": 0.01,
    "longitudeDelta": 0.01
  }

  return markerData;
}



var styles = StyleSheet.create({
  body:{
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  topContainer:{
    flex: 1.7,
    width: deviceWidth * 0.9,
    justifyContent: 'space-between',
    alignSelf: 'center',
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  mapContainer: {
    flex: 13,
  },
  bottomContainer:{
    flex: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  map: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  headerText:{
    fontSize: 40,
  },
  buildText:{
    margin: 10,
  },
  refreshButton:{
    zIndex: 10,
    margin: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon:{
    flex: 1,
    width: '100%',
  },
  aboutButton:{
    zIndex: 10,
    marginTop: 5,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutIcon:{
    flex: 1,
    width: '100%',
  },
  logoIcon:{
    flex: 1,
    height: 30,
    width: 30,
  },
  markerTextContainer:{
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    
    width: 25,
    height: 25,
  },
  markerText:{
    position: 'absolute',
    maxWidth: 20,
    color: '#FFFFFF',
  },
  markerIcon:{
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;