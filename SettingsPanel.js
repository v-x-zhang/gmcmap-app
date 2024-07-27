import{
    Modal,
    Dimensions,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Image,
    StyleSheet,
    View,
    Text,
    FlatList,
    Alert,
} from 'react-native';

import React, { useState } from 'react';

import * as SecureStore from 'expo-secure-store';

import { SelectList } from 'react-native-dropdown-select-list';


const deviceHeight = Dimensions.get("window").height
const deviceWidth = Dimensions.get("window").width

const timeZoneData = [
    {key:'1', value:'(UTC-12:00) International Date Line West'},
    {key:'2', value:'(UTC-11:00) Coordinated Universal Time-11'},
    {key:'3', value:'(UTC-10:00) Hawaii'},
    {key:'4', value:'(UTC-09:00) Alaska'},
    {key:'5', value:'(UTC-08:00) Pacific Time (US and Canada)'},
    {key:'6', value:'(UTC-07:00) Mountain Time (US and Canada)'},
    {key:'7', value:'(UTC-06:00) Central Time (US and Canada)'},
    {key:'8', value:'(UTC-05:00) Eastern Time (US and Canada)'},
    {key:'9', value:'(UTC-04:00) Atlantic Time (Canada)'},
    {key:'10', value:'(UTC-03:00) Greenland, Brasilia, Buenos Aires'},
    {key:'11', value:'(UTC-02:00) Coordinated Universal Time-2'},
    {key:'12', value:'(UTC-01:00) Cape Verde, Azores'},
    {key:'13', value:'(UTC+00:00) Coordinated Universal Time'},
    {key:'14', value:'(UTC+01:00) West Central Africa'},
    {key:'15', value:'(UTC+02:00) Helsinki, Kyiv, Riga, Sofia'},
    {key:'16', value:'(UTC+03:00) Kuwait, Riyadh'},
    {key:'17', value:'(UTC+04:00) Moscow, St. Petersburg, Volgograd	'},
    {key:'18', value:'(UTC+05:00) Islamabad, Karachi'},
    {key:'19', value:'(UTC+06:00) Yekaterinburg'},
    {key:'20', value:'(UTC+07:00) Bangkok, Hanoi, Jakarta'},
    {key:'21', value:'(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi'},
    {key:'22', value:'(UTC+09:00) Osaka, Sapporo, Tokyo	'},
    {key:'23', value:'(UTC+10:00) Guam, Port Moresby'},
    {key:'24', value:'(UTC+11:00) Solomon Islands, New Caledonia'},
    {key:'25', value:'(UTC+12:00) Coordinated Universal Time+12'},
    {key:'26', value:'(UTC+13:00) Samoa'},
]

export class SettingsPanel extends React.Component{

    getValueFor = async (key) =>{
        let result = await SecureStore.getItemAsync(key);
        if (result) {
            this.setState({currentMarkerSize: Number(result)});
            return result;
        } else {
            return null;
        }
    }

    getTimeZone = async (key) =>{
        let result = await SecureStore.getItemAsync(key);
        if(result) {
            this.setState({currentTimeZone: Number(result)});
            return result;
        }else{
            return null;
        }
    }

    save = async (key, value)=>{
        await SecureStore.setItemAsync(key, value);
    }

    constructor(props){
        super(props)
        this.state = {
            show: false,
            currentMarkerSize: 2,
            currentTimeZone: 0,
        }
    }

    show = () => {
        this.setState({show: true})

        this.getValueFor("marker-size");

        this.getTimeZone("time-zone-offset");
    }

    close = () => {
        const {onClose} = this.props;

        this.setState({show:false})

        {onClose()};
    }

