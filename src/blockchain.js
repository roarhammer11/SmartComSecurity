function test() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  fetch(
    "https://api.bscscan.com/api?module=contract&action=getabi&address=0x3244B3B6030f374bAFA5F8f80Ec2F06aAf104B64&apikey=JCB3TX7R3DYBU6EQZEDN8QDWH6SFGCSY95"
  )
    .then((x) => x.json())
    .then((y) => smartContract(y));
  function smartContract(data) {
    var herofiABI = JSON.parse(data.result);
    console.log(herofiABI);
    contract = new ethers.Contract(
      "0x3244B3B6030f374bAFA5F8f80Ec2F06aAf104B64",
      herofiABI,
      provider
    );
    contract.getPreviousBlockHash();
  }
}

