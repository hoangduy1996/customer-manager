/**
 * This class define Customer Home Screen
 * @author Hoang Duy
 */
import React, { Component } from "react";
import { RefreshControl, ListView, Alert, AsyncStorage } from "react-native";
import {
  Container,
  Content,
  Header,
  Left,
  Right,
  Body,
  Button,
  Text,
  Icon,
  Title,
  List,
  ListItem
} from "native-base";
import { styles } from "../../styles/Styles.js";
import { scale, moderateScale, verticalScale } from "../../utils/scale.js";
import firebase from "react-native-firebase";
import { compareCustomerName } from "../../api/API.js";
import { listCustomerKey } from "../../utils/global.js";
import { m3 } from "../../utils/message.js";
import call from "react-native-phone-call";

export default class CustomerHomeScreen extends Component {
  constructor(props) {
    super(props);
    this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      refreshing: false,
      listAllCustomer: []
    };
    this.storeData = this.storeData.bind(this);
    this.retrieveData = this.retrieveData.bind(this);
  }

  componentDidMount() {
    // use cached list if possible
    this.retrieveData();
  }

  async storeData() {
    try {
      await AsyncStorage.setItem(
        listCustomerKey,
        JSON.stringify(this.state.listAllCustomer)
      );
    } catch (error) {
      alert(error);
    }
  }

  async retrieveData() {
    try {
      const value = await AsyncStorage.getItem(listCustomerKey);
      if (value !== null && value !== "[]") {
        this.setState({ listAllCustomer: JSON.parse(value) });
      } else {
        this.fetchData();
      }
    } catch (error) {
      alert(error);
    }
  }

  onRefresh = () => {
    this.setState({ refreshing: true });
    this.fetchData();
  };

  refreshData(data) {
    this.fetchData();
  }

  goToDetail(data) {
    if (data.key !== null) {
      this.props.navigation.navigate("Detail", {
        hasKey: true,
        val: data,
        refresh: this.refreshData.bind(this)
      });
    }
    this.props.navigation.navigate("Detail", {
      hasKey: false,
      val: data,
      refresh: this.refreshData.bind(this)
    });
  }

  fetchData = () => {
    let ref = firebase.database().ref("customer");
    ref.once("value").then(
      function(snapshot) {
        let data = Object.values(snapshot.val());
        data.sort(compareCustomerName);
        this.setState({ listAllCustomer: data });
        this.setState({ refreshing: false });

        //update the cache list for later use
        this.storeData(data.slice(0));
      }.bind(this)
    );
  };

  showDialog(title, message, c, item) {
    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          style: "cancel",
          onPress: () => this.deleteData(item)
        }
      ],
      { cancelable: c }
    );
  }

  deleteData(item) {
    /**
     * delete customer
     */
    //ref to customer table
    let ref = firebase.database().ref("customer");
    let key = item.key === undefined ? item.name : item.key;
    ref.child(key).remove();

    //refresh data
    this.setState({ listAllCustomer: [] });
    this.onRefresh();
    alert("Xoá thành công!");
  }

  call(data) {
    if (data.phone.length >= 10 && data.phone !== "0") {
      const args = {
        number: data.phone, // String value with the number to call
        prompt: false // Optional boolean property. Determines if the user should be prompt prior to the call
      };

      call(args).catch(console.error);
    }
  }

  render() {
    const { navigation } = this.props;
    return (
      <Container>
        <Header style={styles.appHeader}>
          <Left>
            <Button transparent onPress={() => navigation.openDrawer()}>
              <Icon name="ios-menu" style={styles.appHeaderIcon} />
            </Button>
          </Left>
          <Body>
            <Title style={styles.appHeaderFont}>Khách hàng</Title>
          </Body>
          <Right>
            <Button
              transparent
              onPress={() =>
                navigation.navigate("CustomerAdd", {
                  refresh: this.refreshData.bind(this)
                })
              }
            >
              <Icon name="md-person-add" style={styles.appHeaderIcon} />
            </Button>
          </Right>
        </Header>
        <Content
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
        >
          <List
            dataSource={this.ds.cloneWithRows(this.state.listAllCustomer)}
            renderRow={data => (
              <ListItem style={styles.customerItem}>
                <Left>
                  <Text style={styles.customerItemFont}> {data.name} </Text>
                </Left>
                <Right>
                  <Button transparent onPress={() => this.goToDetail(data)}>
                    <Icon
                      name="arrow-forward"
                      style={styles.customerItemIcon}
                    />
                  </Button>
                </Right>
              </ListItem>
            )}
            renderLeftHiddenRow={data => (
              <Button full success onPress={() => this.call(data)}>
                <Icon active name="ios-call" style={styles.customerItemIcon} />
              </Button>
            )}
            renderRightHiddenRow={data => (
              <Button
                full
                danger
                onPress={() => this.showDialog("", m3, true, data)}
              >
                <Icon active name="trash" style={styles.customerItemIcon} />
              </Button>
            )}
            leftOpenValue={scale(80)}
            rightOpenValue={scale(-80)}
          />
        </Content>
      </Container>
    );
  }
}