    renderHeader = () => {
        const {title} = this.props;

        return (
            <View style={{marginTop: 15, flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style ={styles.titleText}>
                    {title}
                </Text>
                
                <TouchableOpacity onPress={this.close} style ={styles.backButton}>
                    <Text style={styles.backButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        )
    }

    renderTitle = () =>{
        const {title} = this.props;

        return (
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                <Text style ={styles.titleText}>
                    {title}
                </Text>
            </View>
        )
    }

    renderFooter = () =>{
        return(
            <View style={{flexDirection: 'column', justifyContent: 'center', alignContent: 'center', alignItems: 'center'}}>
                <Text style={styles.footerText}>Developed By: Vincent Zhang</Text>
                <Text style={styles.footerText}>Copyright @ 2023 GQ Electronics LLC. All Rights Reserved.</Text>
                <Text style={styles.footerText}>Current Build : v1.0.2</Text>
            </View>
        )
    }

    smallMarkerOnClick = () =>{
        this.setState({currentMarkerSize: 1});
        this.save('marker-size', "1");
    }

    mediumMarkerOnClick = () =>{
        this.setState({currentMarkerSize: 2});
        this.save('marker-size', "2");
    }

    largeMarkerOnClick = () =>{
        this.setState({currentMarkerSize: 3});
        this.save('marker-size', "3");
    }

    renderMarkerButtons= () =>{
        const {currentMarkerSize} = this.state;

        if(currentMarkerSize == 1){
            return (
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.smallMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/filled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Small</Text>
                    </View>

                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.mediumMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/unfilled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Medium</Text>
                    </View>

                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.largeMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/unfilled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Large</Text>
                    </View>
                </View>
            )
        }else if(currentMarkerSize == 2){
            return (
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.smallMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/unfilled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Small</Text>
                    </View>

                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.mediumMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/filled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Medium</Text>
                    </View>

                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.largeMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/unfilled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Large</Text>
                    </View>
                </View>
            )
        }else{
            return (
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.smallMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/unfilled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Small</Text>
                    </View>

                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.mediumMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/unfilled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Medium</Text>
                    </View>

                    <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                        <TouchableOpacity onPress={this.largeMarkerOnClick} style ={styles.markerSizeButton}>
                            <Image source={require('./resources/filled-circle-button-icon.png')} style = {styles.markerSizeButtonIcon}/>
                        </TouchableOpacity>

                        <Text style={{alignSelf:'center'}}>Large</Text>
                    </View>
                </View>
            )
        }
    }

    selectNewTimeZone = (newTimeZone) =>{
        var hasValue = false;
        for (let i = 0; i < timeZoneData.length; i++){
            if(newTimeZone == timeZoneData[i].value){
                hasValue = true;
            }
        }
        if(!hasValue) return;

        var negative = true;

        var timeZoneParts = newTimeZone.split(" ")
        
        var newZoneParts = timeZoneParts[0].split("-")
        if(newZoneParts.length == 1){
            newZoneParts = newZoneParts[0].split("+")
            var negative = false;
        }

        var string = newZoneParts[1].split(":");

        if(negative){
            console.log("-" + Number(string[0]).toString());

            this.save('time-zone-offset', "-" + Number(string[0]).toString());
        }else{
            console.log(Number(string[0]).toString());

            this.save('time-zone-offset', Number(string[0]).toString());
        }


    }

    renderTimeZoneDropdown = () =>{
        const {currentTimeZone} = this.state;

        return (
            <View style={{flexDirection:'column', justifyContent:'center', alignContent:'center'}}>
                <Text style={{alignSelf:'center', fontWeight: 'bold', fontSize: 25, marginBottom: 10}}>Time Zone</Text>
                
                <SelectList 
                    setSelected={(val) => this.selectNewTimeZone(val)} 
                    placeholder='Select Time Zone'
                    defaultOption={timeZoneData[currentTimeZone + 12]}
                    data={timeZoneData} 
                    save="value"
                />
            </View>
            
        )
    }

    renderContent = () => {
        return (
            <View style={styles.modalContentContainer}>
                {this.renderTimeZoneDropdown()}

                <View>
                    <Text style={styles.contentText}>Marker Size</Text>

                    {this.renderMarkerButtons()}
                    <Text style={styles.footerText}></Text>     

                    <Text style={styles.footerText}>Note: marker size may take a few seconds to update.</Text>          
                </View>     
            </View>
        )
    }

    render(){
        let {show} = this.state

        return (
            <Modal
                animationType={'fade'}
                transparent={false}
                visible={show}
                onRequestClose={this.close}
            >
                <View style = {styles.panelContainer}>
                    <View style={styles.modalMainContainer}>
                        {this.renderHeader()}
                        {this.renderContent()}
                        {this.renderFooter()}
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
        width: deviceWidth,
        height: deviceHeight,
        marginBottom: 20,
        maxHeight: deviceHeight * .95,
    },
    modalContentContainer:{
        height: deviceHeight,
        flex:1,
        justifyContent: 'flex-start',
        padding: 15,
        flexDirection: 'column',
    },
    titleText:{
        color: '#182E44',
        fontSize: 30,
        fontWeight: '500',
        margin: 15,
    },
    contentText:{
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 50,
        margin: 5,
        color: '#182E44',
    },
    footerText:{
        fontSize: 13,
        fontWeight: 'normal',
        alignSelf: 'center',
        color: '#182E44',
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
    markerSizeButton:{
        zIndex: 10,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerSizeButtonIcon:{
        flex: 1,
        width: '100%',
    }
});