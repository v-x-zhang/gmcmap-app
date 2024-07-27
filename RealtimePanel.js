import{
    Modal,
    Dimensions,
    TouchableWithoutFeedback,
    TouchableOpacity,
    StyleSheet,
    View,
    Text,
    FlatList,
    Alert,
} from 'react-native';

import { 
    Image 
} from 'expo-image';

import React from 'react';

const deviceHeight = Dimensions.get("window").height
const deviceWidth = Dimensions.get("window").width

const DEFAULT_DATA = {
    "id": 0,
    "date": "Date",
    "CPM": "CPM",
    "ACPM": "ACPM",
    "uSv": "uSv/h",
};

//Data Refresh Time
const REFRESH_TIME = 60; //1 Minutes

const QUERY_TIMEOUT = 30000; //6 Seconds

var dataFlag = 0;

export class RealtimePanel extends React.Component{

    constructor(props){
        super(props)
        this.state = {
            show: false,
            currentRefreshState: "Retrieving Data...",
            model: "Loading...",
            currentTime: REFRESH_TIME,
            currentData: DEFAULT_DATA,
        }
    }

    show = () => {
        this.setState({show: true})
    }

    close = () => {
        dataFlag = 0;
        this.setState({show:false})
    }

    updateRefreshState = (newState) =>{
        this.setState({currentRefreshState: newState})
    }

    updateModelState = (newState) =>{
        this.setState({model: newState})
    }

    updateTimeState = (newState) =>{
        this.setState({currentTime: newState});
    }

    updateDataState = (newState) => {
        this.setState({currentData: newState});
    }

