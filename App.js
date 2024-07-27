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

import * as SecureStore from 'expo-secure-store';

import { BottomPopup } from './BottomPopup';
import { HistoryPanel } from './HistoryPanel';
import { RealtimePanel } from './RealtimePanel';
import { RealtimePanel_r } from './RealtimePanel_r';
import { SettingsPanel } from './SettingsPanel';


//Whether or not we are starting up, switches off on first data refresh.
var startupFlag = 1;

//The default markers to render when no data exists.
const DEFAULT_MARKERS = [];

const MARKER_ANCHOR = {x: 0.5,y: 0.5};

const deviceWidth = Dimensions.get("window").width;

const QUERY_TIMEOUT = 30000;

const CURRENT_BUILD = "v1.0.2";

var historyPanelRef;
var realtimePanelRef;
var realtimePanelRef_r;
var settingsPanelRef;
var popupRef;

var currentMapTitleText = "GMCMap";
var currentMap = 1; //1 = GMC, 2 = Radon

/**
 * This function acts as the Update() of the app, executing on runtime.
 * @returns The "viewport of the screen" to display
 */
function App() {
  popupRef = React.createRef();
  historyPanelRef = React.createRef();
  realtimePanelRef = React.createRef();
  realtimePanelRef_r = React.createRef();
  settingsPanelRef = React.createRef();

  const [markerData, setMarkerData] = useState(DEFAULT_MARKERS);
  const [currentMarkerSize, setMarkerSize] = useState(2);
  const [currentTimeZone, setTimeZone] = useState(0);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 20.0,
    longitudeDelta: 20.0,
  });

  const checkForUpdates = async () =>{
    var dataStringQuery = "https://www.gmcmap.com/app/app_Current_Build.asp";

    const response = await fetchWithTimeout(dataStringQuery, {timeout : 6000})
    const text = await response.text();

    if(text != CURRENT_BUILD){
      Alert.alert(
        "Application Update",
        "There is a new update! Please visit the app store to download the new update.",
        [{text: 'Close'}],
        {cancelable: true}
      );
    }else if(text == null){
      Alert.alert(
        "Connection Failed", 
        "Unable to check for updates.", 
        [{text: 'Close'}], 
        {cancelable: true});
    }
  }

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
    setMarkerData(DEFAULT_MARKERS);

    //Show Pop Up
    popupRef.show()

    currentStatusString = "Establishing Connection to Server...";
    popupRef.updateRefreshState(currentStatusString.toString());

    var cpmArray = [];
    var locationArray = [];

    if(currentMap == 1){
      dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getAllCPMActive.asp";  
    }else{
      dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getAllCPMActive_r.asp";  
    }

    try{
      const response2 = await fetchWithTimeout(dataStringQuery, {timeout: QUERY_TIMEOUT});
      const text = await response2.text();

      if(text != null){
        var newDataArray = deserializeCPMs(text);
  
        cpmArray = newDataArray;
        
        console.log("Received Marker CPMs.");

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

    if(currentMap == 1){
      dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getAllDeviceLocations.asp";
    }else{
      dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getAllDeviceLocations_r.asp";
    }

    try{
      const response3 = await fetchWithTimeout(dataStringQuery, {timeout: QUERY_TIMEOUT});
      const text3 = await response3.text();

      if(text3 != null){
        currentStatusString = "Data Retrieval Complete. Updating Markers...";
        popupRef.updateRefreshState(currentStatusString.toString());

        var newDataArray = deserializeLocations(text3);
        //Add the new Array onto the current marker one.
      
        locationArray = newDataArray;
      
        console.log("Received Marker Locations.");

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

  const settingsOnClick = () =>{
    settingsPanelRef.show();
  }

  const radonOnClick = () =>{
    if(currentMap == 2) return;

    currentMap = 2;
    currentMapTitleText = "RadonMap";

    setMarkerData(DEFAULT_MARKERS);
    dataClickHandler();
  }

  const GMCOnClick = () =>{
    if(currentMap == 1) return;

    currentMap = 1;
    currentMapTitleText = "GMCMap";

    setMarkerData(DEFAULT_MARKERS);
    dataClickHandler();
  }

  const onCloseSettings = () =>{
    waitForMarkerSize();
    waitForTimeZone();
  }

  const waitForElement = () =>{
    if(popupRef.current !== null){
      dataClickHandler();
    }
    else{
      setTimeout(waitForElement, 250);
    }
  }

  const moveToLastLocation = async () =>{
    var lastLocation = await getLastLocation();

    // console.log(lastLocation);
    
    setInitialRegion(lastLocation)
  }

  const waitForMarkerSize = async () =>{
    var currentMarkerSize = await getValueFor('marker-size');
    setMarkerSize(currentMarkerSize);
  }

  const waitForTimeZone = async () =>{
    var currentTimeZone = await getTimeZone('time-zone-offset');
    setTimeZone(currentTimeZone);
  }

  const regionChangeCallback = (e)=>{
    saveLastLocation(e);
  }

  //First Frame Run Refresh
  if(startupFlag == 1){
    startupFlag = 0;

    checkForUpdates();

    //Load Default Settings
    waitForMarkerSize();
    waitForTimeZone();

    moveToLastLocation();

    waitForElement();
  }

  return (
    <View style = {styles.body}>
      {/* Top Container */}
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={refreshOnClick} style ={styles.refreshButton}>
          <Image source={require('./resources/refresh-icon2.png')} style = {styles.refreshIcon}/>
        </TouchableOpacity>

        <Text style={styles.headerText}>{currentMapTitleText}</Text>
        <Text style={styles.buildText}>{CURRENT_BUILD}</Text>
      </View>


      {/* Center Map Container */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} clusterColor='#3383f2' extent = {256} minPoints={10} maxZoom={15} radius={deviceWidth * 0.08}
          region={initialRegion}
          provider={PROVIDER_GOOGLE}
          onRegionChangeComplete={(e) => regionChangeCallback(e)}
          // onMapReady={() => setTimeout(() => setMapReady(true), 100)}
          >
          

          {/* Child Markers */}
          {markersFromData(markerData, currentMarkerSize, currentTimeZone)}
        </MapView>
      </View>

      {/* Bottom Container */}
      <View style={styles.bottomContainer}>
        {/* <Image source={require('.aS/resources/GMCMap-Logo-Ver3-Transparent.png')} style = {styles.logoIcon}/> */}

        {/* <Text>Copyright @ 2023 GQ Electronics LLC. All Rights Reserved.</Text> */}
    
        {radonButton(currentMap, radonOnClick)}
        
        {gmcButton(currentMap, GMCOnClick)}

        <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
          <TouchableOpacity onPress={settingsOnClick} style ={styles.aboutButton}>
            <Image source={require('./resources/settings-icon-2.png')} style = {styles.aboutIcon}/>
          </TouchableOpacity>

          <Text style={{alignSelf:'center'}}>Settings</Text>
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

      <RealtimePanel_r
        ref={(target) => realtimePanelRef_r = target}
        title = "Real-Time Data"
      >

      </RealtimePanel_r>

      <SettingsPanel
        ref={(target) => settingsPanelRef = target}
        onClose={onCloseSettings}
        title="Settings"
      >

      </SettingsPanel>
    </View>
  );
}

function radonButton(currentMap, radonOnClick){
  if(currentMap == 1){
    return(
      <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
        <TouchableOpacity disabled={false} onPress={radonOnClick} style ={styles.aboutButton}>
          <Image source={require('./resources/radon-icon.png')} style = {styles.aboutIcon}/>
        </TouchableOpacity>

        <Text style={{alignSelf:'center', color:'#000000'}}>Radon</Text>
      </View>
    )
  }else{
    return(
      <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
        <TouchableOpacity disabled={true} onPress={radonOnClick} style ={styles.aboutButton}>
          <Image source={require('./resources/radon-selected-icon.png')} style = {styles.aboutIcon}/>
        </TouchableOpacity>

        <Text style={{alignSelf:'center', color:'#5fb3fd'}}>Radon</Text>
      </View>
    )
  }
}

function gmcButton(currentMap, GMCOnClick){
  if(currentMap == 1){
    return(
      <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
        <TouchableOpacity disabled={true} onPress={GMCOnClick} style ={styles.aboutButton}>
          <Image source={require('./resources/gmc-icon-selected.png')}  style = {styles.aboutIcon}/>
        </TouchableOpacity>

        <Text style={{alignSelf:'center', color:'#5fb3fd'}}>GMC</Text>
      </View>
    )
  }else{
    return(
      <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
        <TouchableOpacity disabled={false} onPress={GMCOnClick} style ={styles.aboutButton}>
          <Image source={require('./resources/gmc-icon.png')}  style = {styles.aboutIcon}/>
        </TouchableOpacity>

        <Text style={{alignSelf:'center', color:'#000000'}}>GMC</Text>
      </View>
    )
  }
}

async function getValueFor(key, currentMarkerSize) {
  let result = await SecureStore.getItemAsync(key);
  if (result) {
    if(currentMarkerSize != Number(result)){
      currentMarkerSize = Number(result);
    }
    // console.log("marker size = " + JSON.stringify(currentMarkerSize));
    return result;
  } else {
    return null;
  }
}

async function getLastLocation(){
  let lat = await SecureStore.getItemAsync('lat');
  let long = await SecureStore.getItemAsync('long');
  let latDelta = await SecureStore.getItemAsync('latDelta');
  let longDelta = await SecureStore.getItemAsync('longDelta');

  if(lat == undefined || long == undefined || latDelta == undefined || longDelta == undefined){
    return null;
  }else{
    return {
      latitude: Number(lat),
      latitudeDelta: Number(latDelta),
      longitude: Number(long),
      longitudeDelta: Number(longDelta)
    }
  }
}

async function saveLastLocation(location){
  await SecureStore.setItemAsync('lat', location.latitude.toString());
  await SecureStore.setItemAsync('latDelta', location.latitudeDelta.toString());
  await SecureStore.setItemAsync('long', location.longitude.toString());
  await SecureStore.setItemAsync('longDelta', location.longitudeDelta.toString());

  // console.log("Saved Location Data");
}

async function getTimeZone(key, currentTimeZone){
  let result = await SecureStore.getItemAsync(key);
  if (result) {
    if(currentTimeZone != Number(result)){
      currentTimeZone = Number(result);
    }
    // console.log("marker size = " + JSON.stringify(currentMarkerSize));
    return result;
  } else {
    return null;
  }
}

/**
 * This function deals with the creation of each marker, styling them and adding
 * the on click events for each marker and its corresponding info. It takes in an
 * array of "Marker" Data nodes and returns all of them mapped onto <Marker> objects.
 * @param {*} markerDataArray The array 
 * @returns The markers to add.
 */
function markersFromData(markerDataArray, currentMarkerSize, currentTimeZone){
  trackChanges = Platform.OS === 'android' ? false : true;
  
  return markerDataArray.map((markerData) => {
    return (<Marker
      key={markerData.key}
      coordinate={markerData} 
      onPress={() => showMarkerInfo(markerData, currentTimeZone)} 
      tracksInfoWindowChanges={false}
      tracksViewChanges={trackChanges}
      anchor={MARKER_ANCHOR}
      image={markerSource(markerData, currentMarkerSize)}
    >
      {textSource(markerData.CPM, currentMarkerSize)}

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
function showMarkerInfo(markerData, currentTimeZone){
  let markerDataItem = {};

  const dataHandler = async () => {
    popupRef.show()

    currentStatusString = "Retrieving Marker Data...";
    popupRef.updateRefreshState(currentStatusString.toString());

    if(currentMap == 1){
      dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getMarkerData.asp?ID=" + markerData.geigerID;
    }else{
      dataStringQuery = "https://www.gmcmap.com/app/app_AJAX_getMarkerData_r.asp?ID=" + markerData.geigerID;
    }
      
    try{
      const response = await fetchWithTimeout(dataStringQuery, {timeout: QUERY_TIMEOUT});
      const text = await response.text();

      if(text != null){

        if(currentMap == 1){
          markerDataItem = deserializeMarkerData(text);
        }else{
          markerDataItem = deserializeMarkerData_r(text);
        }
      
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
    
    if(currentMap == 1){
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
      }else{
        infoString += "By: Anonymous";
      }
  
      // if(markerDataItem.date != ""){
      //   infoString += markerDataItem.date;
      // }
    }
    else
    {
      //Radon Info
      var titleString = markerDataItem.brand;
  
      if(titleString == "unregistered" || titleString == ""){
        titleString = "Undisclosed Model";
      }else{
        titleString += " " + markerDataItem.model;
      }
  
      var infoString = "pCi/L - " + markerData.CPM;
      infoString += "\n";
      
      if(markerDataItem.bq != 0){
        infoString += "Bq - " + markerDataItem.bq;
        infoString += "\n";
      }
      infoString += "\n";
  
      if(markerDataItem.author != ""){
        infoString += "By: " + markerDataItem.author;
      }else{
        infoString += "By: Anonymous";
      }
  
      // if(markerDataItem.date != ""){
      //   infoString += markerDataItem.date;
      // }
    }

    popupRef.close();
    Alert.alert(titleString, infoString, getMarkerButtons(markerDataItem, markerData.geigerID, currentTimeZone), {cancelable: true});
  }

  dataHandler();
}

/**
 * Takes the marker's data node and adds the buttons depending on if the author gave history data
 * or allows contacting. The close button is always there.
 * @param {*} markerDataItem The marker data node
 * @returns the array of buttons
 */
function getMarkerButtons(markerDataItem, geigerID, currentTimeZone){
  var buttons = [];

  // console.log(markerDataItem.historyData);

  if(markerDataItem.historyData == "YES"){
    const historyOnPress = () =>{
      historyPanelRef.updateRefreshState(geigerID);
      historyPanelRef.updateTimeZone(currentTimeZone);
      historyPanelRef.show();
    }

    buttons.push({text: 'History Data', onPress: () => historyOnPress()})
  }

  const realtimeOnPress = () =>{
    realtimePanelRef.updateRefreshState(geigerID);
    realtimePanelRef.updateModelState(markerDataItem.model);
    realtimePanelRef.show();
  }

  const realtimeOnPress_r = () =>{
    realtimePanelRef_r.updateRefreshState(geigerID);
    realtimePanelRef_r.updateModelState(markerDataItem.model);
    realtimePanelRef_r.show();
  }
  
  if(currentMap == 1){
    buttons.push({text: 'Real-Time Data', onPress: () => realtimeOnPress()})
  }else{
    buttons.push({text: 'Real-Time Data', onPress: () => realtimeOnPress_r()})
  }

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

function deserializeMarkerData_r(dataString){
  const varArray = dataString.split("#STRONGHASH#");

  let markerData = {
    "brand": varArray[0],
    "model": varArray[1],
    "bq": varArray[2],
    "author": varArray[3],
    "date": varArray[4],
    "historyData": varArray[5],
  }

  return markerData;
}

function textSource(markerDataCPM, currentMarkerSize){

  if(currentMarkerSize == 1){
    return (
      <View style={styles.smallMarkerTextContainer}>
        <Text style={styles.smallMarkerText} adjustsFontSizeToFit={true} numberOfLines={1}>
          {markerDataCPM}
        </Text>
      </View>
    )
  }else if(currentMarkerSize == 2){
    return (
      <View style={styles.mediumMarkerTextContainer}>
        <Text style={styles.mediumMarkerText} adjustsFontSizeToFit={true} numberOfLines={1}>
          {markerDataCPM}
        </Text>
      </View>
    )
  }else if(currentMarkerSize == 3){
    return (
      <View style={styles.largeMarkerTextContainer}>
        <Text style={styles.largeMarkerText} adjustsFontSizeToFit={true} numberOfLines={1}>
          {markerDataCPM}
        </Text>
      </View>
    )
  }else{
    return (
      <View style={styles.mediumMarkerTextContainer}>
        <Text style={styles.mediumMarkerText} adjustsFontSizeToFit={true} numberOfLines={1}>
          {markerDataCPM}
        </Text>
      </View>
    )
  }
}

/**
 * Gets the correct icon for the marker depending on its CPM value.
 * 0-50 Green, 50-100 Orange, 100+ Red.
 */
function markerSource(markerData, currentMarkerSize){
  if(currentMarkerSize == 1){
    if(currentMap == 1){//GMC
      if(markerData.CPM < 50){
        return require('./resources/25pxmarkers/green-marker-dark.png');
      }
      else if(markerData.CPM < 100){
        return require('./resources/25pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/25pxmarkers/red-marker-dark.png');
      }
    }else{//Radon
      if(markerData.CPM < 4){
        return require('./resources/25pxmarkers/blue-marker-dark.png');
      }
      else if(markerData.CPM < 10){
        return require('./resources/25pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/25pxmarkers/red-marker-dark.png');
      }
    }
  }
  else if(currentMarkerSize == 2){
    if(currentMap == 1){//GMC
      if(markerData.CPM < 50){
        return require('./resources/38pxmarkers/green-marker-dark.png');
      }
      else if(markerData.CPM < 100){
        return require('./resources/38pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/38pxmarkers/red-marker-dark.png');
      }
    }else{//Radon
      if(markerData.CPM < 4){
        return require('./resources/38pxmarkers/blue-marker-dark.png');
      }
      else if(markerData.CPM < 10){
        return require('./resources/38pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/38pxmarkers/red-marker-dark.png');
      }
    }
  }
  else if(currentMarkerSize == 3){
    if(currentMap == 1){//GMC
      if(markerData.CPM < 50){
        return require('./resources/50pxmarkers/green-marker-dark.png');
      }
      else if(markerData.CPM < 100){
        return require('./resources/50pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/50pxmarkers/red-marker-dark.png');
      }
    }else{//Radon
      if(markerData.CPM < 4){
        return require('./resources/50pxmarkers/blue-marker-dark.png');
      }
      else if(markerData.CPM < 10){
        return require('./resources/50pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/50pxmarkers/red-marker-dark.png');
      }
    }
  }else{
    if(currentMap == 1){//GMC
      if(markerData.CPM < 50){
        return require('./resources/38pxmarkers/green-marker-dark.png');
      }
      else if(markerData.CPM < 100){
        return require('./resources/38pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/38pxmarkers/red-marker-dark.png');
      }
    }else{//Radon
      if(markerData.CPM < 4){
        return require('./resources/38pxmarkers/blue-marker-dark.png');
      }
      else if(markerData.CPM < 10){
        return require('./resources/38pxmarkers/orange-marker-dark.png');
      }
      else{
        return require('./resources/38pxmarkers/red-marker-dark.png');
      }
    }
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
    justifyContent: 'space-evenly',
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
  smallMarkerTextContainer:{
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    
    width: 25,
    height: 25,
  },
  mediumMarkerTextContainer:{
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    
    width: 38,
    height: 38,
  },
  largeMarkerTextContainer:{
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    
    width: 50,
    height: 50,
  },
  smallMarkerText:{
    position: 'absolute',
    color: '#FFFFFF',
    
    maxWidth: 18,
    maxHeight: 25,
  },
  mediumMarkerText:{
    position: 'absolute',
    color: '#FFFFFF',
    
    maxWidth: 27,
    maxHeight: 38,
  },
  largeMarkerText:{
    position: 'absolute',
    color: '#FFFFFF',
    
    maxWidth: 36,
    maxHeight: 50,
  },
  markerIcon:{
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;