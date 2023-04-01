import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  FlatList,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import axios from 'axios';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';

interface Photo {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

const App = () => {
  const [data, setData] = useState<Photo[]>([]);
  const [filteredData, setFilteredData] = useState<Photo[]>([]);
  const [search, setSearch] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('');
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const response = await axios.get<Photo[]>('https://jsonplaceholder.typicode.com/photos');
      setRefreshing(false)
      setData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      setRefreshing(false)
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterData = (searchTerm: string) => {
    setSearch(searchTerm);
    setFilteredData(data.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase())));
  };

  const sortData = (option: string) => {
    setSortOption(option);
    setFilteredData(
      [...filteredData].sort((a, b) => {
        if (option === 'title') {
          return a.title.localeCompare(b.title);
        } else if (option === 'albumId') {
          return a.albumId - b.albumId;
        }
      }),
    );
  };

  const saveImage = async (url: string) => {
    try {
      const folderPath = RNFS.DocumentDirectoryPath;
      const fileName = `${new Date().getTime()}.jpg`;
      const filePath = `${folderPath}/${fileName}`;
  
      if (!(await RNFS.exists(folderPath))) {
        await RNFS.mkdir(folderPath);
      }
  
      await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
      }).promise;
  
      Alert.alert('Success', 'Image saved successfully');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSortOption('');
    setFilteredData(data);
  };

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const renderItem = ({ item, index }: { item: Photo; index: number }) => (
    <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => openModal(index)}>
      <FastImage style={styles.thumbnail} source={{ uri: item.thumbnailUrl }} />

      <View style={styles.titleView}>
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={filterData}
          placeholder="Search by title"
        />
        <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sortContainer}>
        <Text style={styles.sortText}>Sort by:</Text>
        <TouchableOpacity onPress={() => sortData('title')} style={[styles.sortButton, {backgroundColor: sortOption == 'title' ? '#246EE9' : '#ccc'}]}>
          <Text style={styles.sortButtonText}>Title</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sortData('albumId')} style={[styles.sortButton, {backgroundColor: sortOption == 'albumId' ? '#246EE9' : '#ccc'}]}>
          <Text style={styles.sortButtonText}>Album ID</Text>
        </TouchableOpacity>
  </View>
  <FlatList
    data={filteredData}
    renderItem={renderItem}
    keyExtractor={(item) => item.id.toString()}
    numColumns={2}
    contentContainerStyle={styles.grid}
    onRefresh={() => {setRefreshing(true), fetchData()}}
    refreshing={refreshing}
  />
    <Modal
    visible={isModalVisible}
    onRequestClose={closeModal}
    transparent={true}
    animationType="slide"
  >
    <View style={styles.modalContainer}>
      <FlatList
        data={filteredData}
        renderItem={({ item }) => (
          <View style={styles.swiperSlide}>
            <FastImage style={styles.fullImage} source={{ uri: item.url }} />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={selectedImageIndex}
        getItemLayout={(data, index) => ({
          length: Dimensions.get('window').width,
          offset: Dimensions.get('window').width * index,
          index,
        })}
      />
      <View style={styles.buttonsView}>
      <TouchableOpacity onPress={() => saveImage(filteredData[selectedImageIndex]?.url)} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Image</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      </View>
    </View>
  </Modal>
</SafeAreaView>
  );
};

const styles = StyleSheet.create({
container: {
flex: 1,
},
searchContainer: {
flexDirection: 'row',
padding: 10,
},
searchInput: {
flex: 1,
borderWidth: 1,
borderColor: '#ccc',
borderRadius: 5,
paddingHorizontal: 10,
paddingVertical: 5,
},
resetButton: {
marginLeft: 10,
backgroundColor: '#ccc',
paddingHorizontal: 10,
paddingVertical: 5,
borderRadius: 5,
},
resetText: {
color: '#fff',
},
sortContainer: {
flexDirection: 'row',
alignItems: 'center',
paddingHorizontal: 10,
marginBottom: 10,
},
sortText: {
marginRight: 10,
},
sortButton: {
backgroundColor: '#ccc',
paddingHorizontal: 10,
paddingVertical: 5,
borderRadius: 5,
marginLeft: 5,
},
sortButtonText: {
color: '#fff',
},
grid: {
paddingBottom: 20,
},
gridItem: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
margin: 10,
borderRadius: 24
},
thumbnail: { 
width: (Dimensions.get('window').width / 2) - 20,
height: (Dimensions.get('window').width / 2) - 20,
borderRadius: 24
},
titleView: {
position: 'absolute',
padding: 5,
backgroundColor: 'rgba(0,0,0,0.6)',
bottom: 0,
borderBottomLeftRadius: 24,
borderBottomRightRadius: 24,
width: '100%',
justifyContent: 'center',
alignItems: 'center'
},
title: {
textAlign: 'center',
color: 'white'
},
modalContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
backgroundColor: 'rgba(0, 0, 0, 0.8)',
},
fullImage: {
width: Dimensions.get('window').width,
height: Dimensions.get('window').height / 2,
resizeMode: 'contain',
},
closeButton: {
//marginTop: 20,
backgroundColor: '#ccc',
paddingHorizontal: 20,
paddingVertical: 10,
borderRadius: 5,
marginLeft: 10
},
closeButtonText: {
color: '#fff',
},
swiperSlide: {
height: Dimensions.get('window').height / 2,
justifyContent: 'center',
alignItems: 'center',
width: Dimensions.get('window').width,
alignSelf: 'center'
},
saveButton: {
//marginTop: 20,
backgroundColor: 'blue',
paddingHorizontal: 20,
paddingVertical: 10,
borderRadius: 5,
marginRight: 10
},
saveButtonText: {
color: '#fff',
},
buttonsView: {
position: 'absolute',
flexDirection: 'row',
alignItems: 'center',
top: Dimensions.get('window').height / 1.2
}
});

export default App;
