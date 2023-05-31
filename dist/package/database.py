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
            this.conn.setupdatehook(this.__my_update_hook)
        except Exception as e:
            print(e)

    def insertFile(
        this, metamaskAddress: str, fileData: bytes, fileName: str, hashId: int
    ):  # Inserts file to the database
        this.__createTables()
        query = """INSERT INTO Files(hashId, metamaskAddress, fileName, fileData)
                VALUES(?,?,?,?)"""
        cursor = this.conn.cursor()
        # hashId = this.__dynamicallyAllocateHashId(metamaskAddress)
        tupleData = (hashId, metamaskAddress, fileName, fileData)
        try:
            cursor.execute(query, tupleData)
            this.conn.commit()
        except Error as e:
            print(e)

    def getFile(
        this, hashId: int, metamaskAddress: str
    ):  # Saves file to a certain location
        fileData = this.__getFileData(hashId, metamaskAddress)
        fileName = this.__getFileName(hashId, metamaskAddress)
        result = {"file-data": fileData, "file-name": fileName}
        return result

    def renderFiles(this, metamaskAddress: str):
        numberOfFiles = this.__getNumberOfFiles(metamaskAddress)
        hashId = this.__getHashIdOfFiles(metamaskAddress)
        renderFiles = {"number-of-files": numberOfFiles, "hashId": hashId}
        for x in range(0, numberOfFiles):
            renderFiles[x] = this.__getFileName(hashId[x][0], metamaskAddress)
        return renderFiles

    # private functions

    def __createTables(this):
        query = """CREATE TABLE IF NOT EXISTS Files(
                fileId integer PRIMARY KEY AUTOINCREMENT,
                hashId integer NOT NULL,
                metamaskAddress varchar NOT NULL,
                fileName varchar NOT NULL,
                fileData blob NOT NULL
                );"""
        try:
            cursor = this.conn.cursor()
            cursor.execute(query)
        except Error as e:
            print(e)

    # def __getBinaryData(this, filePath):
    #     print(filePath)
    #     try:
    #         with open(filePath, 'rb') as file:
    #             binaryData = file.read()
    #     except Exception as e:
    #         print(e)
    #     return binaryData

    # def __dynamicallyAllocateHashId(this, metamaskAddress: str):
    #     conn = this.__connectDatabase()
    #     cursor = conn.cursor()
    #     try:
    #         cursor.execute("SELECT COUNT(metamaskAddress) FROM Files WHERE metamaskAddress = ?",(metamaskAddress,))
    #         result = cursor.fetchall()
    #         parsedResult = result[0][0]
    #     except Error as e:
    #         print(e)
    #     finally:
    #         conn.close()
    #     return parsedResult

    def __getFileData(this, hashId: int, metamaskAddress: str):
        cursor = this.conn.cursor()
        try:
            cursor.execute(
                "SELECT fileData FROM Files WHERE metamaskAddress = ? AND hashId = ?",
                (metamaskAddress, hashId),
            )
            # print(hashId)
            # print(metamaskAddress)
            result = cursor.fetchall()
            # print(result)
            parsedResult = result[0][0]
        except Error as e:
            print(e)
        return parsedResult

    def __getFileName(this, hashId: int, metamaskAddress: str):
        cursor = this.conn.cursor()
        try:
            cursor.execute(
                "SELECT fileName FROM Files WHERE metamaskAddress = ? AND hashId = ?",
                (metamaskAddress, hashId),
            )
            # print(hashId)
            # print(metamaskAddress)
            result = cursor.fetchall()
            # print(result)
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

    def __my_update_hook(type: int, db_name: str, table_name: str, rowid: int) -> None:
        op: str = apsw.mapping_authorizer_function[type]
        print(f"Updated: { op } db { db_name }, table { table_name }, rowid { rowid }")


# endregion

# TODO fix hook
