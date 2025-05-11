/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import 'react-native-get-random-values';
import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useState,
} from 'react';
import TcpSocket from 'react-native-tcp-socket';
import DeviceInfo from 'react-native-device-info';
import {useChunkStore} from '../db/chunkStore';
import {Alert, Platform} from 'react-native';
import RNFS, {readFile} from 'react-native-fs';
import {v4 as uuidv4} from 'uuid';
import {produce} from 'immer';
import {Buffer} from 'buffer';
import {receiveChunkAck, receivedFileAck, sendChunkAck} from './TCPUtils';

interface TCPContextType {
  server: any;
  client: any;
  isConnected: boolean;
  connectedDevice: any;
  sentFiles: any;
  receivedFiles: any;
  totalSentBytes: number;
  totalReceivedBytes: number;
  startServer: (port: number) => void;
  connectToServer: (host: string, port: number, deviceName: string) => void;
  sendMessage: (message: string | Buffer) => void;
  sendFileAck(file: any, type: 'file' | 'image'): void;
  disconnect: () => void;
}

const TCPContext = createContext<TCPContextType | undefined>(undefined);

export const useTCP = (): TCPContextType => {
  const context = useContext(TCPContext);
  if (!context) {
    throw new Error('useTCP must be used within a TCPProvider');
  }
  return context;
};

const options = {
  keystore: require('../../tls_certs/server-keystore.p12'),
};

// const options = {
//   key: require('../../tls_certs/key.pem'),
//   cert: require('../../tls_certs/cert.pem'),
// };

// const options = {
//   key: readFile(RNFS.MainBundlePath + '/tls_certs/key.pem'),
//   cert: readFile(RNFS.MainBundlePath + '/tls_certs/cert.pem'),
// };

