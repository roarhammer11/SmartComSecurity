# region Imports
import apsw
from sqlite3 import Error
import os

# endregion


# region Functions
class Database:
    # public functions
    def __init__(this):
        currentPath = os.path.abspath(os.getcwd())
        try:
            os.mkdir(currentPath + r"\database")
        except:
            ...
        databasePath = currentPath + r"\database\files.db"
        try:
            this.conn = apsw.Connection(databasePath)
            this.__createTables()
        except Exception as e:
            print(e)

    def insertFile(
        this, metamaskAddress: str, fileData: bytes, fileName: str, hashId: int
    ):
        query = """INSERT INTO Files(hashId, metamaskAddress, fileName, fileData)
                VALUES(?,?,?,?)"""
        cursor = this.conn.cursor()
        tupleData = (hashId, metamaskAddress, fileName, fileData)
        try:
            cursor.execute(query, tupleData)
            this.conn.commit()
        except Error as e:
            print(e)

    def getFile(this, hashId: int, metamaskAddress: str):
        fileData = this.__getFileData(hashId, metamaskAddress)
        fileName = this.getFileName(hashId, metamaskAddress)
        result = {"file-data": fileData, "file-name": fileName}
        return result

    def renderFiles(this, metamaskAddress: str):
        numberOfFiles = this.__getNumberOfFiles(metamaskAddress)
        hashId = this.__getHashIdOfFiles(metamaskAddress)
        renderFiles = {"number-of-files": numberOfFiles, "hashId": hashId}
        for x in range(0, numberOfFiles):
            renderFiles[x] = this.getFileName(hashId[x][0], metamaskAddress)
        return renderFiles

    # private functions

    def __createTables(this):
        query = """CREATE TABLE IF NOT EXISTS Files(
                fileId integer PRIMARY KEY AUTOINCREMENT,
                hashId integer NOT NULL,
                metamaskAddress varchar NOT NULL,
                fileName varchar NOT NULL,
                fileData blob NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                modified BOOLEAN DEFAULT FALSE
                );"""
        try:
            cursor = this.conn.cursor()
            cursor.execute(query)
            cursor.execute(
                "CREATE TRIGGER IF NOT EXISTS update_timestamp_trigger AFTER UPDATE On files BEGIN UPDATE files SET timestamp = CURRENT_TIMESTAMP, modified = TRUE WHERE fileId = NEW.fileId; END;"
            )
        except Error as e:
            print(e)

    def __getFileData(this, hashId: int, metamaskAddress: str):
        cursor = this.conn.cursor()
        try:
            cursor.execute(
                "SELECT fileData FROM Files WHERE metamaskAddress = ? AND hashId = ?",
                (metamaskAddress, hashId),
            )
            result = cursor.fetchall()
            parsedResult = result[0][0]
        except Error as e:
            print(e)
        return parsedResult

    def getFileName(this, hashId: int, metamaskAddress: str):
        cursor = this.conn.cursor()
        try:
            cursor.execute(
                "SELECT fileName FROM Files WHERE metamaskAddress = ? AND hashId = ?",
                (metamaskAddress, hashId),
            )
            result = cursor.fetchall()
            parsedResult = result[0][0]
        except Error as e:
            print(e)
        return parsedResult

    def __getNumberOfFiles(this, metamaskAddress: str):
        cursor = this.conn.cursor()
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM Files WHERE metamaskAddress = ?",
                (metamaskAddress,),
            )
            result = cursor.fetchall()
            parsedResult = result[0][0]
        except Error as e:
            print(e)
        return parsedResult

    def __getHashIdOfFiles(this, metamaskAddress: str):
        cursor = this.conn.cursor()
        try:
            cursor.execute(
                "SELECT hashId FROM Files WHERE metamaskAddress = ?", (metamaskAddress,)
            )
            result = cursor.fetchall()
        except Error as e:
            print(e)
        return result


# endregion
