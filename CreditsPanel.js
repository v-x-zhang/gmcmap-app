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

export class CreditsPanel extends React.Component{

    constructor(props){
        super(props)
        this.state = {
            show: false,
        }
    }

    show = () => {
        this.setState({show: true})
    }

    close = () => {
        this.setState({show:false})
    }

    renderHeader = () => {
        const {title} = this.props;

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
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.footerText}>Copyright @ 2023 GQ Electronics LLC. All Rights Reserved.</Text>
            </View>
        )
    }

    renderContent = () => {
        return (
            <View style={styles.modalContentContainer}>
                <Text style={styles.contentText}>This app is currently undergoing MAJOR DEVELOPMENT.</Text>

                <Text style={styles.contentText}>Visit www.gmcmap.com for full, expanded functionality.</Text>

                <Text style={styles.contentText}>Developed By: Vincent Zhang</Text>
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
        justifyContent: 'flex-end',
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        flexDirection: 'column',
        paddingTop: 0,
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
        margin: 15,
        color: '#182E44',
    },
    footerText:{
        fontSize: 13,
        fontWeight: 'normal',
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
});