    renderHeader = () => {
        const {show} = this.state;
        const {title} = this.props;

        if(!show) return;

        return (
            <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                <Text style ={styles.titleText}>
                    {title}
                </Text>

                <TouchableOpacity onPress={this.close} style ={styles.backButton}>
                    <Text style={styles.backButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        )
    }

    renderModel = () =>{
        const {model} = this.state;

        return (
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                <Text style ={styles.modelText}>
                    {model}
                </Text>
            </View>
        )
    }

    refreshOnClick = () =>{
        this.updateDataState(DEFAULT_DATA);
        clearTimeout(currentRunningTimer);

        this.dataHandler();
    }

    renderTimer = () =>{
        const {currentTime} = this.state;

        var timerString = "Data will automatically refresh in ";
        timerString += currentTime;
        timerString += "s...";

        return(
            <Text style ={styles.timerText}>
                {timerString}
            </Text>
        )
    }

    timerStart = () =>{
        this.updateTimeState(REFRESH_TIME);

        currentRunningTimer = setTimeout(this.timerLoop, 1000);
    }

    timerLoop = () => {
        const {show, currentTime} = this.state;
        var timeToRefresh = currentTime - 1;

        if(!show){
            //Stop and do nothing.
            return;
        }

        this.updateTimeState(timeToRefresh);

        if(timeToRefresh <= 0){
            this.dataHandler();
        }else
        {
            currentRunningTimer = setTimeout(this.timerLoop, 1000);
        }
    }

    renderFooter = () =>{
        return(
            <TouchableOpacity onPress={this.refreshOnClick} style ={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
        )
    }

    fetchWithTimeout = async(resource, options = {}) =>{
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

    dataHandler = async() =>{
        const {currentRefreshState} = this.state;

        var tempMarkerData;

        dataFlag = 1;


        if(currentRefreshState == "Loading..."){
            this.updateDataState(null);

            this.timerStart();
            return;
        }

        var queryString = "https://www.gmcmap.com/app/app_AJAX_getMarkerData.asp?ID=" + currentRefreshState;      

        try{
            const response = await this.fetchWithTimeout(queryString, {timeout: QUERY_TIMEOUT});
            const text = await response.text();

            if(text != null){
                const varArray = text.split("#STRONGHASH#");

                let markerData = {
                    "brand": varArray[0],
                    "model": varArray[1],
                    "ACPM": varArray[2],
                    "uSv": varArray[3],
                    "author": varArray[4],
                }

                tempMarkerData = markerData;
            }else{
                Alert.alert("Connection Failed", 
                    "Unable to retrieve data.\nPlease try again later.", 
                    [{text: 'Close'}], 
                    {cancelable: true
                });

                this.close();
                return;
            }
        }
        catch(error){
            Alert.alert("Connection Failed", 
                "Unable to connect to server.\nPlease check your internet connection or try again later.", 
                [{text: 'Close'}], 
                {cancelable: true
            });

            this.close();            
            return;
        }
        
        queryString = "https://www.gmcmap.com/app/app_AJAX_getSpecificDeviceCPM.asp?geigerID=" + currentRefreshState;      

        try{
            const response2 = await this.fetchWithTimeout(queryString, {timeout: QUERY_TIMEOUT});
            const text2 = await response2.text();

            if(text2 != null){
                let newMarkerData = {
                    "brand": tempMarkerData.brand,
                    "model": tempMarkerData.model,
                    "ACPM": tempMarkerData.ACPM,
                    "uSv": tempMarkerData.uSv,
                    "author": tempMarkerData.author,
                    "CPM": text2,
                }

                tempMarkerData = newMarkerData;
            }else{
                Alert.alert("Connection Failed", 
                    "Unable to retrieve data.\nPlease try again later.", 
                    [{text: 'Close'}], 
                    {cancelable: true
                });

                this.close();
                return;
            }
        }
        catch(error){
            Alert.alert("Connection Failed", 
                "Unable to connect to server.\nPlease check your internet connection or try again later.", 
                [{text: 'Close'}], 
                {cancelable: true
            });

            this.close();
            return;
        }

        this.updateDataState(tempMarkerData);
        
        this.timerStart();
    }

    renderContent = () => {
        const {show, currentData} = this.state;

        if(!show) return;

        if(dataFlag == 0){
            this.updateDataState(DEFAULT_DATA);

            this.dataHandler();
        }

        //Wait for data
        if(currentData == DEFAULT_DATA){
            return (
                <View style={styles.modalContentContainer}>
                    <Text style ={styles.contentText}>
                        Retrieving History Data from Server...
                    </Text>
                </View>
            )
        }
        else if(currentData == null){
            return (
                <View style={styles.modalContentContainer}>
                    <Text style ={styles.contentText}>
                        Unable to connect to the server.
                    </Text>
                </View>
            )
        }
        else{
            return (
                <View style={styles.modalContentContainer}>
                    {this.renderCPM(currentData.CPM)}
                    
                    {this.renderSeperator()}

                    {this.renderACPM(currentData.ACPM, currentData.uSv)}

                    {this.renderSeperator()}

                    {this.renderAuthor(currentData.author)}
                    
                    {this.renderFooter()}
                </View>
            )
        }
    }

    renderCPM = (currentCPM) =>{
        if(currentCPM == 0){
            return;
        }

        return(
            <View style={styles.cpmContainer}>
                <View style={{flexDirection: 'row', justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 100, fontWeight: 'bold'}}>
                        {currentCPM}
                    </Text>

                    <Text style={styles.cpmText}>
                        CPM
                    </Text>
                </View>

                {/* {currentCPM < 50 
                    ? <Image source={require('./resources/normal-level-gmc.png')} style = {styles.safetyLevelImage}/>
                    : currentCPM < 100 
                    ? <Image source={require('./resources/warning-level-gmc.png')} style = {styles.safetyLevelImage}/>
                    : <Image source={require('./resources/unsafe-level-gmc.png')} style = {styles.safetyLevelImage}/>
                }    */}
            </View>
        )
    }

    renderSafetyLevel = (currentCPM) =>{
        if(currentCPM == 0){
            return;
        }

        if(currentCPM < 50){
            return(
                <Image source={require('./resources/normal-level-gmc.png')} style = {styles.safetyLevelImage}/>
            )
        }else if (currentCPM < 100){
            return(
                <Image source={require('./resources/warning-level-gmc.png')} style = {styles.safetyLevelImage}/>
            )
        }else{
            return(
                <Image source={require('./resources/unsafe-level-gmc.png')} style = {styles.safetyLevelImage}/>
            )
        }
    }

    renderACPM = (currentACPMm, currentuSv) =>{
        var finalCurrentACPM = currentACPMm;
        var finalCurrentuSv = currentuSv;

        if(finalCurrentACPM == 0){
            finalCurrentACPM = "N/A";
        }else{
            finalCurrentACPM = Number(finalCurrentACPM);
        }
        
        if(finalCurrentuSv == 0){
            finalCurrentuSv = "N/A";
        }else{
            finalCurrentuSv = Number(finalCurrentuSv);
        }

        return(
            <View style={styles.acpmContainer}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.dataItemText}>
                        {finalCurrentACPM}
                    </Text>

                    <Text style={styles.acpmText}>
                        ACPM
                    </Text>
                </View>

                <View style={styles.verticalLine}></View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.dataItemText}>
                        {finalCurrentuSv}
                    </Text>

                    <Text style={styles.acpmText}>
                        uSv/h
                    </Text>
                </View>
            </View>
        )
    }

    renderAuthor = (author) =>{
        if(author == ""){
            author = "Anonymous";
        }

        return(
            <View style={styles.dataContainer}>
                <Text style={styles.dataHeader}>
                    Station
                </Text>

                <Text style={styles.dataItemText}>
                    {author}
                </Text>
            </View>
        )
    }
    
    renderSeperator = () =>{
        return(
            <View
                style={{
                    borderBottomColor: 'black',
                    alignSelf: 'stretch',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                }}
            />
        )
    }

    render(){
        let {show} = this.state

        return (
            <Modal
                animationType={'slide'}
                transparent={false}
                visible={show}
                onRequestClose={this.close}
            >

                <View style = {styles.panelContainer}>
                    <View style={styles.modalMainContainer}>
                        {this.renderHeader()}


                        {this.renderModel()}
                        {this.renderTimer()}
                        {this.renderContent()}
                    </View>
                </View>
            </Modal>
        )
    }
}

var styles = StyleSheet.create({
    panelContainer:{
        backgroundColor: '#FFFFFF',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        // alignContent: 'center',
        maxHeight: deviceHeight,
    },
    modalMainContainer:{
        width: deviceWidth * .9,
        backgroundColor: '#e6f2ff',
        height: deviceHeight,
        borderRadius: 50,
        maxHeight: deviceHeight * .9,
    },
    modalContentContainer:{
        height: deviceHeight,
        flex:1,
        // alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
        paddingTop: 0,
    },
    titleText:{
        color: '#182E44',
        fontSize: 30,
        fontWeight: '500',
        marginRight: deviceWidth * 0.07,
        marginTop: 15,
    },
    timerText:{
        fontSize: 13,
        fontWeight: 'normal',
        color: '#182E44',
        marginBottom: 15,
        alignSelf: 'center',
    },
    contentText:{
        fontSize: 13,
        fontWeight: 'normal',
        color: '#182E44',
    },
    historyItemContainer:{
        height: 20,
        width: deviceWidth * 0.9,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    historyHeaderText:{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#182E44'
    },
    backButton:{
        zIndex: 10,
        marginTop: 23,
        marginRight: deviceWidth * 0.05,
        // backgroundColor: "#b3e6ff",
        // borderRadius: 15,
        justifyContent:  'flex-start',
        alignItems: 'flex-end',
    },
    backButtonText:{
        fontSize: 20,
        fontWeight: 'normal',
        color: '#558cc3',
    },
    refreshButton:{
        zIndex: 10,
        margin: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshButtonText:{
        fontSize: 20,
        fontWeight: 'normal',
        color: '#558cc3',
    },
    modelText:{
        fontSize: 20,
        fontWeight: 'normal',
        color: '#000000',
        marginBottom: 20,
    },
    dataContainer:{
        margin: 15,
        alignContent:'center',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    cpmContainer:{
        flex: 2,
        margin: 15,
        alignContent:'center',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    acpmContainer:{
        flex: 2,
        margin: 15,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    stationContainer:{

    },
    verticalLine:{
        height: '100%',
        width: 1,
        backgroundColor: '#a7b7c9',
    },
    dataHeader:{
        fontSize: 25,
        fontWeight: '400',
        color: "#000000",
    },
    cpmText:{
        fontSize: 25,
        fontWeight: '400',
        color: "#8b9bad",
    },
    acpmText:{
        fontSize: 20,
        fontWeight: '400',
        color: "#8b9bad"
    },
    dataItemText:{
        fontSize: 40,
        fontWeight: 'bold',
        color: "#193366",
    },
    safetyLevelImage:{
        flex: 1,
        contentFit: 'contain',
        height: undefined,
        width: deviceWidth * 0.8,
    },
});