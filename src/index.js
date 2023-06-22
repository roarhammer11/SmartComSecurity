//#region Imports
import MetaMaskOnboarding from "@metamask/onboarding";
import _ from "lodash";
import {Buffer} from "buffer";
import {ethers} from "ethers";
import {sha256} from "ethers/lib/utils";
import {createWriteStream} from "streamsaver";
import {decode} from "base64-arraybuffer";
//import "./blockchain.js";
//#endregion
// Main Network : https://api.bscscan.com/
let apiKey = "JCB3TX7R3DYBU6EQZEDN8QDWH6SFGCSY95";
let contractAddress = "0x8B13e5cdA78fE99000E662278C5345dCeE7e689E";
//#region Global Variables
const {isMetaMaskInstalled} = MetaMaskOnboarding;
const connectButton = document.getElementById("connectButton");
const selectFile = document.getElementById("selectFile");
const uploadFormSubmit = document.getElementById("uploadFormSubmit");
const uploadFileButton = document.getElementById("uploadFileButton");
const uploadMetamaskAddressButton = document.getElementById("metamaskAddress");
const showFiles = document.getElementById("showFiles");
const provider = document.getElementById("connectedProvider");
const accountAddress = document.getElementById("accountAddress");
const modalButton = document.getElementById("modalButton");
const metamaskInstallButton = document.getElementById("metamask");
const networkAlertButton = document.getElementById("networkAlert");
const mathWalletInstallButton = document.getElementById("mathWallet");
const binanceWalletInstallButton = document.getElementById("binanceWallet");
const notConnected = document.getElementById("notConnected");
const storeData = document.getElementById("storeData");
const retrieveData = document.getElementById("retrieveData");
const transaction = document.getElementById("transaction");
const paginationElement = document.getElementById("pagination");
const transactionTableElement = document.getElementById("transaction-table");
const injected = window.ethereum;
let currentAccount;
let onboarding;
//#endregion

//#region Initialization
const initialize = async () => {
  initializeWebSocket();
  notConnected.style.display = "none";
  try {
    onboarding = new MetaMaskOnboarding();
  } catch (error) {
    alert(error.message);
  }

  metamaskInstallButton.onclick = () => {
    if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
      onboarding.startOnboarding();
    }
    window.location.reload();
  };

  mathWalletInstallButton.onclick = () => {
    redirectPage(
      "https://chrome.google.com/webstore/detail/math-wallet/afbcbjpbpfadlkmhmclhkeeodmamcflc"
    );
    window.location.reload();
  };

  binanceWalletInstallButton.onclick = () => {
    redirectPage(
      "https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp"
    );
    window.location.reload();
  };

  connectButton.onclick = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        let accounts = await ethereum.request({method: "eth_requestAccounts"});
        currentAccount = accounts[0];
        accountAddress.innerHTML = currentAccount;
        providerCheckHandler();
        checkNetwork();
        notConnected.style.display = "none";
      } catch (error) {
        alert(error.message);
      }
    } else {
      modalButton.click();
    }
  };

  selectFile.onclick = async () => {
    uploadMetamaskAddressButton.value = currentAccount;
    uploadFileButton.click();
    uploadFileButton.onchange = (e) => {
      uploadFormSubmit.click();
    };
  };
  if (injected != null) {
    ethereum.autoRefreshOnNetworkChange = false;
    networkAlertButton.onclick = () => {
      redirectPage("https://chainlist.org");
    };
    try {
      const newAccounts = await ethereum.request({
        method: "eth_accounts",
      });
      accountHandler(newAccounts);
      providerCheckHandler();
    } catch (error) {
      alert(error);
    }
    const chainId = await checkNetwork();
    ethereum.on("chainChanged", (chain) => {
      chainNetworkHandler(chain);
    });

    retrieveData.onclick = async () => {
      if (
        injected.selectedAddress !== null &&
        !retrieveData.classList.contains("active")
      ) {
        retrieveData.classList.add("active");
        storeData.classList.remove("active");
        transaction.classList.remove("active");
        transactionTableElement.style.display = "none";
        selectFile.style.display = "none";
        renderFiles();
        // while (transactionTableElement.hasChildNodes()) {
        //   transactionTableElement.removeChild(transactionTableElement.firstChild);
        // }
      }
    };

    storeData.onclick = async () => {
      if (injected.selectedAddress !== null) {
        retrieveData.classList.remove("active");
        transaction.classList.remove("active");
        transactionTableElement.style.display = "none";
        showFiles.style.display = "none";
        selectFile.click();
        paginationElement.style.display = "none";
        while (showFiles.hasChildNodes()) {
          showFiles.removeChild(showFiles.firstChild);
        }
        // while (transactionTableElement.hasChildNodes()) {
        //   transactionTableElement.removeChild(transactionTableElement.firstChild);
        // }
      }
    };

    transaction.onclick = async () => {
      if (
        injected.selectedAddress !== null &&
        !transaction.classList.contains("active")
      ) {
        retrieveData.classList.remove("active");
        storeData.classList.remove("active");
        transaction.classList.add("active");
        transactionTableElement.style.display = "revert";
        showFiles.style.display = "none";
        selectFile.style.display = "none";
        paginationElement.style.display = "block";
        retrieveTransactions(contractAddress, chainId, currentAccount);
        while (showFiles.hasChildNodes()) {
          showFiles.removeChild(showFiles.firstChild);
        }
      }
    };
  }

  if (injected.selectedAddress === null) {
    notConnected.style.display = "block";
  }
  console.log(currentAccount);
};