export const TCPProvider: FC<{children: React.ReactNode}> = ({children}) => {
  const [server, setServer] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [serverSocket, setServerSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [sentFiles, setSentFiles] = useState<any>([]);
  const [receivedFiles, setReceivedFiles] = useState<any>([]);
  const [totalSentBytes, setTotalSentBytes] = useState<number>(0);
  const [totalReceivedBytes, setTotalReceivedBytes] = useState<number>(0);

  const {currentChunkSet, setCurrentChunkSet, setChunkStore} = useChunkStore();

  const disconnect = useCallback(() => {
    if (client) client.destroy();
    if (server) server.close();

    setReceivedFiles([]);
    setSentFiles([]);
    setCurrentChunkSet(null);
    setTotalReceivedBytes(0);
    setChunkStore(null);
    setIsConnected(false);
  }, [client, server]);

  const startServer = useCallback(
    (port: number) => {
      console.log('startServer port', port);
      console.log('startServer server', server);
      if (server) {
        console.log('Server already running');
        return;
      }

      // const newServer = TcpSocket.createTLSServer(options, socket => {
      //   console.log('pallaviiii');
      //   console.log('Client connected', socket.address());

      //   setServerSocket(socket);
      //   socket.setNoDelay(true);
      //   socket.readableHighWaterMark = 1024 * 1024;
      //   socket.writableHighWaterMark = 1024 * 1024;

      //   socket.on('data', async data => {
      //     const parsedData = JSON.parse(data?.toString());

      //     if (parsedData?.event === 'connect') {
      //       setIsConnected(true);
      //       setConnectedDevice(parsedData?.deviceName);
      //     }

      //     if (parsedData?.event === 'file_ack') {
      //       receivedFileAck(parsedData?.file, socket, setReceivedFiles);
      //     }

      //     if (parsedData?.event === 'send_chunk_ack') {
      //       sendChunkAck(
      //         parsedData?.chunkNo,
      //         socket,
      //         setTotalSentBytes,
      //         setSentFiles,
      //       );
      //     }

      //     if (parsedData?.event === 'receive_chunk_ack') {
      //       receiveChunkAck(
      //         parsedData?.chunk,
      //         parsedData?.chunkNo,
      //         socket,
      //         setTotalReceivedBytes,
      //         generateFile,
      //       );
      //     }
      //   });

      //   socket.on('close', () => {
      //     console.log('Client disconnected');
      //     disconnect();
      //   });

      //   socket.on('error', err => console.error('Socket error', err));
      // });

      const testServer = TcpSocket.createServer(socket => {
        console.log('Client connected!');
        socket.on('data', data => {
          console.log('Received:', data.toString());
        });

        // socket.write('Hello from server!\n');
        // socket.write(
        //   JSON.stringify({event: 'file_ack', file: fileMeta}) + '\n',
        // );

        console.log('pallaviiii');
        console.log('Client connected', socket.address());

        setServerSocket(socket);
        socket.setNoDelay(true);
        socket.readableHighWaterMark = 1024 * 1024;
        socket.writableHighWaterMark = 1024 * 1024;

        socket.on('data', async data => {
          try {
            const parsedData = JSON.parse(data?.toString());

            if (parsedData?.event === 'connect') {
              setIsConnected(true);
              setConnectedDevice(parsedData?.deviceName);
            }

            if (parsedData?.event === 'file_ack') {
              receivedFileAck(parsedData?.file, socket, setReceivedFiles);
            }

            if (parsedData?.event === 'send_chunk_ack') {
              console.log('startServer send_chunk_ack', parsedData);
              sendChunkAck(
                parsedData?.chunkNo,
                socket,
                setTotalSentBytes,
                setSentFiles,
              );
            }

            if (parsedData?.event === 'receive_chunk_ack') {
              receiveChunkAck(
                parsedData?.chunk,
                parsedData?.chunkNo,
                socket,
                setTotalReceivedBytes,
                generateFile,
              );
            }
          } catch (error) {
            console.error('start server puneet :', error);
          }
        });

        socket.on('close', () => {
          console.log('Client disconnected');
          disconnect();
        });

        socket.on('error', err => console.error('Socket error', err));
      });

      testServer.listen({port: 4000, host: '0.0.0.0'}, () => {
        console.log('Test server running');
        const address = testServer.address();
        console.log(`Server running on ${address?.address}:${address?.port}`);
        setServer(testServer);
      });
      console.log('laliiitiititi');

      // newServer.listen({port, host: '0.0.0.0'}, () => {
      //   console.log('hemanttttt server listen');
      //   const address = newServer.address();
      //   console.log(`Server running on ${address?.address}:${address?.port}`);
      //   setServer(newServer);
      // });
    },
    [server, disconnect],
  );

  // const connectToServer = useCallback(
  //   (host: string, port: number, deviceName: string) => {
  //     const newClient = TcpSocket.connectTLS(
  //       {
  //         host,
  //         port,
  //         cert: true,
  //         ca: require('../../tls_certs/server-cert.pem'),
  //       },
  //       () => {
  //         setIsConnected(true);
  //         setConnectedDevice(deviceName);
  //         const myDeviceName = DeviceInfo.getDeviceNameSync();
  //         newClient.write(
  //           JSON.stringify({event: 'connect', deviceName: myDeviceName}),
  //         );
  //       },
  //     );

  //     newClient.setNoDelay(true);
  //     newClient.readableHighWaterMark = 1024 * 1024;
  //     newClient.writableHighWaterMark = 1024 * 1024;

  //     newClient.on('data', async data => {
  //       const parsedData = JSON.parse(data?.toString());

  //       if (parsedData?.event === 'file_ack') {
  //         receivedFileAck(parsedData?.file, newClient, setReceivedFiles);
  //       }

  //       if (parsedData?.event === 'send_chunk_ack') {
  //         sendChunkAck(
  //           parsedData?.chunkNo,
  //           newClient,
  //           setTotalSentBytes,
  //           setSentFiles,
  //         );
  //       }

  //       if (parsedData?.event === 'receive_chunk_ack') {
  //         receiveChunkAck(
  //           parsedData?.chunk,
  //           parsedData?.chunkNo,
  //           newClient,
  //           setTotalReceivedBytes,
  //           generateFile,
  //         );
  //       }
  //     });

  //     newClient.on('close', () => {
  //       console.log('Connection closed');
  //       disconnect();
  //     });

  //     // newClient.on('error', err => console.error('Client error', err));
  //     newClient.on('error', err => console.log('Client error', err));

  //     setClient(newClient);
  //   },
  //   [disconnect],
  // );

  //   const connectToServer = useCallback(
  //   (host: string, port: number, deviceName: string) => {
  //     console.log(`Attempting connection to ${host}:${port}`);

  //     const newClient = TcpSocket.connect({ host, port }, () => {
  //       console.log('Connected to server');
  //       setIsConnected(true);
  //       setConnectedDevice(deviceName);

  //       const myDeviceName = DeviceInfo.getDeviceNameSync();
  //       newClient.write(
  //         JSON.stringify({ event: 'connect', deviceName: myDeviceName }),
  //       );
  //     });

  //     newClient.setNoDelay(true);
  //     newClient.readableHighWaterMark = 1024 * 1024;
  //     newClient.writableHighWaterMark = 1024 * 1024;

  //     newClient.on('data', async data => {
  //       const parsedData = JSON.parse(data?.toString());

  //       if (parsedData?.event === 'file_ack') {
  //         receivedFileAck(parsedData?.file, newClient, setReceivedFiles);
  //       }

  //       if (parsedData?.event === 'send_chunk_ack') {
  //         sendChunkAck(parsedData?.chunkNo, newClient, setTotalSentBytes, setSentFiles);
  //       }

  //       if (parsedData?.event === 'receive_chunk_ack') {
  //         receiveChunkAck(parsedData?.chunk, parsedData?.chunkNo, newClient, setTotalReceivedBytes, generateFile);
  //       }
  //     });

  //     newClient.on('close', () => {
  //       console.log('Client connection closed');
  //       disconnect();
  //     });

  //     newClient.on('error', err => {
  //       console.log('Client error:', err);
  //     });

  //     setClient(newClient);
  //   },
  //   [disconnect],
  // );
  const connectToServer = useCallback(
    (host: string, port: number, deviceName: string) => {
      console.log(`Attempting connection to ${host}:${port}`);

      const newClient = TcpSocket.connect({host, port}, () => {
        console.log('Connected to server');
        setIsConnected(true);
        setConnectedDevice(deviceName);

        const myDeviceName = DeviceInfo.getDeviceNameSync();
        newClient.write(
          JSON.stringify({event: 'connect', deviceName: myDeviceName}),
        );
      });

      newClient.setNoDelay(true);
      newClient.readableHighWaterMark = 1024 * 1024;
      newClient.writableHighWaterMark = 1024 * 1024;

      let buffer = '';

      newClient.on('data', async data => {
        buffer += data.toString();

        let lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial chunk

        for (let line of lines) {
          try {
            if (!line.trim()) continue;

            const parsedData = JSON.parse(line);
            console.log('parsed data connectToServer', parsedData);

            if (parsedData?.event === 'file_ack') {
              receivedFileAck(parsedData?.file, newClient, setReceivedFiles);
            }

            if (parsedData?.event === 'send_chunk_ack') {
              console.log('connectToServer send_chunk_ack', parsedData);
              sendChunkAck(
                parsedData?.chunkNo,
                newClient,
                setTotalSentBytes,
                setSentFiles,
              );
            }

            if (parsedData?.event === 'receive_chunk_ack') {
              receiveChunkAck(
                parsedData?.chunk,
                parsedData?.chunkNo,
                newClient,
                setTotalReceivedBytes,
                generateFile,
              );
            }
          } catch (err) {
            console.log('connectToServer JSON parse error:', err);
          }
        }
      });

      // newClient.on('data', async data => {
      //   try {
      //     const parsedData = JSON.parse(data?.toString());
      //     console.log('parsed daata connectToServer', parsedData);

      //     if (parsedData?.event === 'file_ack') {
      //       receivedFileAck(parsedData?.file, newClient, setReceivedFiles);
      //     }

      //     if (parsedData?.event === 'send_chunk_ack') {
      //       sendChunkAck(
      //         parsedData?.chunkNo,
      //         newClient,
      //         setTotalSentBytes,
      //         setSentFiles,
      //       );
      //     }

      //     if (parsedData?.event === 'receive_chunk_ack') {
      //       receiveChunkAck(
      //         parsedData?.chunk,
      //         parsedData?.chunkNo,
      //         newClient,
      //         setTotalReceivedBytes,
      //         generateFile,
      //       );
      //     }
      //   } catch (error) {
      //     console.log('connectToServer puneet', error);
      //   }
      // });

      newClient.on('close', () => {
        console.log('Client connection closed');
        disconnect();
      });

      newClient.on('error', err => {
        console.log('Client error:', err);
      });

      setClient(newClient);
    },
    [disconnect],
  );

  const generateFile = async () => {
    const {chunkStore, resetChunkStore} = useChunkStore.getState();

    // if (
    //   !chunkStore ||
    //   chunkStore.totalChunks !== chunkStore.currentChunk.length
    // ) {
    //   console.error('Incomplete chunk store');
    //   return;
    // }
    if (
      !chunkStore ||
      chunkStore.totalChunks !== chunkStore.chunkArray.length
    ) {
      return;
    }
    try {
      const combinedChunks = Buffer.concat(chunkStore.chunkArray);
      const path =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${chunkStore.name}`
          : `${RNFS.DownloadDirectoryPath}/${chunkStore.name}`;

      await RNFS.writeFile(path, combinedChunks.toString('base64'), 'base64');

      setReceivedFiles(prev =>
        produce(prev, draft => {
          const index = draft.findIndex(f => f.id === chunkStore.id);
          if (index !== -1) {
            draft[index] = {...draft[index], uri: path, available: true};
          }
        }),
      );

      console.log('File saved ✅', path);
      resetChunkStore();
    } catch (error) {
      console.error('Error writing file:', error);
    }
  };

  const sendMessage = useCallback(
    (message: string | Buffer) => {
      const socket = client || serverSocket;
      if (socket) {
        socket.write(JSON.stringify(message));
        console.log('Sent message:', message);
      } else {
        console.log('No active socket');
      }
    },
    [client, serverSocket],
  );

  const sendFileAck = async (file: any, type: 'file' | 'image') => {
    if (currentChunkSet) {
      Alert.alert('Wait for current file to be sent');
      return;
    }

    const path =
      Platform.OS === 'ios' ? file?.uri?.replace('file://', '') : file?.uri;
    const fileData = await RNFS.readFile(path, 'base64');
    const buffer = Buffer.from(fileData, 'base64');

    const chunkSize = 1024 * 8;
    const chunkArray = [];
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      chunkArray.push(buffer.slice(offset, offset + chunkSize));
    }

    const fileMeta = {
      id: uuidv4(),
      name: type === 'file' ? file?.name : file?.fileName,
      size: type === 'file' ? file?.size : file?.fileSize,
      mimeType: type === 'file' ? 'file' : 'jpg',
      totalChunks: chunkArray.length,
    };

    setCurrentChunkSet({
      id: fileMeta.id,
      chunkArray,
      totalChunks: chunkArray.length,
    });

    setSentFiles(prev =>
      produce(prev, draft => {
        draft.push({...fileMeta, uri: file.uri});
      }),
    );

    const socket = client || serverSocket;
    if (!socket) return;

    try {
      console.log('Sending file ACK...');
      socket.write(JSON.stringify({event: 'file_ack', file: fileMeta}) + '\n');
    } catch (error) {
      console.log('Error sending file ACK', error);
    }
  };

  return (
    <TCPContext.Provider
      value={{
        server,
        client,
        isConnected,
        connectedDevice,
        sentFiles,
        receivedFiles,
        totalSentBytes,
        totalReceivedBytes,
        startServer,
        connectToServer,
        disconnect,
        sendMessage,
        sendFileAck,
      }}>
      {children}
    </TCPContext.Provider>
  );
};
