//#region Imports
import MetaMaskOnboarding from "@metamask/onboarding";
import _ from "lodash";
import {Buffer} from "buffer";
import {ethers} from "ethers";
import {sha256} from "ethers/lib/utils";
//import "./blockchain.js";
//#endregion

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
const injected = window.ethereum;
let currentAccount;
let currentIndex;
let onboarding;
//#endregion

//#region Initialization
const initialize = async () => {
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
    checkNetwork();
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
        selectFile.style.display = "none";
        renderFiles();
      }
    };

    storeData.onclick = async () => {
      if (
        injected.selectedAddress !== null
        // !storeData.classList.contains("active")
      ) {
        retrieveData.classList.remove("active");
        // storeData.classList.add("active");
        transaction.classList.remove("active");
        showFiles.style.display = "none";
        // selectFile.style.display = "block";
        selectFile.click();
        paginationElement.style.display = "none";
        while (showFiles.hasChildNodes()) {
          showFiles.removeChild(showFiles.firstChild);
        }
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
        showFiles.style.display = "none";
        selectFile.style.display = "none";
        paginationElement.style.display = "none";
        while (showFiles.hasChildNodes()) {
          showFiles.removeChild(showFiles.firstChild);
        }
        test();
      }
    };
  }

  if (injected.selectedAddress === null) {
    notConnected.style.display = "block";
  }
  console.log(currentAccount);
};

window.addEventListener("load", initialize);

$("#uploadForm").submit(function (e) {
  e.preventDefault();
  const file = uploadFileButton.files;
  const formData = new FormData();
  formData.append("metamaskAddress", $("#metamaskAddress").val().trim());
  for (const f of file) {
    formData.append("uploadFile", f);
  }
  fetch("/dashboard/upload-files", {method: "POST", body: formData})
    .then((response) => response.json())
    .then((data) => {
      alert("Successfuly saved " + data.file_name + " to the database.");
      console.log(data);
    })
    .catch((error) => {
      console.log(error);
    });
});

//functions

function renderFiles() {
  const formData = new FormData();
  formData.append("metamaskAddress", currentAccount);
  fetch("/dashboard/render-files", {method: "POST", body: formData})
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      let filesToLoad = 10;
      let pagination = 1;
      for (let x = 0; x < data["number-of-files"]; x++) {
        const fileContainer = document.createElement("div");
        const fileName = document.createElement("p");
        const image = Object.assign(document.createElement("img"), {
          src: "https://via.placeholder.com/150",
        });
        image.setAttribute("data-hash-id", x);
        image.setAttribute("data-metamask-address", currentAccount);
        image.setAttribute("class", "renderedFile");
        fileName.innerHTML = data[x];
        if (x == filesToLoad) {
          pagination++;
          filesToLoad *= 2;
        }
        // fileContainer.setAttribute("class", "f-" + pagination);
        if (pagination > 1) {
          fileContainer.setAttribute("class", "f-" + pagination);
          fileContainer.style.display = "none";
        } else {
          fileContainer.setAttribute(
            "class",
            "d-flex flex-wrap flex-column m-5 active f-" + pagination
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
        // console.log(showFiles);
      }
      pagnation(showFiles, pagination);
      var files = document.querySelectorAll("img.renderedFile");
      for (let q = 0; q < files.length; q++) {
        files[q].addEventListener("click", getFiles);
      }
    });
}

function pagnation(files, pagination) {
  paginationElement.style.display = "block";
  // console.log(files);
  for (let i = 1; i <= pagination; i++) {
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
    const element = paginationElement.querySelectorAll("ul")[0];
    if (element.childElementCount - 2 < pagination) {
      element.insertBefore(paginationList, element.lastElementChild);
    }
    paginationList.addEventListener("click", setFilesActive);
    paginationList.files = files;
  }
}
function setFilesActive(e) {
  const files = e.currentTarget.files;
  const clickedTab = e.target;
  // console.log(files);
  const activeFiles = files.querySelectorAll(".active");
  for (var i = 0; i < activeFiles.length; i++) {
    const fileClass = activeFiles[i].classList[5];
    activeFiles[i].removeAttribute("class");
    activeFiles[i].setAttribute("class", fileClass);
    activeFiles[i].style.display = "none";
  }
  const toActivateFiles = files.querySelectorAll(".f-" + clickedTab.innerHTML);
  // console.log(toActivateFiles[0]);
  for (var x = 0; x < toActivateFiles.length; x++) {
    // toActivateFiles[i].removeAttribute("class");
    toActivateFiles[x].setAttribute(
      "class",
      "d-flex flex-wrap flex-column m-5 active f-" + clickedTab.innerHTML
    );
  }
}

function accountHandler(newAccount) {
  currentAccount = newAccount[0];
  accountAddress.innerHTML = currentAccount;
}

async function checkNetwork() {
  try {
    const chainId = await ethereum.request({
      method: "eth_chainId",
    });
    chainNetworkHandler(chainId);
  } catch (error) {
    alert(error.message);
  }
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

function getFiles() {
  const formData = new FormData();
  formData.append("hashId", this.dataset.hashId);
  formData.append("metamaskAddress", this.dataset.metamaskAddress);
  fetch("/dashboard/save-files", {method: "POST", body: formData})
    .then((response) => response.json())
    .then((data) => {
      const blob = new Blob([Buffer.from(data["file-data"], "base64")], {
        type: "octet-stream",
      });
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href,
        style: "display:none",
        download: data["file-name"],
      });
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(href);
      a.remove();
    })
    .catch((error) => {
      console.log(error);
    });
}

function test() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  fetch(
    "https://api-testnet.bscscan.com/api?module=contract&action=getabi&address=0xe121D71fA17198f6F7aD1aFf939b422fD7D26Fae&apikey=JCB3TX7R3DYBU6EQZEDN8QDWH6SFGCSY95"
  )
    .then((x) => x.json())
    .then((y) => smartContract(y));
  async function smartContract(data) {
    var smartCon = JSON.parse(data.result);
    const signer = provider.getSigner();
    var contract = new ethers.Contract(
      "0xe121D71fA17198f6F7aD1aFf939b422fD7D26Fae",
      smartCon,
      signer
    );
    //contract.getPreviousBlockHash().then((y) => sha256Salted(y));
    var previousBlockHash = await contract.getPreviousBlockHash();
    console.log(previousBlockHash);
    let saltedHash = sha256(
      "0x68656C6C6F20776F726C64" + previousBlockHash.substring(2)
    );
    console.log(saltedHash);
    // contract.getCurrentIndex(currentAccount).then((e) => setCurrentIndex(e));
    // function setCurrentIndex(index) {
    //   currentIndex = parseInt(index, 16) - 1;
    //   //console.log(typeof currentIndex);
    // }
    contract.StoreHash(saltedHash, previousBlockHash);
    // console.log(currentIndex);
    // contract
    //   .getHashStructureData(currentAccount, currentIndex.valueOf())
    //   .then((x) => console.log(x));
  }

  function sha256Salted(previousBlockHash) {
    console.log("0x68656C6C6F20776F726C64" + previousBlockHash);
  }
}

//#endregion