window.addEventListener("load", initialize);

$("#uploadForm").submit(async function (e) {
  e.preventDefault();
  const file = uploadFileButton.files;
  const formData = new FormData();
  formData.append("metamaskAddress", $("#metamaskAddress").val().trim());
  for (const f of file) {
    formData.append("uploadFile", f);
  }
  const contract = await getSmartContract(contractAddress);
  const currentIndex = await getCurrentFileIndex(contract);
  formData.append("fileIndex", currentIndex);
  convertFileToHex(file, contract, formData);
});

//functions
//converts file to hexadecimal format
function convertFileToHex(file, contract, formData) {
  var reader = new FileReader();
  reader.addEventListener("load", async function () {
    var hexaDecimalString = ethers.utils.hexlify(new Uint8Array(this.result));
    console.log("Hex File: " + hexaDecimalString);
    getSaltedHashValue(hexaDecimalString, contract, formData);
  });
  reader.readAsArrayBuffer(file[0]);
}
function renderFiles() {
  const formData = new FormData();
  formData.append("metamaskAddress", currentAccount);
  fetch("/dashboard/render-files", {method: "POST", body: formData})
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      let filesToLoad = 10;
      let paginationCount = 1;
      for (let x = 0; x < data["number-of-files"]; x++) {
        const fileContainer = document.createElement("div");
        const fileName = document.createElement("p");
        const image = Object.assign(document.createElement("img"), {
          src: "https://via.placeholder.com/150",
        });
        image.setAttribute("data-hash-id", data["hashId"][x]);
        image.setAttribute("data-metamask-address", currentAccount);
        image.setAttribute("class", "renderedFile");
        fileName.innerHTML = data[x];
        if (x != 0 && x % filesToLoad == 0) {
          paginationCount++;
        }
        // fileContainer.setAttribute("class", "f-" + pagination);
        if (paginationCount > 1) {
          fileContainer.setAttribute("class", "f-" + paginationCount);
          fileContainer.style.display = "none";
        } else {
          fileContainer.setAttribute(
            "class",
            "d-flex flex-wrap flex-column m-5 active f-" + paginationCount
          );
        }
        image.style.maxHeight = "150px";
        image.style.maxWidth = "150px";
        fileContainer.style.width = "150px";
        image.style.cursor = "pointer";
        fileName.style.cursor = "pointer";
        fileContainer.appendChild(image);
        fileContainer.appendChild(fileName);
        showFiles.style.display = "block";
        showFiles.appendChild(fileContainer);
      }
      pagination(showFiles, paginationCount);
      console.log(showFiles);
      var files = document.querySelectorAll("img.renderedFile");
      for (let q = 0; q < files.length; q++) {
        files[q].addEventListener("click", getFiles);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function pagination(files, paginationCount) {
  paginationElement.style.display = "block";
  while (paginationElement.hasChildNodes()) {
    paginationElement.removeChild(paginationElement.firstChild);
  }
  const element = createPagniationLinks();
  for (let i = 1; i <= paginationCount; i++) {
    const paginationList = document.createElement("li");
    const paginationLink = document.createElement("a");
    if (i == 1) {
      paginationList.setAttribute("class", "page-item active");
    } else {
      paginationList.setAttribute("class", "page-item");
    }
    paginationLink.setAttribute("class", "page-link");
    paginationLink.setAttribute("href", "#");
    paginationLink.innerHTML = i;
    paginationList.appendChild(paginationLink);
    if (element.childElementCount - 2 < paginationCount) {
      element.insertBefore(paginationList, element.lastElementChild);
    }
    if (files.tagName == "DIV") {
      paginationList.addEventListener("click", setFilesActive);
    } else {
      paginationList.addEventListener("click", setTransactionActive);
    }
    console.log(files.tagName);
    paginationList.files = files;
  }
  paginationArrowHandler(element);
  paginationElement.appendChild(element);
}

function paginationArrowHandler(element) {
  const previous = element.firstChild;
  const next = element.lastElementChild;
  next.addEventListener("click", handleNextEventListener);
  next.element = element;

  previous.addEventListener("click", handlePreviousEventListener);
  previous.element = element;
}

function handleNextEventListener(e) {
  const activeElement = e.currentTarget.element.querySelector(".active");
  const nextElement = activeElement.nextElementSibling;
  if (nextElement.nextElementSibling != null) {
    if (nextElement.nextElementSibling.id == "next") {
      nextElement.click();
      next.classList.add("disabled");
    } else if (activeElement.previousElementSibling.id == "previous") {
      nextElement.click();
      previous.classList.remove("disabled");
    } else {
      nextElement.click();
    }
  }
}

function handlePreviousEventListener(e) {
  const activeElement = e.currentTarget.element.querySelector(".active");
  const previousElement = activeElement.previousElementSibling;
  if (previousElement.previousElementSibling != null) {
    if (previousElement.previousElementSibling.id == "previous") {
      previousElement.click();
      previous.classList.add("disabled");
    } else if (activeElement.nextElementSibling.id == "next") {
      previousElement.click();
      next.classList.remove("disabled");
    } else {
      previousElement.click();
    }
  }
}

function createPagniationLinks() {
  const container = document.createElement("ul");
  const previousLinkList = document.createElement("li");
  const nextLinkList = document.createElement("li");
  const previousLink = document.createElement("a");
  const nextLink = document.createElement("a");
  const previousIcon = document.createElement("span");
  const nextIcon = document.createElement("span");
  container.setAttribute("class", "pagination justify-content-center");
  previousLinkList.setAttribute("class", "page-item disabled");
  previousLinkList.setAttribute("id", "previous");
  nextLinkList.setAttribute("class", "page-item");
  nextLinkList.setAttribute("id", "next");
  previousLink.setAttribute("class", "page-link");
  previousLink.href = "#";
  previousLink.setAttribute("aria-label", "Previous");
  nextLink.setAttribute("class", "page-link");
  nextLink.href = "#";
  nextLink.setAttribute("aria-label", "Next");
  previousIcon.setAttribute("aria-hidden", "true");
  previousIcon.innerHTML = "&laquo;";
  nextIcon.setAttribute("aria-hidden", "true");
  nextIcon.innerHTML = "&raquo;";
  previousLink.appendChild(previousIcon);
  previousLinkList.appendChild(previousLink);
  nextLink.appendChild(nextIcon);
  nextLinkList.appendChild(nextLink);
  container.appendChild(previousLinkList);
  container.appendChild(nextLinkList);
  return container;
}

function setFilesActive(e) {
  const files = e.currentTarget.files;
  const clickedTab =
    e.target.tagName == "LI" ? e.target.lastElementChild : e.target;
  const activePaginationTab = e.currentTarget;
  const paginationList = e.currentTarget.parentElement;
  const activeFiles = files.querySelectorAll(".active");
  setPaginationLinkActive(activePaginationTab, paginationList);
  for (var i = 0; i < activeFiles.length; i++) {
    const fileClass = activeFiles[i].classList[5];
    activeFiles[i].removeAttribute("class");
    activeFiles[i].setAttribute("class", fileClass);
    activeFiles[i].style.display = "none";
  }
  const toActivateFiles = files.querySelectorAll(".f-" + clickedTab.innerHTML);
  for (var x = 0; x < toActivateFiles.length; x++) {
    toActivateFiles[x].setAttribute(
      "class",
      "d-flex flex-wrap flex-column m-5 active f-" + clickedTab.innerHTML
    );
  }
  console.log(files);
}

function setTransactionActive(e) {
  const files = e.currentTarget.files;
  const clickedTab =
    e.target.tagName == "LI" ? e.target.lastElementChild : e.target;
  const activePaginationTab = e.currentTarget;
  const paginationList = e.currentTarget.parentElement;
  console.log(paginationList);
  const activeFiles = files.querySelectorAll(".active");
  setPaginationLinkActive(activePaginationTab, paginationList);
  for (var i = 0; i < activeFiles.length; i++) {
    const fileClass = activeFiles[i].classList[1];
    activeFiles[i].removeAttribute("class");
    activeFiles[i].setAttribute("class", fileClass);
    activeFiles[i].style.display = "none";
  }
  const toActivateFiles = files.querySelectorAll(".f-" + clickedTab.innerHTML);
  for (var x = 0; x < toActivateFiles.length; x++) {
    toActivateFiles[x].setAttribute(
      "class",
      "active f-" + clickedTab.innerHTML
    );
    toActivateFiles[x].style.display = "revert";
  }
  console.log(files);
}

function setPaginationLinkActive(activePaginationTab, paginationList) {
  paginationList.querySelector(".active").classList.remove("active");
  activePaginationTab.setAttribute("class", "active");
  if (activePaginationTab.previousElementSibling.id == "previous") {
    document.getElementById("previous").classList.add("disabled");
    document.getElementById("next").classList.remove("disabled");
  } else if (activePaginationTab.nextElementSibling.id == "next") {
    document.getElementById("next").classList.add("disabled");
    document.getElementById("previous").classList.remove("disabled");
  } else {
    document.getElementById("previous").classList.remove("disabled");
    document.getElementById("next").classList.remove("disabled");
  }
}

function accountHandler(newAccount) {
  currentAccount = newAccount[0];
  accountAddress.innerHTML =
    typeof currentAccount !== "undefined" ? currentAccount : " ";
}

async function checkNetwork() {
  let chainId;
  try {
    chainId = await ethereum.request({
      method: "eth_chainId",
    });
    chainNetworkHandler(chainId);
  } catch (error) {
    alert(error.message);
  }
  return chainId;
}

function chainNetworkHandler(chainId) {
  if (currentAccount != null && chainId === "0x61") {
    networkAlertButton.style.display = "block";
    networkAlertButton.innerHTML =
      "You are connected to Binance Smart Chain Testnet";
  } else if (currentAccount != null && chainId !== "0x38") {
    networkAlertButton.style.display = "block";
  } else {
    networkAlertButton.style.display = "none";
  }
}

function providerCheckHandler() {
  if (
    isMetaMaskInstalled &&
    injected.isMetaMask &&
    !injected.isMathWallet &&
    window.BinanceChain == null
  ) {
    if (onboarding) {
      onboarding.stopOnboarding();
    }
    printProvider("Metamask Wallet");
  } else if (
    injected.isMetaMask &&
    injected.isMathWallet &&
    window.BinanceChain == null
  ) {
    printProvider("Math Wallet");
  } else if (
    !injected.isMetaMask &&
    !injected.isMathWallet &&
    window.BinanceChain
  ) {
    printProvider("Binance Chain Wallet");
  } else {
    printProvider("Other Wallet");
  }
}

function redirectPage(page) {
  window.open(page, "_blank").focus();
}

function printProvider(providerName) {
  if (currentAccount != null) {
    provider.innerHTML = "Connected via " + providerName;
  }
}

//gets files from the database
function getFiles() {
  const formData = new FormData();
  formData.append("hashId", this.dataset.hashId);
  formData.append("metamaskAddress", this.dataset.metamaskAddress);
  fetch("/dashboard/file-name", {method: "POST", body: formData}).then(
    (res) => {
      res.json().then((data) => {
        fetch("/dashboard/save-files", {method: "POST", body: formData}).then(
          (response) =>
            response.json().then((fileData) => {
              const blob = new Blob(
                [Buffer.from(decode(fileData["file-data"]))],
                {
                  type: "octet-stream",
                }
              );
              const readableStream = blob.stream();
              const fileStream = createWriteStream(data["file_name"], {
                size: blob.size,
              });
              console.log(data["file_name"]);
              window.writer = fileStream.getWriter();
              if (window.WritableStream && readableStream.pipeTo) {
                window.writer.releaseLock();
                return readableStream.pipeTo(fileStream);
              }
              const reader = readableStream.getReader();
              const pump = () =>
                reader
                  .read()
                  .then((res) =>
                    res.done
                      ? writer.close()
                      : writer.write(res.value).then(pump)
                  );
              pump();
            })
        );
      });
    }
  );
}

// function getFiles() {
//   const formData = new FormData();
//   formData.append("hashId", this.dataset.hashId);
//   formData.append("metamaskAddress", this.dataset.metamaskAddress);
//   fetch("/dashboard/file-name", {method: "POST", body: formData}).then(
//     (res) => {
//       res.json().then((data) => {
//         fetch("/dashboard/save-files", {method: "POST", body: formData}).then(
//           (response) =>
//             response.json().then((fileData) => {
//               const blob = new Blob(
//                 [Buffer.from(fileData["file-data"], "base64")],
//                 {
//                   type: "octet-stream",
//                 }
//               );
//               const readableStream = blob.stream();
//               const fileStream = createWriteStream(data["file_name"], {
//                 size: blob.size,
//               });
//               console.log(data["file_name"]);
//               window.writer = fileStream.getWriter();
//               if (window.WritableStream && readableStream.pipeTo) {
//                 window.writer.releaseLock();
//                 return readableStream.pipeTo(fileStream);
//               }

//               const reader = readableStream.getReader();
//               const pump = () =>
//                 reader
//                   .read()
//                   .then((res) =>
//                     res.done
//                       ? writer.close()
//                       : writer.write(res.value).then(pump)
//                   );

//               pump();
//             })
//         );
//       });
//     }
//   );
// }

async function getSaltedHashValue(file, contract, formData) {
  var randomPreviousBlockHash = await getRandomPreviousBlockHash(contract);
  let saltedHash = sha256(file + randomPreviousBlockHash.substring(2));
  console.log("Salted Hash: " + saltedHash);
  saveToBlockchain(saltedHash, randomPreviousBlockHash, contract, formData);
}

async function getSmartContract(contractAddress) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  var contractPromise = await fetch(
    "https://api-testnet.bscscan.com/api?module=contract&action=getabi&address=0x8B13e5cdA78fE99000E662278C5345dCeE7e689E&apikey=JCB3TX7R3DYBU6EQZEDN8QDWH6SFGCSY95"
  );
  var contractJson = await contractPromise.json();
  var smartCon = JSON.parse(contractJson.result);
  const signer = provider.getSigner();
  var contract = new ethers.Contract(contractAddress, smartCon, signer);
  return contract;
}

async function getCurrentFileIndex(contract) {
  const index = await contract.getCurrentIndex(accountAddress.innerHTML);
  console.log("Index of Salted Hash in blockchain: ", index.toNumber());
  return index;
}

async function getRandomPreviousBlockHash(contract) {
  const randomPreviousBlockHash = await contract.getRandomPreviousBlockHash(
    Math.floor(Math.random() * 9999999)
  );
  console.log("Previous Block Hash: " + randomPreviousBlockHash);
  return randomPreviousBlockHash;
}

async function saveToBlockchain(
  saltedHashValue,
  previousBlockHash,
  contract,
  formData
) {
  contract.StoreHash(saltedHashValue, previousBlockHash).then(() => {
    uploadFile(formData);
  });
}

function uploadFile(formData) {
  fetch("/dashboard/upload-files", {method: "POST", body: formData})
    .then((response) => response.json())
    .then((data) => {
      alert("Successfuly saved " + data.file_name + " to the database.");
      document.getElementById("uploadForm").reset();
    })
    .catch((error) => {
      console.log(error);
    });
}

// function getTransactions

async function retrieveTransactions(contractAddress, chainId, metamaskAddress) {
  let network =
    chainId === "0x38"
      ? "https://api.bscscan.com/api?"
      : "https://api-testnet.bscscan.com/api?";
  let query =
    network +
    "module=account&action=txlist&address=" +
    contractAddress +
    "&startblock=0&endblock=99999999&sort=desc&apikey=" +
    apiKey;

  let transaction = await fetch(query);
  let data = await transaction.json();
  const filteredTransaction = filterTransaction(data, metamaskAddress);
  console.log(transactionTableElement);
  console.log(filteredTransaction);
  let paginationCount;
  try {
    if (
      transactionTableElement.children["1"].childElementCount <
      filteredTransaction.length
    ) {
      transactionTableElement.removeChild(
        transactionTableElement.children["1"]
      );
      paginationCount = await createTransactionTable(filteredTransaction);
      sessionStorage.setItem("paginationCount", paginationCount);
      pagination(transactionTableElement.children["1"], paginationCount);
      document.getElementsByClassName("pagination")[0].children["1"].click();
    } else {
      pagination(
        transactionTableElement.children["1"],
        sessionStorage.getItem("paginationCount")
      );
      document.getElementsByClassName("pagination")[0].children["1"].click();
    }
  } catch (e) {
    paginationCount = await createTransactionTable(filteredTransaction);
    sessionStorage.setItem("paginationCount", paginationCount);
    pagination(transactionTableElement.children["1"], paginationCount);
  }
}

function filterTransaction(transactionData, metamaskAddress) {
  //Filters transaction according to account and storehash function
  var retVal = new Array();
  for (const x in transactionData["result"]) {
    if (
      transactionData["result"][x]["from"] === metamaskAddress &&
      transactionData["result"][x]["functionName"] ===
        "StoreHash(bytes32 hashValue,bytes32 previousBlockHash)"
    ) {
      retVal.push(transactionData["result"][x]);
    }
  }
  return retVal;
}

async function createTransactionTable(filteredTransaction) {
  const tBody = document.createElement("tbody");
  const bnbPrice = await retrieveBNBPriceinPHP();
  let filesToLoad = 14;
  let paginationCount = 1;
  for (const x in filteredTransaction) {
    const tRow = document.createElement("tr");
    const transactionHashCell = document.createElement("th");
    const transactionHashLink =
      "https://testnet.bscscan.com/tx/" + filteredTransaction[x]["hash"];
    const a = document.createElement("a");
    const timeStampCell = document.createElement("td");
    const blockCell = document.createElement("td");
    const blockNumberLink =
      "https://testnet.bscscan.com/block/" +
      filteredTransaction[x]["blockNumber"];
    const b = document.createElement("a");
    const transactionFeeCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const date = new Date(parseInt(filteredTransaction[x]["timeStamp"]) * 1000);
    const formattedDate =
      date.getHours() + ":" + date.getMinutes() + ", " + date.toDateString();

    transactionHashCell.setAttribute("scope", "row");
    a.setAttribute("href", "#");
    a.innerHTML = filteredTransaction[x]["hash"];
    a.onclick = () => {
      redirectPage(transactionHashLink);
    };
    transactionHashCell.appendChild(a);
    // transactionHashCell.innerHTML = filteredTransaction[x]["hash"];
    timeStampCell.innerHTML = formattedDate;
    // blockCell.innerHTML = filteredTransaction[x]["blockNumber"];
    b.setAttribute("href", "#");
    b.innerHTML = filteredTransaction[x]["blockNumber"];
    b.onclick = () => {
      redirectPage(blockNumberLink);
    };
    blockCell.appendChild(b);
    transactionFeeCell.innerHTML =
      ((filteredTransaction[x]["gasPrice"] *
        filteredTransaction[x]["gasUsed"]) /
        10 ** 18) *
      bnbPrice;
    statusCell.innerHTML =
      filteredTransaction[x]["txreceipt_status"] === "1" ? "OK" : "Error";
    tRow.appendChild(transactionHashCell);
    tRow.appendChild(timeStampCell);
    tRow.appendChild(blockCell);
    tRow.appendChild(transactionFeeCell);
    tRow.appendChild(statusCell);
    tBody.appendChild(tRow);
    if (x != 0 && x % filesToLoad == 0) {
      paginationCount++;
    }
    // fileContainer.setAttribute("class", "f-" + pagination);
    if (paginationCount > 1) {
      tRow.setAttribute("class", "f-" + paginationCount);
      tRow.style.display = "none";
    } else {
      tRow.setAttribute("class", "active f-" + paginationCount);
    }
  }
  transactionTableElement.appendChild(tBody);
  return paginationCount;
}

async function retrieveBNBPriceinPHP() {
  const query = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=php"
  );
  const bnbPriceResult = await query.json();
  return bnbPriceResult["binancecoin"]["php"];
}

function initializeWebSocket() {
  const socket = new WebSocket("ws://localhost:80/ws");

  // Handle WebSocket messages from the server
  socket.onmessage = function (event) {
    const message = event.data;
    console.log(`Received message from server: ${message}`);
  };
}
// StreamSaver can detect and use the Ponyfill that is loaded from the cdn.
//#endregion

//TODO create pagination of transaction
