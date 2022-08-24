//#region Imports
import MetaMaskOnboarding from "@metamask/onboarding";
import _ from "lodash";
import {Buffer} from "buffer";
//#endregion

//#region Global Variables
const {isMetaMaskInstalled} = MetaMaskOnboarding;
const connectButton = document.getElementById("connectButton");
const selectFile = document.getElementById("selectFile");
const uploadFormSubmit = document.getElementById("uploadFormSubmit");
const uploadFileButton = document.getElementById("uploadFileButton");
const uploadMetamaskAddressButton = document.getElementById("metamaskAddress");
const saveFile = document.getElementById("saveFile");
const saveFileMetamaskAddress = document.getElementById(
  "saveFileMetamaskAddress"
);
const showFiles = document.getElementById("showFiles");
const saveFileFormSubmit = document.getElementById("saveFileFormSubmit");
const provider = document.getElementById("connectedProvider");
const accountAddress = document.getElementById("accountAddress");
const modalButton = document.getElementById("modalButton");
const metamaskInstallButton = document.getElementById("metamask");
const networkAlertButton = document.getElementById("networkAlert");
const mathWalletInstallButton = document.getElementById("mathWallet");
const binanceWalletInstallButton = document.getElementById("binanceWallet");
const injected = window.ethereum;
let accounts;
let onboarding;
//#endregion

//#region Initialization
const initialize = async () => {
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
        accounts = await ethereum.request({method: "eth_requestAccounts"});
        accountAddress.innerHTML = accounts[0];
        providerCheckHandler();
        checkNetwork();
      } catch (error) {
        alert(error.message);
      }
    } else {
      modalButton.click();
    }
  };

  selectFile.onclick = async () => {
    uploadMetamaskAddressButton.value = accounts;
    uploadFileButton.click();
    uploadFileButton.onchange = (e) => {
      uploadFormSubmit.click();
    };
  };

  // saveFile.onclick = async () => {
  //   saveFileMetamaskAddress.value = accounts;
  //   saveFileFormSubmit.click();
  // };

  if (injected) {
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
      console.log(window.ethereum);
    } catch (error) {
      alert(error);
    }

    checkNetwork();
    ethereum.on("chainChanged", (chain) => {
      chainNetworkHandler(chain);
    });

    renderFiles();
  }
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

// $("#saveFileForm").submit(function (e) {
//   e.preventDefault();
//   const formData = new FormData();
//   formData.append("hashId", $("#hashId").val().trim());
//   formData.append(
//     "metamaskAddress",
//     $("#saveFileMetamaskAddress").val().trim()
//   );
//   fetch("/dashboard/save-files", {method: "POST", body: formData})
//     .then((response) => response.json())
//     .then((data) => {
//       const blob = new Blob([Buffer.from(data["file-data"], "base64")], {
//         type: "octet-stream",
//       });
//       const href = URL.createObjectURL(blob);
//       const a = Object.assign(document.createElement("a"), {
//         href,
//         style: "display:none",
//         download: data["file-name"],
//       });
//       document.body.appendChild(a);
//       a.click();
//       URL.revokeObjectURL(href);
//       a.remove();
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// });

function renderFiles() {
  const formData = new FormData();
  formData.append("metamaskAddress", accounts);
  fetch("/dashboard/render-files", {method: "POST", body: formData})
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      for (let x = 0; x < data["number-of-files"]; x++) {
        const image = Object.assign(document.createElement("img"), {
          src: "https://via.placeholder.com/150",
        });
        image.setAttribute("data-hash-id", x);
        image.setAttribute("data-metamask-address", accounts);
        image.setAttribute("class", "renderedFile");
        showFiles.appendChild(image);
        // console.log(showFiles);
      }
      var files = document.querySelectorAll("img.renderedFile");
      for (let q = 0; q < files.length; q++) {
        files[q].addEventListener("click", getFiles);
      }
    });
}

function accountHandler(newAccount) {
  accounts = newAccount;
  accountAddress.innerHTML = accounts;
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
  if (accounts && accounts.length > 0 && chainId !== "0x38") {
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
  if (accounts && accounts.length > 0) {
    provider.innerHTML = "Connected via " + providerName;
  }
}

function getFiles() {
  // console.log(this.dataset.hashId, this.dataset.metamaskAddress);
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

//#endregion
