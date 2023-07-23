import { AppSupervisor, Gateway } from '@nocobase/server';
import net from 'net';

const writeJSON = (socket, data) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export function reportStatus() {
  if (process.env.MAIN_PROCESS_SOCKET_PATH) {
    const mainProcessRPCClient = net.createConnection({
      path: process.env.MAIN_PROCESS_SOCKET_PATH,
    });

    const handleClientMessage = ({ type, payload }) => {
      if (type == 'requestConnectionTags') {
        const connectedApp = Gateway.getInstance().appSelector({
          url: payload.url,
          headers: payload.headers,
        });

        writeJSON(mainProcessRPCClient, {
          type: 'responseConnectionTags',
          payload: {
            connectionId: payload.id,
            tags: [`app:${connectedApp}`],
          },
        });
      }

      if (type == 'startListen') {
        const { port } = payload;
        const gateway = Gateway.getInstance();
        gateway.start({
          port,
          callback() {
            writeJSON(mainProcessRPCClient, {
              type: 'listenStarted',
              payload: {
                address: gateway.server.address(),
              },
            });
          },
        });
      }
    };

    const afterSelectorChanged = () => {
      writeJSON(mainProcessRPCClient, {
        type: 'needRefreshTags',
      });
    };

    const appSupervisor = AppSupervisor.getInstance();

    const gateway = Gateway.getInstance({
      afterCreate: () => {
        afterSelectorChanged();

        writeJSON(mainProcessRPCClient, {
          type: 'gatewayCreated',
        });
      },
    });

    appSupervisor.on('workingMessageChanged', ({ appName, message }) => {
      writeJSON(mainProcessRPCClient, {
        type: 'appStatusChanged',
        payload: {
          appName,
          workingMessage: message,
        },
      });
    });

    gateway.on('appSelectorChanged', () => {
      afterSelectorChanged();
    });

    mainProcessRPCClient.on('data', (data) => {
      const dataAsString = data.toString();

      const messages = dataAsString.split('\n');

      for (const message of messages) {
        if (message.length === 0) {
          continue;
        }

        const dataObj = JSON.parse(message);
        handleClientMessage(dataObj);
      }
    });

    // report uncaught errors
    process.on('uncaughtException', (err) => {
      console.error(err);

      writeJSON(mainProcessRPCClient, {
        type: 'workerError',
        payload: {
          errorMessage: err.message,
        },
      });

      process.exit(1);
    });

    process.on('exit', (code) => {
      Gateway.getInstance().close();

      if (code == 100) {
        writeJSON(mainProcessRPCClient, {
          type: 'workerRestart',
        });
      } else {
        writeJSON(mainProcessRPCClient, {
          type: 'workerExit',
        });
      }
    });
  }
}
