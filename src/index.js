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
      if (injected.selectedAddress !== null) {
        retrieveData.classList.remove("active");
        transaction.classList.remove("active");
        showFiles.style.display = "none";
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
  while (paginationElement.hasChildNodes()) {
    paginationElement.removeChild(paginationElement.firstChild);
  }
  // const element = paginationElement.querySelectorAll("ul")[0];
  const element = createPagniationLinks();
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
    if (element.childElementCount - 2 < pagination) {
      element.insertBefore(paginationList, element.lastElementChild);
    }
    paginationList.addEventListener("click", setFilesActive);
    paginationList.files = files;
  }
  paginationArrowHandler(element);
  paginationElement.appendChild(element);
}

function paginationArrowHandler(element) {
  const previous = element.firstChild;
  const next = element.lastElementChild;
  // previous.style.pointerEvents = "none";
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
      // next.style.pointerEvents = "none";
      // next.removeEventListener("click", handleNextEventListener);
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
      // next.style.pointerEvents = "none";
      // previous.removeEventListener("click", handlePreviousEventListener);
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
  container.setAttribute("class", "pagination justfy-content-center");
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
    "https://api-testnet.bscscan.com/api?module=contract&action=getabi&address=0x8B13e5cdA78fE99000E662278C5345dCeE7e689E&apikey=JCB3TX7R3DYBU6EQZEDN8QDWH6SFGCSY95"
  )
    .then((x) => x.json())
    .then((y) => smartContract(y));
  async function smartContract(data) {
    var smartCon = JSON.parse(data.result);
    const signer = provider.getSigner();
    var contract = new ethers.Contract(
      "0x8B13e5cdA78fE99000E662278C5345dCeE7e689E",
      smartCon,
      signer
    );
    var randomPreviousBlockHash = await contract.getRandomPreviousBlockHash(Math.floor(Math.random() * 9999999));
    console.log("Previous Block Hash: " + randomPreviousBlockHash);
    let saltedHash = sha256(
      "0x68656C6C6F20776F726C64" + randomPreviousBlockHash.substring(2)
    );
    console.log("Salted Hash: " + saltedHash);
  }
  //0x5819b811F788AF2c9558eB031D87E259e7D9533A previous contract
  // 0x8B13e5cdA78fE99000E662278C5345dCeE7e689E new contract

  // function sha256Salted(previousBlockHash) {
  //   console.log("0x68656C6C6F20776F726C64" + previousBlockHash);
  // }
}

//#endregion
