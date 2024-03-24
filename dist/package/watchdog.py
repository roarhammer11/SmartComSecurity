from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import asyncio


class WatchdogHandler(FileSystemEventHandler):
    def __init__(self, conn, socket):
        self.conn = conn
        self.modifiedRow = None
        self.socket = socket

    def on_modified(self, event):
        if event.src_path.endswith(".db") and self.socket.connected_client != None:
            cursor = self.conn.execute(
                "SELECT hashId, fileData, fileId, fileName FROM files ORDER BY timestamp DESC LIMIT 1;"
            )
            last_index = self.conn.execute("SELECT COUNT(*) FROM files;").fetchall()[0]
            self.modifiedRow = cursor.fetchall()[0]
            # Sends the fileId of the changed row to the client
            if self.modifiedRow[0] != last_index[0]:
                loop = asyncio.new_event_loop()

                # if type(self.modifiedRow[1]) == str:
                #     self.modifiedRow[1] = str.encode(self.modifiedRow)
                loop.run_until_complete(
                    self.socket.notify_client(
                        {
                            "id": "on_modified",
                            "hashId": self.modifiedRow[0],
                            "fileData": (
                                self.modifiedRow[1].hex()
                                if type(self.modifiedRow[1]) != str
                                else str.encode(self.modifiedRow[1]).hex() 
                            ),
                            "fileId": self.modifiedRow[2],
                            "fileName": self.modifiedRow[3],
                        }
                    )
                )


class WatchdogThread:
    def __init__(self, target_folder_path, conn, socket):
        self.observer = Observer()
        self.target_folder_path = target_folder_path
        self.conn = conn
        self.event_handler = None
        self.socket = socket

    def start(self):
        self.event_handler = WatchdogHandler(self.conn, self.socket)
        self.observer.schedule(
            self.event_handler, self.target_folder_path, recursive=True
        )
        print(f"Starting the folder monitoring for {self.target_folder_path}")
        self.observer.start()

    def stop(self):
        self.observer.stop()
        print(f"Stopping the folder monitoring for {self.target_folder_path}")
        self.observer.join()
