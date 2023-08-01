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
const DEFAULT_PAGE = 1;
const ENTRIES_PER_PAGE = Math.round((Dimensions.get("window").height * 0.6) / 22);

const QUERY_TIMEOUT = 30000;
// const ENTRIES_PER_PAGE = 5;


const DEFAULT_ENTRIES = [
    {
        id: 1,
        name: 'Task',
      },
      {
        id: 2,
        name: 'Message',
      },
      {
        id: 3,
        name: 'Note',
      },
]

const ENTRY_HEADER = {
    "id": 0,
    "date": "Date (UTC)              ",
    "CPM": "CPM",
    "ACPM": "ACPM",
    "uSv": "uSv/h",
    // "lat": varArray[4],
    // "long": varArray[5],
};

var dataFlag = 0;
var currentPage = DEFAULT_PAGE;

export class HistoryPanel extends React.Component{

    constructor(props){
        super(props)
        this.state = {
            show: false,
            currentRefreshState: "Retrieving Data...",
            listData: DEFAULT_ENTRIES,
        }
    }

    show = () => {
        this.setState({show: true})
    }

    close = () => {
        const {show} = this.state;
        if(!show) return;

        currentPage = DEFAULT_PAGE;
        dataFlag = 0;
        this.setState({show:false})
    }

    updateRefreshState = (newState) =>{
        this.setState({currentRefreshState: newState})
    }

    updateListData = (newState) => {
        this.setState({listData: newState})
    }

    renderOutsideTouchable(onTouch) {
        const view = <View style= {{flex: 1, width: '100%'}}/>
        if(!onTouch) return view;

        return (
            <TouchableWithoutFeedback onPress={onTouch} style={{flex:1, width: '100%'}}>
                {view}
            </TouchableWithoutFeedback>
        )
    }

