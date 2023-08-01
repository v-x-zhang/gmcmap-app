import{
    Modal,
    Dimensions,
    TouchableWithoutFeedback,
    StyleSheet,
    View,
    Text,
    FlatList
} from 'react-native';

import React from 'react';

const deviceHeight = Dimensions.get("window").height

export class BottomPopup extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            show: false,
            currentRefreshState: "Establishing Connection to Server..."
        }
    }

    show = () => {
        this.setState({show: true, currentRefreshState: "Establishing Connection to Server..."})
    }

    close = () => {
        this.setState({show:false, currentRefreshState: "Closing Popup..."})
    }

    updateRefreshState = (newState) =>{
        this.setState({show: true, currentRefreshState: newState})
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

    renderTitle = () => {
        const {title} = this.props;
        const {show} = this.state;

        if(!show) return;

        return (
            <View>
                <Text style ={styles.titleText}>
                    {title}
                </Text>
            </View>
        )
    }

    renderContent = () => {
        const {show, currentRefreshState} = this.state;
        
        if(!show) return;

        return (
            <View style={styles.modalContentContainer}>
                <Text style ={styles.contentText}>
                    {currentRefreshState}
                </Text>
            </View>
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
                <View style={styles.globalContainer}>
                        {/* {this.renderOutsideTouchable(onTouchOutside)} */}
                        <View style={styles.modalMainContainer}>
                            {this.renderTitle()}
                            {this.renderContent()}
                        </View>
                </View>

            </Modal>
        )
    }
}

var styles = StyleSheet.create({
    globalContainer:{
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
        maxHeight: deviceHeight * 0.4,
    },
    modalContentContainer:{
        height: 85,
        // flex:1,
        alignItems: 'center',
        paddingTop: 15,
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
});