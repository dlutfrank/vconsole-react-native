/*
*  RNVConsole 测试环境查看log 
*  created by sallyywang on 3/28/2019
*/

import React, {Component} from 'react';
import {
    View,
    Text,
    StyleSheet,
    PanResponder,
    TouchableHighlight,
    TouchableWithoutFeedback,
    TouchableOpacity,
    FlatList,
    Animated,
    Dimensions
    } from 'react-native';

 let width = 0, height = 0;

 class RNVConsole extends Component{
    constructor(props){
        super(props);
        //避免横屏容器，竖屏展示的问题。
        let dimension = Dimensions.get('window');
        
        width = dimension.width;
        height = dimension.height;
        
        this.logArr = [];
        this.state = {
            logArr: [], //存放log的数组
            isOpen: false, //是否展示log区域
            panelHeight: new Animated.Value(0),
        }
    }
    componentWillMount(){
        if(!global.consolePanelStack){
            _setup(global);
        }
    }
    componentDidMount(){
        //this.proxyConsole();
        consolePanelStack.bindUpdateListener(()=>{
            let arr = consolePanelStack.getLogArr();
            this.setState({
                logArr: arr
            })
        })
    }
    formatToString = (obj)=>{
        //将各种结构的log转为String
        if (obj === null || obj === undefined || typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'function') {
            return '"' + String(obj) + '"';
        } else if (obj instanceof Date) {
            return 'Date(' + obj.toISOString() + ')';
        } else if (Array.isArray(obj)) {
            return 'Array(' + obj.length + ')[' + obj.map((elem)=> this.formatToString(elem)) + ']';
        } else if (obj.toString) {
           // return 'object{' + obj.toString() + '}'; 
            //此处有问题，对象调用toString()返回为"[object Object]"
            return 'object(' + JSON.stringify(obj) + ')'  ; 
        } else {
            return 'unknown data';
        }
    }
    handleLogDataType = (data)=>{
       
    }
    openLogPanel = ()=>{
        console._log('点击到了')
        this.setState({
            isOpen: !this.state.isOpen
        })
    }
    clearLogArr = ()=>{
        if(global.consolePanelStack){
            consolePanelStack.clearLogArr() //清空
        }
    }
    HideConsolePanel = ()=>{
        if(this.state.isOpen){
            this.setState({
                isOpen: false
            })
        }
    }
    renderHeadComponent = ()=>{
        return (
        <View style={styles.header}>
            <Text style={[styles.fontFloat, {color: '#000'}]}>Console</Text>
        </View>)
    }
    render(){
        const {logArr, isOpen} = this.state;
        let logView = [];
        let r = [];
        logView = logArr.map((item, index) => {
            r = item.data.map((data, key)=>{
                return this.formatToString(data)
            })
            return {method: item.method, data: r.join(' '), date: item.date} 
        })
        let showContent;
        if(isOpen){
            showContent = (
                <View style={[styles.container, { 
                    width: width,
                    height: height / 2}]}>
                <FlatList
                    style={{width: '100%', flex: 0.9}}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent = {this.renderHeadComponent}
                    data={logView}
                    stickyHeaderIndices={[0]}
                    renderItem={({item, index}) => {
                        return(
                        <Text style={[styles.itemStyle,styles[item.method]]}>
                            {item.date} | {item.data}
                        </Text>
                        )
                    }}
                    keyExtractor={(item, index) => `console-panel-${index.toString()}`}
                />
                <View style={{flex: 0.1, backgroundColor: '#f2f4f4', flexDirection: 'row'}}>
                        <TouchableOpacity onPress={this.clearLogArr} 
                        style={[styles.btnStyle, {borderRightWidth: 1, borderColor: '#999'}]}>
                            <Text style={[styles.fontFloat, {color: '#000'}]}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this.HideConsolePanel} style={styles.btnStyle}>
                            <Text style={[styles.fontFloat, {color: '#000'}]}>Hide</Text>
                        </TouchableOpacity>
                </View>
            </View>
            )
        } else {
            showContent = (
                <TouchableOpacity 
                    style={styles.float} 
                    onPress={this.openLogPanel}>
                    <Text style={styles.fontFloat}>
                        RNVConsole
                    </Text>
                </TouchableOpacity>
            )
        }
        return ( showContent )
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 999999999,
        elevation: 999999999,
        backgroundColor: '#fff',
        bottom: 0,
        right: 0,
    },
    log: {
        fontSize: 12,
        color: '#000'
    },
    warn: {
        fontSize: 12,
        color: '#FFA533'
    },
    error: {
        fontSize: 12,
        color: '#ff0000'
    },
    btnStyle: {
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    float: {
        //悬浮窗
        width: 100,
        height: 40,
        backgroundColor: '#32CD32',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        zIndex: 999999999,
        elevation: 999999999,
        bottom: 40,
        right: 10,
    },
    fontFloat: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    },
    flatlist: {
        position: 'absolute',
        zIndex: 999999999,
        elevation: 999999999,
        top: 100,
        height: height / 2,
        width: '100%',
        borderColor: '#999',
        borderTopWidth: 1,
        // borderBottomWidth: 1,
        // paddingBottom: 20,
        backgroundColor: "#fff"
    },
    itemStyle: {
        borderBottomWidth: 1,
        borderColor: '#00FF33', 
        marginLeft: 10,
        marginRight: 10,
        marginTop: 8,
        marginBottom: 8,
    },
    header: {
        height: 30,
        // borderBottomWidth: 1,
        backgroundColor: '#f2f4f4',
        // borderColor: '#999',
        alignItems: 'center',
        justifyContent: 'center'
    }
})


