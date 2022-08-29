//#region Imports
import MetaMaskOnboarding from "@metamask/onboarding";
import _ from "lodash";
import "./dashboard.js";
import {initializeDashboard} from "./dashboard.js";
//#endregion

//#region Global Variables
const connectButton = document.getElementById("connectButton");
const modalButton = document.getElementById("modalButton");
const metamaskInstallButton = document.getElementById("metamask");
const mathWalletInstallButton = document.getElementById("mathWallet");
const binanceWalletInstallButton = document.getElementById("binanceWallet");
var currentUrl = window.location.href;
let onboarding;
//#endregion

//#region Initialization
// const initialize = async () => {
//   try {
//     onboarding = new MetaMaskOnboarding();
//   } catch (error) {
//     alert(error.message);
//   }

//   metamaskInstallButton.onclick = () => {
//     if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
//       onboarding.startOnboarding();
//     }
//     window.location.reload();
//   };

//   mathWalletInstallButton.onclick = () => {
//     redirectPage(
//       "https://chrome.google.com/webstore/detail/math-wallet/afbcbjpbpfadlkmhmclhkeeodmamcflc"
//     );
//     window.location.reload();
//   };

//   binanceWalletInstallButton.onclick = () => {
//     redirectPage(
//       "https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp"
//     );
//     window.location.reload();
//   };

//   connectButton.onclick = async () => {
//     if (typeof window.ethereum !== "undefined") {
//       try {
//         accounts = await ethereum.request({method: "eth_requestAccounts"});
//         accountAddress.innerHTML = accounts[0];
//         providerCheckHandler();
//         checkNetwork();
//       } catch (error) {
//         alert(error.message);
//       }
//     } else {
//       modalButton.click();
//     }
//   };

//   selectFile.onclick = async () => {
//     uploadMetamaskAddressButton.value = accounts;
//     uploadFileButton.click();
//     uploadFileButton.onchange = (e) => {
//       uploadFormSubmit.click();
//     };
//   };

//   if (injected) {
//     ethereum.autoRefreshOnNetworkChange = false;
//     networkAlertButton.onclick = () => {
//       redirectPage("https://chainlist.org");
//     };

//     try {
//       const newAccounts = await ethereum.request({
//         method: "eth_accounts",
//       });
//       accountHandler(newAccounts);
//       providerCheckHandler();
//       console.log(window.ethereum);
//     } catch (error) {
//       alert(error);
//     }

//     checkNetwork();
//     ethereum.on("chainChanged", (chain) => {
//       chainNetworkHandler(chain);
//     });

//     renderFiles();
//   }
// };

const initializeLogin = async () => {
  //console.log(currentUrl);
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
        await ethereum.request({method: "eth_requestAccounts"});
        if (onboarding) {
          onboarding.stopOnboarding();
        }
        window.location.href = "http://127.0.0.1/dashboard";
      } catch (error) {
        alert(error.message);
      }
    } else {
      modalButton.click();
    }
  };

  function redirectPage(page) {
    window.open(page, "_blank").focus();
  }
};

// if (currentUrl == "http://127.0.0.1/") {
//   window.addEventListener("load", initializeLogin);
// }
window.addEventListener("load", initialize);
function initialize() {
  if (currentUrl == "http://127.0.0.1/dashboard") {
    initializeDashboard();
  } else if (currentUrl == "http://127.0.0.1/") {
    initializeLogin();
  }
}

//#endregion
