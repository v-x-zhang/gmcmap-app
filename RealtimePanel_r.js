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

import React from 'react';

const deviceHeight = Dimensions.get("window").height
const deviceWidth = Dimensions.get("window").width

const DEFAULT_DATA = {
    "id": 0,
    "date": "Date",
    "pci": "pCi/L",
    "bq": "Bq",
};

//Data Refresh Time
const REFRESH_TIME = 60; //1 Minutes

const QUERY_TIMEOUT = 30000; //6 Seconds

var dataFlag = 0;

export class RealtimePanel_r extends React.Component{

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

        var queryString = "https://www.gmcmap.com/app/app_AJAX_getMarkerData_r.asp?ID=" + currentRefreshState;      

        try{
            const response = await this.fetchWithTimeout(queryString, {timeout: QUERY_TIMEOUT});
            const text = await response.text();

            if(text != null){
                const varArray = text.split("#STRONGHASH#");

                let markerData = {
                    "brand": varArray[0],
                    "model": varArray[1],
                    "bq": varArray[2],
                    "author": varArray[3],
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
        
        queryString = "https://www.gmcmap.com/app/app_AJAX_getSpecificDeviceCPM_r.asp?geigerID=" + currentRefreshState;      

        try{
            const response2 = await this.fetchWithTimeout(queryString, {timeout: QUERY_TIMEOUT});
            const text2 = await response2.text();

            if(text2 != null){
                let newMarkerData = {
                    "brand": tempMarkerData.brand,
                    "model": tempMarkerData.model,
                    "bq": tempMarkerData.bq,
                    "author": tempMarkerData.author,
                    "pci": text2,
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
                    {this.renderPCI(currentData.pci)}

                    {this.renderBQ(currentData.bq)}

                    {this.renderAuthor(currentData.author)}
                    
                    {this.renderFooter()}
                </View>
            )
        }
    }

    renderPCI = (currentPCI) =>{
        if(currentPCI == 0){
            return;
        }
        
        var correctColor;

        if(currentPCI < 50){
            correctColor = "#00b300";
        }
        else if(currentPCI < 100){
            correctColor = "#b3b300";
        }
        else{
            correctColor = "#990000";
        }

        return(
            <View style={styles.dataContainer}>
                <Text style={styles.dataHeader}>
                    Current pCi/L
                </Text>

                <Text 
                    style={{color: correctColor, fontSize: 40, fontWeight: 'bold'}}
                >
                    {currentPCI}
                </Text>
            </View>
        )
    }

    renderBQ = (currentBQ) =>{
        if(currentBQ == 0){
            return;
        }

        var correctColor;

        if(currentBQ < 50){
            correctColor = "#00b300";
        }
        else if(currentBQ < 100){
            correctColor = "#b3b300";
        }
        else{
            correctColor = "#990000";
        }


        return(
            <View style={styles.dataContainer}>
                <Text style={styles.dataHeader}>
                    Current Becquerel
                </Text>

                <Text style={{color: correctColor, fontSize: 40, fontWeight: 'bold'}}>
                    {currentBQ}
                </Text>
            </View>
        )
    }

    // renderUSV = (currentuSv) =>{
    //     if(currentuSv == 0){
    //         return;
    //     }

    //     return(
    //         <View style={styles.dataContainer}>
    //             <Text style={styles.dataHeader}>
    //                 uSv/h
    //             </Text>

    //             <Text style={styles.dataItemText}>
    //                 {currentuSv}
    //             </Text>
    //         </View>
    //     )
    // }

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
        alignItems: 'center',
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
    dataHeader:{
        fontSize: 25,
        fontWeight: '400',
        color: "#000000",
    },
    dataItemText:{
        fontSize: 40,
        fontWeight: 'bold',
        color: "#193366",
    },
});