//设置全局函数
let _setUpGlobal = function(global){
    (function(global){
        class ConsoleStack {
            constructor(){
                this.logData = [];
                this.waittig = false;
                this.listeners = [];
            }
            addLogToArr(method, data){
                //log数量增加
                this.logData.unshift({method: method, data: data, date: timestamp()});
                this.notifyListeners();
            }
            notifyListeners(){
                //若this.logData有变化，则通知监听器
                if (this.waiting) {
                    return;
                }
                this.timeout = setTimeout(()=> {
                    this.listeners.forEach((callback)=>{
                        callback();
                        clearTimeout(this.timeout);
                        this.waiting = false;
                    });
                }, 500);
                this.waiting = true;
            }
            clearLogArr(){
                //清空log
                this.logData.splice(0, this.logData.length);
                this.notifyListeners();
            }
            bindUpdateListener(callback) {
                this.listeners.push(callback); //变化执行函数
            }
            getLogArr(){
                return this.logData;
            }
        }
        function formatter(len){
            return (input)=> {
                var str = String(input);
                var strLen = str.length;
                return '0'.repeat(len - strLen) + input;
            }
        }
    
        function timestamp(){
            var d = new Date();
            let f2 = formatter(2);
            return f2(d.getHours())
                + ':' + f2(d.getMinutes())
                + ':' + f2(d.getSeconds())
                + '.' + formatter(3)(d.getMilliseconds());
        }

        function proxyConsole(console, ConsoleStack){
            let methods = ['log', 'warn', 'error', 'info'];
            methods.forEach((method)=>{
                var f = console[method];
                  console['_'+method] = f;
                  console[method] = function(){
                    const log = Array.prototype.slice.call(arguments); //将argument转为数组
                    ConsoleStack.addLogToArr(method, log);
                    f.apply(console, arguments); //打印出来
                  }
            })
        }
        if (!global.consolePanelStack) {
            let consolePanelStack = new ConsoleStack();
            global.consolePanelStack = consolePanelStack;
            proxyConsole(global.console, consolePanelStack);
        }
    })(global)
}


module.exports = {
   
    Panel:RNVConsole,
    showLogWhenDev:()=>{
        _setUpGlobal(global);
        return <RNVConsole/>;
    }
}