    renderHeader = () => {
        const {show} = this.state;
        const {title} = this.props;

        if(!show) return;

        return (
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style ={styles.titleText}>
                    {title}
                </Text>

                <TouchableOpacity onPress={this.close} style ={styles.backButton}>
                    <Text style={styles.backButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        )
    }

    renderFooter = () => {

        if(currentPage > 1){
            return (
                <View style = {{flexDirection: 'row', justifyContent: 'space-evenly'}}>
                    <Text style={{fontSize: 18, fontWeight: 'bold'}}>Page {currentPage}</Text>

                    <TouchableOpacity onPress={this.previousPageOnClick} style ={styles.pageButton}>
                        <Text style={styles.pageButtonText}>Previous Page</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity onPress={this.nextPageOnClick} style ={styles.pageButton}>
                        <Text style={styles.pageButtonText}>Next Page</Text>
                    </TouchableOpacity>
                </View>
            )
        }else{
            return (
                <View style = {{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <TouchableOpacity onPress={this.nextPageOnClick} style ={styles.pageButton}>
                        <Text style={{fontSize: 18, fontWeight: 'bold'}}>Page {currentPage}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={this.nextPageOnClick} style ={styles.pageButton}>
                        <Text style={styles.pageButtonText}>Next Page</Text>
                    </TouchableOpacity>
                </View>
            )
        }
        
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
        
        console.log(ENTRIES_PER_PAGE);
        console.log(currentRefreshState);

        this.updateListData(DEFAULT_ENTRIES);

        dataFlag = 1;

        var queryString = "https://gmcmap.com/app/app_AJAX_getMarkerHistoryData.asp?geigerID=" + currentRefreshState + "&currentPage=" + currentPage + "&AmountPerPage=" + ENTRIES_PER_PAGE;
        
        try{
            const response = await this.fetchWithTimeout(queryString, {timeout: QUERY_TIMEOUT});
            const text = await response.text();

            if(text != null){
                let entryDataArray = [];

                entryDataArray.push(ENTRY_HEADER);

                const retrievedEntryItemArray = text.split("#ENDHASH#");

                dataCount = parseInt(retrievedEntryItemArray[retrievedEntryItemArray.length - 1])

                //Get the amount we took from the batch through this based on chunk size calculated from the new asp later.
                for(let index = 0; index < dataCount; index++){
                    const varArray = retrievedEntryItemArray[index].split("#STRONGHASH#");

                    let markerData = {
                        "id": index + 1,
                        "date": varArray[0],
                        "CPM": varArray[1],
                        "ACPM": varArray[2],
                        "uSv": varArray[3],
                        // "lat": varArray[4],
                        // "long": varArray[5],
                    };

                    entryDataArray.push(markerData);
                }

                this.updateListData(entryDataArray);
                
                console.log("Retrieved Marker History Data.");
            }else{
                Alert.alert(
                    "Data Error", 
                    "There was an unexpected problem.\nPlease try again later.", 
                    [{text: 'Close'}], 
                    {cancelable: true}
                  );
          
                this.close();
                return;
            }
        }catch(error){
            Alert.alert("Connection Failed", 
                "Unable to connect to server.\nPlease check your internet connection or try again later.", 
                [{text: 'Close'}], 
                {cancelable: true
            });

            this.close();
            return;
        }
    }

    nextPageOnClick = () => {
        this.updateListData(DEFAULT_ENTRIES);
        
        currentPage++;

        this.dataHandler();
    }

    previousPageOnClick = () => {
        if(currentPage > 1){
            this.updateListData(DEFAULT_ENTRIES);
        
            currentPage--;

            this.dataHandler();
        }
    }

    renderContent = () => {
        const {show, listData} = this.state;

        if(!show) return;

        if(dataFlag == 0){
            this.dataHandler();
        }

        //Wait for data
        if(listData == DEFAULT_ENTRIES){
            return (
                <View style={styles.modalContentContainer}>
                    <Text style ={styles.contentText}>
                        Retrieving History Data from Server...
                    </Text>
                </View>
            )
        }
        else if(listData.length == 1){
            return (
                <View style={styles.modalContentContainer}>
                    <Text style ={styles.contentText}>
                        Device has no more history.
                    </Text>
                </View>
            )
        }
        else{
            return (
                <View style={styles.modalContentContainer}>
                    <FlatList
                        style = {{marginBottom: 20}}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                        data={listData}
                        renderItem={this.renderItem}
                        extraData={listData}
                        keyExtractor={(item, index) => index.toString()}
                        ItemSeparatorComponent={this.renderSeparator}
                        contentContainerStyle={{
                            paddingBottom:40
                        }}
                    />
                </View>
            )
        }
    }

    renderItem = ({item}) => {
        if(item.id == 0){
            return (
                <View style={styles.historyItemContainer}>
                    <Text style={styles.historyHeaderText}>{item.date}</Text>
                    <Text style={styles.historyHeaderText}>{item.CPM}</Text>
                    <Text style={styles.historyHeaderText}>{item.ACPM}</Text>
                    <Text style={styles.historyHeaderText}>{item.uSv}</Text>
                </View>
            )
        }else{
            return (
                <View style={styles.historyItemContainer}>
                    <Text style={styles.historyItemText}>{item.date}</Text>
                    <Text style={styles.historyItemText}>{item.CPM}</Text>
                    <Text style={styles.historyItemText}>{item.ACPM}</Text>
                    <Text style={styles.historyItemText}>{item.uSv}</Text>
                </View>
            )
        }
    }

    renderSeparator = () =>{
        return(
            <View style={styles.historyItemSeparator}/>
        )
    }

    render(){
        let {show} = this.state
        const {onTouchOutside, title} = this.props;

        return (
            <Modal
                animationType={'fade'}
                transparent={true}
                visible={show}
                onRequestClose={this.close}
            >
                <View style={styles.backgroundView}/>

                <View style = {styles.panelContainer}>
                    {this.renderOutsideTouchable(onTouchOutside)}
                    <View style={styles.modalMainContainer}>
                        {this.renderHeader()}
                        {this.renderFooter()}
                        {this.renderContent()}
                    </View>
                </View>
            </Modal>
        )
    }
}

var styles = StyleSheet.create({
    backgroundView:{
        flex: 1,
        backgroundColor: '#000000AA',
        justifyContent: 'flex-end',
    },
    modalMainContainer:{
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingHorizontal: 0,
        maxHeight: deviceHeight * 0.8,
    },
    modalContentContainer:{
        height: deviceHeight * 0.8,
        // flex:1,
        alignItems: 'center',
        paddingTop: 0,
    },
    titleText:{
        color: '#182E44',
        fontSize: 20,
        fontWeight: '500',
        margin: 15,
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
    historyItemText:{
        fontSize: 18,
        fontWeight: 'normal',
        color: '#182E44'
    },
    historyHeaderText:{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#182E44'
    },
    historyItemSeparator:{
        opacity: 0.1,
        backgroundColor: '#182E44',
        height: 2,
    },
    backButton:{
        zIndex: 10,
        margin: 15,
        justifyContent:  'flex-start',
        alignItems: 'flex-end',
    },
    backButtonText:{
        fontSize: 20,
        fontWeight: 'normal',
        color: '#558cc3',
    },
    pageButton:{
        zIndex: 10,
        marginBottom: 15,
        marginHorizontal: 15,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    pageButtonText:{
        fontSize: 20,
        fontWeight: 'normal',
        color: '#558cc3',
    }
});